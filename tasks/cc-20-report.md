# CC-20 report: crawler visits are stored but flagged, and the analytics views leave them out

**Status: SHIPPED 6 Oct 07:13 UTC (`adc551a`, `dpl_2i7boFFFAMFPyDYimenEYWdD3ETm`);
production checks PASS. Migration `20261005180720` applied 5 Oct. In production a
Googlebot agent stores `is_bot = true` and an iPhone Safari agent `false`, on both
routes. Preview PASS and SMOKE 13/13 (5 Oct). Rollback target:
`dpl_3cetFfttKhU3j7Gv6XY53WC6kg3G` (`1e77134`); the column stays (see Rollback).**

Run: 5 Oct 2026. Worktree `~/tp-cc-20`, branch `cc-20/crawler-flag` off `1e77134`.
Commits `61415e7` (migration), `6d21c40` (routes). Preview alias
`…-git-cc-20-ca1921-…`, READY, sin1.

## Why

The first 8 non-test production events (5 Oct, 02:38–03:02 UTC) came from 4 fresh
browsers, each landing on a sitemap URL (`/vibe/comfort`,
`/collection/quick/grab-and-go`, `/collection/discover/jewel-experience`,
`/collection/chill/peaceful-corners`) with no referrer, no UTM, 1 impression and no
taps. That fits a crawler that runs JavaScript. Vercel's runtime logs keep no user
agent, so it can't be confirmed after the fact. GA4 filters known bots; our tables
didn't, so every analytics view counted them as visitors.

## Gates

| Gate | Result | Evidence |
|---|---|---|
| G1 the 8 rows | PASS | `env = 'production' and not is_test` = exactly events 776, 777, 778, 779, 784, 785, 823, 824 (4 anons, no `journey_id`, no `ref_host`/`utm`); re-checked just before applying. `journeys` and `agent_interactions`: 0 production non-test rows. Todd confirmed they weren't his |
| G2 writers | PASS | Only `api/events.ts` and `api/journey.ts` insert into these tables (service role). `src/pages/plan-journey.tsx` is dead and anon holds no grants. MCP writes `agent_interactions` only. Edge functions `saveJourney` and `log-emotion` are still ACTIVE (see Notes) but can't write these tables |
| G3 views | PASS | 16 views, all `security_invoker=on`, 0 client grants. Dependents: each `_k5` on its base only; no functions. 3 views carry comments. No code reads any view |
| G4 crawler list | PASS | `isbot` 5.2.2: Unlicense, 0 dependencies, 49 KB, CommonJS `require` export and types, released about monthly (latest 27 Aug 2026), ~34M downloads a week, 2 maintainers |

## Decisions

1. `isbot` lives in its own module, `api/lib/crawler.ts`, imported only by the two
   telemetry routes. `api/lib/telemetryEnv.ts` is also imported by `api/chat.ts` and
   MCP's `api/lib/agentTelemetry.ts`, so the list stays out of those bundles. The app
   bundle is unchanged (same `index-um99xWy9.js` as production; 0 `isbot` strings).
2. A missing or empty User-Agent counts as a bot. `isBot('')`, `isBot(undefined)` and
   `isBot(null)` all return `false`, so the helper decides it explicitly. Every browser
   sends an agent, `sendBeacon` included.
3. Views were dropped and recreated (house style, CC-7 and CC-13), 13 of them: the 5
   base views that read `events` and their `_k5`, `analytics_acquisition`,
   `analytics_journey_trail` and its `_k5`. `analytics_agent_tool_volume` and its
   `_k5` read only `agent_interactions` (out of scope, no `is_bot`) and are untouched;
   in `analytics_surface_parity` only the `events` side is filtered.
4. Backfill inside a `do` block that aborts unless exactly 8 rows change.
5. Migration before code: old code doesn't send `is_bot`, and the default `false`
   keeps it writing. Rollback is the reverse order (code first, then the column).

## Changes

| File | Change |
|---|---|
| `supabase/migrations/20261005180720_crawler_flag.sql` | `is_bot boolean not null default false` on `events` and `journeys` with column comments; backfill of the 8; 13 views dropped and recreated with `and not is_bot`, `security_invoker = on`, `revoke all` from anon and authenticated, 3 comments restored; rollback SQL in the header |
| `api/lib/crawler.ts` | new: `isBotRequest(headers)`. Reads `user-agent` (first value if an array), empty → true, else `isBot(ua)`. The string is never returned, stored or logged |
| `api/events.ts` | `is_bot` stamped next to `env` and `is_test`; `StampedEventRow` gains it |
| `api/journey.ts` | the journey row gets `is_bot` |
| `package.json`, `package-lock.json` | `isbot` ^5.2.2 (the lock gains only that package) |

## Database checks (after applying)

`apply_migration` recorded version `20261005180720`; the file is named to match.

| Check | Result |
|---|---|
| Columns | `events.is_bot` and `journeys.is_bot`: `boolean`, not null, default `false`, comment present |
| Backfill | `is_bot` rows = exactly 776, 777, 778, 779, 784, 785, 823, 824; production non-test non-bot events = 0 |
| `security_invoker` | `{security_invoker=on}` on all 16 views |
| Client privileges | `has_table_privilege` false for anon and authenticated on all 7 privileges (SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER), all 16 views |
| Filter | The 8 views that read the tables mention `is_bot`; the 5 base-view `_k5` inherit it |
| Nothing else changed | Before applying, the md5 of every `pg_get_viewdef` and comment was recorded. After applying, stripping the new ` AND NOT <alias>.is_bot` predicates (and the `events.is_bot` column that `analytics_funnel`'s `select *` CTE now carries) gives back the exact pre-migration md5 for all 13 recreated views; the 3 comments' md5 are unchanged; `analytics_agent_tool_volume` (+`_k5`) are byte-identical |
| Acceptance | `analytics_acquisition`: 0 rows. `analytics_funnel`: 0 rows. `analytics_journey_trail`: 0 rows |

## Local checks (`6d21c40`)

| Check | Result |
|---|---|
| `npx tsc --noEmit -p api/tsconfig.json` | exit 0 |
| `isBotRequest` cases (tsx) | 13/13: Googlebot (mobile and classic), Bingbot, HeadlessChrome, curl → true; iPhone Safari, Android Chrome, desktop Chrome, an iPad home-screen web app (no "Safari" token) → false; missing, empty, whitespace → true; an array agent uses its first value |
| Reachable-file typecheck (51 files from `src/main.tsx`) | 34 errors, the identical set to main |
| `npm run build` | exit 0; entry `index-um99xWy9.js` (same as production); `isbot`/`googlebot` strings in the app bundle: 0 files |
| `npm run test:adversarial` | 11/11 |

## Preview `dpl_8zqtSeeby5buJ3FfwDf9LTUGuXTV`

Watermark: events id > 969, 18:10:14 UTC. Every request carried `x-tp-test: 1`
(browser runs through the `tp_test` switch, which sends the header and the body flag).

| Check | Result | Evidence |
|---|---|---|
| `POST /api/events`, Googlebot agent | PASS | event **970** `is_bot = true` |
| `POST /api/events`, iPhone Safari agent | PASS | event **971** `is_bot = false` |
| `POST /api/journey`, Googlebot agent | PASS | journey `e64b96ab-2f65-4f2f-bf8a-4d29eac048b0` `is_bot = true` |
| `POST /api/journey`, iPhone Safari agent | PASS | journey `cfb27353-33ff-4366-a71a-f1bd97b650fb` `is_bot = false` |
| A real browser isn't flagged | PASS | The browser pane's agent (`… Claude/2.19675.0 Chrome/152 … Safari/537.36`): `isBot` false, no match; all 35 SMOKE events and 3 journeys `is_bot = false` |

### SMOKE (`tasks/release-2026-09-report.md`), 18:10–18:14 UTC (02:10 SGT), 375×812, TZ Asia/Jerusalem

| # | Line | Result | Evidence |
|---|---|---|---|
| 1 | `/` capture gate | PASS | Fresh storage: "What brings you to Changi?", Departing / Connecting / Just landed / Skip |
| 2 | Skip | PASS | Home with "Add your flight for personalised recommendations"; journey `fa8a8ca0-c4cb-4c10-a1e2-bb7fdfed52a9` `skipped` |
| 3 | Typed QF1 | PASS | Departing → T1 → Enter manually → QF1 → "Terminal T1 · Boards 22:45 → LHR" → Looks right. Bar "20h 33m to board · On Time, QF1 · SIN → LHR, T1"; `schema_version: 4`, `typed` |
| 4 | Board picker | PASS | 79 board rows; QR945 → "26 min to board · On Time, QR945 · SIN → DOH, T1"; `picker` |
| 5 | Home: 7 vibe rows | PASS | Comfort, Chill, Quick, Refuel, Explore, Shop, Work; 31 images, 0 broken; 32 cards with a count |
| 6 | `/vibe/refuel` | PASS | "7 spots across all terminals" |
| 7 | Collection, amenity, search | PASS | coffee-worth-walk "7 of 7 spots"; grain-traders-jewel renders with "More like this"; "laksa" → Kopitiam (T1) |
| 8 | Change flight → Keep QF1 | PASS | "Change flight" heading, "Keep QF1" once; `tp_journey_context` byte-identical afterwards (`capturedAt` 18:11:55.494Z) |
| 9 | Non-Singapore TZ follows SGT | PASS | Local 21:12 (inside 11:00–22:00), SGT 02:12: Grain Traders shows **Closed** |
| 10 | Chat | PASS | `POST /api/chat` 200: "You're in T1, and your boarding is a long way off (22:45 tonight) … It's just after 2am"; row `59ad53bd-a4d4-4ca9-9a2a-ead65f83eed9`, `claude-sonnet-5-5` |
| 11 | MCP | PASS | `smoke-cc20-202610051813`: initialize 200 `2025-03-26` `terminal-plus`; tools/list 4; `get_recommendations {refuel, SIN-T1}` → 7. Row `1f798f9d-e475-4582-ae33-b2f89893788f` |
| 12 | Recent events | PASS | `session_start`, `recommendation_impression`, `capture_opened`, `search_performed`, `amenity_detail_dwell`, `flight_not_found` |
| 13 | Typed journeys row | PASS | Exactly 1: `93be204c-ab52-4327-beed-f11b12a77559`, QF1, typed |

## Test rows (all `is_test = true`, env `preview`)

| Run | anon | events | other |
|---|---|---|---|
| POST, Googlebot | `71a396dd…` | 970 (`is_bot`) | journey `e64b96ab-2f65-4f2f-bf8a-4d29eac048b0` (`is_bot`) |
| POST, iPhone Safari | `579e0269…` | 971 | journey `cfb27353-33ff-4366-a71a-f1bd97b650fb` |
| SMOKE 1, 2, 5 | `14abf5b0…` | 972–975, 977–979, 981, 982 | journey `fa8a8ca0-c4cb-4c10-a1e2-bb7fdfed52a9` |
| SMOKE 3, 6–10 | `ac8218a1…` | 976, 980, 983–997 | journey `93be204c-ab52-4327-beed-f11b12a77559`; chat `59ad53bd-a4d4-4ca9-9a2a-ead65f83eed9` |
| SMOKE 4 | `62687ebc…` | 998–1006 | journey `d529103f-2a2c-4286-a1a1-d47e55721707` |
| SMOKE 11 | | | MCP `1f798f9d-e475-4582-ae33-b2f89893788f` |

0 untagged; no other rows since the watermark.

## Notes

- **What `is_bot` can't catch.** isbot matches crawlers that say what they are. A bot
  posing as a normal browser stays `is_bot = false`. Whether the 5 Oct crawler
  announced itself is unknown (no agent was logged), so a repeat visit may or may not
  be flagged. Sessions with 1 impression, no tap and no referrer remain the tell.
- **Headless Chrome is a bot.** Puppeteer runs (`HeadlessChrome`) now store
  `is_bot = true` as well as `is_test`; both keep them out of the views.
- **Edge functions still ACTIVE.** `saveJourney` (v9) and `log-emotion` (v4) still show
  ACTIVE in `list_edge_functions` on 5 Oct; the 3 Oct deletion didn't happen. Neither
  can write these tables today (`saveJourney` uses the anon key, which has no
  privileges; `log-emotion` targets a table that doesn't exist).
- **Rollback.** Code first (Vercel instant rollback), then the SQL in the migration
  header. Dropping the column while this code is live would fail every insert.

## Ship

1. Todd's go; pushed `1e77134..adc551a` to main (6 Oct 07:13 UTC). CC-17 hadn't
   landed, so no rebase was needed; CC-17 now rebases onto `adc551a`.
2. Production, below.

## Production (6 Oct)

`dpl_2i7boFFFAMFPyDYimenEYWdD3ETm` (`adc551a`) READY, sin1, aliased to
terminalplus.app. G1 before the push: production `dpl_3cetFfttKhU3j7Gv6XY53WC6kg3G`
(`1e77134`) = main. Watermark: events id > 1191, 07:14:25 UTC.

| Check | Result | Evidence |
|---|---|---|
| App unchanged | PASS | `index-um99xWy9.js` before and after; `sw.js` byte-identical (same checksum as CC-19's), so no open tab is offered an update |
| `POST /api/events` + `/api/journey`, Googlebot agent, `x-tp-test: 1` | PASS | event **1192** and journey `10b611c7-b58b-42b8-ae61-3b31d1c2fb63`: `env = production`, `is_test`, `is_bot = true` |
| Same, iPhone Safari agent | PASS | event **1193** and journey `10924eee-a539-4e5c-83f2-97ea3cb08331`: `env = production`, `is_test`, `is_bot = false` |
| Views | PASS | All 4 rows are `is_test`, so no view counts them |

**Two unclassified visits.** After the preview checks and before this deploy, two
production sessions landed on `/` and saw the capture screen (`session_start` +
`capture_opened`, no referrer, no UTM, no journey): anon `02b9416e…` (events 1007,
1009; 5 Oct 19:35 UTC) and anon `960d712d…` (events 1010, 1011; 6 Oct 01:14 UTC). The
old code wrote them, so `is_bot` is the default `false` and their agent is unknown.
`analytics_acquisition` and `analytics_funnel` each show them as 2 direct sessions on
6 Oct (SGT); they were at 0 rows when checked on 5 Oct 18:07–18:14 UTC, before these
visits. Not flagged by guess. From now on the route classifies every visit.
