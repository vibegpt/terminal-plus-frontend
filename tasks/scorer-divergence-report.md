# Scorer Divergence Investigation — MCP inline scorer vs smart7Select

**Date:** 2026-07-10 (run 22:40 SGT) · **Mode:** read-only, zero source edits · **Trigger:** Phase-3 join exhibit `overlap_count = 0` for SIN-T1 × refuel ([tasks/telemetry-phase3-report.md](telemetry-phase3-report.md), "Join exhibit")

**Prerequisite gate:** `npm run build` passes; `npm run test:adversarial` 10/10 (verified before and after — nothing changed).

**Verdict up front:** the divergence is real, reproducible, and **not intentional**. It has two independent causes — a broken candidate pool (unordered `LIMIT 21`) *and* pre-Smart7-fix score math — and both must be fixed together. Recommended end state: `handleGetRecommendations` calls a shared ranking function in `api/lib/`; estimated mcp.ts diff ≈ **+14 / −40 lines**.

---

## Step 1 — Every ranking path in the codebase

| # | Surface | Entry point | Scoring function | Primary sort key | Secondary keys | Filters applied |
|---|---------|-------------|------------------|------------------|----------------|-----------------|
| 1 | **MCP `get_recommendations`** | `api/mcp.ts:154` `handleGetRecommendations` | Inline `_score` (`api/mcp.ts:175-186`) | `_score` DESC (base 50 + bonuses) | none — ties keep arbitrary DB order | vibe ilike; terminal `eq` only if `time<30`; Jewel excluded if `time<120` or `exclude_jewel`; **pool = unordered `LIMIT 21`** (`api/mcp.ts:169`) |
| 2 | **MCP `get_route` dynamic fallback** | `api/mcp.ts:329-403` | DB `ORDER BY editorial_score DESC` (`api/mcp.ts:340`) | editorial_score DESC | none (greedy time-fit walk) | terminals `in`, `editorial_note not null`, vibe ilike, limit 20 |
| 3 | **Chat agent** | `api/chat.ts:281` local `queryAmenities` | DB `ORDER BY editorial_score DESC` (`api/chat.ts:286`) + `applySmart7` feasibility filter (`api/chat.ts:165-183`) + Claude picks 3–5 | editorial_score DESC (pool order); final order is Claude's relevance | walk/dwell feasibility is a hard filter, not a score | terminal eq, transit eq, keyword `or`-ilike, limit 40 |
| 4 | **Shared agent lib** | `api/lib/agent.ts:106` `queryAmenities` | DB `ORDER BY editorial_score DESC` + stable terminal-first partition (`api/lib/agent.ts:127-133`) | terminal-match block first, editorial DESC within blocks | slice 21 | vibe ilike. **Production-orphaned**: only `tests/adversarial/adversarial.test.ts:11` imports it — chat.ts uses its own copy, mcp.ts imports only `queryRouteMatch` |
| 5 | **`queryRouteMatch()`** | `api/lib/agent.ts:142-233` (shared by chat + MCP) | Not a scorer: template picked by closest min/max midpoint (`agent.ts:162-166`); stops ordered by curated `stop_order` (`agent.ts:173`) | `stop_order` ASC | optional-stop stripping under time pressure | is_active, time-window, terminal `or` |
| 6 | **UI vibe feed** | `src/pages/VibePage.tsx:61-93` | `smart7Select` (`src/utils/smart7Select.ts:46-75`) when "all terminals"; inline comparator (`VibePage.tsx:84-92`) when filtered | editorial_score DESC | open-now → terminal priority → name | vibe ilike, editorial DESC + name in query, limit 50; **name-dedup keeping best terminal** (`smart7Select.ts:53-60`) |
| 7 | **UI collection detail** | `src/pages/CollectionDetailPage.tsx:124,143` | `selectScoredAmenities` (`src/utils/contextualScoring.ts:325-358`) | editorial_score DESC | open-now → contextScore (time-of-day/body-clock/proximity) | name-dedup; Jewel hard-filtered when <75 min available (`contextualScoring.ts:212`) |
| 8 | **UI search** | `src/pages/SearchPage.tsx:58-59` | DB order only | editorial_score DESC | — | keyword filters |
| 9 | **Dead legacy chain** (never routed) | `src/components/CollectionDetailSmart7.tsx` → `src/hooks/useSmart7Selection.tsx`, `src/hooks/useSmart7Collections.tsx`, `src/lib/smart7Algorithm.ts`, `src/hooks/useCollectionSmart7.tsx` | priority/featured scoring | — | — | No page imports any of these (grep: zero importers outside the chain itself) |

Post-899654e, paths 2–8 all agree on **editorial_score DESC as the primary key**. Path 1 — the MCP inline scorer — is the only live surface that doesn't.

## Step 2 — Anatomy of the two divergent scorers

### Timeline (git evidence)

| Date | Commit | Event |
|------|--------|-------|
| 2026-02-21 | `33b5328` | Smart7 / vibe feed lands |
| 2026-03-25 | `64939ee` | MCP server written, inline scorer has **zero editorial signal** |
| 2026-04-03 | `d183dbe` | `get_route` aligned to shared lib; small editorial *bonus* (+10/+5) bolted onto the inline scorer |
| 2026-07-05 | `899654e` | "editorial_score DESC primary" fix applied to VibePage, CollectionDetailPage, SearchPage, smart7Select, selectScoredAmenities — **mcp.ts inline scorer untouched** |

So yes: the mcp scorer is pre-Smart7-migration legacy in spirit — written when only terminal affinity mattered, then skipped by every subsequent ranking fix. The adversarial suite's parity guard (test 8, `tests/adversarial/adversarial.test.ts:129`) covers `api/lib/agent.ts queryAmenities` + `smart7Select` but **not** the mcp handler — which is exactly the hole it slipped through.

### Signals side by side

| Signal | MCP inline (`api/mcp.ts:175-186`) | smart7Select (`src/utils/smart7Select.ts:62-73`) |
|--------|-----------------------------------|--------------------------------------------------|
| editorial_score | small bonus: +10 if ≥12, +5 if ≥10 (caps at 10 pts) | **primary key**, full-resolution DESC |
| terminal match | **dominant**: +30 same terminal, +10 other non-Jewel | tiebreaker #3 (10 vs static 1–5 priority) |
| Jewel | −10 unless >240 min boarding (+20 then) | no penalty (Jewel priority 2 in tiebreak) |
| vibe match | +20 (redundant — the query already vibe-filtered, so ~all rows get it) | n/a (pool already vibe-filtered) |
| available_in_tr | +5 | not used |
| open-now (hours) | not used | tiebreaker #2 |
| name-dedup | **none** — cross-terminal duplicates all ranked | dedup by name, keep best-terminal instance |
| tie-break | none — arbitrary DB row order | name A→Z (deterministic) |

Net effect of the math alone: for a T1 user, any T1 amenity (80 pts floor) outranks every editorial-14 amenity elsewhere (≤85 but Jewel 65–75) — the exact inversion 899654e removed from the UI.

### Candidate pools (the bigger half of the problem)

- **MCP**: `.ilike(vibe).limit(21)` with **no ORDER BY** (`api/mcp.ts:156-169`) → Postgres returns an *arbitrary* 21 of N matching rows. The pool itself silently drops top-editorial amenities before scoring even starts.
- **UI**: `.ilike(vibe).order(editorial_score DESC).order(name).limit(50)` (`VibePage.tsx:61-69`) → deterministic, editorial-best-first pool, then name-dedup.

## Step 3 — Empirical comparison (live data, same inputs)

Script: `scorer-compare.ts` (scratchpad; replicates each path's query + scoring verbatim, imports the real `smart7Select`; read-only). Full output saved as `scorer-compare-output.txt` in the session scratchpad. Run 2026-07-10 22:40 SGT.

| Pair | DB rows matching vibe | MCP pool | UI pool | Pool ∩ | Top-3 overlap | Top-7 overlap | Spearman ρ (shared slugs) | Same-pool top-3 / ρ |
|------|----------------------|----------|---------|--------|---------------|---------------|--------------------------|---------------------|
| refuel × SIN-T1 | 44 | 21 (arbitrary) | 44 | 21 | **0/3** | **0/7** | 0.292 (n=14) | 1/3 · 0.292 |
| chill × SIN-T3 | 39 | 21 (arbitrary) | 39 | 21 | 1/3 | 3/7 | 0.314 (n=6) | 1/3 · 0.314 |
| shop × SIN-JEWEL | **178** | 21 (arbitrary) | 50 (truncated) | **6** | 1/3 | 4/7 | 0.371 (n=6) | 2/3 · 0.371 |

The refuel run reproduces the Phase-3 exhibit slug-for-slug: MCP top-3 = `starbucks-sint1, coffee-bean-tea-leaf-sint1, sin-t1-crystal-jade-…`, while the UI's entire top-7 (all editorial-14: `sin-t1-kopitiam-…`, `sin-t2-food-court-…`, `fossa-chocolate-jewel`, `grain-traders-jewel`, `kele-jewel`, `wang-cafe-jewel`, `twg-tea-t4-new`) is **absent from the MCP candidate pool entirely** — the unordered `LIMIT 21` never fetched them.

### Pool vs ordering diagnosis: **BOTH, roughly equal weight**

1. **Pool divergence** — For refuel, all 7 of the UI's top-7 fail to survive the MCP's unordered 21-row truncation. For shop (178 matching rows), only **6 of the MCP's 21 candidates** even appear in the UI's top-50; the agent is ranking a near-disjoint set. The pool bug alone guarantees near-zero overlap on any vibe with >21 rows (all of them).
2. **Ordering divergence** — Even restricted to the *identical* intersection pool, top-3 overlap is only 1/3–2/3 and rank correlation ~0.3, because terminal-affinity (+30) dominates editorial (≤+10) in the MCP math.
3. Pool determinism note: two consecutive runs returned identical 21 rows *this time*, but with no `ORDER BY` Postgres makes no guarantee — the agent surface can silently reshuffle after any vacuum/plan change.

So a fix that only re-weights the inline scorer would **not** restore parity; the query must also order by editorial_score before limiting. A shared function fixes both at once.

## Step 4 — Recommendation

**1. Is any divergence intentionally agent-appropriate?** Partially — but only the *filters*, not the ranking. Defensible agent-specific behavior: hard terminal filter under `time_until_boarding < 30`, Jewel exclusion under `< 120` / `exclude_jewel`, and `available_in_tr` relevance for transit passengers. These are explicit-argument-driven **candidate filters** and should stay. The *scoring math* divergence (terminal +30 dominating editorial, Jewel −10, no dedup, unordered pool) is not a design decision anyone made for agents — git history shows it's a 2026-03-25 scorer that predates and then missed the 899654e editorial-primary migration. The Phase-3 zero overlap is a defect, not a persona difference. One genuinely debatable signal: smart7Select's open-now tiebreak uses device-local time; server-side it would need explicit `Asia/Singapore` handling (the fix task should pin the timezone rather than drop the signal).

**2. Recommended end state.** New shared module `api/lib/ranking.ts` (~70–90 lines, new file — not under protection) exposing e.g. `rankAmenities(supabase, { vibe, terminal, timeUntilBoardingMinutes, excludeJewel, limit })` that:
- queries `amenity_detail` with `ORDER BY editorial_score DESC` **before** any limit (pool cap 50, mirroring VibePage),
- applies the agent filters above as filters,
- name-dedups and sorts with the canonical comparator (editorial DESC → open-now(SGT) → terminal-match/priority → name), identical to `smart7Select.ts:62-73`.

`handleGetRecommendations` then becomes fetch + response mapping. **Estimated mcp.ts diff for the scoped exception: ~14 insertions / ~40 deletions** (delete query-build + scorer at `api/mcp.ts:156-186`; add one import and one call; response mapping at `:188-198` unchanged). Same process as the telemetry exception (that one was 11/39 — this is the same shape). Optional follow-up, not required for parity: point `smart7Select` at the same comparator to make it single-source; and `api/lib/agent.ts queryAmenities` is production-orphaned (test-only) — candidate for deletion or for becoming the home of the shared function when its protection lifts.

**3. Parity acceptance test (ready-made gate for the fix task).** Add to the adversarial suite (or `tests/parity.test.ts`):
- For each of ≥3 pairs — (refuel, SIN-T1), (chill, SIN-T3), (shop, SIN-JEWEL) — with no time constraint: MCP `handleGetRecommendations({vibe, terminal, limit: 7})` result slugs must be **order-identical** to `smart7Select(VibePage-pool, terminal, 7)` slugs (freeze `Date` or drop the open-now tiebreak in-test to avoid midnight flake).
- Regression guard on the pool: assert the handler's ranked output editorial_scores are non-increasing *and* include the global max editorial_score for that vibe (catches any future unordered-LIMIT reintroduction).
- Keep existing test 8 as-is; it guards the other layers.

**4. `queryRouteMatch()` is already consistent.** It's shared verbatim by chat and MCP (`api/chat.ts:6`, `api/mcp.ts:5`), does no amenity scoring (curated `stop_order` + midpoint template selection + optional-strip), and the MCP dynamic fallback already orders `editorial_score DESC` since `d183dbe`. Only wrinkle: the MCP flight-number branch (`api/mcp.ts:263-305`) hand-copies the optional-strip logic instead of reusing it — duplication risk, not a divergence today.

## Verification

- [x] `npm run build` passes (pre-check, nothing changed since)
- [x] `npm run test:adversarial` 10/10 (pre- and post-check)
- [x] `git status`: zero new modifications — only this report added; pre-existing dirt (`api/lib/agentPrompt.ts`, task docs) untouched
- [x] All claims carry file:line refs or script output (empirical table from `scorer-compare-output.txt`)

**STOP — no fix applied.** The fix is a separate approved task with the scoped mcp.ts exception above.
