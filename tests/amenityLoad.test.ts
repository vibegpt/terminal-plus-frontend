// CC-27C: a failed request is not a missing venue. Run: npx tsx --test tests/amenityLoad.test.ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { classifyLoadError } from '../src/lib/amenityLoad';

test('zero rows from .single() (PGRST116) is a missing venue', () => {
  assert.equal(classifyLoadError({ code: 'PGRST116' }), 'missing');
});

test('a dropped network is unreachable, not missing', () => {
  // supabase-js reports a failed fetch with an empty code and "TypeError: Failed to fetch"
  assert.equal(classifyLoadError({ code: '' }), 'unreachable');
  assert.equal(classifyLoadError({}), 'unreachable');
  assert.equal(classifyLoadError({ code: null }), 'unreachable');
});

test('a server or permission error is unreachable, not missing', () => {
  assert.equal(classifyLoadError({ code: 'PGRST301' }), 'unreachable');
  assert.equal(classifyLoadError({ code: '42501' }), 'unreachable');
  assert.equal(classifyLoadError({ code: '503' }), 'unreachable');
});

test('no error object is treated as unreachable (the caller only asks when something failed)', () => {
  assert.equal(classifyLoadError(null), 'unreachable');
  assert.equal(classifyLoadError(undefined), 'unreachable');
});
