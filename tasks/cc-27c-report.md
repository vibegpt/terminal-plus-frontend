# CC-27C · offline state on amenity pages, Saved reads the catalogue: report

Status, 12 Nov 2026: **SHIPPED.** Built and checked on the preview, merged after Todd's GO, production checks all PASS. Follow-ups 1 and 2
from `tasks/cc-27b-report.md`. Branch `cc-27c/offline-saved` (`7bdfd51`), worktree `~/tp-cc-27c`, from `origin/main` `c88cff9`.
Preview `dpl_iumyhZVc71bRk2eTQvJGGvQw9mRG`, alias `terminal-plus-frontend-git-cc-27-95fdbb-todds-projects-d0181971.vercel.app`,
bundle `index-CK9y9oee.js`. Production still runs `c88cff9` (`dpl_9RRVpKBTdVARF6SAi247oS3pMcGQ`, `index-DECiUxYA.js`).
Evidence (not committed): `~/tp-backups/2026-11-12/evidence/c27c-*`.

## What changed

| File | Change |
|---|---|
| `src/lib/amenityLoad.ts` (new) | `classifyLoadError`: PGRST116 (zero rows from `.single()`) is `missing`; everything else is `unreachable` |
| `src/pages/AmenityDetailPage.tsx` | `unreachable` shows "You're offline" (`navigator.onLine === false`) or "Can't load this right now", with Try again and Back to Home; retries on the `online` event. `missing` is still "Not found" |
| `src/pages/SavedPage.tsx` | `useVenueFacts` also selects `name` and `terminal_code`; the card prefers them over the stored values |
| `tests/amenityLoad.test.ts` (new) | 4 cases |

Not touched: `useBookmarks`, `api/`, `shared/`, `vercel.json`, the migration, `sitemap.xml` (`git diff origin/main --stat` on those paths is empty).
Why no record cache: Supabase isn't runtime-cached by the SW (`vite.config.ts:72` caches only `https://api.`); caching REST responses is a separate design call. The clean state meets AC-B3's wording.

## Local

Unit 99/99 (95 + 4, 0 skipped), `npm run build` exit 0, api tsc exit 0, adversarial 14/14. The app `tsc -p tsconfig.json` is blind (syntax errors in dead files), so the changed files were checked with a temporary narrow tsconfig: only unused-import errors on lines this change doesn't touch (`DollarSign`, `React`, `FlightStatusBar`).

## Preview checks (375 px, headless Chrome, SW controlling, `tp_test = 1`)

| Check | Result | Evidence |
|---|---|---|
| Setup | PASS | `controlled: true`, bundle `index-CK9y9oee.js` |
| Offline, old slug `butterfly-garden-t1-new` | PASS | `setOfflineMode(true)`: path `/amenity/butterfly-garden-t3-new`, "You're offline", Try again, `notFound: false` (`c27c-preview-offline-butterfly-garden-t1-new.png`) |
| Offline, canonical slug | PASS | same: "You're offline", `notFound: false` |
| Back online | PASS | `setOfflineMode(false)`: the record loaded by itself (the `online` event), no reload, "Open until 23:00" |
| Bogus slug online | PASS | `/amenity/no-such-venue-xyz`: "Not found", not the offline state |
| Saved, lone old bookmark | PASS | Stored `butterfly-garden-t1-new`, name "Butterfly Garden (stale)", `SIN-T1`: card "Butterfly Garden", "Terminal 3", "Open until 23:00"; storage holds the canonical slug once |

The earlier in-pane "offline" attempt (patching `window.fetch`) was not a valid test; see `tasks/lessons.md`.

## Not done

- The stored bookmark's `name` and `terminalCode` stay stale in localStorage; only the display is corrected from the catalogue. They update if the user re-saves.
- The 13-line SMOKE has not run on this preview. This change touches only `AmenityDetailPage` and `SavedPage`; the targeted checks above cover them. Production SMOKE, AC-B2 and AC-B4 follow the merge, as for CC-27B.
- Test rows: the preview runs wrote 7 `events` (ids between 1947 and 1984, all `is_test`, `env = preview`, 0 non-test) and no journeys. Nothing touched production.

## Part C · production

Merged 12 Nov 2026 as a merge commit, history intact: PR #10, `68d5c91` (main was `c88cff9`; CI 5/5 green: `verify` x2, Vercel, CodeRabbit).
Production `dpl_219WPU1ETFP8AryefDBfRTKLjizR` READY, sha `68d5c91e9097…`, aliases include `terminalplus.app`; serves `assets/index-DLBWqNGX.js` (was `index-DECiUxYA.js`).
Rollback: Vercel Instant Rollback to `dpl_9RRVpKBTdVARF6SAi247oS3pMcGQ` (`c88cff9`).
The full 13-line SMOKE ran on production after the merge, not on the preview first (as in CC-27B); CLAUDE.md asks for the preview run, and Todd chose to merge first.

### CC-27C on https://terminalplus.app (`tp_test = 1`, 375 px, headless Chrome, SW controlling, bundle `index-DLBWqNGX.js`)

| Check | Result | Evidence |
|---|---|---|
| Offline, old slug | PASS | path `/amenity/butterfly-garden-t3-new`, "You're offline", Try again, `notFound: false` |
| Offline, canonical slug | PASS | "You're offline", `notFound: false` |
| Back online | PASS | the record loaded by itself, "Open until 23:00" |
| Bogus slug online | PASS | `/amenity/no-such-venue-xyz` → "Not found" |
| Saved, lone old bookmark | PASS | stored `butterfly-garden-t1-new` ("Butterfly Garden (stale)", `SIN-T1`): card "Butterfly Garden · Terminal 3 · Open until 23:00" |
| AC-B2 (CC-27B, re-run) | PASS | Butterfly Garden, YOTELAIR and Lotte old slugs land on the canonical URL and render, 0 "Not found" |
| AC-B4 (CC-27B, re-run) | PASS | two bookmarks → 1 "Butterfly Garden · Terminal 3" card; storage holds the canonical entry |

### Production SMOKE 13/13 (built-in browser, 375x812, browser TZ Asia/Jerusalem, `tp_test = 1`, 10:00-10:25 UTC)

| # | Result | Evidence |
|---|---|---|
| 1 | PASS | Storage cleared, SW unregistered: "What brings you to Changi?", Departing / Connecting / Just landed, Skip |
| 2 | PASS | Skip → Home; journeys `5c33981c-1168-418e-a9dc-9466ba63e8cb` `skipped` |
| 3 | PASS | Departing → T1 → Enter manually → QF1 → "Terminal T1 · Boards 23:00 → LHR" → Looks right; bar "4h 58m to board · QF1 · SIN → LHR · T1"; `tp_journey_context` v4 `typed` |
| 4 | PASS | Live board 122 rows; QF36 (T1, 19:40) → bar "1h 1m to board · On Time, QF36 · SIN → MEL, C15, T1"; `flight_source: "picker"` |
| 5 | PASS | 7 vibe rows, 31/31 images (after lazy load), 0 broken, 32 counts |
| 6 | PASS | `/vibe/refuel` "7 spots across all terminals" |
| 7 | PASS | coffee-worth-walk "7 of 7 spots"; `/amenity/grain-traders-jewel` Until 22:00, Before immigration; search "laksa" → Kopitiam |
| 8 | PASS | Change flight (heading once) → "Keep QF1" (once); `tp_journey_context` identical, `capturedAt` `2026-11-12T10:02:21.626Z` |
| 9 | PASS | TZ Asia/Jerusalem local 12:02, SGT 18:02; Home "Evening picks"; Grain Traders "Until 22:00" |
| 10 | PASS | Chat: coffee before the flight; cards Coffee Bean & Tea Leaf, Starbucks, Toast Box (Before immigration), dnata Lounge, all T1; reply names QF1 |
| 11 | PASS | `scripts/mcp-smoke.mjs`: 10 steps, 4 tools, p95 2146 ms, PASS |
| 12 | PASS | Last 25 min, production, all `is_test`: `session_start` 6, `recommendation_impression` 38 (ids 1953-2017) |
| 13 | PASS | typed journey `82c414db-633e-4b54-b3a7-8b868dd3b240` (QF1, LHR); picker `ddc5b227-c0b9-4c61-9216-342b349ecfb4` (QF36, MEL) |

Sitemap: 359 URLs, 316 amenity. Test rows from Part C, all `is_test`, `env = production`: journeys `5c33981c…`, `82c414db…`, `ddc5b227…`; the puppeteer runs added `session_start` and impression events. In the last 40 min: 0 non-test, non-bot events or journeys, 0 non-test `agent_interactions`.

### Open

Stored bookmark `name`/`terminalCode` stay stale in localStorage (display corrected only). Unchanged from CC-27B: held Lotte #02-91 pair, Aerotel T2/T3, YOTELAIR description text, 9 dead files with old slugs (CC-9).
