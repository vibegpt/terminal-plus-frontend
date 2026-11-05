/**
 * Writes public/sitemap.xml: the home page, the 7 vibe pages, every live
 * collection page, /privacy and /agents, as absolute https://terminalplus.app URLs, sorted, no lastmod.
 *
 *   npm run sitemap
 *
 * Collection URLs are exactly the ones Home can link to
 * (/collection/<vibe>/<collection_slug>, HomePage.tsx): the union of
 * getCollectionsForVibe() over every time slot. A slug is kept only when its
 * `collections` row exists with at least 1 amenity. Without one,
 * CollectionDetailPage renders a vibe-tag fallback under a synthesised name,
 * which isn't a page worth indexing.
 *
 * Amenity pages (/amenity/<slug>) are in since CC-27A cleaned the duplicate
 * rows: every SIN row, minus any slug vercel.json redirects (a deleted, moved
 * or merged slug never reaches the sitemap, even from a stale database).
 *
 * Reads VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY from .env.local
 * (public, read-only: the app reads `collections` with the same key).
 */

import { config } from 'dotenv';
config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import { setDefaultResultOrder } from 'dns';
import { setDefaultAutoSelectFamily } from 'net';
import {
  COLLECTION_MAPPINGS,
  getCollectionsForVibe,
  type TimeSlot,
} from '../src/services/VibeCollectionsService';

// Outbound IPv6 is unreachable on some networks; undici then hangs.
setDefaultResultOrder('ipv4first');
setDefaultAutoSelectFamily(false);

const ORIGIN = 'https://terminalplus.app';
const OUT = resolve(__dirname, '..', 'public/sitemap.xml');
const TIME_SLOTS: TimeSlot[] = ['earlyMorning', 'morning', 'afternoon', 'evening', 'lateNight'];

async function main() {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set in .env.local');

  // Vibe slugs as Home links them (VIBES[].serviceKey in HomePage.tsx).
  const vibes = [...new Set(COLLECTION_MAPPINGS.map(m => m.vibe))].sort();
  if (vibes.length !== 7) throw new Error(`expected 7 vibes in COLLECTION_MAPPINGS, found ${vibes.length}: ${vibes.join(', ')}`);

  // Every (vibe, slug) pair Home can show at some time of day.
  const pairs = new Map<string, string>(); // slug -> vibe
  for (const vibe of vibes) {
    for (const slot of TIME_SLOTS) {
      for (const m of getCollectionsForVibe(vibe, slot)) {
        const prev = pairs.get(m.collection_slug);
        if (prev && prev !== vibe) throw new Error(`${m.collection_slug} maps to both ${prev} and ${vibe}`);
        pairs.set(m.collection_slug, vibe);
      }
    }
  }

  const supabase = createClient(url, key);
  const { data, error } = await supabase
    .from('collections')
    .select('collection_id, collection_amenities(count)')
    .in('collection_id', [...pairs.keys()]);
  if (error) throw new Error(`collections query failed: ${error.message}`);

  const live = new Set(
    (data ?? [])
      .filter(c => ((c.collection_amenities as { count: number }[] | null)?.[0]?.count ?? 0) > 0)
      .map(c => c.collection_id as string),
  );
  const excluded = [...pairs.keys()].filter(s => !live.has(s)).sort();

  // Amenity pages: every SIN slug, minus redirected ones (CC-27A Part B).
  const redirected = new Set(
    ((JSON.parse(readFileSync(resolve(__dirname, '..', 'vercel.json'), 'utf8')).redirects ?? []) as { source: string }[])
      .map(r => r.source),
  );
  const { data: amenities, error: aErr } = await supabase
    .from('amenity_detail')
    .select('amenity_slug')
    .eq('airport_code', 'SIN')
    .not('amenity_slug', 'is', null);
  if (aErr) throw new Error(`amenity_detail query failed: ${aErr.message}`);
  const amenityPaths = [...new Set((amenities ?? []).map(a => `/amenity/${a.amenity_slug as string}`))]
    .filter(p => !redirected.has(p));
  const dropped = (amenities ?? []).length - amenityPaths.length;

  const paths = [
    '/',
    ...vibes.map(v => `/vibe/${v}`),
    ...[...pairs].filter(([slug]) => live.has(slug)).map(([slug, vibe]) => `/collection/${vibe}/${slug}`),
    ...amenityPaths,
    // Static pages in public/, served without the app.
    '/privacy',
    '/agents',
  ];
  const urls = paths.map(p => `${ORIGIN}${p}`).sort();

  const xml =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    urls.map(u => `  <url><loc>${u}</loc></url>\n`).join('') +
    '</urlset>\n';
  writeFileSync(OUT, xml);

  console.log(`reachable collection pages: ${pairs.size}, live: ${live.size}`);
  console.log(`excluded (no collections row with amenities): ${excluded.join(', ') || 'none'}`);
  console.log(`amenity pages: ${amenityPaths.length} (${dropped} rows left out: redirected or duplicate slug)`);
  console.log(`wrote ${OUT}: ${urls.length} URLs (1 home, ${vibes.length} vibe, ${live.size} collection, ${amenityPaths.length} amenity, 2 static)`);
}

main().catch(err => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
