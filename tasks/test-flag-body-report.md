# Test flag in the body of every send

**Status: READY TO SHIP. Rebased onto `c667d95` (5 Oct); fresh preview
`dpl_3Z3kWBpwpK7u9Kmq1VxS5DbjpnVh` (code `9753b61`): telemetry checks PASS and SMOKE
13/13. Waiting on Todd's go for main.**

Branch `fix/test-flag-in-body`, worktree `.claude/worktrees/test-flag-body`. First run
4 Oct on `be0fff0` (`3024ada`, preview `dpl_CHm5quhuxwMor2wHuZ1yAKuFfWr9`); rebased
5 Oct, see the last section.

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

## Rebase onto `c667d95` and re-check (5 Oct)

`git rebase origin/main`: clean, no conflicts. `git range-diff`: the code commit is
unchanged (`3024ada` → `9753b61`); only the context of the `tasks/lessons.md` hunk
moved, because CC-6 appended a lesson. CC-6 also changed `src/lib/telemetry.ts`
elsewhere, and all three sends still carry `testBody()`: flush, unload beacon, and
`recordJourney`. `npm ci` again (CC-6 added `@vercel/functions`).

Preview `dpl_3Z3kWBpwpK7u9Kmq1VxS5DbjpnVh` (`terminal-plus-frontend-or4bal14v-…`,
alias `…-git-fix-t-9b2c92-…`), READY, sin1, serving `index-vxoiZoCr.js`, the same as
the local build. Watermark: events id > 779, 02:53:26 UTC.

| Check | Result |
|---|---|
| `isTestRequest` cases | 8/8 (the 7 above plus header `['1']` → true) |
| `npx tsc --noEmit -p api/tsconfig.json` | exit 0 |
| Reachable-file typecheck | 35 errors, identical to the baseline; 0 in `telemetry.ts` or `journeyRecord.ts` |
| `npm run build` / `npm run test:adversarial` | exit 0 / 11 of 11 |
| Browser, `tp_test` set from `/robots.txt` before any app load, tab hidden | `sendBeacon` and `fetch` wrapped after load. Tap Grain Traders, then back: 3 sends to `/api/events`, all `via: beacon`, each body `"test": true`. Anon `0a97b542…`: events 780–783 (session_start, impression, amenity_tapped, amenity_detail_dwell), all `is_test` |
| Journey send | Typed QF1: one `fetch` to `/api/journey` with both `x-tp-test: 1` and body `"test": true` |
| Direct POST, flag only in the body, no header | `/api/events` JSON → **786** `is_test`; `text/plain` → **787** `is_test`; `/api/journey` → `806d0d2e-92ab-4a37-ba2a-baa1e4f018ae` `is_test` |
| Console | 0 errors |

### SMOKE (`tasks/release-2026-09-report.md`), 02:54–02:58 UTC (10:54 SGT), 375×812, TZ Asia/Jerusalem

| # | Line | Result | Evidence |
|---|---|---|---|
| 1 | `/` capture gate | PASS | Fresh storage: "What brings you to Changi?", Departing / Connecting / Just landed / Skip |
| 2 | Skip | PASS | Home with "Add your flight for personalised recommendations"; journey `d250e77c-93eb-47e8-b814-3676de4d830f` `skipped` |
| 3 | Typed QF1 | PASS | Departing → T1 → Enter manually → QF1 → Looks right. Bar "11h 49m to board · On Time, QF1 · SIN → LHR, T1"; `schema_version: 4`, `typed` |
| 4 | Board picker | PASS | 141 board rows; picked TR474 → "32 min to board · On Time, TR474 · SIN → SZB, C17, T1"; `picker` (journey `b1a9d68d-b474-4b5b-b9a3-5f3e325ae531`) |
| 5 | Home: 7 vibe rows | PASS | Refuel, Work, Quick, Explore, Shop, Chill, Comfort; 31 images, 0 broken; 32 cards with a count |
| 6 | `/vibe/refuel` | PASS | "7 spots across all terminals" |
| 7 | Collection, amenity, search | PASS | coffee-worth-walk "7 of 7 spots"; grain-traders-jewel renders with "More like this"; "laksa" → Kopitiam (T1) |
| 8 | Change flight → Keep QF1 | PASS | "Change flight" heading, "Keep QF1" once; afterwards `tp_journey_context` byte-identical (`capturedAt` 02:55:47.326Z), still 1 journey send |
| 9 | Non-Singapore TZ follows SGT | PASS | Local 05:56, SGT 10:56: Fossa Chocolate (10:00–22:00) shows **Open** (closed by local time). Grain Traders opens at 11:00, so at this hour it can't tell the clocks apart |
| 10 | Chat | PASS | `POST /api/chat` 200: "You're in T1 with loads of time before boarding at 22:45 …"; row `fc298ce1-0614-49e3-91e9-c7e5f562381f`, `claude-sonnet-5-5`, `SIN-T1`, `is_test` |
| 11 | MCP | PASS | `smoke-tf-202610050258`: initialize 200 `2025-03-26` `terminal-plus`; tools/list 4; `get_recommendations {refuel, SIN-T1}` → 7. Row `5516c738-751d-434c-be9d-663da48db8f9` `is_test` |
| 12 | Recent events | PASS | `session_start`, `recommendation_impression`, `capture_opened`, `search_performed`, `amenity_detail_dwell`, `flight_not_found` |
| 13 | Typed journeys row | PASS | Exactly 1: `ebaf2019-6c73-466a-bd25-9ad8e09523be`, QF1, typed |

### Test rows (all `is_test`, env `preview`)

| Run | anon | events | other |
|---|---|---|---|
| Beacon check | `0a97b542…` | 780–783 | |
| Direct POSTs | `bf12739e…` | 786, 787 | journey `806d0d2e-92ab-4a37-ba2a-baa1e4f018ae` |
| SMOKE 1, 2, 5 | `0696a6ea…` | 788–796 | journey `d250e77c-93eb-47e8-b814-3676de4d830f` |
| SMOKE 3, 6–10 | `95fd13cf…` | 797–813 | journey `ebaf2019-6c73-466a-bd25-9ad8e09523be`; chat `fc298ce1-0614-49e3-91e9-c7e5f562381f` |
| SMOKE 4 | `c467d5cf…` | 814–822 | journey `b1a9d68d-b474-4b5b-b9a3-5f3e325ae531` |
| SMOKE 11 | | | MCP `5516c738-751d-434c-be9d-663da48db8f9` |

0 untagged across these anons. The only other rows since the watermark are 784–785,
production, not from this run (see the note below).

Note, not this change: production has untagged rows 776–779 and 784–785 from 3
browsers, 02:38–02:54 UTC on 5 Oct. Each is one `session_start` plus one impression,
landing on a sitemap URL (`/vibe/comfort`, `/collection/quick/grab-and-go`,
`/collection/discover/jewel-experience`) with no referrer and no UTM. That fits a
crawler that runs JavaScript; it isn't proven. The analytics views count them today.

