// The minutes a passenger states in one message (CC-29 A3). Run: npx tsx --test tests/chatMinutes.test.ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { statedMinutes } from '../api/lib/chatMinutes';

const at = (h: number, m = 0) => h * 60 + m; // nowSgt: minutes since midnight, Singapore time

// query, nowSgt, expected. The contract: tasks/cc-29/statedMinutes.contract.md
const CASES: Array<[string, number, number | null]> = [  // 17 contract rows, then the amendment rows below
  ['is the butterfly garden a 5 min walk?', at(13), null],
  ['Cheers in T3 is open 24 hours', at(13), null],
  ['which lounge is 10 minutes from gate B5?', at(13), null],
  ['I have 2 hours', at(13), 120],
  ["I've got 45 minutes", at(13), 45],
  ['we have an hour and a half before boarding', at(13), 90],
  ['3 hour layover, what should I do', at(13), 180],
  ['boarding at 14:30', at(13), 90],
  ['my flight is at 3am', at(23), 240],
  ['I have 30 hours', at(13), null],
  ['SQ322 gate B5', at(13), null],
  ['I have 2 mins', at(13), null],
  ['I have 2 hours, is the lounge a 10 min walk?', at(13), 120],
  ['I have 1 hour 20 minutes', at(13), 80],
  ["I've got time, is it a 10 min walk?", at(13), null],
  ['45 minutes until boarding, coffee?', at(13), 45],
  ['I have half an hour', at(13), 30],
];

// Amendment (Todd, 12 Nov): "in N hours" counts at the start of a message or after boarding / flight / departs / leaves.
// Found by chat eval n11 ("In about 2.5 hours. Where should I eat?"), which the 17-row table dropped.
const IN_CASES: Array<[string, number, number | null]> = [
  ['In about 2.5 hours. Where should I eat?', at(13), 150],
  ['boarding in 45 minutes', at(13), 45],
  ['my flight leaves in 2 hours', at(13), 120],
  ['is Cheers open in 2 hours?', at(13), null],
  ['the lounge is in 10 minutes walk', at(13), null],
  ['what is open in about 3 hours?', at(13), null],
];
CASES.push(...IN_CASES);

for (const [query, now, expected] of CASES) {
  test(`${JSON.stringify(query)} at ${Math.floor(now / 60)}:${String(now % 60).padStart(2, '0')} -> ${expected}`, () => {
    assert.equal(statedMinutes(query, now), expected);
  });
}
