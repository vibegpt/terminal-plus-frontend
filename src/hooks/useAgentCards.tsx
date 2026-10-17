// src/hooks/useAgentCards.tsx
// The agent card engine's React side (CC-25). Mounted once in AppInner, so it runs
// during capture too: confirming a flight starts the plan request while capture's
// last step plays (the prefetch), and the card is ready when Home renders.
//
// It watches JourneyContext (the poller writes gate and boarding time through
// setJourney, so nothing in the poller changes), the outcome bus (next_stop) and
// the clock. Pure rules live in src/lib/agentCards.ts; this file does the fetching,
// storage writes and telemetry.

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useJourney, type JourneyData } from '@/context/JourneyContext';
import { supabase } from '@/lib/supabase';
import { track, telemetryIds, testHeaders } from '@/lib/telemetry';
import { eligibilityFromJourney, minutesToBoarding } from '@/lib/eligibility';
import { landsideAccess } from '../../shared/ranking/policy';
import { smart7Select, type AmenityRow } from '@/utils/smart7Select';
import { DISPLAY } from '@/lib/displayConfig';
import { normalizeGate } from '@/lib/outcomePrompt';
import { AGENT_CARD_COPY } from '@/lib/agentCardCopy';
import {
  cardHeader,
  editorialWhy,
  swapStop,
  type AgentCard,
  type CardStop,
  type ModelTrigger,
  type Trigger,
} from '../../shared/agentCard/card';
import {
  FINAL_CALL_MINUTES,
  JOURNEY_ID_WAIT_MS,
  REQUEST_TIMEOUT_MS,
  STORE_KEY,
  addCard,
  cacheKey,
  cardAboveStrip,
  detectNextStop,
  detectTriggers,
  excludeSlugs,
  journeyKeyOf,
  liveEntries,
  markDismissed,
  markShown,
  noteVisited,
  openChatBus,
  outcomeBus,
  pickVisible,
  readStore,
  setSlot,
  subscribeSlot,
  getSlot,
  visitedBus,
  writeStore,
  type AgentStore,
  type CardEntry,
  type Snapshot,
} from '@/lib/agentCards';

const PLACEHOLDER_FLIGHTS = new Set(['SQ000', 'UNKNOWN']);
const DEBUG_BUILD = import.meta.env.DEV || import.meta.env.VITE_TP_DEBUG === '1';
/** agent_card_shown waits this long for the journeys row id before it goes without. */
const SHOWN_JOURNEY_ID_WAIT_MS = 5_000;

function snapshotOf(journey: JourneyData | null, now: number): Snapshot | null {
  if (!journey?.boardingTime || !journey.departingFlight || PLACEHOLDER_FLIGHTS.has(journey.departingFlight)) return null;
  return {
    journeyKey: journeyKeyOf(journey.capturedAt, journey.departingFlight),
    minutes: minutesToBoarding(journey, now),
    boardingTime: journey.boardingTime,
    gate: normalizeGate(journey.gate),
    currentTerminal: journey.currentTerminal,
    departureTerminal: journey.departureTerminal,
    journeyType: journey.journey_type ?? null,
  };
}

function storedJourneyId(): string | null {
  try {
    const raw = localStorage.getItem('tp_journey_context');
    return raw ? (JSON.parse(raw) as { journey_id?: string }).journey_id ?? null : null;
  } catch {
    return null;
  }
}

async function waitForJourneyId(ms: number): Promise<string | null> {
  const until = Date.now() + ms;
  for (;;) {
    const id = storedJourneyId();
    if (id || Date.now() >= until) return id;
    await new Promise(r => setTimeout(r, 150));
  }
}

/** Debug builds only: the test clock goes to the server too, so both judge "open" at the same time. */
function clockHeader(): Record<string, string> {
  if (!DEBUG_BUILD) return {};
  try {
    const v = localStorage.getItem('tp_clock_sgt');
    return v && /^([01]\d|2[0-3]):([0-5]\d)$/.test(v) ? { 'x-tp-now': v } : {};
  } catch {
    return {};
  }
}

async function fetchModelCard(trigger: ModelTrigger, journey: JourneyData, snap: Snapshot, exclude: string[]): Promise<AgentCard | null> {
  // The id goes in the body only; the cache key never uses it (D6).
  const journeyId = journey.journey_id ?? await waitForJourneyId(JOURNEY_ID_WAIT_MS);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch('/api/agent-card', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...testHeaders(), ...clockHeader() },
      body: JSON.stringify({
        trigger,
        session_id: telemetryIds().session_id,
        journey_id: journeyId,
        context: {
          terminal: snap.currentTerminal,
          departure_terminal: snap.departureTerminal,
          journey_type: snap.journeyType,
          minutes_to_boarding: Math.max(0, snap.minutes ?? 0),
          gate: snap.gate,
        },
        exclude_slugs: exclude,
      }),
      signal: controller.signal,
    });
    if (!res.ok) return null;
    const card = (await res.json()) as AgentCard;
    return card && Array.isArray(card.stops) && card.stops.length > 0 ? card : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** final_call: 3 Quick-vibe venues, open now, in the departure terminal, from the ranker. */
async function buildFinalCall(journey: JourneyData, snap: Snapshot): Promise<AgentCard | null> {
  const ctx = eligibilityFromJourney(journey);
  let query = supabase
    .from('amenity_detail')
    .select('id, amenity_slug, name, terminal_code, opening_hours, editorial_score, editorial_note, is_landside')
    .eq('airport_code', 'SIN')
    .eq('terminal_code', snap.departureTerminal)
    .ilike('vibe_tags', '%Quick%')
    .order('editorial_score', { ascending: false, nullsFirst: false })
    .order('name')
    .limit(50);
  if (!landsideAccess({ isLandside: true, ...ctx }).show) query = query.eq('is_landside', false);
  const { data, error } = await query;
  if (error || !data) return null;
  const open = smart7Select(data as unknown as AmenityRow[], snap.departureTerminal, DISPLAY.COLLECTION_VISIBLE, ctx)
    .filter(r => r.open_state === 'open')
    .slice(0, 3);
  if (!open.length) return null;
  const stops: CardStop[] = open.map(r => {
    const venue = {
      slug: r.amenity_slug,
      name: r.name,
      terminal_code: r.terminal_code,
      editorial_note: typeof r.editorial_note === 'string' ? r.editorial_note : null,
      access_label: r.access_label,
      opens_label: r.opens_label,
    };
    return { ...venue, why: editorialWhy(venue) };
  });
  return {
    card_id: crypto.randomUUID(),
    trigger: 'final_call',
    source: 'rules',
    header: cardHeader({ minutesToBoarding: Math.max(0, snap.minutes ?? 0), currentTerminal: snap.departureTerminal, departureTerminal: snap.departureTerminal }),
    line: AGENT_CARD_COPY.finalCall.line(snap.departureTerminal),
    stops,
    alternates: [],
    chips: [{ kind: 'not_now', label: AGENT_CARD_COPY.chips.notNow }],
  };
}

function gateCard(snap: Snapshot, quickChip: boolean): AgentCard {
  return {
    card_id: crypto.randomUUID(),
    trigger: 'gate_change',
    source: 'rules',
    header: cardHeader({ minutesToBoarding: Math.max(0, snap.minutes ?? 0), currentTerminal: snap.currentTerminal, departureTerminal: snap.departureTerminal }),
    line: AGENT_CARD_COPY.gate.line(snap.gate ?? '', snap.departureTerminal),
    stops: [],
    alternates: [],
    chips: [
      ...(quickChip ? [{ kind: 'quick_options' as const, label: AGENT_CARD_COPY.gate.quickChip(snap.departureTerminal) }] : []),
      { kind: 'not_now', label: AGENT_CARD_COPY.chips.notNow },
    ],
  };
}

// ── Context ────────────────────────────────────────────────────────

export interface AgentCardSlot {
  /** What the slot shows: a card, the outcome strip, or nothing. */
  visible: CardEntry | 'strip' | null;
  /** A model card request is in flight (Home shows a skeleton while nothing else is up). */
  loading: boolean;
  dismiss: () => void;
  swap: (index: number) => void;
  tapStop: (index: number) => void;
  askElse: () => void;
  expand: () => void;
  quickOptions: () => void;
  /** Renderers register, so a card only counts as shown when something draws it. */
  register: (where: 'inline' | 'strip') => () => void;
}

const Ctx = createContext<AgentCardSlot>({
  visible: null,
  loading: false,
  dismiss: () => {},
  swap: () => {},
  tapStop: () => {},
  askElse: () => {},
  expand: () => {},
  quickOptions: () => {},
  register: () => () => {},
});

export const useAgentCardSlot = () => useContext(Ctx);

export function AgentCardProvider({ children }: { children: React.ReactNode }) {
  const { journey, setJourney } = useJourney();
  const navigate = useNavigate();
  const [now, setNow] = useState(() => Date.now());
  const [store, setStore] = useState<AgentStore | null>(null);
  const [loading, setLoading] = useState<Set<Trigger>>(() => new Set());
  const [stripPending, setStripPending] = useState(getSlot().stripPending);
  const [renderers, setRenderers] = useState(0);

  const snap = useMemo(() => snapshotOf(journey, now), [journey, now]);
  const key = snap?.journeyKey ?? null;
  const live = useRef({ journey, snap });
  live.current = { journey, snap };

  // Every write goes to storage first, then state, so a reload sees the same thing.
  const update = useCallback((fn: (s: AgentStore) => AgentStore) => {
    const k = live.current.snap?.journeyKey ?? null;
    if (!k) return;
    const next = fn(readStore(k));
    writeStore(next);
    setStore(next);
  }, []);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);
  useEffect(() => subscribeSlot(s => setStripPending(s.stripPending)), []);
  useEffect(() => { setStore(key ? readStore(key) : null); }, [key]);

  const setLoadingFor = useCallback((t: Trigger, on: boolean) => {
    setLoading(prev => {
      const next = new Set(prev);
      if (on) next.add(t); else next.delete(t);
      return next;
    });
  }, []);

  /** One request per cache key. */
  const requestModelCard = useCallback(async (trigger: ModelTrigger, exclude: string[] = []) => {
    const { journey: j, snap: s } = live.current;
    if (!j || !s || s.minutes === null) return;
    const k = cacheKey({ journeyKey: s.journeyKey, trigger, currentTerminal: s.currentTerminal, journeyType: s.journeyType, gate: s.gate, minutes: s.minutes });
    if (readStore(s.journeyKey).requested.includes(k)) return;
    update(st => ({ ...st, requested: [...st.requested, k] }));
    setLoadingFor(trigger, true);
    const card = await fetchModelCard(trigger, j, s, exclude);
    setLoadingFor(trigger, false);
    // A flight changed while it was in flight: drop it.
    if (!card || live.current.snap?.journeyKey !== s.journeyKey) return;
    update(st => addCard(st, { card, key: k, shown_at: null, dismissed: false }));
  }, [update, setLoadingFor]);

  // Detection on every snapshot change (journey edits, poller writes, the clock).
  useEffect(() => {
    const { journey: j } = live.current;
    if (!snap || !j || snap.minutes === null) return;
    let st = readStore(snap.journeyKey);
    // First sight of this journey: today's values are the baseline, not changes.
    if (st.delay_baseline === null && st.last_minutes === null) {
      st = { ...st, delay_baseline: snap.boardingTime, last_gate: snap.gate, last_departure_terminal: snap.departureTerminal, last_minutes: snap.minutes };
    }
    const detected = detectTriggers(snap, st);
    for (const d of detected) {
      if (d.trigger === 'gate_change') {
        const quickChip = snap.minutes > FINAL_CALL_MINUTES; // P5: no chip under 45 min
        st = addCard(st, { card: gateCard(snap, quickChip), key: `${snap.journeyKey}|gate|${snap.gate}`, shown_at: null, dismissed: false, terminal_changed: !!d.terminalChanged, quick_chip: quickChip });
      } else if (d.trigger === 'final_call') {
        st = { ...st, final_call_done: true };
        void buildFinalCall(j, snap).then(card => {
          if (card && live.current.snap?.journeyKey === snap.journeyKey) {
            update(s2 => addCard(s2, { card, key: `${snap.journeyKey}|final_call`, shown_at: null, dismissed: false }));
          }
        });
      } else if (d.trigger === 'delay') {
        st = { ...st, delay_for: [...st.delay_for, snap.boardingTime!] };
      } else if (d.trigger === 'plan') {
        st = { ...st, plan_requested: true };
      }
    }
    st = { ...st, last_gate: snap.gate ?? st.last_gate, last_departure_terminal: snap.departureTerminal, last_minutes: snap.minutes };
    writeStore(st);
    setStore(st);
    for (const d of detected) {
      if (d.trigger === 'plan' || d.trigger === 'delay') void requestModelCard(d.trigger);
    }
  }, [snap, update, requestModelCard]);

  // next_stop: after an outcome answer or "I'm here".
  useEffect(() => outcomeBus.on(n => {
    const s = live.current.snap;
    if (!s || n.outcome === 'dismissed') return;
    update(st => noteVisited(st, n.slug));
    const st = readStore(s.journeyKey);
    if (detectNextStop(s.minutes, st)) void requestModelCard('next_stop', excludeSlugs(st));
  }), [update, requestModelCard]);

  useEffect(() => visitedBus.on(slug => update(st => noteVisited(st, slug))), [update]);

  const visible = useMemo(
    () => (store ? pickVisible(liveEntries(store), stripPending) : stripPending ? 'strip' : null),
    [store, stripPending],
  );

  // The strip hides under gate_change / final_call (and shows again after).
  useEffect(() => { setSlot({ cardAbove: cardAboveStrip(visible) }); }, [visible]);

  // agent_card_shown: once per card, when something draws it, with the journey id if it can.
  const visibleEntry = visible && visible !== 'strip' ? visible : null;
  useEffect(() => {
    if (!visibleEntry || visibleEntry.shown_at !== null || renderers === 0) return;
    let cancelled = false;
    const { card } = visibleEntry;
    void waitForJourneyId(journey?.journey_id ? 0 : SHOWN_JOURNEY_ID_WAIT_MS).then(() => {
      if (cancelled) return;
      const s = live.current.snap;
      track('agent_card_shown', {
        payload: {
          card_id: card.card_id,
          trigger: card.trigger,
          source: card.source,
          slugs: card.stops.map(x => x.slug),
          minutes_to_boarding: s?.minutes ?? null,
          journey_type: s?.journeyType ?? null,
        },
      });
      update(st => markShown(st, card.trigger, s?.boardingTime ?? null, Date.now()));
    });
    return () => { cancelled = true; };
  }, [visibleEntry, renderers, journey?.journey_id, update]);

  const tapped = useCallback((target: 'stop' | 'swap' | 'chat' | 'expand', slug: string | null, position: number | null) => {
    if (!visibleEntry) return;
    track('agent_card_tapped', {
      amenity_slug: slug,
      position,
      payload: { card_id: visibleEntry.card.card_id, trigger: visibleEntry.card.trigger, target, amenity_slug: slug, position },
    });
  }, [visibleEntry]);

  const dismiss = useCallback(() => {
    if (!visibleEntry) return;
    const secs = visibleEntry.shown_at ? Math.max(0, Math.round((Date.now() - visibleEntry.shown_at) / 1000)) : 0;
    track('agent_card_dismissed', {
      payload: { card_id: visibleEntry.card.card_id, trigger: visibleEntry.card.trigger, seconds_visible: secs },
    });
    update(st => markDismissed(st, visibleEntry.card.trigger));
  }, [visibleEntry, update]);

  const swap = useCallback((index: number) => {
    if (!visibleEntry) return;
    const removed = visibleEntry.card.stops[index];
    if (!removed || visibleEntry.card.alternates.length === 0) return;
    tapped('swap', removed.slug, index);
    update(st => {
      const e = st.cards[visibleEntry.card.trigger];
      if (!e) return st;
      const swapped = swapStop(e.card, index);
      return { ...st, cards: { ...st.cards, [e.card.trigger]: { ...e, card: { ...e.card, ...swapped } } } };
    });
  }, [visibleEntry, tapped, update]);

  const tapStop = useCallback((index: number) => {
    if (!visibleEntry) return;
    const stop = visibleEntry.card.stops[index];
    if (!stop) return;
    tapped('stop', stop.slug, index);
    // P2: amenity_tapped too, so the funnel counts card taps.
    track('amenity_tapped', {
      amenity_slug: stop.slug,
      position: index,
      payload: { surface: 'agent_card', card_id: visibleEntry.card.card_id },
    });
    update(st => noteVisited(st, stop.slug));
    navigate(`/amenity/${stop.slug}`, { state: { card_id: visibleEntry.card.card_id } });
  }, [visibleEntry, tapped, update, navigate]);

  const askElse = useCallback(() => {
    if (!visibleEntry) return;
    tapped('chat', null, null);
    openChatBus.emit(visibleEntry.card);
  }, [visibleEntry, tapped]);

  const expand = useCallback(() => tapped('expand', null, null), [tapped]);
  const quickOptions = useCallback(() => navigate('/vibe/quick'), [navigate]);

  const register = useCallback(() => {
    setRenderers(n => n + 1);
    return () => setRenderers(n => n - 1);
  }, []);

  // Preview builds only (VITE_TP_DEBUG=1, D5): drive the engine from the console.
  // patchJourney goes through setJourney, the poller's own path, without the fetch.
  useEffect(() => {
    if (import.meta.env.VITE_TP_DEBUG === '1') {
      (window as unknown as Record<string, unknown>).__tpAgentCards = {
        patchJourney: (patch: Partial<JourneyData>) => {
          const j = live.current.journey;
          if (j) setJourney({ ...j, ...patch });
        },
        state: () => (live.current.snap ? readStore(live.current.snap.journeyKey) : null),
        reset: () => { try { localStorage.removeItem(STORE_KEY); } catch { /* blocked */ } setStore(null); },
        tick: () => setNow(Date.now()),
      };
    }
  }, [setJourney]);

  const value = useMemo<AgentCardSlot>(() => ({
    visible,
    loading: loading.size > 0,
    dismiss,
    swap,
    tapStop,
    askElse,
    expand,
    quickOptions,
    register,
  }), [visible, loading, dismiss, swap, tapStop, askElse, expand, quickOptions, register]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
