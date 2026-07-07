-- Phase 3: agent-surface telemetry completeness.
-- agent_interactions predates the migrations dir (created via dashboard);
-- this adds the capture columns for per-session MCP telemetry.
-- Must be applied BEFORE deploying the code that writes these columns —
-- PostgREST rejects inserts with unknown columns, which would silence
-- agent logging entirely until applied.

alter table public.agent_interactions
  add column if not exists tool_name text,
  add column if not exists latency_ms integer,
  add column if not exists result_slugs jsonb,
  add column if not exists route_id text,
  add column if not exists mcp_session_key text;

-- Call-chain reconstruction: all tool calls in one MCP session, in order.
create index if not exists idx_agent_interactions_session
  on public.agent_interactions (session_id, created_at);
