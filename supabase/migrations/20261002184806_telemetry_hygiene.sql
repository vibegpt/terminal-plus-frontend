-- CC-7 migration 1: telemetry hygiene (env, test flags, joins, timezone).
-- Day zero = the CC-1F production READY time, from tasks/release-2026-09-report.md:
--   2026-10-02 08:04:28.232 UTC (dpl_923EJGizc8BczThKspLMaqTFgCyD).
-- Everything before day zero is dev, legacy or preview smoke. After it, only the
-- listed CC-1F production smoke ids are test rows.
-- The journeys.anon_id / session_id uuid cast is deliberately NOT here: it ships in
-- a second migration once api/journey.ts enforces UUIDs in production (CC-7 gate).

begin;

-- 1. New columns. Constant defaults, so these are metadata-only on PG15.
alter table public.events
  add column if not exists env text not null default 'unknown',
  add column if not exists is_test boolean not null default false,
  add column if not exists journey_id uuid;
alter table public.agent_interactions
  add column if not exists env text not null default 'unknown',
  add column if not exists is_test boolean not null default false,
  add column if not exists journey_id uuid;
alter table public.journeys
  add column if not exists env text not null default 'unknown',
  add column if not exists is_test boolean not null default false,
  add column if not exists inbound_arrival_utc timestamptz,
  add column if not exists connection_minutes integer;

-- 2. journeys.created_at was naive timestamp defaulting to now() in a UTC session.
alter table public.journeys
  alter column created_at type timestamptz using created_at at time zone 'UTC';

-- 3. Test rows: the date rule plus the CC-1F production smoke ids.
update public.events set is_test = true
 where occurred_at < timestamptz '2026-10-02 08:04:28.232+00'
    or id = any('{87,88,89,90,91,92,93,94,95,96}'::bigint[]);
update public.agent_interactions set is_test = true
 where created_at < timestamptz '2026-10-02 08:04:28.232+00'
    or id = any('{ef3500bd-fb4a-4d37-82bd-b0b3bac54b3d}'::uuid[]);
update public.journeys set is_test = true
 where created_at < timestamptz '2026-10-02 08:04:28.232+00'
    or id = any('{37c90366-1645-4a67-9f55-ef1be8f26447,b82f4c08-a2fa-4251-ac28-b0c15858540e,968fd649-bbaf-4d6b-bab6-e80e305ba2e5}'::uuid[]);

-- 4. Rows written by production's pre-CC-7 code after day zero carry env 'unknown'.
--    Label the non-test ones production (Todd, 2 Oct). Repeated once CC-7 code is live.
update public.events             set env = 'production'
 where occurred_at >= timestamptz '2026-10-02 08:04:28.232+00' and not is_test and env = 'unknown';
update public.agent_interactions set env = 'production'
 where created_at  >= timestamptz '2026-10-02 08:04:28.232+00' and not is_test and env = 'unknown';
update public.journeys           set env = 'production'
 where created_at  >= timestamptz '2026-10-02 08:04:28.232+00' and not is_test and env = 'unknown';

-- 5. Indexes.
create index if not exists events_journey_idx  on public.events (journey_id);
create index if not exists events_env_time_idx on public.events (env, is_test, occurred_at);

-- 6. Analytics views, rebuilt over clean production rows only.
--    Dropped and recreated rather than replaced: CREATE OR REPLACE VIEW resets
--    reloptions, which would silently drop security_invoker.
--    Every view gains a trailing k_sessions column (distinct sessions behind the
--    cell) so the _k5 variants below are a plain filter.
--    Home-row impressions (payload.placement = 'home_row') list collection ids, not
--    amenity slugs, so the amenity-level impression sources exclude them.
drop view if exists public.analytics_ctr_by_position, public.analytics_editorial_engagement,
  public.analytics_agent_tool_volume, public.analytics_surface_parity,
  public.analytics_funnel, public.analytics_jewel_pull;

-- 6.1 CTR by list position (0-based; impression ordinality shifted by -1)
create view public.analytics_ctr_by_position with (security_invoker = on) as
with r as (
  select e.vibe, e.terminal_code, (s.ordinality - 1)::int as position, e.session_id, 'imp'::text as kind
  from public.events e
  cross join lateral jsonb_array_elements_text(e.payload -> 'slugs') with ordinality as s(slug, ordinality)
  where e.event_type = 'recommendation_impression'
    and coalesce(e.payload ->> 'placement', '') <> 'home_row'
    and not e.is_test and e.env = 'production'
  union all
  select e.vibe, e.terminal_code, e.position::int, e.session_id, 'tap'
  from public.events e
  where e.event_type = 'amenity_tapped' and e.position is not null
    and not e.is_test and e.env = 'production'
)
select vibe, terminal_code, position,
       count(*) filter (where kind = 'imp') as impressions,
       count(*) filter (where kind = 'tap') as taps,
       round(count(*) filter (where kind = 'tap')::numeric
             / nullif(count(*) filter (where kind = 'imp'), 0), 4) as ctr,
       count(distinct session_id) as k_sessions
from r
group by 1, 2, 3;

-- 6.2 Editorial engagement per SIN amenity
create view public.analytics_editorial_engagement with (security_invoker = on) as
with r as (
  select s.slug as amenity_slug, e.session_id, 'imp'::text as kind, null::numeric as ms
  from public.events e
  cross join lateral jsonb_array_elements_text(e.payload -> 'slugs') as s(slug)
  where e.event_type = 'recommendation_impression'
    and coalesce(e.payload ->> 'placement', '') <> 'home_row'
    and not e.is_test and e.env = 'production'
  union all
  select e.amenity_slug, e.session_id, 'tap', null
  from public.events e
  where e.event_type = 'amenity_tapped' and e.amenity_slug is not null
    and not e.is_test and e.env = 'production'
  union all
  select e.amenity_slug, e.session_id, 'dwell', (e.payload ->> 'ms')::numeric
  from public.events e
  where e.event_type = 'amenity_detail_dwell' and e.amenity_slug is not null and e.payload ? 'ms'
    and not e.is_test and e.env = 'production'
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

-- 6.3 Agent tool volume (MCP). session_id = mcp_session_key when the client sends one.
create view public.analytics_agent_tool_volume with (security_invoker = on) as
select (created_at at time zone 'Asia/Singapore')::date as day_sgt,
       tool_name,
       count(*) as calls,
       round(avg(latency_ms))::int as avg_latency_ms,
       count(distinct session_id) as sessions,
       round(count(*)::numeric / nullif(count(distinct session_id), 0), 2) as avg_calls_per_session,
       count(distinct session_id) as k_sessions
from public.agent_interactions
where tool_name is not null
  and not is_test and env = 'production'
group by 1, 2;

-- 6.4 Surface parity: agent vs human top-3 overlap per terminal/vibe/SGT day
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
    and not is_test and env = 'production'
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

-- 6.5 Funnel per SGT day and surface. impressions = amenity-list impressions only.
create view public.analytics_funnel with (security_invoker = on) as
with e as (
  select *, (event_type = 'recommendation_impression'
             and coalesce(payload ->> 'placement', '') <> 'home_row') as is_amenity_imp
  from public.events
  where not is_test and env = 'production'
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

-- 6.6 Jewel pull: origin terminal x amenity terminal
create view public.analytics_jewel_pull with (security_invoker = on) as
with r as (
  select e.terminal_code as origin_terminal, s.slug as amenity_slug, e.session_id, 'imp'::text as kind
  from public.events e
  cross join lateral jsonb_array_elements_text(e.payload -> 'slugs') as s(slug)
  where e.event_type = 'recommendation_impression'
    and coalesce(e.payload ->> 'placement', '') <> 'home_row'
    and not e.is_test and e.env = 'production'
  union all
  select e.terminal_code, e.amenity_slug, e.session_id, 'tap'
  from public.events e
  where e.event_type = 'amenity_tapped' and e.amenity_slug is not null
    and not e.is_test and e.env = 'production'
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

-- 7. k-anonymity layer: suppress any cell behind fewer than 5 distinct sessions.
create view public.analytics_ctr_by_position_k5      with (security_invoker = on) as
  select * from public.analytics_ctr_by_position      where k_sessions >= 5;
create view public.analytics_editorial_engagement_k5 with (security_invoker = on) as
  select * from public.analytics_editorial_engagement where k_sessions >= 5;
create view public.analytics_agent_tool_volume_k5    with (security_invoker = on) as
  select * from public.analytics_agent_tool_volume    where k_sessions >= 5;
create view public.analytics_surface_parity_k5       with (security_invoker = on) as
  select * from public.analytics_surface_parity       where k_sessions >= 5;
create view public.analytics_funnel_k5               with (security_invoker = on) as
  select * from public.analytics_funnel               where k_sessions >= 5;
create view public.analytics_jewel_pull_k5           with (security_invoker = on) as
  select * from public.analytics_jewel_pull           where k_sessions >= 5;

-- The schema default ACL grants anon/authenticated full rights on new views. Close it.
revoke all on
  public.analytics_ctr_by_position,      public.analytics_ctr_by_position_k5,
  public.analytics_editorial_engagement, public.analytics_editorial_engagement_k5,
  public.analytics_agent_tool_volume,    public.analytics_agent_tool_volume_k5,
  public.analytics_surface_parity,       public.analytics_surface_parity_k5,
  public.analytics_funnel,               public.analytics_funnel_k5,
  public.analytics_jewel_pull,           public.analytics_jewel_pull_k5
from anon, authenticated;

-- 8. Legacy SECURITY DEFINER views. 0 readers: no DB dependents, anon/authenticated
--    SELECT revoked since CC-2 A, and pg_stat_statements (reset 2026-09-25) shows only
--    admin statements. The 2 materialized views stay as they are (revoked).
drop view if exists
  public.collection_amenity_details, public.collection_stats, public.collection_stats_v2,
  public.session_analytics, public.smart7_effectiveness, public.smart7_performance_summary,
  public.vibe_performance_analytics;

commit;
