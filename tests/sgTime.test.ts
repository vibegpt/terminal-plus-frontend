// Singapore time helpers. Run: npx tsx --test tests/sgTime.test.ts
// The device zone is set to Jerusalem on purpose: the helpers must ignore it.
process.env.TZ = 'Asia/Jerusalem';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sgHour, sgMinutesOfDay, sgDateKey } from '../src/lib/sgTime';

// 28 Sep 2026, 03:20 UTC = 11:20 SGT = 06:20 in Jerusalem (the smoke-test moment).
const SMOKE = Date.parse('2026-09-28T03:20:00Z');

test('the device clock really is on another zone in this test', () => {
  assert.equal(new Date(SMOKE).getHours(), 6);
});

test('sgHour and sgMinutesOfDay read Singapore wall-clock time', () => {
  assert.equal(sgHour(SMOKE), 11);
  assert.equal(sgMinutesOfDay(SMOKE), 11 * 60 + 20);
  assert.equal(sgHour(new Date(SMOKE)), 11);
});

test('Singapore midnight rolls the hour and the date', () => {
  const beforeMidnight = Date.parse('2026-09-28T15:59:00Z'); // 23:59 SGT
  const afterMidnight = Date.parse('2026-09-28T16:00:00Z');  // 00:00 SGT on the 29th
  assert.equal(sgHour(beforeMidnight), 23);
  assert.equal(sgDateKey(beforeMidnight), '2026-09-28');
  assert.equal(sgMinutesOfDay(afterMidnight), 0);
  assert.equal(sgDateKey(afterMidnight), '2026-09-29');
});

test('defaults to now', () => {
  const now = Date.now();
  assert.equal(sgDateKey(), sgDateKey(now));
  assert.ok(sgMinutesOfDay() >= 0 && sgMinutesOfDay() < 1440);
});
