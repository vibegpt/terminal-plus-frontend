// Leg selection for /api/flight-status. Run: npx tsx --test tests/flight-status.test.ts
// Fixtures follow the AeroDataBox /flights/number shape. Real case, 26 Sep 2026 15:25 SGT:
// production returned last night's QF1 and SQ322 departures (status "Arrived").
import { test, before } from 'node:test';
import assert from 'node:assert/strict';

// The route reads its API key at load time, so set it before importing.
let mod: typeof import('../api/flight-status');
before(async () => {
  process.env.AERODATABOX_API_KEY = 'test-key';
  mod = await import('../api/flight-status');
});

type Side = { iata: string; utc: string; local: string; terminal?: string; gate?: string };
const leg = (dep: Side, arr: Side, status = 'Expected') => ({
  number: 'XX 1',
  status,
  airline: { name: 'Test Air' },
  departure: {
    airport: { iata: dep.iata },
    scheduledTime: { utc: dep.utc, local: dep.local },
    terminal: dep.terminal,
    gate: dep.gate,
  },
  arrival: {
    airport: { iata: arr.iata },
    scheduledTime: { utc: arr.utc, local: arr.local },
    terminal: arr.terminal,
  },
});

// QF1 SYD-SIN-LHR, as returned for 2026-09-26: yesterday's SIN-LHR leg comes first.
const QF1 = [
  leg(
    { iata: 'SIN', utc: '2026-09-25 15:20Z', local: '2026-09-25 23:20+08:00', terminal: '1', gate: 'D49' },
    { iata: 'LHR', utc: '2026-09-26 05:40Z', local: '2026-09-26 06:40+01:00' },
    'Arrived'
  ),
  leg(
    { iata: 'SYD', utc: '2026-09-26 05:40Z', local: '2026-09-26 15:40+10:00' },
    { iata: 'SIN', utc: '2026-09-26 13:30Z', local: '2026-09-26 21:30+08:00', terminal: '1' }
  ),
  leg(
    { iata: 'SIN', utc: '2026-09-26 15:20Z', local: '2026-09-26 23:20+08:00', terminal: '1' },
    { iata: 'LHR', utc: '2026-09-27 05:40Z', local: '2026-09-27 06:40+01:00' }
  ),
];

// SQ322 SIN-LHR, same pattern.
const SQ322 = [
  leg(
    { iata: 'SIN', utc: '2026-09-25 15:00Z', local: '2026-09-25 23:00+08:00', terminal: '3', gate: 'A2' },
    { iata: 'LHR', utc: '2026-09-26 05:20Z', local: '2026-09-26 06:20+01:00' },
    'Arrived'
  ),
  leg(
    { iata: 'SIN', utc: '2026-09-26 15:00Z', local: '2026-09-26 23:00+08:00', terminal: '3' },
    { iata: 'LHR', utc: '2026-09-27 05:20Z', local: '2026-09-27 06:20+01:00' }
  ),
];

// A 00:35 SGT departure. Asked for "today" (26th) at 23:00 SGT, today's leg left 22.5h ago.
const LATE = {
  '2026-09-26': [
    leg(
      { iata: 'SIN', utc: '2026-09-25 16:35Z', local: '2026-09-26 00:35+08:00', terminal: '3' },
      { iata: 'SYD', utc: '2026-09-26 00:35Z', local: '2026-09-26 10:35+10:00' },
      'Arrived'
    ),
  ],
  '2026-09-27': [
    leg(
      { iata: 'SIN', utc: '2026-09-26 16:35Z', local: '2026-09-27 00:35+08:00', terminal: '3' },
      { iata: 'SYD', utc: '2026-09-27 00:35Z', local: '2026-09-27 10:35+10:00' }
    ),
  ],
} as Record<string, unknown[]>;

test('sgtDate gives the Singapore calendar date', () => {
  assert.equal(mod.sgtDate(Date.parse('2026-09-25T16:30:00Z')), '2026-09-26');
  assert.equal(mod.sgtDate(Date.parse('2026-09-26T15:59:00Z')), '2026-09-26');
  assert.equal(mod.sgtDate(Date.parse('2026-09-26T16:00:00Z')), '2026-09-27');
});

test("QF1: today's SIN departure, never last night's", () => {
  const pick = mod.selectSinLeg(QF1, { date: '2026-09-26' });
  assert.equal(pick?.leg, 'departure');
  assert.equal(pick?.flight.departure.scheduledTime.utc, '2026-09-26 15:20Z');
});

test('QF1 with leg=arrival: the SYD-SIN leg landing today', () => {
  const pick = mod.selectSinLeg(QF1, { date: '2026-09-26', leg: 'arrival' });
  assert.equal(pick?.leg, 'arrival');
  assert.equal(pick?.flight.departure.airport.iata, 'SYD');
});

test("SQ322: today's departure", () => {
  const pick = mod.selectSinLeg(SQ322, { date: '2026-09-26' });
  assert.equal(pick?.flight.departure.scheduledTime.utc, '2026-09-26 15:00Z');
});

test('a future date returns that date', () => {
  const pick = mod.selectSinLeg(SQ322, { date: '2026-09-25' });
  assert.equal(pick?.flight.departure.scheduledTime.utc, '2026-09-25 15:00Z');
});

test('no SIN leg on the date returns null', () => {
  assert.equal(mod.selectSinLeg(SQ322, { date: '2026-09-28' }), null);
});

// ── Handler: fetch and clock mocked ──────────────────────────────────────
function mockRes() {
  const out: { status: number; body: any } = { status: 200, body: undefined };
  const res: any = {
    setHeader: () => res,
    status: (code: number) => { out.status = code; return res; },
    json: (body: unknown) => { out.body = body; return res; },
  };
  return { res, out };
}

async function call(number: string, nowIso: string, byDate: Record<string, unknown[]>) {
  const calls: string[] = [];
  const realFetch = globalThis.fetch;
  const realNow = Date.now;
  Date.now = () => Date.parse(nowIso);
  globalThis.fetch = (async (url: string) => {
    calls.push(url);
    const date = url.split('/').pop() as string;
    const flights = byDate[date];
    return flights
      ? { status: 200, ok: true, json: async () => flights }
      : { status: 204, ok: true, json: async () => { throw new Error('no body'); } };
  }) as any;
  try {
    const { res, out } = mockRes();
    await mod.default({ query: { number } } as any, res);
    return { ...out, calls };
  } finally {
    globalThis.fetch = realFetch;
    Date.now = realNow;
  }
}

test('handler, SQ322 at 15:25 SGT: tonight 23:00, boarding 22:25, one upstream call', async () => {
  const r = await call('SQ322', '2026-09-26T07:25:00Z', { '2026-09-26': SQ322 });
  assert.equal(r.status, 200);
  assert.equal(r.body.scheduledTime, '2026-09-26 15:00Z');
  assert.equal(r.body.estimatedBoardingTime, '2026-09-26T14:25:00.000Z');
  assert.equal(r.body.date, '2026-09-26');
  assert.equal(r.body.leg, 'departure');
  assert.equal(r.calls.length, 1);
});

test("handler, 00:35 flight asked at 23:00 SGT: rolls to tomorrow's departure", async () => {
  const r = await call('SQ231', '2026-09-26T15:00:00Z', LATE);
  assert.equal(r.status, 200);
  assert.equal(r.body.scheduledTime, '2026-09-26 16:35Z');
  assert.equal(r.body.date, '2026-09-27');
  assert.equal(r.calls.length, 2);
});

test('handler, no flights at all: 404 instead of a 500', async () => {
  const r = await call('SQ999', '2026-09-26T07:25:00Z', {});
  assert.equal(r.status, 404);
  assert.equal(r.body.error, 'Flight not found');
});
