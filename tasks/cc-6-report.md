# CC-6 report: chat model, payload diet, per-turn telemetry, display fixes

**Status: READY TO SHIP, not shipped.** Branch `cc-6-chat-diet` (10 commits on `origin/main` `df450f8`, CC-18). Rebased preview `lt5hcgq0y` (`094ad1f`): SMOKE 13/13 PASS. Production items wait for the merge.

## Summary

- Chat moves off `claude-sonnet-4-5-20250929` (retires 30 Nov 2026) to `claude-sonnet-5-5`, chosen by a 20-prompt eval. `claude-sonnet-4-6` is the fallback. Every model ID lives in `api/lib/models.ts`. `ANTHROPIC_MODEL` overrides the default per environment.
- Median input tokens per turn fall **37.5%** on the same model: 4,992 → 3,119 with `claude-sonnet-4-5-20250929`, paired over 19 prompts. The diet as specified gave 30.0%. The extra 7.5 points come from "diet+" (below), a deviation that needs your sign-off.
- Every chat turn writes one `agent_interactions` row with `waitUntil`. The row holds the model that answered, input and output tokens, latency, shown slugs, `env`, `is_test` and `journey_id`.
- Opening hours on chat cards are real. Replies render bold, italics and lists, with no raw `**`.
- The standing Jewel decision (3 Oct) is in the chat prompt. Jewel violations went from 3 to 0 on the eval.

## Gates

| Gate | Result | Evidence |
|---|---|---|
| G1 model IDs in api/, src/, scripts/ | PASS | `api/chat.ts:504` `claude-sonnet-4-5-20250929`; `api/lib/agent.ts:286` `claude-sonnet-4-20250514`. 0 in `src/`, 0 in `scripts/` |
| G2 production chat answers | PASS | 3 Oct 08:39Z, tagged `POST terminalplus.app/api/chat`: 200 in 9.3 s, 3 T3 coffee cards. Production was `d1ccd07`, whose `api/chat.ts` pins `claude-sonnet-4-5-20250929`. The response doesn't echo the model, so this rests on the deployed source |
| G3 dead functions have 0 callers | PASS | `callClaude`, `parseResponse`, `buildContextMessage`, `calculateDerivedContext`: 0 references in api/, src/, scripts/, tests/. `queryAmenities` and `queryRouteMatch` stay (tests/adversarial and api/mcp.ts use them) |
| G4 ChatPanel reachable | PASS | esbuild metafile from `src/main.tsx`: `main.tsx → App.tsx → ChatBubble.tsx → ChatPanel.tsx`. Re-proved after the CC-18 rebase (43 reachable files) |
| G5 (added) a preview turn writes its row | PASS | First preview, 1 tagged turn: 200, 1 row with model, tokens and `is_test=true` |

## Decisions and deviations

| Item | What | Why / status |
|---|---|---|
| Token gate basis | Same model: baseline vs diet, both on `claude-sonnet-4-5-20250929` | Todd, 3 Oct. Sonnet 5.x tokenizes the same text into ~30–40% more tokens (measured: 3,496 on 4.5 vs 4,869 on 5-5 for the same payload) |
| **Diet+** (deviation) | The description cell is empty when an editorial note exists; the system prompt no longer repeats the column header | The spec'd diet reached 30.0% (paired medians), short of 35%. The note is about half of each row's tokens and the description about a sixth, and they overlap. Diet+ reached 37.5% with validity 20/20 and slug quality 19/20 (diet: 18/20). **Needs your sign-off.** Separate commit `f3faf05`, so it can be reverted alone |
| **Fallback on a stall, not a fixed split** (deviation from the plan) | Streamed call. The primary keeps the full 15 s while producing output. It falls back on no output by 6 s, 529/overload, or an unknown model; the fallback gets the remaining time (≥3 s) | The planned 10 s primary cutoff failed 3 of 20 healthy baseline turns (the primary was still streaming; the fallback got 5 s). See lessons.md, 3 Oct |
| Jewel by passenger type | Prompt states the rule; turns carry "Passenger type" and "Minutes to boarding"; `tp_journey_context` v4 stores `journey_type` | Todd's standing decision, 3 Oct. Unknown type → the connecting rule (my default, flag if you want otherwise). v3 records stay unknown (connecting vs just landed can't be inferred) |
| 4th Jewel prompt | j4: departing at 150 min, checks the "before immigration" label | The 3 requested prompts can't test the label (j2 must decline) |
| `ANTHROPIC_MODEL \|\| default` | `\|\|` instead of `??` | An empty env value falls back to the default instead of sending `model: ""` |
| Test-only `debug` block | Only on `x-tp-test: 1`: model, fallback, stop reason, JSON validity, raw and feasible slugs, minutes | The response drops non-feasible slugs silently; the eval needs what the model chose |
| Client changes | `src/services/chatService.ts` sends `x-tp-test` and the events' `session_id`/`journey_id`; `src/lib/telemetry.ts` exports `telemetryIds()` | Without them a `tp_test` browser turn would log `is_test=false` |
| `@vercel/functions` | New dependency (server only) | `waitUntil` for the off-path telemetry insert |
| `between_tools` on 5-5 | Not used; adaptive thinking at `low` effort | 1 of 44 5-5 turns ran to `max_tokens` (n11, 14.4 s); the rest ≤10 s. Switch if production latency logs show a long tail |
| Server-side refusal fallback | Not enabled | On 5-5 it only retries cyber/frontier_llm declines, which don't fit this workload; refusals get a polite reply via `stop_reason` |

## Files

| File | Change |
|---|---|
| `api/lib/models.ts` | new. `CHAT_MODEL` (`claude-sonnet-5-5`), `FALLBACK_MODEL` (`claude-sonnet-4-6`), `chatParams()` (5-5: effort low; 4-6: thinking off, effort low; others: none), `PRICE_PER_MTOK` |
| `api/chat.ts` | compact amenity block; stable-first prompt; Jewel rule; passenger type and minutes to boarding per turn; streamed call with stall/overload/unknown-model fallback in 15 s; reply by block type; refusal reply; `max_tokens` 2048; `waitUntil` log; test-only debug; `x-tp-test` in CORS |
| `api/lib/chatPayload.ts` | new, pure: `formatAmenityBlock`, `parseReply`, `replyText` |
| `api/lib/agentTelemetry.ts` | `logChatTurn()` (service role, never throws, 500/1,000-char caps, no IP/UA) |
| `api/lib/agent.ts` | 4 dead functions and 2 dead types deleted (one named a retired model) |
| `supabase/migrations/20261003084830_agent_interactions_chat_usage.sql` | `model`, `input_tokens`, `output_tokens`, nullable. Applied 3 Oct; grants unchanged (anon/authenticated: 0 table and 0 column privileges after) |
| `src/components/ChatPanel.tsx` | hours via `formatHours` (wrapping lines); replies via `parseChatMarkdown` as React elements |
| `src/lib/chatFormat.ts` | new, 0 deps, no regex lookbehind (Safari <16.4) |
| `src/services/chatService.ts`, `src/lib/telemetry.ts`, `src/hooks/useChat.ts` | test header, telemetry ids, `journeyType` |
| `src/context/JourneyContext.tsx`, `src/pages/FlightContextCapture.tsx` | `tp_journey_context` v4: `journey_type` |
| `tests/chatPayload.test.ts`, `tests/chatFormat.test.ts`, `tests/chatContext.test.ts` | 17 new unit tests (34 total, CI glob) |
| `tests/chat-eval/prompts.json`, `tests/chat-eval/run.ts` | 24 prompts; runner with `--rescore` |
| `tasks/cc-6-eval/*.json` | every run's raw results; `agent_interactions-row-ids.txt` |

## Eval

Method: `npx tsx tests/chat-eval/run.ts --base <preview> --label <arm>`, sequential, every request `x-tp-test: 1`. Validity = the reply parsed as JSON with `message` and `recommended_slugs`. Slug quality = every chosen slug was feasible and the count fits the prompt (3–5; 0 out of scope; ≤5 open). Tokens and cost come from the logged rows. Jewel = cards scored by the 3 Oct rule (the original arms re-scored with `--rescore`).

| Arm | Prompts | 200 | Validity | Slug quality | Adversarial | Jewel violations | p50 | p95 | Median in | Median out | $/turn |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Baseline, first run (10 s split; superseded) | 20 | 17 | 16/20 | 17/20 | 4/5 | a2 | 8.8 s | 17.1 s | 5,384 | 323 | 0.0213 |
| Baseline (4.5, JSON payload) | 20 | 19 | 19/20 | 16/20 | 3/5 | a2 | 8.5 s | 10.7 s | 4,992 | 315 | 0.0208 |
| Diet, spec'd columns (4.5) | 20 | 20 | 20/20 | 18/20 | 2/5 | a2 | 7.1 s | 10.2 s | 3,496 | 214 | 0.0148 |
| Diet+ (4.5) | 20 | 20 | 20/20 | 19/20 | 3/5 | a2 | 7.4 s | 10.5 s | 3,119 | 247 | 0.0137 |
| `claude-sonnet-5-5`, effort low (diet) | 20 | 20 | 20/20 | 19/20 | 3/5 | a2 | 4.5 s | 6.6 s | 4,869 | 365 | 0.0146 |
| `claude-sonnet-4-6`, thinking off, effort low (diet) | 20 | 20 | 20/20 | 19/20 | 3/5 | a2 | 6.8 s | 11.8 s | 3,497 | 205 | 0.0148 |
| **Final**: 5-5 + diet+ + Jewel rule | 24 | 24 | 24/24 | 19/24 | 4/5 | **0** | 4.7 s | 9.7 s | 3,503 | 331 | 0.0123 |

- **STEP 4:** 5-5 and 4-6 tied on validity (20/20) and slug quality (19/20); 5-5 won on p50 (4.5 s vs 6.8 s). The 4.5 baseline couldn't win.
- **Token gate (same model, paired over 19 prompts):** baseline 4,992 → diet 3,496 (−30.0%, FAIL) → diet+ 3,119 (**−37.5%, PASS**). Median per-prompt cut: 32.6% and 41.9%. n15 (0 amenities) grew 80 tokens: the prompt's fixed part.
- **Baseline 500s:** n12 (a long curated-route reply) failed at the 15 s budget once on 4.5; production answered it in 12.8 s the same evening. Same budget as production, so a pre-existing ceiling, not a CC-6 regression. The first baseline's 3 failures were my 10 s split (fixed).
- **Final slug quality 19/24:** misses are a1 (recommends venues for an off-topic question, every arm), j4, and n08, n09, n11 picking 2 at 00:35 SGT. The replies cite closures; re-run at the same hour on the pre-rule deployment, n08 also picked 2. Night-time scarcity plus variance, not the Jewel rule.
- **Markdown:** 4.5 put `**` in 7–12 of 20 replies; 5-5 in 0 to 1. The renderer handles both.

### Jewel violations, before and after the rule

| Prompt | Rule | Before (pre-rule 5-5) | After (final) |
|---|---|---|---|
| a2 type unknown, 45 min | connecting rule, <180 | Jewel cards: violation | 0 Jewel cards: "With only 45 minutes to boarding, I'd skip Jewel" |
| j1 connecting, 170 min | <180 | no cards (the feasibility filter drops all 24 transit Jewel rows), but text: "a Jewel trip is doable" | "I'd skip Jewel this time. As a connecting passenger you'd need to clear immigration out and back in" |
| j2 departing, 80 min | <90 | 2 Jewel cards: violation | 0: "you'd need … at least 90 minutes in hand" |
| j3 just landed | always | 4 Jewel cards (allowed) | 4 Jewel cards (allowed) |
| j4 departing, 150 min | label required | 2 Jewel cards, no label: violation | 2 Jewel cards: "as long as you do it before immigration" |
| **Total** | | **3** (a2, j2, j4) | **0** |

## Fallback

| Check | Result | Evidence |
|---|---|---|
| Local mock of the Messages API, real handler | PASS, 5/5 | slow-but-streaming → 200 at 11.5 s, no fallback; stall → fallback at 6 s, 200 at 7.1 s on 4-6; 529 → 200 at 1.1 s on 4-6; unknown model (404) → 200 on 4-6; over budget → 500 at 15.3 s, row `error:timeout`. Rows (`env=development`, `is_test`): 2f00d767, 3e32e456, b706d857, d2b4a090, 172869ad |
| Forced fallback on a preview, `ANTHROPIC_MODEL` bogus | PASS | 3 tagged turns 200; logged `model = claude-sonnet-4-6` on f6807cae, de2cdfa0, cd1b3275; log: `claude-cc6-no-such-model: model_not_found; retrying on claude-sonnet-4-6 (14634 ms left)`. Env var removed after |

## Browser (preview, 375 px, `tp_test=1` before first load)

| Check | Result | Evidence |
|---|---|---|
| Hours chip | PASS | Cards show `Monday-Sunday: 06:00-01:00`, `Monday-Sunday: 24/7`, `07:30-23:00`; 0 clipped (DOM `scrollWidth`). First pass truncated "Monday-Sunday: 0…" at 375 px; fixed (`c45fb71`) and re-checked |
| Bold | PASS | `<strong>` Bacha Coffee, Starbucks, The Coffee Bean & Tea Leaf, Ya Kun Kaya Toast; no `**` in the bubble text |
| `tp_journey_context` v4 | PASS | skip path: `schema_version 4, journey_type "skipped"`; typed QF1: `departing`; board pick TR472: `departing` |
| Rows | PASS | 037b091e, 3e937ccc (`preview`, `is_test`, 5-5, tokens, `journey_id` set; journeys ac503544, f764b498 are `is_test`) |

## Rebase onto `origin/main` and preview SMOKE

Rebased twice: onto CC-16 (`2d1d581`), then CC-18 (`df450f8`). Overlap: `src/lib/telemetry.ts` (auto-merged: CC-18's file + `telemetryIds()`), `package.json`/lock (auto-merged: + `@vercel/functions`; `npm ci` clean), `tasks/lessons.md` (both lessons kept). After the second rebase: reachable-src typecheck 35 errors on `origin/main` and on the branch, identical sets; api tsc exit 0; 34/34 unit; 11/11 adversarial; build passes; 0 model IDs outside `models.ts`. `useFlightUpdates` spreads the old journey, so `journey_type` survives flight updates.

SMOKE on `lt5hcgq0y` (`094ad1f`), 4 Oct 06:03–06:07Z (14:03 SGT), browser TZ Asia/Jerusalem:

| # | Line | Result | Evidence |
|---|---|---|---|
| 1 | Capture gate | PASS | "What brings you to Changi?" with Departing / Connecting / Just landed / Skip |
| 2 | Skip | PASS | Home "Afternoon picks"; journey 1d77b6e3 `skipped` |
| 3 | Typed QF1 | PASS | Add-flight bar → Departing → T1 → manual QF1 → "Terminal T1 · Boards 22:45 → LHR" → bar "8h 41m to board · On Time, QF1 · SIN → LHR, T1"; v4 `journey_type departing` |
| 4 | Board picker | PASS | Change flight → 145 departures → TR472 (T1, 16:00) → "1h 19m to board · On Time, TR472 · SIN → KUL"; journey 8a44b538 `departing/picker` |
| 5 | Home | PASS | 7 rows, 31 of 31 images, 0 broken, 32 count cards |
| 6 | `/vibe/refuel` | PASS | "7 spots across all terminals" |
| 7 | Collection, amenity, search | PASS | coffee-worth-walk "7 of 7 spots"; grain-traders-jewel renders; "laksa" → Kopitiam (T1); 0 console errors |
| 8 | Change flight → Keep QF1 | PASS | 1 "Keep QF1"; `tp_journey_context` byte-identical after |
| 9 | Hours follow SGT | PASS | Jerusalem 09:06, SGT 14:06: Grain Traders (11:00–22:00) "Open · Until 22:00" |
| 10 | Chat | PASS | "…before your 22:45 QF1 boarding…", 3 T1 cards with real hours, bold rendered; row 0497fa67 (5-5, 6,580/280 tokens, journey 4a519209, `is_test`) |
| 11 | MCP | PASS | initialize 200 (`2025-03-26`, `terminal-plus`), 4 tools, `get_recommendations` refuel/T1 → 7; row a40ba5ae, key `smoke-cc6-20261004`, `is_test` |
| 12 | Recent events | PASS | session_start (payload `utm_source: cc6_smoke`: CC-16 attribution intact), recommendation_impression 12, capture_opened 4, search_performed, amenity_detail_dwell, flight_not_found; all `is_test` |
| 13 | Typed journey | PASS | 4a519209 QF1 `departing/typed`, `is_test` |

## Acceptance

| Item | Status | Evidence |
|---|---|---|
| Median input tokens −≥35% (logged) | PASS with diet+ (−37.5%); the spec'd diet alone −30.0% | Eval table, same model |
| Eval table: baseline, diet, 5-5, 4-6 | PASS | Above |
| Forced fallback logs FALLBACK_MODEL | PASS | f6807cae, de2cdfa0, cd1b3275 |
| Production browser turn: real hours, no `**` | PENDING merge | Passed on preview (above) |
| 1 row per test turn, model and tokens filled | PASS | Every run `rows_logged n/n`; error turns log `error:<kind>` with null model by design |
| `npm run test:adversarial` 11/11 | PASS | After the final rebase |
| No model ID outside `api/lib/models.ts` | PASS | `grep -rnE 'claude-(sonnet\|opus\|haiku\|fable\|mythos\|3\|instant)' api/ src/ scripts/ tests/`: 0 outside it |
| 0 test rows with `is_test=false` | PASS | 166 rows (161 preview, 5 development), 0 non-test: `tasks/cc-6-eval/agent_interactions-row-ids.txt` |

## After merge (production)

1. `main` → production deploy. `ANTHROPIC_MODEL` is set in no environment (`vercel env ls`: 0), so production runs `claude-sonnet-5-5`.
2. Browser on terminalplus.app, `tp_test=1` first: 1 chat turn with real hours and no `**`; its row has `env=production`, `is_test=true`, model and tokens.
3. SQL: the production rows from that check are `is_test`.

Rollback: Vercel Instant Rollback to the current production deployment (`df450f8`). The migration is additive and nullable, so old code ignores it. A v4 `tp_journey_context` read by v3 code is re-stamped v3 and keeps working (the extra `journey_type` field is ignored).

## Findings for other prompts (not changed here)

- **CC-5:** 27 of 54 `SIN-JEWEL` rows have `available_in_tr = true`, though Jewel is landside. The chat feasibility filter's 8-minute walk cap drops every transit-available Jewel row whenever minutes are known. Mentioning "Jewel" sets the user's terminal to `SIN-JEWEL`, so the model says "you're already at Jewel". `isTransit` comes from `arrivingFlight`, which includes just-landed passengers.
- **chat.ts:** the prompt's `extracted_context.available_minutes` never reaches `extractedContext` (the code reads `availableMinutes`). Own extraction covers it.
- **Types:** `AmenityDetail.opening_hours` is typed `Record<string, string>`; the column is text.
- **CC-9:** `upgrade_amenities.py:139` and `generate_vibe_descriptions.py:9` name `claude-haiku-4-5-20251001` (root scripts, outside the grep scope).
- **Env:** the `ANTHROPIC_API_KEY` in local `.env.local` returns 401; Preview's works.
