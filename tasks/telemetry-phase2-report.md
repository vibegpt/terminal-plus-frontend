# Telemetry Phase 2 Report — Client Logger + Funnel Instrumentation

Date: 2026-07-06
Branch: `main` (2 commits, nothing pushed)

## Prerequisite gate

| Check | Before edits | After edits (final) |
|---|---|---|
| `npm run build` | ✅ pass | ✅ pass |
| `npm run test:adversarial` | ✅ 10/10 | ✅ 10/10 |
| `tsc --noEmit` (changed files) | — | ✅ 0 errors |

## File change table

| File | Change |
|---|---|
| `src/lib/eventLogger.ts` | Deleted (stub; zero importers) |
| `src/lib/telemetry.ts` | New — batching client (~250 lines) |
| `src/App.tsx` | `initTelemetry()` mount effect in `AppInner` → `session_start` |
| `src/pages/HomePage.tsx` | `vibe_selected` in collection-click + see-all handlers |
| `src/pages/VibePage.tsx` | impression effect + `amenity_tapped` with position |
| `src/pages/CollectionDetailPage.tsx` | impression effect (on rendered list) + `amenity_tapped` with position |
| `src/pages/AmenityDetailPage.tsx` | dwell effect (unmount OR pagehide, once-guard) |
| `src/pages/SearchPage.tsx` | `search_performed` settle-tracking (1.2 s after results, deduped by query) |
| `tasks/telemetry-phase2-report.md` | This report |

Protected files: zero edits (`api/events.ts` consumed as-is; verified contract firsthand before wiring).

## telemetry.ts behavior (as shipped)

- `track(event_type, fields)` with client-side whitelist mirroring the endpoint (unknown type → DEV warn, dropped).
- `anon_id`: reuses the stub's existing localStorage key `anon_id`. `session_id`: UUID in `tp_session_id`, rotated after 30 min inactivity (checked per track call); `session_start` fires exactly once per session_id via a sessionStorage mint-guard.
- Auto-enrichment: `surface:'app'`, `terminal_code` from `sessionStorage.tp_user_terminal`, `minutes_to_boarding` computed exactly from `localStorage.tp_journey_context.boardingTime`.
- Flush at 20 queued / 10 s / `visibilitychange`→hidden / `pagehide` (sendBeacon with JSON Blob; fetch-keepalive fallback). Batches ≤ 50. Failed flush re-queues once; queue capped at 100 drop-oldest. All entry points try/caught — never throws into app code. Logs are DEV-gated.
- If the page is already hidden/unloading when an event is enqueued (e.g. dwell fired inside pagehide), it beacon-flushes immediately — the module's pagehide listener registers before component listeners, so without this the dwell would die with the tab.
- Impression dedup: in-memory Set keyed `session|vibe|collection|orderedSlugs` — memoized on content, not render.

## Verification evidence (real browser via preview + SQL on project `bpbyhdjdezynyiclqezy`)

All row snapshots below are from `select … from events where anon_id = 'db0bfcd4-…'` during the session. **All 26 test rows deleted after verification** (25 browser + 1 curl smoke test; delete returned `count=26`; table now empty).

### ✅ Funnel session (terminal T3 → vibe → list → tap → dwell → back)

| id | event_type | key fields |
|---|---|---|
| 6 | session_start | terminal null (fired at app mount, pre-onboarding — spec: "terminal_code if known") |
| 7 | vibe_selected | vibe=refuel, terminal=SIN-T3, minutes_to_boarding=179 |
| 8 | recommendation_impression | payload.slugs = 7 ordered slugs, slugs[0]=sin-t1-kopitiam-… |
| 9 | amenity_tapped | slug=sin-t1-kopitiam-…, **position=0** (matches visual rank AND slugs[0]) |
| 10 | amenity_detail_dwell | payload.ms=11665 (true mounted time incl. driver latency) |

Controlled-timing dwell: tap position 1 → `sin-t2-food-court…` = slugs[1], 3.0 s in-page dwell → **`ms: 3003`** (id 14).

### ✅ Dedup proof

Re-tapped the same amenity after back-nav: second `amenity_tapped` row (id 11) — **no second impression row** despite the list re-fetch/re-render. Additionally id 18 shows the inverse: the same list in a *different order* correctly produced a new impression ("new order = new event").

### ✅ Offline queue survival

`fetch` stubbed to reject `/api/events` for 15 s (in-page equivalent of devtools offline; see Notes). 4 events generated while offline. Console: `flush failed, re-queued 3 (HTTP 500)` → network restored → retry flush delivered all 4 exactly once (ids 17–20), including tap position=5 = slugs[5] and dwell ms=1998. Bonus: id 17 shows the 10-min dwell clamp working (`ms: 600000` for a page left mounted ~13 min during testing).

### ✅ Tab teardown → sendBeacon delivered

Queued vibe_selected + impression + tap, reloaded the page 1 s later (pagehide, no timer flush had run): all 3 delivered via sendBeacon (ids 21–23). Separately proved the hardest sub-path — a dwell fired *inside* the pagehide handler itself: id 28, `ms: 4959`, delivered.

### ✅ Position sanity

Positions 0, 1, 3, 5 each verified: tap row's `position` = the card's 0-based visual rank = index of its slug in the impression's `payload.slugs`.

### ✅ Zero console errors / warnings

`preview_console_logs level=error` and `level=warn`: empty across the full session. (Pre-existing, unrelated: HomePage `collections` REST queries return 400 and GA beacons fail in dev — both predate this change and log nothing to console.)

### ✅ git status matches file change table

Only the 8 planned paths changed; pre-existing dirty/untracked files untouched.

## Deviations

- **D1 — route events omitted** (`route_started`/`stop_completed`/`stop_skipped`): journey feature is DEV-gated legacy (`import.meta.env.DEV` routes in App.tsx; `journey-detail.tsx` not routed at all); no UUID route ids exist in the MVP flow. Types remain whitelisted in telemetry.ts, ready for Phase 3 / when journeys ship. Zero production data loss.
- **D2 — search has no submit**: SearchPage auto-searches per keystroke (300 ms debounce). `search_performed` fires once the query settles (~1.2 s after results) and only when different from last-logged. Payload is `{query_len, results_count}` — raw query text never logged.
- **D3 — AmenityDetailPage.tsx carried pre-existing uncommitted changes** (editorial-note display block). Bundled into the funnel commit and noted in its body. `api/lib/agentPrompt.ts` remains dirty and uncommitted (not mine, not touched).
- **Bug found & fixed during verification**: stale `flushTimer` handle — if the timer fired while a flush was in-flight or the queue was empty, the early return left `flushTimer` non-null and no future timer could ever be scheduled (events would sit until the 20-event threshold or page hide). Fixed by nulling the handle inside the timer callback.

## Notes on test environment

- `vercel dev` unusable in this sandbox (no credentials + blocked registry) — `api/events.ts` was served by a throwaway Node harness in the session scratchpad (imports the handler unmodified; nothing added to the repo).
- The headless preview tab reports `visibilityState: 'hidden'`, which routes every enqueue through the immediate-beacon path; `Document.prototype.visibilityState` was overridden to `'visible'` in-page to exercise the batched fetch + retry path. Side effect worth knowing: in production, events generated while the app is backgrounded flush immediately via beacon instead of batching — desirable on mobile where backgrounded tabs get killed.
- Impressions are deduped per page load (in-memory). A full reload re-fires an impression for a re-viewed list — treated as genuine re-exposure, matches "memoize on content, not on render".

## Next step

Phase 3: MCP/agent-surface coverage (`tool_called`) + `agent_interactions` session-id fix. Phase 4: analytics views over `events`.
