-- CC-25: one agent_interactions row from the D5 gate check (a request sent without
-- x-tp-test on purpose, to prove x-tp-card-model is ignored there) was written with
-- is_test false. env is 'preview', so no analytics view counted it; this flags it test.
-- Exact id, exact count asserted.
do $$
declare n int;
begin
  update public.agent_interactions
     set is_test = true
   where id = '097a280c-fd95-4eac-b0ff-09621fbf0815'
     and mode = 'card' and env = 'preview' and not is_test;
  get diagnostics n = row_count;
  if n <> 1 then raise exception 'expected 1 row, updated %', n; end if;
end $$;
