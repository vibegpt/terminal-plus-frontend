// Outcome strip eligibility (CC-13). Run: npx tsx --test tests/outcome-eligibility.test.ts
// Every rule, positive and negative. Rules 1-5 and 8 decide outcome_eligible;
// rules 6 and 7 only gate whether the strip shows.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  evaluateOutcome,
  gapMinMs,
  gateChipVisible,
  normalizeGate,
  parseDebugFlag,
  toMinutes,
  OUTCOME_CANDIDATE_WINDOW_MINUTES,
  OUTCOME_DEBUG_GAP_MIN_SECONDS,
  OUTCOME_GAP_MAX_MINUTES,
  OUTCOME_GAP_MIN_MINUTES,
  OUTCOME_MAX_PROMPTS_PER_JOURNEY,
  type OutcomeInput,
} from '../src/lib/outcomePrompt';
import { emptyLedger, ledgerFor, parseCandidate } from '../src/lib/candidateTap';

const MIN = 60_000;
const NOW = Date.parse('2026-10-03T06:00:00Z');

// A passing baseline: tapped 5 min before backgrounding, back after a 25 min gap.
function input(over: Partial<OutcomeInput> = {}): OutcomeInput {
  const lastSeen = NOW - 25 * MIN;
  return {
    now: NOW,
    lastSeen,
    candidate: { slug: 'kopi-bar-t3', name: 'Kopi Bar', type: 'detail_open', at: lastSeen - 5 * MIN },
    asked: {},
    shownCount: 0,
    captureBarShowing: false,
    journeyActive: true,
    departed: false,
    ...over,
  };
}

test('baseline: every rule holds, eligible and showable', () => {
  const v = evaluateOutcome(input());
  assert.deepEqual(v.failed, []);
  assert.equal(v.candidateEligible, true);
  assert.equal(v.showable, true);
  assert.equal(v.gapMinutes, 25);
  assert.equal(v.candidateAgeMinutes, 5);
});

test('rule 1: no candidate fails; a candidate passes', () => {
  const v = evaluateOutcome(input({ candidate: null }));
  assert.deepEqual(v.failed, ['no_candidate']);
  assert.equal(v.candidateEligible, false);
  assert.equal(v.candidateAgeMinutes, null);
  assert.ok(!evaluateOutcome(input()).failed.includes('no_candidate'));
});

test('first-ever page load (no tp_last_seen) never prompts', () => {
  const v = evaluateOutcome(input({ lastSeen: null }));
  assert.ok(v.failed.includes('first_session'));
  assert.equal(v.candidateEligible, false);
  assert.equal(v.gapMinutes, null);
});

test('rule 2: gap below the minimum fails, at the minimum passes', () => {
  const lastSeenBelow = NOW - (OUTCOME_GAP_MIN_MINUTES * MIN - 1000);
  const below = evaluateOutcome(input({ lastSeen: lastSeenBelow, candidate: { slug: 'a', name: 'A', type: 'save', at: lastSeenBelow - MIN } }));
  assert.deepEqual(below.failed, ['gap_below_min']);
  assert.equal(below.candidateEligible, false);

  const lastSeenAt = NOW - OUTCOME_GAP_MIN_MINUTES * MIN;
  const at = evaluateOutcome(input({ lastSeen: lastSeenAt, candidate: { slug: 'a', name: 'A', type: 'save', at: lastSeenAt - MIN } }));
  assert.deepEqual(at.failed, []);
});

test('rule 2 debug: ?tp_gap_debug drops the minimum to 20 s', () => {
  assert.equal(gapMinMs(true), OUTCOME_DEBUG_GAP_MIN_SECONDS * 1000);
  assert.equal(gapMinMs(false), OUTCOME_GAP_MIN_MINUTES * MIN);
  const lastSeen = NOW - 25_000;
  const c = { slug: 'a', name: 'A', type: 'detail_open' as const, at: lastSeen - MIN };
  assert.deepEqual(evaluateOutcome(input({ lastSeen, candidate: c, gapMinMs: gapMinMs(true) })).failed, []);
  assert.deepEqual(evaluateOutcome(input({ lastSeen, candidate: c })).failed, ['gap_below_min']);
  assert.deepEqual(evaluateOutcome(input({ lastSeen: NOW - 15_000, candidate: c, gapMinMs: gapMinMs(true) })).failed, ['gap_below_min']);
});

test('debug flag is honoured only on DEV or VITE_TP_DEBUG=1 builds', () => {
  assert.equal(parseDebugFlag('?tp_gap_debug=1', true, undefined), true);
  assert.equal(parseDebugFlag('?tp_gap_debug=1', false, '1'), true);
  assert.equal(parseDebugFlag('?tp_gap_debug=1', false, undefined), false);
  assert.equal(parseDebugFlag('?tp_gap_debug=1', false, '0'), false);
  assert.equal(parseDebugFlag('?x=1', true, '1'), false);
});

test('rule 3: gap over the ceiling fails, at the ceiling passes', () => {
  const over = NOW - (OUTCOME_GAP_MAX_MINUTES * MIN + 1000);
  const v = evaluateOutcome(input({ lastSeen: over, candidate: { slug: 'a', name: 'A', type: 'detail_open', at: over - MIN } }));
  assert.deepEqual(v.failed, ['gap_above_max']);
  assert.equal(v.candidateEligible, false);

  const atMax = NOW - OUTCOME_GAP_MAX_MINUTES * MIN;
  assert.deepEqual(
    evaluateOutcome(input({ lastSeen: atMax, candidate: { slug: 'a', name: 'A', type: 'detail_open', at: atMax - MIN } })).failed,
    []
  );
});

test('rule 4: tap -> backgrounding over the window fails, at the window passes', () => {
  const lastSeen = NOW - 25 * MIN;
  const stale = evaluateOutcome(input({
    candidate: { slug: 'a', name: 'A', type: 'detail_open', at: lastSeen - (OUTCOME_CANDIDATE_WINDOW_MINUTES * MIN + 1000) },
  }));
  assert.deepEqual(stale.failed, ['candidate_stale']);
  assert.equal(stale.candidateEligible, false);

  const edge = evaluateOutcome(input({
    candidate: { slug: 'a', name: 'A', type: 'detail_open', at: lastSeen - OUTCOME_CANDIDATE_WINDOW_MINUTES * MIN },
  }));
  assert.deepEqual(edge.failed, []);
  assert.equal(edge.candidateAgeMinutes, OUTCOME_CANDIDATE_WINDOW_MINUTES);
});

test('rule 4 measures tap -> backgrounding, not tap -> now', () => {
  // Tapped 10 min before backgrounding, then away 5 h: tap -> now is 310 min, still eligible.
  const lastSeen = NOW - 300 * MIN;
  const v = evaluateOutcome(input({ lastSeen, candidate: { slug: 'a', name: 'A', type: 'detail_open', at: lastSeen - 10 * MIN } }));
  assert.deepEqual(v.failed, []);
  assert.equal(v.candidateAgeMinutes, 10);
  assert.equal(v.gapMinutes, 300);
});

test('a tap after the last heartbeat has age 0, not a negative age', () => {
  const lastSeen = NOW - 25 * MIN;
  const v = evaluateOutcome(input({ candidate: { slug: 'a', name: 'A', type: 'save', at: lastSeen + 5_000 } }));
  assert.equal(v.candidateAgeMinutes, 0);
  assert.deepEqual(v.failed, []);
});

test('rule 5: shown, dismissed, answered or checked in never re-asks; eligible-only can still show', () => {
  for (const status of ['shown', 'dismissed', 'answered', 'checked_in'] as const) {
    const v = evaluateOutcome(input({ asked: { 'kopi-bar-t3': status } }));
    assert.deepEqual(v.failed, ['already_asked'], status);
    assert.equal(v.candidateEligible, false, status);
  }
  const held = evaluateOutcome(input({ asked: { 'kopi-bar-t3': 'eligible' } }));
  assert.deepEqual(held.failed, []);
  assert.equal(held.showable, true);
  // Another venue's status doesn't block this one
  assert.deepEqual(evaluateOutcome(input({ asked: { 'other-venue': 'answered' } })).failed, []);
});

test('rule 6: the cap holds the strip back but the candidate stays eligible', () => {
  const v = evaluateOutcome(input({ shownCount: OUTCOME_MAX_PROMPTS_PER_JOURNEY }));
  assert.deepEqual(v.failed, ['cap_reached']);
  assert.equal(v.candidateEligible, true);
  assert.equal(v.showable, false);
  assert.equal(evaluateOutcome(input({ shownCount: OUTCOME_MAX_PROMPTS_PER_JOURNEY - 1 })).showable, true);
});

test('rule 7: the capture bar holds the strip back but the candidate stays eligible', () => {
  const v = evaluateOutcome(input({ captureBarShowing: true }));
  assert.deepEqual(v.failed, ['capture_bar']);
  assert.equal(v.candidateEligible, true);
  assert.equal(v.showable, false);
  assert.equal(evaluateOutcome(input({ captureBarShowing: false })).showable, true);
});

test('rule 8: no journey or a departed journey fails', () => {
  const none = evaluateOutcome(input({ journeyActive: false }));
  assert.deepEqual(none.failed, ['no_journey']);
  assert.equal(none.candidateEligible, false);
  const gone = evaluateOutcome(input({ departed: true }));
  assert.deepEqual(gone.failed, ['departed']);
  assert.equal(gone.candidateEligible, false);
  assert.equal(evaluateOutcome(input({ journeyActive: true, departed: false })).candidateEligible, true);
});

test('every failing rule is reported, in table order', () => {
  const v = evaluateOutcome(input({
    candidate: null, lastSeen: NOW - 1000, shownCount: 9, captureBarShowing: true, journeyActive: false,
  }));
  assert.deepEqual(v.failed, ['no_candidate', 'gap_below_min', 'cap_reached', 'capture_bar', 'no_journey']);
});

test('minutes are logged to 1 decimal and never negative', () => {
  assert.equal(toMinutes(25_000), 0.4);
  assert.equal(toMinutes(12 * MIN + 30_000), 12.5);
  assert.equal(toMinutes(-5_000), 0);
});

test('ledger: same journey keeps its state, a new journey starts fresh', () => {
  const stored = JSON.stringify({
    ...emptyLedger('2026-10-03T05:00:00Z'),
    asked: { a: 'answered' },
    shown_count: 2,
    gate_reached: true,
  });
  const same = ledgerFor(stored, '2026-10-03T05:00:00Z');
  assert.equal(same.asked.a, 'answered');
  assert.equal(same.shown_count, 2);
  assert.equal(same.gate_reached, true);

  const next = ledgerFor(stored, '2026-10-03T09:00:00Z');
  assert.deepEqual(next.asked, {});
  assert.equal(next.shown_count, 0);
  assert.equal(next.gate_reached, false);

  assert.deepEqual(ledgerFor('not json', 'k'), emptyLedger('k'));
  assert.deepEqual(ledgerFor(JSON.stringify({ ...emptyLedger('k'), schema_version: 99 }), 'k'), emptyLedger('k'));
});

test('candidate parsing: versioned, typed, rejects junk', () => {
  const good = JSON.stringify({ schema_version: 1, slug: 'a', name: 'A', type: 'save', at: NOW });
  assert.deepEqual(parseCandidate(good), { slug: 'a', name: 'A', type: 'save', at: NOW });
  assert.equal(parseCandidate(null), null);
  assert.equal(parseCandidate('{'), null);
  assert.equal(parseCandidate(JSON.stringify({ schema_version: 2, slug: 'a', name: 'A', type: 'save', at: NOW })), null);
  assert.equal(parseCandidate(JSON.stringify({ schema_version: 1, slug: 'a', name: 'A', type: 'collection_open', at: NOW })), null);
  assert.equal(parseCandidate(JSON.stringify({ schema_version: 1, slug: '', name: 'A', type: 'save', at: NOW })), null);
});

test('gate chip: known gate, 45 to -15 min to boarding, active, not departed, not reached', () => {
  const base = { gate: 'C22', minutesToBoarding: 40, journeyActive: true, departed: false, reached: false };
  assert.equal(gateChipVisible(base), true);
  assert.equal(gateChipVisible({ ...base, minutesToBoarding: 45 }), true);
  assert.equal(gateChipVisible({ ...base, minutesToBoarding: -15 }), true);
  assert.equal(gateChipVisible({ ...base, minutesToBoarding: 46 }), false);
  assert.equal(gateChipVisible({ ...base, minutesToBoarding: -16 }), false);
  assert.equal(gateChipVisible({ ...base, minutesToBoarding: null }), false);
  assert.equal(gateChipVisible({ ...base, gate: null }), false);
  assert.equal(gateChipVisible({ ...base, gate: '' }), false);
  assert.equal(gateChipVisible({ ...base, journeyActive: false }), false);
  assert.equal(gateChipVisible({ ...base, departed: true }), false);
  assert.equal(gateChipVisible({ ...base, reached: true }), false);
});

test('gate codes are normalised; junk is not a gate', () => {
  assert.equal(normalizeGate('c22'), 'C22');
  assert.equal(normalizeGate(' C 22 '), 'C22');
  assert.equal(normalizeGate('—'), null);
  assert.equal(normalizeGate('-'), null);
  assert.equal(normalizeGate('<script>'), null);
  assert.equal(normalizeGate(undefined), null);
});
