# CC-25 · Agent cards: the agent speaks first

**Status: built and accepted on preview. Not on main.** Waiting for Todd's go to ship, and for the real-iPhone layout sign-off (BLOCKED: needs Todd's phone).

- Branch `cc-25/agent-cards`, worktree `~/tp-cc-25`, base `afb5dc2` (= origin/main = production `dpl_GfrDKorW2rF2yuKQokhNNwnCx3D2`, checked 17 Oct).
- Final preview: `dpl_H5rTNKMuEMHjq2Sgv7pD5pUaDDrG` (`terminal-plus-frontend-ako6ngmz2-…`, sha `c56fc14`).
- Rollback after ship: Vercel Instant Rollback to `dpl_GfrDKorW2rF2yuKQokhNNwnCx3D2` (`afb5dc2`). The two views and the data fix stay; they're read-only and test-only respectively.

## What shipped on the branch

When the journey changes state, one card appears with a grounded suggestion. The user taps, swaps or dismisses; nobody types.

| Trigger | Fires when | Content | Model |
|---|---|---|---|
| plan | boarding time known, ≥ 60 min, no plan yet for this flight (capturedAt + flight) | 3 stops from 120 min, else 2 | yes |
| delay | boarding later by ≥ 30 min than at the last card, once per boarding time | 2 or 3 stops | yes |
| next_stop | after an outcome answer (yes/no) or "I'm here", ≥ 45 min left, 3 per journey | 2 or 3 stops, visited venues excluded | yes |
| gate_change | a known gate changed (not a first assignment) | "Gate now E4 · T2", Skytrain line on a terminal change, Quick chip only above 45 min (P5) | no |
| final_call | minutes to boarding crossed 45, seen from above | 3 Quick-vibe venues open now in the departure terminal | no |

Priority: gate_change > final_call > outcome strip > delay > next_stop > plan. One card at a time; a newer model card retires older model cards so a stale plan never resurfaces. Caps: plan 1 per flight, next_stop 3, total shown 6. All numbers are in `src/lib/agentCards.ts`, marked UNCALIBRATED.

## Decisions applied (Todd, 17 Oct)

| # | Decision | Where |
|---|---|---|
| D1 | Poller stores `departureTerminal`, departure leg only, no toast | `src/hooks/useFlightUpdates.ts:68-75`; proof below |
| D2 | `mode 'card'` insert inside `api/agent-card.ts`; `api/lib/agentTelemetry.ts` untouched | `insertCardRow` |
| D3 | Pool on `rankAmenities`; both terminals when arrived ≠ departing and both in T1-T3; T4 never | `shared/agentCard/card.ts poolScope`; eval s13 |
| D4 | `/api/events` batch behaviour unchanged (per-row rejection) | `validateCardEvent` |
| D5 | `window.__tpAgentCards` only on `VITE_TP_DEBUG === '1'`; `x-tp-card-model` only for test + non-production + `^[a-z0-9.-]{1,64}$` | see AC-9 and the build grep |
| D6 | Cache key = capturedAt + flight (+ trigger, terminal, type, gate, 15-min bucket); never journey_id; 1.5 s wait for the body only | `cacheKey`, `journeyKeyOf` |
| D7 | No refusal fallbacks; refusal, schema-invalid, timeout → deterministic card, logged with the reason | `api/agent-card.ts` |
| P1 | Primary 5 s, fallback model the remaining 3 s, then the deterministic card | `PRIMARY_MS`, `TOTAL_MS` |
| P2 | Card stop tap also emits `amenity_tapped {surface:'agent_card', card_id}` | event 1651 |
| P3 | `outcome_shown` only when the strip is visible | `stripDisplay`; bug found and fixed, see below |
| P4 | Hidden seed turn capped at 600 chars | `CHAT_SEED_MAX` |
| P5 | Gate card under 45 min: no Quick chip | browser check |

## Changes beyond the plan (flagged)

1. **Thinking off for cards on `claude-sonnet-5-5`** (`thinking: between_tools`, the model's documented off switch; chat's settings unchanged). Eval r1 had 3 of 13 cards time out at the 5 s primary budget with adaptive thinking; r2 after the change: 12 of 13 from the model, p50 2.9 s (was 3.6 s).
2. **Lines asked "under 60 characters"** (cap still 70). r1 truncated 2 lines; r2 truncated 0.
3. **`card_id` on `outcome_eligible`** too, so the comparison row has a real denominator (candidates, not answers).
4. **final_call skips visited venues.** First run offered A&W right after the passenger answered "yes" to it.
5. **Bottom sheet portals to `<body>`.** Inside the sticky header it rendered under the bottom nav and chat bubble.
6. **P3 race fixed.** On a cold resume the strip replayed the resume in its mount effect before the card provider published `cardAbove` (child effects run first), so it rendered and logged `outcome_shown` for one frame under final_call (ledger 'shown', strip not in the DOM). The provider now reads `tp_agent_cards` synchronously and primes the slot during its render; `setSlot` compares against the last published state. Re-tested live: eligible logged, shown not logged, strip hidden; after dismissing final_call the strip shows and is counted. Lesson added.
7. **`tests/outcome-eligibility.test.ts`** updated for the candidate v2 contract (v1 now reads as v2 with `card_id: null`; v3 rejected).

## Files

| File | Change |
|---|---|
| `api/agent-card.ts` | new: endpoint (validation, pool, model call, repair, fallback, telemetry) |
| `shared/agentCard/card.ts` | new: card shape, schema, repair rules, pool scope, header, swap |
| `src/lib/agentCards.ts` | new: trigger engine, priority, caps, cache key, store, slot, buses, chat seed |
| `src/lib/agentCardCopy.ts` | new: every string on the cards |
| `src/hooks/useAgentCards.tsx` | new: provider (detection, fetch, cache, telemetry, debug hook) |
| `src/components/AgentCard.tsx` | new: inline (Home), strip + bottom sheet (pages) |
| `src/App.tsx`, `src/pages/HomePage.tsx` | mount provider, strip in the sticky slot, inline card |
| `src/components/OutcomePrompt.tsx`, `src/lib/outcomePrompt.ts` | slot, shown-when-visible, card_id, outcome bus |
| `src/lib/candidateTap.ts` | candidate v2 (`card_id`), read-time migration |
| `src/pages/AmenityDetailPage.tsx` | card_id from router state into candidate and check-in |
| `src/components/ChatBubble.tsx`, `ChatPanel.tsx`, `src/hooks/useChat.ts`, `src/services/chatService.ts` | seeded chat |
| `src/lib/telemetry.ts`, `api/events.ts` | 3 events mirrored in one commit; validators |
| `src/hooks/useFlightUpdates.ts` | D1 |
| `supabase/migrations/20261017070529_agent_cards_view.sql` | 2 views (applied) |
| `supabase/migrations/20261017071110_cc25_flag_gate_check_row.sql` | data fix, 1 row (applied) |
| `tests/agent-cards.test.ts`, `tests/agent-card-eval/*` | unit tests, eval, poller proof |

Not touched: `api/mcp.ts`, `api/chat.ts`, `api/lib/*`, `shared/ranking/policy.ts`, `api/flights/board.ts`, `vercel.json`, `public/.well-known/*`.

## Gates

- **G1 PASS.** Production sha `afb5dc2` = origin/main.
- **G2** reported in session and approved (17 Oct).
- **G3 PASS.** No landside or open-now rule outside `shared/ranking/policy.ts` in live code (known exception `api/mcp.ts:199`, CC-17b). The card pool goes through `rankAmenities` → `pickEligible`.

## Verification

- api types: `npx tsc --noEmit -p api/tsconfig.json` clean.
- Frontend types: a reachable-only check (`files: [src/main.tsx]`) shows 31 errors before and 31 after, an identical set: 0 new.
- `npm run build` passes. `__tpAgentCards` appears in 0 shipped JS/HTML/sw files. 1 hit is in the public sourcemap's `sourcesContent` (public sourcemaps are an open CC-8 item).
- Unit tests: `npx tsx --test tests/*.test.ts` gives 115 tests, 114 pass, 0 fail, 1 skipped (pre-existing).
- `npm run test:adversarial`: 11/11 pass.

### D1 proof: same payload, same toasts

`bash tests/agent-card-eval/poller-proof/run.sh` bundles the poller from `afb5dc2` and from this branch with stubbed React, journey and lookup, and feeds both the same 8 payloads:

```
SAME | gate change, same terminal          | toasts ["Gate changed: B8"]
SAME | gate change + new terminal          | toasts ["Gate changed: E4"]                 | departureTerminal new=SIN-T2
SAME | delay 40 min + new boarding time    | toasts ["Flight delayed — new time available"]
SAME | gate + delay + terminal + dest      | toasts ["Gate changed: E4","Flight delayed — new time available"] | new=SIN-T2
SAME | cancelled                           | toasts ["Flight SQ221 CANCELLED"]
SAME | first gate assignment               | toasts ["Gate assigned: C1"]
SAME | arrival leg: terminal must not move | toasts []                                  | departureTerminal new=SIN-T3
SAME | no change                           | toasts []
TOASTS IDENTICAL IN ALL CASES
```

Boarding-time writes are identical in every case; the only difference is the stored `departureTerminal`. Live: on the preview, the real poller wrote SQ221's real terminal (T3) over a debug-patched T2 within 5 s (`/api/flight-status` at 21.6 s and 26.7 s).

## Acceptance (preview, 375 px)

| AC | Result | Evidence |
|---|---|---|
| AC-1 | PASS | SQ221 connecting picked from the board: the plan request started during capture (t = 41.4 s, 3.1 s) and was done before Home rendered; card with 3 T3 stops, `source: model`, "4h 58m to boarding · T3". `tasks/cc-25-eval/ac1-plan-card-375.jpg` |
| AC-2 | PASS | 65 min: 2 stops (Cactus Garden, Bacha Coffee), browser; eval s11 2/2 |
| AC-3 | PASS | Eval s01 connecting 170: 0 landside. s04 departing 95: `chagee-sint2` labelled "Before immigration", header ends "· Before immigration" |
| AC-4 | PASS (fill case not reproduced) | Eval s03 at 00:30 SGT: 0 closed. No scenario needed an "Opens HH:MM" fill: even T4 at 03:30 (s12) had 3+ open venues. The fill path is the policy's `soon` tier (unit-tested in `landside-policy.test.ts`) |
| AC-5 | PASS | Swap Butterfly Garden → A&W Root Beer: `/api/agent-card` requests 1 before, 1 after |
| AC-6 | PASS | Tap A&W: page opened with `card_id` in router state (not the URL). Events: `amenity_tapped` 1651 `{surface:'agent_card', card_id}`; `outcome_eligible` 1653 and `outcome_response` 1662 (yes) carry `card_id`; a next_stop card (`agent_card_shown` 1663) appeared without A&W |
| AC-7 | PASS | Debug hook: B6 (first assignment, no card), then E4 + T2: gate card, `source: rules`, "Gate now E4 · T2", "New terminal: allow time for the Skytrain", 0 new requests. Boarding +75: delay card fetched (1 request), waited under the gate card, showed after dismiss. `ac7-gate-change-375.jpg`, `ac7-delay-card-375.jpg` |
| AC-8 | PASS | 46 → 44 min: final_call (3 Quick venues open in T3, `source: rules`, 0 model requests), above the waiting delay card. Strip waits under it (P3 re-test above). `ac8-final-call-375.jpg` |
| AC-9 | PASS | `x-tp-card-model: bogus-model` (test, preview): both attempts `model_not_found`, card renders `source: fallback` in ~1 s (s01 3 stops, s04 2). A malformed value is ignored (answered by `claude-sonnet-5-5`); so is the header without the test flag |
| AC-10 | PASS | Reload: same `card_id` 28f84bd6…, swapped stops kept, 0 requests. Dismissed next_stop stays gone after reload, 0 requests |
| AC-11 | PASS | Ask something else opens chat seeded with the card; "Can you replace the first stop with something calmer?" → reply names A&W, Din Tai Fung and Bacha Coffee from the plan. `ac11-seeded-chat-375.jpg` |
| AC-12 | PASS | Eval table below: 0 out-of-pool, 0 closed, 0 landside violations, 0 walk claims |
| AC-13 | PASS | r1: 16 rows for 16 model calls (10 answered, 3 × 2 timed-out attempts), all `mode 'card'`, model filled, tokens on the 10 answered (timeouts have no usage) |
| AC-14 | PASS | `analytics_agent_cards` 0 rows, `_k5` 0 rows. Unfiltered: 8 `agent_card_shown` (delay 1, final_call 2, gate_change 2, next_stop 1, plan 2), all preview/test. `has_table_privilege` false for anon and authenticated on all privileges, both views; `reloptions {security_invoker=on}` |
| AC-15 | PASS | Unit tests and adversarial above. SMOKE 13/13 on `dpl_H5rTNKMuEMHjq2Sgv7pD5pUaDDrG` (below). 0 console errors on Home, vibe, collection, amenity and search with a real flight (the only error was a 404 for my made-up test flight TP997) |
| AC-16 | this file | |
| Layout on a real iPhone | **BLOCKED** | Needs Todd's phone |

### Eval r2 (preview `rce14xdg5`, sha `1088c48`; the server code hasn't changed since)

| # | Scenario | Source | Model | Stops | Out of pool | Closed | Landside viol. | Walk claims | Max why | Latency ms | In/out tokens | Cost $ |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| s01 | connecting T3 170 min at 15:00 SGT | model | claude-sonnet-5-5 | 3/3 | 0 | 0 | 0 | 0 | 81 | 4161 | 2106/194 | 0.00615 |
| s02 | connecting T3 200 min | model | claude-sonnet-5-5 | 3/3 | 0 | 0 | 0 | 0 | 83 | 2641 | 2172/202 | 0.00636 |
| s03 | connecting T1 170 min at 00:30 SGT | model | claude-sonnet-5-5 | 3/3 | 0 | 0 | 0 | 0 | 86 | 2880 | 2245/191 | 0.0064 |
| s04 | departing T2 95 min | model | claude-sonnet-5-5 | 2/2 | 0 | 0 | 0 | 0 | 77 | 2660 | 2165/134 | 0.00567 |
| s05 | departing T2 80 min | model | claude-sonnet-5-5 | 2/2 | 0 | 0 | 0 | 0 | 74 | 1986 | 2099/129 | 0.00549 |
| s06 | just_landed T3 | model | claude-sonnet-5-5 | 3/3 | 0 | 0 | 0 | 0 | 86 | 3206 | 2130/198 | 0.00624 |
| s07 | skipped type with minutes | model | claude-sonnet-5-5 | 3/3 | 0 | 0 | 0 | 0 | 89 | 2975 | 2106/204 | 0.00625 |
| s08 | delay +75 on a 90-min connection | model | claude-sonnet-5-5 | 3/3 | 0 | 0 | 0 | 0 | 90 | 2533 | 2112/203 | 0.00625 |
| s09 | next_stop with 2 visited venues | model | claude-sonnet-5-5 | 3/3 | 0 | 0 | 0 | 0 | 82 | 2788 | 2055/184 | 0.00595 |
| s10 | T4 140 min | model | claude-sonnet-5-5 | 3/3 | 0 | 0 | 0 | 0 | 81 | 3155 | 2135/187 | 0.00614 |
| s11 | plan at 65 min (2 stops) | model | claude-sonnet-5-5 | 2/2 | 0 | 0 | 0 | 0 | 81 | 2498 | 2105/145 | 0.00566 |
| s12 | T4 at 03:30 (fill attempt) | fallback (timeout) | (both timed out) | 3/3 | 0 | 0 | 0 | 0 | 87 | 8002 | - | 0 |
| s13 | connecting, arrived T1, departs T3, 200 min | model | claude-sonnet-5-5 | 3/3 | 0 | 0 | 0 | 0 | 83 | 2970 | 2395/200 | 0.00679 |

Summary: 13/13 valid shape, 13/13 stop count, 12 model + 1 fallback, 0 excluded-venue repeats (s09), 0 whys over 90, 0 repairs. **p50 2.88 s, p95 8.0 s** (the p95 is the s12 timeout). **Median tokens 2112 in / 191 out. Median cost per model card $0.0062.** s12 run alone twice: model, 2.4 s and 2.8 s, so the r2 timeout was tail latency, and the card still rendered. s13: last stop in the departure terminal (A&W, T3), header "Arrived T1 · departs T3". Raw: `tasks/cc-25-eval/r1.json`, `r2.json`, `ac9-forced-failure.json`, `s12-probe*.json`.

### Preview SMOKE (`dpl_H5rTNKMuEMHjq2Sgv7pD5pUaDDrG`, browser TZ Asia/Jerusalem, 07:25–07:31 UTC)

| # | Line | Result | Evidence |
|---|---|---|---|
| 1 | `/` capture gate | PASS | "What brings you to Changi?" + Departing / Connecting / Just landed / Skip |
| 2 | Skip | PASS | Home; journeys `0cfbf8e0` `flight_source='skipped'`. No card, 0 card requests |
| 3 | Typed QF1 | PASS | "7h 19m to board · QF1 · SIN → LHR · T1"; `flight_source typed`, v4; journeys `ed19dd3f` |
| 4 | Board picker | PASS | Change flight → SQ221 from the board; journeys `95e59424` `picker`; new card store key, new plan |
| 5 | Home 7 rows | PASS | Explore, Shop, Refuel, Chill, Quick, Work, Comfort; 0 broken images |
| 6 | `/vibe/refuel` 7 | PASS | "7 spots across all terminals" |
| 7 | collection, amenity, search | PASS | coffee-worth-walk "7 of 7 spots"; grain-traders-jewel renders; "laksa" → Kopitiam (T1) |
| 8 | Change flight → Keep QF1 | PASS | `capturedAt` unchanged; card kept, no refetch |
| 9 | Non-SGT TZ | PASS | 10:26 local / 15:26 SGT: Grain Traders (11:00-22:00) "Open until 22:00" |
| 10 | Chat | PASS | Coffee question → T1 cards (dnata Lounge, Starbucks, Toast Box), "You're in T1 with plenty of time" |
| 11 | MCP | PASS | initialize 200 `terminal-plus`; tools/list 4; get_recommendations refuel T1 → 7 (`mcp-session-id smoke-cc25-20261017`) |
| 12 | Events | PASS | ids 1728–1753 include session_start, recommendation_impression |
| 13 | Typed journey row | PASS | `ed19dd3f` QF1 typed departing LHR |

## Test rows (all `is_test = true`; 0 rows with `is_test = false`)

- **events (env preview):** 1629–1753 (125 rows, 0 non-test). Card events among them: agent_card_shown 11, agent_card_tapped 7, agent_card_dismissed 3, amenity_tapped with card_id 3, outcome_eligible with card_id 3, outcome_response with card_id 1.
- **journeys (env preview):** `5086bb1a-f6e7-45fe-bd00-e2e84977bb7b` (SQ221 connecting, AC-1/5/6/7/10/11; reused by the seeded TP99x journeys), `0cfbf8e0-3ee2-484d-9f52-6378000bdce1` (skip), `ed19dd3f-2a96-42ab-99ca-30a1dcfd1aa7` (QF1 typed), `95e59424-4857-4152-97f8-8dbe83b1462e` (SQ221 picker).
- **agent_interactions (env preview), 49 rows:**
  - card (46): bdc83545 1a597dbe 64362078 f17b94c1 f252cca4 a2d09de3 523297eb 1a8f3280 89995add cf4d9821 97e4093e 4d32a3bd 8097f10d e57e2f03 085df87a 4002978c 4542b250 6f310a9b e70e85d9 bd942d20 2bde1eb3 90baabd1 c0c7f3c4 e7bd35fc b5595f3f 8649f9d6 439643fa 6438a69e eceaee4c 06414e4f a5892ab5 50457616 f1bb34cc fe1631c6 faa22ae7 a5bdfeca b391b2bb 097a280c 9b226f1a fd855f55 d3496abd 775d4e61 74dfece4 a0891ade ae6616b8 1c05bdaf (8-char prefixes; full ids by `created_at >= '2026-10-17 07:00Z' and env = 'preview'`).
  - conversational (2): 89ad6a08, 5ce84519 (AC-11 seeded chat, SMOKE line 10).
  - mcp (1): `a9b1b114-fe05-4bae-87dc-f0da473a1e35`.
- `097a280c-fd95-4eac-b0ff-09621fbf0815` was written `is_test = false` by the D5 gate check (a request sent without the test flag on purpose). Flagged by migration `20261017071110`, exactly 1 row asserted. Lesson added.
- Production: 0 card rows in agent_interactions, 0 agent_card events.

## Observations (not failures)

- Plans are dominated by the ranker's order: s01/s02/s06/s07 all chose Butterfly Garden, Din Tai Fung and Bacha Coffee in T3. Expected while `editorial_score` leads ranking (findings: same top picks in every terminal).
- A venue swapped out of a plan can come back in next_stop (Butterfly Garden did). The spec excludes tapped, checked-in and answered venues only.
- Catalogue: two Guardian stores ("Level 2 Shop 29" / "Shop 66") both appear in final_call, because name dedupe sees different names.
- Copy: the cross-terminal header reads "Arrived T1 · departs T3" for a *departing* passenger too (D3 wording fits connecting). Copy is in `src/lib/agentCardCopy.ts`.
- The strip text uses the first stop's terminal ("Your T1 plan" on a T1→T3 journey).
- The Quick-options chip on the gate card isn't tracked: `agent_card_tapped.target` has no value for it (stop, swap, chat, expand only).
- Plans can include lounges (SilverKris, dnata) for passengers who may not have access.
- The amenity page still shows "5min from gates" (placeholder walk time, CC-14); the cards never do.

## Follow-ups

1. Move `/api/chat` onto `rankAmenities` (D3). Chat's private `preFilter`/`applySmart7` pool is the outlier now.
2. `/api/chat` caps the query at 500 characters and history at 10 entries, but not each history entry's content (finding h). The firewall rate limit before launch posts is with Todd.
3. Real-iPhone layout sign-off (BLOCKED, Todd).
4. Calibrate the UNCALIBRATED numbers once real cards exist; consider excluding swapped-out venues from next_stop, and lounge access.
5. Copy pass on the cross-terminal header for departing passengers (Todd).
6. Add `quick_options` to the `agent_card_tapped` target enum if the chip should be measured.
