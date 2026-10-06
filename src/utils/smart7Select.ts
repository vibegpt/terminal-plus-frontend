import { DISPLAY } from '@/lib/displayConfig';
import { sgMinutesOfDay } from '@/lib/sgTime';
import { pickEligible, type EligibilityContext, type EligibleLabels } from '../../shared/ranking/policy';

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
  [key: string]: unknown;
}

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
 * then, within each fill tier (open, unknown hours, opening soon), dedupe by name
 * keeping the best-terminal copy and sort editorial_score DESC → terminal → name.
 */
export function smart7Select(
  pool: AmenityRow[],
  userTerminal: string | null = null,
  limit = DISPLAY.COLLECTION_VISIBLE,
  ctx: EligibilityContext = anonymousEligibility(),
): Array<AmenityRow & EligibleLabels> {
  if (!pool?.length) return [];

  return pickEligible(pool, ctx, limit, (rows, n) => {
    const bestByName = new Map<string, AmenityRow>();
    for (const amenity of rows) {
      const key = amenity.name.toLowerCase().trim();
      const existing = bestByName.get(key);
      if (!existing || terminalScore(amenity.terminal_code, userTerminal) > terminalScore(existing.terminal_code, userTerminal)) {
        bestByName.set(key, amenity);
      }
    }

    return Array.from(bestByName.values())
      .sort((a, b) => {
        // RANKING: editorial_score DESC — keep in sync with api/lib
        const editorialDiff = (b.editorial_score ?? 0) - (a.editorial_score ?? 0);
        if (editorialDiff !== 0) return editorialDiff;
        const scoreDiff = terminalScore(b.terminal_code, userTerminal) - terminalScore(a.terminal_code, userTerminal);
        if (scoreDiff !== 0) return scoreDiff;
        return a.name.localeCompare(b.name);
      })
      .slice(0, n);
  });
}
