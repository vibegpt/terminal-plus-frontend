-- CC-16: analytics_acquisition. Sessions per Singapore day and landing source,
-- and how many of them went on to a journey or an amenity tap.
--
-- Source = the session_start payload's utm_source, else its ref_host, else
-- 'direct'. api/events.ts reduces that payload to validated attribution keys
-- (api/lib/attribution.ts). Before CC-16, session_start payloads were {} and
-- count as 'direct'.
-- A session's day and source come from its first session_start. journeys joins
-- on session_id (both uuid since CC-7). Clean production rows only, on every side.

begin;

create view public.analytics_acquisition with (security_invoker = on) as
with s as (
  select e.session_id,
         min(e.occurred_at) as started_at,
         (array_agg(coalesce(e.payload ->> 'utm_source', e.payload ->> 'ref_host', 'direct')
                    order by e.occurred_at, e.id))[1] as source
  from public.events e
  where e.event_type = 'session_start'
    and not e.is_test and e.env = 'production'
  group by e.session_id
),
j as (
  select distinct session_id
  from public.journeys
  where session_id is not null
    and not is_test and env = 'production'
),
t as (
  select distinct session_id
  from public.events
  where event_type = 'amenity_tapped'
    and not is_test and env = 'production'
)
select (s.started_at at time zone 'Asia/Singapore')::date as day_sgt,
       s.source,
       count(*)            as sessions,
       count(j.session_id) as sessions_with_journey,
       count(t.session_id) as sessions_with_tap
from s
left join j on j.session_id = s.session_id
left join t on t.session_id = s.session_id
group by 1, 2;

comment on view public.analytics_acquisition is
  'CC-16. Per SGT day x landing source (utm_source, else ref_host, else direct): sessions with a session_start, of which with a journey, with >=1 amenity_tapped. Production, non-test rows only.';

-- The schema default ACL grants anon/authenticated full rights on new views. Close it.
revoke all on public.analytics_acquisition from anon, authenticated;

commit;
