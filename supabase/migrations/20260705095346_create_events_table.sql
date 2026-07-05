-- Telemetry events table (Phase 1). One events system for human surfaces;
-- the agent/MCP surface keeps writing agent_interactions until Phase 3.
-- Join key across the two: events.session_id::text = agent_interactions.session_id.
-- Applied to project bpbyhdjdezynyiclqezy as migration 20260705095346.

create table events (
  id bigint generated always as identity primary key,
  occurred_at timestamptz not null default now(),
  anon_id uuid not null,
  session_id uuid not null,
  surface text not null check (surface in ('app','chat','mcp')),
  event_type text not null,
  terminal_code text,
  vibe text,
  amenity_slug text,
  position smallint,
  minutes_to_boarding int,
  route_id uuid,
  payload jsonb not null default '{}'
);
create index idx_events_type_time on events (event_type, occurred_at);
create index idx_events_amenity on events (amenity_slug) where amenity_slug is not null;
alter table events enable row level security;
-- no public policies: service-role writes only, no client access
