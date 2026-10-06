// src/utils/contextualScoring.ts
// Multi-factor contextual scoring for collections and amenities at Changi Airport

import { anonymousEligibility, type AmenityRow } from './smart7Select';
import { DISPLAY } from '@/lib/displayConfig';
import { sgHour } from '@/lib/sgTime';
import { pickEligible, type EligibilityContext } from '../../shared/ranking/policy';

// ── Types ──────────────────────────────────────────────────────────

export type MealPeriod = 'earlyMorning' | 'morning' | 'afternoon' | 'evening' | 'lateNight';
type TimeRelevancePeriod = 'morning' | 'afternoon' | 'evening' | 'lateNight';

export interface UserContext {
  currentTime: Date;
  terminal: string;           // 'SIN-T3'
  minutesToBoarding: number;  // -1 = unknown → treated as 120
  gateWalkMinutes: number;
  circadianState?: 'morning' | 'afternoon' | 'evening' | 'night';
  journeyPhase?: 'departure' | 'transit' | 'arrival';
  selectedVibe: string;
}

export interface ScoreBreakdown {
  timeOfDay: number;       // 0-100
  bodyClockOffset: number; // 0-100
  timeAvailable: number;   // 0-100
  proximity: number;       // 0-100
}

export interface ScoredAmenity {
  amenity: AmenityRow;
  contextScore: number;      // 0-100 weighted final
  scoreBreakdown: ScoreBreakdown;
  debugLabel?: string;       // dev mode: "dinner time + T3 + 90min"
}

export interface CollectionForScoring {
  collection_id: string;
  name: string;
  is_dynamic?: boolean;
  time_relevance?: {
    morning: number;
    afternoon: number;
    evening: number;
    lateNight: number;
  };
}

// ── Constants ──────────────────────────────────────────────────────

const GATE_WALK_MINUTES: Record<string, number> = {
  'SIN-T1': 8, 'SIN-T2': 6, 'SIN-T3': 7, 'SIN-T4': 5, 'SIN-JEWEL': 12,
};

// T1/T2/T3 are connected airside; T4 requires bus; Jewel links via T1
const CONNECTED_TERMINALS: Record<string, string[]> = {
  'SIN-T1':    ['SIN-T2', 'SIN-T3', 'SIN-JEWEL'],
  'SIN-T2':    ['SIN-T1', 'SIN-T3'],
  'SIN-T3':    ['SIN-T1', 'SIN-T2'],
  'SIN-T4':    [],
  'SIN-JEWEL': ['SIN-T1'],
};

const PERIOD_POSITIVE: Record<MealPeriod, string[]> = {
  earlyMorning: ['breakfast', 'brunch', 'coffee', 'cafe', 'bakery', 'dim sum', 'congee', 'toast', 'pastry'],
  morning:      ['breakfast', 'brunch', 'coffee', 'cafe', 'bakery', 'tea', 'light bite', 'smoothie'],
  afternoon:    ['cafe', 'coffee', 'snack', 'tea', 'dessert', 'ice cream', 'noodle', 'casual', 'dim sum'],
  evening:      ['dinner', 'bar', 'cocktail', 'wine', 'restaurant', 'seafood', 'grill', 'cuisine', 'dining'],
  lateNight:    ['24/7', '24hr', '24 hour', 'supper', 'bar', 'cocktail', 'ramen', 'noodle', 'convenience'],
};

const PERIOD_NEGATIVE: Record<MealPeriod, string[]> = {
  earlyMorning: ['dinner', 'cocktail', 'wine', 'grill', 'fine dining'],
  morning:      ['dinner', 'cocktail', 'wine', 'grill'],
  afternoon:    ['breakfast', 'late night'],
  evening:      ['breakfast', 'brunch'],
  lateNight:    ['breakfast', 'brunch'],
};

// ── Period helpers ──────────────────────────────────────────────────

export function getMealPeriod(hour: number): MealPeriod {
  if (hour >= 5  && hour < 8)  return 'earlyMorning';
  if (hour >= 8  && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 22) return 'evening';
  return 'lateNight';
}

function toTimeRelevancePeriod(p: MealPeriod): TimeRelevancePeriod {
  if (p === 'earlyMorning' || p === 'morning') return 'morning';
  if (p === 'afternoon') return 'afternoon';
  if (p === 'evening') return 'evening';
  return 'lateNight';
}

const PERIOD_ORDER: MealPeriod[] = ['earlyMorning', 'morning', 'afternoon', 'evening', 'lateNight'];

function periodDistance(a: MealPeriod, b: MealPeriod): number {
  return Math.abs(PERIOD_ORDER.indexOf(a) - PERIOD_ORDER.indexOf(b));
}

function circadianToPeriod(state: string): MealPeriod {
  switch (state) {
    case 'morning':   return 'morning';
    case 'afternoon': return 'afternoon';
    case 'evening':   return 'evening';
    case 'night':     return 'lateNight';
    default:          return 'afternoon';
  }
}

function getAvailableMinutes(context: UserContext): number {
  if (context.minutesToBoarding <= 0) return 120; // unknown → generous default
  return Math.max(0, context.minutesToBoarding - context.gateWalkMinutes);
}

// ── getUserContext ──────────────────────────────────────────────────
// Reads all available context from sessionStorage — no React dependency

export function getUserContext(overrides?: Partial<UserContext>): UserContext {
  let terminal = 'SIN-T3';
  let minutesToBoarding = -1;
  let circadianState: UserContext['circadianState'];
  let journeyPhase: UserContext['journeyPhase'];

  // Prefer the rich JourneyContext data from localStorage (set by JourneyContext.tsx)
  try {
    const raw = localStorage.getItem('tp_journey_context');
    if (raw) {
      const jc = JSON.parse(raw);
      if (jc.currentTerminal) terminal = jc.currentTerminal;
      if (jc.boardingTime) {
        const mins = Math.floor((new Date(jc.boardingTime).getTime() - Date.now()) / 60000);
        if (mins > 0) minutesToBoarding = mins;
      }
      journeyPhase = 'departure';
    }
  } catch { /* ignore */ }

  // Fall back to session-synced values (written by JourneyContext syncToSession)
  if (minutesToBoarding < 0) {
    try {
      const termSS = sessionStorage.getItem('tp_user_terminal');
      if (termSS) terminal = termSS;

      const stored = sessionStorage.getItem('terminal_plus_flight');
      if (stored) {
        const fc = JSON.parse(stored);
        if (typeof fc.minutesUntilBoarding === 'number' && fc.minutesUntilBoarding > 0) {
          minutesToBoarding = fc.minutesUntilBoarding;
        }
        if (fc.circadianState) circadianState = fc.circadianState;
        if (fc.journeyPhase) journeyPhase = fc.journeyPhase;
      }
    } catch { /* ignore */ }
  }

  return {
    currentTime: new Date(),
    terminal,
    minutesToBoarding,
    gateWalkMinutes: GATE_WALK_MINUTES[terminal] ?? 7,
    circadianState,
    journeyPhase,
    selectedVibe: '',
    ...overrides,
  };
}

// ── Factor scorers (each returns 0-100) ────────────────────────────

function factorTimeOfDay(amenity: AmenityRow, period: MealPeriod): number {
  const text = [amenity.name, amenity.vibe_tags, amenity.description]
    .filter(Boolean).join(' ').toLowerCase();
  const pos = PERIOD_POSITIVE[period].filter(k => text.includes(k)).length;
  const neg = PERIOD_NEGATIVE[period].filter(k => text.includes(k)).length;
  return Math.min(100, Math.max(10, 50 + pos * 15 - neg * 20));
}

function factorBodyClock(context: UserContext, period: MealPeriod): number {
  // Only relevant for transit passengers with known circadian data
  if (!context.circadianState || context.journeyPhase !== 'transit') return 50;
  const bodyPeriod = circadianToPeriod(context.circadianState);
  const dist = periodDistance(bodyPeriod, period);
  if (dist === 0) return 90;
  if (dist === 1) return 65;
  return 35;
}

function factorTimeAvailable(amenity: AmenityRow, availableMinutes: number): number {
  const isQuick = (amenity.vibe_tags || '').toLowerCase().includes('quick');

  if (availableMinutes < 30) return isQuick ? 90 : 25;
  if (availableMinutes < 60) return isQuick ? 80 : 65;
  if (availableMinutes < 120) return isQuick ? 70 : 85;
  return isQuick ? 60 : 90; // 120+ min: full-experience venues score highest
}

// Whether a landside venue may be suggested at all is shared/ranking/policy.ts's call, not a score.
function factorProximity(amenity: AmenityRow, context: UserContext): number {
  const at = amenity.terminal_code;
  const ut = context.terminal;
  if (!at) return 50;
  if (at === ut) return 100;
  if (at === 'SIN-T4' && ut !== 'SIN-T4') return 30;
  if (ut === 'SIN-T4' && at !== 'SIN-T4') return 30;
  const connected = CONNECTED_TERMINALS[ut] || [];
  return connected.includes(at) ? 65 : 45;
}

// ── scoreAmenity ────────────────────────────────────────────────────

export function scoreAmenity(amenity: AmenityRow, context: UserContext): ScoredAmenity {
  const period = getMealPeriod(sgHour(context.currentTime));
  const available = getAvailableMinutes(context);

  const timeOfDay       = factorTimeOfDay(amenity, period);
  const bodyClockOffset = factorBodyClock(context, period);
  const timeAvailable   = factorTimeAvailable(amenity, available);
  const proximity       = factorProximity(amenity, context);

  const contextScore =
    timeOfDay       * 0.35 +
    bodyClockOffset * 0.20 +
    timeAvailable   * 0.25 +
    proximity       * 0.20;

  const scoreBreakdown: ScoreBreakdown = { timeOfDay, bodyClockOffset, timeAvailable, proximity };

  let debugLabel: string | undefined;
  if (import.meta.env.DEV) {
    const parts: string[] = [`score:${Math.round(contextScore)}`];
    if (timeOfDay > 70)  parts.push(period);
    if (proximity > 80)  parts.push('same-term');
    else if (proximity < 40) parts.push('far-term');
    if (available < 30 && available > 0) parts.push('<30min');
    debugLabel = parts.join(' · ');
  }

  return { amenity, contextScore, scoreBreakdown, debugLabel };
}

// ── scoreCollection ─────────────────────────────────────────────────

export function scoreCollection(
  collection: CollectionForScoring,
  context: UserContext
): number {
  const period = getMealPeriod(sgHour(context.currentTime));
  const trPeriod = toTimeRelevancePeriod(period);
  const available = getAvailableMinutes(context);

  const nameL = collection.name.toLowerCase();
  const isQuickCollection =
    nameL.includes('quick') || nameL.includes('2-minute') ||
    nameL.includes('grab') || nameL.includes('essential') || nameL.includes('gate');

  // ── URGENT (< 30 min): hard override ───────────────────────────
  // Quick collections get massive bonus; everything else capped at 25
  if (available > 0 && available < 30) {
    if (isQuickCollection) return 90 + 40; // +40 Quick bonus
    return 25; // Non-Quick hard capped
  }

  // Factor 1: time-of-day — use service's time_relevance if available
  let timeOfDay: number;
  if (collection.time_relevance) {
    timeOfDay = Math.min(100, (collection.time_relevance[trPeriod] ?? 5) * 10);
  } else {
    const text = nameL;
    const pos = PERIOD_POSITIVE[period].filter(k => text.includes(k)).length;
    const neg = PERIOD_NEGATIVE[period].filter(k => text.includes(k)).length;
    timeOfDay = Math.min(100, Math.max(10, 50 + pos * 15 - neg * 20));
  }

  // Factor 2: body clock (same logic)
  const bodyClockOffset = factorBodyClock(context, period);

  // Factor 3: time available
  let timeAvailable: number;
  if (available < 60)       timeAvailable = isQuickCollection ? 80 : 65;
  else if (available < 120) timeAvailable = 80;
  else                      timeAvailable = isQuickCollection ? 65 : 90;

  // Factor 4: proximity — neutral for collections (span multiple terminals)
  const proximity = 50;

  const base = timeOfDay * 0.35 + bodyClockOffset * 0.20 + timeAvailable * 0.25 + proximity * 0.20;
  return Math.max(0, base);
}

// ── selectScoredAmenities ───────────────────────────────────────────
// Drop-in replacement for smart7Select that uses contextual scoring. Both
// eligibility rules (shared/ranking/policy.ts) come first; within each fill tier
// it dedupes by name, keeping the highest-scored copy, and returns the top N.

export function selectScoredAmenities(
  pool: AmenityRow[],
  context: UserContext,
  limit = DISPLAY.COLLECTION_VISIBLE,
  eligibilityCtx: EligibilityContext = anonymousEligibility(),
): ScoredAmenity[] {
  if (!pool?.length) return [];

  const scores = new Map<AmenityRow, ScoredAmenity>(pool.map(a => [a, scoreAmenity(a, context)]));
  const scoreOf = (a: AmenityRow) => scores.get(a)!;

  const picked = pickEligible(pool, eligibilityCtx, limit, (rows, n) => {
    // Dedup by name: keep highest-scored entry per name
    const bestByName = new Map<string, AmenityRow>();
    for (const a of rows) {
      const key = a.name.toLowerCase().trim();
      const prev = bestByName.get(key);
      if (!prev || scoreOf(a).contextScore > scoreOf(prev).contextScore) bestByName.set(key, a);
    }
    return Array.from(bestByName.values())
      .sort((a, b) => {
        // RANKING: editorial_score DESC — keep in sync with api/lib
        const editorialDiff = (b.editorial_score ?? 0) - (a.editorial_score ?? 0);
        if (editorialDiff !== 0) return editorialDiff;
        return scoreOf(b).contextScore - scoreOf(a).contextScore;
      })
      .slice(0, n);
  });

  // pickEligible returns labelled copies; find each one's score by slug.
  const bySlug = new Map(pool.map(a => [a.amenity_slug, scoreOf(a)]));
  return picked.map(a => ({ ...bySlug.get(a.amenity_slug)!, amenity: a }));
}
