// tests/adversarial/adversarial.test.ts
// Adversarial suite — deterministic query-layer tests against live Supabase.
// Reconstruction of the (never-committed) 2026-04-04 suite, rebuilt at the
// query layer per spec: real reads, zero writes, zero mocks.
//
// Run: npm run test:adversarial
// Uses the anon key (see helpers.ts) — same privileges as the shipped UI.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { queryAmenities, queryRouteMatch } from '../../api/lib/agent';
import { smart7Select } from '../../src/utils/smart7Select';
import { getAnonClient, ctx, isNonIncreasing } from './helpers';

const supabase = getAnonClient();
const T = { timeout: 30_000 };

// 1. Out-of-scope airport codes → never fabricated/foreign amenities
test('1. out-of-scope airport (SYD, LHR) yields only SIN amenities, never fabricated', T, async () => {
  for (const terminal of ['SYD-T1', 'LHR-T2']) {
    const rows = await queryAmenities(supabase, ctx({ terminal }));
    assert.ok(Array.isArray(rows), `expected array for terminal=${terminal}`);
    for (const r of rows) {
      assert.ok(
        r.terminal_code.startsWith('SIN-'),
        `non-SIN amenity leaked for terminal=${terminal}: ${r.amenity_slug} (${r.terminal_code})`,
      );
    }
  }
});

// 2. Invalid terminal code → graceful empty, no throw
test('2. invalid terminal SIN-T9 handled gracefully', T, async () => {
  const rows = await queryAmenities(supabase, ctx({ terminal: 'SIN-T9' }));
  assert.ok(Array.isArray(rows));
  for (const r of rows) {
    assert.ok(r.terminal_code.startsWith('SIN-'));
    assert.notEqual(r.terminal_code, 'SIN-T9', 'no amenity may claim the nonexistent terminal');
  }

  const route = await queryRouteMatch(supabase, 'SIN-T9', 90);
  if (route !== null) {
    // If a route comes back it must be a well-formed RouteMatch, not garbage
    assert.equal(typeof route.templateName, 'string');
    assert.ok(Array.isArray(route.stops));
  } else {
    assert.equal(route, null);
  }
});

// 3. Empty/null vibe → sensible default (unfiltered pool), no crash
test('3. empty and null vibe return a sane default pool', T, async () => {
  for (const selectedVibe of [null, '']) {
    const rows = await queryAmenities(supabase, ctx({ selectedVibe }));
    assert.ok(Array.isArray(rows));
    assert.ok(rows.length >= 1, `expected non-empty default pool for vibe=${JSON.stringify(selectedVibe)}`);
    assert.ok(rows.length <= 21, `pool must be capped at 21, got ${rows.length}`);
    for (const r of rows) {
      assert.equal(typeof r.amenity_slug, 'string');
      assert.equal(typeof r.name, 'string');
      assert.equal(typeof r.terminal_code, 'string');
    }
  }
});

// 4. Nonsense vibe → no crash, no random results
test('4. nonsense vibe "asdfgh" returns empty, not random results', T, async () => {
  const rows = await queryAmenities(supabase, ctx({ selectedVibe: 'asdfgh' }));
  assert.ok(Array.isArray(rows));
  assert.equal(rows.length, 0, `expected [] for nonsense vibe, got ${rows.length} rows`);
});

// 5. SQL-injection-shaped input → sanitized, table intact, no raw PG error leak
test('5. SQL-injection-shaped vibe strings are neutralized', T, async () => {
  const payloads = [
    `'; drop table amenity_detail;--`,
    `%' or '1'='1`,
    `") OR 1=1--`,
  ];
  for (const selectedVibe of payloads) {
    let rows: unknown;
    try {
      rows = await queryAmenities(supabase, ctx({ selectedVibe }));
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      // A thrown error must not leak raw Postgres internals
      assert.ok(!/syntax error|pg_|relation .* does not exist/i.test(msg), `raw PG error leaked: ${msg}`);
      rows = [];
    }
    assert.ok(Array.isArray(rows), 'result must be an array');
  }
  // Prove the table survived
  const { count, error } = await supabase
    .from('amenity_detail')
    .select('id', { count: 'exact', head: true });
  assert.equal(error, null);
  assert.ok((count ?? 0) > 100, `amenity_detail intact (got count=${count})`);
});

// 6. Extremely long input → bounded handling, no hang (test timeout guards)
test('6. 10k-char vibe string handled within bounds', T, async () => {
  const long = 'x'.repeat(10_000);
  const rows = await queryAmenities(supabase, ctx({ selectedVibe: long }));
  assert.ok(Array.isArray(rows));
  assert.ok(rows.length <= 21, `bounded output required, got ${rows.length}`);
});

// 7. minutes_to_boarding 0 / negative → no crash, sane output
test('7. zero and negative time budgets produce sane route/selection output', T, async () => {
  for (const minutes of [0, -30]) {
    const route = await queryRouteMatch(supabase, 'SIN-T1', minutes);
    if (route !== null) {
      assert.ok(
        route.estimatedMinutes <= Math.max(minutes, 0),
        `route recommended that cannot fit the budget: est=${route.estimatedMinutes} budget=${minutes}`,
      );
    } else {
      assert.equal(route, null);
    }
  }
  // UI selection layer with a real pool must also stay sane regardless of time context
  const pool = await queryAmenities(supabase, ctx({ terminal: 'SIN-T1', selectedVibe: 'Refuel' }));
  const picked = smart7Select(pool, 'SIN-T1', 7);
  assert.ok(Array.isArray(picked));
  assert.ok(picked.length <= 7);
});

// 8. editorial_score DESC parity (regression guard for commit 899654e)
test('8. ranking is ordered editorial_score DESC on both agent and UI layers', T, async () => {
  const rows = await queryAmenities(supabase, ctx({ terminal: 'SIN-T1', selectedVibe: 'Refuel' }));
  assert.ok(rows.length >= 3, `need a real pool to assert ordering, got ${rows.length}`);

  // agent layer: editorial_score DESC, stable-sorted with user's terminal first.
  // So the result is [terminal-match block][rest], each block non-increasing.
  const firstNonMatch = rows.findIndex(r => r.terminal_code !== 'SIN-T1');
  const matchBlock = firstNonMatch === -1 ? rows : rows.slice(0, firstNonMatch);
  const restBlock = firstNonMatch === -1 ? [] : rows.slice(firstNonMatch);
  for (const r of restBlock) {
    assert.notEqual(r.terminal_code, 'SIN-T1', 'terminal-match rows must all precede the rest');
  }
  assert.ok(isNonIncreasing(matchBlock.map(r => r.editorial_score)), 'terminal block not editorial_score DESC');
  assert.ok(isNonIncreasing(restBlock.map(r => r.editorial_score)), 'remainder block not editorial_score DESC');

  // UI layer: smart7Select must emit editorial_score non-increasing (primary key)
  const picked = smart7Select(rows, 'SIN-T1', 7);
  assert.ok(picked.length >= 3);
  assert.ok(
    isNonIncreasing(picked.map(p => p.editorial_score ?? 0)),
    `smart7Select output not editorial_score DESC: ${picked.map(p => p.editorial_score).join(',')}`,
  );
});

// 9. Requested count > pool size → available results only, no padding, no dupes
test('9. requesting 7 from a smaller pool returns available without padding or duplicates', T, async () => {
  const { data, error } = await supabase
    .from('amenity_detail')
    .select('id, amenity_slug, name, terminal_code, opening_hours, price_level, vibe_tags, editorial_score')
    .eq('airport_code', 'SIN')
    .eq('terminal_code', 'SIN-T4')
    .ilike('vibe_tags', '%Refuel%');
  assert.equal(error, null);
  const pool = (data ?? []) as Parameters<typeof smart7Select>[0];
  assert.ok(pool.length > 0 && pool.length < 7, `test needs a pool smaller than 7, got ${pool.length} (data changed? pick a narrower filter)`);

  const picked = smart7Select(pool, 'SIN-T4', 7);
  const uniqueNames = new Set(pool.map(p => p.name.toLowerCase().trim()));
  assert.equal(picked.length, uniqueNames.size, 'must return exactly the deduped pool, no padding');
  const slugs = picked.map(p => p.amenity_slug);
  assert.equal(new Set(slugs).size, slugs.length, 'no duplicate slugs');
  const poolSlugs = new Set(pool.map(p => p.amenity_slug));
  for (const s of slugs) assert.ok(poolSlugs.has(s), `fabricated amenity not in pool: ${s}`);
});

// 10. Nonexistent slug → clean not-found, no throw
test('10. nonexistent amenity slug returns clean not-found', T, async () => {
  const { data, error } = await supabase
    .from('amenity_detail')
    .select('*')
    .eq('amenity_slug', 'no-such-slug-xyz-000')
    .single();
  assert.equal(data, null);
  assert.ok(error, 'expected a not-found error object');
  assert.equal(error!.code, 'PGRST116', `expected clean PGRST116 not-found, got ${error!.code}: ${error!.message}`);
});
