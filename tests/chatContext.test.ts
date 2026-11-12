// What the concierge is told about the trip. Run: npx tsx --test tests/chatContext.test.ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chatContextForSend, journeyToChatContext } from '../src/hooks/useChat';
import type { JourneyData } from '../src/context/JourneyContext';

const NOW = Date.parse('2026-09-28T03:20:00Z'); // 11:20 SGT

const QF1: JourneyData = {
  currentTerminal: 'SIN-T1',
  arrivingFlight: 'QF1',
  departingFlight: 'QF1',
  departureTerminal: 'SIN-T1',
  boardingTime: '2026-09-28T14:45:00.000Z', // 22:45 SGT
  walkMinutes: 0,
  usableWindowMinutes: 685,
  jewelViable: true,
  capturedAt: '2026-09-28T03:17:00.000Z',
  gate: null,
  destination: 'LHR',
  scheduledDeparture: '2026-09-28 15:20Z',
};

test('a captured flight reaches the chat with minutes to boarding', () => {
  const ctx = journeyToChatContext(QF1, NOW);
  assert.equal(ctx.terminal, 'SIN-T1');
  assert.equal(ctx.isTransit, true);
  assert.equal(ctx.availableMinutes, 685);
  assert.deepEqual(ctx.flight, {
    number: 'QF1',
    destination: 'LHR',
    departureTerminal: 'SIN-T1',
    boardingTime: '2026-09-28T14:45:00.000Z',
  });
  assert.equal('gate' in ctx, false);
});

test('a skipped capture sends the terminal only, never the placeholder flight', () => {
  for (const placeholder of ['SQ000', 'UNKNOWN']) {
    const ctx = journeyToChatContext({ ...QF1, arrivingFlight: undefined, departingFlight: placeholder }, NOW);
    assert.deepEqual(ctx, { terminal: 'SIN-T1' });
  }
});

test('boarding already passed: flight kept, no minutes', () => {
  const ctx = journeyToChatContext(QF1, Date.parse('2026-09-28T15:00:00Z'));
  assert.equal(ctx.availableMinutes, undefined);
  assert.equal(ctx.flight?.number, 'QF1');
});

test('no journey, no context', () => {
  assert.deepEqual(journeyToChatContext(null, NOW), {});
});

test('the passenger type reaches the chat; skipped and pre-v4 records stay unknown', () => {
  assert.equal(journeyToChatContext({ ...QF1, journey_type: 'connecting' }, NOW).journeyType, 'connecting');
  assert.equal(journeyToChatContext({ ...QF1, journey_type: 'just_landed' }, NOW).journeyType, 'just_landed');
  assert.equal(journeyToChatContext({ ...QF1, journey_type: 'skipped' }, NOW).journeyType, undefined);
  assert.equal(journeyToChatContext(QF1, NOW).journeyType, undefined); // v3 record: no journey_type
});

test('only a connecting passenger is in transit; just landed is landside', () => {
  assert.equal(journeyToChatContext({ ...QF1, journey_type: 'connecting' }, NOW).isTransit, true);
  assert.equal(journeyToChatContext({ ...QF1, journey_type: 'just_landed' }, NOW).isTransit, undefined);
  assert.equal(journeyToChatContext({ ...QF1, journey_type: 'departing', arrivingFlight: undefined }, NOW).isTransit, undefined);
  assert.equal(journeyToChatContext(QF1, NOW).isTransit, true); // v3 record with an inbound flight: unchanged
});

// CC-29 D2: chat keeps a stated boarding deadline, never a minute count.
const T0 = Date.parse('2026-11-12T05:00:00Z');
const MIN = 60_000;

test('a 120-minute deadline set at t0 sends 90 at t0 + 30 min', () => {
  const deadline = T0 + 120 * MIN;
  assert.equal(chatContextForSend(null, {}, deadline, T0).availableMinutes, 120);
  assert.equal(chatContextForSend(null, {}, deadline, T0 + 30 * MIN).availableMinutes, 90);
});

test('a live deadline beats the journey\'s minutes', () => {
  const ctx = chatContextForSend(QF1, {}, NOW + 45 * MIN, NOW);
  assert.equal(ctx.availableMinutes, 45); // not the journey's 685
  assert.equal(ctx.flight?.number, 'QF1'); // the rest of the baseline stays
});

test('a passed deadline falls back to the journey\'s minutes', () => {
  assert.equal(chatContextForSend(QF1, {}, NOW - MIN, NOW).availableMinutes, 685);
  assert.equal(chatContextForSend(QF1, {}, null, NOW).availableMinutes, 685);
});

test('a stored minute count in the chat context is never sent', () => {
  assert.equal(chatContextForSend(null, { availableMinutes: 5 }, null, NOW).availableMinutes, undefined);
  assert.equal(chatContextForSend(QF1, { availableMinutes: 5 }, null, NOW).availableMinutes, 685);
});

test('other chat context still beats the baseline', () => {
  assert.equal(chatContextForSend(QF1, { terminal: 'SIN-T2', gate: 'B5' }, null, NOW).terminal, 'SIN-T2');
});
