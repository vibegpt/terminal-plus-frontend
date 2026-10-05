# CC-13 Journey trail: report

**Status: rebased once onto `main` = `388078a` (CC-6 + the test-flag fix), with the dismissed-bar fix and the status-pill fix. Preview SMOKE 13/13; the `telemetry.ts` checks (CC-13, CC-16, CC-18, CC-6, test flag) PASS; pill checked at 320 and 375 px. Ready to ship, not merged.** Ship order: CC-16, CC-18, CC-6 and the test-flag fix are all on `main`; CC-13 is next. AC-8 is still BLOCKED: it needs a real iPhone home-screen install. The migration is applied to the production DB. **Nothing is merged to `main`.** That waits for Todd's go.

Round 1 ran 2026-10-03 on `d1ccd07` (below, from "Gates"). Round 2 ran 2026-10-04 on `be0fff0`. Round 3 ran 2026-10-05 on `388078a` (next section). This replaces the 2026-10-01 BLOCKED run (G1 failed then because CC-7 wasn't applied).

## Round 3: rebase onto `388078a` (CC-6 + test flag in body), dismissed-bar fix, status pill, 5 Oct

Branch `cc-13-journey-trail`, 7 commits on `388078a`. Code: `58619ae` feature, `360a66c` debug log, `7998068` replay, `79aaed0` dismissed bar, `d4a7df4` pill. Then this docs commit. Pre-rebase tip kept locally as `cc-13-pre-rebase-748bb59`. Preview `dpl_AUkSSSQS3PGHTfJfNskSuPf1R1bx` (READY, sin1), branch alias; CI run `37262808718`: success.

### Rebase

One rebase, onto both. `tasks/lessons.md` was the only conflict (CC-6's and the test-flag lessons, then CC-13's). `src/lib/telemetry.ts` and `api/events.ts` auto-merged, and all of these were checked present afterwards:

| What | Where |
|---|---|
| Event lists | 17 = 17, identical order |
| CC-6 | `telemetryIds()` |
| Test-flag fix | `testBody()` in the flush and unload bodies; `sendBeacon` for every browser; server `isTestRequest(req.headers, parsed)` |
| CC-16 | First-touch and landing attribution; `session_start` sanitiser |
| CC-18 | `capture_opened` sanitiser |
| CC-13 | `validateTrailEvent` and the all-rejected 400 |

CC-6's new dependency needed `npm ci` (`@vercel/functions`).

| Local check | Result |
|---|---|
| `npx tsx --test tests/*.test.ts` | 60/60 (CC-13's 21, including the new dismissed-bar test) |
| `npx tsc --noEmit -p api/tsconfig.json` | 0 errors |
| Reachable-file typecheck (43 files on `388078a`, 47 on the branch) | 35 vs 34: 0 new, 1 fewer (the now-used `MapPin`) |
| `npm run build` | exit 0 |

### Changes this round

| Commit | Change |
|---|---|
| `79aaed0` | Rule 7 reads `captureBarShowing({hasFlight, onPagePath, barDismissed})` (pure, in `outcomePrompt.ts`). A dismissed Add-flight bar isn't showing, so the strip doesn't wait on it. Home's prompt can't be dismissed and still counts |
| `d4a7df4` | `FlightStatusBar`: the status pill ("Plenty of time", "Good timing", "Board soon!", "BOARDING NOW") moves from `position: absolute; top: 10; right: 48` into the flow, beside the route in a wrapping row. The info column is `flex: 1; min-width: 0`. It sits beside the route where there's room and wraps to its own line where there isn't |

### Status pill at 320 and 375 px (bounding boxes measured in the page)

| Case | 375 px | 320 px |
|---|---|---|
| QF1, no gate, "Plenty of time" | Beside the route, x 129–218; gate column from 298; 0 overlaps; bar 62 px | Beside the route, x 129–218; gate from 243; 0 overlaps; bar 62 px |
| SQ322, gate D46, Delayed, "Good timing" (synthetic boarding +50) | Beside the route, x 143–223; gate from 284; 0 overlaps; bar 62 px | Wraps to its own line (y 88–105); 0 overlaps; bar 80 px |
| SQ322, D46, "BOARDING NOW" with the gate chip (synthetic boarding −2) | Beside the route, x 143–242; chip below; 0 overlaps; bar 110 px | Wraps (y 100–117); chip below; 0 overlaps; bar 128 px |
| Live SQ916, F58, "Board soon!" | Beside the route; 0 overlaps | (not repeated) |

Overlaps were checked pill against the time line, the route, the gate column and the chevron, plus time line against gate. Screenshots were taken at each size.

### Dismissed-bar fix, observed

Journey QF1 with boarding moved 40 min into the past (departure still ahead), so the page shows the Add-flight bar, on `/amenity/kinokuniya-t3-new`:

1. Resume with the bar showing: `eligibility false: capture_bar {candidateEligible: true}`, no strip, `outcome_eligible` **863**.
2. ✕ on the bar (`tp_add_flight_bar_dismissed = 1`), then resume: `eligibility true: all rules pass`, "Make it to Kinokuniya?" in the header slot. **864** shown, **865** `dismissed`.

### `telemetry.ts` checks

| Check | Result | Evidence |
|---|---|---|
| Test flag on every transport (test-flag fix) | PASS | Spy on `sendBeacon` and `fetch`: `outcome_eligible` + `outcome_shown` went by fetch with header and body `test: true`. The held Yes, written on hide, went by **beacon** with body `test: true`. Rows **859**, **860**, **861** all `is_test`. Every row from this browser since the watermark is `is_test` |
| CC-6 chat ids | PASS | `agent_interactions` `0b8ffd0d-35cd-4c2b-ae87-d1c6744f4b81`: `session_id` = the events' `51f6d384…`, `journey_id` = `229e1536…`, model `claude-sonnet-5-5`, tokens 6677/322, `is_test`, `preview` |
| CC-6 v4 with the CC-13 ledger | PASS | Stored record turned back to v3 (no `journey_type`), reload: `schema_version 4`, `journey_type` absent (unknown, per CC-6), `capturedAt` unchanged, ledger byte-identical. Next 0.4-min resume on Bacha Coffee: `already_asked`, no re-ask |
| CC-16 attribution | PASS | session_start **833** `{utm_source: test, utm_medium: qa, utm_campaign: cc13r3, landing_path: /}`; first touch `test`; all 3 journeys `acquisition_src = test` |
| CC-18 `capture_opened` | PASS | gate **832**, **878**; bar **887**; change_flight **890** |
| CC-13 events | PASS | Above, plus live gate chip F58: **888** shown, **889** reached |
| Chat cards | PASS | The raw `**` and stray `{`/`0` glyphs from round 2 are gone after CC-6: cards Toast Box, dnata Lounge, Starbucks, SATS Premier Lounge with terminal and hours |

### Preview SMOKE

| # | Result | Evidence |
|---|---|---|
| 1 | PASS | `/` first visit: gate; `capture_opened {gate}` |
| 2 | PASS | New tab, no journey: gate → Skip → Home prompt; journey `418e7655-ba54-4f36-97f3-7f860919971d` `skipped` |
| 3 | PASS | Gate → T1 → QF1 typed → "Terminal T1 · Boards 22:45 → LHR" → Home, bar "10h 25m to board · QF1 · SIN → LHR"; journey `229e1536-161d-4591-8fc3-b4edd44c729f` `typed`, v4 `departing` |
| 4 | PASS | From `/vibe/refuel`'s Add-flight bar → board → SQ916 (T2, 13:30): back on `/vibe/refuel`, bar "25 min to board · SQ916 · SIN → MNL · F58"; journey `6daaa9d7-46d8-4ec5-b93d-e9a626267d2c` `picker` |
| 5 | PASS | 7 rows, 31 of 31 images, 0 broken, 32 count cards |
| 6 | PASS | `/vibe/refuel` "7 spots across all terminals" |
| 7 | PASS | coffee-worth-walk "7 of 7 spots"; grain-traders-jewel renders; "laksa" → Kopitiam (T1) |
| 8 | PASS | Change flight → one "Keep SQ916" → same path, context byte-identical; `capture_opened {change_flight}` **890** |
| 9 | PASS (real clock) | Local 07:27 (Jerusalem), SGT 12:27: Grain Traders (11:00–22:00) "Open · Until 22:00" |
| 10 | PASS | `POST /api/chat` 200; reply uses T1 and the 22:45 boarding; 4 cards |
| 11 | PASS | initialize 200 (`2025-03-26`, `terminal-plus`); 4 tools; `get_recommendations {refuel, SIN-T1}` → 7. agent_interactions `8f80d70c-3a55-4c7a-9b29-52068b81ff52`, key `smoke-cc13r3-20261005`, `is_test` |
| 12 | PASS | session_start, recommendation_impression, capture_opened, outcome_*, gate_*, search_performed, flight_not_found |
| 13 | PASS | `229e1536…` QF1 `typed` |

Console errors across `/vibe/refuel`, a collection, an amenity, `/` and `/search`: none.

### Observations (not CC-13 failures)

- **Event order on a hidden first load.** With the test-flag fix, a tab that loads hidden sends each event as its own beacon. Here `capture_opened` **832** got a lower id than `session_start` **833** (same second); a visible tab batched them in order (877 → 878). CC-18's "after session_start" holds by `occurred_at`, not by id, on hidden loads.
- **Production traffic has started.** At the 04:17 UTC watermark there were 8 non-test production events (0 journeys). They aren't from this run (all of this run's rows are `preview`, `is_test`).
- **Clipboard.** The browser reported a clipboard write during the synthetic click on "Look up flight". No reachable source writes the clipboard (the only callers are dead files), and CC-13 adds none; it came from the test browser's synthetic input.

### Round 3 test rows (all `is_test = true`, env `preview`)

- Browser anon `d6d3347f-ee38-454c-8a71-280278803351`: events 832–890 from that anon (the gate, bar, strip, gate-chip, change-flight and search rows above; impressions 835–886, 40 rows). **849** `gate_prompt_shown` D46 came from the synthetic boarding state used for the pill test.
- journeys: `229e1536-161d-4591-8fc3-b4edd44c729f`, `418e7655-ba54-4f36-97f3-7f860919971d`, `6daaa9d7-46d8-4ec5-b93d-e9a626267d2c`.
- agent_interactions: `0b8ffd0d-35cd-4c2b-ae87-d1c6744f4b81`, `8f80d70c-3a55-4c7a-9b29-52068b81ff52`.

## Round 2: rebase onto `be0fff0` (CC-16 + CC-18), 4 Oct

Branch `cc-13-journey-trail` = `510c828` (4 commits on `be0fff0`): `8756e8c` feature, `f2a0a5e` debug-log fix, `af8022f` replay fix, `510c828` docs. The pre-rebase tips are kept locally as `cc-13-pre-rebase-4b1da26` and `cc-13-rebased-c29ebc0`. Worktree `~/tp-cc-13`. Preview `dpl_HHnzXpw937zv5YvPAnhHctxnT35f` (READY, sin1), tested on the branch alias. CI run `37182273029`: success.

### Conflicts and how they were resolved (both sides kept everywhere)

| File | Resolution |
|---|---|
| `api/events.ts` | `EVENT_TYPES`: CC-18's `capture_opened`, then CC-13's 5. Payload handling in order: CC-16's `session_start` sanitiser, CC-18's `capture_opened` sanitiser, then CC-13's `validateTrailEvent` (each applies to its own event types) |
| `src/lib/telemetry.ts` | The same 17 types in the same order, in both the set and the `EventType` union. CC-16's landing and first-touch attribution unchanged |
| `src/App.tsx` | CC-18's file kept whole (entry kind, `captureEntry`, `capture_opened`, `PAGE_PATHS`), plus CC-13's static `OutcomePrompt` import and `banner` |
| `src/components/AppShell.tsx` | Auto-merged: CC-18's `onEditFlight(entry: CaptureEntry)` and CC-13's `banner` |
| `src/components/FlightStatusBar.tsx` | CC-18's `AddFlightBar` branch and `onAddFlight('bar' \| 'prompt')`, plus CC-13's `GateChip` and first-render `minutesToBoarding`. One `JourneyContext` import carries `hasDeparted` |
| `src/pages/AmenityDetailPage.tsx` | CC-16's `usePageMeta` title, plus CC-13's candidate recording and "I'm here" |
| `tasks/lessons.md` | CC-16's 2 and CC-18's lessons, then CC-13's 3 |

`tp_journey_context` is untouched by CC-13. CC-13 keeps its own versioned keys (`tp_outcome_candidate`, `tp_outcome_ledger`, both v1), so CC-6's v3 → v4 bump needs no renumbering here. CC-13 reads only `capturedAt`, `journey_id`, `gate`, `boardingTime`, `scheduledDeparture` and `departureTerminal`, which CC-6's migration carries over unchanged.

### Local checks on the rebased tree

| Check | Result |
|---|---|
| Mirrored `EVENT_TYPES` | 17 = 17, identical order |
| `npx tsx --test tests/*.test.ts` | 37/37 |
| `npx tsc --noEmit -p api/tsconfig.json` | 0 errors |
| Reachable-file typecheck (esbuild trace from `src/main.tsx`; 42 files on `be0fff0`, 46 on the branch) | 35 errors on `be0fff0`, 34 on the branch. 0 new; the 1 fewer is the now-used `MapPin` import |
| `npm run build` | exit 0 |

### What CC-18 changes for CC-13 (observed)

- **Deep links mount the strip at once.** On `/vibe/refuel` with empty storage, the strip mounted at once and refused with `no_candidate, first_session, capture_bar, no_journey`. Rule 7's "capture bar" is now CC-18's slim `AddFlightBar` on pages and the old prompt on Home. Both show exactly when `flight` is null, so `!flight` still matches.
- **No journey, no strip.** Grain Traders opened from a deep link, then a 23 s resume: `capture_bar, no_journey`, no strip, no `outcome_eligible`. "I'm here" stays hidden without a journey.
- **Bar → capture → same page, no replay.** Add flight → typed QF1 → back on `/amenity/grain-traders-jewel` with "I'm here" now shown. No replay: the strip had already judged that resume before capture opened. The next resume showed "Make it to Grain Traders?" on the new journey.
- **Rule 7 errs safe after a dismissal.** (Superseded in round 3: Todd ruled that a dismissed bar isn't showing; fixed in `79aaed0`.) A dismissed `AddFlightBar` (`tp_add_flight_bar_dismissed`) still counts as "capture bar showing", because `flight` is null. This only matters between boarding + 35 min and departure; outside that window rule 8 (`no_journey`/`departed`) refuses anyway. The strip waits; it never shows wrongly.
- **Capture remount refreshes the candidate.** Capture replaces the shell, so the amenity page remounts afterwards and records its candidate again with a fresh time (candidate age 0 on the next resume). That's a re-open in effect, and it only makes rule 4 more lenient for the venue on screen.

### Preview SMOKE (`tasks/release-2026-09-report.md`)

Browser 375×812, browser TZ Asia/Jerusalem. Clean origin (no storage, no SW, no caches) with `tp_test=1` set from `/robots.txt` before any app load. The browser lost its storage during a pause, so the run was redone from a clean origin at 11:55 UTC; lines 3, 4 and 8 to 11 come from the 06:16 UTC part on the same build.

| # | Line | Result | Evidence |
|---|---|---|---|
| 1 | Capture gate shows | PASS | First visit `/?utm_source=test&…`: "What brings you to Changi?", `tp_entry_kind = home`, `capture_opened {gate}` **638** after session_start **637** |
| 2 | Skip works | PASS | Skip → Home with its prompt. Journey `5167b1e9-130a-4801-83f6-d17fea92f55f` `skipped`, `onboarding_skipped`, `acquisition_src = test` |
| 3 | Typed QF1 | PASS | From the collection's Add-flight bar: T1 → Enter manually → QF1 → "Terminal T1 · Gate D46 · Boards 22:45 → LHR" → Looks right. Back on `/collection/refuel/coffee-worth-walk`, bar "2h 47m to board · QF1 · SIN → LHR · D46 · T1". Journey `e162511a-0920-4adc-9b8a-9a8a55fb15a4` `typed` (also `8e0da87a-1cba-4ec0-889b-73a42433756f` earlier) |
| 4 | Board picker | PASS | Change flight → board → SQ194 (T2, 15:00). Bar "4 min to board · SQ194 · SIN → HAN · E6 · T2", still on `/amenity/bacha-coffee-sint3`. Journey `bb2ef728-8319-46fd-bb4e-37a2b313b2cb` `picker`, `capture_opened {change_flight}` **628** |
| 5 | Home | PASS | 7 rows (Refuel, Shop, Chill, Explore, Comfort, Quick, Work), 31 of 31 images (forced eager), 0 broken, 32 count cards |
| 6 | `/vibe/refuel` | PASS | "7 spots across all terminals" |
| 7 | Collection, amenity, search | PASS | coffee-worth-walk "7 of 7 spots"; grain-traders-jewel renders; "laksa" → Kopitiam (T1) |
| 8 | Change flight → Keep QF1 | PASS | One "Keep QF1"; back on the same path; `tp_journey_context` byte-identical. `capture_opened {change_flight}` **626** |
| 9 | Hours follow SGT | PASS (real clock) | Local 09:21 (Jerusalem), SGT 14:21: Grain Traders (11:00–22:00) "Open · Until 22:00". A local reading would say closed |
| 10 | Chat uses the flight | PASS | `POST /api/chat` 200 twice. SQ194 boarding: "you're boarding in just 3 minutes at gate E6 … SQ194". QF1: "plenty of time … your gate at D46", cards Starbucks (T1), Crystal Jade Go (T1). The bold markdown shows raw and stray `{`/`0` glyphs appear in the cards; CC-13 changes no chat file (0-line diff vs `main`), and CC-6 rewrites `ChatPanel.tsx`/`chatFormat.ts`. Re-check after the CC-6 rebase |
| 11 | MCP | PASS | initialize 200 (`2025-03-26`, `terminal-plus`); tools/list: get_airport_context, get_recommendations, get_disruption_status, get_route; `get_recommendations {refuel, SIN-T1}` → 7. agent_interactions `e23058ef-d74e-4497-a3d8-056ab99a9b44`, `is_test`, key `smoke-cc13-20261004` |
| 12 | Recent events | PASS | session_start, recommendation_impression, capture_opened, amenity_tapped, amenity_detail_dwell, flight_not_found, outcome_* |
| 13 | Typed journey row | PASS | `e162511a…` QF1 `typed` `departing` |

### CC-16 acceptance for the shared files (`telemetry.ts`, `api/events.ts`, `AmenityDetailPage.tsx`)

| Item | Result | Evidence |
|---|---|---|
| UTM link on first visit | PASS | session_start **637** `{utm_source: test, utm_medium: qa, utm_campaign: cc13, landing_path: /}`; `tp_first_touch_v1 = {src: test}` |
| Legacy `?src=` in a new session | PASS | `/vibe/refuel?src=cc13_legacy`: session_start **646** `{utm_source: cc13_legacy, landing_path: /vibe/refuel}`; first touch unchanged (`test`) |
| First touch drives `acquisition_src` | PASS | Both journeys from that browser: `acquisition_src = test` (`5167b1e9`, `e162511a`) |
| Junk session_start | PASS | 300-char utm_source, `<script>` campaign and path, bad ref_host, unknown key, valid utm_medium → stored **669** `{utm_medium: qa}` only |
| Amenity title and canonical | PASS | "Grain Traders, Jewel Changi · Terminal+", 1 canonical `…/amenity/grain-traders-jewel`; "Wang Cafe, Jewel Changi · Terminal+"; "Bacha Coffee, Terminal 3 · Terminal+" |
| Other event types unchanged | PASS | recommendation_impression keeps `{slugs, placement}` / `{slugs, collection}` |
| SW leaves static files alone | PASS | With `sw.js` controlling the tab, `/robots.txt` serves the text file |

### CC-18 acceptance for the shared files (`App.tsx`, `AppShell.tsx`, `FlightStatusBar.tsx`, `telemetry.ts`, `api/events.ts`)

| Item | Result | Evidence |
|---|---|---|
| Deep link renders at once | PASS | `/vibe/refuel`, empty storage: h1 "Refuel", title "Refuel at Changi · Terminal+", 1 canonical, Add-flight bar, no gate, `tp_entry_kind = page` |
| `/` shows the gate | PASS | SMOKE 1; `capture_opened {gate}` **638** |
| Bar → capture → back on the same page | PASS | Twice: `/amenity/grain-traders-jewel` (`capture_opened {bar}` **618**) and `/collection/refuel/coffee-worth-walk` (**658**). URL unchanged throughout, Add-flight bar gone afterwards |
| Dismiss lasts the session only | PASS | ✕ → hidden, `tp_add_flight_bar_dismissed = 1`; reload → still hidden; new tab → back |
| Deep-link visitor taps Home | PASS | Vibes → `/`: Home prompt, static title, 0 canonicals, no gate (`tp_entry_kind = page`) |
| Change flight returns in place | PASS | Keep QF1 and the SQ194 pick both returned to `/amenity/bacha-coffee-sint3`; `capture_opened {change_flight}` **626**, **628** |
| `capture_opened` validation | PASS | Direct POST: `{entry: "<script>", evil}` → **666** `{}`; `{entry: "bar", evil}` → **667** `{"entry":"bar"}`; `{entry: "GATE"}` → **668** `{}` |
| Console errors | PASS | Only the 3 intentional 400s from the API checks. Caveat: the built-in browser's console reader captures from its first call |

### CC-13 re-checks on the rebased build

| Item | Result | Evidence |
|---|---|---|
| Strip, Yes + spend | PASS | "Make it to Grain Traders?" → Yes → S$10-30: **620** eligible, **621** shown, **622** `yes` / `10_30` / `prompt`, journey `8e0da87a…` |
| Strip, No + reason | PASS | "Make it to Wang Cafe?" → No → No time: **662**, **663**, **664** `no` / `no_time`, journey `e162511a…` |
| "I'm here" | PASS | Bacha Coffee: spend chips inline → Under S$10 → "You're here ✓"; **624** `yes` / `checkin` / `lt_10`, `gap_minutes null` |
| Gate chip on live data | PASS | SQ194 gate E6, 4 min to board: "At Gate E6? Tap when you arrive". **629** `gate_prompt_shown` (E6, SIN-T2, 4); tap → **630** `gate_reached`; chip gone, bar not toggled |
| Refusals | PASS | Console: `first_session`, `no_candidate`, `capture_bar`, `no_journey`, `gap_below_min` as expected (see above) |
| API enums | PASS | `outcome: visited` → 400; reason with `yes` → 400; gate `<b>` → 400; mixed batch → 200, 1 inserted (**665**), `collection_open` rejected |

### Round 2 test rows (all `is_test = true`, env `preview`)

- Browser anons: `da25562b-2bf1-4ba6-94e1-5a36d138790b` (06:16 UTC part), `d0940990-19f0-42aa-a2b6-2d12cc65400c` (11:55 UTC part). Events from them: 56 rows, ids 612–669.
- journeys: `8e0da87a-1cba-4ec0-889b-73a42433756f`, `bb2ef728-8319-46fd-bb4e-37a2b313b2cb`, `5167b1e9-130a-4801-83f6-d17fea92f55f`, `e162511a-0920-4adc-9b8a-9a8a55fb15a4`.
- agent_interactions: `e23058ef-d74e-4497-a3d8-056ab99a9b44`.
- Also this run's: event **607** (`session_start {}`, anon `ddda47a0…` from round 1). The round-1 build's service worker answered `/robots.txt` with the app shell before I cleared it, so the app booted once; `tp_test` was still set, so the row is `is_test`.
- Not this run's: 608–611, 614–615 and the rest of 607–636 from other anons (other sessions' previews, e.g. `119de8d1…`). Production non-test rows at both watermarks: 0.

### Next (round 2)

1. When CC-6 is on `main`: rebase. Expected: `src/lib/telemetry.ts` merges on its own (CC-6 adds `telemetryIds()` after `init()`, away from CC-13's edits), and `tasks/lessons.md` needs the usual append-both.
2. Re-run the preview SMOKE, plus the checks for `telemetry.ts`: CC-13 events, CC-16 attribution, CC-18 `capture_opened`, and CC-6's chat telemetry ids. Also check a v3 `tp_journey_context` migrating to v4 with the CC-13 ledger intact (same `capturedAt`), and look again at the chat card glyphs.
3. Ask Todd before pushing anything to `main`.

## Gates

| Gate | Result | Evidence |
|---|---|---|
| G1 CC-7 applied | PASS | `information_schema.columns`: `events.journey_id` uuid, `events.env` text, `events.is_test` boolean; `journeys.inbound_arrival_utc` timestamptz, `journeys.connection_minutes` integer; `journeys.created_at` timestamptz. `list_migrations` includes `20261002184806`, `20261002191525`, `20261003055908` |
| G2 EVENT_TYPES mirrored | PASS | Same 11 entries in the same order at `src/lib/telemetry.ts:15-27` and `api/events.ts:43-55` (1 line lower than on 1 Oct, from the CC-7 import) |
| G3 path discovery | Reported, approved | See below |

G3 findings:
- a. `track(type, fields)` passes `payload` through untouched, and `journey_id` is read from `tp_journey_context` on every row. The default `minutes_to_boarding` is clamped to ≥ 0; an explicit value isn't clamped.
- b. `api/events.ts` rejects bad rows one at a time with HTTP 200 + `rejected[]`. An all-rejected batch also got 200.
- c. `JourneyData` has `journey_id` (v3), `gate`, `boardingTime`, `scheduledDeparture`, `departureTerminal` and `capturedAt`. `hasDeparted()` handles the AeroDataBox time format.
- d. The sticky slot is in `AppShell.tsx` (`MobileHeader`, `TopBar`), not `App.tsx`. The "flight-capture bar" is `FlightStatusBar`'s "Add your flight" empty state. `tp_onboarded` is the sessionStorage skip flag.
- e. No detail-open event exists. `AmenityDetailPage` emits only `amenity_detail_dwell`; `amenity_tapped` fires from 2 list surfaces.
- f. `events` has no FK to journeys, `event_type` is plain text, and anon/authenticated hold no privileges.
- g. `FlightStatusBar` shows `gate` as `'—'` when unknown, so the gate chip reads `journey.gate`.
- h. Save exists (the Bookmark toggle). There's no directions control anywhere in live code.

## Decisions and deviations

| # | What | Why |
|---|---|---|
| 1 | Optional `banner` prop on `AppShell`, rendered under the flight bar | The sticky slot lives there (G3-d) |
| 2 | The candidate is recorded in `AmenityDetailPage` after load and on save → true. No event added. `directions` stays in the enum, but nothing emits it | No detail-open event to reuse (G3-e); no directions control (G3-h) |
| 3 | Per-row rejection stays. A batch with **no** valid rows now gets 400 | A 400 on a mixed batch makes the client re-send its valid rows |
| 4 | Extra module `src/lib/lastSeen.ts`; extra key `tp_outcome_ledger` | Keeps the engine pure. The resume snapshot has to be taken before React mounts |
| 5 | `stops` includes `outcome_reason` | "went or not (and why)" |
| 6 | `outcome_eligible` is logged on resume when rules 1-5 and 8 pass. Rules 6 and 7 only gate display | Todd, 3 Oct |
| 7 | First-ever session = no `tp_last_seen` at boot | Todd, 3 Oct |
| 8 | The No step has no auto-close. A held answer is written, with the step-2 field null, on hide or unmount | The spec gives 8 s only for Yes; step 1 must never be lost |
| 9 | `gap_minutes` and `candidate_age_minutes` are minutes to 1 decimal | Debug gaps are seconds; 0 would read like a bug |
| 10 | (fix `fc1c91b`) Debug builds keep their own `console` reference | `vite.config.ts:177` uses terser `drop_console`, so no `console.*` call survives a build. Production bundle: 0 `[outcome]` strings |
| 11 | (fix `754c858`) A strip that mounts replays only a resume under 10 s old | The strip isn't mounted behind the full-screen capture. Without this, a resume that fired there replayed after the next capture, asking about the previous trip's venue against a fresh ledger |
| 12 | (fix `754c858`) `FlightProvider` computes `minutesToBoarding` on the first render too | It was effect-only. Children's mount effects run first, so the capture-bar rule could miss the departed state on a cold boot |

## Files

| File | Change |
|---|---|
| `src/lib/outcomePrompt.ts` | new: pure engine, 4 `UNCALIBRATED` constants plus the debug minimum, enums, payload types, gate-chip rule |
| `src/lib/candidateTap.ts` | new: `tp_outcome_candidate` and `tp_outcome_ledger` (versioned) |
| `src/lib/lastSeen.ts` | new: `tp_last_seen` writer, resume snapshots, debug flag and log |
| `src/components/OutcomePrompt.tsx` | new: strip, spend and reason chips, held-response hook |
| `src/components/AppShell.tsx` | `banner` slot |
| `src/App.tsx` | static import + `banner={<OutcomePrompt />}` |
| `src/pages/AmenityDetailPage.tsx` | candidate on load and save; "I'm here" with inline spend |
| `src/components/FlightStatusBar.tsx` | `GateChip`; `minutesToBoarding` on first render |
| `src/lib/telemetry.ts`, `api/events.ts` | 5 event types mirrored; outcome and gate validation; all-rejected → 400 |
| `supabase/migrations/20261003085434_journey_trail_views.sql` | 2 views, revoke, comments |
| `tests/outcome-eligibility.test.ts` | new, 20 tests |
| `tasks/lessons.md` | 3 lessons |

Untouched: `api/mcp.ts`, `api/lib/ranking.ts`, `api/lib/flightGrouping.ts`, `api/flights/board.ts`, `tp_journey_context` (no new field, so no schema_version bump).

## Migration `20261003085434_journey_trail_views`

- Dry-run of the trail view inside `begin … rollback` returned 0 rows. Applied with `apply_migration`; the file was renamed to the version the DB recorded.
- After apply, both views have `reloptions` = `security_invoker=on`. `has_table_privilege` for anon and authenticated is false for SELECT and for INSERT/UPDATE/DELETE/TRUNCATE/REFERENCES/TRIGGER. `obj_description` carries the sample-bias warning on both.
- Production read: `analytics_journey_trail` 0 rows, `analytics_journey_trail_k5` 0 rows.

## Smoke setup

- Built-in browser at 375×812, on the branch alias `terminal-plus-frontend-git-cc-13-413bc6-…vercel.app`.
- `localStorage.tp_test = '1'` was set on `/robots.txt` before the first app load.
- `?tp_gap_debug=1` on a build with `VITE_TP_DEBUG=1`, now set on **Vercel Preview only** (`vercel env ls`: Preview, added 3 Oct). The gap minimum was 20 s.
- The headless tab is often natively hidden, so background and resume were simulated by overriding `Document.prototype.visibilityState` and dispatching `visibilitychange`.
- Smoke journey: SQ322 SIN → LHR, gate B5, captured for real (`890716db-00da-41e9-8f1e-9110c1280cf3`).
- Test-only edits:
  - The ledger's `shown_count` was reset to 0 twice, so 5 strips fit one journey under the cap of 2.
  - `tp_journey_context.boardingTime` / `scheduledDeparture` were edited for AC-10, AC-13 and AC-16.
  - `tp_last_seen` was back-dated for AC-15.

## Acceptance

| AC | Result | Evidence |
|---|---|---|
| AC-1 strip names the amenity | PASS | Grain Traders opened from a collection, backgrounded 23 s, resumed. Strip "Make it to Grain Traders?" [Yes] [No] (x) under the flight bar (screenshot taken). Console: `eligibility true: all rules pass {gapMinutes: 0.4, candidateAgeMinutes: 0.1}` |
| AC-2 Yes | PASS | Row 307: `outcome yes`, `outcome_source prompt`, `amenity_slug grain-traders-jewel`, `journey_id 890716db…`, `gap_minutes 0.4` |
| AC-3 Yes + S$10-30 | PASS | Row 307 `spend_band 10_30` |
| AC-4 Yes, no chip for 8 s | PASS | Row 311 (Bacha Coffee): `outcome yes`, `spend_band null`. The strip closed itself |
| AC-5 No + No time | PASS | Row 318 (Sushi Tei): `outcome no`, `outcome_reason no_time` |
| AC-6 No, close step 2 | PASS | Row 323 (Apple Store): `outcome no`, `outcome_reason null` |
| AC-7 close at step 1 | PASS | Row 327 (Butterfly Garden): `outcome dismissed` |
| AC-8 cold kill on an iPhone | **BLOCKED** | No WebKit or iOS device here. Chromium stand-in passed: the page was backgrounded, fully reloaded while hidden, then made visible. Console `resume boot {candidate: sushi-tei-t3-new}`, `candidateAgeMinutes 0.4`, which is the pre-reload tap (the re-recorded one would read 0), proving the snapshot is taken before the page re-records. Strip shown, rows 316-318 |
| AC-9 "I'm here" | PASS | Row 329 (Fragrance Bak Kwa): `outcome yes`, `outcome_source checkin`, `spend_band lt_10`, `gap_minutes null`. UI shows "You're here ✓". A later 23 s resume: `eligibility false: already_asked`, no strip |
| AC-10 gate chip | PASS | Boarding set to +40 min: "At Gate B5? Tap when you arrive" rendered. Row 332 `gate_prompt_shown` (gate B5, SIN-T3, 40), exactly once. Tap → row 340 `gate_reached` (B5, SIN-T3, 40). The chip disappeared, the bar didn't toggle, and the chip was still gone after a reload. Also seen live on the first capture (SQ34, 15 min to board): row 243 `gate_prompt_shown` B8 |
| AC-11 gap under threshold | PASS | 5 s gap: console `eligibility false: gap_below_min {gapMinutes: 0.1}`, no strip |
| AC-12 collections only | PASS | Gate Essentials only, 23 s gap: `eligibility false: no_candidate {gapMinutes: 0.4}`, no strip |
| AC-13 capture bar | PASS | With "Add your flight…" showing: `eligibility false: capture_bar {candidateEligible: true}`, no strip, row 321 `outcome_eligible` (Apple Store). Bar restored, next resume: strip "Make it to Apple Store?", row 322 `outcome_shown` |
| AC-14 no re-ask | PASS | Same candidate after answering, 23 s gap: `eligibility false: already_asked`, no strip |
| AC-15 gap over 360 | PASS | `eligibility false: gap_above_max {gapMinutes: 361}`, no strip |
| AC-16 after departure | PASS (cold boot) | Departure set 25 min in the past, fresh candidate, 23 s gap, reload: the journey was cleared and the capture screen shown, with no strip and no chip. The warm path (departure passes while the app stays open) is covered by unit tests (rule 8 `departed`; gate chip `departed`) |
| AC-17 eligible never shown | PASS | Row 313 `outcome_eligible` (Kinokuniya): held by the cap (`eligibility false: cap_reached {candidateEligible: true}`), never shown |
| AC-18 trail with test rows | PASS | The view body from the migration file, both filters swapped for `true`, scoped to the smoke journeys: 1 row for `890716db`, `SIN → LHR`, eligible 6, shown 5, answered 5, yes 3, check-in 1. 6 stops in order: Grain Traders yes 10_30 → Bacha yes → Sushi Tei no/no_time → Apple Store no → Butterfly Garden dismissed → Fragrance Bak Kwa check-in lt_10. `gate_reached_minutes_to_boarding` 40. Production views: 0 rows |
| AC-19 k5 suppression | PASS | A `DO` block inserted 9 production journeys (5 to ZZA, 4 to ZZB) with `outcome_eligible`, plus yes on 3 ZZA and 1 ZZB, then raised an exception (always rolls back). Raw cells: ZZA 5 journeys, ZZB 4. k5 view: only `LHR → SIN → ZZA` / `90-180`, eligible 5, yes 3, `yes_rate 0.600`, `k_journeys 5`. Afterwards: 0 synthetic events, 0 synthetic journeys |
| AC-20 types, build, CI | PASS | `npx tsc --noEmit -p api/tsconfig.json`: 0 errors. `npm run build`: passes. `npx tsx --test tests/*.test.ts`: 37/37 (20 new). GitHub CI runs `37118388819`, `37118695571`, `37119421488`: success. A typecheck limited to the touched files shows the same errors as the base minus one (pre-existing unused imports only) |
| AC-21 report | this file | |

API checks against the preview (all with `x-tp-test: 1`):
- `outcome: 'visited'` → **400** `invalid outcome`.
- `outcome yes` with `outcome_reason` → **400**.
- `gate: '<b>'` → **400** `invalid gate`.
- A mixed batch (1 valid, 1 `candidate_type: collection_open`) → **200**, `inserted 1`, `rejected [{index 1, invalid candidate_type}]`.

## Findings outside CC-13

1. **The PWA serves a stale shell after a deploy, and route chunks then fail to load: blank screen.**
   - What happened: after the `754c858` deploy, the open tab ran `index-CqYhjW4t.js` (the previous build) from the workbox precache.
   - The server was already serving `index-DDbR0kbh.js`.
   - The old shell's lazy chunk `HomePage-Ducj4UhL.js` came back as `text/html` (the SPA fallback), and React unmounted to a blank page.
   - Cause: `vite.config.ts` uses `registerType: 'autoUpdate'` with no `vite:preloadError` handler.
   - This predates CC-13 and will hit production users holding an open or cached app on every deploy. It belongs with CC-8 (PWA).
2. Every preview is now a debug build (`VITE_TP_DEBUG=1` on Preview): `?tp_gap_debug=1` works and `[outcome]` logs print there. Production builds have neither.
3. This branch and the uncommitted CC-16 attribution work in the main checkout both edit `src/lib/telemetry.ts`, `api/events.ts` and `src/pages/AmenityDetailPage.tsx`. Whichever merges second rebases.

## Harness artifacts (test rows that aren't product behaviour)

- Rows 363/364 (journey `b0633dff`): `outcome_eligible`/`outcome_shown` for Cabin Bar. These came from the **stale `fc1c91b` shell** (finding 1) replaying an old resume after a capture, the case fix 11 removes. Re-run on the real `754c858` build: console `resume too old to replay on mount, waiting for the next one`, no strip.
- Rows 396/397 (journey `eae6ea1d`): `outcome_eligible`/`outcome_shown` for YOTELAIR. A real `visibilitychange` fired when the browser pane toggled, while the override still answered "visible", so it read as a resume with no hidden step before it. Real browsers fire "visible" only after "hidden".
- Row 398 (journey `eae6ea1d`, `api-check-venue`): the valid half of the mixed-batch API check.

## Smoke row ids (all `is_test = true`, `env = preview`; the analytics views already exclude them)

- anon_ids: `a73f77be-362a-4b66-9f49-428467a2e7c2` (first preview origin), `ddda47a0-b0e6-47dc-9adf-1d07a1347efa` (branch alias).
- journeys (5):
  - `0bab26c1-2933-41d8-badc-00eb0c983b8f` (SQ34)
  - `d1fe7a3d-2445-424f-bdc2-54b7733c17ca` (SQ322, first origin)
  - `890716db-00da-41e9-8f1e-9110c1280cf3` (**smoke journey**)
  - `b0633dff-9203-437a-b04c-6b13f121b80f`
  - `eae6ea1d-fa64-42ac-8227-37ccfc6e5b93`
- events (84): 242-250, 260-267, 294-348, 363, 364, 389-398.

## Rollback

- Views: `drop view if exists public.analytics_journey_trail_k5, public.analytics_journey_trail;` (nothing else depends on them).
- Code: don't merge the branch, or revert its 3 commits. `api/events.ts` then accepts none of the 5 types again, and the all-rejected status goes back to 200.
- Env: `vercel env rm VITE_TP_DEBUG preview`.

## Next

1. Todd: go or no-go to fast-forward `main` after a production-style check of the merged tree. CC-16's overlapping edits land first or after, rebased.
2. AC-8 on a real iPhone home-screen install (cold kill, reopen past 12 min).
3. CC-8: handle `vite:preloadError` (reload once) or switch the SW to prompt-on-update, so a deploy can't blank an open app.
4. Calibrate the 4 `UNCALIBRATED` constants once `gap_minutes` and `candidate_age_minutes` have production volume.
