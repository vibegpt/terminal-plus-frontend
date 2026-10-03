-- CC-6: per-turn usage on chat telemetry.
-- api/chat.ts logs one agent_interactions row per turn (mode 'conversational')
-- with the model that answered and its token counts. All three are nullable:
-- MCP rows and failed turns have no model call to report.
--
-- No new object is created, so pg_default_acl grants nothing new, and the
-- table-level grants stay as CC-2B left them (service_role only).

alter table public.agent_interactions
  add column model text,
  add column input_tokens integer,
  add column output_tokens integer;

comment on column public.agent_interactions.model is
  'Anthropic model that answered the turn (response.model). Null for MCP rows and failed turns.';
comment on column public.agent_interactions.input_tokens is
  'usage.input_tokens of the answering call.';
comment on column public.agent_interactions.output_tokens is
  'usage.output_tokens of the answering call.';
