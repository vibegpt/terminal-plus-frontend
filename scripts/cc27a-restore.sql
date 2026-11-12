-- scripts/cc27a-restore.sql
-- CC-27A rollback: put amenity_detail, collection_amenities, amenity_vibe_mappings,
-- amenity_vibe_descriptions, route_stops and collections back to the G2a snapshot
-- (~/tp-backups/2026-11-05/<table>.json, taken 5 Nov 2026 09:18 UTC, before the
-- CC-27A migration). NOT RUN. Every step is one transaction: any check that fails
-- rolls the whole restore back.
--
-- How to run
--   A. psql (reads the JSON files itself):
--        psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f scripts/cc27a-restore.sql
--   B. Supabase CLI (no psql meta-commands): the 6 \set lines below don't work there.
--      Inline the files instead, the way the G2b restore test loaded them, then run:
--        python3 -c "import re,os;s=open('scripts/cc27a-restore.sql').read();B=os.path.expanduser('~/tp-backups/2026-11-05');s=re.sub(r\"^\\\\set (\\w+) .*\$\",'',s,flags=re.M);s=re.sub(r\":'(\\w+)_json'\",lambda m:'\$cc27a_json\$'+open(f'{B}/{m.group(1)}.json').read()+'\$cc27a_json\$',s);open('/tmp/cc27a-restore.inline.sql','w').write(s)"
--        supabase db query --linked -f /tmp/cc27a-restore.inline.sql
--
-- What it does, in order
--   0. Guards: the 3 tables outside the snapshot that hang off amenity_detail are empty.
--   1. Drops the CC-27A unique index on amenity_slug (the snapshot has 1 duplicate slug, ids 71/72).
--   2. Deletes the 3 child tables and amenity_detail, then reinserts all 4 from the snapshot with
--      their original ids. route_stops: delete + reinsert.
--   3. collections: upsert by id, never delete (a delete would cascade into collection_performance,
--      smart7_feedback and smart7_performance_metrics). The migration doesn't touch collections.
--   4. Resets the id sequences.
--   5. Proves it: row count and md5(string_agg(row::text, '|' order by id)) of every table equal the
--      snapshot's fingerprints, taken from the live tables at G2b (5 Nov 10:12 UTC).
-- Leaves public.amenity_dedupe_20261105 in place (audit and slug map). The redirects in vercel.json
-- are code: roll them back with the deployment (Vercel Instant Rollback).

\set amenity_detail_json `cat ~/tp-backups/2026-11-05/amenity_detail.json`
\set collection_amenities_json `cat ~/tp-backups/2026-11-05/collection_amenities.json`
\set amenity_vibe_mappings_json `cat ~/tp-backups/2026-11-05/amenity_vibe_mappings.json`
\set amenity_vibe_descriptions_json `cat ~/tp-backups/2026-11-05/amenity_vibe_descriptions.json`
\set route_stops_json `cat ~/tp-backups/2026-11-05/route_stops.json`
\set collections_json `cat ~/tp-backups/2026-11-05/collections.json`

begin;

-- 0. Guards ---------------------------------------------------------------------------------
do $$ begin
  if (select count(*) from public.amenity_interactions) > 0 then
    raise exception 'amenity_interactions has rows; deleting amenity_detail would cascade into them. Back them up first.';
  end if;
  if (select count(*) from public.user_visits) > 0 or (select count(*) from public.collection_amenity_mappings) > 0 then
    raise exception 'user_visits or collection_amenity_mappings has rows (ON DELETE NO ACTION). Back them up first.';
  end if;
end $$;

-- Snapshot rows, typed exactly like the live tables.
create temp table snap_amenity_detail on commit drop as
  select * from json_populate_recordset(null::public.amenity_detail, :'amenity_detail_json'::json);
create temp table snap_collection_amenities on commit drop as
  select * from json_populate_recordset(null::public.collection_amenities, :'collection_amenities_json'::json);
create temp table snap_amenity_vibe_mappings on commit drop as
  select * from json_populate_recordset(null::public.amenity_vibe_mappings, :'amenity_vibe_mappings_json'::json);
create temp table snap_amenity_vibe_descriptions on commit drop as
  select * from json_populate_recordset(null::public.amenity_vibe_descriptions, :'amenity_vibe_descriptions_json'::json);
create temp table snap_route_stops on commit drop as
  select * from json_populate_recordset(null::public.route_stops, :'route_stops_json'::json);
create temp table snap_collections on commit drop as
  select * from json_populate_recordset(null::public.collections, :'collections_json'::json);

do $$ begin
  if (select count(*) from snap_amenity_detail) <> 378 or (select count(*) from snap_collection_amenities) <> 989
     or (select count(*) from snap_amenity_vibe_mappings) <> 398 or (select count(*) from snap_amenity_vibe_descriptions) <> 447
     or (select count(*) from snap_route_stops) <> 30 or (select count(*) from snap_collections) <> 45 then
    raise exception 'snapshot files are not the G2a snapshot (row counts differ)';
  end if;
  if exists (select 1 from snap_route_stops s where not exists (select 1 from public.route_templates t where t.id = s.route_template_id)) then
    raise exception 'a snapshot route_stop points at a route_template that no longer exists';
  end if;
end $$;

-- 1. Unique index from CC-27A ---------------------------------------------------------------
drop index if exists public.amenity_detail_amenity_slug_key;

-- 2. amenity_detail and its children, route_stops ---------------------------------------------
delete from public.collection_amenities;
delete from public.amenity_vibe_mappings;
delete from public.amenity_vibe_descriptions;
delete from public.amenity_detail;
delete from public.route_stops;

insert into public.amenity_detail select * from snap_amenity_detail;
insert into public.collection_amenities select * from snap_collection_amenities;
insert into public.amenity_vibe_mappings select * from snap_amenity_vibe_mappings;
insert into public.amenity_vibe_descriptions select * from snap_amenity_vibe_descriptions;
insert into public.route_stops select * from snap_route_stops;

-- 3. collections: upsert, no delete ----------------------------------------------------------
insert into public.collections
  select * from snap_collections
on conflict (id) do update set
  collection_id = excluded.collection_id, name = excluded.name, description = excluded.description,
  icon = excluded.icon, gradient = excluded.gradient, universal = excluded.universal,
  airports = excluded.airports, has_terminal_variants = excluded.has_terminal_variants,
  featured = excluded.featured, tags = excluded.tags, created_at = excluded.created_at,
  updated_at = excluded.updated_at, min_items = excluded.min_items, max_items = excluded.max_items,
  optimal_items = excluded.optimal_items, hero_image_url = excluded.hero_image_url;

-- 4. Sequences --------------------------------------------------------------------------------
select setval(pg_get_serial_sequence('public.amenity_detail', 'id'), (select max(id) from public.amenity_detail));
select setval('public.amenity_vibe_mappings_id_seq', (select max(id) from public.amenity_vibe_mappings));
select setval('public.amenity_vibe_descriptions_id_seq', (select max(id) from public.amenity_vibe_descriptions));

-- 5. Proof: counts and fingerprints equal the snapshot's (G2b, 5 Nov 10:12 UTC) -----------------
do $$
declare
  r record;
begin
  for r in
    select * from (values
      ('amenity_detail', 378::bigint, 'da682e399741784fa55cf4040a229ded',
        (select count(*) from public.amenity_detail), (select md5(string_agg(t::text, '|' order by t.id)) from public.amenity_detail t)),
      ('collection_amenities', 989, '527495faa8d6b1742abad5aaa2a7d30e',
        (select count(*) from public.collection_amenities), (select md5(string_agg(t::text, '|' order by t.id)) from public.collection_amenities t)),
      ('amenity_vibe_mappings', 398, '4f6488eb140b5f767b32e1a3737462bc',
        (select count(*) from public.amenity_vibe_mappings), (select md5(string_agg(t::text, '|' order by t.id)) from public.amenity_vibe_mappings t)),
      ('amenity_vibe_descriptions', 447, 'be443c700022a0194104b86af8fb33a4',
        (select count(*) from public.amenity_vibe_descriptions), (select md5(string_agg(t::text, '|' order by t.id)) from public.amenity_vibe_descriptions t)),
      ('route_stops', 30, '6c866c24db57d10472443419f2ce0e79',
        (select count(*) from public.route_stops), (select md5(string_agg(t::text, '|' order by t.id)) from public.route_stops t)),
      ('collections', 45, '65a7f711a64810d35e9fc4148ddf184e',
        (select count(*) from public.collections), (select md5(string_agg(t::text, '|' order by t.id)) from public.collections t))
    ) as v(tbl, want_n, want_md5, got_n, got_md5)
  loop
    if r.got_n <> r.want_n or r.got_md5 <> r.want_md5 then
      raise exception 'restore check failed for %: rows % (want %), md5 % (want %)', r.tbl, r.got_n, r.want_n, r.got_md5, r.want_md5;
    end if;
    raise notice 'restored %: % rows, md5 %', r.tbl, r.got_n, r.got_md5;
  end loop;
end $$;

commit;
