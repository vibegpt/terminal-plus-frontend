-- Restore three real visits that 20261015075543 marked is_test (Todd, 15 Oct 2026).
--
-- Todd confirmed which sessions in that migration were his: 150816bf, e73b693d and
-- 7939bc97 stay is_test, and so do the preview sessions. These three weren't his,
-- so they go back to is_test = false:
--   8acc9d03… production 6 Oct 01:14 UTC: 1010 session_start, 1011 capture_opened
--   3f97f75c… production 9 Oct 02:58 UTC: 1198 session_start, 1199 capture_opened
--   517a7e64… production 9 Oct 08:29 UTC: 1200 session_start, 1201 capture_opened
-- All 6 landed on /, with no utm source and no referrer. None has a journeys row.
--
-- The update must hit exactly these 6 rows in their current state, or nothing changes.

do $$
declare
  n int;
begin
  update public.events
     set is_test = false
   where id in (1010, 1011, 1198, 1199, 1200, 1201)
     and session_id in ('8acc9d03-0b3f-4e3f-b2b1-426aff4b4061',
                        '3f97f75c-9617-40e0-b652-4630636daa72',
                        '517a7e64-887b-4bb4-a51d-846b83af1bfb')
     and env = 'production' and is_test and not is_bot;
  get diagnostics n = row_count;
  if n <> 6 then
    raise exception 'events: expected to restore 6 rows, matched %', n;
  end if;
end $$;
