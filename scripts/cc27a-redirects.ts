/**
 * CC-27A Part B: permanent redirects for every deleted, moved or merged amenity
 * slug, written into vercel.json's "redirects" array (nothing else in the file
 * changes).
 *
 *   npx tsx scripts/cc27a-redirects.ts            # write vercel.json
 *   npx tsx scripts/cc27a-redirects.ts --verify   # compare with public.amenity_dedupe_20261105
 *
 * Source: the slug map in the migration that builds amenity_dedupe_20261105
 * (its VALUES list: id, action, canonical_slug, ...). Before the migration runs,
 * each id's old slug is read from amenity_detail (anon key, as the app reads it).
 * After it runs, --verify rebuilds the list from the backup table itself and
 * fails unless vercel.json matches. --verify needs SUPABASE_SERVICE_ROLE_KEY
 * (the backup table is service-role only).
 *
 * A row whose slug equals its canonical slug (the duplicate-slug merge) gets no
 * redirect. Both URL shapes the app routes are covered: /amenity/<slug> and
 * /amenity/<terminal>/<slug>.
 */
import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import { setDefaultResultOrder } from 'dns';
import { setDefaultAutoSelectFamily } from 'net';
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.local' });
setDefaultResultOrder('ipv4first');
setDefaultAutoSelectFamily(false);

const ROOT = resolve(__dirname, '..');
const MIGRATION = resolve(ROOT, 'supabase/migrations/20261105103155_cc27a_catalogue_dedupe.sql');
const VERCEL = resolve(ROOT, 'vercel.json');

interface MapRow { id: number; action: string; canonical_slug: string }
interface Redirect { source: string; destination: string; permanent: true }

function slugMapFromMigration(): MapRow[] {
  const sql = readFileSync(MIGRATION, 'utf8');
  const block = sql.slice(sql.indexOf('join (values'), sql.indexOf(') as m(id, action, canonical_slug'));
  const rows = [...block.matchAll(/^\s*\((\d+), '(deleted|moved|merged)', '([a-z0-9-]+)', /gm)]
    .map(m => ({ id: Number(m[1]), action: m[2], canonical_slug: m[3] }));
  const declared = Number(/-- (\d+) rows:/.exec(sql)?.[1]);
  if (rows.length !== declared) throw new Error(`parsed ${rows.length} map rows, migration declares ${declared}`);
  return rows;
}

function redirectsFor(pairs: Array<{ old: string; canonical: string }>): Redirect[] {
  const out: Redirect[] = [];
  for (const { old, canonical } of [...pairs].sort((a, b) => a.old.localeCompare(b.old))) {
    if (old === canonical) continue;
    out.push({ source: `/amenity/${old}`, destination: `/amenity/${canonical}`, permanent: true });
    out.push({ source: `/amenity/:terminal/${old}`, destination: `/amenity/${canonical}`, permanent: true });
  }
  return out;
}

async function main() {
  const url = process.env.VITE_SUPABASE_URL;
  if (!url) throw new Error('VITE_SUPABASE_URL must be set in .env.local');
  const verify = process.argv.includes('--verify');

  let pairs: Array<{ old: string; canonical: string }>;
  if (verify) {
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!key) throw new Error('--verify needs SUPABASE_SERVICE_ROLE_KEY in .env.local');
    const { data, error } = await createClient(url, key)
      .from('amenity_dedupe_20261105')
      .select('amenity_slug, action, canonical_slug');
    if (error) throw new Error(`backup table read failed: ${error.message}`);
    pairs = (data ?? []).map(r => ({ old: r.amenity_slug as string, canonical: r.canonical_slug as string }));
  } else {
    const map = slugMapFromMigration();
    const key = process.env.VITE_SUPABASE_ANON_KEY;
    if (!key) throw new Error('VITE_SUPABASE_ANON_KEY must be set in .env.local');
    const { data, error } = await createClient(url, key)
      .from('amenity_detail')
      .select('id, amenity_slug')
      .in('id', map.map(m => m.id));
    if (error) throw new Error(`amenity_detail read failed: ${error.message}`);
    const slugById = new Map((data ?? []).map(r => [r.id as number, r.amenity_slug as string]));
    const missing = map.filter(m => !slugById.has(m.id)).map(m => m.id);
    if (missing.length) {
      throw new Error(`ids not in amenity_detail (migration already applied? use --verify): ${missing.join(', ')}`);
    }
    pairs = map.map(m => ({ old: slugById.get(m.id)!, canonical: m.canonical_slug }));
  }

  const redirects = redirectsFor(pairs);
  const vercel = JSON.parse(readFileSync(VERCEL, 'utf8'));
  if (verify) {
    const same = JSON.stringify(vercel.redirects ?? []) === JSON.stringify(redirects);
    console.log(`backup table: ${pairs.length} rows → ${redirects.length} redirects; vercel.json ${same ? 'MATCHES' : 'DIFFERS'}`);
    if (!same) process.exit(1);
    return;
  }
  vercel.redirects = redirects;
  writeFileSync(VERCEL, JSON.stringify(vercel, null, 2) + '\n');
  console.log(`${pairs.length} map rows → ${redirects.length} redirects (${pairs.filter(p => p.old === p.canonical).length} same-slug rows skipped) → vercel.json`);
}

main().catch(err => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
