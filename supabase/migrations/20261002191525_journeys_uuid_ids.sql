-- CC-7 migration 2: journeys.anon_id / session_id become uuid, so they type-match
-- events.anon_id / events.session_id and join without casts.
-- Applied only after api/journey.ts enforces UUIDs in production (CC-7, ccdee5c,
-- dpl_6rYas4hNg7EPU3ufd96MBneJvhfD): a non-UUID id is now nulled at the route
-- instead of failing the insert.
-- Pre-check on 2026-10-02 19:14 UTC: 0 of 32 rows fail the strict UUID regex; no
-- view, policy or trigger depends on either column.

begin;

alter table public.journeys
  alter column anon_id    type uuid using anon_id::uuid,
  alter column session_id type uuid using session_id::uuid;

commit;
