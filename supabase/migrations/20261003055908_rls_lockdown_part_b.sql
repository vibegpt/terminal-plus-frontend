-- CC-2 part B: journeys and the legacy telemetry tables become service-role only.
-- Browser writes go through /api/journey and /api/events, which hold the service-role
-- key and validate. No client role keeps any privilege on these 5 tables.
-- Gates (2026-10-02/03, tasks/cc-2b-report.md): production 7590fe6 == origin/main;
-- /api/journey typed path writes on production; no reachable client code on 7590fe6
-- or 40ec948 calls .from() on journeys, amenity_interactions or user_sessions; no
-- server-side anon-key client reads journeys, events or agent_interactions.
-- Pre-check on 2026-10-02 19:36 UTC: all 15 policy names below match pg_policies.

begin;

drop policy if exists "Allow insert for all"                 on public.journeys;
drop policy if exists "Allow insert for all (MVP mode)"      on public.journeys;
drop policy if exists "Allow insert for anonymous users"     on public.journeys;
drop policy if exists "Allow insert for authenticated users" on public.journeys;
drop policy if exists "Allow select for authenticated users" on public.journeys;
drop policy if exists "own journey"                          on public.journeys;
drop policy if exists "save journey"                         on public.journeys;
revoke all on public.journeys, public.events, public.agent_interactions from anon, authenticated;

drop policy if exists "Allow anonymous insert on amenity_interactions" on public.amenity_interactions;
drop policy if exists "Allow read on amenity_interactions"             on public.amenity_interactions;
drop policy if exists "anon insert amenity_interactions"               on public.amenity_interactions;
drop policy if exists "anon read amenity_interactions"                 on public.amenity_interactions;
drop policy if exists "Allow anonymous insert on user_sessions"        on public.user_sessions;
drop policy if exists "Allow read on user_sessions"                    on public.user_sessions;
drop policy if exists "anon insert user_sessions"                      on public.user_sessions;
drop policy if exists "anon read user_sessions"                        on public.user_sessions;
revoke all on public.amenity_interactions, public.user_sessions from anon, authenticated;

commit;
