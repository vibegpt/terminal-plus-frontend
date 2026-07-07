-- route_stops amenity_slug backfill
-- Applied 2026-07-07 (project bpbyhdjdezynyiclqezy).
--
-- Two curated routes (qf1-quick-stop, sq-connector) shipped with all
-- amenity_slug values null, so get_route (live MCP tool) returned
-- unresolvable amenity stops. This backfills the 6 stops that map to a
-- real, same-terminal amenity in amenity_detail. Slugs verified to
-- resolve before/after apply.
--
-- Idempotent: each UPDATE is guarded `where amenity_slug is null`, so
-- re-running is a no-op once applied.
--
-- DELIBERATELY LEFT NULL (not amenities — navigation steps that carry
-- their own name + editorial_note):
--   qf1-quick-stop  stop 1  Restrooms near D gates      (facility)
--   qf1-quick-stop  stop 5  Walk to gate + security     (buffer)
--   sq-connector    stop 5  Walk to departure gate      (buffer)
--
-- UNMATCHED — manual review (no valid same-terminal amenity exists):
--   sq-connector    stop 1  SilverKris Business Lounge  (T3)
--     amenity_detail has no T3 SilverKris row; only a T1 one. T3 lounges
--     present (Cathay Pacific, SATS Premier) are different lounges.
--     Needs a real T3 SilverKris amenity row created — out of scope here.

-- qf1-quick-stop (SIN-T1) --------------------------------------------

-- 2 · Hawker stalls → Kopitiam (T1 transit hawker food; matches reverse-kangaroo)
update route_stops rs
set amenity_slug = 'sin-t1-kopitiam-1757008220.066062'
from route_templates rt
where rs.route_template_id = rt.id
  and rt.route_id = 'qf1-quick-stop'
  and rs.stop_order = 2
  and rs.amenity_slug is null;

-- 3 · Cactus Garden → Rooftop Cactus Garden (T1 rooftop; matches sibling routes)
update route_stops rs
set amenity_slug = 'cactus-garden-t1'
from route_templates rt
where rs.route_template_id = rt.id
  and rt.route_id = 'qf1-quick-stop'
  and rs.stop_order = 3
  and rs.amenity_slug is null;

-- 4 · Duty-free corridor → Lotte Duty Free (sole duty-free anchor at Changi)
update route_stops rs
set amenity_slug = 'lotte-duty-free-t1-new'
from route_templates rt
where rs.route_template_id = rt.id
  and rt.route_id = 'qf1-quick-stop'
  and rs.stop_order = 4
  and rs.amenity_slug is null;

-- sq-connector (SIN-T3) ----------------------------------------------

-- 2 · Butterfly Garden → Butterfly Garden T3 (exact; matches terminal-hop)
update route_stops rs
set amenity_slug = 'butterfly-garden-t3-new'
from route_templates rt
where rs.route_template_id = rt.id
  and rt.route_id = 'sq-connector'
  and rs.stop_order = 2
  and rs.amenity_slug is null;

-- 3 · Luxury retail corridor → Louis Vuitton (named as anchor in editorial_note)
update route_stops rs
set amenity_slug = 'louis-vuitton-t3'
from route_templates rt
where rs.route_template_id = rt.id
  and rt.route_id = 'sq-connector'
  and rs.stop_order = 3
  and rs.amenity_slug is null;

-- 4 · 24hr Movie Theatre → Movie Theatre T3 (exact name + terminal)
update route_stops rs
set amenity_slug = 'movie-theatre-t3'
from route_templates rt
where rs.route_template_id = rt.id
  and rt.route_id = 'sq-connector'
  and rs.stop_order = 4
  and rs.amenity_slug is null;
