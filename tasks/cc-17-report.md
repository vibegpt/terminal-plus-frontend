# CC-17 report: landside and open-now eligibility on every surface

**Status: READY TO PUSH (Todd).** Preview acceptance PASS, preview SMOKE 13/13, 0 non-test rows.
Branch `cc-17/landside-open-now` = `d471aed` + this report, on top of `origin/main` `1e77134`
(fast-forwards main). Worktree `~/tp-eligibility`.
Final preview: `dpl_8DVw36WnuRTHbtn2iWbiSdMcqqK5` (`d471aed`), alias
`terminal-plus-frontend-git-cc-17-ee67fe-todds-projects-d0181971.vercel.app`, sin1.
Rollback target once shipped: `dpl_3cetFfttKhU3j7Gv6XY53WC6kg3G` (`1e77134`, production now).

## What changed

- **DB:** `amenity_detail.is_landside boolean not null default false`, true for the 127 rows approved at G3
  (migration `20261006015308`).
- **`shared/ranking/policy.ts`:** the only place the rules and their numbers live.
  - Constants: `LANDSIDE_MIN_MINUTES {departing: 90, connecting: 180}`, `OPENS_SOON_MINUTES = 60`.
  - `landsideAccess` and `openNow`.
  - `pickEligible`: drops hidden and closed rows, then fills open → unreadable hours → opening within 60 min ("Opens HH:MM"). It runs before each surface's own dedupe.
- **`shared/ranking/landsideCopy.ts`:** every string. Strings that quote a threshold take it as an argument.
- **Surfaces:** vibe feed, collections, Home counts, search, amenity page and "more like this", saved, map, flight-bar call to action, capture's last step, chat (venue list, curated routes, cards, prompt), and MCP (`get_recommendations` and `get_route`).
- **Removed:**
  - the three 75-minute Jewel rules in `contextualScoring.ts`;
  - the 120-minute rule in `ranking.ts`;
  - chat's 8-minute walk filter;
  - chat's `available_in_tr = true` filter for transit (every row that isn't true is landside);
  - dead `api/lib/agentPrompt.ts`.

| Commit | What |
|---|---|
| `318ca1b` | migration file (applied as `20261006015308`) |
| `9a85a2a` | policy, copy, `tests/landside-policy.test.ts` |
| `3d7f2b5` | every surface; adversarial tests 8 and 9 derive expectations from the policy |
| `1dca1c8` | chat eval: `--now`, `--dir`, landside picks scored, 3 prompts |
| `0ec8e3c` | route stops carry labels; vibe list hours via the policy. **Broke `/api/chat` on its preview** (see Lessons) |
| `56ac201` | fix for `0ec8e3c` |
| `44fc038` | open now on route stops; the model reads hours as of now |
| `d471aed` | hidden landside venues excluded in the query (chat, MCP, vibe feed); prompt states the minutes basis |

## Migration

- Applied 2026-10-06 01:53 UTC. The file was written first, applied, then renamed to the recorded version.
- Before: 378 rows; the column was absent; anon and authenticated held SELECT, REFERENCES and TRIGGER; RLS on.
- After:
  - 127 true and 251 false; 0 SIN-JEWEL rows airside. By terminal: JEWEL 54, T1 23, T2 24, T3 15, T4 11.
  - Grants unchanged. `has_column_privilege('anon', …, 'is_landside', 'SELECT')` = true; anon UPDATE and INSERT false; RLS on. No trigger on the table.
- The migration asserts the 127 count and that no Jewel row is airside, and raises otherwise.
- `tests/landside-policy.test.ts` checks the live table against the migration's slug list: exact match, 127.
- Rollback: `alter table public.amenity_detail drop column is_landside;`. Roll the code back first, because CC-17 code selects the column.
- Another session applied `20261005180720 crawler_flag` (`events.is_bot`) on 5 Oct. It isn't in this branch.

## Gates (plan, approved 5 Oct)

| Gate | Result |
|---|---|
| G1 | `origin/main` `1e77134` (`b043514` + docs) = production. Fast-forwarded before the first commit; unchanged at the end |
| G2 | Surfaces table in the plan. Reachable from `src/main.tsx` now: 54 files (+ `src/lib/eligibility.ts`, `src/components/EligibilityChips.tsx`, `shared/ranking/*`) |
| G3 | 127 rows approved with the plan. Lists D (stays airside) and E (text conflicts) are below; no text was edited |
| G4 | MCP has no passenger type, so it uses the "type unknown" rows. Labels ride at the front of `route_context` and route stops' `editorial_note`, which `mcp.ts` passes through by name |

## Acceptance

### Passenger cases, preview, 375 px

- **Setup:** `tp_journey_context` v4 written per case, with boarding = now + N, built when the case started.
- **Pages:** `/vibe/explore` (and its Jewel tab), `/vibe/refuel`, Home, 4 amenity pages, `/map` Jewel tab, `/saved` (Canopy Park, Kopitiam T1, TWG Tea T4) and `/search` "canopy".
- **Labels in the table:**
  - "clear both ways" = "Landside: clear immigration both ways (visa rules apply)"
  - "outside" = "Landside: outside immigration"
  - "BI" = "Before immigration"

| Case | Lists (vibe, Home, search) | Amenity, saved, map (never hidden) |
|---|---|---|
| connecting 170 | 0 landside. Jewel tab: "This is landside. A connection under 3 hours doesn't leave time to clear immigration both ways." Home: Jewel Chill, Jewel Refuel and Jewel Shop cards gone; sections stay. Search "canopy": 0 results plus the reason | Reason banner on Canopy Park (Jewel and T2 copy) and Kopitiam T1; none on TWG Tea; map shows the reason. Flight bar: "Explore the terminal →" |
| connecting 185 | Landside shown, labelled "clear both ways" (explore 4 of 7, refuel 6 of 7, Jewel tab 7 of 7, search 4 of 4); Jewel Experience 10 spots | Label "clear both ways" on all three landside pages, map and saved |
| departing 80 | 0 landside; Jewel tab and search show "This is landside. With under 90 minutes to boarding, it's time to go through immigration."; Jewel Experience 3 spots | That reason on the 3 landside pages, map and saved |
| departing 95 | Landside shown, labelled BI (explore 4, refuel 6, Jewel tab 7, search 4) | Label BI everywhere; flight bar "Explore Jewel →" |
| just_landed | Landside shown, no label | No label, no reason |
| skipped (SQ000, no minutes) | Landside shown, labelled "outside" | Label "outside" everywhere |
| type unknown (v3 record), 170 min | As connecting: hidden, connecting reason | Connecting reason |
| deep link `/amenity/canopy-park-jewel-new` as connecting 60 | n/a | Page renders in full: "Open · Until 21:00" plus the reason banner (screenshot in session) |

Capture's last step (typed QF1, departing, 705 min): "Jewel Changi is within reach · Before immigration"; stored `jewelViable: true`.

### Open now, 00:30 SGT

**Browser.** The test clock `localStorage.tp_clock_sgt = "00:30"` is honoured only on DEV and `VITE_TP_DEBUG=1` builds, so Preview only. Passenger: skipped.
- `/vibe/refuel` = Kopitiam, T2 Food Gallery, Wang Cafe, TWG Tea, A&W Root Beer, Bacha Coffee, A&W Restaurants. `/vibe/explore` = Kopitiam, Bacha Coffee, Fish Spa, Shiseido Forest Valley, Aerotel, Cabin Bar DFS, Cultural Performances Stage. Both match the policy computed in Node on the same pools at nowSgt 30, item for item.
- Home counts drop (e.g. Breakfast Champions 1 spot).
- Canopy Park's page and the saved item show "Closed · Opens 10:00".
- Search "din tai fung": "5 closed matches not shown."

**Catalogue at 00:30.** 186 open, 189 closed, 3 unknown.
- The 3 unknown rows are Changi Experience Studio T3, T4 and Jewel ("Mon-Fri 11:00-20:00, Sat-Sun 10:00-20:00").
- Parser coverage: 130 open 24 hours, 245 single ranges (95 of them past midnight), 15 JSON-in-text.

**Chat** (`x-tp-now: 00:30`, honoured only on test requests outside production): see the eval table. 0 closed picks, `now_sgt` = 30 on every turn.

### Chat (`tests/chat-eval`, 30 prompts; JSON in `tasks/cc-17-eval/`)

| Run | Valid | Slug quality | Adversarial | Location | Rule violations | Closed picks | p50 / p95 | Median input tokens | Mean cost | Rows logged / not test |
|---|---|---|---|---|---|---|---|---|---|---|
| `cc17-v2-live` (`d471aed`, ~11:30 SGT) | 30/30 | 29/30 | 4/5 | 2/2 | 0 | 0 | 5.9 / 9.2 s | 4,891 | $0.0131 | 30/30 / 0 |
| `cc17-v2-0030` (`d471aed`, test clock 00:30) | 30/30 | 28/30 | 4/5 | 2/2 | 0 | 0 | 5.4 / 11.4 s | 3,014 | $0.0093 | 30/30 / 0 |

- Location 2/2 is after rescoring (`*.rescored.json`). The 00:30 l1 reply declined Jewel ("just short of the 180-minute mark… I'd keep you airside"), which the eval's decline pattern didn't match until it was widened in this branch (1/2 before).
- **Misses:**
  - Adversarial a1 (a coding request) misses as in every CC-6 run since the baseline: the model declines, then suggests venues.
  - Slug quality a1, plus at 00:30 the turns where fewer than 3 venues fit the night list (n08, n11).
- **The 4 CC-17 cases:**
  - connecting 170 (j1, l1, c1) shows no landside venue. c1 now leads with Din Tai Fung T1, which before the query fix lost its slot to Jewel rows.
  - c2 finds the three airside Din Tai Fung branches.
  - departing 95 (d1) is below.
- Earlier runs, in the same folder: `cc17-live` (`1dca1c8`), `cc17-0030` (`56ac201`), `cc17-final-*` (`44fc038`). They found the route, night-hours and query-limit issues fixed in `44fc038` and `d471aed`.

### MCP (`mcp-session-id: smoke-cc17-*`)

`get_recommendations {vibe: refuel, time_until_boarding_minutes}`:
- **170:** 8 results, 0 landside. `total_available` is 12: only 12 refuel venues are airside, and 8 survive the name dedupe.
- **200:** 12 results, 9 landside, each `route_context` starting "Landside: clear immigration both ways (visa rules apply). …".
- **No time:** 7, the same list as `/vibe/refuel` (adversarial test 11 parity).

`get_route`:
- **T1, 120 min:** "The Reverse Kangaroo" without its Ya Kun T1 and Kopitiam T1 stops (landside, type unknown, under 180).
- **200 min:** "The Terminal Hop" keeps Rain Vortex and Grain Traders, with the label at the front of `editorial_note`.

### Grep, unit, adversarial, typecheck, build

- **Threshold grep** over reachable `src/` (esbuild trace), `shared/` and all of `api/`:
  - Pattern: `(jewel|landside).{0,40}\b[0-9]{2,3}\b|\b[0-9]{2,3}\b.{0,40}(jewel|landside)`.
  - Hits outside `policy.ts`: walk-time tables (`JourneyContext` WALK_TIMES, `contextualScoring` GATE_WALK_MINUTES), CSS colours in the capture card, and one "CC-17" comment. None is an eligibility threshold.
  - The chat prompt interpolates `LANDSIDE_MIN_MINUTES`.
  - The one Jewel threshold left is `api/mcp.ts:199` ("Consider visiting Jewel" when the delay is over 120). That file takes zero edits, so it's flagged below.
- **`tests/landside-policy.test.ts`:** 19/19, including the live 127-slug check. All unit tests: 79/79.
- **`npm run test:adversarial`:** 11/11. Also 11/11 with the process clock at 00:30 and 12:00 SGT.
  - Tests 8 and 9 now take their expectations from the policy at the same clock: editorial order within each fill tier, and "the deduped eligible pool" rather than the whole pool. They held only in daytime before.
- **Typecheck:**
  - `npx tsc --noEmit -p api/tsconfig.json`: exit 0.
  - Reachable-`src` tsc: 31 errors, 0 new; `origin/main` has 34. 3 fixed in `AmenityDetailPage` and `SearchPage`.
- **`npm run build`:** exit 0.

### Preview SMOKE 13/13 (`dpl_7KmzKNMPKrPXtV2f5SjGKA5cahoE` / `44fc038`; lines 6, 10, 11 re-run on `d471aed`)

Browser TZ Asia/Jerusalem (UTC+3), 375×812, `tp_test=1` set before the first load, service worker unregistered.

| # | Line | Result |
|---|---|---|
| 1 | Capture gate | PASS: "What brings you to Changi?" |
| 2 | Skip | PASS: Home with "Add your flight…"; journeys `0a063e87-c7b0-4e99-937f-89ba8280945b` (`skipped`, `onboarding_skipped=true`) |
| 3 | Typed QF1 | PASS: departing → T1 → manual → "Terminal T1 · Boards 22:45 → LHR" → bar "11h 46m to board · On Time, QF1 · SIN → LHR". Stored v4, `typed`, `departing` |
| 4 | Board picker | PASS: Change flight → board → TR474: "19 min to board · On Time, TR474 · SIN → SZB, C11, T1"; journeys `d78e90f3-418d-4db5-a1fb-e0ef57bd9873` (`picker`) |
| 5 | Home | PASS: 7 rows, 31/31 images, 0 broken, 32 of 40 cards with counts (same as CC-1) |
| 6 | `/vibe/refuel` | PASS: 7 (Kopitiam, T2 Food Gallery, Fossa, Grain Traders, Kélé, Wang Cafe, TWG Tea), the CC-1 list, now labelled. Re-run on `d471aed` |
| 7 | Collection, amenity, search | PASS: `coffee-worth-walk` "7 of 7 spots"; `grain-traders-jewel` "Open · Until 22:00" plus "Before immigration"; "laksa" → Kopitiam (T1) |
| 8 | Flight bar → Change flight → "Keep QF1" | PASS: `tp_journey_context` byte-identical, `capturedAt` unchanged |
| 9 | Non-SG TZ | PASS: local 06:05, SGT 11:05; Grain Traders (11:00–22:00) "Open until 22:00" |
| 10 | Chat | PASS: coffee question → reply uses T1 and boarding 22:45; cards Toast Box (label "Before immigration"), dnata Lounge, Starbucks. Re-run on `d471aed` (eval) |
| 11 | MCP | PASS: initialize 200 `2025-03-26` `terminal-plus`; tools/list 4; `get_recommendations` 7. Re-run on `d471aed` |
| 12 | Events, last 15 min | PASS: `session_start` 1186, `recommendation_impression` 1167–1187 |
| 13 | Typed journeys row | PASS: `7de26861-3820-4c46-bac1-6ec70aa23548` (`typed`, `departing`, QF1, LHR) |

## Test rows (all `env = preview`, `is_test = true`)

Baseline at 02:13:57 UTC: `max(events.id)` 1011, 99 journeys rows, 227 agent_interactions rows.

| Table | Rows |
|---|---|
| events | 180 rows, ids 1012–1191 (anon `22c6ebad-3ca5-40ea-92aa-0a82add5c44f` for the case runs, `fd8b0bf6-d6f8-4ba6-b16e-22a251d68d97` for SMOKE) |
| journeys | `0a063e87-c7b0-4e99-937f-89ba8280945b`, `7de26861-3820-4c46-bac1-6ec70aa23548`, `d78e90f3-418d-4db5-a1fb-e0ef57bd9873` |
| agent_interactions | 192 rows, 02:14:35–03:27:28 UTC (eval sessions in the JSON files; MCP `smoke-cc17-*`) |

Rows with `is_test = false` written since the baseline: **0** in all three tables.

## For Todd

1. **d1, departing 95: the model talks itself out of an allowed Jewel visit.**
   - The server allows it (95 ≥ 90), but the reply says Jewel "is just under the 90-minute cutoff once you factor in clearing immigration and your gate buffer".
   - The prompt now says the rule counts minutes to boarding before the buffer, and that listed landside venues already pass it. That didn't change the reply.
   - Options:
     - (a) accept it as conservative;
     - (b) drop the "N usable after a 15 min gate buffer" phrase from the turn context;
     - (c) tell the model it may suggest a listed landside venue without re-judging the time.
2. **Closed venues asked for by name.** Search says "5 closed matches not shown." The 00:30 chat for "Where can I get Din Tai Fung?" says it can't see one. Both follow the spec. Do you want named lookups to show a closed venue with "Closed · Opens 11:00" instead?
3. **"Jewel Experience" collection** holds airside Kinokuniya, Muji and Zara copies. Connecting 170 sees "Jewel Experience (3 spots)" made of terminal shops, by the "0 eligible hides" rule. Rename or recurate (CC-3)?
4. **`api/mcp.ts:199`** still suggests Jewel when a delay is over 120 min. The MCP `get_route` flight-match branch (mcp.ts) builds stops without the rule. Both need an `mcp.ts` edit.
5. **New copy, beyond your two reasons and three labels**, all in `landsideCopy.ts`. **Approved (Todd, 14 Oct).**
   - `reason.noTime`: "This is landside. Add your onward flight to see if there's time to clear immigration." (departing or connecting with a skipped onward flight)
   - Flight bar "Explore the terminal →" when Jewel is out.
   - Capture "Jewel Changi is within reach / Jewel Changi: not this time" (the old text quoted "90+ min").
   - "Nothing here is open right now. Check back later." (a collection with nothing open).
   - "N closed matches not shown." (search).
   - Hours words: "Open", "Closed", "Hours", "Until", "See below".
6. **Default false.** A future catalogue import lands airside until someone sets `is_landside`.
7. **D, mixed or unverified, left airside for CC-3:** `starbucks-sint1`, `starbucks-sint3`, `trs-tax-refund-t2-new`, `trs-tax-refund-t3-new`, `koi-th-t2-new`, `bengawan-solo-t2-new`.
8. **E, text that contradicts the tag.** Proposed wording is in the approved plan; no text was edited. Data conflicts for CC-3:
   - `route_stops` calls Kopitiam T1 and Ya Kun T1 "T1 transit food area". They're tagged landside (`available_in_tr` null), so "The Reverse Kangaroo" and "The Kangaroo Quick Stop" lose them for passengers under 180 min.
   - Crystal Jade Go T1's `route_context` says "T1 transits".
   - Mother And Child, Chagee, Eu Yan Sang T2, Fila Kids T2 and Peach Garden T2 say transit or airside.
9. **`available_in_tr` is boolean but `AmenityDetailPage` compares it to the string 'true',** so "Transit ✓" never shows. Not changed. If it's fixed, hide it for landside rows.
10. **Latency, not new.**
    - Home runs 7 sequential collection queries: 8.3 s to the last row on the preview.
    - Each now embeds `amenity_detail(name, is_landside, opening_hours)`. For 7 collections that's 16.5 KB, against 1.5 KB for the count, with the same time (about 4 s per call from the sandbox, 3 runs each).
    - Supabase took 3–10 s per call during testing for unchanged queries too. CC-3 territory.

## Lessons

Three added to `tasks/lessons.md`:
- only the api typecheck loads `api/chat.ts`;
- a test journey ages while the test runs;
- filter before the database limit.

---

# CC-17S · Ship CC-17 (12 Oct)

**Status: preview PASS on the rebased branch. Copy approved (Todd, 14 Oct). Ready to push to main on Todd's go.**

## Gates

| Gate | Result | Evidence |
|---|---|---|
| G1 worktree | PASS | `~/tp-eligibility` on `cc-17/landside-open-now` @ `e09e72e`, `git status` clean, `git fetch origin` ok |
| G2 heads | PASS | origin/main `9b03dce`; production `dpl_8P4AXdBmgxjcHmsu5dL7JWwQ3dh3` (READY, `9b03dce`) = rollback target |
| G3 earlier preview | PASS | Report line 3: "**Status: READY TO PUSH (Todd).** Preview acceptance PASS, preview SMOKE 13/13, 0 non-test rows." Line 140: "### Preview SMOKE 13/13 (`dpl_7KmzKNMPKrPXtV2f5SjGKA5cahoE` / `44fc038`; lines 6, 10, 11 re-run on `d471aed`)" |
| G4 migration | PASS | `list_migrations`: `20261006015308 amenity_is_landside`; the repo file is `supabase/migrations/20261006015308_amenity_is_landside.sql`. Same version, so no rename and no re-apply (`318ca1b` is the commit, not the version) |

## Rebase

`git rebase origin/main`: 9 commits replayed onto `9b03dce`, new head `9a4761c` (was `e09e72e`).

| Conflict | Resolution |
|---|---|
| `tasks/lessons.md` (last commit, `e09e72e`) | Both sides appended. Kept main's "2026-10-05 · `apply_migration` names the version, not the file" (CC-20), then the branch's three 2026-10-06 lessons, separated by `---`. 0 markers left |

No other conflicts. The branch touches none of CC-20's or CC-21's files (`api/events.ts`, `api/journey.ts`, `api/lib/crawler.ts`, `package*.json`, `vercel.json`, `api/cron/keepalive.ts`, CC-20's migrations). `api/mcp.ts`: 0 changes on the branch.

## Checks on `9a4761c`

| Check | Result |
|---|---|
| `npm ci` | ok (CC-20 changed `package*.json`) |
| `npm run build` | exit 0 |
| `npx tsc --noEmit -p api/tsconfig.json` | exit 0, 0 errors |
| `npx tsc --noEmit -p tsconfig.json` (blind) | 33 errors on both the branch and main (`9b03dce`), identical lines, 0 new. Blind, so not proof |
| Unit tests (`npx tsx --test tests/*.test.ts`) | 79/79, 0 skipped |
| `npm run test:adversarial` | 11/11 |
| Push | `git push --force-with-lease=cc-17/landside-open-now:e09e72e origin cc-17/landside-open-now`: `e09e72e...9a4761c` |

## Preview, `dpl_EazyvHRPrLAMnab5e6reZ5jgTN4i` (`9a4761c`)

- **Setup:** branch alias `terminal-plus-frontend-git-cc-17-ee67fe-…`, bundle `index-B0-Ci4IL.js`. 12 Oct 08:10–08:30 UTC (16:10–16:30 SGT).
- **Browser:** built-in browser at 375×812, TZ Asia/Jerusalem. The SW was unregistered and caches cleared first, and `tp_test = '1'` was set on `/robots.txt` before the first load.
- **Passenger cases:** `tp_journey_context` v4 written per case (boarding = now + N, `journey_type` set), as in CC-17.

### SMOKE 13/13

| # | Line | Result |
|---|---|---|
| 1 | Capture gate | PASS: "What brings you to Changi?" |
| 2 | Skip | PASS: Home with "Add your flight for personalised recommendations"; journeys `44ff46b8-bf4c-441d-a785-674e1b0235fb` (`skipped`) |
| 3 | Typed QF1 | PASS: departing → T1 → manual → "Terminal T1 · Boards 22:45 → LHR" → bar "6h 33m to board · On Time, QF1 · SIN → LHR, T1"; stored v4, `typed`, `departing`; journeys `ba2a0f0a-50ff-4558-834c-889f84a9db7a` |
| 4 | Board picker | PASS: TR188 → "BOARDING NOW, TR188 · SIN → HGH, C24, T1"; journeys `3cce9356-ec27-4bf5-9e3e-876fb7b8d11d` (`picker`) |
| 5 | Home | PASS: 7 vibe rows, 31 images, 0 broken, 32 counts |
| 6 | `/vibe/refuel` | PASS: Kopitiam, T2 Food Gallery, Fossa Chocolate, Grain Traders, Kélé, Wang Cafe, TWG Tea (the CC-1 seven), labelled for the skipped passenger |
| 7 | Collection, amenity, search | PASS: `coffee-worth-walk` "7 of 7 spots"; `grain-traders-jewel` renders; "laksa" → Kopitiam (T1) |
| 8 | Change flight → "Keep QF1" | PASS: "Keep QF1" appears once; `tp_journey_context` byte-identical afterwards |
| 9 | Non-SG TZ | PASS: browser 11:10, SGT 16:10; Sushi Tei T1 (11:30–22:00) "Open · Until 22:00" (a local reading would say closed). Grain Traders couldn't tell the readings apart at this hour |
| 10 | Chat | PASS: the reply uses T1 and 22:45 boarding; cards Toast Box ("Before immigration"), Starbucks, dnata Lounge; agent_interactions `ec776af6-c8a9-4714-a09a-d61fe256befc` |
| 11 | MCP | PASS: `smoke-cc17s-202610120820`: initialize 200 `2025-03-26` `terminal-plus`; tools/list 4; `get_recommendations {refuel, SIN-T1}` 7 |
| 12 | Events | PASS: session_start 6, recommendation_impression 73 (ids 1242–1334) |
| 13 | Typed journeys row | PASS: `ba2a0f0a-…` (`typed`, QF1, `departing`) |

### CC-17 cases

| Case | Result | Evidence |
|---|---|---|
| connecting 170 | PASS | `/vibe/explore` "7 spots": Paradise Dynasty T1, Fish Spa T1, Sushi Tei T1, Bacha Coffee T3, Kinokuniya T3, Bee Cheng Hiang T1, Din Tai Fung T1; SQL: all 7 rows `is_landside = false`. Home 32 counts (normal). Search "canopy": 0 results plus "This is landside. A connection under 3 hours doesn't leave time to clear immigration both ways." |
| connecting 185 | PASS | Explore 4 of 7, refuel 6 of 7, search 4 of 4 Canopy Park, each "Landside: clear immigration both ways (visa rules apply)" (same counts as CC-17) |
| departing 80 | PASS | Explore 7 and refuel 7 with 0 landside labels; search "canopy" shows only "This is landside. With under 90 minutes to boarding, it's time to go through immigration." Home 32 |
| departing 95 | PASS | "Before immigration" on explore 4, refuel 6, search 4 of 4 |
| just_landed | PASS | Landside shown (refuel: Kopitiam, Fossa, Grain Traders, Kélé, Wang Cafe; search 4 Canopy Park), 0 labels |
| skipped | PASS | "Landside: outside immigration" on refuel 6 of 7 (TWG T4 none), explore, Grain Traders page, search "laksa" |
| Canopy deep link, connecting 60 | PASS | `/amenity/canopy-park-jewel-new` renders in full (title "Canopy Park, Jewel Changi · Terminal+", "Open · Until 21:00", description) with the banner "This is landside. A connection under 3 hours doesn't leave time to clear immigration both ways." Screenshot in session |
| Clock 00:30 SGT (`tp_clock_sgt`), `/vibe/refuel` | PASS | 7, 0 closed: Kopitiam, T2 Food Gallery, Wang Cafe, A&W Restaurants (24 h, "outside" label), TWG Tea and Bacha Coffee (until 01:00), A&W Root Beer (24 h). No "Opens HH:MM" fill was needed. Same list as CC-17 |
| MCP 170 (`limit 12`) | PASS | 8 results, 0 landside, `total_available` 12: TWG Tea, A&W Root Beer, Bacha Coffee, Starbucks T3, Coffee Bean T3, Ya Kun T3, Hudsons T2, McDonald's T2 Transit |
| MCP 200 (`limit 12`) | PASS | 12 results, 9 landside, `total_available` 44; each landside `route_context` starts "Landside: clear immigration both ways (visa rules apply)." With the default limit (7): 170 → 7 airside, 200 → 6 landside of 7 |
| MCP `access_note` | n/a | No such field: the response keys are `recommendations`, `total_available`, `filters_applied`, and `access_note` appears nowhere in `api/` or `shared/`. The access label is the `route_context` prefix |
| `/api/cron/keepalive`, no header | PASS | 401 `{"ok":false,"error":"Unauthorized"}` (CC-21 intact) |

### Test rows (preview, all `is_test = true`, `env = 'preview'`, `is_bot = false`)

| Table | Ids |
|---|---|
| events | 1242–1334 (session_start 6, recommendation_impression 73, search_performed 7, capture_opened 4, amenity_detail_dwell 2, flight_not_found 1) |
| journeys | `44ff46b8-bf4c-441d-a785-674e1b0235fb` (skipped), `ba2a0f0a-50ff-4558-834c-889f84a9db7a` (typed QF1), `3cce9356-ec27-4bf5-9e3e-876fb7b8d11d` (picker TR188) |
| agent_interactions | `ec776af6-c8a9-4714-a09a-d61fe256befc` (chat); 5 MCP rows `smoke-cc17s-202610120820` (`9071422c-…` to `e475294e-…`) |

## Follow-ups (Todd, 12 Oct)

1. **CC-17b:** `api/mcp.ts:199` and `get_route`'s flight-match branch apply the landside rule. The `api/mcp.ts` zero-edit rule is lifted for this one fix only. It ships before any MCP registry listing.
2. **"Jewel Experience" for connecting under 180 min:** hide the row on Home. The collection page shows the reason banner instead of filling with terminal shops.
3. **Search by exact venue name:** a closed venue shows with "Closed · Opens HH:MM" instead of disappearing.
4. **d1 (chat argues against Jewel at departing 95): CC-6b.** Chat follows the server's eligibility verdict.
