// src/lib/agentCards.ts
// Agent card trigger engine (CC-25). Pure where it can be: eligibility, priority,
// caps and the cache key are plain functions over plain data, so tests run them
// without React. Storage (tp_agent_cards) and the small buses at the bottom are
// the only side effects, each wrapped because storage can be blocked.
//
// Triggers (every number below is UNCALIBRATED; first guesses, to be tuned on data):
//   plan        boarding time known, >= 60 min to boarding, no plan yet for this flight
//   delay       boarding moved later by >= 30 min since the last card's boarding time
//   next_stop   after an outcome answer or "I'm here", with >= 45 min left (3 per journey)
//   gate_change a known gate changed (rules card, no model call)
//   final_call  minutes to boarding crossed 45 (rules card, no model call)
// Priority: gate_change > final_call > outcome strip > delay > next_stop > plan.
// One card visible at a time; a lower card waits, never stacks.

import type { AgentCard, Trigger } from '../../shared/agentCard/card';
import type { ChatMessage } from '../services/chatService';
import { AGENT_CARD_COPY, terminalShort } from './agentCardCopy';

// ── Numbers (UNCALIBRATED) ─────────────────────────────────────────

/** UNCALIBRATED: a plan needs at least this many minutes to boarding. */
export const PLAN_MIN_MINUTES = 60;
/** UNCALIBRATED: a delay card needs boarding to move later by at least this much. */
export const DELAY_MIN_SHIFT_MINUTES = 30;
/** UNCALIBRATED: next_stop needs at least this many minutes left. */
export const NEXT_STOP_MIN_MINUTES = 45;
/** UNCALIBRATED: final_call fires when minutes to boarding cross this. */
export const FINAL_CALL_MINUTES = 45;
/** UNCALIBRATED: per-journey caps. */
export const CAPS = { plan: 1, next_stop: 3, total: 6 } as const;
/** UNCALIBRATED: cache buckets of minutes to boarding. */
export const MINUTES_BUCKET = 15;
/** How long the plan request waits for journey_id before it goes without (body only, never the key). */
export const JOURNEY_ID_WAIT_MS = 1_500;
/** Client gives the endpoint this long before it stops showing the skeleton. */
export const REQUEST_TIMEOUT_MS = 9_000;
/** next_stop excludes at most this many venues (the endpoint's cap). */
export const MAX_EXCLUDE = 40;

export const PRIORITY: Record<Trigger, number> = {
  gate_change: 50,
  final_call: 40,
  delay: 20,
  next_stop: 15,
  plan: 10,
};
/** Where the outcome strip sits in the order. */
export const STRIP_PRIORITY = 30;

export function isRulesTrigger(t: Trigger): boolean {
  return t === 'gate_change' || t === 'final_call';
}

// ── Journey snapshot ───────────────────────────────────────────────

export interface Snapshot {
  /** capturedAt + departing flight: the journey's identity for cards (D6). */
  journeyKey: string;
  minutes: number | null;
  boardingTime: string | null;
  gate: string | null;
  currentTerminal: string;
  departureTerminal: string;
  journeyType: string | null;
}

/** D6: keyed on capturedAt + flight number from the start, never journey_id. */
export function journeyKeyOf(capturedAt: string, flight: string): string {
  return `${capturedAt}|${flight}`;
}

/** Minutes between two boarding times; positive when `to` is later. */
export function shiftMinutes(from: string | null, to: string | null): number | null {
  if (!from || !to) return null;
  const a = Date.parse(from.replace(' ', 'T'));
  const b = Date.parse(to.replace(' ', 'T'));
  return Number.isNaN(a) || Number.isNaN(b) ? null : Math.round((b - a) / 60_000);
}

// ── Stored state (tp_agent_cards) ──────────────────────────────────

export const STORE_KEY = 'tp_agent_cards';
export const STORE_VERSION = 1;

export interface CardEntry {
  card: AgentCard;
  /** The cache key this card answered. */
  key: string;
  /** First time it was visible (agent_card_shown), ms. */
  shown_at: number | null;
  dismissed: boolean;
  /** Gate cards only: did the terminal change. */
  terminal_changed?: boolean;
  /** Gate cards only: show the Quick-options chip (not under 45 min, P5). */
  quick_chip?: boolean;
}

export interface AgentStore {
  schema_version: number;
  journey_key: string | null;
  /** Requests already made, by cache key: one request per key. */
  requested: string[];
  /** Cards by trigger: the latest one of each. */
  cards: Partial<Record<Trigger, CardEntry>>;
  /** A plan request has gone out for this flight (one per flight, even across buckets). */
  plan_requested: boolean;
  plan_count: number;
  next_stop_count: number;
  shown_total: number;
  /** Boarding time when the last card was shown (or at capture): the delay baseline. */
  delay_baseline: string | null;
  /** Boarding times a delay card has already been made for. */
  delay_for: string[];
  /** Last gate and departure terminal seen, so a reload doesn't lose a change. */
  last_gate: string | null;
  last_departure_terminal: string | null;
  /** Last minutes to boarding seen, for the 45-minute crossing. */
  last_minutes: number | null;
  final_call_done: boolean;
  /** Venues tapped from cards or opened, checked in or answered: next_stop leaves them out. */
  visited: string[];
}

export function emptyStore(journeyKey: string | null): AgentStore {
  return {
    schema_version: STORE_VERSION,
    journey_key: journeyKey,
    requested: [],
    cards: {},
    plan_requested: false,
    plan_count: 0,
    next_stop_count: 0,
    shown_total: 0,
    delay_baseline: null,
    delay_for: [],
    last_gate: null,
    last_departure_terminal: null,
    last_minutes: null,
    final_call_done: false,
    visited: [],
  };
}

/** The stored object if it belongs to this journey and version, else a fresh one. */
export function storeFor(raw: string | null, journeyKey: string | null): AgentStore {
  if (!raw) return emptyStore(journeyKey);
  try {
    const s = JSON.parse(raw) as Partial<AgentStore>;
    if (s.schema_version !== STORE_VERSION || s.journey_key !== journeyKey) return emptyStore(journeyKey);
    return { ...emptyStore(journeyKey), ...s } as AgentStore;
  } catch {
    return emptyStore(journeyKey);
  }
}

export function readStore(journeyKey: string | null): AgentStore {
  try {
    return storeFor(localStorage.getItem(STORE_KEY), journeyKey);
  } catch {
    return emptyStore(journeyKey);
  }
}

export function writeStore(s: AgentStore): void {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(s));
  } catch { /* storage blocked: cards still work for this page */ }
}

// ── Cache key ──────────────────────────────────────────────────────

/**
 * One request per key: journey (capturedAt + flight) + trigger + current terminal
 * + passenger type + gate + 15-minute bucket of minutes to boarding. The departure
 * terminal is deliberately not in it (D1): a terminal change never refetches.
 */
export function cacheKey(args: {
  journeyKey: string;
  trigger: Trigger;
  currentTerminal: string;
  journeyType: string | null;
  gate: string | null;
  minutes: number;
}): string {
  const bucket = Math.floor(Math.max(0, args.minutes) / MINUTES_BUCKET);
  return [args.journeyKey, args.trigger, args.currentTerminal, args.journeyType ?? 'unknown', args.gate ?? '-', bucket].join('|');
}

// ── Detection ──────────────────────────────────────────────────────

export interface Detected {
  trigger: Trigger;
  /** gate_change only. */
  terminalChanged?: boolean;
}

/**
 * Triggers that fire for this snapshot against the stored state. Pure: the caller
 * records what it acts on. next_stop isn't here: it's event-driven (detectNextStop).
 */
export function detectTriggers(s: Snapshot, st: AgentStore): Detected[] {
  const out: Detected[] = [];
  if (s.minutes === null || !s.boardingTime) return out;
  const capReached = st.shown_total >= CAPS.total;

  // gate_change: a known gate changed. A first assignment isn't a change.
  if (st.last_gate && s.gate && s.gate !== st.last_gate && !capReached) {
    const terminalChanged = !!st.last_departure_terminal && st.last_departure_terminal !== s.departureTerminal;
    out.push({ trigger: 'gate_change', terminalChanged });
  }

  // final_call: crossed 45, seen from above, once per journey.
  if (!st.final_call_done && st.last_minutes !== null && st.last_minutes > FINAL_CALL_MINUTES
      && s.minutes <= FINAL_CALL_MINUTES && s.minutes >= 0 && !capReached) {
    out.push({ trigger: 'final_call' });
  }

  // delay: boarding later by >= 30 min than at the last card, once per boarding time.
  const shift = shiftMinutes(st.delay_baseline, s.boardingTime);
  if (shift !== null && shift >= DELAY_MIN_SHIFT_MINUTES && !st.delay_for.includes(s.boardingTime)
      && s.minutes >= NEXT_STOP_MIN_MINUTES && !capReached) {
    out.push({ trigger: 'delay' });
  }

  // plan: one per flight, with an hour or more.
  if (st.plan_count < CAPS.plan && !st.plan_requested && !st.cards.plan && s.minutes >= PLAN_MIN_MINUTES && !capReached) {
    out.push({ trigger: 'plan' });
  }
  return out;
}

export function detectNextStop(minutes: number | null, st: AgentStore): boolean {
  return minutes !== null && minutes >= NEXT_STOP_MIN_MINUTES
    && st.next_stop_count < CAPS.next_stop && st.shown_total < CAPS.total;
}

/** Venues next_stop leaves out: visited ones, newest first, capped. */
export function excludeSlugs(st: AgentStore): string[] {
  return [...new Set([...st.visited].reverse())].slice(0, MAX_EXCLUDE);
}

// ── Visibility ─────────────────────────────────────────────────────

/** Cards that may show now: ready (not loading), not dismissed. */
export function liveEntries(st: AgentStore): CardEntry[] {
  return (Object.values(st.cards) as CardEntry[]).filter(e => e && !e.dismissed);
}

/**
 * The one thing the slot shows: a card, the outcome strip, or nothing. A card
 * already shown keeps its place over a later lower one only by priority; a
 * model card that's newer replaces an older model card (they share one slot),
 * so a waiting plan never resurfaces after a delay card.
 */
export function pickVisible(entries: CardEntry[], stripPending: boolean): CardEntry | 'strip' | null {
  let best: CardEntry | null = null;
  for (const e of entries) {
    if (!best || PRIORITY[e.card.trigger] > PRIORITY[best.card.trigger]) best = e;
  }
  if (stripPending && (!best || PRIORITY[best.card.trigger] < STRIP_PRIORITY)) return 'strip';
  return best;
}

/** Is a card above the strip showing (gate_change or final_call)? The strip hides under it. */
export function cardAboveStrip(visible: CardEntry | 'strip' | null): boolean {
  return !!visible && visible !== 'strip' && PRIORITY[visible.card.trigger] > STRIP_PRIORITY;
}

/** A new model card retires older model cards: they share one slot. */
export function addCard(st: AgentStore, entry: CardEntry): AgentStore {
  const cards = { ...st.cards };
  if (!isRulesTrigger(entry.card.trigger)) {
    for (const t of ['plan', 'delay', 'next_stop'] as const) {
      if (t !== entry.card.trigger && cards[t] && !cards[t]!.dismissed) cards[t] = { ...cards[t]!, dismissed: true };
    }
  }
  cards[entry.card.trigger] = entry;
  return { ...st, cards };
}

/** Bookkeeping when a card first becomes visible. */
export function markShown(st: AgentStore, trigger: Trigger, boardingTime: string | null, at: number): AgentStore {
  const e = st.cards[trigger];
  if (!e || e.shown_at !== null) return st;
  return {
    ...st,
    cards: { ...st.cards, [trigger]: { ...e, shown_at: at } },
    shown_total: st.shown_total + 1,
    plan_count: trigger === 'plan' ? st.plan_count + 1 : st.plan_count,
    next_stop_count: trigger === 'next_stop' ? st.next_stop_count + 1 : st.next_stop_count,
    delay_baseline: boardingTime ?? st.delay_baseline,
  };
}

export function markDismissed(st: AgentStore, trigger: Trigger): AgentStore {
  const e = st.cards[trigger];
  return e ? { ...st, cards: { ...st.cards, [trigger]: { ...e, dismissed: true } } } : st;
}

export function noteVisited(st: AgentStore, slug: string): AgentStore {
  if (!slug || st.visited[st.visited.length - 1] === slug) return st;
  return { ...st, visited: [...st.visited.filter(s => s !== slug), slug].slice(-MAX_EXCLUDE) };
}

// ── Buses ──────────────────────────────────────────────────────────
// Small in-page pub/sub, so the outcome strip, the amenity page and chat can talk
// to the engine without importing React state from each other.

type Listener<T> = (v: T) => void;
function bus<T>() {
  const ls = new Set<Listener<T>>();
  return {
    emit: (v: T) => ls.forEach(l => { try { l(v); } catch { /* a listener never breaks the emitter */ } }),
    on: (l: Listener<T>) => { ls.add(l); return () => { ls.delete(l); }; },
  };
}

/** Every outcome_response written (strip answer or "I'm here"). */
export interface OutcomeNotice { slug: string; outcome: 'yes' | 'no' | 'dismissed'; source: string }
export const outcomeBus = bus<OutcomeNotice>();

/** Venue opened (detail page) or tapped on a card: next_stop leaves it out. */
export const visitedBus = bus<string>();

/** Slot state shared by the card and the outcome strip. */
export interface SlotState {
  /** The strip has something to ask (it may still be hidden under a card). */
  stripPending: boolean;
  /** A gate_change or final_call card is visible: the strip hides. */
  cardAbove: boolean;
}
let slot: SlotState = { stripPending: false, cardAbove: false };
const slotBus = bus<SlotState>();
export function getSlot(): SlotState { return slot; }
export function setSlot(patch: Partial<SlotState>): void {
  const next = { ...slot, ...patch };
  if (next.stripPending === slot.stripPending && next.cardAbove === slot.cardAbove) return;
  slot = next;
  slotBus.emit(slot);
}
export const subscribeSlot = slotBus.on;

/** "Ask something else": open chat seeded with this card. */
export const openChatBus = bus<AgentCard>();

/** P4: the hidden user turn that tells chat what the card showed is capped at this. */
export const CHAT_SEED_MAX = 600;

/**
 * A seeded chat: a hidden user turn (the API needs a user turn first) with the
 * card's content, then the card as a visible assistant message.
 */
export function chatSeedFor(card: AgentCard, now = Date.now()): ChatMessage[] {
  const c = AGENT_CARD_COPY.chatSeed;
  const stopLines = card.stops.map(s => `${s.name} (${terminalShort(s.terminal_code)})${s.access_label ? `, ${s.access_label}` : ''}: ${s.why}`);
  let hidden = c.hiddenUser(AGENT_CARD_COPY.title[card.trigger], card.header, card.line, stopLines);
  if (hidden.length > CHAT_SEED_MAX) hidden = `${hidden.slice(0, CHAT_SEED_MAX - 1)}…`;
  return [
    { id: `seed-u-${card.card_id}`, role: 'user', content: hidden, timestamp: now, hidden: true },
    { id: `seed-a-${card.card_id}`, role: 'assistant', content: c.visibleAssistant(card.line, card.stops.map(s => s.name)), timestamp: now },
  ];
}
