-- Phase 4: analytics views over events + agent_interactions (DD query layer).
-- All views: security_invoker + revoked from anon/authenticated (service-role only).
-- Day boundaries are Singapore time. Tap positions are 0-based; impression
-- slug arrays are unnested WITH ORDINALITY and shifted by -1 to match.

-- 1. CTR by list position — proves ordering drives behavior
create or replace view analytics_ctr_by_position as
with imp as (
  select e.vibe, e.terminal_code, (s.ordinality - 1)::int as position, count(*) as impressions
  from events e
  cross join lateral jsonb_array_elements_text(e.payload -> 'slugs') with ordinality as s(slug, ordinality)
  where e.event_type = 'recommendation_impression'
  group by 1, 2, 3
), taps as (
  select e.vibe, e.terminal_code, e.position::int as position, count(*) as taps
  from events e
  where e.event_type = 'amenity_tapped' and e.position is not null
  group by 1, 2, 3
)
select coalesce(i.vibe, t.vibe) as vibe,
       coalesce(i.terminal_code, t.terminal_code) as terminal_code,
       coalesce(i.position, t.position) as position,
       coalesce(i.impressions, 0) as impressions,
       coalesce(t.taps, 0) as taps,
       round(coalesce(t.taps, 0)::numeric / nullif(i.impressions, 0), 4) as ctr
from imp i
full outer join taps t
  on t.vibe is not distinct from i.vibe
 and t.terminal_code is not distinct from i.terminal_code
 and t.position = i.position;

-- 2. Editorial engagement — curation signal per amenity (google_rating for later comparison)
create or replace view analytics_editorial_engagement as
with imp as (
  select s.slug as amenity_slug, count(*) as impressions
  from events e
  cross join lateral jsonb_array_elements_text(e.payload -> 'slugs') as s(slug)
  where e.event_type = 'recommendation_impression'
  group by 1
), taps as (
  select amenity_slug, count(*) as taps
  from events where event_type = 'amenity_tapped' and amenity_slug is not null
  group by 1
), dwell as (
  select amenity_slug, avg((payload ->> 'ms')::numeric) as avg_dwell_ms, count(*) as dwell_count
  from events
  where event_type = 'amenity_detail_dwell' and amenity_slug is not null and payload ? 'ms'
  group by 1
)
select a.amenity_slug, a.name, a.terminal_code, a.editorial_score, a.google_rating,
       coalesce(i.impressions, 0) as impressions,
       coalesce(t.taps, 0) as taps,
       round(coalesce(t.taps, 0)::numeric / nullif(i.impressions, 0), 4) as ctr,
       round(d.avg_dwell_ms) as avg_dwell_ms,
       coalesce(d.dwell_count, 0) as dwell_count
from amenity_detail a
left join imp   i on i.amenity_slug = a.amenity_slug
left join taps  t on t.amenity_slug = a.amenity_slug
left join dwell d on d.amenity_slug = a.amenity_slug
where a.airport_code = 'SIN';

-- 3. Agent tool volume — MCP traction + call-chain depth
create or replace view analytics_agent_tool_volume as
select (created_at at time zone 'Asia/Singapore')::date as day_sgt,
       tool_name,
       count(*) as calls,
       round(avg(latency_ms))::int as avg_latency_ms,
       count(distinct session_id) as sessions,
       round(count(*)::numeric / nullif(count(distinct session_id), 0), 2) as avg_calls_per_session
from agent_interactions
where tool_name is not null
group by 1, 2;

-- 4. Surface parity — agent vs human top-3 overlap per terminal/vibe/day (the July 8 exhibit, monitored)
create or replace view analytics_surface_parity as
with agent as (
  select id, (created_at at time zone 'Asia/Singapore')::date as day_sgt,
         terminal, lower(vibe_requested) as vibe,
         (select array_agg(s.value order by s.ordinality)
            from jsonb_array_elements_text(result_slugs) with ordinality as s(value, ordinality)
           where s.ordinality <= 3) as top3
  from agent_interactions
  where tool_name = 'get_recommendations' and jsonb_typeof(result_slugs) = 'array'
), human as (
  select id, (occurred_at at time zone 'Asia/Singapore')::date as day_sgt,
         terminal_code as terminal, lower(vibe) as vibe,
         (select array_agg(s.value order by s.ordinality)
            from jsonb_array_elements_text(payload -> 'slugs') with ordinality as s(value, ordinality)
           where s.ordinality <= 3) as top3
  from events
  where event_type = 'recommendation_impression' and jsonb_typeof(payload -> 'slugs') = 'array'
)
select a.day_sgt, a.terminal, a.vibe,
       count(distinct a.id) as agent_calls,
       count(distinct h.id) as human_impressions,
       round(avg((select count(*) from unnest(a.top3) x where x = any(h.top3)))::numeric, 2) as avg_top3_overlap,
       min((select count(*) from unnest(a.top3) x where x = any(h.top3))) as min_top3_overlap
from agent a
join human h
  on h.day_sgt = a.day_sgt
 and h.terminal is not distinct from a.terminal
 and h.vibe is not distinct from a.vibe
group by 1, 2, 3;

-- 5. Funnel — is telemetry alive + step conversion
create or replace view analytics_funnel as
select (occurred_at at time zone 'Asia/Singapore')::date as day_sgt,
       surface,
       count(distinct session_id) filter (where event_type = 'session_start') as sessions,
       count(*) filter (where event_type = 'vibe_selected') as vibe_selections,
       count(*) filter (where event_type = 'recommendation_impression') as impressions,
       count(*) filter (where event_type = 'amenity_tapped') as taps,
       count(*) filter (where event_type = 'amenity_detail_dwell') as dwells,
       round(count(*) filter (where event_type = 'vibe_selected')::numeric
             / nullif(count(distinct session_id) filter (where event_type = 'session_start'), 0), 3) as vibes_per_session,
       round(count(*) filter (where event_type = 'amenity_tapped')::numeric
             / nullif(count(*) filter (where event_type = 'recommendation_impression'), 0), 3) as taps_per_impression,
       round(count(*) filter (where event_type = 'amenity_detail_dwell')::numeric
             / nullif(count(*) filter (where event_type = 'amenity_tapped'), 0), 3) as dwells_per_tap
from events
group by 1, 2;

-- 6. Jewel pull — origin terminal × amenity terminal engagement matrix
create or replace view analytics_jewel_pull as
with imp as (
  select e.terminal_code as origin_terminal, s.slug as amenity_slug, count(*) as impressions
  from events e
  cross join lateral jsonb_array_elements_text(e.payload -> 'slugs') as s(slug)
  where e.event_type = 'recommendation_impression'
  group by 1, 2
), taps as (
  select terminal_code as origin_terminal, amenity_slug, count(*) as taps
  from events where event_type = 'amenity_tapped' and amenity_slug is not null
  group by 1, 2
), merged as (
  select coalesce(i.origin_terminal, t.origin_terminal) as origin_terminal,
         coalesce(i.amenity_slug, t.amenity_slug) as amenity_slug,
         coalesce(i.impressions, 0) as impressions,
         coalesce(t.taps, 0) as taps
  from imp i
  full outer join taps t
    on t.origin_terminal is not distinct from i.origin_terminal
   and t.amenity_slug = i.amenity_slug
)
select m.origin_terminal,
       a.terminal_code as amenity_terminal,
       (a.terminal_code is distinct from m.origin_terminal) as is_cross_terminal,
       sum(m.impressions) as impressions,
       sum(m.taps) as taps,
       round(sum(m.taps)::numeric / nullif(sum(m.impressions), 0), 4) as ctr
from merged m
join amenity_detail a on a.amenity_slug = m.amenity_slug
group by 1, 2, 3;

-- Access control: schema default ACL would grant anon full access to new views,
-- and plain views execute as owner (bypassing base RLS). Both closed here.
alter view analytics_ctr_by_position      set (security_invoker = on);
alter view analytics_editorial_engagement set (security_invoker = on);
alter view analytics_agent_tool_volume    set (security_invoker = on);
alter view analytics_surface_parity       set (security_invoker = on);
alter view analytics_funnel               set (security_invoker = on);
alter view analytics_jewel_pull           set (security_invoker = on);
revoke all on analytics_ctr_by_position, analytics_editorial_engagement,
              analytics_agent_tool_volume, analytics_surface_parity,
              analytics_funnel, analytics_jewel_pull
from anon, authenticated;

-- Approved base-table fix: the pre-existing agent_interactions policy was
-- USING(true) for ALL roles — anon could read/write agent telemetry.
-- Service-role clients bypass RLS; nothing legitimate loses access.
drop policy "Service role can do everything" on public.agent_interactions;
create policy "service_role_only" on public.agent_interactions
  for all to service_role using (true) with check (true);
