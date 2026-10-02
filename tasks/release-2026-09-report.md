# Release 2026-09 (CC-1F): report

**Status: SHIPPED. Preview SMOKE 13/13 PASS, production SMOKE 13/13 PASS. Day zero: 2026-10-02 08:04:28 UTC.**

`origin/main` = `e0b9e60dac31c7a9ff719ccde267ad2fcd30d8ea` = the production deployment sha (`dpl_923EJGizc8BczThKspLMaqTFgCyD`). No rollback was needed.

Run date: 2026-10-02. Release head: `e0b9e60dac31c7a9ff719ccde267ad2fcd30d8ea`.
Production before the push: `dfd494e`. Rollback target: `dpl_32TTLN1DCmuZjEMJxPpVvimRbcEd` (READY, `dfd494e`, built 2026-09-29 06:47 UTC).

## Gates

| Gate | Result | Evidence |
|---|---|---|
| G1 fetch + heads | PASS | `git fetch origin` ok on try 1. `origin/main` = `dfd494eaf5cf`, `origin/release/2026-09` = `e0b9e60dac31` (as expected). Local `main` `525bb90` and `origin/main` are both ancestors of the release head (`git merge-base --is-ancestor`), so `--ff-only` works. `origin/main..origin/release/2026-09` = 42 commits |
| G2 production env names | PASS | `vercel env ls`, names and targets only. Production has `SUPABASE_URL`, `VITE_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `VITE_SUPABASE_ANON_KEY`, `ANTHROPIC_API_KEY`, `CRON_SECRET`, `AERODATABOX_API_KEY`. Preview has all of these except `SUPABASE_URL` (it has `VITE_SUPABASE_URL`) |
| G3 Supabase | PASS | `get_project bpbyhdjdezynyiclqezy`: `ACTIVE_HEALTHY` |

G2 note: inside the agent sandbox, `vercel env ls` hung on `GET api.vercel.com/v9/projects/…` (seen with `--debug`). The Vercel connector's env listing returned `403 forbidden`. The CLI succeeded once run outside the sandbox. No values were printed.

Other pre-checks:
- `backup/pre-cleanup` and tag `pre-cleanup-2026-08-20` both point to `8658179`, an ancestor of the release head. Pushing them publishes no new content. Neither is on origin yet (`git ls-remote`).
- No `release-*` tag exists on origin.

## Preview SMOKE

Preview: `dpl_AQsPsED4G2WphmJdk78swbXTDQtV`, `terminal-plus-frontend-nva4tjad6-todds-projects-d0181971.vercel.app`, sha `e0b9e60`, region sin1 (`get_deployment`).
Browser: the built-in browser emulating 375x812, browser TZ a non-Singapore zone (UTC+3). Window: 2026-10-02 07:42:37 to about 07:55 UTC.

| # | Line | Result | Evidence |
|---|---|---|---|
| 1 | `/` capture gate shows | PASS | With storage cleared: heading "What brings you to Changi?" and Departing / Connecting / Just landed / Skip |
| 2 | Skip works | PASS | Skip lands on Home ("Add your flight for personalised recommendations"). journeys row `flight_source='skipped'`, `onboarding_skipped=true` |
| 3 | Typed QF1 works | PASS | Departing → T1 → "Enter manually" → `QF1` → "Terminal T1 · Boards 22:45 → LHR" → Looks right. Flight bar: "7h to board · On Time, QF1 · SIN → LHR, T1". `tp_journey_context` has `schema_version: 2`, `flight_source: "typed"` |
| 4 | Board picker works | PASS | The live board loaded 156 departures (`flight_not_found` payload `board_size: 156`). Fresh session: picked KL835 → flight bar "36 min to board · On Time, KL835 · SIN → DPS, C22, T1". journeys row `flight_source='picker'` |
| 5 | Home: 7 vibe rows with photos and counts | PASS | Rows: Explore, Shop, Refuel, Chill, Quick, Work, Comfort. 31 of 31 images loaded, 0 broken. 32 of 40 cards show "N spots". 8 show no count because `count` is null (`HomePage.tsx:200` renders the count conditionally) |
| 6 | `/vibe/refuel`: 7 items | PASS | "7 spots across all terminals": Kopitiam (T1), T2 Food Gallery, Fossa Chocolate, Grain Traders, Kélé, Wang Cafe (Jewel), TWG Tea (T4) |
| 7 | 1 collection, 1 amenity, 1 search | PASS | `/collection/refuel/coffee-worth-walk`: "7 of 7 spots". `/amenity/grain-traders-jewel` renders (Open, $$, hours, more like this). `/search` "laksa" returns Kopitiam (T1) |
| 8 | Flight bar: tap → Change flight → "Keep QF1" backs out unchanged | PASS | The tap opens the bar ("Hide flight details", "Change flight"). The change screen is headed "Change flight", and "Keep QF1" appears once. After "Keep QF1", `tp_journey_context` is identical (`capturedAt` still `07:45:13.264Z`) and still exactly 1 typed journeys row |
| 9 | Non-Singapore TZ: hours follow SGT | PASS | Browser `Intl` TZ non-Singapore (UTC+3), local 10:46, SGT 15:46. Grain Traders, hours `11:00-22:00`, shows **"Open · Until 22:00"**. A local-time reading would show it closed |
| 10 | Chat: 1 question returns amenities and uses the flight | PASS | "Where should I get coffee before my flight?" → `POST /api/chat` 200 (pinned `claude-sonnet-4-5-20250929` still answers). Reply: "You've got plenty of time!… before your evening boarding". Cards: Starbucks, Toast Box, Crystal Jade Go, all `SIN-T1`. `context.terminal = "SIN-T1"` comes from QF1 |
| 11 | MCP initialize, tools/list, tools/call | PASS | `initialize` → 200, protocolVersion `2025-03-26`, serverInfo `terminal-plus`. `tools/list` → 4 (`get_airport_context`, `get_recommendations`, `get_disruption_status`, `get_route`). `get_recommendations {"vibe":"refuel","terminal":"SIN-T1"}` → 7 recommendations |
| 12 | SQL: last-15-min events include session_start and recommendation_impression | PASS | `session_start` 4, `recommendation_impression` 2, plus `vibe_selected`, `amenity_tapped`, `amenity_detail_dwell`, `search_performed` and `flight_not_found` (1 each) |
| 13 | SQL: typed path wrote 1 journeys row with `flight_source='typed'` | PASS | `a4957801-2324-4bfb-9730-35c230274248`: `flight_number='QF1'`, `flight_source='typed'`, `journey_type='departing'`, `destination='LHR'`, `departure_time=2026-10-02 15:20+00`, `device_timezone` = the browser's non-Singapore zone |

Lines 1 to 4 are the four checks under "/" in the prompt. Line 7 covers three. All 13 are listed so each has its own evidence.

## Smoke row ids, preview (CC-7 marks these is_test)

| Table | Ids |
|---|---|
| events | 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86 (anon_ids `90721b21-41f1-4ae6-b522-31b88adf83f2`, `54c3d5a2-eb22-4b62-884c-8ce14ec70e78`, `f2cbfee1-91d2-4952-a3c4-8d157c22efc5`, `cb6fe790-92bc-4902-b4ad-2dd542b3746e`) |
| journeys | `e2c78ae6-c283-4216-bdb4-27aff7df5361` (skipped), `a4957801-2324-4bfb-9730-35c230274248` (typed), `15c3ee8d-acba-41fe-9e4a-490200f689ac` (picker) |
| agent_interactions | `88510675-7e5c-4646-bc51-ed7ecdf4dcf3` (MCP `get_recommendations`, `mcp_session_key='smoke-cc1f-20261002'`) |

Baseline before the run: `max(events.id) = 75`, and 0 rows in the previous hour in all three tables.

## Observations (not SMOKE failures)

- Chat cards show the first character of `opening_hours`: Starbucks shows `{`, Toast Box shows `0`. `ChatPanel.tsx:309` runs `Object.values()` over a string. The same code is on `dfd494e`, so this is not a regression.
- Chat replies render markdown literally (`**Starbucks**`).
- The chat question wrote no `agent_interactions` row. Only the MCP call did.
- `flight_not_found` fires when "Enter manually" is tapped (`board_size: 156, filter_length: 0`). That's a "not on the board" signal, not a lookup failure. Read it that way in CC-10.
- On the capture step, the T1 to T4 terminal buttons have no accessible name.
- The `/vibe/refuel` and MCP refuel picks for a T1 departure include 4 Jewel venues of 7. This is the known time-to-boarding and terminal gap (CC-5), not new.
- Toast Box (`sin-t1-toast-box-…`, T1) has a `review_highlight` about Jewel. Its `google_place_id` may point at the Jewel outlet.
- The departures board lists AK710 at 13:35 when SGT was about 15:50.

## Production

### Ship

- `tasks/lessons.md` differed between `main` and the release and carried an uncommitted edit, so it was stashed alone (`git stash push -- tasks/lessons.md`), then `git checkout main && git merge --ff-only origin/release/2026-09` (`525bb90..e0b9e60`, fast-forward), then `git stash pop`.
- `git push origin main` at 08:03:37 UTC: `dfd494e..e0b9e60  main -> main`. `git ls-remote`: `refs/heads/main` = `e0b9e60dac31…`.
- Vercel: `dpl_923EJGizc8BczThKspLMaqTFgCyD`, target production, sha `e0b9e60`, region sin1. Created 08:03:44.585, **READY 08:04:28.232 UTC**. Aliases: `terminalplus.app`, `www.terminalplus.app`, `terminal-plus-frontend.vercel.app` and 2 more. `aliasError: null`.
- Rollback target, confirmed as the newest READY production deployment before the push: `dpl_32TTLN1DCmuZjEMJxPpVvimRbcEd` (`dfd494e`). Not used.

### Production SMOKE (https://terminalplus.app)

Same browser and viewport, same non-Singapore TZ (UTC+3). Production serves `assets/index-e0XT9YYJ.js` and `assets/sgTime-BVLJl-zq.js`, the same hashed bundles as the preview. Window: 08:06:44 to about 09:07 UTC. The run paused for about 50 min after line 5.

| # | Line | Result | Evidence |
|---|---|---|---|
| 1 | Capture gate shows | PASS | With storage cleared: "What brings you to Changi?" and the 3 options plus Skip |
| 2 | Skip works | PASS | Lands on Home. journeys `flight_source='skipped'` |
| 3 | Typed QF1 works | PASS | T1 → Enter manually → `QF1` → "Terminal T1 · Boards 22:45 → LHR" → Looks right. Bar: "5h 42m to board · On Time, QF1 · SIN → LHR, T1". `tp_journey_context.flight_source = "typed"`, `schema_version: 2` |
| 4 | Board picker works | PASS | The board loads live (`AERODATABOX_API_KEY` works in Production). Fresh session: CA826 → bar "BOARDING NOW, CA826 · SIN → PVG, C23, T1". `flight_source: "picker"` |
| 5 | Home: 7 vibe rows, photos, counts | PASS | Explore, Shop, Refuel, Chill, Quick, Work, Comfort. 31 of 31 images loaded, 0 broken. 32 of 40 cards show counts |
| 6 | `/vibe/refuel`: 7 items | PASS | "7 spots across all terminals": the same 7 as the preview |
| 7 | 1 collection, 1 amenity, 1 search | PASS | `/collection/refuel/coffee-worth-walk` "7 of 7 spots". `/amenity/grain-traders-jewel` "Open · Until 22:00". `/search` "laksa" returns Kopitiam (T1) |
| 8 | Flight bar → Change flight → "Keep QF1" | PASS | The change screen is headed "Change flight" and "Keep QF1" appears once. After backing out, `capturedAt` and `lastUpdated` are still `09:03:15.369Z` |
| 9 | Hours follow SGT | PASS | Deployed `sgTime-BVLJl-zq.js` exports return hour **17**, minute-of-day **1024** and date `2026-10-02`, while device `getHours()` = **12** (UTC+3). Home reads "Evening picks", where local time would give "Afternoon" (`HomePage.tsx:66-69`). At this hour no venue's open state differs between SGT and UTC+3: SQL found no `HH:MM-HH:MM` boundary between 12:10 and 17:00. The direct open/closed proof is preview line 9, from a byte-identical chunk |
| 10 | Chat: amenities + entered flight | PASS | `POST /api/chat` 200, so no 401 and the Production key is valid. "You've got plenty of time—there are some great coffee options in T1!" Cards: Starbucks, Toast Box, dnata Lounge, Crystal Jade Go, Koi Thé, all T1 |
| 11 | MCP | PASS | `initialize` 200 (`terminal-plus`, `2025-03-26`). `tools/list` 4. `get_recommendations` refuel/SIN-T1 → 7 |
| 12 | SQL: last-15-min events | PASS | At 09:06:55 UTC: `session_start` 2, `recommendation_impression` 2, `amenity_tapped` 1, `search_performed` 1 |
| 13 | SQL: 1 typed journeys row | PASS | `b82f4c08-a2fa-4251-ac28-b0c15858540e`, `flight_number='QF1'`, `flight_source='typed'` |

### Smoke row ids, production (CC-7 marks these is_test)

| Table | Ids |
|---|---|
| events | 87, 88, 89, 90, 91, 92, 93, 94, 95, 96 (anon_ids `ec2f35c3-ee9c-4a46-b44e-7ab1b9afc0bb`, `617704cb-3b3c-4393-93bc-9352075ac1a0`, `88b5e728-12f2-43a7-a42d-0931ba796663`, `3ae26a02-6ee5-406a-bcda-9ab7a81fa67f`) |
| journeys | `37c90366-1645-4a67-9f55-ef1be8f26447` (skipped), `b82f4c08-a2fa-4251-ac28-b0c15858540e` (typed QF1), `968fd649-bbaf-4d6b-bab6-e80e305ba2e5` (picker CA826) |
| agent_interactions | `ef3500bd-fb4a-4d37-82bd-b0b3bac54b3d` (MCP `get_recommendations`, `mcp_session_key='smoke-cc1f-prod-20261002'`) |

Combined with the preview rows, the CC-7 sweep is: events 76 to 96, 6 journeys rows and 2 agent_interactions rows. Baseline before production: `max(events.id) = 86`.

### Refs and tags

```
$ git push origin backup/pre-cleanup refs/tags/pre-cleanup-2026-08-20
 * [new branch]      backup/pre-cleanup -> backup/pre-cleanup
 * [new tag]         pre-cleanup-2026-08-20 -> pre-cleanup-2026-08-20
$ git push origin refs/tags/release-2026-10-02
 * [new tag]         release-2026-10-02 -> release-2026-10-02
$ git ls-remote origin ...
865817957c2e…  refs/heads/backup/pre-cleanup
e0b9e60dac31…  refs/heads/main
865817957c2e…  refs/tags/pre-cleanup-2026-08-20
336b06f7cd5c…  refs/tags/release-2026-10-02
e0b9e60dac31…  refs/tags/release-2026-10-02^{}
```

`release-2026-10-02` is an annotated tag on `e0b9e60`.

### Day zero

**2026-10-02 08:04:28 UTC**: `dpl_923EJGizc8BczThKspLMaqTFgCyD` READY on `terminalplus.app`. Corridor behaviour data counts from here. Exclude the smoke rows above.

## Acceptance

- [x] `origin/main` == release head (`e0b9e60`), and the production deployment sha == `origin/main`
- [x] Every SMOKE line is PASS (13/13 preview, 13/13 production)
- [x] Every smoke row id is listed for the CC-7 is_test sweep (preview and production)
- [x] Day zero recorded
