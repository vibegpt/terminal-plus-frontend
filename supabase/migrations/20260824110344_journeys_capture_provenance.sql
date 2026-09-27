-- Zero-friction flight capture: provenance + corridor fingerprint on journeys.
--
-- Records HOW each captured value was obtained so corridor analysis can slice
-- by confidence. The unit of analysis is the corridor (inbound origin -> SIN ->
-- onward destination), not the person.
--
-- session_id / anon_id are text (not uuid) and mirror the existing browser ids:
-- sessionStorage['tp_session_id'] and localStorage['anon_id'] (src/lib/telemetry.ts).
-- Nothing new is generated.

alter table public.journeys
  add column if not exists session_id              text,
  add column if not exists anon_id                 text,
  add column if not exists journey_type            text,
  add column if not exists flight_source           text,
  add column if not exists inbound_flight_source   text,
  add column if not exists inbound_flight          text,
  add column if not exists inbound_origin          text,
  add column if not exists onboarding_skipped      boolean default false,
  add column if not exists onboarding_completed_at timestamptz,
  add column if not exists first_open_country      text,
  add column if not exists acquisition_src         text,
  add column if not exists device_locale           text,
  add column if not exists device_timezone         text;

-- 'picker_ungrouped' marks a row selected from a codeshare group where no member
-- reported codeshareStatus = IsOperator, so the displayed operating flight is a
-- stable guess rather than a confirmed fact. Corridor aggregates can exclude it.
--
-- ADD CONSTRAINT has no IF NOT EXISTS, so both are guarded for idempotency.
-- Both permit NULL: `null in (...)` yields NULL, and a CHECK passes on NULL.
-- That is intended -- existing rows predate these columns.

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'journeys_flight_source_chk'
  ) then
    alter table public.journeys add constraint journeys_flight_source_chk
      check (flight_source in
        ('scanned','picker','picker_ungrouped','typed','inferred','skipped'));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'journeys_inbound_flight_source_chk'
  ) then
    alter table public.journeys add constraint journeys_inbound_flight_source_chk
      check (inbound_flight_source is null or inbound_flight_source in
        ('scanned','picker','picker_ungrouped','typed','inferred','skipped'));
  end if;
end $$;
