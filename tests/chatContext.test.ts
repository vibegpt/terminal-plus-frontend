// What the concierge is told about the trip. Run: npx tsx --test tests/chatContext.test.ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { journeyToChatContext } from '../src/hooks/useChat';
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
