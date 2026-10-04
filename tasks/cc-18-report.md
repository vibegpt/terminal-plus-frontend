# CC-18 report: deep links render at once; slim "Add flight" bar

**Status: preview PASS (SMOKE 13/13, all CC-18 acceptance). Shipping follows in the
"Production" section.**

Run: 3 to 4 Oct 2026. Worktree `.claude/worktrees/cc-18`, branch `cc-18/deep-links`
off `2d1d581`. Code commit `8f2e3ee`. Preview `dpl_2QZoPWmrsu9E9gRhf4eNZcwffzqc`
(`terminal-plus-frontend-b5vhv87gc-…vercel.app`), READY 16:43 UTC, sin1.
Rollback target: `dpl_F3WetuAgLPkWd31Lt6wqTS2yAbXy` (`2d1d581`). No DB change.

## Why

CC-16's production check found that `App.tsx` rendered `<FlightContextCapture>` in
place of every route for a visitor with no stored journey. A first visit to
`/vibe/refuel`, and a crawler's visit to any of the 41 sitemap URLs, got "What
brings you to Changi?" under the home title, with no canonical.

## Gates

| Gate | Result | Evidence |
|---|---|---|
| G1 base = production | PASS | `origin/main` = `2d1d581` = production `dpl_F3WetuAgLPkWd31Lt6wqTS2yAbXy` READY (Vercel status success 16:35 UTC). Worktree clean |
| G2 where to record the entry point | PASS, no migration | `events` has only `events_surface_check`; `event_type` is unconstrained. `journeys` has no fitting column (CHECKs only on `flight_source` and `inbound_flight_source`). So it's an event payload: `capture_opened {entry}` |
| G3 capture never navigates | PASS | `FlightContextCapture.tsx`: 0 matches for `useNavigate`, `navigate(`, `history.`, `window.location` |
| G4 add-flight callers | PASS | `onEditFlight` from `App.tsx` → `AppShell` → `TopBar` and `MobileHeader` (`FlightStatusBar onAddFlight`) and `Sidebar` ("Add Flight") |
| G5 headless tool | PASS | puppeteer 24.37.2, Chrome for Testing 145 |

Decision (Todd, 3 Oct): the gate shows only when the tab session landed on a Home
path (`/`, `/sin`, unknown paths). A deep-link visitor who later taps Home never
gets it.

## Changes

| File | Change |
|---|---|
| `src/lib/routes.ts` | New. `HOME_PATH`, `PAGE_PATHS` (vibe, collection, search, profile, map, saved, amenity ×2) and `isPagePath()` via `matchPath`. `App.tsx` builds its `<Route>`s from these, so the route list and the page check can't drift |
| `src/lib/capture.ts` | New. `CaptureEntry` (`gate` / `bar` / `prompt` / `change_flight`), plus the bar's session dismissal (sessionStorage `tp_add_flight_bar_dismissed`) |
| `src/App.tsx` | `captureEntry` replaces `captureVisible`. The gate shows iff: no live journey (stale ones are cleared as before), no skip this session, a Home-landing session (sessionStorage `tp_entry_kind`, set once from the first path), and a Home path now. Page routes render at once. `capture_opened {entry}` fires once per opening, after session_start. Closing a capture opened from the bar marks the bar dismissed. Routes use `PAGE_PATHS` |
| `src/components/AddFlightBar.tsx` | New. "Add your flight to keep boarding time in view", an "Add flight" button and a ✕ (`aria-label="Dismiss"`). Full width in the mobile header, single line in the desktop top bar |
| `src/components/FlightStatusBar.tsx` | No flight on a page path → `AddFlightBar` (`onAddFlight('bar')`). On Home, the existing prompt is unchanged (`onAddFlight('prompt')`) |
| `src/components/AppShell.tsx` | `onEditFlight(entry)`. The sidebar "Add Flight" passes `prompt` |
| `src/lib/telemetry.ts`, `api/events.ts` | `capture_opened` allowlisted. The server keeps `{entry}` only for a known entry, else stores `{}` |

## Local checks

| Check | Result |
|---|---|
| `npx tsc --noEmit -p api/tsconfig.json` | exit 0 |
| Reachable-file typecheck (fresh esbuild trace: 43 ts files, incl. the 3 new) | 35 errors, the identical set to the `2d1d581` baseline. 0 new |
| `npm run build` | exit 0; precache 26 entries |
| `npm run test:adversarial` | 11/11 (the worktree has no `.env.local`; the two public `VITE_SUPABASE_*` values were exported from the main checkout's file for the command only) |

## Preview acceptance

Browser 375×812, browser TZ Asia/Jerusalem. On the fresh preview origin, before any
app load: no storage, no SW, no caches; then only `tp_test=1`, set from
`/robots.txt` (a text file, so the app didn't boot). Each step ran in its own tab
(its own session).

| Item | Result | Evidence |
|---|---|---|
| `/vibe/refuel`: page, own title and canonical, bar, no gate | PASS | h1 "Refuel", "7 spots across all terminals", title "Refuel at Changi · Terminal+", 1 canonical `https://terminalplus.app/vibe/refuel`, bar visible, `tp_entry_kind = page`. Screenshot: slim bar under the logo, 2 lines of copy, purple "Add flight" pill, ✕ |
| Collection | PASS | `/collection/refuel/coffee-worth-walk`: "Coffee Worth the Walk · Terminal+", 7 of 7 spots, own canonical |
| Amenity | PASS | `/amenity/grain-traders-jewel` in a new session: h1 "Grain Traders", "Grain Traders, Jewel Changi · Terminal+", own canonical, bar back (dismissal didn't carry over) |
| Headless render, empty storage | PASS | Puppeteer, a fresh incognito context per URL (no storage, no SW), mobile 375×812 and desktop 1280×900. `/vibe/refuel`, the collection and the amenity each render h1, content, own title, 1 canonical and the bar; `/` renders the gate. 0 console errors. A second run in "tagged" mode (only `tp_test` set) rendered the same |
| `/` still shows capture | PASS | Fresh tab: gate, `tp_entry_kind = home`, `capture_opened {gate}`. Skip lands on Home with its existing prompt (no bar on Home). `/sin` in a fresh tab: gate |
| Bar → capture → back on the same page | PASS | From `/amenity/grain-traders-jewel`: Add flight → capture (URL unchanged) → Departing → Pick terminal → T1 → Enter manually → QF1 → Looks right. Back on `/amenity/grain-traders-jewel` (not Home) with its title and canonical, flight bar "QF1 · SIN → LHR", Add-flight bar gone. Session `c0b555e0…`: session_start **507** → `capture_opened {bar}` **510** → journey `86f2de62-9bcc-4847-b288-4e7c38bb8690` QF1 `typed` |
| Dismiss lasts the session only | PASS | ✕ → bar gone, `tp_add_flight_bar_dismissed = 1`. Reload: still hidden. `/collection/…` in the same tab: hidden. New tab: back |
| Deep-link visitor taps Home | PASS | From the deep-link session: bottom-nav Vibes → `/`: Home with its prompt, static title, no gate (`tp_entry_kind = page`) |
| Change flight also returns in place | PASS | From `/vibe/refuel` and `/search`, Change flight closed back onto the same path. `capture_opened {change_flight}` 545 and 559 |
| `capture_opened` validation | PASS | Direct `POST /api/events` (`x-tp-test: 1`): `{entry: "<script>", evil}` → **555** `{}`; `{entry: "bar", evil}` → **556** `{"entry":"bar"}`; `{entry: "GATE"}` → **557** `{}` |
| 0 console errors | PASS | Clean tab across `/vibe/discover`, `/collection/chill/gardens-at-dawn`, `/amenity/canopy-park-jewel-new`, `/`, `/search`: none. SMOKE tab: none. Headless: none |

## SMOKE (`tasks/release-2026-09-report.md`)

| # | Line | Result | Evidence |
|---|---|---|---|
| 1 | Capture gate shows | PASS | `/` fresh tab: "What brings you to Changi?" |
| 2 | Skip works | PASS | Skip → Home; journey `df348bb7-047b-4200-9eff-415afee30b92` `skipped` |
| 3 | Typed QF1 | PASS | Via the bar flow (above). "Terminal T1 · Boards 22:45 → LHR" |
| 4 | Board picker | PASS | Change flight → 145 departures → TR516 (T1, 16:00). Bar "1h 28m to board · On Time, TR516 · SIN → SGN, T1"; journey `71547401-b60e-4ee5-b8f6-6f970df79715` `picker`. Still on `/vibe/refuel` |
| 5 | Home | PASS | 7 rows (Comfort, Chill, Quick, Refuel, Explore, Shop, Work), 31 of 31 images (lazy ones forced eager in the hidden tab), 0 broken, 32 count cards |
| 6 | `/vibe/refuel` | PASS | 7 spots |
| 7 | Collection, amenity, search | PASS | coffee-worth-walk 7 of 7; grain-traders-jewel renders; "laksa" → Kopitiam (T1) |
| 8 | Change flight → Keep QF1 | PASS | 1 "Keep QF1"; context byte-identical (`capturedAt 2026-10-03T16:49:24.667Z`) |
| 9 | Hours follow SGT | PASS (real clock) | Jerusalem 08:55, SGT 13:55: Grain Traders (11:00–22:00) "Open · Until 22:00". A local reading would say closed |
| 10 | Chat | PASS | `POST /api/chat` 200: "You've got plenty of time before your QF1 flight!", cards Starbucks, Toast Box, Crystal Jade Go (T1) |
| 11 | MCP | PASS | initialize 200 (`2025-03-26`), 4 tools, `get_recommendations` refuel/T1 → 7. agent_interactions `3aeb1bee-a9e0-469b-b2e4-9b4073f9c1e1` `is_test`, key `smoke-cc18-20261004` |
| 12 | Recent events | PASS | session_start, recommendation_impression, capture_opened, search_performed, amenity_detail_dwell, flight_not_found |
| 13 | 1 typed journey | PASS | `86f2de62-9bcc-4847-b288-4e7c38bb8690` |

## Capture rate by entry point

Each journey is credited to the latest `capture_opened` before it in the same
session; skipped journeys are counted apart:

```sql
with o as (
  select id, session_id, occurred_at, payload->>'entry' as entry
  from events
  where event_type = 'capture_opened' and not is_test and env = 'production'
),
j as (
  select session_id, created_at, flight_source
  from journeys
  where not is_test and env = 'production' and session_id is not null
),
credited as (
  select distinct on (j.session_id, j.created_at) o.entry, j.flight_source
  from j join o on o.session_id = j.session_id and o.occurred_at <= j.created_at
  order by j.session_id, j.created_at, o.occurred_at desc
)
select o.entry,
       count(*) as opened,
       (select count(*) from credited c where c.entry = o.entry and c.flight_source <> 'skipped') as captured,
       (select count(*) from credited c where c.entry = o.entry and c.flight_source = 'skipped') as skipped
from o group by o.entry order by o.entry;
```

Run on this test run's sessions instead (filters swapped for the run's anon ids):
bar 1 opened / 1 captured; change_flight 2 / 1 (Keep QF1 wrote nothing); gate 3
opened / 0 captured / 1 skipped. That matches what was done.

## Test rows (all `is_test = true`, env `preview`)

Watermark: events id > 467, journeys after 16:43:15 UTC, 0 non-test rows at that point.

- events: 476 (headless, see below), 477–484 (headless tagged run), anon `8037f124-c40c-461d-8092-1119fda2fdea` (browser: 62 rows in 485–570), 555–557 (direct POST, anon `9d123ac8-1b7e-488c-a0e5-e39a08da9b83`).
- journeys: `df348bb7-047b-4200-9eff-415afee30b92` (gate Skip), `86f2de62-9bcc-4847-b288-4e7c38bb8690` (bar → QF1), `71547401-b60e-4ee5-b8f6-6f970df79715` (TR516 picker).
- agent_interactions: `3aeb1bee-a9e0-469b-b2e4-9b4073f9c1e1`.
- Non-test rows since the watermark, from any source: **0**.
- Not this run's: events 468–475 (anon `90b60933…`) and 511–544 (anon `8a09c45c…`), journeys `f764b498…` and `27a64a8a…`. Other sessions' previews; all `is_test`.

**Correction made during the run.** The first headless run used request
interception to add `x-tp-test` and set nothing in storage. One event, **476**
(`amenity_detail_dwell`, anon `800c7378…`), went out as an unload beacon after
the page target had closed. That was outside the interception, so it landed
`is_test = false`. It was flagged by hand (`update events set is_test = true
where id = 476 and anon_id = '800c7378…' and env = 'preview' and event_type =
'amenity_detail_dwell' and not is_test` → 1 row). Later headless runs set
`tp_test` before page scripts and navigate to `about:blank` before closing. Lesson
added to `tasks/lessons.md`.

## Notes

- **Overlap with CC-13.** It's still unmerged and edits `App.tsx`, `AppShell.tsx`, `FlightStatusBar.tsx`, `api/events.ts`, `src/lib/telemetry.ts` and `tasks/lessons.md`. Whichever lands second rebases and re-runs its SMOKE.
- **`prompt` entry not observed.** No browser step opened capture from Home's prompt or the desktop sidebar (the test browser had a journey by then). The code path is the same `onEditFlight(entry)` as `bar`.
- **CC-17 untouched.** No landside or no-journey recommendation logic changed.
