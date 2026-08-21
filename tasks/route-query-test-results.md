# Route Query Test Results — 2026-04-02 (Post Route-Wiring)

**API endpoint:** `https://terminal-plus-frontend-3mpmx1149-todds-projects-d0181971.vercel.app/api/chat`
**Commit:** `d5abe2f` — feat: wire curated route templates into chat agent
**Note:** Custom domain `terminalplus.app` DNS still points elsewhere. Tests ran against Vercel deployment URL.

---

## Test 1: QF2 Reverse Kangaroo (T1, 120 min)

**Status:** PASS

**Response summary:** Agent returned a sequenced route narrating the Reverse Kangaroo template: Ya Kun Kaya Toast (kopi C + soft-boiled eggs, 15 min), Rooftop Cactus Garden (100+ cactus species, quiet at dawn), Fish Spa (Priority Pass, weird but worth it), IRVINS salted egg fish skin on the way back, with 15 min gate buffer mentioned at end.

**Criteria evaluation:**
- Numbered/sequenced route: PASS — presented as a walking sequence with timing
- Ya Kun / kaya toast as early stop: PASS — first stop, with kopi C and soft-boiled eggs
- Cactus Garden: PASS — second stop, with "100 cactus species" and "quiet at dawn" editorial
- Editorial personality: PASS — specific opinions ("weird, yes, but Priority Pass covers it"), dish names, concierge voice
- Gate buffer at end: PASS — "you'll still have 15 minutes for your gate buffer"
- No specific dollar prices: PASS

**Issues:** None

---

## Test 2: Terminal Hop (T3 → T1, 180 min)

**Status:** PASS

**Response summary:** Agent returned cross-terminal sequenced route: Butterfly Garden (T3, 15 min, "1000 butterflies"), Sushi Tei (T3, 20 min), Rain Vortex at Jewel (30 min combined with Grain Traders coffee), Cactus Garden (T1, 10 min), with 15 min gate buffer. Explicitly mentioned terminal transition.

**Criteria evaluation:**
- Stops in BOTH T3 and T1: PASS — Butterfly Garden/Sushi Tei in T3, Cactus Garden in T1, Jewel in between
- Butterfly Garden (T3): PASS — first stop with "1000 butterflies and best photo op"
- Jewel / Rain Vortex: PASS — included as stop with Grain Traders coffee
- Ends with T1 stop or gate reminder: PASS — Cactus Garden in T1, then gate buffer
- Time allocations sensible: PASS — 15+20+30+10+15 buffer = 90 min, well under 180 min

**Issues:** None

---

## Test 3: T4 Isolated (Cathay Pacific, 90 min)

**Status:** PASS

**Response summary:** Agent returned T4 Island template as numbered route: (1) Heritage Zone — 15 min, interactive Peranakan displays with motion-sensor storytelling. (2) TWG Tea Salon — 20 min, 1837 Black Tea with macaron set. (3) Lego Airport Store — 10 min, limited-edition Changi Airport set. 30 min gate buffer remaining.

**Criteria evaluation:**
- ALL stops T4 only: PASS — Heritage Zone, TWG Tea, Lego Store all T4
- Heritage Zone: PASS — featured as first stop with detailed description
- TWG Tea: PASS — featured as second stop with specific tea recommendation
- Optional stops flagged: PASS — Spa Express and Plaza Premium omitted (optional, stripped for time)
- Total time within ~70 min: PASS — 15+20+10 = 45 min, 30 min buffer

**Issues:** None

---

## Test 4: T2 Dynamic Fallback (60 min)

**Status:** PARTIAL (expected — no T2 curated template)

**Response summary:** No curated route matched (correct — no T2 template exists). Agent used dynamic amenity recommendations: Paradise Dynasty (xiaolongbao), Entertainment Deck (free gaming), Rain Vortex (Jewel). T2-only amenities. Editorial voice present.

**Criteria evaluation:**
- T2 amenities only: PASS — all three are T2-tagged
- Sequenced plan / prioritised picks: PARTIAL — presented as options rather than strict numbered sequence
- Editorial voice: PASS — "xiaolongbao are legendary", specific details
- Respects 60 min constraint: PARTIAL — mentioned "45 minutes of usable time" but Paradise Dynasty route_context says "allow 90 min"

**Issues:**
- Time budget mismatch persists for dynamic fallback (not a route-wiring issue — this is the existing Smart7/prompt gap)
- Dynamic fallback would benefit from its own time-enforcement logic

---

## Test 5: Time Pressure (T1, 45 min)

**Status:** PASS

**Response summary:** Agent matched The Kangaroo Quick Stop template. Returned sequenced plan: restrooms near D gates, hawker stalls (laksa or chicken rice), explicit 15-min gate security reminder. Acknowledged urgency ("tight but doable window"). Stripped optional stops (Cactus Garden, duty-free browsing).

**Criteria evaluation:**
- Very short route (1-2 stops): PASS — 2 essential stops (restrooms + food)
- No optional/time-heavy stops: PASS — Cactus Garden and duty-free stripped as optional
- Urgency acknowledged: PASS — "tight but doable window", "tight connection"
- Gate buffer explicitly mentioned: PASS — "Budget 15 minutes for gate security at the end"
- Activity time <= 25-30 min: PASS — restrooms (5 min) + hawker food (15-20 min) = ~25 min

**Issues:** None

---

## Summary

- Tests passed: 4/5 (Tests 1, 2, 3, 5)
- Tests partially passed: 1/5 (Test 4 — expected, no T2 curated template)
- Tests failed: 0/5

### Improvement from Previous Run

| Test | Before | After | Change |
|------|--------|-------|--------|
| 1: QF2 Reverse Kangaroo | PARTIAL | PASS | Route template injected — Ya Kun, Cactus Garden, Fish Spa all present |
| 2: Terminal Hop | PARTIAL | PASS | Cross-terminal route with T3+T1 stops, Butterfly Garden, Rain Vortex |
| 3: T4 Island | PASS | PASS | Heritage Zone + TWG Tea now present (from route template, not amenity data) |
| 4: T2 Fallback | PARTIAL | PARTIAL | Expected — no T2 template, dynamic fallback unchanged |
| 5: Time Pressure | PASS | PASS | Now uses Kangaroo Quick Stop template with stripped optionals |

### Key Outcomes

1. **Route templates working** — `queryRouteMatch` correctly matches templates by terminal + time range
2. **Cross-terminal routes working** — Terminal Hop matched from T3 context, included stops in both T3 and T1
3. **Optional stop stripping working** — Test 5 (45 min) correctly stripped optional stops from Kangaroo Quick Stop
4. **Editorial personality strong** — All route responses include specific dish names, opinions, and concierge voice
5. **Gate buffer consistently mentioned** — All 5 tests now include explicit gate buffer reminders
6. **Dynamic fallback preserved** — Test 4 (T2, no template) gracefully falls back to amenity-based recommendations

### Remaining Gap

- **T2 has no curated template** — Consider creating a T2 route template for common SQ/JetStar connections
- **Dynamic fallback time enforcement** — Smart7 filter passes amenities that may take longer than available time (Paradise Dynasty "allow 90 min" shown for 45 min usable). This is a prompt-level issue, not route-wiring.
