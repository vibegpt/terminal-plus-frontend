-- CC-25: agent card views. Cards the app showed when the journey changed state
-- (plan, delay, next_stop, gate_change, final_call), what people did with them, and
-- whether venues reached from a card get more outcome "yes" answers than browsed ones.
--
-- SAMPLE-BIAS WARNING (as CC-13): an outcome answer is self-reported and only people
-- who reopen the app can give one. Read every yes rate as a biased estimate, never a
-- visit rate.
--
-- Views only. events.event_type is plain text with no CHECK; api/events.ts validates the
-- three new event types and rejects unknown enums. Both views read production, non-test,
-- non-bot rows of events and journeys only, join on journey_id (CC-7), and run with the
-- caller's rights (security_invoker). Supabase's default privileges grant anon and
-- authenticated everything on a new view, so both are revoked here.

begin;

drop view if exists public.analytics_agent_cards_k5, public.analytics_agent_cards;

-- row_kind 'card': 1 row per trigger x layover_bucket.
--   cards_shown     agent_card_shown, 1 per card_id
--   cards_dismissed cards with an agent_card_dismissed
--   cards_tapped    cards with any agent_card_tapped (stop, swap, chat or expand)
--   stop_taps       agent_card_tapped with target 'stop'
--   outcome_yes     cards with an outcome_response 'yes' carrying their card_id
--   yes_rate        outcome_yes / cards_shown
-- row_kind 'comparison': 1 row. Outcome candidates (outcome_eligible, 1 per journey and
--   venue) opened from a card vs not, and the yes rate of each over its candidates.
create view public.analytics_agent_cards with (security_invoker = on) as
with j as (
  select id,
         case when connection_minutes is null then 'none'
              when connection_minutes < 90  then '<90'
              when connection_minutes < 180 then '90-180'
              when connection_minutes < 360 then '180-360'
              else '360+' end as layover_bucket
  from public.journeys
  where not is_test and env = 'production' and not is_bot
),
e as (
  select ev.id, ev.journey_id, ev.event_type, ev.amenity_slug, ev.payload, j.layover_bucket
  from public.events ev
  join j on j.id = ev.journey_id
  where not ev.is_test and ev.env = 'production' and not ev.is_bot
),
cards as (
  select distinct on (payload ->> 'card_id')
         payload ->> 'card_id' as card_id,
         payload ->> 'trigger' as trigger,
         journey_id,
         layover_bucket
  from e
  where event_type = 'agent_card_shown'
  order by payload ->> 'card_id', id
),
per_card as (
  select c.card_id, c.trigger, c.journey_id, c.layover_bucket,
         exists (select 1 from e where e.event_type = 'agent_card_dismissed' and e.payload ->> 'card_id' = c.card_id) as dismissed,
         exists (select 1 from e where e.event_type = 'agent_card_tapped' and e.payload ->> 'card_id' = c.card_id) as tapped,
         (select count(*) from e where e.event_type = 'agent_card_tapped' and e.payload ->> 'card_id' = c.card_id
                                   and e.payload ->> 'target' = 'stop') as stop_taps,
         exists (select 1 from e where e.event_type = 'outcome_response' and e.payload ->> 'card_id' = c.card_id
                                   and e.payload ->> 'outcome' = 'yes') as outcome_yes
  from cards c
),
cand as (
  -- 1 candidate per journey and venue; from a card when its outcome_eligible carried a card_id.
  select journey_id, amenity_slug, bool_or(payload ? 'card_id') as from_card
  from e
  where event_type = 'outcome_eligible'
  group by journey_id, amenity_slug
),
cand_yes as (
  select distinct journey_id, amenity_slug
  from e
  where event_type = 'outcome_response' and payload ->> 'outcome' = 'yes'
),
cmp as (
  select c.journey_id, c.from_card, (y.journey_id is not null) as yes
  from cand c
  left join cand_yes y on y.journey_id = c.journey_id and y.amenity_slug = c.amenity_slug
)
select 'card'::text as row_kind,
       trigger,
       layover_bucket,
       count(distinct journey_id) as journeys,
       count(*) as cards_shown,
       count(*) filter (where dismissed) as cards_dismissed,
       count(*) filter (where tapped) as cards_tapped,
       coalesce(sum(stop_taps), 0)::bigint as stop_taps,
       count(*) filter (where outcome_yes) as outcome_yes,
       round(count(*) filter (where outcome_yes)::numeric / nullif(count(*), 0), 3) as yes_rate,
       null::bigint as candidates_with_card,
       null::bigint as candidates_without_card,
       null::bigint as journeys_with_card,
       null::bigint as journeys_without_card,
       null::numeric as yes_rate_with_card,
       null::numeric as yes_rate_without_card
from per_card
group by trigger, layover_bucket
union all
select 'comparison', null, null,
       count(distinct journey_id),
       null, null, null, null, null, null,
       count(*) filter (where from_card),
       count(*) filter (where not from_card),
       count(distinct journey_id) filter (where from_card),
       count(distinct journey_id) filter (where not from_card),
       round(count(*) filter (where from_card and yes)::numeric / nullif(count(*) filter (where from_card), 0), 3),
       round(count(*) filter (where not from_card and yes)::numeric / nullif(count(*) filter (where not from_card), 0), 3)
from cmp
having count(*) > 0;

-- k-anonymity: any card cell behind fewer than 5 distinct journeys is dropped, and the
-- comparison row only when both of its sides have 5 or more.
create view public.analytics_agent_cards_k5 with (security_invoker = on) as
select *
from public.analytics_agent_cards
where (row_kind = 'card' and journeys >= 5)
   or (row_kind = 'comparison' and journeys_with_card >= 5 and journeys_without_card >= 5);

revoke all on public.analytics_agent_cards, public.analytics_agent_cards_k5 from anon, authenticated;

commit;
