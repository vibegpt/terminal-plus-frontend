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

test('bookmarks: old slugs map on read, collapse to one canonical entry, and are written back once', async () => {
  const store = new Map<string, string>();
  let writes = 0;
  (globalThis as { localStorage?: unknown }).localStorage = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => { writes++; store.set(k, v); },
    removeItem: (k: string) => { store.delete(k); },
  };
  const { isSaved } = await import('../src/hooks/useBookmarks');
  const mk = (amenitySlug: string, terminalCode: string, savedAt: string) =>
    ({ amenitySlug, name: 'Butterfly Garden', terminalCode, vibeTag: 'Explore', savedAt });
  store.set('tp_saved_amenities', JSON.stringify([
    mk('butterfly-garden-t1-new', 'SIN-T1', '2026-11-01T10:00:00.000Z'),
    mk('butterfly-garden-t3-new', 'SIN-T3', '2026-11-02T10:00:00.000Z'),
  ]));
  assert.equal(isSaved('butterfly-garden-t3-new'), true);
  const list = JSON.parse(store.get('tp_saved_amenities')!);
  assert.equal(list.length, 1);
  assert.equal(list[0].amenitySlug, 'butterfly-garden-t3-new');
  assert.equal(list[0].terminalCode, 'SIN-T3');            // the canonical entry's fields
  assert.equal(list[0].savedAt, '2026-11-01T10:00:00.000Z'); // the earliest save
  assert.equal(writes, 1);
  isSaved('butterfly-garden-t3-new');                        // a second read changes nothing
  assert.equal(writes, 1);
});

test('named pairs from the backup table', () => {
  assert.equal(resolveSlug('butterfly-garden-t1-new'), 'butterfly-garden-t3-new');
  assert.equal(resolveSlug('yotelair-singapore-changi-t2-new'), 'yotelair-singapore-changi-jewel');
  assert.equal(
    resolveSlug('lotte-duty-free-wines-spirits-level-1-shop-10-sint1'),
    'lotte-duty-free-wines-spirits-t1-level-1-10',
  );
});
