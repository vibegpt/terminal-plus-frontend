-- Mark every pre-launch "visitor" row as test (Todd, 15 Oct 2026: "all the
-- visitors are test visitors so far").
--
-- Scope: every events and journeys row that was not is_test and not is_bot when
-- this was written (15 Oct, after event 1532). These are Todd's own checks on
-- production and previews without the tp_test switch, including the real-iPhone
-- checks for CC-23 (events 1455–1473 + 2 journeys on 14 Oct, 1518–1519,
-- 1522–1525 and 1529–1532 on 15 Oct). Bot rows (is_bot) are real crawlers; they
-- stay as they are, and every analytics view already excludes them.
-- agent_interactions has 0 non-test rows.
--
-- Rollback: set is_test = false on exactly these ids.
-- Each update must hit exactly its rows in their current state, or nothing changes.

do $$
declare
  n int;
begin
  update public.events
     set is_test = true
   where id in (775, 1010, 1011, 1198, 1199, 1200, 1201,
                1455, 1456, 1457, 1458, 1459, 1460, 1461, 1462, 1463, 1464,
                1465, 1466, 1467, 1468, 1469, 1470, 1471, 1472, 1473,
                1518, 1519, 1522, 1523, 1524, 1525, 1529, 1530, 1531, 1532)
     and not is_test and not is_bot;
  get diagnostics n = row_count;
  if n <> 36 then
    raise exception 'events: expected to mark 36 rows, matched %', n;
  end if;

  update public.journeys
     set is_test = true
   where id in ('38a2ed1f-e30e-4213-a7f0-18580ca47a47',
                'f59fc56e-0cc2-4cdd-919f-cfba9d955789')
     and not is_test and not is_bot;
  get diagnostics n = row_count;
  if n <> 2 then
    raise exception 'journeys: expected to mark 2 rows, matched %', n;
  end if;
end $$;
