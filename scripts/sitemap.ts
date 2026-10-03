/**
 * Writes public/sitemap.xml: the home page, the 7 vibe pages and every live
 * collection page, as absolute https://terminalplus.app URLs, sorted, no lastmod.
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
 * Amenity pages stay out until the duplicate amenity rows are cleaned up.
 *
 * Reads VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY from .env.local
 * (public, read-only: the app reads `collections` with the same key).
 */

import { config } from 'dotenv';
config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';
import { writeFileSync } from 'fs';
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

  const paths = [
    '/',
    ...vibes.map(v => `/vibe/${v}`),
    ...[...pairs].filter(([slug]) => live.has(slug)).map(([slug, vibe]) => `/collection/${vibe}/${slug}`),
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
  console.log(`wrote ${OUT}: ${urls.length} URLs (1 home, ${vibes.length} vibe, ${live.size} collection)`);
}

main().catch(err => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
