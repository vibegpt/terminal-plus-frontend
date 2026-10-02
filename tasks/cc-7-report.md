# CC-7 Telemetry hygiene: report

**Status: Phase A done. Migration 1 is applied, and the code passes acceptance on the preview. Phase B (merge to `main`, production check, env re-backfill, migration 2 uuid cast) waits for Todd's go.**

Run date: 2026-10-02. Branch `cc-7/telemetry-hygiene` = `51c91a5` (plus this report). Preview `dpl_44vTRWKgY8ajR9ee5eJ7t6ghdpUH`.

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
- Events fired between capture and the `/api/journey` response (about a second) have no `journey_id`. A skipped onboarding writes no context, so its events never carry one. Both still join on `session_id`. Until migration 2, `journeys.session_id` is text, so join with `events.session_id::text`.
- `inbound_arrival_utc` is the **scheduled** arrival (the board only has `scheduled_at`). The typed path uses the lookup's scheduled time for consistency.

## Phase B (waits for Todd's go)

- [ ] Merge `cc-7/telemetry-hygiene` to `main` (fast-forward), push, production READY
- [ ] Production check: a `tp_test` session writes `env='production'`, `is_test=true`, `journey_id` set
- [ ] Re-run the env backfill (non-test rows from day zero onward, `env='unknown'`) and report counts
- [ ] Migration 2: `journeys.anon_id`/`session_id` → uuid (castability re-check first), then re-verify a typed journey write on production
- [ ] Update `CLAUDE.local.md` (CC-7 done, CC-13 unblocked)
