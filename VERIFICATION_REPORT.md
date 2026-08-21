# Snapshot Verification Report
Date: 2026-07-05 | Build: PASS | Prior audit: 2026-04-16 (`.claude/worktrees/gracious-lehmann/AUDIT_REPORT.md`)

**Path note:** the brief's project root (`~/Desktop/terminal-plus-frontend`) does not exist. Actual root is `/Users/toddbyrne/terminal-plus-frontend` (matches session cwd). Report saved there per the original instruction's intent.

**Repo state note:** `git status` at the start of this session already showed 5 modified files (`api/lib/agentPrompt.ts`, `package-lock.json`, `package.json`, `src/pages/AmenityDetailPage.tsx`, `src/pages/CollectionDetailPage.tsx`) and several untracked paths (`.claude/`, `CLAUDE.md`, `RALPH_LOOP_PROMPT.md`, `mcp-publisher`, `scripts/resolve-place-ids.ts`, `tasks/`). These pre-date this audit — nothing below was touched during this investigation (Read/Bash/grep only, zero `Edit`/`Write` calls against source).

## Verdicts

| # | Finding | Verdict | Evidence | Fix effort |
|---|---------|---------|----------|-----------|
| F1 | Telemetry stub | **CONFIRMED** (and worse: unused) | [src/lib/eventLogger.ts:23-31](src/lib/eventLogger.ts#L23-L31); 0 live import sites | S |
| F2 | Static JSON in code paths | **FIXED** for MVP/production surfaces | All 5 MVP pages query Supabase directly; JSON consumers are DEV-gated or fully orphaned | — |
| F3 | Ranking bypasses editorial_score | **PARTIAL** — chat API fixed since prior audit, UI still broken | [api/chat.ts:285,308](api/chat.ts#L285); [src/pages/VibePage.tsx:64](src/pages/VibePage.tsx#L64); [src/pages/SearchPage.tsx:52](src/pages/SearchPage.tsx#L52); [src/pages/CollectionDetailPage.tsx](src/pages/CollectionDetailPage.tsx) | M |
| F4 | Hardcoded display counts | **CONFIRMED** | No shared config exists; magic numbers 7 / 21 / 40 scattered independently | S |
| F5 | console.log in prod paths | **CONFIRMED**, but narrow blast radius | 251 total in `src/`, only 3 in actually-routed MVP surfaces; 1 runs unconditionally in a render body | S |

## Detail per finding

### F1 — Event telemetry stub

`src/lib/eventLogger.ts` exists (also duplicated in a stray nested `./terminal-plus-frontend/` copy and in `src_backup_20250916_180144/` — both cruft, ignored below).

```
12:  export const logEvent = async ({
...
23:    // Log to console (for now)
24:    console.log("[Event]", { anonId, action, label, path });
25:
26:    // Optional: send to Supabase or your analytics backend
27:    // await fetch("/api/log-event", {
```
[src/lib/eventLogger.ts:12-31](src/lib/eventLogger.ts#L12-L31) — confirmed stub, fetch is commented out, no Supabase/PostHog write.

**Call-site count:** `grep -rn "logEvent(" ./src ./api` (excluding backups/duplicates) → **0 live import sites** of this specific function. The only other `logEvent` usages are:
- [src/pages/auth-page.tsx:7](src/pages/auth-page.tsx#L7) — imports `logEvent` from `@/utils/analytics`, a module that **does not exist** (`ls` confirms no `src/utils/analytics.ts`). This page is also not registered in the live router (`src/App.tsx` lazy-imports only `HomePage, VibePage, CollectionDetailPage, AmenityDetailPage, SearchPage, ProfilePage, MapPage, SavedPage` for MVP + 4 DEV-gated legacy pages — `auth-page` isn't among them). Dead code with a broken import that happens not to break `vite build` because it's never referenced from the entry graph.
- [src/services/monitoring.ts:65](src/services/monitoring.ts#L65) — `MonitoringService.logEvent()` is a real implementation (PostHog `.capture()` + GA4 `gtag`), but `grep -rn "MonitoringService.logEvent"` across `src/` and `api/` → **0 call sites**. Dead code.

**Verdict:** CONFIRMED as STUB, and additionally the file is orphaned — nothing in the live app calls it at all. There is no working event telemetry anywhere in the reachable codebase.

### F2 — Static JSON amenity data

Exact filenames from the brief (`syd_t1.json`, `lhr_t2.json`, `sin_t1.json`, `sin_jewel.json`, `amenities_fallback.json`) only appear as literal imports in:
- `src/hooks/useAmenities 2.ts` (iCloud-duplicate cruft file, unimportable — filename has a space, not a valid ES module specifier)
- `src/scripts/importSINAmenities 2.ts` / `3.ts` (duplicate scripts, not part of the app)
- `src/services/shoppingTrailService.ts:288-289` (real file, but see below — orphaned)

`lhr_t2.json` does not exist anywhere in the repo (`find` returns nothing) — confirms LHR data is not shipping.

The 6 live MVP pages (`HomePage`, `VibePage`, `SearchPage`, `CollectionDetailPage`, `AmenityDetailPage`, `SavedPage`) all query `supabase.from('amenity_detail')` directly — verified by reading each file's data-loading code (e.g. [src/pages/VibePage.tsx:59-65](src/pages/VibePage.tsx#L59), [src/pages/AmenityDetailPage.tsx:142](src/pages/AmenityDetailPage.tsx#L142)).

Files that *do* import `@/data/amenities.json` (`guide-view.tsx`, `transit-guide/[airport].tsx`, `explore-terminal.tsx`, `simplified-explore.tsx`, `amenity-detail.tsx`) are either:
- lazy-loaded only behind `{import.meta.env.DEV && (...)}` in [src/App.tsx:90-95](src/App.tsx#L90) (stripped/unreachable in a production build), or
- unreferenced from the entry graph (`amenity-detail.tsx` is only imported by `Smart7App.tsx`, `routes-mvp 2/3.tsx`, `routes-updated 2/3.tsx` — none of which are wired to `index.html`'s actual entry `/src/main.tsx`).

`src/services/shoppingTrailService.ts` (imports `sin_t1.json`/`sin_jewel.json`) is itself only reachable through `LiveLeaderboard.tsx`, `locationManager.ts`, `aiTrailGenerator.ts`, `services/index.ts` — all four have **zero** consumers anywhere else in `src/` (verified by grep). Entire chain is orphaned.

**Verdict:** FIXED for the shipping product. Static JSON still exists in the repo and in dead/DEV-only code, but it does not reach the production bundle's live routes. SYD/LHR data specifically: SYD JSON file exists (`src/data/syd_amenities.json`) but only reachable via the same dead/DEV chain; LHR JSON doesn't exist at all.

### F3 — Ranking bypasses editorial_score

Prior audit (2026-04-16, §3.1) flagged these exact gaps:
```
145: | api/chat.ts:283 | fallback query | Yes | **No** |
     | api/chat.ts:306 | second fallback | Yes | **No** |
     | src/pages/SearchPage.tsx:52 | search query | Yes | **No** |
```

**Re-checked now:**
- [api/chat.ts:285](api/chat.ts#L285) and [api/chat.ts:308](api/chat.ts#L308) **now have** `.order('editorial_score', { ascending: false, nullsFirst: false })` — this gap has been **fixed** since the prior audit.
- [src/pages/SearchPage.tsx:52-54](src/pages/SearchPage.tsx#L52) — **still broken**, unchanged: `.select('name, amenity_slug, terminal_code, vibe_tags, price_level, opening_hours').or(...).limit(20)` — no `editorial_score` in the select list or an `.order()` clause.
- [api/lib/agent.ts:114](api/lib/agent.ts#L114) — confirmed correct (`.order('editorial_score', ...)`), consistent with the prior audit's note that it's the reference implementation.

**Two live UI ranking paths not covered by the prior audit's F3 table, and both bypass editorial_score entirely:**
- [src/pages/VibePage.tsx:59-65](src/pages/VibePage.tsx#L59) — query doesn't select `editorial_score` at all, orders by `.order('name')`. Final selection goes through [src/utils/smart7Select.ts](src/utils/smart7Select.ts) which ranks purely by open-now status + terminal proximity + alphabetical name — no reference to `editorial_score` anywhere in that file.
- [src/pages/CollectionDetailPage.tsx:106-135](src/pages/CollectionDetailPage.tsx#L106) — orders the junction query by `priority` (not `editorial_score`), then runs results through `selectScoredAmenities()` in [src/utils/contextualScoring.ts](src/utils/contextualScoring.ts) — `grep -n "editorial_score" contextualScoring.ts` returns **zero matches**.

**`SmartRecommendationEngine` / `calculateRelevanceScore`:** confirmed dead — every match is in `src_backup_20250916_180144/`, `src/lib/SmartRecommendationEngine 2.ts` / `3.ts`, or other numbered-duplicate files. Zero live import sites.

Per the brief, `api/mcp.ts` was not opened directly; its one relevant line surfaced incidentally in a multi-file grep (`api/mcp.ts:368` shows `.order('editorial_score', { ascending: false })`), consistent with the prior audit's note that it already had ordering present at the point it examined it — not independently re-verified here per the do-not-touch instruction.

**Verdict:** PARTIAL. The specific chat-API gap from the prior audit is fixed. But the finding as a category is still CONFIRMED live: two customer-facing UI surfaces (Vibe page and Collection detail page, likely the two highest-traffic recommendation surfaces in the MVP) rank without any reference to `editorial_score`, and `SearchPage.tsx` — flagged three runs ago — is still unfixed.

### F4 — Hardcoded display counts

No shared display-count config exists anywhere (`grep -rn "DISPLAY_COUNT\|displayCount\|DISPLAY_LIMIT\|MAX_DISPLAY\|SMART7_COUNT\|POOL_SIZE"` → zero matches in `src/` or `api/`).

Independent magic numbers, each hardcoded separately:

| Site | Number | Role |
|---|---|---|
| [src/utils/smart7Select.ts:46](src/utils/smart7Select.ts#L46) | `limit = 7` | default param, used by VibePage |
| [src/pages/VibePage.tsx:85](src/pages/VibePage.tsx#L85) | `.slice(0, 7)` | terminal-filtered branch, same page |
| [src/utils/contextualScoring.ts:327](src/utils/contextualScoring.ts#L327) | `limit = 7` | default param, used by CollectionDetailPage |
| [api/lib/agent.ts:135](api/lib/agent.ts#L135) | `results.slice(0, 21)` | pool cap before handing to LLM |
| [api/chat.ts:301](api/chat.ts#L301) / [api/chat.ts:311](api/chat.ts#L311) (approx, `.limit(40)`) | `40` | fallback pool cap, different number than agent.ts's 21 |
| [src/pages/VibesFeedMVP.tsx:521](src/pages/VibesFeedMVP.tsx#L521) | `.slice(0, 7)` | (this page is not in the current MVP route list; flagged for completeness) |

The agent path (`api/lib/agent.ts`) caps its candidate pool at 21 but does **not** itself narrow to a 7-9 display count — [api/lib/agentPrompt.ts](api/lib/agentPrompt.ts) contains no numeric instruction telling the LLM how many to recommend (`grep -n "7\|9\|recommend"` shows only qualitative guidance, no count). So the "7-9 shown from ~21" spec is enforced only in the UI (hardcoded `7`, not `7-9`), not consistently in the agent, and MCP's behavior wasn't independently checked (do-not-touch).

**Verdict:** CONFIRMED. Not a single shared constant; three different pool/display sizes (7, 21, 40) live in three different files with no cross-reference.

### F5 — console.log in production paths

`grep -rn "console\.log\|console\.warn"` across `src/`, excluding `.test.`/`.spec.`/`__tests__`/`debug` files and backup/duplicate directories: **251 matches**.

Top 10 offending files:
```
44  src/examples/vibeStorageUsage.ts        (examples dir — not imported by app)
14  src/services/LocationDetectionService.example.ts (.example.ts — not imported)
12  src/services/smartQueue.ts
 9  src/utils/supabaseMVPIntegration.ts
 8  src/utils/storageManager.ts
 8  src/utils/performanceMonitor.ts
 8  src/pages/FlightContextCapture.tsx
 7  src/utils/vibeIntegrationTests.ts        (test-named, but not excluded by *.test.ts pattern)
 6  src/lib/supabase/queries.ts
 6  src/hooks/useSimpleData.ts
```
58 of the 251 (23%) sit in two files that are demonstrably not part of the bundle (`examples/`, `.example.ts`) — inflates the raw count.

**Narrowed to files actually reachable from the live router** (`App.tsx` + the 8 MVP pages): only **3** occurrences total —
- [src/App.tsx:55](src/App.tsx#L55) — `console.log('[Journey] Gate check...')` inside a `useState(() => {...})` lazy initializer. This runs synchronously **during the render phase** (once, on mount) — not inside `useEffect` or a handler, matching the brief's specific concern about render-body logging. Not gated behind `DEV`; ships in production.
- [src/pages/HomePage.tsx:325,332](src/pages/HomePage.tsx#L325) — both are inside `if (import.meta.env.DEV) { ... }` guards, so Vite dead-code-eliminates them from production builds. Not a real production leak.

**Verdict:** CONFIRMED as a category (251 raw hits, real cruft), but the actual production/render-body risk is narrow: one unconditional `console.log` in a render body (`App.tsx:55`), everything else either dev-gated or in unreachable files.

## Proposed fix scope

*For approval only — nothing below has been implemented.*

1. **F3 (M, highest priority):** Add `editorial_score DESC` ordering + select column to `src/pages/SearchPage.tsx` (still open from 3 audits ago), and rework `VibePage.tsx`/`smart7Select.ts` and `CollectionDetailPage.tsx`/`contextualScoring.ts` to factor in `editorial_score` — these are customer-facing surfaces, not just fallback paths.
2. **F1 (S):** Either wire `eventLogger.ts` to a real sink (Supabase table or PostHog) and call it from the live pages, or delete it along with the orphaned `auth-page.tsx` (broken import) and dead `MonitoringService.logEvent`. Telemetry schema work (the next deliverable per the brief) should design the sink first — this item is superseded by that work, not a prerequisite for it.
3. **F4 (S):** Introduce one shared `RECOMMENDATION_DISPLAY_COUNT = 7` (or a `{min:7,max:9}` range) constant and reference it from `smart7Select.ts`, `contextualScoring.ts`, `VibePage.tsx`, and add matching guidance to `agentPrompt.ts`'s LLM instructions. Do not touch `api/mcp.ts` without separate approval.
4. **F5 (S):** Remove/guard the one unconditional `console.log` in `App.tsx:55` (wrap in `import.meta.env.DEV` like HomePage already does). The 251-count cruft in `examples/`/`.example.ts`/dead services is cosmetic — low priority, candidate for the same cleanup pass that would delete the F2 dead JSON-import chain.
5. **F2:** No action needed for MVP correctness — already fixed in practice. Optional: delete the dead `shoppingTrailService.ts`→`LiveLeaderboard`/`aiTrailGenerator`/`locationManager` chain and the DEV-only legacy pages as part of the broader dead-code cleanup already scoped in the prior audit (§1.1).

## Acceptance criteria

- [x] Build passed before investigation started (`npm run build` — PASS, see full output captured during this session)
- [x] All 5 findings have a verdict with path + line evidence (above)
- [x] Zero files modified — `git status` after this audit shows the same 5 modified + 6 untracked entries present at session start; nothing new. No `Edit`/`Write` tool was invoked against any source file during this audit.
- [x] Report exists at `VERIFICATION_REPORT.md` (project root: `/Users/toddbyrne/terminal-plus-frontend/VERIFICATION_REPORT.md`)
- [x] Proposed fix scope above is unimplemented, awaiting approval.

---

## Fix Execution

Date: 2026-07-05 | Approved plan: F3 + F4 + F5 ranking parity. All three fixes implemented, verified, committed. Full baseline detail in [tasks/parity-baseline.md](tasks/parity-baseline.md).

### Deviations from plan (flagged as they came up, not after the fact)

1. **Baseline capture:** planned to hit `api/chat.ts`/`api/mcp.ts` via `vercel dev`. It failed with `Error: The specified token is not valid. Use \`vercel login\` to generate a new token.` `vercel login` requires interactive account auth — not something to trigger for a read-only baseline, so I didn't. Fell back to the plan's stated contingency: replicated `api/chat.ts`'s exact query via direct SQL (deterministic, and that file's ranking logic isn't touched by this fix scope anyway, so it's a valid regression reference). `api/mcp.ts` was never queried at all, per the protected-files rule — noted as an intentional gap, not a silent skip.
2. **CollectionDetailPage junction query — `foreignTable` order:** the plan's preferred approach was `.order('editorial_score', { foreignTable: 'amenity_detail' })` on the `collection_amenities` → `amenity_detail!inner(*)` join. Tested it directly against live Supabase before shipping it (see script output below) — it's a no-op on this embedded relation; result order was unchanged from an unordered baseline. Dropped it and left a comment explaining why, rather than ship an order clause that silently does nothing. Not a problem in practice: `contextualScoring.ts`'s comparator (touched in the same fix) already re-sorts by `editorial_score DESC` regardless of fetch order, so the page's actual output is still correct — just not via defense-in-depth at the SQL layer for this one query.
3. **Scope expansion beyond the 3 named UI files:** confirmed during research (and again empirically below) that `smart7Select.ts` and `contextualScoring.ts` — not `api/mcp.ts`/`api/lib/agent.ts`/`api/lib/search.ts`, none of which were touched — had to be edited too, since they're what actually determines VibePage/CollectionDetailPage's display order after fetch. Flagged in the plan before executing; not a surprise here.

### Before / after — real code, real data, real browser

**VibePage** (vibe=refuel, terminal=SIN-T1) — ran the actual `smart7Select.ts` via `tsx` against the live 44-row Supabase pool, before and after the fix:

| Rank | Before | editorial_score | After | editorial_score |
|---|---|---|---|---|
| 1 | Burger King (SIN-T1) | 11 | **Kopitiam (SIN-T1)** | **14** |
| 2 | Crystal Jade Go (SIN-T1) | 13 | T2 Food Gallery (SIN-T2) | 14 |
| 3 | Heavenly Wang (SIN-T1) | 10 | Wang Cafe (SIN-JEWEL) | 14 |

Post-fix #1 now exactly matches the `editorial_score DESC` reference ordering (see baseline doc §2). #2/#3 diverge from that pure reference because of a genuine 5-way tie at the pool's max score (14) spanning 5 different terminals — VibePage's open-status tiebreaker (a deliberate, retained UX signal, not a bug) then decides among ties differently than `api/lib/agent.ts`'s terminal-only tiebreaker would. This is expected given the design choice in the plan (demote existing signals to tiebreakers rather than delete them), not a partial fix — `editorial_score` is unambiguously now the dominant key, confirmed both by the top pick changing and by the score column no longer being non-monotonic (11, 13, 10 → 14, 14, 14).

**Confirmed live in browser** (real journey-context flow, not mocked): loaded `/vibe/refuel` with terminal set to SIN-T1 through the actual onboarding UI. Rendered order: Kopitiam, T2 Food Gallery, Fossa Chocolate, Wang Cafe, TWG Tea, Grain Traders (closed), Kélé (closed) — Kopitiam (score 14) on top, consistent with the fix. Header correctly reads "7 spots across all terminals" (DISPLAY.COLLECTION_VISIBLE, unchanged value).

**CollectionDetailPage** ("Jewel Refuel", 'relevance' sort) — ran `contextualScoring.ts`'s `selectScoredAmenities` before/after:

| Rank | Before | editorial_score | After | editorial_score |
|---|---|---|---|---|
| 1 | Wang Cafe | 14 | Wang Cafe | 14 |
| 2 | **A&W Restaurants** | **12** | Grain Traders | 14 |
| 3 | Leckerbaer | 13 | Fossa Chocolate | 14 |

Before: A&W Restaurants (score 12) outranked Leckerbaer (score 13) purely because of a `contextScore` tie broken by arbitrary DB row order. After: all four score-14 items now sort ahead of every score-13 item — the exact bug from the audit is gone. **Confirmed live in browser**: `/collection/refuel/jewel-refuel` renders "7 of 7 spots", top card Wang Cafe (score:67 shown in debug label), followed by Fossa Chocolate/Grain Traders/Kélé (all editorial_score 14) ahead of the score-13 tier.

**SearchPage** (query "coffee") — no client-side re-sort exists here, so the SQL `.order()` addition is the whole fix. **Confirmed live in browser**: top result is Wang Cafe (editorial_score 14, the pool's max), verified against a direct SQL query ordered the same way.

**Regression check — api/chat.ts (untouched ranking logic)**: re-ran the exact same SQL replica of `queryAmenities()`'s filter (terminal=SIN-T1, keyword=refuel, `editorial_score DESC`, limit 40) after all three fixes landed. Top-3 identical to the pre-fix baseline: Kopitiam, Toast Box, Crystal Jade Go. Confirms zero regression on the one file Fix 2 touched only to swap a literal `40` for `DISPLAY.SEARCH_LIMIT` (same value).

**`api/mcp.ts`**: not called, not opened, not edited — no regression surface, per the protected-files rule.

### File change table

| File | Fix | Lines changed |
|---|---|---|
| `src/pages/SearchPage.tsx` | 1 | +2 |
| `src/pages/VibePage.tsx` | 1, 2 | +12/-3 combined |
| `src/pages/CollectionDetailPage.tsx` | 1, 2 | +17/-2 combined |
| `src/utils/smart7Select.ts` | 1, 2 | +8/-1 combined |
| `src/utils/contextualScoring.ts` | 1, 2 | +6/-1 combined |
| `src/lib/displayConfig.ts` (new) | 2 | +10 |
| `api/chat.ts` | 2 | +5/-2 |
| `src/App.tsx` | 3 | -1 |

Combined diff (all 3 commits): 8 files changed, 51 insertions(+), 10 deletions(-). No other files touched — `git diff --stat` confirmed against this table before each commit.

### Verification checklist

- [x] `npm run build` passes after each fix — ran and passed after Fix 1, Fix 2, and Fix 3 independently.
- [x] Chat/MCP-equivalent baseline unchanged — SQL replica of `api/chat.ts`'s query returns identical top-3 (Kopitiam, Toast Box, Crystal Jade Go) before and after. `api/mcp.ts` untouched, not queried (protected).
- [x] VibePage top pick now matches the `editorial_score DESC` reference (Kopitiam, score 14) — exact top-3 match not achieved due to a genuine 5-way score tie in this specific vibe's data plus a deliberately-retained open-status tiebreaker; documented above rather than glossed over.
- [x] CollectionDetailPage 'relevance' ordering now strictly respects `editorial_score DESC` — verified both via direct script execution and live browser render for "Jewel Refuel".
- [x] Grep sweep: zero leftover hardcoded `7`/`40` in the touched ranking contexts outside `displayConfig.ts` (`api/lib/agent.ts`'s `21` intentionally excluded — protected file).
- [x] `git diff --stat` matches the file table above for all 3 commits — no surprise files; pre-existing unrelated changes (`api/lib/agentPrompt.ts`, `package-lock.json`, `package.json`, `src/pages/AmenityDetailPage.tsx`, present since before this session) were left untouched and unstaged throughout.
- [x] Loaded VibePage and CollectionDetailPage in a real browser (via a genuine onboarding-flow session, not a mocked one) and confirmed both render correctly and order as expected.

### Commits

1. `899654e` — `fix(ranking): editorial_score on UI surfaces`
2. `4638015` — `refactor: centralize display counts`
3. `603cf56` — `chore: remove render-body log`
