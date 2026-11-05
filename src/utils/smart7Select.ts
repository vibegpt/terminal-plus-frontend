import { DISPLAY } from '@/lib/displayConfig';
import { sgMinutesOfDay } from '@/lib/sgTime';
import {
  brandKeyFor,
  compareOutlets,
  passengerIsLandside,
  pickEligible,
  withOtherOutlets,
  type EligibilityContext,
  type EligibleLabels,
  type OtherOutlet,
} from '../../shared/ranking/policy';

export interface AmenityRow {
  id: number;
  amenity_slug: string;
  name: string;
  terminal_code: string;
  opening_hours: string;
  is_landside?: boolean | null;
  price_level?: string;
  vibe_tags?: string;
  description?: string;
  logo_url?: string;
  editorial_score?: number | null;
  brand_family?: string | null;
  zone?: string | null;
  [key: string]: unknown;
}

export type SelectedAmenity = AmenityRow & EligibleLabels & { other_outlets: OtherOutlet[] };

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

/** No passenger, no flight, the real clock: what the ranking parity test and MCP default to. */
export function anonymousEligibility(): EligibilityContext {
  return { journeyType: null, minutesToBoarding: null, nowSgt: sgMinutesOfDay() };
}

/**
 * Up to `limit` venues: both eligibility rules (shared/ranking/policy.ts) first,
 * then, within each fill tier (open, unknown hours, opening soon), keep a brand
 * once (CC-27A D1: the passenger's terminal, their side, score, pool order;
 * compareOutlets) and sort editorial_score DESC → terminal → name.
 * Each kept row carries its brand's other open, reachable outlets.
 */
export function smart7Select(
  pool: AmenityRow[],
  userTerminal: string | null = null,
  limit = DISPLAY.COLLECTION_VISIBLE,
  ctx: EligibilityContext = anonymousEligibility(),
): SelectedAmenity[] {
  if (!pool?.length) return [];
  const brandKey = brandKeyFor(pool);

  // RANKING: editorial_score DESC — keep in sync with api/lib
  const compare = (a: AmenityRow, b: AmenityRow) => {
    const editorialDiff = (b.editorial_score ?? 0) - (a.editorial_score ?? 0);
    if (editorialDiff !== 0) return editorialDiff;
    const scoreDiff = terminalScore(b.terminal_code, userTerminal) - terminalScore(a.terminal_code, userTerminal);
    if (scoreDiff !== 0) return scoreDiff;
    return a.name.localeCompare(b.name);
  };

  const landside = passengerIsLandside(ctx);
  const picked = pickEligible(pool, ctx, limit, (rows, n) => {
    const bestByBrand = new Map<string, AmenityRow>();
    for (const amenity of rows) {
      const key = brandKey(amenity);
      const existing = bestByBrand.get(key);
      if (!existing || compareOutlets(amenity, existing, userTerminal, landside) < 0) bestByBrand.set(key, amenity);
    }
    return Array.from(bestByBrand.values()).sort(compare).slice(0, n);
  }, brandKey);
  return withOtherOutlets(picked, pool, ctx, brandKey);
}

/** One terminal's list (VibePage terminal tabs): a brand once, editorial_score DESC → name. */
export function terminalSelect(
  pool: AmenityRow[],
  limit = DISPLAY.COLLECTION_VISIBLE,
  ctx: EligibilityContext = anonymousEligibility(),
): SelectedAmenity[] {
  if (!pool?.length) return [];
  const brandKey = brandKeyFor(pool);
  // RANKING: editorial_score DESC — keep in sync with api/lib
  const compare = (a: AmenityRow, b: AmenityRow) =>
    ((b.editorial_score ?? 0) - (a.editorial_score ?? 0)) || a.name.localeCompare(b.name);

  const landside = passengerIsLandside(ctx);
  const picked = pickEligible(pool, ctx, limit, (rows, n) => {
    const bestByBrand = new Map<string, AmenityRow>();
    for (const amenity of rows) {
      const key = brandKey(amenity);
      const existing = bestByBrand.get(key);
      if (!existing || compareOutlets(amenity, existing, null, landside) < 0) bestByBrand.set(key, amenity);
    }
    return Array.from(bestByBrand.values()).sort(compare).slice(0, n);
  }, brandKey);
  return withOtherOutlets(picked, pool, ctx, brandKey);
}
