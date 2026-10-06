-- CC-20 follow-up: a write with no env is refused (Todd, 6 Oct 2026, option 2).
--
-- Every old Vercel deployment still runs its own api/ code against this database with
-- the service role. Builds from before CC-7 (2 Oct) don't stamp env, so the column
-- default 'unknown' let them write rows that look valid: event 1008 came from the
-- release/2026-09 preview this way. Without the default, env NOT NULL rejects those
-- inserts outright.
--
-- Caller gate (6 Oct): the only writers are api/events.ts and api/journey.ts on main
-- (adc551a) and on cc-17/landside-open-now, and both stamp env = telemetryEnv() on
-- every row. Edge functions saveJourney (anon key, no privileges) and log-emotion
-- (missing table) can't write these tables. Rolling production back to a pre-CC-7 build
-- would now fail every telemetry insert; the rollback targets since then all stamp env.
--
-- Out of scope: agent_interactions.env keeps its default (MCP telemetry).
--
-- Rollback:
--   alter table public.events   alter column env set default 'unknown';
--   alter table public.journeys alter column env set default 'unknown';

alter table public.events   alter column env drop default;
alter table public.journeys alter column env drop default;
