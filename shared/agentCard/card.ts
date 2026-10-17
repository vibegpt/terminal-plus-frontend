// shared/agentCard/card.ts
// The agent card's shape and the rules that make a card safe to render (CC-25).
// Pure: no I/O, no clock reads. Used by api/agent-card.ts (validate and repair the
// model's output, or build the fallback card), by the client engine
// (src/lib/agentCards.ts: headers for the cards it builds itself) and by tests.
//
// The model's output is never trusted: every slug must be in the pool it was
// shown, the stop count follows the trigger rule, and a "why" that's too long or
// claims a walk time is replaced by the venue's editorial note. A card is never
// blank: anything unusable falls back to the ranker's order.

import { AGENT_CARD_COPY } from '../../src/lib/agentCardCopy';

export type Trigger = 'plan' | 'delay' | 'next_stop' | 'gate_change' | 'final_call';
export type ModelTrigger = 'plan' | 'delay' | 'next_stop';
export type CardSource = 'model' | 'fallback' | 'rules';

export const TRIGGERS: readonly Trigger[] = ['plan', 'delay', 'next_stop', 'gate_change', 'final_call'];
export const MODEL_TRIGGERS: readonly ModelTrigger[] = ['plan', 'delay', 'next_stop'];

export const LINE_MAX = 70;
export const WHY_MAX = 90;
/** How many pool rows the model sees, and how many alternates come back for Swap. */
export const MODEL_POOL_SIZE = 15;
export const ALTERNATES = 6;

/** A pool row as the card needs it. terminal_code is a SIN code ('SIN-T3'). */
export interface PoolVenue {
  slug: string;
  name: string;
  terminal_code: string;
  editorial_note: string | null;
  /** Landside label from shared/ranking/policy.ts, null when airside. */
  access_label: string | null;
  /** "Opens HH:MM" when the venue filled the list as opening soon. */
  opens_label: string | null;
}

export interface CardStop {
  slug: string;
  name: string;
  terminal_code: string;
  why: string;
  access_label: string | null;
  opens_label: string | null;
}

export interface CardChip {
  kind: 'ask_else' | 'not_now' | 'quick_options';
  label: string;
}

export interface AgentCard {
  card_id: string;
  trigger: Trigger;
  source: CardSource;
  header: string;
  line: string;
  stops: CardStop[];
  alternates: CardStop[];
  chips: CardChip[];
}

// ── Stop count ────────────────────────────────────────────────────

/** UNCALIBRATED: 3 stops from 120 min to boarding, 2 below. */
export const THREE_STOP_MIN_MINUTES = 120;

export function stopCount(minutesToBoarding: number): number {
  return minutesToBoarding >= THREE_STOP_MIN_MINUTES ? 3 : 2;
}

// ── Pool scope (D3) ───────────────────────────────────────────────

const SKYTRAIN = new Set(['SIN-T1', 'SIN-T2', 'SIN-T3']);

/**
 * Terminals the pool covers. Where the passenger is, plus the departure terminal
 * when it differs and both are on the Skytrain (T1-T3). T4 is a bus ride, so it
 * never joins a cross-terminal pool.
 */
export function poolScope(current: string | null, departure: string | null): string[] {
  const here = current ?? departure;
  if (!here) return [];
  if (departure && departure !== here && SKYTRAIN.has(here) && SKYTRAIN.has(departure)) return [here, departure];
  return [here];
}

export function isCrossTerminal(current: string | null, departure: string | null): boolean {
  return poolScope(current, departure).length === 2;
}

// ── Header (deterministic, never the model's) ────────────────────

export function cardHeader(args: {
  minutesToBoarding: number;
  currentTerminal: string | null;
  departureTerminal: string | null;
  /** The landside label of an included stop, if any (they share the passenger type). */
  landsideLabel?: string | null;
}): string {
  const h = AGENT_CARD_COPY.header;
  const where = isCrossTerminal(args.currentTerminal, args.departureTerminal)
    ? h.crossTerminal(args.currentTerminal!, args.departureTerminal!)
    : h.terminal(args.currentTerminal ?? args.departureTerminal ?? '');
  return [h.toBoarding(args.minutesToBoarding), where, args.landsideLabel ?? null]
    .filter((p): p is string => !!p)
    .join(h.separator);
}

// ── Model output ──────────────────────────────────────────────────

/**
 * JSON schema for structured outputs. Length and count limits aren't supported
 * in the schema, so repairCard enforces them.
 */
export const CARD_OUTPUT_SCHEMA = {
  type: 'object',
  properties: {
    line: { type: 'string' },
    stops: {
      type: 'array',
      items: {
        type: 'object',
        properties: { slug: { type: 'string' }, why: { type: 'string' } },
        required: ['slug', 'why'],
        additionalProperties: false,
      },
    },
  },
  required: ['line', 'stops'],
  additionalProperties: false,
} as const;

export interface RawCardOutput {
  line: string;
  stops: Array<{ slug: string; why: string }>;
}

/** Parses the model's JSON text; null when it isn't the schema's shape. */
export function parseCardOutput(text: string): RawCardOutput | null {
  try {
    const v = JSON.parse(text) as unknown;
    if (!v || typeof v !== 'object') return null;
    const o = v as Record<string, unknown>;
    if (typeof o.line !== 'string' || !Array.isArray(o.stops)) return null;
    const stops = o.stops.filter(
      (s): s is { slug: string; why: string } =>
        !!s && typeof s === 'object' && typeof (s as any).slug === 'string' && typeof (s as any).why === 'string',
    );
    return { line: o.line, stops };
  } catch {
    return null;
  }
}

/** A number of minutes within 20 characters of walk, gate or away, in either order. */
const MINUTES_WALK = /\b\d+\s*(min|mins|minute|minutes|m)\b[^.]{0,20}\b(walk|walking|gate|away)\b|\b(walk|walking|gate|away)\b[^.]{0,20}\b\d+\s*(min|mins|minute|minutes|m)\b/i;

export function claimsWalkTime(text: string): boolean {
  return MINUTES_WALK.test(text);
}

export function truncate(text: string, max: number): string {
  const t = text.replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max - 1);
  const space = cut.lastIndexOf(' ');
  return `${(space > max * 0.6 ? cut.slice(0, space) : cut).replace(/[\s,;:.-]+$/, '')}…`;
}

/** The venue's own words, for a missing or unusable "why". */
export function editorialWhy(v: PoolVenue): string {
  return truncate(v.editorial_note?.trim() || v.name, WHY_MAX);
}

function usableWhy(why: string): boolean {
  const t = why.trim();
  return t.length > 0 && t.length <= WHY_MAX && !claimsWalkTime(t);
}

function toStop(v: PoolVenue, why: string): CardStop {
  return {
    slug: v.slug,
    name: v.name,
    terminal_code: v.terminal_code,
    why,
    access_label: v.access_label,
    opens_label: v.opens_label,
  };
}

export interface RepairResult {
  line: string;
  stops: CardStop[];
  /** What was changed, for the log and the eval. Empty when the model's card was used as is. */
  repairs: string[];
}

/**
 * Makes the model's card renderable: in-pool slugs only (no repeats), exactly
 * `count` stops (backfilled in ranker order), a short "why" without walk claims,
 * and a line of at most LINE_MAX characters. `pool` is in ranker order.
 */
export function repairCard(raw: RawCardOutput, pool: PoolVenue[], count: number, fallbackLine: string): RepairResult {
  const repairs: string[] = [];
  const bySlug = new Map(pool.map(v => [v.slug, v]));
  const used = new Set<string>();
  const stops: CardStop[] = [];

  for (const s of raw.stops) {
    if (stops.length >= count) {
      repairs.push('extra_stops');
      break;
    }
    const v = bySlug.get(s.slug);
    if (!v) {
      repairs.push(`out_of_pool:${s.slug.slice(0, 60)}`);
      continue;
    }
    if (used.has(v.slug)) {
      repairs.push(`duplicate:${v.slug}`);
      continue;
    }
    used.add(v.slug);
    if (usableWhy(s.why)) stops.push(toStop(v, s.why.trim()));
    else {
      repairs.push(`why_replaced:${v.slug}`);
      stops.push(toStop(v, editorialWhy(v)));
    }
  }

  for (const v of pool) {
    if (stops.length >= count) break;
    if (used.has(v.slug)) continue;
    used.add(v.slug);
    repairs.push(`backfill:${v.slug}`);
    stops.push(toStop(v, editorialWhy(v)));
  }

  let line = raw.line.replace(/\s+/g, ' ').trim();
  if (!line || claimsWalkTime(line)) {
    repairs.push('line_replaced');
    line = fallbackLine;
  } else if (line.length > LINE_MAX) {
    repairs.push('line_truncated');
    line = truncate(line, LINE_MAX);
  }
  return { line, stops, repairs };
}

/** The deterministic card: the ranker's top `count`, editorial notes as the whys. */
export function fallbackStops(pool: PoolVenue[], count: number): CardStop[] {
  return pool.slice(0, count).map(v => toStop(v, editorialWhy(v)));
}

/** The next ALTERNATES venues after the stops, for Swap (no new model call). */
export function alternatesFor(pool: PoolVenue[], stops: CardStop[]): CardStop[] {
  const used = new Set(stops.map(s => s.slug));
  return pool.filter(v => !used.has(v.slug)).slice(0, ALTERNATES).map(v => toStop(v, editorialWhy(v)));
}

export function fallbackLine(trigger: ModelTrigger, count: number): string {
  const f = AGENT_CARD_COPY.fallbackLine;
  return trigger === 'plan' ? f.plan(count) : trigger === 'delay' ? f.delay() : f.next_stop();
}

export function defaultChips(): CardChip[] {
  return [
    { kind: 'ask_else', label: AGENT_CARD_COPY.chips.askElse },
    { kind: 'not_now', label: AGENT_CARD_COPY.chips.notNow },
  ];
}

/** The first landside label among the stops (all stops share the passenger type). */
export function landsideLabelOf(stops: CardStop[]): string | null {
  return stops.find(s => s.access_label)?.access_label ?? null;
}

/**
 * Swap: replace the stop at `index` with the first alternate, and put the removed
 * stop at the end of the alternates. Pure, no network.
 */
export function swapStop(card: Pick<AgentCard, 'stops' | 'alternates'>, index: number): Pick<AgentCard, 'stops' | 'alternates'> {
  if (index < 0 || index >= card.stops.length || card.alternates.length === 0) return card;
  const [next, ...rest] = card.alternates;
  const removed = card.stops[index];
  const stops = card.stops.map((s, i) => (i === index ? next : s));
  return { stops, alternates: [...rest, removed] };
}
