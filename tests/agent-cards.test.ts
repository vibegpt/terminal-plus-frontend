// Agent cards (CC-25). Run: npx tsx --test tests/agent-cards.test.ts
// Every trigger positive and negative, priority, caps, cache key, swap, the server's
// repair rules, the pool scope (D3), the candidate v1→v2 migration, the strip's
// shown-only-when-visible rule (P3) and the seeded chat cap (P4).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  CAPS,
  CHAT_SEED_MAX,
  addCard,
  cacheKey,
  cardAboveStrip,
  chatSeedFor,
  detectNextStop,
  detectTriggers,
  emptyStore,
  excludeSlugs,
  journeyKeyOf,
  liveEntries,
  markDismissed,
  markShown,
  noteVisited,
  pickVisible,
  storeFor,
  type AgentStore,
  type CardEntry,
  type Snapshot,
} from '../src/lib/agentCards';
import {
  cardHeader,
  claimsWalkTime,
  fallbackStops,
  isCrossTerminal,
  parseCardOutput,
  poolScope,
  repairCard,
  stopCount,
  swapStop,
  alternatesFor,
  WHY_MAX,
  LINE_MAX,
  type AgentCard,
  type PoolVenue,
  type Trigger,
} from '../shared/agentCard/card';
import { parseCandidate, CANDIDATE_VERSION } from '../src/lib/candidateTap';
import { stripDisplay } from '../src/lib/outcomePrompt';

// ── Fixtures ───────────────────────────────────────────────────────

const KEY = journeyKeyOf('2026-10-17T05:00:00.000Z', 'SQ221');
const BOARD = '2026-10-17T10:00:00.000Z';

function snap(p: Partial<Snapshot> = {}): Snapshot {
  return {
    journeyKey: KEY,
    minutes: 150,
    boardingTime: BOARD,
    gate: 'B6',
    currentTerminal: 'SIN-T3',
    departureTerminal: 'SIN-T3',
    journeyType: 'connecting',
    ...p,
  };
}

/** The store as the engine leaves it after first sight of the journey. */
function seen(p: Partial<AgentStore> = {}): AgentStore {
  return {
    ...emptyStore(KEY),
    delay_baseline: BOARD,
    last_gate: 'B6',
    last_departure_terminal: 'SIN-T3',
    last_minutes: 150,
    ...p,
  };
}

const UUID = '3f2b8a7e-1c4d-4e5f-9a6b-7c8d9e0f1a2b';

function card(trigger: Trigger, p: Partial<AgentCard> = {}): AgentCard {
  return {
    card_id: UUID,
    trigger,
    source: 'model',
    header: 'h',
    line: 'l',
    stops: [],
    alternates: [],
    chips: [],
    ...p,
  };
}

function entry(trigger: Trigger, p: Partial<CardEntry> = {}): CardEntry {
  return { card: card(trigger), key: trigger, shown_at: null, dismissed: false, ...p };
}

function venue(slug: string, p: Partial<PoolVenue> = {}): PoolVenue {
  return { slug, name: slug.toUpperCase(), terminal_code: 'SIN-T3', editorial_note: `Note for ${slug}`, access_label: null, opens_label: null, ...p };
}

const POOL = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'].map(s => venue(s));
const triggers = (s: Snapshot, st: AgentStore) => detectTriggers(s, st).map(d => d.trigger);

// ── plan ───────────────────────────────────────────────────────────

test('plan: fires at >= 60 min with no plan yet', () => {
  assert.deepEqual(triggers(snap({ minutes: 60 }), seen({ last_minutes: 60 })), ['plan']);
  assert.deepEqual(triggers(snap({ minutes: 200 }), seen({ last_minutes: 200 })), ['plan']);
});

test('plan: not under 60 min, not twice, not without a boarding time', () => {
  assert.deepEqual(triggers(snap({ minutes: 59 }), seen({ last_minutes: 59 })), []);
  assert.deepEqual(triggers(snap(), seen({ plan_requested: true })), []);
  assert.deepEqual(triggers(snap(), seen({ plan_count: 1 })), []);
  assert.deepEqual(triggers(snap({ boardingTime: null }), seen()), []);
  assert.deepEqual(triggers(snap({ minutes: null }), seen()), []);
});

test('plan: a flight change is a new journey key, so a fresh store and a new plan', () => {
  const other = journeyKeyOf('2026-10-17T06:00:00.000Z', 'SQ231');
  const old = JSON.stringify({ ...seen({ plan_requested: true, plan_count: 1 }) });
  const st = storeFor(old, other);
  assert.equal(st.journey_key, other);
  assert.equal(st.plan_requested, false);
  assert.equal(st.plan_count, 0);
});

// ── delay ──────────────────────────────────────────────────────────

const later = (min: number) => new Date(Date.parse(BOARD) + min * 60_000).toISOString();

test('delay: boarding later by >= 30 min than at the last card', () => {
  const st = seen({ plan_requested: true });
  assert.deepEqual(triggers(snap({ boardingTime: later(30) }), st), ['delay']);
  assert.deepEqual(triggers(snap({ boardingTime: later(75) }), st), ['delay']);
});

test('delay: not under 30 min, not earlier, once per boarding time, not under 45 min left', () => {
  const st = seen({ plan_requested: true });
  assert.deepEqual(triggers(snap({ boardingTime: later(29) }), st), []);
  assert.deepEqual(triggers(snap({ boardingTime: later(-40) }), st), []);
  assert.deepEqual(triggers(snap({ boardingTime: later(75) }), { ...st, delay_for: [later(75)] }), []);
  assert.deepEqual(triggers(snap({ boardingTime: later(75), minutes: 44 }), { ...st, last_minutes: 44 }), []);
});

test('delay: markShown moves the baseline, so the next delay counts from the last card', () => {
  let st = addCard(seen(), entry('delay'));
  st = markShown(st, 'delay', later(75), 1);
  assert.equal(st.delay_baseline, later(75));
  assert.deepEqual(triggers(snap({ boardingTime: later(90) }), { ...st, plan_requested: true }), []);
  assert.deepEqual(triggers(snap({ boardingTime: later(110) }), { ...st, plan_requested: true }), ['delay']);
});

// ── gate_change ────────────────────────────────────────────────────

test('gate_change: a known gate changed; terminal change flagged', () => {
  const st = seen({ plan_requested: true });
  const same = detectTriggers(snap({ gate: 'B8' }), st);
  assert.deepEqual(same, [{ trigger: 'gate_change', terminalChanged: false }]);
  const moved = detectTriggers(snap({ gate: 'E4', departureTerminal: 'SIN-T2' }), st);
  assert.deepEqual(moved, [{ trigger: 'gate_change', terminalChanged: true }]);
});

test('gate_change: not on first assignment, not when unchanged', () => {
  const st = seen({ plan_requested: true, last_gate: null });
  assert.deepEqual(triggers(snap({ gate: 'B6' }), st), []);
  assert.deepEqual(triggers(snap({ gate: 'B6' }), seen({ plan_requested: true })), []);
});

// ── final_call ─────────────────────────────────────────────────────

test('final_call: crosses 45 from above, once', () => {
  const st = seen({ plan_requested: true, last_minutes: 46 });
  assert.deepEqual(triggers(snap({ minutes: 45 }), st), ['final_call']);
  assert.deepEqual(triggers(snap({ minutes: 45 }), { ...st, final_call_done: true }), []);
});

test('final_call: not when first seen at or under 45, not while above', () => {
  assert.deepEqual(triggers(snap({ minutes: 40 }), seen({ plan_requested: true, last_minutes: 40 })), []);
  assert.deepEqual(triggers(snap({ minutes: 46 }), seen({ plan_requested: true, last_minutes: 50 })), []);
  assert.deepEqual(triggers(snap({ minutes: -5 }), seen({ plan_requested: true, last_minutes: 50 })), []);
});

// ── next_stop ──────────────────────────────────────────────────────

test('next_stop: >= 45 min left, under its cap of 3', () => {
  assert.equal(detectNextStop(45, seen()), true);
  assert.equal(detectNextStop(44, seen()), false);
  assert.equal(detectNextStop(null, seen()), false);
  assert.equal(detectNextStop(120, seen({ next_stop_count: CAPS.next_stop })), false);
});

test('next_stop: excludes every visited venue, newest first, capped at 40', () => {
  let st = seen();
  for (let i = 0; i < 45; i++) st = noteVisited(st, `v${i}`);
  st = noteVisited(st, 'v10'); // revisit moves it to the end
  const ex = excludeSlugs(st);
  assert.equal(ex.length, 40);
  assert.equal(ex[0], 'v10');
  assert.ok(!ex.includes('v0'));
});

// ── caps ───────────────────────────────────────────────────────────

test('caps: 6 shown per journey stops every trigger', () => {
  const st = seen({ shown_total: CAPS.total, last_minutes: 46 });
  assert.deepEqual(triggers(snap({ minutes: 45, gate: 'C1', boardingTime: later(60) }), st), []);
  assert.equal(detectNextStop(120, st), false);
});

test('caps: markShown counts once per card', () => {
  let st = addCard(seen(), entry('plan'));
  st = markShown(st, 'plan', BOARD, 1);
  st = markShown(st, 'plan', BOARD, 2);
  assert.equal(st.shown_total, 1);
  assert.equal(st.plan_count, 1);
});

// ── priority ───────────────────────────────────────────────────────

test('priority: gate_change > final_call > strip > delay > next_stop > plan', () => {
  const all = ['plan', 'next_stop', 'delay', 'final_call', 'gate_change'].map(t => entry(t as Trigger));
  assert.equal((pickVisible(all, true) as CardEntry).card.trigger, 'gate_change');
  assert.equal((pickVisible(all.slice(0, 4), true) as CardEntry).card.trigger, 'final_call');
  assert.equal(pickVisible(all.slice(0, 3), true), 'strip');
  assert.equal((pickVisible(all.slice(0, 3), false) as CardEntry).card.trigger, 'delay');
  assert.equal((pickVisible([entry('plan'), entry('next_stop')], false) as CardEntry).card.trigger, 'next_stop');
  assert.equal(pickVisible([], false), null);
  assert.equal(pickVisible([], true), 'strip');
});

test('priority: the strip hides only under gate_change and final_call', () => {
  assert.equal(cardAboveStrip(entry('gate_change')), true);
  assert.equal(cardAboveStrip(entry('final_call')), true);
  assert.equal(cardAboveStrip(entry('plan')), false);
  assert.equal(cardAboveStrip('strip'), false);
  assert.equal(cardAboveStrip(null), false);
});

test('priority: a newer model card retires older model cards; rules cards stay', () => {
  let st = addCard(seen(), entry('plan'));
  st = addCard(st, entry('gate_change'));
  st = addCard(st, entry('delay'));
  assert.equal(st.cards.plan!.dismissed, true);
  assert.equal(st.cards.gate_change!.dismissed, false);
  assert.deepEqual(liveEntries(st).map(e => e.card.trigger).sort(), ['delay', 'gate_change']);
});

test('dismiss: a dismissed card stays gone', () => {
  const st = markDismissed(addCard(seen(), entry('plan')), 'plan');
  assert.deepEqual(liveEntries(st), []);
  assert.equal(pickVisible(liveEntries(st), false), null);
});

// ── cache key ──────────────────────────────────────────────────────

test('cache key: journey + trigger + terminal + type + gate + 15-min bucket', () => {
  const base = { journeyKey: KEY, trigger: 'plan' as Trigger, currentTerminal: 'SIN-T3', journeyType: 'connecting', gate: 'B6', minutes: 150 };
  assert.equal(cacheKey(base), cacheKey({ ...base, minutes: 159 }));
  assert.notEqual(cacheKey(base), cacheKey({ ...base, minutes: 165 }));
  assert.notEqual(cacheKey(base), cacheKey({ ...base, gate: 'B8' }));
  assert.notEqual(cacheKey(base), cacheKey({ ...base, journeyType: 'departing' }));
  assert.notEqual(cacheKey(base), cacheKey({ ...base, currentTerminal: 'SIN-T1' }));
  assert.notEqual(cacheKey(base), cacheKey({ ...base, trigger: 'delay' }));
});

test('cache key: departure terminal and journey_id are not in it (D1, D6)', () => {
  const k = cacheKey({ journeyKey: KEY, trigger: 'plan', currentTerminal: 'SIN-T1', journeyType: 'connecting', gate: null, minutes: 200 });
  assert.ok(!k.includes('SIN-T3'));
  assert.ok(k.startsWith('2026-10-17T05:00:00.000Z|SQ221|'));
  // A late journey_id changes nothing the key reads: same capture, same flight, same key.
  assert.equal(journeyKeyOf('2026-10-17T05:00:00.000Z', 'SQ221'), KEY);
});

// ── swap ───────────────────────────────────────────────────────────

test('swap: replaces one stop from the alternates, no network, removed stop goes to the back', () => {
  const stops = fallbackStops(POOL, 3);
  const alternates = alternatesFor(POOL, stops);
  assert.deepEqual(alternates.map(s => s.slug), ['d', 'e', 'f', 'g', 'h', 'i']);
  const out = swapStop({ stops, alternates }, 1);
  assert.deepEqual(out.stops.map(s => s.slug), ['a', 'd', 'c']);
  assert.deepEqual(out.alternates.map(s => s.slug), ['e', 'f', 'g', 'h', 'i', 'b']);
});

test('swap: no alternates or a bad index changes nothing', () => {
  const stops = fallbackStops(POOL, 2);
  assert.deepEqual(swapStop({ stops, alternates: [] }, 0).stops, stops);
  assert.deepEqual(swapStop({ stops, alternates: alternatesFor(POOL, stops) }, 5).stops, stops);
});

// ── server repair ──────────────────────────────────────────────────

test('stop count: 3 from 120 min, 2 below', () => {
  assert.equal(stopCount(120), 3);
  assert.equal(stopCount(119), 2);
  assert.equal(stopCount(65), 2);
});

test('repair: out-of-pool slugs dropped, duplicates dropped, backfilled in ranker order', () => {
  const r = repairCard({ line: 'Enjoy', stops: [{ slug: 'zzz', why: 'x' }, { slug: 'c', why: 'Good noodles' }, { slug: 'c', why: 'again' }] }, POOL, 3, 'fb');
  assert.deepEqual(r.stops.map(s => s.slug), ['c', 'a', 'b']);
  assert.ok(r.repairs.some(x => x.startsWith('out_of_pool')));
  assert.ok(r.repairs.some(x => x.startsWith('duplicate')));
});

test('repair: extra stops cut to the count', () => {
  const r = repairCard({ line: 'Hi', stops: ['a', 'b', 'c', 'd'].map(slug => ({ slug, why: 'ok' })) }, POOL, 2, 'fb');
  assert.equal(r.stops.length, 2);
});

test('repair: long why and walk-minute claims replaced by the editorial note', () => {
  const r = repairCard({
    line: 'Hi',
    stops: [
      { slug: 'a', why: 'x'.repeat(WHY_MAX + 1) },
      { slug: 'b', why: 'Only 5 min walk from your gate' },
      { slug: 'c', why: 'Gate is 3 minutes away' },
    ],
  }, POOL, 3, 'fb');
  assert.deepEqual(r.stops.map(s => s.why), ['Note for a', 'Note for b', 'Note for c']);
});

test('repair: walk-claim detector', () => {
  assert.equal(claimsWalkTime('a 10 min walk'), true);
  assert.equal(claimsWalkTime('5 minutes away'), true);
  assert.equal(claimsWalkTime('near gate, 2m'), true);
  assert.equal(claimsWalkTime('Open 24 hours, great laksa'), false);
  assert.equal(claimsWalkTime('Ready in 10 min'), false);
});

test('repair: a long line is truncated; an empty or walk-claim line uses the fallback', () => {
  assert.ok(repairCard({ line: 'w'.repeat(100), stops: [] }, POOL, 2, 'fb').line.length <= LINE_MAX);
  assert.equal(repairCard({ line: '  ', stops: [] }, POOL, 2, 'fb').line, 'fb');
  assert.equal(repairCard({ line: 'All 5 min walk away', stops: [] }, POOL, 2, 'fb').line, 'fb');
});

test('parse: only the schema shape passes', () => {
  assert.deepEqual(parseCardOutput('{"line":"a","stops":[{"slug":"x","why":"y"}]}'), { line: 'a', stops: [{ slug: 'x', why: 'y' }] });
  assert.equal(parseCardOutput('not json'), null);
  assert.equal(parseCardOutput('{"stops":[]}'), null);
});

// ── pool scope and header (D3) ─────────────────────────────────────

test('pool scope: arrived T1, departs T3 covers both; T4 never joins', () => {
  assert.deepEqual(poolScope('SIN-T1', 'SIN-T3'), ['SIN-T1', 'SIN-T3']);
  assert.deepEqual(poolScope('SIN-T3', 'SIN-T3'), ['SIN-T3']);
  assert.deepEqual(poolScope('SIN-T1', 'SIN-T4'), ['SIN-T1']);
  assert.deepEqual(poolScope('SIN-T4', 'SIN-T2'), ['SIN-T4']);
  assert.equal(isCrossTerminal('SIN-T2', 'SIN-T3'), true);
});

test('header: deterministic, cross-terminal form, landside label', () => {
  assert.equal(cardHeader({ minutesToBoarding: 160, currentTerminal: 'SIN-T3', departureTerminal: 'SIN-T3' }), '2h 40m to boarding · T3');
  assert.equal(cardHeader({ minutesToBoarding: 200, currentTerminal: 'SIN-T1', departureTerminal: 'SIN-T3' }), '3h 20m to boarding · Arrived T1 · departs T3');
  assert.equal(cardHeader({ minutesToBoarding: 95, currentTerminal: 'SIN-T2', departureTerminal: 'SIN-T2', landsideLabel: 'Before immigration' }), '1h 35m to boarding · T2 · Before immigration');
});

// ── candidate v2 (card_id) ─────────────────────────────────────────

test('candidate: v1 migrates on read with card_id null; v2 keeps a valid card_id', () => {
  const v1 = parseCandidate(JSON.stringify({ schema_version: 1, slug: 'a', name: 'A', type: 'detail_open', at: 5 }));
  assert.deepEqual(v1, { slug: 'a', name: 'A', type: 'detail_open', at: 5, card_id: null });
  const v2 = parseCandidate(JSON.stringify({ schema_version: CANDIDATE_VERSION, slug: 'a', name: 'A', type: 'save', at: 5, card_id: UUID }));
  assert.equal(v2?.card_id, UUID);
  const bad = parseCandidate(JSON.stringify({ schema_version: CANDIDATE_VERSION, slug: 'a', name: 'A', type: 'save', at: 5, card_id: 'nope' }));
  assert.equal(bad?.card_id, null);
  assert.equal(parseCandidate(JSON.stringify({ schema_version: 3, slug: 'a', name: 'A', type: 'save', at: 5 })), null);
});

// ── outcome strip under a card (P3) ────────────────────────────────

test('strip: outcome_shown only when actually visible', () => {
  assert.deepEqual(stripDisplay({ pending: true, cardAbove: true, shownLogged: false }), { visible: false, logShown: false });
  assert.deepEqual(stripDisplay({ pending: true, cardAbove: false, shownLogged: false }), { visible: true, logShown: true });
  assert.deepEqual(stripDisplay({ pending: true, cardAbove: false, shownLogged: true }), { visible: true, logShown: false });
  assert.deepEqual(stripDisplay({ pending: false, cardAbove: false, shownLogged: false }), { visible: false, logShown: false });
});

// ── seeded chat (P4) ───────────────────────────────────────────────

test('chat seed: hidden user turn first, capped at 600 chars; visible assistant card', () => {
  const long = card('plan', { header: 'H', line: 'L', stops: POOL.slice(0, 3).map(v => ({ ...v, why: 'w'.repeat(300) })) });
  const [u, a] = chatSeedFor(long, 1);
  assert.equal(u.role, 'user');
  assert.equal(u.hidden, true);
  assert.ok(u.content.length <= CHAT_SEED_MAX);
  assert.equal(a.role, 'assistant');
  assert.ok(!a.hidden);
  assert.ok(a.content.includes('A'));
});

// ── slot: primed during render, still published afterwards ─────────

import { getSlot, primeSlot, setSlot, subscribeSlot } from '../src/lib/agentCards';

test('slot: primeSlot is read at once but still published by the next setSlot', () => {
  const seenStates: boolean[] = [];
  const off = subscribeSlot(s => seenStates.push(s.cardAbove));
  primeSlot({ cardAbove: true });
  assert.equal(getSlot().cardAbove, true); // a strip mounting now starts hidden
  setSlot({ cardAbove: true }); // the provider's effect: subscribers must still hear it
  assert.deepEqual(seenStates, [true]);
  setSlot({ cardAbove: true }); // no change, no repeat
  assert.deepEqual(seenStates, [true]);
  primeSlot({ cardAbove: false });
  setSlot({ cardAbove: false });
  assert.deepEqual(seenStates, [true, false]);
  off();
});
