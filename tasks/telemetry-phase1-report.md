# Telemetry Phase 0 + 1 Report

Date: 2026-07-05 | Build: PASS | Adversarial gate: 10/10 | Commits: `e927565`, `b22d527`, `34ab021` (nothing pushed)

## Phase 0 — adversarial suite reconstruction

**Discovery verdict:** the original suite (`tasks/adversarial-test-results.md`, 2026-04-04, 10/10) was manual LLM red-teaming against `/api/chat` via curl — prompt-leak, role override, fake amenity/terminal, price probing, emotional manipulation. Never scripted, never committed (git log has only `0b8d117 chore(deps)` mentioning tests). `vitest.config.ts` exists in the repo but vitest was never installed — orphaned config, part of the known package.json drift.

**What was built:** [tests/adversarial/adversarial.test.ts](../tests/adversarial/adversarial.test.ts) + [helpers.ts](../tests/adversarial/helpers.ts) — the brief's 10 deterministic query-layer cases, using Node's built-in `node:test` under `tsx` (no new test framework; `tsx` was already installed + in the lockfile, now properly declared). Tests call the real `queryAmenities`/`queryRouteMatch` from `api/lib/agent.ts` (imported, never edited) and `smart7Select` from `src/utils/`, with a live **anon-key** Supabase client — structurally read-only, same privileges as the shipped UI. Run: `npm run test:adversarial`.

**Gate result: 10/10 on first run against current code** — no app-code changes were needed, none were made. Re-ran after all Phase 1 changes: still 10/10.

Notable case-design decisions:
- Case 10 (nonexistent slug): no api-layer slug lookup exists (confirmed by grep — `api/lib/agent.ts` only does `.in('amenity_slug', ...)` plural). Test uses the exact query shape the app uses (`.eq('amenity_slug', ...).single()`, per `useOptimizedAmenity`/AmenityDetailPage) and asserts the clean `PGRST116` not-found the page handles.
- Case 8 encodes the 899654e parity contract on both layers: agent layer must be `[terminal-match block][rest]` with `editorial_score` non-increasing within each; `smart7Select` output must be non-increasing overall.
- Case 5 additionally proves `amenity_detail` survived the injection attempts with a row-count assertion.
- `selectScoredAmenities` (contextualScoring) is not exercised: it reads `import.meta.env.DEV`, which only exists under Vite — it crashes under any Node test runner. Its editorial_score-first comparator mirrors `smart7Select`'s and was browser-verified in the ranking-parity session. Flagged as a deviation, not silently skipped.

**Commit entanglement (flagged in plan, executed as planned):** `package.json`/`package-lock.json` carried a pre-existing uncommitted `dotenv` devDep whose hunk merges with the new `tsx` line. The Phase 0 commit (`e927565`) includes it, explicitly noted in the commit message — resolving that drift.

## Phase 1 Step 1 — discovery findings

**`agent_interactions`** (only pre-existing tracked migration, `20260324202819`):

| column | type | notes |
|---|---|---|
| id | uuid | `gen_random_uuid()` |
| session_id | **text** | NOT uuid; MCP writes literals `'mcp-orchestrator'`/`'mcp-route'` |
| user_message / agent_response | text | chat-turn granularity |
| terminal, gate | text | |
| time_until_boarding | int | |
| vibe_requested | text | |
| amenities_shown | jsonb | |
| amenity_clicked | text | |
| mode | text | default `'conversational'` |
| created_at | timestamptz | default now() |

- **Does it capture MCP tool calls? Yes.** 7 rows, all `mode='mcp'` (2026-03-26 → 2026-04-16). Writers: 4 fire-and-forget insert sites, all in `api/mcp.ts` (~lines 198, 298, 330, 422 — `get_recommendations` + three `get_route` paths). No reads anywhere in the codebase. RLS on, 1 policy.
- **Other event-ish tables:** `amenity_interactions` (legacy client-side tracking, 0 rows, referenced only by the dead `src/services/supabase{Data,Tracking}Service.ts` chain), `session_analytics` (a VIEW, not a table), `error_logs` (error tracking; side note: RLS is off there). No other generic event table → no duplication.
- **Consequence:** `agent_interactions` covers the agent/MCP surface; `events` serves human surfaces in v1. The `surface` check constraint keeps `'chat'`/`'mcp'` so those can migrate in Phase 3 without DDL. **Join key:** `events.session_id::text = agent_interactions.session_id` — weak today because MCP writes constant session ids; a Phase 3 concern, noted.
- **Schema adjustments from discovery: none.** Applied exactly as specified.

## Phase 1 Step 2 — migration as applied

Applied via the Supabase migration API as **`20260705095346 create_events_table`** (verified in `list_migrations`), mirrored in-repo at [supabase/migrations/20260705095346_create_events_table.sql](../supabase/migrations/20260705095346_create_events_table.sql) (new directory — first version-controlled migration). Table + `idx_events_type_time` + partial `idx_events_amenity` + RLS enabled with **zero policies** (service-role only).

## Phase 1 Step 3 — endpoint

[api/events.ts](../api/events.ts): POST-only, `{ events: [...] }` max 50, per-event validation (10-type whitelist, surface enum, UUID checks on anon/session/route ids, SIN-terminal-or-null, payload < 8KB, integer bounds on position/minutes), individual reject with reasons, `{ inserted, rejected }` response, server-side `occurred_at` (DB default; client timestamps ignored), strict `SUPABASE_SERVICE_ROLE_KEY` (no anon fallback — anon would silently no-op against zero-policy RLS), `.env.local` loader + CORS/method pattern copied from `api/chat.ts`.

## Phase 1 Step 4 — verification evidence

`vercel dev` remains unusable (invalid token, discovered in the ranking-parity session), so HTTP tests ran against a thin `node:http` harness wrapping the handler's default export (scratchpad-only, not committed) on `:3999`.

| Check | Result | Evidence |
|---|---|---|
| `npm run test:adversarial` after all changes | ✅ 10/10 | `# tests 10 / # pass 10 / # fail 0` |
| `npm run build` | ✅ PASS | full vite build + PWA generation completed |
| Valid 2-event batch | ✅ | `{"inserted":2,"rejected":[]}` HTTP 200; SQL showed exactly 2 rows, all fields correct (`amenity_tapped` row carried terminal_code SIN-T1, vibe refuel, slug, position 1, minutes 95, payload `{"source":"vibe_page"}`), `occurred_at` server-set |
| Invalid event_type | ✅ | `{"inserted":0,"rejected":[{"index":0,"reason":"unknown event_type: totally_made_up"}]}` HTTP 200; zero rows inserted |
| Mixed batch (bad uuid + bad terminal + 1 good) | ✅ | `{"inserted":1,"rejected":[2 reasons]}` — good event landed, bad ones didn't |
| Oversized payload (9KB) | ✅ | rejected: `payload exceeds 8192 bytes` |
| 51-event batch | ✅ | `{"error":"Batch too large (max 50 events)"}` HTTP 400 |
| GET | ✅ | `{"error":"Method not allowed"}` HTTP 405 |
| Malformed JSON | ✅ | `{"error":"Malformed JSON body"}` HTTP 400 (no 500) |
| Anon-key insert blocked by RLS | ✅ | `42501 new row violates row-level security policy for table "events"`; anon SELECT also returns 0 rows |
| Test-row cleanup | ✅ | 3 verification rows deleted by session_id; `count(*) = 0` |
| `git status` | ✅ | only intended files; pre-existing unrelated modifications (`api/lib/agentPrompt.ts`, `src/pages/AmenityDetailPage.tsx`) untouched and uncommitted |

## File change table

| File | Commit | Change |
|---|---|---|
| `tests/adversarial/adversarial.test.ts` | `e927565` | new — 10 cases, node:test |
| `tests/adversarial/helpers.ts` | `e927565` | new — env loader + anon client |
| `package.json` | `e927565` | +`test:adversarial` script, +`tsx` devDep, +pre-existing `dotenv` line (flagged) |
| `package-lock.json` | `e927565` | tsx + dotenv declarations |
| `supabase/migrations/20260705095346_create_events_table.sql` | `b22d527` | new — mirror of applied migration |
| `api/events.ts` | `34ab021` | new — 202 lines |
| `tasks/telemetry-phase1-report.md` | (uncommitted, like the rest of tasks/) | this report |

Protected files: zero edits (`api/mcp.ts`, `api/lib/agent.ts`, `queryRouteMatch()`, `smart7Weights.ts`; `api/lib/search.ts` does not exist in the repo). Out of scope honored: no client logger changes, no MCP middleware, no analytics views, `eventLogger.ts` untouched.
