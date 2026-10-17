-- CC-26 A (Todd, 17 Oct): unlink the 7 legacy 2025 test journeys from
-- auth user c3da094f before the 3 old test accounts are deleted through the
-- Auth admin API. The app offers no accounts; /privacy says no email is kept.
-- No public-schema foreign key references auth.users, so this is tidy-up, not
-- a constraint fix.
--
-- Rollback (restores the link; the auth user itself is gone after the delete):
--   update public.journeys set user_id = 'c3da094f-43f0-4d82-a8c1-57cc494cb921'
--   where id in ('075a2584-6968-41c7-a382-4b665cf25126','a23a090a-1143-41fb-92d6-df6f50f92d80',
--     '07ef8052-ca62-4b6c-82f0-8484ead2ddfd','10db21d2-ac66-4898-b02c-4a6e911b7a03',
--     '51548089-b3cd-4466-920d-6cbd5032d102','7506101b-8471-4807-83a9-6c55ed7d70e5',
--     'c203c885-2562-468f-8605-c572e1531da0');

update public.journeys
set user_id = null
where user_id = 'c3da094f-43f0-4d82-a8c1-57cc494cb921';
