# Telemetry Phase 3 Report — Agent Surface: Session IDs + Capture Completeness

Date: 2026-07-07
Branch: `main` (2 commits, nothing pushed)

## Transport findings

- `api/mcp.ts` is stateless JSON-RPC over plain HTTP (Vercel function, no SSE). The constant session ids were string literals at the 4 insert sites: `'mcp-orchestrator'` (get_recommendations) and `'mcp-route'` (3 get_route paths). `get_airport_context` and `get_disruption_status` logged **nothing**.
- The server advertises MCP protocol `2025-03-26`. Its Streamable HTTP spec allows the server to return an `Mcp-Session-Id` header on the initialize response; compliant clients must echo it on every subsequent request. The server never issued one — that's the root cause of "no session identity available."

## Session semantics achieved: per-MCP-session (preference #1), with per-request floor

- `initialize` now responds with `Mcp-Session-Id: <uuid>` (verified via curl: header present). Nothing is stored server-side — we propagate, never validate.
- `tools/call` uses the incoming `mcp-session-id` header as `session_id` when present (also stored raw in `mcp_session_key`), else mints a per-request UUID (`mcp_session_key` null distinguishes the floor case).

## File change table

| File | Change |
|---|---|
| `api/mcp.ts` | Exception-approved diff: **10 added / 35 deleted (+3 blank)** — 4 insert blocks removed, session id derivation + one central `logToolCall` at dispatch, `Mcp-Session-Id` on initialize |
| `api/lib/agentTelemetry.ts` | New — arg sanitization (schema-key whitelist, 100-char cap), result extraction (top-3 slugs / route_id), legacy-compatible summaries, never throws |
| `supabase/migrations/20260706093000_agent_interactions_telemetry.sql` | New — `tool_name, latency_ms, result_slugs, route_id, mcp_session_key` + `(session_id, created_at)` index. **Applied to live DB by Todd via dashboard SQL editor** (MCP connector was down; columns verified live via information_schema) |
| `tasks/telemetry-phase3-report.md` | This report |

Protected untouched: `api/lib/agent.ts` (`queryRouteMatch` still called unmodified), `api/lib/search.ts`, `smart7Weights.ts`, `api/events.ts`, `src/lib/telemetry.ts`. Dirty `api/lib/agentPrompt.ts` untouched and uncommitted.

## Checklist evidence

- ✅ **Build + adversarial 10/10** — before and after all changes.
- ✅ **Baseline top-3 UNCHANGED**: `get_recommendations {vibe:refuel, terminal:SIN-T1}` → `starbucks-sint1, coffee-bean-tea-leaf-sint1, sin-t1-crystal-jade-1757008220.066062` pre and post. Full JSON responses **byte-identical** (`diff` of pretty-printed pre/post: no output).
- ✅ **Non-constant session ids**: post-change window: 6 rows, 3 distinct session ids, `constant_ids = 0`, `fully_captured = 6/6` (tool_name + latency_ms present on every row).
- ✅ **Call-chain proof**: 4 calls sent with shared header `Mcp-Session-Id: aaaaaaaa-bbbb-…` → 4 rows, one session id, chain readable in order: `get_airport_context → get_recommendations → get_route (curated qf1-quick-stop) → get_route (dynamic)`. 2 headerless calls → 2 distinct UUIDs with `mcp_session_key IS NULL`.
- ✅ **Capture completeness** (row snapshots in session): latency 2–1065 ms; `get_recommendations` row carries top-3 `result_slugs`; curated route carries `route_id: qf1-quick-stop`; dynamic route carries top-3 stop slugs; sanitized args in `user_message`.
- ✅ **mcp.ts diff matches approved diff**: `git diff --stat` = 11 insertions / 39 deletions (10/35 content + blanks), confined to imports, initialize header, tools/call session derivation + central log, and the 4 deleted insert blocks.
- ✅ **Cleanup**: 7 agent_interactions rows + 4 events rows deleted; both tables back to pre-test state.
- ✅ **git status matches file change table** (plus pre-existing dirt, untouched).

## Join exhibit (the Phase-4 query this enables)

```sql
select a.session_id agent_session, a.tool_name, a.terminal, a.vibe_requested vibe,
       a.result_slugs agent_top3, a.latency_ms,
       e.session_id human_session, e.payload->'slugs' human_impression_slugs,
       (select count(*) from jsonb_array_elements_text(a.result_slugs) s
         where e.payload->'slugs' ? s.value) overlap_count,
       a.created_at agent_at, e.occurred_at human_at
from agent_interactions a
join events e
  on e.event_type = 'recommendation_impression'
 and e.terminal_code = a.terminal and e.vibe = a.vibe_requested
 and e.occurred_at between a.created_at - interval '1 hour' and a.created_at + interval '1 hour'
where a.tool_name = 'get_recommendations';
```

Output (1 row, real generated data — agent call + browser impression 7 min apart, SIN-T1 × refuel):

| agent_top3 | human_impression_slugs | overlap_count |
|---|---|---|
| starbucks-sint1, coffee-bean-tea-leaf-sint1, sin-t1-crystal-jade-… | sin-t1-kopitiam-…, sin-t2-food-court-…, wang-cafe-jewel, twg-tea-t4-new, fossa-chocolate-jewel, grain-traders-jewel, kele-jewel | **0** |

⚠️ **Substantive finding**: zero overlap between the agent's top-3 and the human surface's 7-item list for the identical terminal+vibe. The MCP scorer (`handleGetRecommendations`'s inline scoring) and the app's `smart7Select` rank differently. This is now measurable — worth a Phase 4 view and possibly a parity decision (relates to `tasks/parity-baseline.md`).

## Deviations / notes

- **Migration applied manually** by Todd via dashboard (Supabase MCP connector was disconnected; CLI on this machine is authed to a different Supabase account). File is committed; `supabase migration list` reconciliation deferred until CLI access to this project exists.
- **Deploy ordering**: the migration MUST be applied before this code deploys (verified failure mode: unknown-column insert fails silently → zero agent logging). Already applied to prod DB, so deploys are safe now.
- `queryRouteMatch`-path routes have no template id in the shared lib's return shape (protected file) → `route_id` null there; slugs + `route_name` in summary still identify the template.
- QF1 curated route stops all have `amenity_slug: null` in `route_stops` source data → empty `result_slugs` for that route is correct extraction, and a data-quality note for the route content.
- `get_airport_context` locally returns `flight_not_found` (flight-status API not running in harness) — the row logs the error summary; production rows will carry real context.
- Args stored include `flight_number` (pre-existing practice, needed for route debugging); strings capped at 100 chars, unknown keys dropped.

## Next step

Phase 4: analytics views over `events` × `agent_interactions` (the join above as a view), plus the agent-vs-human ranking-divergence exhibit.
