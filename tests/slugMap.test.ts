// CC-27B: client-side slug map. Run: npx tsx --test tests/slugMap.test.ts
// The map is generated from amenity_dedupe_20261105 (npx tsx scripts/cc27a-redirects.ts --slug-map);
// these checks hold without any database access, so CI runs them.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SLUG_MAP, resolveSlug } from '../shared/catalogue/slugMap';

test('62 entries, and no value is also a key (chains are never followed)', () => {
  assert.equal(Object.keys(SLUG_MAP).length, 62);
  for (const [old, canonical] of Object.entries(SLUG_MAP)) {
    assert.notEqual(old, canonical);
    assert.ok(!(canonical in SLUG_MAP), `${old} -> ${canonical}, which is itself a key`);
  }
});

test('resolveSlug returns the input for an unknown slug', () => {
  assert.equal(resolveSlug('butterfly-garden-t3-new'), 'butterfly-garden-t3-new');
  assert.equal(resolveSlug('no-such-venue'), 'no-such-venue');
  assert.equal(resolveSlug(''), '');
});

test('resolveSlug does not treat object prototype names as slugs', () => {
  assert.equal(resolveSlug('constructor'), 'constructor');
  assert.equal(resolveSlug('__proto__'), '__proto__');
  assert.equal(resolveSlug('toString'), 'toString');
});

test('named pairs from the backup table', () => {
  assert.equal(resolveSlug('butterfly-garden-t1-new'), 'butterfly-garden-t3-new');
  assert.equal(resolveSlug('yotelair-singapore-changi-t2-new'), 'yotelair-singapore-changi-jewel');
  assert.equal(
    resolveSlug('lotte-duty-free-wines-spirits-level-1-shop-10-sint1'),
    'lotte-duty-free-wines-spirits-t1-level-1-10',
  );
});
