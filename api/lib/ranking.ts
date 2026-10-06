/**
 * Canonical amenity ranking — server-side single source of truth.
 *
 * Mirrors src/utils/smart7Select.ts: both eligibility rules from
 * shared/ranking/policy.ts (landside access, open now) first, then within each
 * fill tier (open, unknown hours, opening soon) dedupe by name keeping the
 * best-terminal instance and sort editorial_score DESC → terminal → name.
 *
 * Eligibility is a filter, never a score weight. MCP sends no passenger type,
 * so landside venues follow the policy's "type unknown" rows.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { DISPLAY } from '../../src/lib/displayConfig';
import { sgMinutesOfDay } from '../../src/lib/sgTime';
import { landsideAccess, pickEligible, type EligibilityContext, type EligibleLabels } from '../../shared/ranking/policy';

export interface RankedAmenityRow {
  id: number;
  name: string;
  amenity_slug: string;
  terminal_code: string;
  opening_hours: string | null;
  editorial_score: number | null;
  is_landside?: boolean | null;
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

// RANKING: editorial_score DESC — keep in sync with src/utils/smart7Select.ts
export function compareAmenities(
  a: RankedAmenityRow,
  b: RankedAmenityRow,
  userTerminal: string | null,
): number {
  const editorialDiff = (b.editorial_score ?? 0) - (a.editorial_score ?? 0);
  if (editorialDiff !== 0) return editorialDiff;
  const scoreDiff = terminalScore(b.terminal_code, userTerminal) - terminalScore(a.terminal_code, userTerminal);
  if (scoreDiff !== 0) return scoreDiff;
  return a.name.localeCompare(b.name);
}

// Both eligibility rules, then name-dedup keeping the best-terminal instance,
// canonical sort, slice per fill tier — identical semantics to smart7Select.
export function rankAmenities(
  pool: RankedAmenityRow[],
  userTerminal: string | null = null,
  limit: number = DISPLAY.COLLECTION_VISIBLE,
  ctx: EligibilityContext = { journeyType: null, minutesToBoarding: null, nowSgt: sgMinutesOfDay() },
): Array<RankedAmenityRow & EligibleLabels> {
  if (!pool?.length) return [];

  return pickEligible(pool, ctx, limit, (rows, n) => {
    const bestByName = new Map<string, RankedAmenityRow>();
    for (const amenity of rows) {
      const key = amenity.name.toLowerCase().trim();
      const existing = bestByName.get(key);
      if (!existing || terminalScore(amenity.terminal_code, userTerminal) > terminalScore(existing.terminal_code, userTerminal)) {
        bestByName.set(key, amenity);
      }
    }

    return Array.from(bestByName.values())
      .sort((a, b) => compareAmenities(a, b, userTerminal))
      .slice(0, n);
  });
}

/** MCP passes route_context through by name, so a landside label rides at its front. */
function withAccessLabel<T extends RankedAmenityRow & EligibleLabels>(row: T): T {
  if (!row.access_label) return row;
  const ctx = typeof row.route_context === 'string' ? row.route_context.trim() : '';
  return { ...row, route_context: ctx ? `${row.access_label}. ${ctx}` : row.access_label };
}

// Same columns the MCP get_recommendations handler has always selected
const AGENT_SELECT =
  'id, name, amenity_slug, description, terminal_code, vibe_tags, price_level, opening_hours, available_in_tr, booking_required, editorial_note, editorial_score, route_context, is_landside';

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

  const minutes = opts.timeUntilBoardingMinutes;
  const ctx: EligibilityContext = {
    journeyType: null,
    minutesToBoarding: typeof minutes === 'number' && Number.isFinite(minutes) ? minutes : null,
    nowSgt: sgMinutesOfDay(),
  };

  if (opts.vibe) query = query.ilike('vibe_tags', `%${opts.vibe}%`);
  if (opts.userTerminal && opts.timeUntilBoardingMinutes !== undefined && opts.timeUntilBoardingMinutes < 30) {
    query = query.eq('terminal_code', opts.userTerminal);
  }
  // The caller asked for no Jewel, or the landside rule hides every landside
  // venue at these minutes: leave them out of the pool, so they don't take its
  // slots (filter before top-N). Not just SIN-JEWEL rows: everything landside.
  if (opts.excludeJewel || !landsideAccess({ isLandside: true, ...ctx }).show) query = query.eq('is_landside', false);

  const { data, error } = await query
    .order('editorial_score', { ascending: false, nullsFirst: false })
    .order('name')
    .limit(DISPLAY.VIBE_POOL);

  const pool = (data ?? []) as unknown as RankedAmenityRow[];
  const ranked = rankAmenities(pool, opts.userTerminal ?? null, opts.limit, ctx).map(withAccessLabel);
  return { pool, ranked, error };
}
