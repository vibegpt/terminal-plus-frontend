# CC-19 report: a deploy no longer blanks an open tab or a cold-opened PWA

**Status: READY TO SHIP, waiting on Todd's go. Rebased 5 Oct onto `26e831b` (CC-13 +
the test-flag fix); fresh preview `dpl_4d9GHdeM8wasj7EGWDgmrBaxE7XF` re-check PASS
(update toast + Refresh beside CC-13's strip, no-SW path, forced loop, CC-16 and
CC-18) and SMOKE 13/13, 0 untagged rows. First round (4 Oct, on `bef1938`) PASS:
both repro cases, the ship handover from today's service worker, toast + Refresh,
the no-SW path, the forced loop, CC-16 and CC-18 regressions, SMOKE 13/13. Not on main.**

Run: 4 Oct 2026. Worktree `~/tp-cc-19`, branch `cc-19/sw-stale-shell` off `bef1938`
(CC-6 on main). Commits `ae2f5b5` (fix), `4bf9805` (drop the immutable header),
`20b2b21` (toast fits at 375 px). Preview `dpl_HbeYPSAvRhnQbTCXab6YpghExcBJ`
(`terminal-plus-frontend-h02xuwuuh-…vercel.app`, alias `…-git-cc-19-df18ca-…`),
READY, sin1. No DB change. Rebased 5 Oct onto `26e831b`: `ee35b01` (fix), `5342bc6`
(vercel.json), `959dfc4` (toast), then the docs (see "Rebase onto `26e831b`").

## Why

After a production deploy, a tab running the previous build went blank on its next
lazy route (seen 3 Oct in the CC-13 run). Cause, from the shipped build and the
vite-plugin-pwa 1.2.0 source:

- `registerType: 'autoUpdate'` with no `virtual:pwa-register` import injects the plain
  `registerSW.js` (it only registers), yet the plugin still forces `skipWaiting` and
  `clientsClaim` (`dist/index.js:874-876`). The auto-reload lives only in the virtual
  register. So a new service worker takes control mid-session, `cleanupOutdatedCaches`
  deletes the old precache, and nothing reloads the page.
- The old shell then asks the network for an old chunk. Vercel's SPA rewrite answered
  `200 text/html`, so the dynamic import failed ("Failed to fetch dynamically imported
  module").
- The 8 routes are `React.lazy` with bare `import("./X-hash.js")`: no `__vitePreload`
  in the entry, so `vite:preloadError` never fires for a route. No error boundary, so
  React unmounted to a blank page.

## Gates

| Gate | Result | Evidence |
|---|---|---|
| G1 base = production, own worktree | PASS | `origin/main` = `bef1938` = production `dpl_BrfGyzpDde7QXzHKpctnoTEcez8a` READY 12:22 UTC (CC-6). CC-6 touches none of CC-19's files. Worktree `~/tp-cc-19` clean. Re-check at ship time (`c667d95` now) |
| G2 reproduce on a preview | PASS (both blank) | Throwaway `cc-19/repro`: A `4bc0035` (empty commit; Vercel won't rebuild a sha it built on another branch), B `1c33e5b`, C `b1653be` (each bumps the entry and 7 of 8 route chunks). **Open tab:** after B, an update check fired `controllerchange`, A's chunks were gone from cache, Profile → `#root` empty, console "Expected a JavaScript-or-Wasm module script … MIME type of text/html" and "Failed to fetch dynamically imported module …/ProfilePage-DhZsjXyb.js". **Cold open:** C deployed with all tabs closed; B's shell from precache (`index-DCpbHrCn`, server `index-CqyRHkjt`); C's worker took control within seconds and Profile went blank the same way. Rows 690–693 |

Note for anyone testing this: inside a controlled page `fetch('/', {cache:'no-store'})`
is answered by the precache (Workbox maps `/` to `index.html`). Compare against the
server with a non-ignored query (`/?cc19=<ts>`).

## Decisions (Todd, 4 Oct)

1. **`registerType: 'prompt'`.** A new worker installs and waits; the old and new
   precache entries coexist, so an open tab or a cold-opened PWA keeps running its own
   build until the user accepts the update or every tab closes. A small dismissible
   toast, "A new version is ready" + Refresh + ✕, sits bottom-left above the mobile
   nav and left of the chat bubble, so it never covers the header (flight bar,
   Add-flight bar, CC-13's strip). Hidden while capture is open. It never forces a
   reload. Hourly `registration.update()` so a long-open tab hears about a deploy.
2. **Backstop kept.** `reloadOnce()` reloads at most once per 60 s (sessionStorage
   `tp_chunk_reload_at`; no reload if storage is blocked). Used by `lazyWithReload`
   (every route import), a `vite:preloadError` listener, and `LazyRouteBoundary`
   around the routes, which shows "This page didn't load … [Reload]" once the guard
   has fired.
3. **vercel.json: missing `/assets/*` returns 404**, one line:
   `"/((?!api/).*)"` → `"/((?!api/|assets/).*)"`. The first version also set
   `public, max-age=31536000, immutable` on `/assets/(.*)`. The preview showed that
   header on the 404s too (vercel.json `headers` apply whatever the status), so a CDN or
   browser could pin a 404 for a year, including after a rollback. Todd chose 404 only
   (`4bf9805`). Long-lived caching is noted for CC-8 below.
4. **Skew Protection: findings only** (section below). Not adopted.

## Changes

| File | Change |
|---|---|
| `src/lib/chunkReload.ts` | New. `isChunkLoadError` (Chrome, Safari, Firefox messages, "Unable to preload CSS"), `reloadOnce`, `lazyWithReload`, `installPreloadErrorHandler` |
| `src/components/LazyRouteBoundary.tsx` | New. Class boundary keyed by pathname; on a chunk error tries `reloadOnce()`, then shows the Reload fallback |
| `src/components/UpdatePrompt.tsx` | New. `useRegisterSW` (`immediate`, hourly update) and the toast; Refresh → `updateServiceWorker(true)` |
| `src/App.tsx` | 8 routes use `lazyWithReload`; `<LazyRouteBoundary key={pathname}>` around `<Suspense><Routes>`; `<UpdatePrompt hidden={captureEntry !== null} />` |
| `src/main.tsx` | `installPreloadErrorHandler()` before render |
| `src/vite-env.d.ts` | `/// <reference types="vite-plugin-pwa/react" />` |
| `vite.config.ts` | `registerType: 'prompt'`, `injectRegister: false`; `globIgnores` and `navigateFallbackDenylist` unchanged |
| `vercel.json` | The one rewrite line above |

`src/components/RouteErrorBoundary.tsx` (an existing dead file, no importers) was
overwritten by mistake during the edit and restored from HEAD; it's unchanged in the
diff.

## Local checks (`20b2b21`)

| Check | Result |
|---|---|
| `npx tsc --noEmit -p api/tsconfig.json` | exit 0 |
| Reachable-file typecheck (49 files from `src/main.tsx`, including the 3 new ones) | 35 errors on `bef1938` and on the branch, identical sets (all pre-existing) |
| `npm run build` | exit 0. PWA v1.2.0, precache 26 entries |
| `dist/sw.js` | `self.skipWaiting()` once, only inside the `SKIP_WAITING` message handler; 0 `clientsClaim`; `cleanupOutdatedCaches`, robots and sitemap denylist present. No `registerSW.js` emitted |
| Entry chunk | contains `tp_chunk_reload_at` and `vite:preloadError`; `workbox-window` chunk emitted |
| `npm run test:adversarial` | 11/11 |

## Preview acceptance

Builds were told apart by the loaded `assets/index-*.js` against the server's
(`/?cc19=…`). Throwaway `cc-19/verify` = fix + bumps: V1 `index-BL_yPkFc`, V2
`index-BJZVkUo5`, V3 `index-BtTayMYm`, V4 `index-_J2a4C-M`, V5 `index-BpfwLiKB`.
Fix branch preview: `index-CbG94rad`.

| Check | Result | Evidence |
|---|---|---|
| Missing `/assets/*` | PASS | `/assets/ProfilePage-missing0.js` and `/assets/index-missing0.css`: `404 text/plain`, `public, max-age=0, must-revalidate` |
| Existing hashed files | PASS | `index-CbG94rad.js` 200; all 12 chunks the entry imports 200; all `max-age=0` (unchanged from today) |
| Other paths unchanged | PASS | `/`, `/vibe/refuel` 200 html; `/robots.txt` text/plain; `/sitemap.xml` application/xml; `/og/terminalplus-1200x630.png` image/png; `/api/events` GET 405 json; `/sw.js` 200 js |
| **a. Open tab** (V1 → V2) | PASS | V1 tab, server moved to V2. Map opened from V1's precache (V1's Map on the server now 404). After `registration.update()`: V2 worker `installed`/waiting, 0 `controllerchange`, V1 and V2 chunks both cached, Profile rendered on V1's chunk, toast shown. Refresh → navigation `reload`, loaded index = server `index-BJZVkUo5`, still on `/profile`, nothing waiting |
| **b. Cold open** (V2 shell, V3 deployed) | PASS | V2 shell from precache, server V3 `index-BtTayMYm`, V3 waiting, toast, Profile on V2's chunk. All tabs closed and reopened → V3 active, loaded = server, old entries cleaned, no toast |
| **Ship handover** (today's worker → this fix) | PASS | `cc-19/repro` tab on C: old `autoUpdate` worker in control, page loads `registerSW.js`, index `index-CqyRHkjt`. Deployed D = C merged with `20b2b21` (`4ebea52`; diff vs the fix head is the bump only). Same tab after `registration.update()`: D's worker `installed`/waiting, 0 `controllerchange` in 15 s, C's chunks kept beside D's (39 entries); Profile rendered on C's `ProfilePage-sgogCDXu.js` from the SW (200), no reload. Closed, reopened: D in control, loaded = server `index-BtTayMYm`, no `registerSW.js`, precache 26 (D's), Profile on `ProfilePage-DMVfACfn.js` |
| Toast placement, 375×812 | PASS | Toast x16–287, y696–740, one line; chat bubble starts at x303; Add-flight bar y50–97. Verify tab with an update waiting: toast shown on `/vibe/refuel`; Add flight → capture open, toast hidden; Skip → back on `/vibe/refuel`, toast shown again |
| **No-SW path** (puppeteer, SW bypassed) | PASS | Loaded V4 `index-_J2a4C-M`, waited for V5, then an in-app route change to `/profile`: exactly 1 new document (in-page counter 1 → 2, 1 document request, navigation `reload`), final index = server `index-BpfwLiKB`, Profile shown, no boundary. Only console error: the 404 for V4's chunk |
| **Forced loop** (puppeteer, Profile chunk aborted every time) | PASS | 2 documents (in-page counter 2, 2 document requests to `/profile`), 2 chunk attempts in 20 s, then the boundary with "Terminal+ was updated while it was open." and Reload; no third load |
| CC-16 with the SW in control | PASS | Fix preview, second load (`workerStart > 0`): `/robots.txt` opens as `text/plain` and `/sitemap.xml` as `application/xml` (41 `<url>`), no app boot |
| CC-18 deep links (fresh tagged context each, 375×812) | PASS | `/vibe/refuel` "Refuel at Changi · Terminal+", `/collection/refuel/coffee-worth-walk` "Coffee Worth the Walk · Terminal+", `/amenity/grain-traders-jewel` "Grain Traders, Jewel Changi · Terminal+": own h1, 1 canonical each, Add-flight bar, no gate. `/`: the gate. 0 console errors |
| Lazy routes via the bottom nav | PASS | Map, Saved, Profile render, no boundary, no reload (navigation stays `navigate`), 0 console errors |

Counting note: page `load` events undercount here. In the forced loop the first
document reloads before its own `load` fires, so `load` saw 1 while 2 documents ran.
The counts above come from an `evaluateOnNewDocument` counter in sessionStorage plus
main-frame document requests.

## SMOKE (`tasks/release-2026-09-report.md`)

Fix preview `dpl_HbeYPSAvRhnQbTCXab6YpghExcBJ`, 4 Oct 17:49–17:56 UTC (01:49 SGT),
browser pane at 375×812, TZ Asia/Jerusalem, `tp_test` set before the first load.

| # | Line | Result | Evidence |
|---|---|---|---|
| 1 | `/` capture gate | PASS | Fresh storage: "What brings you to Changi?", Departing / Connecting / Just landed / Skip |
| 2 | Skip | PASS | Home with "Add your flight for personalised recommendations"; journey `443d993d…` `skipped`, `onboarding_skipped` |
| 3 | Typed QF1 | PASS | Departing → T1 → Enter manually → QF1 → "Terminal T1 · Boards 22:45 → LHR" → Looks right. Bar "20h 54m to board · On Time, QF1 · SIN → LHR, T1"; `schema_version: 4`, `flight_source: typed` |
| 4 | Board picker | PASS | Live board loaded; picked QR945 → "47 min to board · On Time, QR945 · SIN → DOH, C15, T1"; `picker` |
| 5 | Home: 7 vibe rows | PASS | Comfort, Chill, Quick, Refuel, Explore, Shop, Work; 31 images, 0 broken; 32 cards with a count |
| 6 | `/vibe/refuel` | PASS | "7 spots across all terminals" |
| 7 | Collection, amenity, search | PASS | coffee-worth-walk "7 of 7 spots"; grain-traders-jewel renders with "More like this"; "laksa" → Kopitiam (T1) |
| 8 | Change flight → Keep QF1 | PASS | Bar → Change flight (heading "Change flight", "Keep QF1" once) → Keep QF1: `tp_journey_context` byte-identical (`capturedAt` 17:50:42.284Z) |
| 9 | Non-Singapore TZ follows SGT | PASS | Local 20:51 (inside 11:00–22:00), SGT 01:51: Grain Traders shows **Closed** |
| 10 | Chat | PASS | `POST /api/chat` 200; "you're in T1 and have plenty of time … At this hour (almost 2am)"; cards Starbucks, Toast Box (T1). Row `0aafe341…`, `claude-sonnet-5-5`, `SIN-T1` |
| 11 | MCP | PASS | Session `smoke-cc19-202610041752`: initialize 200 `2025-03-26` `terminal-plus`; tools/list 4; `get_recommendations {refuel, SIN-T1}` → 7 (Kopitiam … TWG Tea). Row `2bd4a858…` |
| 12 | Recent events | PASS | This SMOKE's anons since 17:49:43: `session_start` 3, `recommendation_impression` 25, `capture_opened` 4, `search_performed` 1, `flight_not_found` 1 |
| 13 | Typed journeys row | PASS | Exactly 1: `ac2edd7a-b08c-4be7-a9ba-6574650c2fda`, QF1, typed, departing, LHR, `departure_time` 2026-10-05 15:20+00, device TZ Asia/Jerusalem |

## Test rows (all `is_test = true`)

Preview unless marked production.

| Run | anon | events | journeys / agent_interactions |
|---|---|---|---|
| G2 repro + ship handover (pane) | `a7cb51b9…` | 690–693, 770–773 | |
| Verify a/b, toast, toast-vs-capture (pane) | `03789049…` | 703–709, 712, 774 | journey `f30cf0f8-8f62-4ef8-ae55-e0b5820d45a4` (Skip) |
| No-SW run 1 / run 2 | `b2cef99a…` / `320f7d7f…` | 710, 711 / 715, 716 | |
| Forced loop 1 / 2 | `bd5b7dc2…` / `9d1854fa…` | 713 / 714 | |
| Deep links: vibe, collection, amenity, `/` | `659494f9…`, `e093b0d9…`, `7accd17d…`, `98abcb69…` | 717–724 | |
| Production `/` compare | `a6f3f0c6…` | 725, 726 (production) | |
| CC-16 SW check (pane) | `6f54d8da…` | 727–729 | |
| SMOKE 1, 2, 5 | `55e73973…` | 730–738 | journey `443d993d-27d8-42c5-a1a0-316e71d442c8` |
| SMOKE 3, 6–10 | `6aac4538…` | 739–754 | journey `ac2edd7a-b08c-4be7-a9ba-6574650c2fda`; chat `0aafe341-b4d9-421d-ae4d-eb24d25da2b1` |
| SMOKE 4, bottom nav | `bc5980c4…` | 755–763 | journey `f2724553-b07d-402c-a057-75887bc5a96c` |
| Production Map/Saved/Profile compare | `d169dd0e…`, `4181466d…`, `3e192fa3…` | 764–766 (production) | |
| Fix preview Map/Saved/Profile | `155e753f…`, `78075e88…`, `d7969db2…` | 767–769 | |
| SMOKE 11 MCP | | | `2bd4a858-bf67-46c5-af5d-5c5b91839acb` |

Every row from this run is tagged: 0 untagged across the anons above. The only other
anon in ids 690–774 is `99c7bb43…` (production, CC-6's production checks from
another session), also tagged.

Sweep since 12:17 UTC (G2 start), all three tables: 1 untagged row, **not from this
run**. Event 775, `session_start`, preview, 18:27:49 UTC, anon `ab54071d…`, payload
`{}`. None of this run's anons; my last action before it was event 774 at 18:01:23;
and every `session_start` from this run carries `landing_path`, which a CC-16+ build
leaves out only when sessionStorage is blocked. Not tagged by hand (not this run's).
Preview rows never reach the analytics views (`env = 'production'`).

## Rebase onto `26e831b` (CC-13 + test flag), 5 Oct

`git rebase origin/main` (`26e831b` = CC-13 `2184300` + the test-flag production-checks
docs). Two conflicts, both resolved by keeping both sides:

- `src/App.tsx`: CC-13 added a static `OutcomePrompt` import and
  `banner={<OutcomePrompt />}` on `AppShell`; CC-19 replaced the lazy imports and
  wrapped the routes. Result: both sets of imports, and CC-19's `screen` structure with
  CC-13's banner on its `AppShell`.
- `tasks/lessons.md`: both appended. Kept both, CC-13's first, and corrected CC-13's
  "Check which build the tab is actually running" rule: compare against
  `fetch('/?x=' + Date.now())`, because a plain `fetch('/')` from a controlled page is
  answered by the precache (G2 above).

### Local checks (`098b807`)

| Check | Result |
|---|---|
| `npx tsc --noEmit -p api/tsconfig.json` | exit 0 |
| Reachable-file typecheck, list regenerated from `src/main.tsx` (51 files: CC-13's 4 new, CC-19's 3 new) | 34 errors on `26e831b` and on the branch, identical set; 0 in CC-19's files |
| `npm run build` | exit 0, precache 26 |
| `dist/sw.js` | `self.skipWaiting()` only in the `SKIP_WAITING` handler; 0 `clientsClaim`; no `registerSW.js` |
| Entry chunk | reload guard, `vite:preloadError`, and CC-13's strip all present |
| `npm run test:adversarial` | 11/11 |

A preview build no longer hashes like a plain local build: CC-13 reads
`VITE_TP_DEBUG`, which is set on Preview only. A local build with `VITE_TP_DEBUG=1`
gives `index-Bdu9pnPP.js`, the preview's.

### Preview `dpl_4d9GHdeM8wasj7EGWDgmrBaxE7XF`

`098b807`, alias `…-git-cc-19-df18ca-…`, READY, sin1, serving `index-Bdu9pnPP.js`.
Watermark: events id > 907, 10:51:18 UTC. The update flow ran on a throwaway branch,
`cc-19/verify2`: V1 `ab7357b` (`098b807` + an empty commit, `index-Bdu9pnPP`), V2
`2661dda` (bump, `index-BN7tu_k-`).

| Check | Result | Evidence |
|---|---|---|
| Missing `/assets/*` | PASS | `.js` and `.css`: `404 text/plain`, `public, max-age=0, must-revalidate` |
| Existing files, other paths | PASS | Index 200; all 12 chunks the entry imports 200; `/`, `/vibe/refuel` html; `/robots.txt` text/plain; `/sitemap.xml` xml; share card png; `/api/events` GET 405 |
| Update toast + Refresh | PASS | V1 tab: SW in control, journey QF1, Grain Traders as CC-13's candidate. After V2 and `registration.update()`: V2 worker `installed`/waiting, 0 `controllerchange`, V1 and V2 both cached (36 entries), toast shown, no reload. Refresh → navigation `reload`, loaded = server `index-BN7tu_k-`, same page, journey kept, toast gone, nothing waiting, 0 console errors |
| Toast beside CC-13's strip | PASS | Backgrounded 23 s and resumed (`?tp_gap_debug=1`): "Make it to Grain Traders?" in the header at y131–159 (header ends at y221) while the toast sits at y696–740, x16–287, left of the chat bubble (screenshot). Debug log `eligibility true: all rules pass`. Still 0 `controllerchange` |
| No-SW path (V1 → V2) | PASS | Exactly 1 new document after the route tap (in-page counter, 1 document request), navigation `reload`, final index = V2, Profile shown, no boundary. Only console error: the 404 for V1's chunk |
| Forced loop | PASS | 2 documents (in-page counter 2, 2 document requests), 2 chunk attempts in 20 s, boundary with "Terminal+ was updated while it was open." and Reload |
| CC-16 with the SW in control | PASS | `/robots.txt` text/plain, `/sitemap.xml` application/xml (41 URLs), no app boot |
| CC-18 deep links | PASS | `/vibe/refuel`, the collection and the amenity: own title, 1 canonical, Add-flight bar, no gate. `/`: the gate. 0 console errors |

Testing note: a page loaded while the tab is hidden defers CC-13's boot snapshot and
replays it on the first `visible`. That snapshot predates the page's own candidate
(`no_candidate`), so the strip needs a second hide and show.

### SMOKE, 11:29–11:33 UTC (19:29 SGT), 375×812, TZ Asia/Jerusalem except line 9

| # | Line | Result | Evidence |
|---|---|---|---|
| 1 | `/` capture gate | PASS | Fresh storage: "What brings you to Changi?", Departing / Connecting / Just landed / Skip |
| 2 | Skip | PASS | Home with "Add your flight for personalised recommendations"; journey `0fbfed16-032c-422a-8d50-1fbbca116346` `skipped` |
| 3 | Typed QF1 | PASS | Departing → T1 → Enter manually → QF1 → Looks right. Bar "9h 25m to board · On Time, QF1 · SIN → LHR, T1"; `schema_version: 4`, `typed` |
| 4 | Board picker | PASS | 141 board rows; TR466 → "23 min to board · On Time, TR466 · SIN → KUL, C19, T1"; `picker`. CC-13's gate chip "At Gate C19? Tap when you arrive" also shown |
| 5 | Home: 7 vibe rows | PASS | Refuel, Shop, Chill, Explore, Comfort, Quick, Work; 31 images, 0 broken; 32 cards with a count |
| 6 | `/vibe/refuel` | PASS | "7 spots across all terminals" |
| 7 | Collection, amenity, search | PASS | coffee-worth-walk "7 of 7 spots"; grain-traders-jewel renders with "More like this"; "laksa" → Kopitiam (T1) |
| 8 | Change flight → Keep QF1 | PASS | "Change flight" heading, "Keep QF1" once; `tp_journey_context` byte-identical afterwards (`capturedAt` 11:29:44.330Z) |
| 9 | Non-Singapore TZ follows SGT | PASS | Headless Chrome, TZ America/Los_Angeles: local 04:30, SGT 19:30, Grain Traders (11:00–22:00) shows **Open**. In the pane (Asia/Jerusalem, 14:30) every venue with simple hours is open by both clocks at this hour, so it can't tell them apart |
| 10 | Chat | PASS | `POST /api/chat` 200: "You're in T1 with a long wait before your 04:55 boarding …"; row `7e16c55e-de4c-4ade-bfb0-1668b377b76e`, `claude-sonnet-5-5`, `SIN-T1` |
| 11 | MCP | PASS | `smoke-cc19r-202610051132`: initialize 200 `2025-03-26` `terminal-plus`; tools/list 4; `get_recommendations {refuel, SIN-T1}` → 7. Row `1c845b17-610f-426d-891a-75d7f497325e` |
| 12 | Recent events | PASS | `session_start`, `recommendation_impression`, `capture_opened`, `search_performed`, `amenity_detail_dwell`, `flight_not_found`, `gate_prompt_shown` |
| 13 | Typed journeys row | PASS | Exactly 1: `e0ca29b0-d1d6-4647-83b3-4674befdcad8`, QF1, typed |

### Test rows (all `is_test = true`, env `preview`)

| Run | anon | events | other |
|---|---|---|---|
| Forced loop | `e7d4084d…` | 908 | |
| Deep links: vibe, collection, amenity, `/` | `cebe754d…`, `27986f43…`, `df73fcc1…`, `b74b7640…` | 909–916 | |
| verify2 update flow + strip (pane) | `7c65eae9…` | 917–919, 922–924 (incl. `outcome_eligible`, `outcome_shown`) | journey `5c53d121-cfc7-4759-a780-701132011020` |
| verify2 no-SW | `bb4c75fa…` | 920, 921 | |
| CC-16 SW check (pane) | `0c9b5ced…` | 925–927 | |
| SMOKE 1, 2, 5 | `57397781…` | 928–936 | journey `0fbfed16-032c-422a-8d50-1fbbca116346` |
| SMOKE 3, 6–8, 10 | `24b70146…` | 937–947, 950–955 | journey `e0ca29b0-d1d6-4647-83b3-4674befdcad8`; chat `7e16c55e-de4c-4ade-bfb0-1668b377b76e` |
| SMOKE 9 (Los Angeles TZ) | `e647a895…` | 948, 949 | |
| SMOKE 4 | `29124be7…` | 956–965 | journey `6d533c90-3bfe-404d-a139-5688627775ce` |
| SMOKE 11 | | | MCP `1c845b17-610f-426d-891a-75d7f497325e` |

0 untagged across these anons, and no other rows since the watermark.

## Skew Protection (findings, not adopted)

- Available on our plan (Pro). Whether it's on isn't visible through the API; the
  dashboard says.
- Vite isn't one of its supported frameworks, so every asset request would have to
  carry `?dpl=<deployment id>` or an `x-deployment-id` header. Relative ES-module
  chunk imports can carry neither. Full coverage needs a `__vdpl` cookie set by
  Routing Middleware on document requests, which pins a whole session to one
  deployment (an edge invocation per request; a new deploy reaches that user only
  when the cookie goes).
- Default max age 1 day.
- With `prompt` and the reload backstop it isn't needed for this bug. It would matter
  for API skew (an old client calling a changed `/api/*`), which nothing here covers.

## Notes

- **CC-8: long-lived caching for hashed assets.** Every file is `max-age=0` today.
  `immutable` must apply only to files that exist; a `headers` rule in vercel.json
  also lands on 404s (seen on this preview). Needs its own design. Low priority: the
  service worker already precaches every hashed file.
- **Migration on ship.** Today's production worker is replaced by one that waits.
  Pages on the current build have no toast, so they move to the new build when all
  their tabs close (the ship-handover row above). No user is reloaded by the deploy.
- **First visit isn't controlled** until its next load (no `clientsClaim` in prompt
  mode). Expected; the SW-dependent checks above used a second load.
- **Seen in passing, not CC-19 (no file in this diff):**
  - `/map`, `/saved` and `/profile` keep the default title and have no canonical,
    on production too. Now CC-18b (Todd, 5 Oct): own titles for all three, a canonical
    for `/map`, `noindex` and no canonical for `/saved` and `/profile`; `/map` stays
    out of the sitemap until CC-14.
  - At 375 px the flight bar's status pill overlapped the text beneath it. Fixed by
    CC-13 (`d4a7df4`, on main); seen fixed on this preview.
- Throwaway branches `cc-19/repro` and `cc-19/verify` were deleted 5 Oct (Todd's OK).
  `cc-19/verify2` (`2661dda`, worktree `~/tp-cc-19-verify2`) ran the rebase re-check.
  Never merge; delete with Todd's OK.

## Ship

1. Done 5 Oct: rebased onto `26e831b`, local checks, fresh preview, SMOKE 13/13
   (section above).
2. Ask Todd; Todd pushes to main.
3. Production: G1 re-check; a tab opened before the deploy keeps working on its own
   build (no toast: the old build has none); after all tabs close, loaded index =
   server index; robots/sitemap with the SW in control; test rows. The toast itself
   first shows in production on the deploy after this one.
