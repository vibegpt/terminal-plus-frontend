// shared/ranking/policy.ts
// The two eligibility rules every surface applies (CC-17), and the only place
// their numbers live:
//   1. Landside access: may the app suggest a venue outside immigration, given
//      the passenger type and minutes to boarding?
//   2. Open now: is the venue open at this Singapore wall-clock time?
// Pure functions, no I/O and no clock reads: callers pass the time in. Used by
// src/ (vibe feed, collections, search, Home, amenity and saved pages, map,
// flight bar, capture) and api/ (chat, MCP ranking, routes) by relative path.

import { HOURS_COPY, LANDSIDE_COPY } from './landsideCopy';

// ── Numbers ────────────────────────────────────────────────────────

/** Minutes to boarding a passenger needs before a landside venue is suggested. */
export const LANDSIDE_MIN_MINUTES = { departing: 90, connecting: 180 } as const;

/** When open venues can't fill a list, venues opening within this many minutes fill the rest. */
export const OPENS_SOON_MINUTES = 60;

const DAY = 1440;

// ── Landside access ────────────────────────────────────────────────

export type JourneyType = 'departing' | 'connecting' | 'just_landed';

export interface LandsideInput {
  isLandside: boolean | null | undefined;
  /** 'skipped', null and anything unrecognised all mean "type unknown". */
  journeyType: string | null | undefined;
  minutesToBoarding: number | null | undefined;
}

export interface LandsideAccess {
  /** May a list suggest it? Pages for one venue never hide it; they show `reason`. */
  show: boolean;
  /** Card label; null for airside venues and for passengers who are landside anyway. */
  label: string | null;
  /** Why it's hidden; null when shown. */
  reason: string | null;
}

const AIRSIDE: LandsideAccess = { show: true, label: null, reason: null };

export function knownJourneyType(v: unknown): JourneyType | null {
  return v === 'departing' || v === 'connecting' || v === 'just_landed' ? v : null;
}

function knownMinutes(v: number | null | undefined): number | null {
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
}

/**
 * | Passenger                      | Landside venues  | Label                                   |
 * | just_landed                    | always           | none                                    |
 * | departing                      | only ≥ 90 min    | Before immigration                      |
 * | connecting                     | only ≥ 180 min   | Landside: clear immigration both ways…  |
 * | unknown type, minutes known    | as connecting    | as connecting                           |
 * | unknown type, no minutes       | always           | Landside: outside immigration           |
 * Departing or connecting with no minutes (onward flight skipped) can't meet
 * the minimum, so it's hidden.
 */
export function landsideAccess({ isLandside, journeyType, minutesToBoarding }: LandsideInput): LandsideAccess {
  if (!isLandside) return AIRSIDE;
  const type = knownJourneyType(journeyType);
  const minutes = knownMinutes(minutesToBoarding);

  if (type === 'just_landed') return AIRSIDE;

  if (type === 'departing') {
    const label = LANDSIDE_COPY.label.departing;
    if (minutes === null) return { show: false, label, reason: LANDSIDE_COPY.reason.noTime };
    return minutes >= LANDSIDE_MIN_MINUTES.departing
      ? { show: true, label, reason: null }
      : { show: false, label, reason: LANDSIDE_COPY.reason.departing(LANDSIDE_MIN_MINUTES.departing) };
  }

  if (type === 'connecting' || minutes !== null) {
    const label = LANDSIDE_COPY.label.connecting;
    if (minutes === null) return { show: false, label, reason: LANDSIDE_COPY.reason.noTime };
    return minutes >= LANDSIDE_MIN_MINUTES.connecting
      ? { show: true, label, reason: null }
      : { show: false, label, reason: LANDSIDE_COPY.reason.connecting(LANDSIDE_MIN_MINUTES.connecting) };
  }

  return { show: true, label: LANDSIDE_COPY.label.unknown, reason: null };
}

// ── Opening hours ──────────────────────────────────────────────────

export type ParsedHours =
  | { kind: '24h' }
  | { kind: 'range'; open: number; close: number } // minutes of day; close may be ≤ open (past midnight)
  | { kind: 'unknown'; raw: string };

const RANGE = /^(\d{1,2}):(\d{2})\s*[-–]\s*(\d{1,2}):(\d{2})$/;
const ALL_DAY = /^(24\/7|24 hours|open 24 hours)$/i;
const EVERY_DAY = /^(mon(day)?\s*[-–]\s*sun(day)?|daily|every day)$/i;

function parseHoursText(text: string): ParsedHours {
  const s = text.trim();
  if (ALL_DAY.test(s)) return { kind: '24h' };
  const m = s.match(RANGE);
  if (m) {
    const [oh, om, ch, cm] = m.slice(1).map(Number);
    if (oh <= 24 && ch <= 24 && om < 60 && cm < 60) {
      return { kind: 'range', open: (oh * 60 + om) % DAY, close: (ch * 60 + cm) % DAY };
    }
  }
  return { kind: 'unknown', raw: s };
}

/**
 * opening_hours is text. Most rows are "24/7" or one "HH:MM-HH:MM"; some hold a
 * JSON object as a string ({"Monday-Sunday": "06:00-23:00"}). One range for
 * every day is read; anything else (per-day ranges, free text) is unknown.
 */
export function parseOpeningHours(openingHours: unknown): ParsedHours {
  if (typeof openingHours !== 'string' || !openingHours.trim()) return { kind: 'unknown', raw: '' };
  const s = openingHours.trim();
  if (s.startsWith('{')) {
    try {
      const entries = Object.entries(JSON.parse(s) as Record<string, unknown>);
      if (entries.length === 1 && EVERY_DAY.test(entries[0][0].trim()) && typeof entries[0][1] === 'string') {
        const inner = parseHoursText(entries[0][1]);
        return inner.kind === 'unknown' ? { kind: 'unknown', raw: s } : inner;
      }
    } catch { /* not JSON after all */ }
    return { kind: 'unknown', raw: s };
  }
  return parseHoursText(s);
}

export type OpenState = 'open' | 'closed' | 'unknown';

export interface OpenNow {
  state: OpenState;
  /** "HH:MM" it next opens; set when closed. */
  opensAt: string | null;
  /** "HH:MM" it closes; set when open and not 24 hours. */
  closesAt: string | null;
  minutesUntilOpen: number | null;
  is24h: boolean;
}

export function hhmm(minutesOfDay: number): string {
  const m = ((minutesOfDay % DAY) + DAY) % DAY;
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}

/** nowSgt: minutes since midnight, Singapore time (0–1439). */
export function openNow({ openingHours, nowSgt }: { openingHours: unknown; nowSgt: number }): OpenNow {
  const h = parseOpeningHours(openingHours);
  if (h.kind === '24h') return { state: 'open', opensAt: null, closesAt: null, minutesUntilOpen: null, is24h: true };
  if (h.kind === 'unknown') return { state: 'unknown', opensAt: null, closesAt: null, minutesUntilOpen: null, is24h: false };

  const now = ((nowSgt % DAY) + DAY) % DAY;
  const { open } = h;
  const close = h.close <= open ? h.close + DAY : h.close; // past midnight
  // Today's span, or the tail of yesterday's that runs past midnight.
  const isOpen = (now >= open && now < close) || (now + DAY >= open && now + DAY < close);
  if (isOpen) return { state: 'open', opensAt: null, closesAt: hhmm(close), minutesUntilOpen: null, is24h: false };
  return { state: 'closed', opensAt: hhmm(open), closesAt: null, minutesUntilOpen: (open - now + DAY) % DAY, is24h: false };
}

/** The hours line for a venue: "Open 24 hours", "Open until 22:00", "Closed · Opens 10:00", or the text as written. */
export function hoursLabel(o: OpenNow, openingHours: unknown): string {
  if (o.is24h) return HOURS_COPY.open24;
  if (o.state === 'open') return HOURS_COPY.openUntil(o.closesAt!);
  if (o.state === 'closed') return HOURS_COPY.closedOpens(o.opensAt!);
  return typeof openingHours === 'string' && openingHours.trim() ? openingHours.trim() : HOURS_COPY.notListed;
}

// ── Both rules on a list ───────────────────────────────────────────

export interface EligibilityContext {
  journeyType: string | null;
  minutesToBoarding: number | null;
  /** Minutes since midnight, Singapore time. */
  nowSgt: number;
}

/** Fill order: open first, then hours we can't read, then venues opening soon. */
export type Tier = 'open' | 'unknown' | 'soon';
const TIERS: Tier[] = ['open', 'unknown', 'soon'];

export interface EligibilityFields {
  is_landside?: boolean | null;
  opening_hours?: unknown;
  name?: string | null;
}

export interface Eligibility {
  access: LandsideAccess;
  open: OpenNow;
  /** null: not suggested (landside rule, or closed and not opening soon). */
  tier: Tier | null;
}

export function eligibility(row: EligibilityFields, ctx: EligibilityContext): Eligibility {
  const access = landsideAccess({
    isLandside: row.is_landside,
    journeyType: ctx.journeyType,
    minutesToBoarding: ctx.minutesToBoarding,
  });
  const open = openNow({ openingHours: row.opening_hours, nowSgt: ctx.nowSgt });
  const tier: Tier | null = !access.show ? null
    : open.state === 'open' ? 'open'
    : open.state === 'unknown' ? 'unknown'
    : open.minutesUntilOpen !== null && open.minutesUntilOpen <= OPENS_SOON_MINUTES ? 'soon'
    : null;
  return { access, open, tier };
}

/** What a picked row carries for its card. */
export interface EligibleLabels {
  /** Landside label to show on the card, if any. */
  access_label: string | null;
  /** "Opens HH:MM" when the row filled the list as opening soon. */
  opens_label: string | null;
  open_state: OpenState;
}

export function nameKey(row: { name?: string | null }): string {
  return (row.name ?? '').toLowerCase().trim();
}

/**
 * Applies both rules, then fills the list tier by tier: the surface's own
 * `select` (its dedupe, sort and slice) runs on the open rows, then on the
 * unknown-hours rows, then on rows opening within OPENS_SOON_MINUTES, until
 * `limit` rows are picked. A name picked in one tier isn't picked again later.
 * Filtering comes before the surface's dedupe, so a hidden landside copy never
 * shadows an airside venue of the same name.
 */
export function pickEligible<T extends EligibilityFields>(
  rows: readonly T[],
  ctx: EligibilityContext,
  limit: number,
  select: (tierRows: T[], n: number) => T[],
  key: (row: T) => string = nameKey,
): Array<T & EligibleLabels> {
  const byTier: Record<Tier, T[]> = { open: [], unknown: [], soon: [] };
  const info = new Map<T, Eligibility>();
  for (const row of rows ?? []) {
    const e = eligibility(row, ctx);
    if (!e.tier) continue;
    info.set(row, e);
    byTier[e.tier].push(row);
  }

  const picked: Array<T & EligibleLabels> = [];
  const seen = new Set<string>();
  for (const tier of TIERS) {
    const room = limit - picked.length;
    if (room <= 0) break;
    const candidates = byTier[tier].filter(r => !seen.has(key(r)));
    if (!candidates.length) continue;
    for (const row of select(candidates, room).slice(0, room)) {
      const e = info.get(row)!;
      seen.add(key(row));
      picked.push({
        ...row,
        access_label: e.access.label,
        opens_label: tier === 'soon' && e.open.opensAt ? HOURS_COPY.opensAt(e.open.opensAt) : null,
        open_state: e.open.state,
      });
    }
  }
  return picked;
}

/** How many distinct venues (by name) a list could show now. Home's "N spots". */
export function countEligible<T extends EligibilityFields>(
  rows: readonly T[],
  ctx: EligibilityContext,
  key: (row: T) => string = nameKey,
): number {
  const names = new Set<string>();
  for (const row of rows ?? []) if (eligibility(row, ctx).tier) names.add(key(row));
  return names.size;
}
