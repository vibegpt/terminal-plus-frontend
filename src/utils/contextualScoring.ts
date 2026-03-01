// src/utils/contextualScoring.ts
// Multi-factor contextual scoring for collections and amenities at Changi Airport

import type { AmenityRow } from './smart7Select';

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
  isFiltered: boolean;
  filterReason?: string;
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

function isOpenNow(hours: string): boolean {
  if (!hours || hours === '24/7') return true;
  const match = hours.match(/(\d{2}):(\d{2})\s*[-–]\s*(\d{2}):(\d{2})/);
  if (!match) return true;
  const [, openH, openM, closeH, closeM] = match.map(Number);
  const now = new Date();
  const cur = now.getHours() * 60 + now.getMinutes();
  const open = openH * 60 + openM;
  let close = closeH * 60 + closeM;
  if (close <= open) {
    close += 1440;
    if (cur < open) return cur + 1440 < close;
  }
  return cur >= open && cur < close;
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

  // Hard filter: Jewel requires 75+ min
  if (amenity.terminal_code === 'SIN-JEWEL' && availableMinutes > 0 && availableMinutes < 75) return 0;

  if (availableMinutes < 30) return isQuick ? 90 : 25;
  if (availableMinutes < 60) return isQuick ? 80 : 65;
  if (availableMinutes < 120) return isQuick ? 70 : 85;
  return isQuick ? 60 : 90; // 120+ min: full-experience venues score highest
}

function factorProximity(amenity: AmenityRow, context: UserContext, availableMinutes: number): number {
  const at = amenity.terminal_code;
  const ut = context.terminal;
  if (!at) return 50;
  if (at === ut) return 100;
  if (at === 'SIN-JEWEL') return availableMinutes > 75 ? 70 : 15;
  if (at === 'SIN-T4' && ut !== 'SIN-T4') return 30;
  if (ut === 'SIN-T4' && at !== 'SIN-T4') return 30;
  const connected = CONNECTED_TERMINALS[ut] || [];
  return connected.includes(at) ? 65 : 45;
}

// ── scoreAmenity ────────────────────────────────────────────────────

export function scoreAmenity(amenity: AmenityRow, context: UserContext): ScoredAmenity {
  const period = getMealPeriod(context.currentTime.getHours());
  const available = getAvailableMinutes(context);

  const timeOfDay       = factorTimeOfDay(amenity, period);
  const bodyClockOffset = factorBodyClock(context, period);
  const timeAvailable   = factorTimeAvailable(amenity, available);
  const proximity       = factorProximity(amenity, context, available);

  const contextScore =
    timeOfDay       * 0.35 +
    bodyClockOffset * 0.20 +
    timeAvailable   * 0.25 +
    proximity       * 0.20;

  const isFiltered = timeAvailable === 0;
  const filterReason = isFiltered ? `Jewel needs 75+ min (${available} available)` : undefined;

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

  return { amenity, contextScore, scoreBreakdown, isFiltered, filterReason, debugLabel };
}

// ── scoreCollection ─────────────────────────────────────────────────

export function scoreCollection(
  collection: CollectionForScoring,
  context: UserContext
): number {
  const period = getMealPeriod(context.currentTime.getHours());
  const trPeriod = toTimeRelevancePeriod(period);
  const available = getAvailableMinutes(context);

  // Factor 1: time-of-day — use service's time_relevance if available
  let timeOfDay: number;
  if (collection.time_relevance) {
    timeOfDay = Math.min(100, (collection.time_relevance[trPeriod] ?? 5) * 10);
  } else {
    const text = collection.name.toLowerCase();
    const pos = PERIOD_POSITIVE[period].filter(k => text.includes(k)).length;
    const neg = PERIOD_NEGATIVE[period].filter(k => text.includes(k)).length;
    timeOfDay = Math.min(100, Math.max(10, 50 + pos * 15 - neg * 20));
  }

  // Factor 2: body clock (same logic)
  const bodyClockOffset = factorBodyClock(context, period);

  // Factor 3: time available — use collection name as proxy
  const nameL = collection.name.toLowerCase();
  const isQuickCollection =
    nameL.includes('quick') || nameL.includes('2-minute') ||
    nameL.includes('grab') || nameL.includes('essential') || nameL.includes('gate');
  let timeAvailable: number;
  if (available < 30)       timeAvailable = isQuickCollection ? 90 : 40;
  else if (available < 60)  timeAvailable = isQuickCollection ? 80 : 65;
  else if (available < 120) timeAvailable = 80;
  else                      timeAvailable = isQuickCollection ? 65 : 90;

  // Factor 4: proximity — neutral for collections (span multiple terminals)
  const proximity = 50;

  return timeOfDay * 0.35 + bodyClockOffset * 0.20 + timeAvailable * 0.25 + proximity * 0.20;
}

// ── selectScoredAmenities ───────────────────────────────────────────
// Drop-in replacement for smart7Select that uses contextual scoring.
// Deduplicates by name, keeps highest-scored duplicate, returns top N.

export function selectScoredAmenities(
  pool: AmenityRow[],
  context: UserContext,
  limit = 7
): ScoredAmenity[] {
  if (!pool?.length) return [];

  // Score everything
  const scored = pool.map(a => scoreAmenity(a, context));

  // Dedup by name: keep highest-scored entry per name
  const bestByName = new Map<string, ScoredAmenity>();
  for (const s of scored) {
    const key = s.amenity.name.toLowerCase().trim();
    const prev = bestByName.get(key);
    if (!prev || s.contextScore > prev.contextScore) {
      bestByName.set(key, s);
    }
  }

  return Array.from(bestByName.values())
    .filter(s => !s.isFiltered)
    .sort((a, b) => {
      // Open items always above closed
      const aOpen = isOpenNow(a.amenity.opening_hours);
      const bOpen = isOpenNow(b.amenity.opening_hours);
      if (aOpen !== bOpen) return aOpen ? -1 : 1;
      return b.contextScore - a.contextScore;
    })
    .slice(0, limit);
}
