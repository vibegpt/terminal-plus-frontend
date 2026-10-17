-- CC-26 C6 (D5, Todd 17 Oct): why an MCP tool call returned nothing.
--   no_recommendations  get_recommendations found no eligible venue
--   no_route_stops      get_route found no venue to put on a route
--   flight_not_found    the flight lookup answered "no such flight at SIN"
--   upstream_error      a dependency failed (flight API error or timeout, or the
--                       catalogue query): reliability, not demand. Keep it out of
--                       any "unanswerable query" view.
-- Null = a normal result. Chat rows leave it null.

alter table public.agent_interactions
  add column zero_reason text
  constraint agent_interactions_zero_reason_check
  check (zero_reason in ('no_recommendations', 'no_route_stops', 'flight_not_found', 'upstream_error'));

-- Service-role only (CC-2B). Adding a column changes no grants; restate the lockdown.
revoke all on public.agent_interactions from anon, authenticated;
