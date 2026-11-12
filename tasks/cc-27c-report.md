# CC-27C · offline state on amenity pages, Saved reads the catalogue: report

Status, 12 Nov 2026: built and checked on the preview; **PR open, merge waits for Todd's GO.** Follow-ups 1 and 2
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

Not started: waiting for Todd's GO.
