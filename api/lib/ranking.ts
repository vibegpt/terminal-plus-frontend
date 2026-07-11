/**
 * Canonical amenity ranking — server-side single source of truth.
 *
 * Comparator and dedup mirror src/utils/smart7Select.ts (post-899654e):
 * editorial_score DESC → open-now → terminal proximity → name, after
 * deduplicating by name keeping the best-terminal instance.
 *
 * Agent-specific eligibility (boarding-time gating, Jewel exclusion) is
 * applied as pool FILTERS here — never as score weights.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { DISPLAY } from '../../src/lib/displayConfig';

export interface RankedAmenityRow {
  id: number;
  name: string;
  amenity_slug: string;
  terminal_code: string;
  opening_hours: string | null;
  editorial_score: number | null;
  [key: string]: unknown;
}

export interface RankQueryOptions {
  vibe?: string;
  userTerminal?: string | null;
  timeUntilBoardingMinutes?: number;
  excludeJewel?: boolean;
  limit?: number;
}

// Same static priority as smart7Select — keep in sync
const TERMINAL_PRIORITY: Record<string, number> = {
  'SIN-T3': 5,
  'SIN-T1': 4,
  'SIN-T2': 3,
  'SIN-JEWEL': 2,
  'SIN-T4': 1,
};

function terminalScore(terminal: string, userTerminal: string | null): number {
  if (userTerminal && terminal === userTerminal) return 10;
  return TERMINAL_PRIORITY[terminal] ?? 0;
}

// Same regex/overnight logic as smart7Select, but the current time is computed
// in Asia/Singapore explicitly — venue hours are SGT wall-clock and the server
// runs UTC (the browser comparator relies on the traveler's device being SGT).
function isOpenNow(hours: string | null | undefined): boolean {
  if (!hours || hours === '24/7') return true;
  const match = hours.match(/(\d{2}):(\d{2})\s*[-–]\s*(\d{2}):(\d{2})/);
  if (!match) return true;
  const [, openH, openM, closeH, closeM] = match.map(Number);
  const sgt = new Date().toLocaleTimeString('en-GB', {
    timeZone: 'Asia/Singapore', hour: '2-digit', minute: '2-digit', hour12: false,
  });
  const [curH, curM] = sgt.split(':').map(Number);
  const cur = curH * 60 + curM;
  const open = openH * 60 + openM;
  let close = closeH * 60 + closeM;
  if (close <= open) {
    close += 1440;
    if (cur < open) return cur + 1440 < close;
  }
  return cur >= open && cur < close;
}

// RANKING: editorial_score DESC — keep in sync with src/utils/smart7Select.ts
export function compareAmenities(
  a: RankedAmenityRow,
  b: RankedAmenityRow,
  userTerminal: string | null,
): number {
  const editorialDiff = (b.editorial_score ?? 0) - (a.editorial_score ?? 0);
  if (editorialDiff !== 0) return editorialDiff;
  const aOpen = isOpenNow(a.opening_hours);
  const bOpen = isOpenNow(b.opening_hours);
  if (aOpen !== bOpen) return aOpen ? -1 : 1;
  const scoreDiff = terminalScore(b.terminal_code, userTerminal) - terminalScore(a.terminal_code, userTerminal);
  if (scoreDiff !== 0) return scoreDiff;
  return a.name.localeCompare(b.name);
}

// Name-dedup keeping the best-terminal instance, canonical sort, slice —
// identical semantics to smart7Select.
export function rankAmenities(
  pool: RankedAmenityRow[],
  userTerminal: string | null = null,
  limit = DISPLAY.COLLECTION_VISIBLE,
): RankedAmenityRow[] {
  if (!pool?.length) return [];

  const bestByName = new Map<string, RankedAmenityRow>();
  for (const amenity of pool) {
    const key = amenity.name.toLowerCase().trim();
    const existing = bestByName.get(key);
    if (!existing || terminalScore(amenity.terminal_code, userTerminal) > terminalScore(existing.terminal_code, userTerminal)) {
      bestByName.set(key, amenity);
    }
  }

  return Array.from(bestByName.values())
    .sort((a, b) => compareAmenities(a, b, userTerminal))
    .slice(0, limit);
}

// Same columns the MCP get_recommendations handler has always selected
const AGENT_SELECT =
  'id, name, amenity_slug, description, terminal_code, vibe_tags, price_level, opening_hours, available_in_tr, booking_required, editorial_note, editorial_score, route_context';

/**
 * Filtered, editorial-ordered candidate pool + canonical ranking.
 * Pool cap must equal the UI vibe surface's (VibePage .limit) — name-dedup
 * picks per-name instances, so only identical pools rank identically.
 */
export async function queryRankedAmenities(supabase: SupabaseClient, opts: RankQueryOptions) {
  let query = supabase
    .from('amenity_detail')
    .select(AGENT_SELECT)
    .eq('airport_code', 'SIN');

  // Agent eligibility filters — unchanged behavior from the pre-fix MCP handler
  if (opts.vibe) query = query.ilike('vibe_tags', `%${opts.vibe}%`);
  if (opts.userTerminal && opts.timeUntilBoardingMinutes !== undefined && opts.timeUntilBoardingMinutes < 30) {
    query = query.eq('terminal_code', opts.userTerminal);
  }
  if (opts.excludeJewel || (opts.timeUntilBoardingMinutes !== undefined && opts.timeUntilBoardingMinutes < 120)) {
    query = query.neq('terminal_code', 'SIN-JEWEL');
  }

  const { data, error } = await query
    .order('editorial_score', { ascending: false, nullsFirst: false })
    .order('name')
    .limit(DISPLAY.VIBE_POOL);

  const pool = (data ?? []) as unknown as RankedAmenityRow[];
  return { pool, ranked: rankAmenities(pool, opts.userTerminal ?? null, opts.limit), error };
}
