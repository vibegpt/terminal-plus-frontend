# T2 Garden Run Route Test Results — 2026-04-02

**Template:** The T2 Garden Run (SIN-T2→SIN-T2, 75-150 min)
**Supabase project:** bpbyhdjdezynyiclqezy
**API endpoint:** `https://terminal-plus-frontend-3mpmx1149-todds-projects-d0181971.vercel.app/api/chat`

---

## Data Inserted

**Template:** The T2 Garden Run
- `route_id`: t2-garden-run
- `arrival_terminal` / `departure_terminal`: SIN-T2
- `min_minutes`: 75, `max_minutes`: 150
- `time_of_day`: flexible
- `flight_patterns`: SQ, TR, JQ
- `is_active`: true

**Stops (5):**

| # | Name | Slug | Type | Duration | Optional |
|---|------|------|------|----------|----------|
| 1 | Sunflower Garden | sunflower-garden-t2-new | attraction | 10 min | No |
| 2 | T2 Food Gallery | sin-t2-food-court-1757008220.066062 | food | 20 min | No |
| 3 | Entertainment Deck | entertainment-deck-t2-new | attraction | 10 min | Yes |
| 4 | Kenangan Coffee | kenangan-coffee-sint2 | food | 10 min | Yes |
| 5 | dnata Lounge T2 | dnata-lounge-t2-new | lounge | 20 min | Yes |

**Note:** Orchid Garden was not in the amenity_detail database. Entertainment Deck substituted as stop 3 (free gaming zone, similar "break" function in the route flow).

---

## Test 4a: T2, 60 min (below template minimum)

**Status:** CORRECT FALLBACK

**Response summary:** No route template matched (60 < 75 min minimum). Agent used dynamic amenity recommendations: Entertainment Deck, Paradise Dynasty, Sunflower Garden. T2-only amenities. Editorial voice present.

**Evaluation:** This is correct behaviour — 60 min falls below the template's 75 min floor, so the agent should NOT use the curated route. Dynamic fallback works as expected.

---

## Test 4b: T2, 90 min (within template range)

**Status:** PASS

**Response summary:** Agent matched "The T2 Garden Run" template and narrated all 5 stops as a numbered walking sequence:
1. **Sunflower Garden** — 10 min, "sunflowers framing the runway are genuinely calming"
2. **T2 Food Gallery** — 20 min, "proper hawker classics like laksa or chicken rice"
3. **Entertainment Deck** — 10 min, "free Xbox and PlayStation"
4. **Kenangan Coffee** — 10 min, "es kopi susu is the order"
5. **dnata Lounge** — 20 min, "shower and hot nasi lemak"
6. Gate buffer: "Keep 15 minutes as your gate buffer and you're golden"

**Criteria evaluation:**
- Numbered route sequence: PASS — all 5 stops presented in order with timing
- Mentions Sunflower Garden: PASS — first stop with runway view detail
- Mentions T2 Food Gallery / hawker food: PASS — second stop with laksa + chicken rice
- Editorial personality: PASS — specific dish names (es kopi susu, nasi lemak), opinions ("genuinely calming"), concierge voice
- Gate buffer reminder: PASS — explicit 15-min buffer at end
- All stops T2: PASS — all 5 stops are SIN-T2

**Issues:** None

---

## Summary

All terminals now have curated route templates:

| Terminal | Template | Time Range | Status |
|----------|----------|------------|--------|
| SIN-T1 | The Reverse Kangaroo | 90-180 min | Working |
| SIN-T1 | The Kangaroo Quick Stop | 45-75 min | Working |
| SIN-T2 | The T2 Garden Run | 75-150 min | **NEW — Working** |
| SIN-T3 | The SQ Connector | 100-180 min | Working |
| SIN-T3→T1 | The Terminal Hop | 120-240 min | Working |
| SIN-T4 | The T4 Island | 90-180 min | Working |

**Intermittent 500 errors:** The 10-second Claude API timeout in `api/chat.ts` (line 426) occasionally causes failures on cold starts or when the route context makes the payload larger. This is a pre-existing issue — not related to route template data. Consider increasing to 15s.
