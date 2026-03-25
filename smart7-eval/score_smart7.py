#!/usr/bin/env python3
"""
Smart7 Recommendation Quality Scorer
Runs entirely locally — zero API cost.

Usage:
  python score_smart7.py --weights weights.json --scenarios eval_scenarios.json --amenities amenities_db.json
  python score_smart7.py --weights weights.json --scenarios eval_scenarios.json --amenities amenities_db.json --verbose
"""

import json
import argparse
import sys
from datetime import datetime
from collections import Counter


def load_json(path):
    with open(path) as f:
        return json.load(f)


def is_adjacent(terminal_a, terminal_b, adjacency_map):
    """Check if two terminals are adjacent per the adjacency map."""
    if terminal_a == terminal_b:
        return True
    adjacent = adjacency_map.get(terminal_a, [])
    return terminal_b in adjacent


def get_time_period(time_of_day):
    """Map time_of_day string to hour range for opening_hours check."""
    periods = {
        "early_morning": (4, 7),
        "morning": (7, 12),
        "afternoon": (12, 18),
        "evening": (18, 22),
        "night": (22, 4),
    }
    return periods.get(time_of_day, (8, 20))


def score_amenity(amenity, context, weights):
    """Score a single amenity against a user context using the weight config."""
    sw = weights["selectionWeights"]
    sf = weights["scoringFactors"]
    bt = weights["boardingTimeMultipliers"]
    tt = weights["timingThresholds"]
    tp = weights.get("terminalProximity", {})

    score = 0.0

    # --- Vibe matching ---
    vibe_tags = amenity.get("vibe_tags", "")
    if isinstance(vibe_tags, str):
        vibe_list = [v.strip().lower() for v in vibe_tags.split(",") if v.strip()]
    elif isinstance(vibe_tags, list):
        vibe_list = [v.strip().lower() for v in vibe_tags]
    else:
        vibe_list = []

    selected_vibe = context.get("selectedVibe", "").lower()
    if selected_vibe != "any" and selected_vibe in vibe_list:
        score += sf["vibeMatch"] * sw["preference"]

    # --- Price matching ---
    price_pref = context.get("pricePreference", "any")
    amenity_price = amenity.get("price_level", "$$")
    if price_pref != "any" and amenity_price == price_pref:
        score += sf["priceMatch"] * sw["preference"]

    # --- Opening hours bonus ---
    if amenity.get("opening_hours"):
        score += sf["openingHoursPresent"]

    # --- Terminal proximity ---
    amenity_terminal = amenity.get("terminal_code", "")
    user_terminal = context.get("userTerminal", "")
    departure_terminal = context.get("departureTerminal", user_terminal)
    adjacency_map = tp.get("adjacencyMap", weights.get("terminalProximity", {}).get("adjacencyMap", {}))

    # Same as user terminal
    if amenity_terminal == user_terminal:
        score += sf["sameTerminal"] * sw["proximity"]
    elif is_adjacent(amenity_terminal, user_terminal, adjacency_map):
        score += sf["adjacentTerminal"] * sw["proximity"]

    # Departure terminal proximity bonus (increases as boarding approaches)
    minutes = context.get("minutesToBoarding", 9999)
    if departure_terminal != user_terminal and amenity_terminal == departure_terminal:
        # Shift factor: 0.0 at comfortable, 1.0 at urgent
        if minutes <= tt["urgentDepartureMins"]:
            shift = 1.0
        elif minutes <= tt["approachingDepartureMins"]:
            shift = 0.6
        elif minutes <= tt["comfortableDepartureMins"]:
            shift = 0.3
        else:
            shift = 0.0
        score += sf["sameTerminal"] * sw["proximity"] * shift

    # --- Flagship bonus ---
    if amenity.get("flagship", False):
        score += sf.get("flagshipBonus", 0)

    # --- Boarding time multiplier ---
    if minutes <= tt["urgentDepartureMins"]:
        is_quick = "quick" in vibe_list
        time_mult = bt["comfortable"] if is_quick else bt["urgent"]
    elif minutes <= tt["approachingDepartureMins"]:
        time_mult = bt["approaching"]
    else:
        time_mult = bt["comfortable"]

    # --- Jewel penalty for short layovers ---
    if amenity_terminal == "SIN-JEWEL" and minutes < tt.get("longLayoverMinutes", 120):
        time_mult *= 0.3  # Heavy penalty: Jewel requires immigration

    score = score * time_mult * sw["timeRelevance"] + score * (1 - sw["timeRelevance"])

    return score


def _get_category(amenity):
    """Extract primary category from amenity vibe_tags."""
    vibe_tags = amenity.get("vibe_tags", "")
    if isinstance(vibe_tags, str):
        return vibe_tags.split(",")[0].strip() if vibe_tags else "unknown"
    elif isinstance(vibe_tags, list):
        return vibe_tags[0] if vibe_tags else "unknown"
    return "unknown"


def apply_diversity_rules(scored_amenities, weights, context):
    """Greedy diversity enforcement: pick best non-violating item at each step.

    Unlike the old accepted+deferred approach, this ensures ALL selected items
    respect diversity caps. Items that would violate any cap are skipped entirely
    until we've exhausted the pool, then we fall back to score-ordered fill.
    """
    dr = weights["diversityRules"]
    max_price = dr["maxSamePriceLevel"]
    max_category = dr["maxSameCategory"]
    select_count = weights.get("selectionCount", 7)

    minutes = context.get("minutesToBoarding", 9999)
    tt = weights.get("timingThresholds", {})

    max_brand = 1  # Default: max 1 per brand family

    # Urgency-based diversity override:
    # When boarding is urgent, relax terminal diversity to keep items close
    # For very urgent (gate-area only), also relax price/category/brand
    very_urgent_mins = tt.get("urgentDepartureMins", 45) // 2  # ~22min
    if minutes <= very_urgent_mins:
        max_terminal = select_count
        max_price = select_count
        max_category = select_count
        max_brand = select_count  # No brand limit when rushing to gate
    elif minutes <= tt.get("urgentDepartureMins", 45):
        max_terminal = select_count
    elif minutes <= tt.get("approachingDepartureMins", 90):
        max_terminal = max(dr["maxSameTerminal"], 5)
    else:
        max_terminal = dr["maxSameTerminal"]
    if minutes >= dr.get("longLayoverMinutes", 120):
        max_jewel = dr.get("maxJewelItemsLongLayover", 3)
    else:
        max_jewel = dr.get("maxJewelItems", 1)

    tc = Counter()
    pc = Counter()
    cc = Counter()
    jc = 0
    bc = Counter()

    selected = []
    remaining = []

    for item in scored_amenities:
        if len(selected) >= select_count:
            remaining.append(item)
            continue

        amenity = item["amenity"]
        t = amenity.get("terminal_code", "unknown")
        p = amenity.get("price_level", "unknown")
        c = _get_category(amenity)
        brand = amenity.get("brand_family", "").lower().strip()
        is_jewel = t == "SIN-JEWEL"

        terminal_ok = tc[t] < max_terminal
        price_ok = pc[p] < max_price
        category_ok = cc[c] < max_category
        jewel_ok = not is_jewel or jc < max_jewel
        brand_ok = not brand or bc[brand] < max_brand

        if terminal_ok and price_ok and category_ok and jewel_ok and brand_ok:
            tc[t] += 1
            pc[p] += 1
            cc[c] += 1
            if is_jewel:
                jc += 1
            if brand:
                bc[brand] += 1
            selected.append(item)
        else:
            remaining.append(item)

    # If we couldn't fill all slots with strict enforcement, fill from remaining
    return selected + remaining


def select_smart7(amenities, context, weights):
    """Run the full Smart7 selection pipeline."""
    pool_size = weights.get("candidatePoolSize", 21)
    select_count = weights.get("selectionCount", 7)

    # Score all amenities
    scored = []
    for amenity in amenities:
        s = score_amenity(amenity, context, weights)
        scored.append({"amenity": amenity, "score": s})

    # Sort by score descending
    scored.sort(key=lambda x: x["score"], reverse=True)

    # Take candidate pool
    pool = scored[:pool_size]

    # Apply diversity rules
    diversified = apply_diversity_rules(pool, weights, context)

    # Select top N
    selected = diversified[:select_count]

    # Flagship guarantee: if no flagship in selection and pool has flagships,
    # swap the lowest-scoring non-flagship with the best available flagship
    minutes = context.get("minutesToBoarding", 9999)
    tt = weights.get("timingThresholds", {})
    if minutes > tt.get("urgentDepartureMins", 45):
        has_flagship = any(item["amenity"].get("flagship", False) for item in selected)
        if not has_flagship:
            # Find best flagship in remaining pool
            remaining = diversified[select_count:]
            best_flagship = None
            for item in remaining:
                if item["amenity"].get("flagship", False):
                    best_flagship = item
                    break
            if best_flagship:
                # Replace lowest-scoring non-flagship
                selected[-1] = best_flagship

    return [item["amenity"] for item in selected], [item["score"] for item in selected]


def evaluate_scenario(scenario, amenities, weights, verbose=False):
    """Evaluate a single scenario against expected outcomes. Returns 0.0-1.0 score."""
    context = scenario["context"]
    expected = scenario["expected"]

    # Filter amenities to SIN only
    sin_amenities = [a for a in amenities if a.get("airport_code", "") == "SIN"]

    selected, scores = select_smart7(sin_amenities, context, weights)

    checks_passed = 0
    checks_total = 0
    details = []

    # --- Check: got 7 results ---
    checks_total += 1
    if len(selected) >= 7:
        checks_passed += 1
        details.append("PASS: Got 7+ results")
    else:
        details.append(f"FAIL: Only got {len(selected)} results (need 7)")

    # --- Check: Jewel cap ---
    jewel_count = sum(1 for a in selected if a.get("terminal_code") == "SIN-JEWEL")
    max_jewel = expected.get("maxFromJewel")
    if max_jewel is not None:
        checks_total += 1
        if jewel_count <= max_jewel:
            checks_passed += 1
            details.append(f"PASS: Jewel items {jewel_count} <= {max_jewel}")
        else:
            details.append(f"FAIL: Jewel items {jewel_count} > {max_jewel}")

    # --- Check: min same terminal ---
    user_t = context.get("userTerminal", "")
    same_t_count = sum(1 for a in selected if a.get("terminal_code") == user_t)
    min_same = expected.get("minSameTerminal")
    if min_same is not None:
        checks_total += 1
        if same_t_count >= min_same:
            checks_passed += 1
            details.append(f"PASS: Same terminal {same_t_count} >= {min_same}")
        else:
            details.append(f"FAIL: Same terminal {same_t_count} < {min_same}")

    # --- Check: min from departure terminal ---
    dep_t = context.get("departureTerminal", user_t)
    dep_t_count = sum(1 for a in selected if a.get("terminal_code") == dep_t)
    min_dep = expected.get("minFromDepartureTerminal")
    if min_dep is not None:
        checks_total += 1
        if dep_t_count >= min_dep:
            checks_passed += 1
            details.append(f"PASS: Departure terminal items {dep_t_count} >= {min_dep}")
        else:
            details.append(f"FAIL: Departure terminal items {dep_t_count} < {min_dep}")

    # --- Check: max same price level ---
    price_counter = Counter(a.get("price_level", "unknown") for a in selected)
    max_price = expected.get("maxSamePriceLevel")
    if max_price is not None:
        checks_total += 1
        worst_price = max(price_counter.values()) if price_counter else 0
        if worst_price <= max_price:
            checks_passed += 1
            details.append(f"PASS: Max same price {worst_price} <= {max_price}")
        else:
            details.append(f"FAIL: Max same price {worst_price} > {max_price}")

    # --- Check: max same category ---
    max_cat = expected.get("maxSameCategory")
    if max_cat is not None:
        checks_total += 1
        cat_counter = Counter()
        for a in selected:
            vt = a.get("vibe_tags", "")
            if isinstance(vt, str):
                cat = vt.split(",")[0].strip() if vt else "unknown"
            elif isinstance(vt, list):
                cat = vt[0] if vt else "unknown"
            else:
                cat = "unknown"
            cat_counter[cat] += 1
        worst_cat = max(cat_counter.values()) if cat_counter else 0
        if worst_cat <= max_cat:
            checks_passed += 1
            details.append(f"PASS: Max same category {worst_cat} <= {max_cat}")
        else:
            details.append(f"FAIL: Max same category {worst_cat} > {max_cat}")

    # --- Check: max same brand family ---
    max_brand = expected.get("maxSameBrandFamily")
    if max_brand is not None:
        checks_total += 1
        brand_counter = Counter()
        for a in selected:
            bf = a.get("brand_family", "").lower().strip()
            if bf:
                brand_counter[bf] += 1
        worst_brand = max(brand_counter.values()) if brand_counter else 0
        if worst_brand <= max_brand:
            checks_passed += 1
            details.append(f"PASS: Max same brand {worst_brand} <= {max_brand}")
        else:
            details.append(f"FAIL: Max same brand {worst_brand} > {max_brand}")

    # --- Check: flagship present ---
    min_flagship = expected.get("minFlagshipItems")
    if min_flagship is not None:
        checks_total += 1
        flagship_count = sum(1 for a in selected if a.get("flagship", False))
        if flagship_count >= min_flagship:
            checks_passed += 1
            details.append(f"PASS: Flagships {flagship_count} >= {min_flagship}")
        else:
            details.append(f"FAIL: Flagships {flagship_count} < {min_flagship}")

    # --- Check: should include flagship ---
    if expected.get("shouldIncludeFlagship"):
        checks_total += 1
        flagship_count = sum(1 for a in selected if a.get("flagship", False))
        if flagship_count >= 1:
            checks_passed += 1
            details.append(f"PASS: Has flagship ({flagship_count})")
        else:
            details.append("FAIL: No flagship items in selection")

    # Calculate scenario RQS
    rqs = checks_passed / checks_total if checks_total > 0 else 0.0

    if verbose:
        print(f"\n{'='*60}")
        print(f"Scenario: {scenario['id']}")
        print(f"  {scenario['description']}")
        print(f"  Context: T={context['userTerminal']} → {context.get('departureTerminal', '?')}, "
              f"{context['minutesToBoarding']}min, {context['selectedVibe']}")
        print(f"  Selected: {[a.get('name', '?')[:25] for a in selected[:7]]}")
        terminals = [a.get("terminal_code", "?") for a in selected[:7]]
        print(f"  Terminals: {terminals}")
        for d in details:
            print(f"    {d}")
        print(f"  RQS: {rqs:.2f} ({checks_passed}/{checks_total})")

    return rqs, details, {a.get("name", "?"): a.get("terminal_code", "?") for a in selected[:7]}


def main():
    parser = argparse.ArgumentParser(description="Smart7 Recommendation Quality Scorer")
    parser.add_argument("--weights", required=True, help="Path to weights.json")
    parser.add_argument("--scenarios", required=True, help="Path to eval_scenarios.json")
    parser.add_argument("--amenities", required=True, help="Path to amenities_db.json")
    parser.add_argument("--verbose", action="store_true", help="Show per-scenario details")
    parser.add_argument("--output-json", help="Write results to JSON file")
    args = parser.parse_args()

    weights = load_json(args.weights)
    scenarios = load_json(args.scenarios)
    amenities = load_json(args.amenities)

    print(f"Loaded {len(amenities)} amenities, {len(scenarios)} scenarios")
    print(f"Selection weights: {weights['selectionWeights']}")
    print(f"Scoring factors: {weights['scoringFactors']}")
    print()

    scenario_scores = {}
    total_rqs = 0.0

    for scenario in scenarios:
        rqs, details, picks = evaluate_scenario(scenario, amenities, weights, verbose=args.verbose)
        scenario_scores[scenario["id"]] = {
            "rqs": rqs,
            "details": details,
            "picks": picks
        }
        total_rqs += rqs

    avg_rqs = total_rqs / len(scenarios) if scenarios else 0.0

    print(f"\n{'='*60}")
    print(f"OVERALL RQS: {avg_rqs:.4f}")
    print(f"{'='*60}")

    # Per-scenario summary
    print(f"\n{'Scenario':<40} {'RQS':>6}")
    print("-" * 48)
    for sid, data in sorted(scenario_scores.items(), key=lambda x: x[1]["rqs"]):
        print(f"{sid:<40} {data['rqs']:>6.2f}")

    # Worst scenarios
    worst = sorted(scenario_scores.items(), key=lambda x: x[1]["rqs"])[:3]
    print(f"\nWorst 3 scenarios:")
    for sid, data in worst:
        print(f"  {sid}: {data['rqs']:.2f}")
        for d in data["details"]:
            if d.startswith("FAIL"):
                print(f"    {d}")

    if args.output_json:
        result = {
            "timestamp": datetime.now().isoformat(),
            "overall_rqs": avg_rqs,
            "weights": weights,
            "scenario_scores": {k: v["rqs"] for k, v in scenario_scores.items()},
        }
        with open(args.output_json, "w") as f:
            json.dump(result, f, indent=2)
        print(f"\nResults written to {args.output_json}")

    return avg_rqs


if __name__ == "__main__":
    rqs = main()
    sys.exit(0 if rqs >= 0.5 else 1)
