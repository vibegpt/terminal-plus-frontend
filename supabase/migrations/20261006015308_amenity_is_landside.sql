-- CC-17: amenity_detail.is_landside
--
-- True for venues outside immigration: Jewel, Jewel attractions filed under a
-- terminal, arrival halls and before-security shops. shared/ranking/policy.ts
-- decides from it (and the passenger type and minutes) whether a venue may be
-- suggested. The list is the 127 rows Todd approved at CC-17 G3 (5 Oct):
-- 54 SIN-JEWEL, 16 Jewel attraction copies, 20 available_in_tr = false,
-- 9 available_in_tr = null, 2 + 26 added by hand. tasks/cc-17-report.md has
-- each row's reason.
--
-- Default false: a new import is airside until someone flags it.
-- Grants: anon and authenticated already hold table SELECT, which covers the
-- new column. Nothing is granted or revoked here.
-- Rollback: alter table public.amenity_detail drop column is_landside;

alter table public.amenity_detail
  add column is_landside boolean not null default false;

with landside(slug) as (values
    ('awfully-chocolate-jewel'),
    ('a-w-restaurants'),
    ('bengawan-solo-jewel-new'),
    ('beyond-the-vines-jewel'),
    ('birds-of-paradise-jewel'),
    ('bynd-artisan-jewel'),
    ('canopy-park-jewel-new'),
    ('champion-bolo-bun-jewel'),
    ('changi-experience-studio-jewel-new'),
    ('crane-jewel'),
    ('creamier-jewel'),
    ('din-tai-fung-jewel-new'),
    ('eu-yan-sang-jewel-new'),
    ('faculty-jewel'),
    ('fila-jewel'),
    ('foggy-bowls-jewel-new'),
    ('fossa-chocolate-jewel'),
    ('furla-sinjewel'),
    ('grain-traders-jewel'),
    ('hedge-maze-jewel-new'),
    ('irvins-salted-egg-jewel-new'),
    ('kele-jewel'),
    ('kinokuniya-jewel-new'),
    ('koi-th-jewel-new'),
    ('leckerbaer-jewel'),
    ('manulife-sky-nets-jewel-new'),
    ('mcdonalds-jewel'),
    ('mirror-maze-jewel-new'),
    ('mr-coconut-jewel'),
    ('muji-jewel-new'),
    ('ong-shunmugam-jewel'),
    ('pew-pew-patches-jewel'),
    ('rain-vortex-jewel-new'),
    ('rhythm-of-nature-sinjewel'),
    ('sabrinagoh-jewel'),
    ('shiseido-forest-valley-jewel-new'),
    ('social-tree-jewel-new'),
    ('song-fa-bak-kut-teh-jewel-new'),
    ('spa-express-jewel-new'),
    ('starbucks-reserve-sinjewel'),
    ('sunny-hill-jewel'),
    ('telecommunications-kiosk-jewel-new'),
    ('the-digital-gadgets-sinjewel'),
    ('the-editors-market-jewel'),
    ('the-farm-store-jewel'),
    ('the-little-drom-store-jewel'),
    ('the-singapore-mint-jewel'),
    ('travelex-jewel-new'),
    ('trs-tax-refund-jewel-new'),
    ('uniqlo-sinjewel'),
    ('uob-currency-exchange-jewel-new'),
    ('wang-cafe-jewel'),
    ('weekend-sundries-jewel'),
    ('zara-jewel-new'),
    ('manulife-sky-nets-t1-new'),
    ('mirror-maze-t1-new'),
    ('rain-vortex-t1-new'),
    ('shiseido-forest-valley-t1-new'),
    ('canopy-park-t2-new'),
    ('foggy-bowls-t2-new'),
    ('mirror-maze-t2-new'),
    ('rain-vortex-t2-new'),
    ('canopy-park-t3-new'),
    ('changi-experience-studio-t3-new'),
    ('foggy-bowls-t3-new'),
    ('jewel-viewpoint-t3'),
    ('canopy-park-t4-new'),
    ('changi-experience-studio-t4-new'),
    ('manulife-sky-nets-t4-new'),
    ('mirror-maze-t4-new'),
    ('heavenly-wang-sint1'),
    ('mother-and-child'),
    ('travelex-money-changer-t1'),
    ('whsmith-t1-level-1-84'),
    ('chagee-sint2'),
    ('eu-yan-sang'),
    ('fila-kids-t2'),
    ('guardian-health-beauty-sin-t2-13'),
    ('heavenly-wang-sint2'),
    ('kenangan-coffee-sint2'),
    ('mcdonalds-t2-arrival'),
    ('travelex-money-changer-t2'),
    ('whsmith-t2-level-1-26'),
    ('guardian-health-beauty-sin-t3-basement-24'),
    ('heavenly-wang-sint3'),
    ('mcdonalds-t3-arrival'),
    ('memory-of-lived-space'),
    ('ocoffee-club-sint3'),
    ('fila-t4'),
    ('the-digital-gadgets-t4'),
    ('sin-t1-andes-1757008220.066062'),
    ('sin-t1-burger-king-1757008220.066062'),
    ('sin-t1-crystal-jade-1757008220.066062'),
    ('sin-t1-kopitiam-1757008220.066062'),
    ('sin-t1-subway-1757008220.066062'),
    ('sin-t1-toast-box-1757008220.066062'),
    ('sin-t1-ya-kun-1757008220.066062'),
    ('sin-t2-peach-garden-1757008220.066062'),
    ('sin-t2-food-court-1757008220.066062'),
    ('starbucks-sint2'),
    ('guardian-health-beauty-before-security-basement-shop-24-sint3'),
    ('crowne-plaza-changi-airport-t1-new'),
    ('lotte-duty-free-wines-spirits-t1-level-1-10'),
    ('lotte-duty-free-wines-spirits-t1-level-1-23'),
    ('lotte-duty-free-wines-spirits-level-1-shop-10-sint1'),
    ('lotte-duty-free-wines-spirits-level-1-shop-23-sint1'),
    ('song-fa-bak-kut-teh-t1-new'),
    ('telecommunications-kiosk-t1-new'),
    ('wh-smith-before-security-level-1-shop-84-sint1'),
    ('guardian-health-beauty-before-security-level-2-shop-13-sint2'),
    ('lotte-duty-free-wines-spirits-t2-level-1-151'),
    ('lotte-duty-free-wines-spirits-t2-level-1-176'),
    ('lotte-duty-free-wines-spirits-level-1-shop-151-sint2'),
    ('lotte-duty-free-wines-spirits-level-1-shop-176-sint2'),
    ('song-fa-bak-kut-teh-t2-new'),
    ('wh-smith-before-security-level-1-shop-26-sint2'),
    ('yotelair-singapore-changi-t2-new'),
    ('lotte-duty-free-wines-spirits-t3-level-1-19'),
    ('lotte-duty-free-wines-spirits-t3-level-1-29'),
    ('lotte-duty-free-wines-spirits-level-1-shop-19-sint3'),
    ('lotte-duty-free-wines-spirits-level-1-shop-29-sint3'),
    ('yotelair-singapore-changi-t3-new'),
    ('lotte-duty-free-wines-spirits-t4-level-1-12'),
    ('lotte-duty-free-wines-spirits-level-1-shop-12-sint4'),
    ('song-fa-bak-kut-teh-t4-new'),
    ('telecommunications-kiosk-t4-new'),
    ('yotelair-singapore-changi-t4-new')
)
update public.amenity_detail a
   set is_landside = true
  from landside l
 where a.amenity_slug = l.slug;

do $$
declare
  n_true int;
  n_jewel_airside int;
begin
  select count(*) into n_true from public.amenity_detail where is_landside;
  if n_true <> 127 then
    raise exception 'is_landside: expected 127 rows, got %', n_true;
  end if;
  select count(*) into n_jewel_airside
    from public.amenity_detail where terminal_code = 'SIN-JEWEL' and not is_landside;
  if n_jewel_airside <> 0 then
    raise exception 'is_landside: % SIN-JEWEL rows left airside', n_jewel_airside;
  end if;
end
$$;
