-- CC-26 D4 check: opening 3 MCP venue urls on production from the built-in
-- browser wrote events 1787-1789 before that origin had tp_test set. They are
-- test traffic (anon ffb66bf1-f46f-49d1-9acc-c71d29a60cea, 17 Oct 10:37 UTC).
-- Rollback: update public.events set is_test = false where id in (1787, 1788, 1789);

update public.events
set is_test = true
where id in (1787, 1788, 1789)
  and anon_id = 'ffb66bf1-f46f-49d1-9acc-c71d29a60cea';
