// CC-27A Part E: which outlet of a brand a list keeps, and what it reports as
// the brand's other outlets. Pure functions, no I/O.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { smart7Select } from '../src/utils/smart7Select';
import { brandKeyFor, brandNameStem, compareOutlets } from '../shared/ranking/policy';

const NOON = 720;
const row = (o: Partial<Record<string, unknown>> & { slug: string; t: string }) => ({
  id: Math.floor(Math.random() * 1e6),
  amenity_slug: o.slug,
  name: (o.name as string) ?? 'Guardian Health & Beauty',
  terminal_code: o.t,
  opening_hours: (o.hours as string) ?? '24/7',
  is_landside: (o.landside as boolean) ?? false,
  editorial_score: (o.score as number) ?? 12,
  brand_family: (o.bf as string) ?? 'guardian',
  zone: (o.zone as string) ?? null,
});

test('name stem drops the outlet suffix', () => {
  assert.equal(brandNameStem('WH Smith - Level 2 Shop 43'), 'whsmith');
  assert.equal(brandNameStem('WHSmith'), 'whsmith');
  assert.equal(brandNameStem('WH Smith - Before Security Level 1 Shop 84'), 'whsmith');
  assert.equal(brandNameStem("Tod's"), 'tods');
});

test('brand key: shared brand_family, else the name stem (per-row brand_family values merge by name)', () => {
  const pool = [
    row({ slug: 'g1', t: 'SIN-T1' }), row({ slug: 'g2', t: 'SIN-T2' }),
    row({ slug: 's1', t: 'SIN-T1', name: 'Starbucks', bf: 'starbucks-sint1' }),
    row({ slug: 's2', t: 'SIN-T3', name: 'Starbucks', bf: 'starbucks-sint3' }),
  ];
  const key = brandKeyFor(pool);
  assert.equal(key(pool[0]), key(pool[1]));
  assert.equal(key(pool[2]), key(pool[3]));
  assert.notEqual(key(pool[0]), key(pool[2]));
});

test('outlet order: passenger terminal > side > score; a higher score elsewhere never wins', () => {
  const here = { terminal_code: 'SIN-T2', is_landside: false, editorial_score: 10 };
  const there = { terminal_code: 'SIN-T3', is_landside: false, editorial_score: 14 };
  assert.ok(compareOutlets(here, there, 'SIN-T2', false) < 0, 'own terminal beats a higher score in another');
  const airside = { terminal_code: 'SIN-T2', is_landside: false, editorial_score: 10 };
  const landside = { terminal_code: 'SIN-T2', is_landside: true, editorial_score: 14 };
  assert.ok(compareOutlets(airside, landside, 'SIN-T2', false) < 0, 'airside passenger: airside outlet first');
  assert.ok(compareOutlets(landside, airside, 'SIN-T2', true) < 0, 'landed passenger: landside outlet first');
  assert.equal(compareOutlets(here, { ...here }, 'SIN-T2', false), 0, 'full tie: 0, so pool order stays');
});

test('open now beats the passenger terminal; the kept row lists only reachable, open outlets', () => {
  const pool = [
    row({ slug: 'g-t2-closed', t: 'SIN-T2', hours: '13:00-14:00', score: 14 }),
    row({ slug: 'g-t3-open', t: 'SIN-T3', zone: 'Level 2, #02-66 (airside)' }),
    row({ slug: 'g-t2-landside', t: 'SIN-T2', landside: true, zone: 'Level 2, #02-13 (before immigration)' }),
    row({ slug: 'g-t1-open', t: 'SIN-T1', zone: 'Level 2, #02-16 (airside)' }),
  ];
  // Connecting with 60 minutes: landside hidden. Noon: the T2 airside outlet is closed.
  const picked = smart7Select(pool as never, 'SIN-T2', 7, { journeyType: 'connecting', minutesToBoarding: 60, nowSgt: NOON });
  assert.equal(picked.length, 1, 'Guardian appears once');
  assert.equal(picked[0].amenity_slug, 'g-t3-open', 'open outlet, then stable pool order (T3 before T1)');
  assert.deepEqual(
    picked[0].other_outlets.map(o => o.terminal_code),
    ['SIN-T1'],
    'other outlets: open and reachable only (the closed T2 and the hidden landside T2 are out)',
  );
});
