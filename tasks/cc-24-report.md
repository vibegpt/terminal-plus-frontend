# CC-24 report: the ?tp_test URL switch and the TEST pill

**Status: preview PASS, SMOKE 13/13. Not on main. Ask before pushing.**

- Branch `cc-24/test-param` off main `b00dc23`.
- Commits:
  - `8d04780`: CC-23 production-checks docs, cherry-picked from `98ef205`.
  - `390e32a`: migration restoring 3 real visits.
  - `ad8f8f2`: the switch and the pill.
- Preview `dpl_41Bsb2Ywxemtqx2YXHawHibiLrfE`, alias
  `terminal-plus-frontend-git-cc-24-c63906-todds-projects-d0181971.vercel.app`, bundle `index-r-Hnv3Jv.js`.

## Change

| File | Change |
|---|---|
| `src/lib/telemetry.ts` | `applyTestParam()`: `?tp_test=1` sets `localStorage.tp_test = '1'`, `?tp_test=0` removes it, any other value changes nothing. The parameter always comes off the address bar (`history.replaceState`; path, other parameters and hash kept). Called first in the module-load block: before React mounts, before `init()` sends the first event, before landing attribution reads the URL. `isTestBrowser()` exported |
| `src/components/TestPill.tsx` | New. While the switch is on: a fixed "TEST" pill at the top-left (`max(2px, safe-area)`), 10 px, low contrast, `pointer-events: none`, `aria-hidden`, z-index 9999 (above capture's overlay). Follows the `storage` event, so another tab flipping the switch updates it |
| `src/App.tsx` | Renders `<TestPill />` next to `UpdatePrompt`, so it shows on capture and on every page |
| `supabase/migrations/20261015081552_restore_real_visits.sql` | See Data |

No expiry on the switch (Todd, 15 Oct).

Types: the type-check scoped to reachable files shows 31 errors, the same count as main. The one in `App.tsx`
(unused `React` import) was already there. `npm run build` exits 0.

## Data

Todd confirmed which sessions in `20261015075543` were his:
- His, staying `is_test`: `150816bf`, `e73b693d`, `7939bc97`, plus the preview sessions.
- Not his: `8acc9d03`, `3f97f75c`, `517a7e64`.

Migration `20261015081552_restore_real_visits` (file first, then applied as version
`20261015081552`) sets `is_test = false` on events 1010, 1011, 1198, 1199, 1200 and 1201. They are
production session_start/capture_opened rows from 6 and 9 Oct, all landing on `/`. Exactly 6 rows
asserted.

After applying, the real-visitor rows (`not is_test and not is_bot`) are:
- events 1010, 1011, 1198–1201 (the restored 6);
- events 1559–1560: a preview session at 08:08 UTC without the switch. Preview sessions stay as
  they are (Todd), and analytics reads production only.

journeys: 0.

## Acceptance (preview, Chrome 375×812)

| Check | Result | Evidence |
|---|---|---|
| Fresh visitor | PASS | Storage cleared, `/`: no pill, `tp_test` null. Session `d33f7e03…`, events 1561–1562 `is_test=false`, preview |
| `/?tp_test=1&utm_source=cc24` (new session) | PASS | Address bar → `/?utm_source=cc24`; `tp_test = '1'`; landing `{"utm_source":"cc24","landing_path":"/"}`; pill at (2,2)–(41,18), 10 px, `pointer-events: none`, z 9999. Session `1efe7347…`: events 1563–1577 all `is_test=true`, session_start `utm_source=cc24` |
| `/vibe/refuel?tp_test=0#top` (new session) | PASS | Address bar → `/vibe/refuel#top`; `tp_test` removed; pill gone; page renders. Session `40eb73e7…`: events 1578–1579 `is_test=false`, preview |
| `?tp_test=abc`, switch off | PASS | Address bar → `/saved`; `tp_test` stays null; no pill |
| `?tp_test=abc&utm_source=x`, switch on | PASS | Address bar → `/saved?utm_source=x`; `tp_test` stays `'1'`; pill shown |
| Pill never covers a control | PASS | The pill's rect against every button, link, input, `[role=button]` and `cursor: pointer` element, 0 overlaps on each: gate (25), Home (378), capture terminal step (18), board (1507), manual entry (5), Home with flight (388), Change flight (1507), `/vibe/refuel` (180), `/collection/refuel/coffee-worth-walk` (195), `/amenity/grain-traders-jewel` (86), `/search` (37), `/map` (53), `/saved` (33), `/profile` (37) |

The pill sits above the "Terminal+" logo text, which is a plain div, not a control.

## SMOKE 13/13

Switch set by `?tp_test=1`, session `1efe7347…`, browser TZ Asia/Jerusalem.

| # | Result | Evidence |
|---|---|---|
| 1 | PASS | Gate shows ("What brings you to Changi?", 3 options, Skip) |
| 2 | PASS | Skip → Home; journey `093480d4…` skipped |
| 3 | PASS | T1 → Enter manually → QF1 → Looks right; bar "6h 25m to board · QF1 · SIN → LHR"; `typed`, v4; journey `dc5dfd6b…` |
| 4 | PASS | Change flight → "SQ" (83 rows) → list box to its end (6096/6096) → SQ227 tapped → bar "SQ227 · SIN → MEL", `picker`; journey `83087695…` |
| 5 | PASS | 7 vibe rows; 31 images, 0 broken; 32 "N spots" |
| 6 | PASS | `/vibe/refuel`: "7 spots across all terminals" |
| 7 | PASS | Collection "7 of 7 spots"; amenity "Grain Traders"; search "laksa" → Kopitiam (T1) |
| 8 | PASS | Change flight → "Keep QF1" once → `capturedAt` unchanged |
| 9 | PASS | Local 11:xx (UTC+3), SGT 16:xx; Home "Afternoon picks" (local would be morning) |
| 10 | PASS | `POST /api/chat` 200; reply uses the flight ("over 5 hours to boarding"): Toast Box, Starbucks, dnata Lounge; agent_interactions `37bb0edf…` conversational, `claude-sonnet-5-5`, `is_test` |
| 11 | PASS | MCP `initialize` 2025-03-26 `terminal-plus`; `tools/list` 4; `get_recommendations` refuel/SIN-T1 → 7 (`smoke-cc24-20261015`); agent_interactions `96e7276c…` mcp, `is_test` |
| 12 | PASS | Session `1efe7347…`: session_start, recommendation_impression, capture_opened, search_performed, flight_not_found |
| 13 | PASS | `dc5dfd6b-9417-42a2-a3c0-b01597b78ff9`: QF1, typed |

## Rows

| Table | Ids | Tagged |
|---|---|---|
| events | 1563–1577 | `is_test=true` |
| events | 1561–1562 (fresh visitor), 1578–1579 (after `?tp_test=0`) | `is_test=false`, preview (the acceptance asks for these) |
| journeys | `093480d4…` skipped, `dc5dfd6b…` QF1, `83087695…` SQ227 | `is_test=true` |
| agent_interactions | `37bb0edf…` (chat), `96e7276c…` (MCP) | `is_test=true` |

0 production rows from this work.

## Risk (accepted, Todd 15 Oct)

The switch persists with no expiry. A hand-built link carrying `?tp_test=1` would hide that visitor
from analytics until they open `?tp_test=0` or clear storage. Copying from the address bar is safe,
because the parameter is stripped at load.

## Production (15 Oct)

- **Before the push:** the migration files match the applied versions. Last 3 of `list_migrations`:
  `20261006095549` env_no_default, `20261015075543` mark_prelaunch_visits_test, `20261015081552`
  restore_real_visits. Last 3 of `ls supabase/migrations`: the same three, `.sql`. The `…090000`
  name was never committed: `390e32a` added the file as `20261015081552_…`. Lesson added (`55a336a`).
- **Push:** `b00dc23..55a336a main` (fast-forward), approved by Todd.
- **Deployment:** `dpl_HJ7EYkVrWCw5xXf5TbHFqBvstqKv`, target production, sha `55a336a`, READY.
- **Rollback target:** `dpl_2sxqfY9pNibnpXPzCPAM5W7n3djn` (`b00dc23`). Not used.
- **Bundle:** `/?x=…` serves `assets/index-CvvEIQiM.js`, the same as a plain local build of `55a336a`.
  Production `sw.js` precaches it. It contains the switch and 0 readout strings.

Checks on https://terminalplus.app (Chrome 375×812, storage, service worker and caches cleared):

| Check | Result | Evidence |
|---|---|---|
| `/?tp_test=1` | PASS | Address bar → `/`; `tp_test = '1'`; pill at (2,2)–(41,18). Session `1a631c58…`: events 1580 session_start, 1581 capture_opened, both production `is_test=true` |
| `/saved?tp_test=0` (same tab session, a page that sends no event on load) | PASS | Address bar → `/saved`; `tp_test` removed; no pill (screenshot). No row written |
| Restored | n/a | `/saved?tp_test=1` turns the switch back on in this browser for later checks |

After the checks: events since 1580 are only 1580–1581, both test. The production rows with
`not is_test and not is_bot` are exactly the 6 restored (1010–1011, 1198–1201); journeys 0.
