# CC-29A report: 5 live bugs

**Status: SHIPPED 12 Nov. PR #11 merged (`419da51`), production `dpl_Dbh53ycbQRaA4RCnuVEzH64RGqHQ` READY, production checks PASS.**
Branch `cc-29/live-bugs` on `68d5c91` (= production = origin/main on 12 Nov, no rebase needed). Commits: `a831808` (the 5 fixes), `131a5a1` (amendment: `statedMinutes` accepts "in N hours"), `f7d4324` (empty commit: Vercel's webhook did not fire for `131a5a1`, so no preview existed for it; a retrigger push fixed that).
Preview: `terminal-plus-frontend-git-cc-29-d22635-todds-projects-d0181971.vercel.app`, now on `f7d4324`. The frontend bundle is unchanged by the amendment (`index-BuxNRKhl.js` on both previews); only `api/lib/chatMinutes.ts` and tests differ. The first preview was `dpl_Ca2eQq1n8FwU4qi8aGZat1PYhJGE` (sha `a831808`); proof that the amended chat code is live: the probe "In about 2.5 hours" returned `available_minutes` 150 on the third poll after the retrigger.
CI: `success` on `a831808` (run 43201589607) and on `131a5a1` (run 43204835376, 127 tests).
Worktree `~/tp-cc-29`. Rollback if merged: previous production `dpl_219WPU1ETFP8AryefDBfRTKLjizR` (`68d5c91`).

## Gates

| Gate | Result | Evidence |
|---|---|---|
| G0 | PASS | `git diff 70bf1cf origin/main -- <7 files>` = 0 bytes; no bug already fixed |
| G1 | PASS | production `dpl_219WPU1ETFP8AryefDBfRTKLjizR` sha `68d5c91e90971e32757e478025b3846369e91c49` = origin/main; local `main` moved to it |
| G2 | PASS | `npm ci`, build, `tsc -p api` exit 0, 99/99 tests. `tasks/cc-29-baseline.txt` |
| G3 | PASS | harness on the 68d5c91 build: A1 7 at load, +7 and 14 skeleton blocks per tick; A2 cancelled 6 calls + toast every sample; gate 1/2/3. `tasks/cc-29/g3-baseline.json` |
| G4 | PASS | today's `extractAvailableMinutes` on the 3 inputs: 1440, 5, 120 |

Appendix checks: `reference-a1-a2.diff` applied cleanly (`git apply --check`); reference `statedMinutes` 17/17.

## Changes (10 files, +225 / -138)

| File | Change |
|---|---|
| `vite.config.ts`, `package.json` | visualizer only under `ANALYZE`; `analyze` script; `'stats.html'` in `globIgnores` |
| `src/context/JourneyContext.tsx` | `useCallback([])` setters + `useMemo` value (identical to the reference diff) |
| `src/hooks/useFlightUpdates.ts` | cancelled guard; `poll` reads the journey through a ref (identical to the reference diff) |
| `src/pages/HomePage.tsx` | reference diff, plus: rows stored with their time slot (`fetched`), rejected fetch renders mapping-only cards, `VibeSection` key includes the slot, stale comment updated |
| `api/lib/chatMinutes.ts` (new) | `statedMinutes` = the reference implementation, plus the amendment: one more alternative in `BEFORE` (`in`/`within` at the start of the message, or after `boarding|boards|flight|departs|leaves|leaving|gate closes (is) in`) |
| `api/chat.ts` | `extractAvailableMinutes` deleted; `nowSgt` (test clock included) before minutes; model `available_minutes` removed from the prompt and the handler; `extractedContext.availableMinutes` only when this message stated it |
| `src/hooks/useChat.ts` | `chatContextForSend`; `statedDeadline` (epoch ms); passed deadline cleared |
| `tests/chatMinutes.test.ts` (new), `tests/chatContext.test.ts` | 17 contract rows + 6 amendment rows; 5 deadline cases |

Not touched: `api/mcp.ts`, `api/lib/ranking.ts`, `shared/`, `vercel.json`, `public/.well-known`, `tp_journey_context` key/fields/schema_version/migrate().

## Deviations from the reference, and why

1. **Slot-keyed rows.** The reference diff derived sections from `timeSlot` (recomputed each render) and the old rows. At a slot boundary that shows count-less cards for one fetch round-trip. Rows now carry the slot they were fetched for, so the old cards stay until the new rows land.
2. **`VibeSection` key includes the slot.** Found by the AC-3 harness with real rows: with cards no longer remounting by skeleton, Chrome's scroll-snap re-snapped a row to a card that had moved and opened it scrolled sideways (`scrollLeft` 773 px on 2 rows; baseline 16 px). `overflow-anchor: none` did not fix it (it is snap, not anchoring). Keying the section on the slot starts a new slot's row at the first card. After: all 7 rows at 16 px, same as baseline. Visible in the diff as a comment on the `key` line.
3. **Rejected fetch.** `.then(ok, fail)` sets empty rows, so the skeleton can't hang.
4. **A1 step 5 needed no code.** `VibeSection` already keys `trackImpressionOnce` on its collection id list (`HomePage.tsx` effect on `collectionIds`). I had said in the plan it was missing; that was wrong.

## Acceptance

### AC-1 Home refetch (harness, new build vs baseline)
| | Baseline (68d5c91) | New |
|---|---|---|
| collections requests at load | 7 | **1** |
| new requests at minute 1 / 2 / 3 | 7 / 7 / 7 | **0 / 0 / 0** |
| skeleton blocks after each tick | 14 / 14 / 14 | **0 / 0 / 0** |
| impression events at load, then per tick (fixture rows, `harness-impressions.cjs`, load flushed first) | 7, then 0 / 0 / 0 | 7, then **0 / 0 / 0** |
| "N spots" labels at load (40 labels, md5 of the sequence) | `9a4a6c20…` | `9a4a6c20…` (identical) |

Baseline impressions were already deduped by `seenImpressions`, so that bug was never real; the check proves the tick adds none. The harness stubs Supabase, so it cannot show reorders on real data; the fixture rows do hash-based counts so both builds see the same data.

### AC-2 Flight polling (harness)
| | Baseline | New |
|---|---|---|
| cancelled: `/api/flight-status` calls in 60 s | 6 | **1** |
| cancelled: toast visible at 10/20/30/40/50/60 s | every sample | **10 s only** |
| gate change: calls at 10 s / 30 s / 30 m 30 s | 1 / 2 / 3 | **1 / 1 / 2** |

### AC-3 Slot boundary (`harness-slot.cjs`, clock 11:57 to 12:00 SGT, fixture rows)
| | Baseline | New |
|---|---|---|
| new collections requests across the boundary | 20 | **1** |
| skeleton blocks at the boundary | 14 | **0** |
| cards shown from the new slot's mappings / from old-only slugs | 40 / 0 | **40 / 0** |
| card order after rollover vs a cold afternoon load | same | same (identical first 14) |
| row scroll offsets after rollover | 16 ×7 | 16 ×7 (after fix 2) |

Header "Morning picks" to "Afternoon picks", countdown 3h to 2h 57m. Screenshots `tasks/cc-29/ac3-before.png`, `ac3-after.png` (375 px).

### AC-4 Real browser, 3 real minutes (`ac4-real-browser.cjs`, Chromium 375 px, `?tp_test=1`, journey boarding 3 h out, real network)
| | Production (baseline) | Preview (new) |
|---|---|---|
| open time | 200 s | 200 s |
| collections requests | **35** (14 at load, +7 each minute) | **1** (at 3 s) |
| page-skeleton appearances after the first cards | 3 | **0** |
| "N spots" labels | 32 | 32 |
| flight-status calls | 2 (8 s, 15 s) | 1 (8 s) |

Screenshot `tasks/cc-29/ac4-t3min.png`: Home 3 minutes in, "2h 57m to board", Refuel and Shop rows with photos and counts. Notes: the two baseline flight-status calls are the 5 s poll, then a restart after the poll's own `boardingTime` write (the effect lists `boardingTime`, so a real boarding-time change legitimately restarts it). The first run counted any `.animate-pulse` node and read 24; those were the 24 lazy hero-image placeholders, so the check was narrowed to the page-skeleton header block. It was run as a browser pass, not on a physical phone.

### AC-5 Tests and CI
- `tests/chatMinutes.test.ts`: **17/17** contract rows plus **6/6** amendment rows. `tests/chatContext.test.ts`: 11/11 (6 existing + 5 new: 120 min set at t0 sends 90 at t0+30; live deadline beats the journey; passed deadline falls back to 685; a stored minute count is never sent; other context still wins).
- Full suite **127/127** (was 99). `tsc -p api` exit 0. CI `success`, runs 43201589607 and 43204835376.

### AC-6 Chat on the preview (`x-tp-test: 1`, no journey, full debug blocks in `tasks/cc-29/ac6-debug-blocks.txt`)
| Turn | Baseline (production) | New (preview) |
|---|---|---|
| t1 "is the butterfly garden a 5 min walk?" | `available_minutes` 5, **0** feasible, `extractedContext.availableMinutes` 5 | `available_minutes` **null**, **40** feasible, `extractedContext` null |
| t2 history "Cheers in T3 is open 24 hours", "any coffee?" | 1440, `extractedContext` 1440 | `available_minutes` **null**, 22 feasible, `extractedContext` null |
| t3 "I have 2 hours" | 120 | **120**, `extractedContext.availableMinutes` **120**, 21 feasible |
| t4 "what about food?" via the app client, about 1 minute after t3 | n/a | request carried `availableMinutes` **119**, `debug.available_minutes` **119**, 9 feasible, never null, never 5 |

All four are `claude-sonnet-5-5`, `json_valid` true.

### AC-7 Chat eval (`tests/chat-eval/run.ts --base <preview> --label cc29b`, vs `cc17-v2-live`, the latest saved live run)
First run (`cc29`, before the amendment) had one Jewel violation (n11); see "Finding". Rerun on the amended preview:

| | cc17-v2-live | cc29b (amended) |
|---|---|---|
| validity (json_valid) | 30/30 | **30/30** |
| slug_quality | 29/30 (a1) | **29/30** (same a1) |
| adversarial / location | 4/5, 2/2 | 4/5, 2/2 |
| closed picks / location claims | 0 / 0 | 0 / 0 |
| jewel_violations | none | **none** (n11 `available_minutes` 150) |
| p50 / p95, median input tokens | 5879 / 9228 ms, 4891 | 4586 / 10224 ms, 4457 |
| rows logged, not test | 30/30, 0 | 30/30, 0 |

The AC-7 criteria (json_valid, slug validity) hold, and the Jewel violation is gone. Files: `tasks/cc-29/eval/cc29.json` (first run, 1 Jewel violation), `tasks/cc-29/eval/cc29b.json` (amended, 0).

### AC-8 Bundle
- `npm run build`: no `dist/stats.html`; `grep -c stats.html dist/sw.js` = 0; precache 35 entries, 842 KiB.
- Precache gzip total (APPENDIX 1 one-liner): **380,135 B to 247,475 B (-132,660 B)**.
- `npm run analyze` writes `dist/stats.html` (1,187,018 B). A following plain build leaves none.
- Preview `sw.js`: 0 references to `stats.html`; production `sw.js`: 1 (baseline).

### AC-9 Protected paths and preview SMOKE
`git diff origin/main -- api/mcp.ts api/lib/ranking.ts shared/ vercel.json public/.well-known` = 0 bytes.

Preview SMOKE 13/13, run by a Playwright script on the branch alias (TZ Europe/Moscow, 375 px, `tp_test=1`). Run twice: the table is the first run; the amended preview (`f7d4324`) was rerun and gave the same results (1, 2, 3 typed v4, 5 = 7 rows / 31 images / 32 labels, 6 = "7 spots across all terminals", 7, 8 opened + "Keep QF1" once + journey identical, 9, 10 answered with terminal SIN-T1 and 231 min from the journey, 4 picked QF82 20:40 T1 "56 min to board", MCP initialize + 4 tools + 7 recommendations, 0 non-test rows in 25 min):

| # | Line | Result | Evidence |
|---|---|---|---|
| 1 | capture gate | PASS | "What brings you to Changi?", Departing / Connecting / Just landed / Skip all present |
| 2 | Skip | PASS | Home "Add your flight for personalised recommendations"; journeys `flight_source='skipped'` (6 rows in 2 h, all is_test) |
| 3 | typed QF1 | PASS | "QF1 / Terminal T1 · Boards 23:00 → LHR", then bar "4h 18m to board, On Time, QF1 · SIN → LHR"; `tp_journey_context` v4, `flight_source: "typed"` |
| 4 | board picker | PASS | 132 board rows; picked TR308 20:25 T1; bar "1h 4m to board, TR308 · SIN → CGK, D40, T1"; `flight_source: "picker"`. (A first attempt picked SQ740, already departed, so the bar correctly showed the add-flight prompt; the pick was rerun with a future flight.) |
| 5 | Home rows | PASS | Refuel, Shop, Chill, Explore, Comfort, Quick, Work; 31/31 images loaded (also 31/31 on production); 32 "N spots" labels |
| 6 | `/vibe/refuel` | PASS | "7 spots across all terminals" |
| 7 | collection / amenity / search | PASS | `coffee-worth-walk` "7 of 7 spots"; `grain-traders-jewel` renders (Open, Until 22:00, $$); `laksa` returns Kopitiam T1 |
| 8 | Change flight, Keep QF1 | PASS | tap opened the bar and "Change flight"; change screen shows "Keep QF1" once; after Keep, `tp_journey_context` string-identical |
| 9 | non-SG TZ | PASS | device TZ Europe/Moscow (13:42), header "Evening picks" (SGT 18:42); Grain Traders "Open · Until 22:00". Weak discriminator: no venue straddles the two times today, so the header is the evidence |
| 10 | chat uses the flight | PASS | "Where should I get coffee before my flight?" answered; context terminal SIN-T1, journeyType departing, availableMinutes 257 from the journey; cards dnata Lounge, Coffee Bean, Starbucks, all SIN-T1 |
| 11 | MCP | PASS | `initialize` protocolVersion 2025-03-26, serverInfo terminal-plus; `tools/list` 4 (`get_airport_context`, `get_recommendations`, `get_disruption_status`, `get_route`); `get_recommendations {"vibe":"refuel","terminal":"SIN-T1"}` 7 recommendations (session key `smoke-cc29a-20261112`) |
| 12 | SQL: events | PASS | last 2 h: session_start 21, recommendation_impression 154, capture_opened 28, amenity_detail_dwell 17, flight_not_found 5, all `is_test = true` |
| 13 | SQL: journeys by source | PASS | typed 4, picker 5, skipped 6, all `is_test = true`; 39 conversational + 24 mcp agent_interactions in the window, all `is_test = true` |

Row note: some of those rows have `env = production` because I ran the baseline comparisons (chat, AC-4, image check) against terminalplus.app with `tp_test` / `x-tp-test`; all are `is_test`. Eval rows: 30, ids in `tasks/cc-29/eval/cc29.json`.

## Finding (resolved): the intent-phrase rule dropped "in about 2.5 hours"

Eval prompt n11: query "In about 2.5 hours. Where should I eat?" (the assistant had just asked when the flight boards). Old extractor: 150 minutes. The 17-row `statedMinutes`: **null**, because "about 2.5 hours" is not inside an intent phrase. With no minutes and no journey type the Jewel rule couldn't apply, so a Jewel venue was recommended (eval: `n11: unknown type at 150 min`).

**Amendment (Todd, 12 Nov: "Amend first")**, commit `131a5a1`: a duration counts after `in` / `within` at the start of the message, or after `boarding|boards|flight|departs|leaves|leaving|gate closes (is) in`. The 17 contract rows still pass; 6 rows added to `tests/chatMinutes.test.ts` and to `tasks/cc-29/statedMinutes.contract.md`: "In about 2.5 hours. Where should I eat?" 150; "boarding in 45 minutes" 45; "my flight leaves in 2 hours" 120; "is Cheers open in 2 hours?" null; "the lounge is in 10 minutes walk" null; "what is open in about 3 hours?" null. After the amendment: n11 reads 150 minutes and the eval has 0 Jewel violations; AC-6 t1 to t4 are unchanged (null, null, 120, 119).

## Other observations (not changed)
- `getTimeSlot()` uses the device's local hour while Home's header uses SGT. Unchanged; the slot rolls over at local 12:00.
- A Home with no journey has no state change on the minute tick, so its slot would not roll over until another render. Same as before this change.
- Quick one-line lesson candidate for `tasks/lessons.md`: a list that no longer remounts on data change re-snaps scroll-snap rows to the moved card; key the row by what defines it. Not appended (no correction from Todd this session).

## Files left uncommitted on the branch (as instructed)
`tasks/cc-29-baseline.txt`, `tasks/cc-29/*` (harnesses, reference files, `proposed.diff`, screenshots, eval, AC-6 blocks), this report.

## Production (Todd's GO, 12 Nov)

PR #11 (https://github.com/vibegpt/terminal-plus-frontend/pull/11), merge commit `419da51697b65f94bd4793ff70a4560deb2fe883` on main; origin/main was still `68d5c91` before the merge, so no rebase. PR checks 3/3 passing, mergeable CLEAN.
**Production `dpl_Dbh53ycbQRaA4RCnuVEzH64RGqHQ` READY** (ready 1794481906534 ms, about 27 s after the push), aliases include `terminalplus.app`. Rollback: `dpl_219WPU1ETFP8AryefDBfRTKLjizR` (`68d5c91`, CC-27C).

| Check | Result | Evidence |
|---|---|---|
| Bundle | PASS | `terminalplus.app` serves `index-D1FYaoBR.js` = local plain build of the same code (was `index-DLBWqNGX.js`); a fresh browser context loaded `index-D1FYaoBR.js` |
| A5 on production | PASS | `sw.js` references to `stats.html`: 0 (was 1); `/stats.html` now the 2,617 B SPA fallback (was the 1,187,024 B report) |
| A3/A4 live | PASS | "In about 2.5 hours" probe returned `available_minutes` 150 on the first poll after the merge |
| Production SMOKE 1 to 10 | PASS | gate; Skip; typed QF1 (v4, `typed`, "3h 48m to board"); 7 vibe rows, 31 images, 32 labels; `/vibe/refuel` "7 spots across all terminals"; collection "7 of 7 spots", Grain Traders and Kopitiam (laksa); Change flight, "Keep QF1" once, journey identical; TZ Europe/Moscow with "Evening picks"; chat answered with T1 cards and 226 min from the journey; board picker TR740 20:45 T1, "56 min to board", `picker` |
| Chat turns on production | PASS | t1 null / 40 feasible; t2 null; t3 120 with extractedContext 120; t4 via the app 119, never null. All `claude-sonnet-5-5`, `json_valid` true |
| MCP smoke (11) | PASS | `initialize` 2025-03-26, `tools/list` 4, `get_recommendations {"vibe":"refuel","terminal":"SIN-T1"}` 7 recommendations (session key `smoke-cc29a-prod-20261112`) |
| SQL (12, 13) | PASS | last 20 min, `env = production`: session_start 4, recommendation_impression 30, capture_opened 4, flight_not_found 1, search_performed 1; journeys typed 1, picker 2, skipped 2; agent_interactions conversational 7 and mcp 1; **every row `is_test`; 0 non-test, non-bot rows** |
| AC-4 on production, 3 real minutes | PASS | collections requests **1** (was 35 before the merge), page-skeleton appearances after the first cards **0** (was 3), 32 "N spots" labels, journey countdown shown |

Notes: the service worker was not yet controlling on the first load of each fresh context (expected on a cold open; the page loaded the new bundle from the network). A real-iPhone layout check of Home is still open (CC-29A changed no layout beyond the section key); not done here.

## Follow-ups (not started)
- Part B (dead-code removal) is a separate later prompt.
- `getTimeSlot()` is the device's local hour while Home's header uses SGT (unchanged).
- Lessons appended to `tasks/lessons.md`: scroll-snap re-snap on kept cards, and checking that Vercel created a deployment for each pushed sha.
