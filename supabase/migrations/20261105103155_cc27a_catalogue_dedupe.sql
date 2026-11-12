-- CC-27A · catalogue dedupe (Parts A and C), 5 Nov 2026.
-- Generated (session scratchpad gen_migration.py) from the G4 action list and G3 evidence.
-- 63 rows: 29 deleted, 1 moved, 33 merged.
-- Rollback: scripts/cc27a-restore.sql from the G2a snapshot (~/tp-backups/2026-11-05/*.json, restore-tested).

-- Applied with apply_migration, which runs the file in one transaction.

-- 1. Backup / slug-map table: every column of each affected row, plus the action.
create table public.amenity_dedupe_20261105 as
  select d.*, m.action, m.canonical_slug, m.canonical_id, m.evidence_url, m.reason, m.new_slug,
         now() as logged_at
  from public.amenity_detail d
  join (values
    (10029, 'deleted', 'butterfly-garden-t3-new', 10091, 'https://www.changiairport.com/en/experience/attractions-directory/butterfly-garden.html', 'Phantom copy: the official directory lists this venue only at its canonical location · T3 · Transit · Level 2, Level 3', null),
    (10060, 'deleted', 'butterfly-garden-t3-new', 10091, 'https://www.changiairport.com/en/experience/attractions-directory/butterfly-garden.html', 'Phantom copy: the official directory lists this venue only at its canonical location · T3 · Transit · Level 2, Level 3', null),
    (10122, 'deleted', 'butterfly-garden-t3-new', 10091, 'https://www.changiairport.com/en/experience/attractions-directory/butterfly-garden.html', 'Phantom copy: the official directory lists this venue only at its canonical location · T3 · Transit · Level 2, Level 3', null),
    (10030, 'deleted', 'cactus-garden-t1', 100006, 'https://www.changiairport.com/en/experience/attractions-directory/cactus-garden.html', 'Phantom copy: the official directory lists this venue only at its canonical location · T1 · Transit · Level 3', null),
    (10061, 'deleted', 'cactus-garden-t1', 100006, 'https://www.changiairport.com/en/experience/attractions-directory/cactus-garden.html', 'Phantom copy: the official directory lists this venue only at its canonical location · T1 · Transit · Level 3', null),
    (10092, 'deleted', 'cactus-garden-t1', 100006, 'https://www.changiairport.com/en/experience/attractions-directory/cactus-garden.html', 'Phantom copy: the official directory lists this venue only at its canonical location · T1 · Transit · Level 3', null),
    (10123, 'deleted', 'cactus-garden-t1', 100006, 'https://www.changiairport.com/en/experience/attractions-directory/cactus-garden.html', 'Phantom copy: the official directory lists this venue only at its canonical location · T1 · Transit · Level 3', null),
    (10032, 'deleted', 'sunflower-garden-t2-new', 10063, 'https://www.changiairport.com/en/experience/attractions-directory/sunflower-garden.html', 'Phantom copy: the official directory lists this venue only at its canonical location · T2 · Transit · Level 3', null),
    (10094, 'deleted', 'sunflower-garden-t2-new', 10063, 'https://www.changiairport.com/en/experience/attractions-directory/sunflower-garden.html', 'Phantom copy: the official directory lists this venue only at its canonical location · T2 · Transit · Level 3', null),
    (10125, 'deleted', 'sunflower-garden-t2-new', 10063, 'https://www.changiairport.com/en/experience/attractions-directory/sunflower-garden.html', 'Phantom copy: the official directory lists this venue only at its canonical location · T2 · Transit · Level 3', null),
    (10055, 'deleted', 'canopy-park-jewel-new', 10000, 'https://www.jewelchangiairport.com/en/attractions/Mastercard-canopy-bridge.html', 'Phantom copy: the official directory lists this venue only at its canonical location · Jewel · Public · Level 5', null),
    (10086, 'deleted', 'canopy-park-jewel-new', 10000, 'https://www.jewelchangiairport.com/en/attractions/Mastercard-canopy-bridge.html', 'Phantom copy: the official directory lists this venue only at its canonical location · Jewel · Public · Level 5', null),
    (10117, 'deleted', 'canopy-park-jewel-new', 10000, 'https://www.jewelchangiairport.com/en/attractions/Mastercard-canopy-bridge.html', 'Phantom copy: the official directory lists this venue only at its canonical location · Jewel · Public · Level 5', null),
    (10025, 'deleted', 'mirror-maze-jewel-new', 10004, 'https://www.jewelchangiairport.com/en/attractions/mirror-maze.html', 'Phantom copy: the official directory lists this venue only at its canonical location · Jewel · Public · Level 5 · Canopy Park', null),
    (10057, 'deleted', 'mirror-maze-jewel-new', 10004, 'https://www.jewelchangiairport.com/en/attractions/mirror-maze.html', 'Phantom copy: the official directory lists this venue only at its canonical location · Jewel · Public · Level 5 · Canopy Park', null),
    (10119, 'deleted', 'mirror-maze-jewel-new', 10004, 'https://www.jewelchangiairport.com/en/attractions/mirror-maze.html', 'Phantom copy: the official directory lists this venue only at its canonical location · Jewel · Public · Level 5 · Canopy Park', null),
    (10026, 'deleted', 'rain-vortex-jewel-new', 10005, 'https://www.jewelchangiairport.com/en/attractions/rain-vortex.html', 'Phantom copy: the official directory lists this venue only at its canonical location · Jewel · Public · Heart of Shiseido Forest Valley', null),
    (10058, 'deleted', 'rain-vortex-jewel-new', 10005, 'https://www.jewelchangiairport.com/en/attractions/rain-vortex.html', 'Phantom copy: the official directory lists this venue only at its canonical location · Jewel · Public · Heart of Shiseido Forest Valley', null),
    (10056, 'deleted', 'foggy-bowls-jewel-new', 10001, 'https://www.jewelchangiairport.com/en/attractions/foggy-bowls.html', 'Phantom copy: the official directory lists this venue only at its canonical location · Jewel · Public · Level 5 · Canopy Park', null),
    (10087, 'deleted', 'foggy-bowls-jewel-new', 10001, 'https://www.jewelchangiairport.com/en/attractions/foggy-bowls.html', 'Phantom copy: the official directory lists this venue only at its canonical location · Jewel · Public · Level 5 · Canopy Park', null),
    (10089, 'deleted', 'changi-experience-studio-jewel-new', 10007, 'https://www.jewelchangiairport.com/en/attractions/ces.html', 'Phantom copy: the official directory lists this venue only at its canonical location · Jewel · Public · Level 4', null),
    (10120, 'deleted', 'changi-experience-studio-jewel-new', 10007, 'https://www.jewelchangiairport.com/en/attractions/ces.html', 'Phantom copy: the official directory lists this venue only at its canonical location · Jewel · Public · Level 4', null),
    (10027, 'deleted', 'shiseido-forest-valley-jewel-new', 10006, 'https://www.jewelchangiairport.com/en/attractions/forest-valley.html', 'Phantom copy: the official directory lists this venue only at its canonical location · Forest Valley: Jewel · Public', null),
    (10024, 'deleted', 'manulife-sky-nets-jewel-new', 10003, 'https://www.jewelchangiairport.com/en/attractions/walking-net.html', 'Phantom copy: the official directory lists this venue only at its canonical location · Walking Net / Bouncing Net: Jewel · Public · Level 5 · Canopy Park (D4)', null),
    (10118, 'deleted', 'manulife-sky-nets-jewel-new', 10003, 'https://www.jewelchangiairport.com/en/attractions/walking-net.html', 'Phantom copy: the official directory lists this venue only at its canonical location · Walking Net / Bouncing Net: Jewel · Public · Level 5 · Canopy Park (D4)', null),
    (50038, 'deleted', 'travelling-family', 114, 'https://www.changiairport.com/en/experience/attractions-directory/travelling-family.html', 'Phantom copy: the official directory lists this venue only at its canonical location · T4 · Transit · Level 2', null),
    (50141, 'deleted', 'vessel', 123, 'https://www.changiairport.com/en/experience/attractions-directory/vessel.html', 'Phantom copy: the official directory lists this venue only at its canonical location · T3 · Transit · Level 2', null),
    (10072, 'moved', 'yotelair-singapore-changi-jewel', 10072, 'https://www.changiairport.com/en/at-changi/facilities-and-services-directory/transit-hotels.html', 'Wrong terminal: the official directory lists this hotel in Jewel (landside) · Jewel · Level 4 · YOTELAIR Singapore Changi Airport (Public)', 'yotelair-singapore-changi-jewel'),
    (10103, 'deleted', 'yotelair-singapore-changi-jewel', 10072, 'https://www.changiairport.com/en/at-changi/facilities-and-services-directory/transit-hotels.html', 'Phantom copy: the official directory lists this venue only at its canonical location · Jewel · Level 4 · YOTELAIR Singapore Changi Airport (Public)', null),
    (10134, 'deleted', 'yotelair-singapore-changi-jewel', 10072, 'https://www.changiairport.com/en/at-changi/facilities-and-services-directory/transit-hotels.html', 'Phantom copy: the official directory lists this venue only at its canonical location · Jewel · Level 4 · YOTELAIR Singapore Changi Airport (Public)', null),
    (50054, 'merged', 'lotte-duty-free-wines-spirits-t1-level-2-53', 59, 'https://www.changiairport.com/en/dine-and-shop/shop-directory/shop-detail.lotte-duty-free-wines-spirits.html', 'Same outlet imported twice (same brand, terminal, level and shop) · T1 L2 #02-53 · 24/7', null),
    (50057, 'merged', 'lotte-duty-free-wines-spirits-t1-level-2-46', 62, 'https://www.changiairport.com/en/dine-and-shop/shop-directory/shop-detail.lotte-duty-free-wines-spirits.html', 'Same outlet imported twice (same brand, terminal, level and shop) · T1 L2 #02-46 · 24/7', null),
    (50055, 'merged', 'lotte-duty-free-wines-spirits-t1-level-2-68', 60, 'https://www.changiairport.com/en/dine-and-shop/shop-directory/shop-detail.lotte-duty-free-wines-spirits.html', 'Same outlet imported twice (same brand, terminal, level and shop) · T1 L2 #02-68 · 06:00-00:00', null),
    (50056, 'merged', 'lotte-duty-free-wines-spirits-t1-level-2-22', 61, 'https://www.changiairport.com/en/dine-and-shop/shop-directory/shop-detail.lotte-duty-free-wines-spirits.html', 'Same outlet imported twice (same brand, terminal, level and shop) · T1 L2 #02-22 · 06:00-00:00', null),
    (50052, 'merged', 'lotte-duty-free-wines-spirits-t1-level-1-10', 57, 'https://www.changiairport.com/en/dine-and-shop/shop-directory/shop-detail.lotte-duty-free-wines-spirits.html', 'Same outlet imported twice (same brand, terminal, level and shop) · T1 L1 #01-10 · 24/7', null),
    (50053, 'merged', 'lotte-duty-free-wines-spirits-t1-level-1-23', 58, 'https://www.changiairport.com/en/dine-and-shop/shop-directory/shop-detail.lotte-duty-free-wines-spirits.html', 'Same outlet imported twice (same brand, terminal, level and shop) · T1 L1 #01-23 · 24/7', null),
    (50153, 'merged', 'lotte-duty-free-wines-spirits-t2-level-1-176', 63, 'https://www.changiairport.com/en/dine-and-shop/shop-directory/shop-detail.lotte-duty-free-wines-spirits.html', 'Same outlet imported twice (same brand, terminal, level and shop) · T2 L1 #01-176 · 24/7', null),
    (50156, 'merged', 'lotte-duty-free-wines-spirits-t2-level-1-151', 65, 'https://www.changiairport.com/en/dine-and-shop/shop-directory/shop-detail.lotte-duty-free-wines-spirits.html', 'Same outlet imported twice (same brand, terminal, level and shop) · T2 L1 #01-151 · 24/7', null),
    (50157, 'merged', 'lotte-duty-free-wines-spirits-t2-level-3-189', 67, 'https://www.changiairport.com/en/dine-and-shop/shop-directory/shop-detail.lotte-duty-free-wines-spirits.html', 'Same outlet imported twice (same brand, terminal, level and shop) · T2 L3 #03-189 · 24/7', null),
    (50154, 'merged', 'lotte-duty-free-wines-spirits-t2-level-2-401', 66, 'https://www.changiairport.com/en/dine-and-shop/shop-directory/shop-detail.lotte-duty-free-wines-spirits.html', 'Same outlet imported twice (same brand, terminal, level and shop) · T2 L2 #02-401 · 06:00-01:00', null),
    (50158, 'merged', 'lotte-duty-free-wines-spirits-t2-level-2-197', 68, 'https://www.changiairport.com/en/dine-and-shop/shop-directory/shop-detail.lotte-duty-free-wines-spirits.html', 'Same outlet imported twice (same brand, terminal, level and shop) · T2 L2 #02-197 · 06:00-01:00', null),
    (50253, 'merged', 'lotte-duty-free-wines-spirits-t3-level-1-19', 69, 'https://www.changiairport.com/en/dine-and-shop/shop-directory/shop-detail.lotte-duty-free-wines-spirits.html', 'Same outlet imported twice (same brand, terminal, level and shop) · T3 L1 #01-19 · 24/7', null),
    (50252, 'merged', 'lotte-duty-free-wines-spirits-t3-level-1-29', 70, 'https://www.changiairport.com/en/dine-and-shop/shop-directory/shop-detail.lotte-duty-free-wines-spirits.html', 'Same outlet imported twice (same brand, terminal, level and shop) · T3 L1 #01-29 · 24/7', null),
    (50254, 'merged', 'lotte-duty-free-wines-spirits-t3-level-2-65', 72, 'https://www.changiairport.com/en/dine-and-shop/shop-directory/shop-detail.lotte-duty-free-wines-spirits.html', 'Same outlet imported twice (same brand, terminal, level and shop) · T3 L2 #02-65 · 06:00-01:00', null),
    (71, 'merged', 'lotte-duty-free-wines-spirits-t3-level-2-65', 72, 'https://www.changiairport.com/en/dine-and-shop/shop-directory/shop-detail.lotte-duty-free-wines-spirits.html', 'Same outlet imported twice (same brand, terminal, level and shop) · T3 L2 #02-65 · 06:00-01:00', null),
    (50257, 'merged', 'lotte-duty-free-wines-spirits-t3-level-3-7', 74, 'https://www.changiairport.com/en/dine-and-shop/shop-directory/shop-detail.lotte-duty-free-wines-spirits.html', 'Same outlet imported twice (same brand, terminal, level and shop) · T3 L3 #03-07/08 · 24/7', null),
    (50256, 'merged', 'lotte-duty-free-wines-spirits-t3-level-2-37', 73, 'https://www.changiairport.com/en/dine-and-shop/shop-directory/shop-detail.lotte-duty-free-wines-spirits.html', 'Same outlet imported twice (same brand, terminal, level and shop) · T3 L2 #02-37/39 · 24/7', null),
    (50300, 'merged', 'lotte-duty-free-wines-spirits-level-2-shop-10-sint3', 50255, 'https://www.changiairport.com/en/dine-and-shop/shop-directory/shop-detail.lotte-duty-free-wines-spirits.html', 'Same outlet imported twice (same brand, terminal, level and shop) · T3 L2 #02-10/11/12 · 06:00-01:00', null),
    (50342, 'merged', 'lotte-duty-free-wines-spirits-t4-level-2-25', 76, 'https://www.changiairport.com/en/dine-and-shop/shop-directory/shop-detail.lotte-duty-free-wines-spirits.html', 'Same outlet imported twice (same brand, terminal, level and shop) · T4 L2 #02-25 · 24/7', null),
    (50344, 'merged', 'lotte-duty-free-wines-spirits-t4-level-2-57', 77, 'https://www.changiairport.com/en/dine-and-shop/shop-directory/shop-detail.lotte-duty-free-wines-spirits.html', 'Same outlet imported twice (same brand, terminal, level and shop) · T4 L2 #02-57 · 06:00-00:00', null),
    (50343, 'merged', 'lotte-duty-free-wines-spirits-t4-level-1-12', 75, 'https://www.changiairport.com/en/dine-and-shop/shop-directory/shop-detail.lotte-duty-free-wines-spirits.html', 'Same outlet imported twice (same brand, terminal, level and shop) · T4 L1 #01-12 · 24/7', null),
    (50044, 'merged', 'guardian-health-beauty-sin-t1-16', 27, 'https://www.changiairport.com/en/dine-and-shop/shop-directory/shop-detail.guardian-health-beauty.html', 'Same outlet imported twice (same brand, terminal, level and shop) · T1 L2 #02-16 (transit) · ambiguous: no times, no 24h flag', null),
    (50145, 'merged', 'guardian-health-beauty-sin-t2-13', 29, 'https://www.changiairport.com/en/dine-and-shop/shop-directory/shop-detail.guardian-health-beauty.html', 'Same outlet imported twice (same brand, terminal, level and shop) · T2 L2 #02-13 (public) · 07:00-23:00', null),
    (50243, 'merged', 'guardian-health-beauty-sin-t3-basement-24', 31, 'https://www.changiairport.com/en/dine-and-shop/shop-directory/shop-detail.guardian-health-beauty.html', 'Same outlet imported twice (same brand, terminal, level and shop) · T3 B2 #B2-24 (public) · 10:00-22:00', null),
    (50041, 'merged', 'garrett-popcorn-t1', 22, 'https://www.changiairport.com/en/dine-and-shop/shop-directory/shop-detail.garrett-popcorn-shops.html', 'Same outlet imported twice (same brand, terminal, level and shop) · T1 L2 #02-32 · 06:00-00:00', null),
    (50062, 'merged', 'tiffany-co', 104, 'https://www.changiairport.com/en/dine-and-shop/shop-directory/shop-detail.tiffany-co.html', 'Same outlet imported twice (same brand, terminal, level and shop) · T1 L2 #02-45 · 06:00-00:00', null),
    (50068, 'merged', 'victorias-secret-beauty-accessories-t1', 124, 'https://www.changiairport.com/en/dine-and-shop/shop-directory/shop-detail.victorias-secret-beauty-accessories.html', 'Same outlet imported twice (same brand, terminal, level and shop) · T1 L2 #02-27 · 06:00-00:00', null),
    (50151, 'merged', 'kering-eyewear-lagardere', 50, 'https://www.changiairport.com/en/dine-and-shop/shop-directory/shop-detail.kering-eyewear-x-lagardere.html', 'Same outlet imported twice (same brand, terminal, level and shop) · T2 L2 #02-203 · 06:00-00:00', null),
    (50162, 'merged', 'tods', 107, 'https://www.changiairport.com/en/dine-and-shop/shop-directory/shop-detail.tods.html', 'Same outlet imported twice (same brand, terminal, level and shop) · T2 L2 #02-225-01 · 06:00-01:00', null),
    (50265, 'merged', 'whsmith-t3-level-2-43', 132, 'https://www.changiairport.com/en/dine-and-shop/shop-directory/shop-detail.wh-smith.html', 'Same outlet imported twice (same brand, terminal, level and shop) · T3 L2 #02-43 · ambiguous: 06:00-01:00 and "Opens 24 Hours"', null),
    (50069, 'merged', 'whsmith-t1-level-1-84', 127, 'https://www.changiairport.com/en/dine-and-shop/shop-directory/shop-detail.wh-smith.html', 'Same outlet imported twice (same brand, terminal, level and shop) · T1 L2 #02-84 (public) · 07:00-23:00', null),
    (50351, 'merged', 'whsmith-t4-level-2-59', 134, 'https://www.changiairport.com/en/dine-and-shop/shop-directory/shop-detail.wh-smith.html', 'Same outlet imported twice (same brand, terminal, level and shop) · T4 L2 #02-59 · 06:00-00:00', null),
    (50341, 'merged', 'lego-airport-store', 52, 'https://www.changiairport.com/en/dine-and-shop/shop-directory/shop-detail.lego-airport-store.html', 'Same outlet imported twice (same brand, terminal, level and shop) · T4 L2 #02-48 · 06:00-00:00', null)
  ) as m(id, action, canonical_slug, canonical_id, evidence_url, reason, new_slug) on m.id = d.id;
alter table public.amenity_dedupe_20261105 enable row level security;
revoke all on public.amenity_dedupe_20261105 from anon, authenticated;

do $$ begin
  if (select count(*) from public.amenity_dedupe_20261105) <> 63 then
    raise exception 'backup row count % <> 63', (select count(*) from public.amenity_dedupe_20261105);
  end if;
end $$;

-- 2. Moves: real location, slug for it, links follow (invariant: link terminal = amenity terminal or null).
update public.amenity_detail
   set terminal_code = 'SIN-JEWEL', is_landside = true,
       available_in_tr = true, amenity_slug = 'yotelair-singapore-changi-jewel'
 where id = 10072;
update public.collection_amenities
   set terminal_code = 'SIN-JEWEL'
 where amenity_detail_id = 10072 and terminal_code is not null;

-- 3. Links. Part A: a phantom's null-terminal link moves to the canonical row if the collection lacks it.
--    Part C (same outlet, same terminal): every link moves to the kept row if the collection lacks it.
--    Terminal-coded Part A links cascade (that terminal's variant shouldn't show the attraction).
insert into public.collection_amenities (collection_id, amenity_detail_id, terminal_code, priority, is_featured)
select distinct on (l.collection_id, m.canonical_id, l.terminal_code)
       l.collection_id, m.canonical_id, l.terminal_code, l.priority, l.is_featured
  from public.collection_amenities l
  join public.amenity_dedupe_20261105 m on m.id = l.amenity_detail_id and m.action in ('deleted', 'merged')
 where l.collection_id is not null
   and (l.terminal_code is null or m.action = 'merged')
   and not exists (select 1 from public.collection_amenities c
                    where c.collection_id = l.collection_id and c.amenity_detail_id = m.canonical_id)
 order by l.collection_id, m.canonical_id, l.terminal_code, l.priority;

-- 4. route_stops: repoint (expected 0).
update public.route_stops s set amenity_slug = m.canonical_slug
  from public.amenity_dedupe_20261105 m
 where s.amenity_slug = m.amenity_slug and m.action in ('deleted', 'merged');

-- 5. Delete phantoms and merged duplicates (cascades: links, vibe mappings, vibe descriptions).
delete from public.amenity_detail d
 using public.amenity_dedupe_20261105 m
 where d.id = m.id and m.action in ('deleted', 'merged');

-- 6. Hours on kept outlet rows, from G3 (unambiguous entries only).
update public.amenity_detail d set opening_hours = v.h
  from (values (29, '07:00-23:00'), (31, '10:00-22:00'), (50, '06:00-00:00'), (52, '06:00-00:00'), (57, '24/7'), (58, '24/7'), (59, '24/7'), (62, '24/7'), (66, '06:00-01:00'), (68, '06:00-01:00'), (72, '06:00-01:00'), (77, '06:00-00:00'), (124, '06:00-00:00'), (127, '07:00-23:00'), (134, '06:00-00:00'), (50255, '06:00-01:00')) as v(id, h)
 where d.id = v.id;

-- 7. Zone labels: rows whose brand has more than 1 outlet in its terminal. G3 unit, else slug; else null.
update public.amenity_detail d set zone = v.z
  from (values (27, 'Level 2, #02-16 (airside)'), (29, 'Level 2, #02-13 (before immigration)'), (31, 'Basement 2, #B2-24 (before immigration)'), (57, 'Level 1, #01-10 (airside)'), (58, 'Level 1, #01-23 (airside)'), (59, 'Level 2, #02-53 (airside)'), (60, 'Level 2, #02-68 (airside)'), (61, 'Level 2, #02-22 (airside)'), (62, 'Level 2, #02-46 (airside)'), (63, 'Level 1, #01-176 (airside)'), (64, 'Level 2, shop 91 (airside)'), (65, 'Level 1, #01-151 (airside)'), (66, 'Level 2, #02-401 (airside)'), (67, 'Level 3, #03-189 (airside)'), (68, 'Level 2, #02-197 (airside)'), (69, 'Level 1, #01-19 (airside)'), (70, 'Level 1, #01-29 (airside)'), (72, 'Level 2, #02-65 (airside)'), (73, 'Level 2, #02-37/39 (airside)'), (74, 'Level 3, #03-07/08 (airside)'), (75, 'Level 1, #01-12 (airside)'), (76, 'Level 2, #02-25 (airside)'), (77, 'Level 2, #02-57 (airside)'), (50045, 'Level 2, #02-69 (airside)'), (50146, 'Level 2, #02-155 (airside)'), (50155, 'Level 2, shop 91 (airside)'), (50244, 'Level 2, #02-66 (airside)'), (50245, 'Level 2, #02-29 (airside)'), (50255, 'Level 2, #02-10/11/12 (airside)')) as v(id, z)
 where d.id = v.id;

-- 8. One row per slug from now on. Fails the whole migration if a duplicate survives.
create unique index amenity_detail_amenity_slug_key on public.amenity_detail (amenity_slug);

