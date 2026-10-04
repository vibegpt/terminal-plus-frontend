# Test flag in the body of every send

**Status: preview PASS (`dpl_CHm5quhuxwMor2wHuZ1yAKuFfWr9`, sha `3024ada`).
Not shipped: needs the SMOKE checklist on this preview before main (CLAUDE.md).**

Branch `fix/test-flag-in-body` off `be0fff0`, worktree `.claude/worktrees/test-flag-body`.
Run 4 Oct 2026.

## Question (Todd, 4 Oct)

sendBeacon can't send custom headers, so `x-tp-test` is lost on any send made as
a page closes. Does the tp_test switch put the test flag in the body of every
send, beacons included, and does `api/events.ts` read it there?

## Answer on `be0fff0`: no

- Bodies were `{ events: [...] }` (`src/lib/telemetry.ts` flush and flushBeacon) and `{ journey: {...} }` (`src/lib/journeyRecord.ts`). Neither carried a flag.
- The server read only the header: `api/events.ts:198` `isTestRequest(req.headers)`, `api/journey.ts:197` the same.
- The gap was dodged, not closed: `telemetry.ts:354` skipped `sendBeacon` when `tp_test` was on and sent a keepalive fetch with the header. Test browsers were tagged, but at unload they used a different transport from real users.
- The only other `sendBeacon` caller, `src/utils/sessionTracking.ts` (to `/api/track`), is unreachable from `src/main.tsx`, and `/api/track` doesn't exist.

## Change

| File | Change |
|---|---|
| `api/lib/telemetryEnv.ts` | `isTestRequest(headers, body?)`: true for `x-tp-test: 1` (older clients) or a parsed body whose `test` is exactly `true` |
| `api/events.ts`, `api/journey.ts` | Parse the body once, take `events` / `journey` from it, pass it to `isTestRequest` |
| `src/lib/telemetry.ts` | `testBody()` → `{ test: true }` when the switch is on. It's added to the flush body and the unload body. Test browsers now use `sendBeacon` like everyone else; the header stays on fetches |
| `src/lib/journeyRecord.ts` | Journey body carries `testBody()` too |
| `tasks/lessons.md` | The CC-18 headless lesson said a tp_test browser "never sends a beacon"; corrected |

The flag can still only mark rows as test (remove them from the production
views), never make a row count as production.

## Checks

| Check | Result |
|---|---|
| `isTestRequest` cases (tsx) | 8/8: header → true; body `test: true`, no header → true; neither → false; `test: "1"` → false; `test: false` → false; header `0` → false; null body → false |
| `npx tsc --noEmit -p api/tsconfig.json` | exit 0 |
| Reachable-file typecheck | 35 errors, the identical set to the baseline; 0 new |
| `npm run build` / `npm run test:adversarial` | exit 0 / 11 of 11 |
| Browser, preview, `tp_test=1` set from `/robots.txt` before any app load | The preview tab is always hidden, so every send is an unload flush. With `navigator.sendBeacon` and `fetch` wrapped: 2 sends to `/api/events`, both `via: beacon` (no header possible), both bodies with `"test":true`. Every row from that anon (`119de8d1…`), events **608–611** (session_start, 2 impressions, the grain-traders-jewel dwell), is `is_test = true`. 0 console errors |
| Direct POST, flag only in the body, no header | `/api/events` JSON body → **614** `is_test`; `text/plain` body (how beacons often arrive) → **615** `is_test`; `/api/journey` → `b8748c54-e547-4c16-82f6-a9b366e08bf7` `is_test` |
| Non-test rows since the watermark (events id > 606, 06:15:43 UTC) | **0** |

Test rows (all `is_test`, env `preview`): events 608–611, 614, 615; journey
`b8748c54-e547-4c16-82f6-a9b366e08bf7`.
