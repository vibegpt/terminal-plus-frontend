-- CC-20: crawler visits are stored but flagged, and every analytics view leaves them out.
--
-- The first 8 non-test production events (5 Oct 2026, 02:38-03:02 UTC; ids 776-779,
-- 784-785, 823-824) came from 4 fresh browsers, each landing on a sitemap URL with no
-- referrer, no UTM, 1 impression and no taps: a crawler that runs JavaScript. Todd
-- confirmed on 5 Oct they weren't his. GA4 filters known bots; these tables didn't.
--
-- is_bot is server-side provenance, like env and is_test: api/events.ts and
-- api/journey.ts set it from the request's User-Agent via api/lib/crawler.ts (isbot's
-- maintained list; a missing agent counts as a bot). The agent string is never stored.
-- A spoofed bot agent can only hide its own rows. agent_interactions is out of scope:
-- MCP's callers are agents by design.
--
-- Views: every events/journeys predicate "not is_test and env = 'production'" gains
-- "and not is_bot". Dropped and recreated rather than replaced: CREATE OR REPLACE VIEW
-- resets reloptions, which would silently drop security_invoker (tasks/lessons.md).
-- analytics_agent_tool_volume and its _k5 read only agent_interactions and are left as
-- they are. In analytics_surface_parity only the events side is filtered.
--
-- Rollback (run in one transaction, after any code that writes is_bot is rolled back):
--   drop the 13 views below; recreate them from 20261002184806_telemetry_hygiene.sql
--   (sections 6.1, 6.2, 6.4, 6.5, 6.6 and their _k5 in 7),
--   20261003084912_analytics_acquisition.sql and 20261003085434_journey_trail_views.sql,
--   each with (security_invoker = on), revoke all from anon, authenticated, and the 3
--   comments; then
--   alter table public.events drop column is_bot;
--   alter table public.journeys drop column is_bot;

begin;

-- 1. Columns. A constant default is a metadata-only change; existing rows read false.
alter table public.events   add column is_bot boolean not null default false;
alter table public.journeys add column is_bot boolean not null default false;

comment on column public.events.is_bot is
  'CC-20. True when the request''s User-Agent is a known crawler (isbot list) or missing. Set by api/events.ts via api/lib/crawler.ts; the agent string is not stored. Analytics views exclude these rows.';
comment on column public.journeys.is_bot is
  'CC-20. True when the request''s User-Agent is a known crawler (isbot list) or missing. Set by api/journey.ts via api/lib/crawler.ts; the agent string is not stored. Analytics views exclude these rows.';

-- 2. Backfill: the 8 crawler rows from 5 Oct. Exactly 8 or nothing.
do $$
declare
  n int;
begin
  update public.events
     set is_bot = true
   where id in (776, 777, 778, 779, 784, 785, 823, 824)
     and env = 'production' and not is_test;
  get diagnostics n = row_count;
  if n <> 8 then
    raise exception 'CC-20 backfill expected 8 rows, updated %', n;
  end if;
end $$;

-- 3. Views.
drop view if exists
  public.analytics_ctr_by_position_k5, public.analytics_editorial_engagement_k5,
  public.analytics_surface_parity_k5,  public.analytics_funnel_k5,
  public.analytics_jewel_pull_k5,      public.analytics_journey_trail_k5;
drop view if exists
  public.analytics_ctr_by_position, public.analytics_editorial_engagement,
  public.analytics_surface_parity,  public.analytics_funnel,
  public.analytics_jewel_pull,      public.analytics_acquisition,
  public.analytics_journey_trail;

-- 3.1 CTR by list position (0-based; impression ordinality shifted by -1)
create view public.analytics_ctr_by_position with (security_invoker = on) as
with r as (
  select e.vibe, e.terminal_code, (s.ordinality - 1)::int as position, e.session_id, 'imp'::text as kind
  from public.events e
  cross join lateral jsonb_array_elements_text(e.payload -> 'slugs') with ordinality as s(slug, ordinality)
  where e.event_type = 'recommendation_impression'
    and coalesce(e.payload ->> 'placement', '') <> 'home_row'
    and not e.is_test and e.env = 'production' and not e.is_bot
  union all
  select e.vibe, e.terminal_code, e.position::int, e.session_id, 'tap'
  from public.events e
  where e.event_type = 'amenity_tapped' and e.position is not null
    and not e.is_test and e.env = 'production' and not e.is_bot
)
select vibe, terminal_code, position,
       count(*) filter (where kind = 'imp') as impressions,
       count(*) filter (where kind = 'tap') as taps,
       round(count(*) filter (where kind = 'tap')::numeric
             / nullif(count(*) filter (where kind = 'imp'), 0), 4) as ctr,
       count(distinct session_id) as k_sessions
from r
group by 1, 2, 3;

-- 3.2 Editorial engagement per SIN amenity
create view public.analytics_editorial_engagement with (security_invoker = on) as
with r as (
  select s.slug as amenity_slug, e.session_id, 'imp'::text as kind, null::numeric as ms
  from public.events e
  cross join lateral jsonb_array_elements_text(e.payload -> 'slugs') as s(slug)
  where e.event_type = 'recommendation_impression'
    and coalesce(e.payload ->> 'placement', '') <> 'home_row'
    and not e.is_test and e.env = 'production' and not e.is_bot
  union all
  select e.amenity_slug, e.session_id, 'tap', null
  from public.events e
  where e.event_type = 'amenity_tapped' and e.amenity_slug is not null
    and not e.is_test and e.env = 'production' and not e.is_bot
  union all
  select e.amenity_slug, e.session_id, 'dwell', (e.payload ->> 'ms')::numeric
  from public.events e
  where e.event_type = 'amenity_detail_dwell' and e.amenity_slug is not null and e.payload ? 'ms'
    and not e.is_test and e.env = 'production' and not e.is_bot
), g as (
  select amenity_slug,
         count(*) filter (where kind = 'imp') as impressions,
         count(*) filter (where kind = 'tap') as taps,
         avg(ms) filter (where kind = 'dwell') as avg_dwell_ms,
         count(*) filter (where kind = 'dwell') as dwell_count,
         count(distinct session_id) as k_sessions
  from r group by 1
)
select a.amenity_slug, a.name, a.terminal_code, a.editorial_score, a.google_rating,
       coalesce(g.impressions, 0) as impressions,
       coalesce(g.taps, 0) as taps,
       round(coalesce(g.taps, 0)::numeric / nullif(g.impressions, 0), 4) as ctr,
       round(g.avg_dwell_ms) as avg_dwell_ms,
       coalesce(g.dwell_count, 0) as dwell_count,
       coalesce(g.k_sessions, 0) as k_sessions
from public.amenity_detail a
left join g on g.amenity_slug = a.amenity_slug
where a.airport_code = 'SIN';

-- 3.3 Surface parity: agent vs human top-3 overlap per terminal/vibe/SGT day.
--     The agent side reads agent_interactions, which has no is_bot (out of scope).
create view public.analytics_surface_parity with (security_invoker = on) as
with agent as (
  select id, (created_at at time zone 'Asia/Singapore')::date as day_sgt,
         terminal, lower(vibe_requested) as vibe,
         (select array_agg(s.value order by s.ordinality)
            from jsonb_array_elements_text(result_slugs) with ordinality as s(value, ordinality)
           where s.ordinality <= 3) as top3
  from public.agent_interactions
  where tool_name = 'get_recommendations' and jsonb_typeof(result_slugs) = 'array'
    and not is_test and env = 'production'
), human as (
  select id, session_id, (occurred_at at time zone 'Asia/Singapore')::date as day_sgt,
         terminal_code as terminal, lower(vibe) as vibe,
         (select array_agg(s.value order by s.ordinality)
            from jsonb_array_elements_text(payload -> 'slugs') with ordinality as s(value, ordinality)
           where s.ordinality <= 3) as top3
  from public.events
  where event_type = 'recommendation_impression' and jsonb_typeof(payload -> 'slugs') = 'array'
    and coalesce(payload ->> 'placement', '') <> 'home_row'
    and not is_test and env = 'production' and not is_bot
)
select a.day_sgt, a.terminal, a.vibe,
       count(distinct a.id) as agent_calls,
       count(distinct h.id) as human_impressions,
       round(avg((select count(*) from unnest(a.top3) x where x = any(h.top3)))::numeric, 2) as avg_top3_overlap,
       min((select count(*) from unnest(a.top3) x where x = any(h.top3))) as min_top3_overlap,
       count(distinct h.session_id) as k_sessions
from agent a
join human h
  on h.day_sgt = a.day_sgt
 and h.terminal is not distinct from a.terminal
 and h.vibe is not distinct from a.vibe
group by 1, 2, 3;

-- 3.4 Funnel per SGT day and surface. impressions = amenity-list impressions only.
create view public.analytics_funnel with (security_invoker = on) as
with e as (
  select *, (event_type = 'recommendation_impression'
             and coalesce(payload ->> 'placement', '') <> 'home_row') as is_amenity_imp
  from public.events
  where not is_test and env = 'production' and not is_bot
)
select (occurred_at at time zone 'Asia/Singapore')::date as day_sgt,
       surface,
       count(distinct session_id) filter (where event_type = 'session_start') as sessions,
       count(*) filter (where event_type = 'vibe_selected') as vibe_selections,
       count(*) filter (where is_amenity_imp) as impressions,
       count(*) filter (where event_type = 'amenity_tapped') as taps,
       count(*) filter (where event_type = 'amenity_detail_dwell') as dwells,
       round(count(*) filter (where event_type = 'vibe_selected')::numeric
             / nullif(count(distinct session_id) filter (where event_type = 'session_start'), 0), 3) as vibes_per_session,
       round(count(*) filter (where event_type = 'amenity_tapped')::numeric
             / nullif(count(*) filter (where is_amenity_imp), 0), 3) as taps_per_impression,
       round(count(*) filter (where event_type = 'amenity_detail_dwell')::numeric
             / nullif(count(*) filter (where event_type = 'amenity_tapped'), 0), 3) as dwells_per_tap,
       count(distinct session_id) as k_sessions
from e
group by 1, 2;

-- 3.5 Jewel pull: origin terminal x amenity terminal
create view public.analytics_jewel_pull with (security_invoker = on) as
with r as (
  select e.terminal_code as origin_terminal, s.slug as amenity_slug, e.session_id, 'imp'::text as kind
  from public.events e
  cross join lateral jsonb_array_elements_text(e.payload -> 'slugs') as s(slug)
  where e.event_type = 'recommendation_impression'
    and coalesce(e.payload ->> 'placement', '') <> 'home_row'
    and not e.is_test and e.env = 'production' and not e.is_bot
  union all
  select e.terminal_code, e.amenity_slug, e.session_id, 'tap'
  from public.events e
  where e.event_type = 'amenity_tapped' and e.amenity_slug is not null
    and not e.is_test and e.env = 'production' and not e.is_bot
)
select r.origin_terminal,
       a.terminal_code as amenity_terminal,
       (a.terminal_code is distinct from r.origin_terminal) as is_cross_terminal,
       count(*) filter (where r.kind = 'imp') as impressions,
       count(*) filter (where r.kind = 'tap') as taps,
       round(count(*) filter (where r.kind = 'tap')::numeric
             / nullif(count(*) filter (where r.kind = 'imp'), 0), 4) as ctr,
       count(distinct r.session_id) as k_sessions
from r
join public.amenity_detail a on a.amenity_slug = r.amenity_slug
group by 1, 2, 3;

-- 3.6 k-anonymity layer: suppress any cell behind fewer than 5 distinct sessions.
create view public.analytics_ctr_by_position_k5      with (security_invoker = on) as
  select * from public.analytics_ctr_by_position      where k_sessions >= 5;
create view public.analytics_editorial_engagement_k5 with (security_invoker = on) as
  select * from public.analytics_editorial_engagement where k_sessions >= 5;
create view public.analytics_surface_parity_k5       with (security_invoker = on) as
  select * from public.analytics_surface_parity       where k_sessions >= 5;
create view public.analytics_funnel_k5               with (security_invoker = on) as
  select * from public.analytics_funnel               where k_sessions >= 5;
create view public.analytics_jewel_pull_k5           with (security_invoker = on) as
  select * from public.analytics_jewel_pull           where k_sessions >= 5;

-- 3.7 Acquisition (CC-16): sessions per SGT day and landing source.
create view public.analytics_acquisition with (security_invoker = on) as
with s as (
  select e.session_id,
         min(e.occurred_at) as started_at,
         (array_agg(coalesce(e.payload ->> 'utm_source', e.payload ->> 'ref_host', 'direct')
                    order by e.occurred_at, e.id))[1] as source
  from public.events e
  where e.event_type = 'session_start'
    and not e.is_test and e.env = 'production' and not e.is_bot
  group by e.session_id
),
j as (
  select distinct session_id
  from public.journeys
  where session_id is not null
    and not is_test and env = 'production' and not is_bot
),
t as (
  select distinct session_id
  from public.events
  where event_type = 'amenity_tapped'
    and not is_test and env = 'production' and not is_bot
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

-- 3.8 Journey trail (CC-13). SAMPLE-BIAS WARNING: see 20261003085434_journey_trail_views.sql.
create view public.analytics_journey_trail with (security_invoker = on) as
with j as (
  select id,
         concat_ws(' → ', inbound_origin, 'SIN', destination) as corridor,
         case when connection_minutes is null then null
              when connection_minutes < 90  then '<90'
              when connection_minutes < 180 then '90-180'
              when connection_minutes < 360 then '180-360'
              else '360+' end as layover_bucket
  from public.journeys
  where not is_test and env = 'production' and not is_bot
),
e as (
  select id, journey_id, occurred_at, event_type, amenity_slug, minutes_to_boarding, payload
  from public.events
  where journey_id is not null and not is_test and env = 'production' and not is_bot
)
select j.id as journey_id,
       j.corridor,
       j.layover_bucket,
       min(e.occurred_at) as first_event_at,
       count(distinct e.amenity_slug) filter (where e.event_type = 'outcome_eligible') as eligible_count,
       count(distinct e.amenity_slug) filter (where e.event_type = 'outcome_shown') as shown_count,
       count(distinct e.amenity_slug) filter (where e.event_type = 'outcome_response'
                                                and e.payload ->> 'outcome' in ('yes', 'no')) as answered_count,
       count(distinct e.amenity_slug) filter (where e.event_type = 'outcome_response'
                                                and e.payload ->> 'outcome' = 'yes') as yes_count,
       count(distinct e.amenity_slug) filter (where e.event_type = 'outcome_response'
                                                and e.payload ->> 'outcome_source' = 'checkin') as checkin_count,
       coalesce(
         jsonb_agg(jsonb_build_object(
                     'amenity_slug',        e.amenity_slug,
                     'outcome',             e.payload ->> 'outcome',
                     'outcome_reason',      e.payload ->> 'outcome_reason',
                     'outcome_source',      e.payload ->> 'outcome_source',
                     'spend_band',          e.payload ->> 'spend_band',
                     'minutes_to_boarding', e.minutes_to_boarding)
                   order by e.occurred_at, e.id)
           filter (where e.event_type = 'outcome_response'),
         '[]'::jsonb) as stops,
       (array_agg(e.minutes_to_boarding order by e.occurred_at, e.id)
          filter (where e.event_type = 'gate_reached'))[1] as gate_reached_minutes_to_boarding
from j
join e on e.journey_id = j.id
group by j.id, j.corridor, j.layover_bucket;

create view public.analytics_journey_trail_k5 with (security_invoker = on) as
with j as (
  select id,
         concat_ws(' → ', inbound_origin, 'SIN', destination) as corridor,
         case when connection_minutes is null then null
              when connection_minutes < 90  then '<90'
              when connection_minutes < 180 then '90-180'
              when connection_minutes < 360 then '180-360'
              else '360+' end as layover_bucket
  from public.journeys
  where not is_test and env = 'production' and not is_bot
),
c as (
  select journey_id,
         amenity_slug,
         bool_or(event_type = 'outcome_eligible') as eligible,
         bool_or(event_type = 'outcome_shown') as shown,
         bool_or(event_type = 'outcome_response' and payload ->> 'outcome' = 'yes') as said_yes,
         bool_or(event_type = 'outcome_response' and payload ->> 'outcome' = 'no') as said_no,
         bool_or(event_type = 'outcome_response' and payload ->> 'outcome' = 'dismissed') as dismissed
  from public.events
  where event_type in ('outcome_eligible', 'outcome_shown', 'outcome_response')
    and journey_id is not null and amenity_slug is not null
    and not is_test and env = 'production' and not is_bot
  group by journey_id, amenity_slug
)
select j.corridor,
       j.layover_bucket,
       c.amenity_slug,
       count(*) as eligible_candidates,
       count(*) filter (where c.shown) as shown,
       count(*) filter (where c.said_yes) as yes_count,
       count(*) filter (where c.said_no) as no_count,
       count(*) filter (where c.dismissed) as dismissed_count,
       round(count(*) filter (where c.said_yes)::numeric / count(*), 3) as yes_rate,
       count(distinct c.journey_id) as k_journeys
from c
join j on j.id = c.journey_id
where c.eligible
group by j.corridor, j.layover_bucket, c.amenity_slug
having count(distinct c.journey_id) >= 5;

-- 3.9 Comments, restored verbatim.
comment on view public.analytics_acquisition is
  'CC-16. Per SGT day x landing source (utm_source, else ref_host, else direct): sessions with a session_start, of which with a journey, with >=1 amenity_tapped. Production, non-test rows only.';
comment on view public.analytics_journey_trail is
  'CC-13 journey trail, 1 row per production journey. SAMPLE BIAS: only travellers who reopen the app can answer, and reopening correlates with the outcome. Outcomes are self-reported (a Yes is a claim, not a position fix). eligible_count is the denominator and already excludes everyone who never reopened. Never read yes_count as visits.';
comment on view public.analytics_journey_trail_k5 is
  'CC-13 yes rate over eligible candidates by corridor x layover bucket x venue; cells under 5 distinct journeys dropped. SAMPLE BIAS: only travellers who reopen the app can answer, and reopening correlates with the outcome. Self-reported, not a position fix. A biased estimate, never a visit rate.';

-- The schema default ACL grants anon/authenticated full rights on new views. Close it.
revoke all on
  public.analytics_ctr_by_position,      public.analytics_ctr_by_position_k5,
  public.analytics_editorial_engagement, public.analytics_editorial_engagement_k5,
  public.analytics_surface_parity,       public.analytics_surface_parity_k5,
  public.analytics_funnel,               public.analytics_funnel_k5,
  public.analytics_jewel_pull,           public.analytics_jewel_pull_k5,
  public.analytics_acquisition,
  public.analytics_journey_trail,        public.analytics_journey_trail_k5
from anon, authenticated;

commit;
