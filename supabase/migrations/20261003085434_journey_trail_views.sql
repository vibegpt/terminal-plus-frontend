-- CC-13: journey trail views. Each journey from first event to the gate, built from the
-- outcome strip, the "I'm here" check-in and the gate chip.
--
-- SAMPLE-BIAS WARNING. Only people who reopen the app can answer the outcome strip, and
-- whether someone reopens correlates with the outcome itself: the traveller who went and
-- lingered, or ran for the gate, may never come back to answer. outcome_eligible (the
-- denominator) is logged on resume, so it already excludes everyone who never reopened.
-- An outcome is self-reported: a tap on Yes is a claim, not a position fix, and nothing
-- here is a visit. Read every yes rate as a biased estimate over eligible candidates,
-- never as a visit rate, and never divide by answers.
--
-- Views only. events.event_type is plain text with no CHECK, so the 5 new event types
-- (outcome_eligible, outcome_shown, outcome_response, gate_prompt_shown, gate_reached)
-- need no table change; api/events.ts validates their payloads and rejects unknown enums.
-- Both views read production, non-test rows only, and join events to journeys on
-- journey_id (CC-7).

begin;

drop view if exists public.analytics_journey_trail_k5, public.analytics_journey_trail;

-- 1 row per journey. stops = every outcome answer in order (dismissals included).
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
  where not is_test and env = 'production'
),
e as (
  select id, journey_id, occurred_at, event_type, amenity_slug, minutes_to_boarding, payload
  from public.events
  where journey_id is not null and not is_test and env = 'production'
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

-- Yes rate over eligible candidates, per corridor x layover bucket x venue.
-- A candidate = one (journey, venue) that logged outcome_eligible. Any cell behind
-- fewer than 5 distinct journeys is dropped.
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
  where not is_test and env = 'production'
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
    and not is_test and env = 'production'
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

-- The schema default ACL grants anon/authenticated full rights on new views. Close it.
revoke all on public.analytics_journey_trail, public.analytics_journey_trail_k5 from anon, authenticated;

comment on view public.analytics_journey_trail is
  'CC-13 journey trail, 1 row per production journey. SAMPLE BIAS: only travellers who reopen the app can answer, and reopening correlates with the outcome. Outcomes are self-reported (a Yes is a claim, not a position fix). eligible_count is the denominator and already excludes everyone who never reopened. Never read yes_count as visits.';
comment on view public.analytics_journey_trail_k5 is
  'CC-13 yes rate over eligible candidates by corridor x layover bucket x venue; cells under 5 distinct journeys dropped. SAMPLE BIAS: only travellers who reopen the app can answer, and reopening correlates with the outcome. Self-reported, not a position fix. A biased estimate, never a visit rate.';

commit;
