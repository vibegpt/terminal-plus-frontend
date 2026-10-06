-- CC-20 follow-up: classify events 1007, 1008 and 1009 (Todd, 6 Oct 2026).
--
-- 1007 (session_start) and 1009 (capture_opened), anon 02b9416e…, production,
-- 5 Oct 19:35:07.073 UTC: a visit to / written before CC-20's code was live, so its
-- agent was never classified.
-- 1008 (session_start, empty payload), anon eb17ae05…, 2 ms later: written by the old
-- CC-1 preview dpl_AQsPsED4G2WphmJdk78swbXTDQtV (branch release/2026-09, e0b9e60).
-- Vercel's runtime log shows that deployment serving POST /api/events at 19:35:05
-- next to production's. Its pre-CC-7 api/events.ts doesn't stamp env, so the column
-- default 'unknown' landed. Something loaded production and that preview at the same
-- moment; no user agent survives to say what.
--
-- Todd's call: treat all three as one non-user client. Mark them is_test, and set
-- 1008's env to the deployment's real environment, 'preview'. Each update must hit
-- exactly its rows in their current state, or nothing changes.

do $$
declare
  n int;
begin
  update public.events
     set is_test = true
   where id in (1007, 1009)
     and anon_id = '02b9416e-0b8c-49ec-97e2-8d591fd03dba'
     and env = 'production' and not is_test;
  get diagnostics n = row_count;
  if n <> 2 then
    raise exception 'expected to mark 2 rows (1007, 1009), matched %', n;
  end if;

  update public.events
     set is_test = true, env = 'preview'
   where id = 1008
     and anon_id = 'eb17ae05-a11e-4f72-97b7-c56e94f6b002'
     and env = 'unknown' and not is_test;
  get diagnostics n = row_count;
  if n <> 1 then
    raise exception 'expected to mark 1 row (1008), matched %', n;
  end if;
end $$;
