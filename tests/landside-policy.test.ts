// Landside and open-now policy (CC-17). Run: npx tsx --test tests/landside-policy.test.ts
// Every row of the RULE table, both thresholds on each side, missing minutes,
// each opening-hours shape in the catalogue, the fill order, and (with
// Supabase env) the 127 approved landside slugs against the live table.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import {
  LANDSIDE_MIN_MINUTES,
  OPENS_SOON_MINUTES,
  countEligible,
  eligibility,
  hoursLabel,
  landsideAccess,
  openNow,
  parseOpeningHours,
  pickEligible,
  type EligibilityContext,
} from '../shared/ranking/policy';
import { LANDSIDE_COPY } from '../shared/ranking/landsideCopy';

const DEP = LANDSIDE_MIN_MINUTES.departing;
const CONN = LANDSIDE_MIN_MINUTES.connecting;

const L = {
  departing: 'Before immigration',
  connecting: 'Landside: clear immigration both ways (visa rules apply)',
  unknown: 'Landside: outside immigration',
};
const R = {
  connecting: "This is landside. A connection under 3 hours doesn't leave time to clear immigration both ways.",
  departing: "This is landside. With under 90 minutes to boarding, it's time to go through immigration.",
};

test('the numbers and the copy are the ones Todd set', () => {
  assert.equal(DEP, 90);
  assert.equal(CONN, 180);
  assert.equal(OPENS_SOON_MINUTES, 60);
  assert.deepEqual(LANDSIDE_COPY.label, L);
  assert.equal(LANDSIDE_COPY.reason.connecting(CONN), R.connecting);
  assert.equal(LANDSIDE_COPY.reason.departing(DEP), R.departing);
});

test('airside venues always show, unlabelled, for every passenger', () => {
  for (const journeyType of ['departing', 'connecting', 'just_landed', 'skipped', null]) {
    for (const minutesToBoarding of [null, 0, 30, 500]) {
      assert.deepEqual(
        landsideAccess({ isLandside: false, journeyType, minutesToBoarding }),
        { show: true, label: null, reason: null },
      );
    }
  }
});

test('just_landed: landside always, no label', () => {
  for (const minutesToBoarding of [null, 0, 10, 500]) {
    assert.deepEqual(
      landsideAccess({ isLandside: true, journeyType: 'just_landed', minutesToBoarding }),
      { show: true, label: null, reason: null },
    );
  }
});

test('departing: landside only from 90 min, labelled "Before immigration"', () => {
  assert.deepEqual(landsideAccess({ isLandside: true, journeyType: 'departing', minutesToBoarding: DEP - 1 }),
    { show: false, label: L.departing, reason: R.departing });
  assert.deepEqual(landsideAccess({ isLandside: true, journeyType: 'departing', minutesToBoarding: DEP }),
    { show: true, label: L.departing, reason: null });
  assert.equal(landsideAccess({ isLandside: true, journeyType: 'departing', minutesToBoarding: 0 }).show, false);
  assert.equal(landsideAccess({ isLandside: true, journeyType: 'departing', minutesToBoarding: 400 }).show, true);
});

test('connecting: landside only from 180 min, labelled "clear immigration both ways"', () => {
  assert.deepEqual(landsideAccess({ isLandside: true, journeyType: 'connecting', minutesToBoarding: CONN - 1 }),
    { show: false, label: L.connecting, reason: R.connecting });
  assert.deepEqual(landsideAccess({ isLandside: true, journeyType: 'connecting', minutesToBoarding: CONN }),
    { show: true, label: L.connecting, reason: null });
  assert.equal(landsideAccess({ isLandside: true, journeyType: 'connecting', minutesToBoarding: 170 }).show, false);
});

test('skipped or null with minutes: as connecting', () => {
  for (const journeyType of ['skipped', null, undefined, 'something-else']) {
    assert.deepEqual(landsideAccess({ isLandside: true, journeyType, minutesToBoarding: CONN - 1 }),
      { show: false, label: L.connecting, reason: R.connecting });
    assert.deepEqual(landsideAccess({ isLandside: true, journeyType, minutesToBoarding: CONN }),
      { show: true, label: L.connecting, reason: null });
  }
  // MCP's 170 and 200 (no passenger type)
  assert.equal(landsideAccess({ isLandside: true, journeyType: null, minutesToBoarding: 170 }).show, false);
  assert.equal(landsideAccess({ isLandside: true, journeyType: null, minutesToBoarding: 200 }).show, true);
});

test('skipped or null with no minutes: always, labelled "outside immigration"', () => {
  for (const journeyType of ['skipped', null]) {
    for (const minutesToBoarding of [null, undefined, NaN]) {
      assert.deepEqual(landsideAccess({ isLandside: true, journeyType, minutesToBoarding }),
        { show: true, label: L.unknown, reason: null });
    }
  }
});

test('departing or connecting with no minutes: hidden, with the add-your-flight reason', () => {
  for (const journeyType of ['departing', 'connecting']) {
    const a = landsideAccess({ isLandside: true, journeyType, minutesToBoarding: null });
    assert.equal(a.show, false);
    assert.equal(a.reason, LANDSIDE_COPY.reason.noTime);
  }
});

// ── Opening hours ──

const at = (h: number, m = 0) => h * 60 + m;

test('every opening_hours shape in the catalogue parses as expected', () => {
  assert.deepEqual(parseOpeningHours('24/7'), { kind: '24h' });
  assert.deepEqual(parseOpeningHours('{"Monday-Sunday": "24/7"}'), { kind: '24h' });
  assert.deepEqual(parseOpeningHours('06:00-23:00'), { kind: 'range', open: 360, close: 1380 });
  assert.deepEqual(parseOpeningHours('{"Monday-Sunday": "06:00-01:00"}'), { kind: 'range', open: 360, close: 60 });
  assert.equal(parseOpeningHours('Mon-Fri 11:00-20:00, Sat-Sun 10:00-20:00').kind, 'unknown');
  assert.equal(parseOpeningHours('{"Mon-Fri": "11:00-20:00", "Sat-Sun": "10:00-20:00"}').kind, 'unknown');
  assert.equal(parseOpeningHours('').kind, 'unknown');
  assert.equal(parseOpeningHours(null).kind, 'unknown');
  assert.equal(parseOpeningHours('call ahead').kind, 'unknown');
});

test('24-hour venues are always open', () => {
  for (const now of [0, at(0, 30), at(12), 1439]) {
    const o = openNow({ openingHours: '24/7', nowSgt: now });
    assert.equal(o.state, 'open');
    assert.equal(hoursLabel(o, '24/7'), 'Open 24 hours');
  }
});

test('a daytime range: open inside, closed outside, with the next opening time', () => {
  const h = '10:00-22:00';
  assert.equal(openNow({ openingHours: h, nowSgt: at(9, 59) }).state, 'closed');
  assert.equal(openNow({ openingHours: h, nowSgt: at(10) }).state, 'open');
  assert.equal(openNow({ openingHours: h, nowSgt: at(21, 59) }).state, 'open');
  const closed = openNow({ openingHours: h, nowSgt: at(22) });
  assert.equal(closed.state, 'closed');
  assert.equal(closed.opensAt, '10:00');
  assert.equal(closed.minutesUntilOpen, 12 * 60);
  assert.equal(hoursLabel(closed, h), 'Closed · Opens 10:00');
  assert.equal(hoursLabel(openNow({ openingHours: h, nowSgt: at(12) }), h), 'Open until 22:00');
});

test('ranges past midnight: open on both sides of midnight, closed between', () => {
  const h = '06:00-01:00';
  assert.equal(openNow({ openingHours: h, nowSgt: at(23, 30) }).state, 'open');
  assert.equal(openNow({ openingHours: h, nowSgt: at(0, 30) }).state, 'open');
  const c = openNow({ openingHours: h, nowSgt: at(1, 0) });
  assert.equal(c.state, 'closed');
  assert.equal(c.minutesUntilOpen, 5 * 60);
  // Closing at midnight
  assert.equal(openNow({ openingHours: '06:00-00:00', nowSgt: at(23, 59) }).state, 'open');
  assert.equal(openNow({ openingHours: '06:00-00:00', nowSgt: at(0, 30) }).state, 'closed');
  assert.equal(openNow({ openingHours: '07:00-01:25', nowSgt: at(1, 24) }).state, 'open');
});

test('unreadable hours are unknown: never open, never closed, shown as written', () => {
  const h = 'Mon-Fri 11:00-20:00, Sat-Sun 10:00-20:00';
  const o = openNow({ openingHours: h, nowSgt: at(3) });
  assert.equal(o.state, 'unknown');
  assert.equal(hoursLabel(o, h), h);
});

// ── Lists ──

type Row = { name: string; is_landside: boolean; opening_hours: string; score: number };
const row = (name: string, opening_hours: string, score: number, is_landside = false): Row =>
  ({ name, opening_hours, score, is_landside });
const byScore = (rows: Row[], n: number) => [...rows].sort((a, b) => b.score - a.score).slice(0, n);
const ctx = (over: Partial<EligibilityContext> = {}): EligibilityContext =>
  ({ journeyType: null, minutesToBoarding: null, nowSgt: at(0, 30), ...over });

test('closed venues are not suggested; open fill first, then unknown, then opening within 60 min', () => {
  const rows = [
    row('Closed all night', '10:00-22:00', 14),
    row('Opens 01:15', '01:15-23:00', 13),   // 45 min away at 00:30
    row('Unknown hours', 'Mon-Fri 11:00-20:00, Sat-Sun 10:00-20:00', 12),
    row('Open late', '06:00-01:00', 11),
    row('Always', '24/7', 10),
  ];
  const picked = pickEligible(rows, ctx(), 7, byScore);
  assert.deepEqual(picked.map(r => r.name), ['Open late', 'Always', 'Unknown hours', 'Opens 01:15']);
  assert.deepEqual(picked.map(r => r.opens_label), [null, null, null, 'Opens 01:15']);
  assert.deepEqual(picked.map(r => r.open_state), ['open', 'open', 'unknown', 'closed']);
  // A list the open venues can fill takes nothing else
  assert.deepEqual(pickEligible(rows, ctx(), 2, byScore).map(r => r.name), ['Open late', 'Always']);
});

test('landside rows are dropped before the surface dedupes, so an airside namesake survives', () => {
  const rows = [
    row('Din Tai Fung', '24/7', 14, true),   // Jewel
    row('Din Tai Fung', '24/7', 12, false),  // airside
  ];
  const dedupe = (rs: Row[], n: number) => {
    const best = new Map<string, Row>();
    for (const r of rs) if (!best.has(r.name) || r.score > best.get(r.name)!.score) best.set(r.name, r);
    return byScore([...best.values()], n);
  };
  const conn = pickEligible(rows, ctx({ journeyType: 'connecting', minutesToBoarding: 170 }), 7, dedupe);
  assert.deepEqual(conn.map(r => [r.score, r.access_label]), [[12, null]]);
  const landed = pickEligible(rows, ctx({ journeyType: 'just_landed', minutesToBoarding: 170 }), 7, dedupe);
  assert.deepEqual(landed.map(r => [r.score, r.access_label]), [[14, null]]);
  const dep = pickEligible(rows, ctx({ journeyType: 'departing', minutesToBoarding: 95 }), 7, dedupe);
  assert.deepEqual(dep.map(r => [r.score, r.access_label]), [[14, L.departing]]);
});

test('a name picked in one tier is not picked again in a later one', () => {
  const rows = [row('Starbucks', '24/7', 10), row('Starbucks', '01:00-23:00', 14)];
  assert.deepEqual(pickEligible(rows, ctx(), 7, byScore).map(r => r.score), [10]);
});

test('countEligible counts distinct names a list could show now', () => {
  const rows = [
    row('A', '24/7', 1), row('A', '24/7', 2), row('B', '10:00-22:00', 3),
    row('C', '24/7', 4, true), row('D', '01:00-23:00', 5),
  ];
  assert.equal(countEligible(rows, ctx()), 3); // A, C (no minutes → shown), D (opens in 30)
  assert.equal(countEligible(rows, ctx({ journeyType: 'connecting', minutesToBoarding: 170 })), 2);
});

test('eligibility explains each row', () => {
  const e = eligibility({ is_landside: true, opening_hours: '10:00-22:00' },
    ctx({ journeyType: 'departing', minutesToBoarding: 80 }));
  assert.equal(e.tier, null);
  assert.equal(e.access.reason, R.departing);
  assert.equal(e.open.state, 'closed');
});

// ── The approved list, live (skips without Supabase env) ──

function env(): { url?: string; key?: string } {
  try {
    for (const line of readFileSync(resolve(process.cwd(), '.env.local'), 'utf-8').split('\n')) {
      const m = line.trim().match(/^([A-Z0-9_]+)=(.*)$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
    }
  } catch { /* no .env.local */ }
  return {
    url: process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
    key: process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY,
  };
}

test('the live table flags exactly the 127 approved slugs', { timeout: 30_000 }, async (t) => {
  const { url, key } = env();
  if (!url || !key) { t.skip('no Supabase env'); return; }
  const { createClient } = await import('@supabase/supabase-js');
  const approved = readFileSync(resolve(process.cwd(), 'supabase/migrations/20261006015308_amenity_is_landside.sql'), 'utf-8')
    .split('\n').map(l => l.match(/^\s+\('([^']+)'\),?$/)?.[1]).filter((s): s is string => !!s);
  assert.equal(approved.length, 127);
  const { data, error } = await createClient(url, key)
    .from('amenity_detail').select('amenity_slug').eq('is_landside', true);
  assert.equal(error, null);
  assert.deepEqual((data ?? []).map(r => r.amenity_slug).sort(), [...approved].sort());
});
