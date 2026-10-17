-- CC-26 A (Todd, 17 Oct): the last 2 journeys with a user_id, both 2025 test
-- rows pointing at 6e2ee41f-d775-46c1-a4fc-97168b525041, which has no auth
-- user. After this, no journey carries a user_id (auth.users is empty).
--
-- Rollback:
--   update public.journeys set user_id = '6e2ee41f-d775-46c1-a4fc-97168b525041'
--   where id in ('d58be5a2-6211-4c97-962d-c1653e1e7b02', 'b359c926-6012-48ed-b8d9-9c39d1e143fe');

update public.journeys
set user_id = null
where id in ('d58be5a2-6211-4c97-962d-c1653e1e7b02', 'b359c926-6012-48ed-b8d9-9c39d1e143fe')
  and user_id = '6e2ee41f-d775-46c1-a4fc-97168b525041';
