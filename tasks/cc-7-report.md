# CC-7 Telemetry hygiene: report

**Status: DONE. Both migrations are applied. CC-7 is live in production (`ccdee5c`, `dpl_6rYas4hNg7EPU3ufd96MBneJvhfD`, READY 2026-10-02 19:09:25 UTC). Production SMOKE 13/13 green. The env backfill found 0 rows.**

Run date: 2026-10-02. Branch `cc-7/telemetry-hygiene` = `ccdee5c`, fast-forwarded into `main`. Preview `dpl_44vTRWKgY8ajR9ee5eJ7t6ghdpUH`.

**Day zero: 2026-10-02 08:04:28.232 UTC**, the CC-1F production READY time (`dpl_923EJGizc8BczThKspLMaqTFgCyD`, from `tasks/release-2026-09-report.md`).

## Gates

| Gate | Result | Evidence |
|---|---|---|
| CC-1F done, production sha == origin/main, day zero recorded | PASS | origin/main = `40ec948` = production `dpl_DwvtuGCp6nzDwbwD8jVNk22dka4a` (docs-only on `e0b9e60`). Day zero is in the release report |
| Castability: non-uuid `anon_id`/`session_id` | PASS | `count(*) where anon_id !~* … or session_id !~* …` = **0** of 28 (10 rows have null ids, which cast fine) |
| No view or policy depends on `journeys.anon_id`, `session_id` or `created_at` | PASS | `pg_depend`→`pg_rewrite`: no dependent views. 7 journeys policies, all on `user_id`. No triggers. DB `TimeZone` = UTC, `created_at` default `now()` |
| `api/journey.ts` only writes uuid-shaped ids | **FAIL as written → fixed in code; cast deferred** | `api/journey.ts:108-109` stored `str(j.session_id, 64)` / `str(j.anon_id, 64)`, any string up to 64 chars. Clients only ever send `crypto.randomUUID()` (`src/lib/telemetry.ts:86,100`; the old `eventLogger.ts` on `dfd494e` did the same), but nothing enforced it. Todd's call: null non-UUID ids server-side, and move the uuid cast to migration 2, after that code is live in production |
| STOP AND ASK: rows from day zero to the migration | 0 non-smoke | At 18:46 UTC: events 10 (all CC-1F smoke, 87–96), journeys 3 (all smoke), agent_interactions 1 (smoke). **0 non-smoke rows** in each table. Todd: backfill `env='production'` on non-smoke rows from day zero onward, now and again once CC-7 code is live |

## Decisions (Todd, 2 Oct)

1. Env backfill: yes, in migration 1 and again after the CC-7 production deploy.
2. UUID gate: split the cast. `journey.ts` nulls non-UUID ids, and the cast is migration 2.
3. MCP `is_test`: `mcp_session_key` starting `smoke-` or `test-`. `api/mcp.ts` untouched.
4. Manual smoke: `localStorage.tp_test = '1'` sends `x-tp-test: 1`.

## Migration 1: `supabase/migrations/20261002184806_telemetry_hygiene.sql`

The DB recorded it as version `20261002184806` (`list_migrations`), and the file was renamed to match.

The full script was first dry-run inside `begin … rollback`. A follow-up query confirmed nothing persisted (the new columns were absent and `created_at` was still naive). Then it was applied with `apply_migration`. Verified after apply:

| Check | Result |
|---|---|
| New columns (`information_schema.columns`) | events and agent_interactions: `env text not null default 'unknown'`, `is_test boolean not null default false`, `journey_id uuid`. journeys: `env`, `is_test`, `inbound_arrival_utc timestamptz`, `connection_minutes integer` |
| `journeys.created_at` | `timestamp with time zone` |
| `journeys.anon_id` / `session_id` | still `text` (migration 2) |
| Test flags | events 52/52, journeys 28/28, agent_interactions 13/13 `is_test` |
| Env backfill (non-test rows ≥ day zero) | 0 rows updated in each table |
| Indexes | `events_journey_idx`, `events_env_time_idx` present |
| `analytics_funnel` (production) | **0 rows**. `analytics_funnel_k5`: 0 rows |

### Views, before and after

| | Before | After |
|---|---|---|
| `analytics_*` | 6, `security_invoker=on`, no anon/auth SELECT | 6 rebuilt over `not is_test and env = 'production'` + 6 `_k5` variants. All 12 `security_invoker=on`, `has_table_privilege` false for anon and authenticated |
| Legacy SECURITY DEFINER views | 7 (`collection_amenity_details`, `collection_stats`, `collection_stats_v2`, `session_analytics`, `smart7_effectiveness`, `smart7_performance_summary`, `vibe_performance_analytics`) | 0, dropped |
| Materialized views | `ab_experiment_results`, `collection_counts_cached`, revoked | unchanged |

Legacy readers, checked before the drop:
- no DB dependents
- anon and authenticated SELECT already revoked (CC-2 A)
- `pg_stat_statements` (reset 2026-09-25): only `postgres` admin statements
- code references only in `src/lib/services/collections 3.ts` (a dead `* 3` copy) and `src/hooks/useSmart7Selection.tsx` (dead per CLAUDE.local.md)

View changes beyond the filter:
- Each view gains a trailing `k_sessions` (distinct sessions behind the cell). `_k5` = `where k_sessions >= 5`.
- Impression sources skip `payload.placement = 'home_row'` (those slugs are collection ids, not amenities). The funnel's `impressions` counts amenity-list impressions only.
- The views were dropped and recreated, not `create or replace`d. Proof of why, from a rolled-back probe: `create or replace view` without `WITH` turned `{security_invoker=on}` into `NULL`.

Policies: no policy changes in CC-7. The 7 journeys policies stay for CC-2B.

## Code

| File | Change |
|---|---|
| `api/lib/telemetryEnv.ts` (new) | `telemetryEnv()` = `VERCEL_ENV ?? 'development'`, `isTestRequest()` (`x-tp-test: 1`), `isTestMcpSession()` (`smoke-`/`test-`), shared `UUID_RE` |
| `api/events.ts` | Stamps `env` and `is_test`. Accepts `journey_id` (UUID, else null, so the event is kept). `x-tp-test` in CORS Allow-Headers |
| `api/journey.ts` | Stamps `env` and `is_test`. `anon_id`/`session_id` must be UUIDs, else null (the journey is kept). `inbound_arrival_utc`, and server-computed `connection_minutes` (0 to 1440). Parses AeroDataBox's `"YYYY-MM-DD HH:MMZ"` form. Already returned the row id |
| `api/lib/agentTelemetry.ts` | `env`, plus `is_test` from the session key |
| `src/context/JourneyContext.tsx` | Schema v3: `journey_id`, `inbound_arrival_utc`. Stepwise read-time `migrate()`. `attachJourneyId(capturedAt, id)` patches storage and state only for the same capture. Key unchanged |
| `src/pages/FlightContextCapture.tsx` | Stores the returned row id. Passes the inbound arrival (picker `scheduled_at` or typed lookup `scheduledTime`). Uses `JOURNEY_SCHEMA_VERSION` |
| `src/lib/telemetry.ts` | `journey_id` on every event. `tp_test` switch → `x-tp-test` (fetch-keepalive instead of sendBeacon while on). `trackImpressionOnce` takes `placement` |
| `src/lib/journeyRecord.ts` | `inbound_arrival_utc`. Test header |
| `src/pages/HomePage.tsx` | `vibe_selected` payload `{inferred_vibe, overridden}`. One `home_row` impression per rendered row |
| `src/pages/SearchPage.tsx` | `search` impression on the settled result list |

Untouched: `api/mcp.ts`, `api/chat.ts`, ranking files.

### Checks

| Check | Result |
|---|---|
| `npx tsc --noEmit -p api/tsconfig.json` | exit 0 |
| Reachable `src` typecheck (`tsc` rooted at `src/main.tsx`, so it doesn't stop at dead files) | 35 errors on `main`, 35 on the branch, **identical sets** (diffed with line numbers stripped). 0 new. The 3 in touched files are existing unused imports on lines not changed |
| `npm run build` | passes |
| `npm run test:adversarial` | 11/11 pass |
| `npx tsx --test tests/*.test.ts` (CI) | 17/17 pass |

## Preview acceptance (browser, 375 px, `tp_test=1`)

Preview `terminal-plus-frontend-k7gqrv5yc-…vercel.app`, sha `51c91a5`, READY.

| Acceptance | Result | Evidence |
|---|---|---|
| `information_schema` shows the new columns; `created_at` timestamptz | PASS | Migration 1 table above |
| A preview session writes events with `env='preview'` and a non-null `journey_id` that join to journeys | PASS | Connecting session TR15 → TR100. Events **99–125**: `env='preview'`, `is_test=true`, `journey_id = 8297382d-9515-4698-90d6-95b0365dddeb`, every one `joins_journey = true` (left join on `journeys.id`). Event 98 (`session_start`) fired before capture, so its `journey_id` is null as expected |
| journeys row carries env, test flag, inbound arrival, connection | PASS | `8297382d…`: `env='preview'`, `is_test=true`, `connecting`, `TR100` (picker), inbound `TR15` (picker, SYD), `inbound_arrival_utc 2026-10-02 19:05+00`, `departure_time 21:15+00`, **`connection_minutes 130`**, uuid-shaped `anon_id`/`session_id` |
| Context v3 | PASS | `tp_journey_context`: `schema_version 3`, `journey_id` attached once `/api/journey` answered, `inbound_arrival_utc` stored |
| `vibe_selected` `{inferred_vibe, overridden}` | PASS | Home led with Comfort (03:00 SGT, 104 min to board). Event 115 `comfort`: `{inferred_vibe: comfort, overridden: false}`. Event 124 `discover`: `{inferred_vibe: comfort, overridden: true}` |
| Home-row and search impressions | PASS | Events 99–105, 108–114, 117–123: one per row, `placement: home_row`, collection ids. Event 107: `placement: search` after `search_performed` 106 (`results_count 20`) |
| MCP `is_test` via session key | PASS | `get_recommendations` with `mcp-session-id: smoke-cc7-20261002` → agent_interactions `3e18dba3-a9c9-4d23-a021-4613e0e9f122`: `env='preview'`, `is_test=true`. 7 recommendations |
| Production `analytics_funnel` returns 0 rows until real traffic | PASS | 0 rows (`_k5` also 0) |
| Production code (`e0b9e60`) unaffected by migration 1 | PASS | A rolled-back insert in the old row shape (no new columns) into events and journeys succeeded with `env 'unknown'`, `is_test false`, `created_at` timestamptz. Probe rows leaked: 0 |

Data state after the run: every row is `is_test`. Events: unknown 52, preview 29. Journeys: unknown 28, preview 1. agent_interactions: unknown 13, preview 1.

### Test rows from this run (all `is_test = true`)

| Table | Ids |
|---|---|
| events | 97–125. 97 is the first preview page load before the switch was set; it was flagged by hand: `update … set is_test = true where id = 97 and env = 'preview' and anon_id = '2e20d9bb-…'` → 1 row |
| journeys | `8297382d-9515-4698-90d6-95b0365dddeb` |
| agent_interactions | `3e18dba3-a9c9-4d23-a021-4613e0e9f122` |

## Observations

- On preview deployments, Vercel's `vercel-live-feedback` toolbar covers the right edge from about y=430 down, so the "See all" taps there missed (`elementFromPoint` returned `VERCEL-LIVE-FEEDBACK`). It doesn't exist on production. Hidden by hand for the test.
- Home-row impressions fire per Home render (each visit), not per viewport visibility, the same render-based semantics as the existing vibe and collection impressions.
- Events fired between capture and the `/api/journey` response (about a second) have no `journey_id`. A skipped onboarding writes no context, so its events never carry one. Both still join on `session_id`, which since migration 2 is uuid on both sides, so no cast is needed.
- `inbound_arrival_utc` is the **scheduled** arrival (the board only has `scheduled_at`). The typed path uses the lookup's scheduled time for consistency.

## Phase B (Todd's go, 2 Oct, with 3 additions)

### 1. Upgrade-path check on the preview, before the push: PASS

An e0b9e60-shaped context was written into localStorage: the exact key set production stored for QF1 in CC-1F, `schema_version: 2`, no `journey_id`, boarding +5 h. Then the page was reloaded with `tp_test=1`.

| Check | Result |
|---|---|
| No crash | Home renders all 7 rows. The capture gate stays hidden |
| No console errors | `read_console_messages` on a clean `/` load that ran the v2→v3 migration: 0 errors (only the service worker's preload-mismatch warnings) |
| Flight bar keeps the flight | "QF1 · SIN → LHR, T1, 4h 59m to board" |
| Stored context | `schema_version` 2 → **3**. `capturedAt`, `flight_source: typed` and the flight unchanged. `journey_id` absent |
| journey_id on that session's events | **null.** Events 127–143 (anon `10c85198…`, `env='preview'`, `is_test=true`): 0 of 17 carry a `journey_id`. A v2 context never stored its row id and it can't be recovered. It arrives with the user's next capture |

### 2. Ship, then production SMOKE before migration 2: 13/13 PASS

- `git merge --ff-only origin/cc-7/telemetry-hygiene` (`40ec948..ccdee5c`), `git push origin main` at 19:08:46 UTC.
- Production `dpl_6rYas4hNg7EPU3ufd96MBneJvhfD`, sha `ccdee5c`, READY 19:09:25 UTC, aliased to `terminalplus.app`. It serves `assets/index-934RMWpE.js` (the live HTML and the running script match).
- Rollback target until migration 2: `dpl_DwvtuGCp6nzDwbwD8jVNk22dka4a`. Not used.
- `tp_test=1` was set from `/registerSW.js`, a static file on the same origin, before the app's first load. So every SMOKE row, including the first `session_start`, is flagged.

| # | Line | Result | Evidence |
|---|---|---|---|
| 1 | Capture gate shows | PASS | "What brings you to Changi?" |
| 2 | Skip works | PASS | Home. journeys `e5d25e6b…` skipped |
| 3 | Typed QF1 | PASS | "Terminal T1 · Boards 22:45 → LHR" (now the 3 Oct flight) → bar "19h 33m to board". Context v3, `journey_id ac0a0acf…` |
| 4 | Board picker | PASS | HO1562 → "SIN → WUX, T4, 6 min to board". `journey_id 0094cfc0…` |
| 5 | Home: 7 rows, photos, counts | PASS | Comfort, Chill, Quick, Refuel, Explore, Shop, Work. 40 cards, 32 with counts. 0 broken images (28 of 31 loaded at check, 3 Unsplash images still loading) |
| 6 | `/vibe/refuel` 7 items | PASS | "7 spots across all terminals" |
| 7 | Collection, amenity, search | PASS | `coffee-worth-walk` "7 of 7 spots". `/amenity/kinokuniya-jewel-new` renders. "laksa" returns Kopitiam (T1) |
| 8 | Change flight → "Keep QF1" | PASS | `capturedAt`, `lastUpdated` and `journey_id` unchanged |
| 9 | Hours follow SGT | PASS | Kinokuniya `06:00-23:00` shows **"Closed · Opens 06:00"** at local 22:12 (UTC+3; local time would read open), SGT 03:12 |
| 10 | Chat | PASS | `/api/chat` 200: "You've got plenty of time before your QF1 flight tonight!" Cards: Starbucks, Toast Box, Koi Thé (T1) |
| 11 | MCP | PASS | initialize 200, `tools/list` 4, `get_recommendations` refuel/SIN-T1 → 7. agent_interactions `08493a64…` `production/true` via `smoke-cc7-prod-20261002` |
| 12 | SQL last-15-min events | PASS | `session_start` 5, `recommendation_impression` 39 (plus `search_performed`, `flight_not_found`) |
| 13 | SQL typed journey | PASS | `ac0a0acf-cf3b-4884-a750-e339419064a0`: `typed`, `QF1`, `env='production'`, `is_test=true` |

Every production row from the SMOKE is `env='production'`, `is_test=true`: events 144–172 (29, 18 with `journey_id`).

### 3. Migration 2, `supabase/migrations/20261002191525_journeys_uuid_ids.sql`, after the green SMOKE

| Step | Result |
|---|---|
| Castability re-check, 19:14:59 UTC | 0 of 32 rows fail (loose and strict UUID regex). 0 dependent views. 0 policies on either column |
| Dry run (`begin … rollback`) | Both columns become `uuid`. `journeys ⋈ events` on `session_id` joins without a cast (125 pairs) |
| Applied | `apply_migration` → DB version `20261002191525`, file renamed to match. `information_schema`: `anon_id uuid`, `session_id uuid`, `created_at timestamptz` |
| Typed-journey check on production | Fresh `tp_test` session, typed QF1 → journeys `5dd18da7-41be-4351-8f17-230c152ec7b5`: `typed`, `env='production'`, `is_test=true`, uuid `anon_id`/`session_id` |
| Non-UUID probe (the CC-7 gate) | `POST /api/journey` with `anon_id: 'not-a-uuid-cc7-probe'`, `session_id: 'legacy_session_12345'`, `x-tp-test: 1` → **200**, row `a3d106ab-a931-4009-a9fc-83e1214678cf` saved with both ids **null**. The insert didn't fail |
| Env backfill, run 2 (19:16:50 UTC) | events **0**, agent_interactions **0**, journeys **0** updated. There have been 0 non-test rows of any env since day zero (no real traffic yet). `analytics_funnel`: 0 rows |

### Test rows from Phase B (all `is_test = true`)

| Table | Ids |
|---|---|
| events | 127–143 (preview upgrade check), 144–172 (production SMOKE), 173–181 (post-migration typed check). Id 126 was never committed (the rolled-back old-shape insert probe consumed it) |
| journeys | `e5d25e6b-55f5-4ccd-8604-be522065cc35`, `ac0a0acf-cf3b-4884-a750-e339419064a0`, `0094cfc0-1eff-44de-bfed-6710606ad6e2`, `5dd18da7-41be-4351-8f17-230c152ec7b5`, `a3d106ab-a931-4009-a9fc-83e1214678cf` |
| agent_interactions | `08493a64-f1d4-42e2-9fa4-45f98a0951be` |

Dataset state at 19:16 UTC: there are no non-test rows in events, journeys or agent_interactions. The first real production session will be the first row the `env = 'production'` views count.
