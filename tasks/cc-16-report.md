# CC-16 report: share card, sitemap, session attribution

**Status: preview PASS after round 2 (SMOKE 13/13, all attribution and SW checks).
Production: PENDING (Todd pushes).**

Round 1 (preview `dpl_8mhCrAckP4A2hVbY2W8WbqfJ9sEM`, head `3762540`) passed. Todd
then corrected 2 things (see "Round 2"): `journeys.acquisition_src` is now first
touch per browser, and the service worker no longer answers static-file
navigations. Round 2 re-ran the attribution checks and SMOKE on preview
`dpl_FwV3wQYSnPMwfqdgDVC61tLSskVb` (`terminal-plus-frontend-doza3x3xe-…vercel.app`,
sha `1a665f2`, READY 11:24 UTC, sin1). Sections marked round 1 describe the
first build. Where round 2 changed behaviour, round 2 wins.

Run date: 2026-10-03. Branch `cc-16/share-card-attribution`.
Production is unchanged: `d1ccd07` (`dpl_HEo7r8fyJrkJ3YQKfcw6k4ovXS7L`), which is
also the rollback target.

## Gates

| Gate | Result | Evidence |
|---|---|---|
| G1 prod sha = origin/main, clean tree | PASS | `git status --porcelain` empty. HEAD = origin/main = `d1ccd0783c8a`. Vercel production `dpl_HEo7r8fyJrkJ3YQKfcw6k4ovXS7L` READY on that sha. Rechecked before the push attempt (11:10 UTC): unchanged |
| G2 what fills `acquisition_src`; does the query survive to session_start | PASS, caveat closed | The parameter is `?src=`, read in `src/lib/journeyRecord.ts:51` at `recordJourney()` (`FlightContextCapture.tsx:930,1033`), stored first-touch in localStorage `tp_acquisition_src`, then `api/journey.ts` `str(…, 64)`. `session_start` fires in `ensureSession()` (`src/lib/telemetry.ts`) through `init()` in an `App.tsx` effect. FlightContextCapture never navigates, so on a capture-gate landing the query is still there. A returning user on `/sin?…` or an unknown path hits `<Navigate replace to="/">` first. Browser proof on the preview: `/sin?utm_source=probe&utm_campaign=cc16-g2` with a stored journey ends at `/` with `location.search = ''`, yet session_start **275** stores `{utm_source: probe, utm_campaign: cc16-g2, landing_path: /sin}`, because attribution is now read at module load. `behavioralTrackingService.ts` also emits session_start but is dead (esbuild trace from `src/main.tsx`: 39 reachable src files, not among them) |
| G3 a public/ file beats the SPA fallback | PASS, no vercel.json change | Production before the change: `/robots.txt` 200 text/plain, `/security.txt` 200 text/plain, `/manifest.webmanifest` 200 application/manifest+json, `/offline.html` 200 (989 B). `/sitemap.xml` and `/og/…png` returned the 1503 B text/html shell. On the preview, `/robots.txt` serves the new file (browser read before any app load) |
| G4 routes and collection URL column | PASS | `/vibe/:vibeId`, `/collection/:vibeSlug/:collectionId`, `/amenity/:terminalCode/:slug`, `/amenity/:slug`. Home links `/collection/<serviceKey>/<collection_slug>`, resolved on `collections.collection_id`. `getCollectionsForVibe` over 5 time slots reaches 41 collection URLs: 33 have a `collections` row with amenities, 8 don't (they render a vibe-tag fallback under a synthesised name) |

## Changes

| File | Change |
|---|---|
| `index.html` | Title, meta description, og:type/site_name/title/description/image (+width, height, alt), twitter:card/title/description, all with the prompt's copy. replit.com script removed. GA4 kept. No canonical, no og:url |
| `public/og/terminalplus-1200x630.png` | New, 1200×630, 110,990 bytes |
| `scripts/og-image.svg`, `scripts/og-image.ts`, `scripts/og/fonts/` | Template plus renderer (`@resvg/resvg-js`, system fonts off). It fails if text leaves the centred 630 square or the PNG passes 300 KB. DM Serif Display and DM Sans 500 TTFs come from fonts.gstatic.com, with their OFL licences. Re-run output is byte-identical |
| `scripts/sitemap.ts`, `public/sitemap.xml` | 41 URLs: `/`, 7 `/vibe/*`, 33 `/collection/*`. Absolute, sorted, no lastmod, no amenity pages. Excluded (no row): garden-paradise, gate-essentials, happy-hour, last-minute-essentials, meeting-ready-spaces, singapore-shopping-trail, spa-wellness, stay-connected |
| `public/robots.txt` | `Sitemap: https://terminalplus.app/sitemap.xml` |
| `vite.config.ts` | Manifest `id: '/'`, `start_url: '/?utm_source=homescreen&utm_medium=pwa'`. Also `globIgnores: ['og/**']`, so the service worker doesn't precache the share card (27 → 26 precache entries, 2025 → 1917 KiB). Not in the prompt; it undoes a side effect of adding the PNG. Round 2: `navigateFallbackDenylist` for `/api/`, `/.well-known/`, `/og/`, `/robots.txt` and `/sitemap.xml`, as prefixes, because Workbox matches pathname + search |
| `src/lib/telemetry.ts` | At module load: (1) the visit, once per tab in sessionStorage `tp_landing`: utm_* (≤64 chars), `?src=` as utm_source when that's absent, `ref_host` when the referrer is another host, `landing_path` (≤128). Every session_start carries it. (2) Round 2, first touch: the first valid utm_source or `?src=` this browser arrives with, stored once in localStorage `tp_first_touch_v1` as `{src, at}` and never overwritten. It's normalised with the same rule as `utmValue()`, so a malformed value can't take the slot. Exported `firstTouchSource()` |
| `src/lib/journeyRecord.ts` | Round 2: sends `acquisition_src: firstTouchSource()` only (null when none). The old `tp_acquisition_src` reader is deleted and its key isn't migrated (no non-test journey ever carried it) |
| `api/lib/attribution.ts` | New. `utmValue()` and `sessionStartPayload()`. Invalid values are dropped, never cleaned |
| `api/events.ts` | session_start payload reduced to the 7 keys. Other types unchanged |
| `api/journey.ts` | Round 2: `acquisition_src = utmValue(j.acquisition_src)`. The `utm_source` read and the raw `str()` fallback are gone |
| `src/hooks/usePageMeta.ts` + Vibe, Collection, Amenity pages | Per-page `document.title` and rel=canonical to the page's own path; restored on unmount. Emoji stripped from collection names in titles |
| `supabase/migrations/20261003084912_analytics_acquisition.sql` | View per SGT day × source (`coalesce(utm_source, ref_host, 'direct')`): sessions, sessions_with_journey, sessions_with_tap. `security_invoker = on`, production non-test rows only, `revoke all` from anon and authenticated. Applied with `apply_migration analytics_acquisition`; the DB recorded `20261003084912`, and the file (written as `…084701`) was renamed to match before commit |
| `package.json`, lock | devDependency `@resvg/resvg-js` 2.6.2 (lock diff adds only `@resvg/*`). Scripts `og:image`, `sitemap` |

Commits: `e2dac96` (card, sitemap, manifest), `69f6de3` (attribution, titles),
`3762540` (migration), `20766ae` (round 1 report), `1a665f2` (round 2: first
touch, SW denylist). Each was gated `scan && git commit` on the staged diff's
added lines (token patterns, every 20+ char `.env.local` value, forbidden paths):
0/0/0. The gate was proven to block: a staged fake Supabase-secret-prefix line
made it exit non-zero, and the line was unstaged and deleted.

## Local checks

| Check | Result |
|---|---|
| `npx tsc --noEmit -p api/tsconfig.json` | exit 0 |
| Frontend types (scratch tsconfig over the 39 files reachable from `src/main.tsx`, because the repo's frontend tsc is blind) | 35 errors on `d1ccd07`, 35 on the branch, the identical set. 0 new. `usePageMeta.ts` is clean |
| New scripts typecheck | Clean. The only errors are the 4 already in `VibeCollectionsService.ts` |
| `npm run build` | exit 0. `dist/index.html` has every tag, 0 `replit`, 0 canonical, 0 og:url. `dist/manifest.webmanifest`: `id '/'`, `start_url '/?utm_source=homescreen&utm_medium=pwa'` |
| `xmllint --noout public/sitemap.xml` | OK, 41 `<loc>` |
| `npm run test:adversarial` | 11/11 pass |
| Validator edge cases (`api/lib/attribution.ts`) | Valid set kept and lowercased. 300-char, `<script>`, bad host, unknown key → dropped. 64-char utm kept, 65 dropped. 129-char path dropped |

## Share card

`file`: PNG image data, 1200 x 630, 8-bit/color RGBA. 110,990 bytes.
Text bbox x 319.3–879.6 (inside 285–915), y 195.1–462.5.

What it shows: a near-black background (`#0a0a0f`) with a soft violet radial glow
behind the centre. "Terminal" in large off-white DM Serif Display, with a thin
violet "+" (`#7c6dfa`). A short violet rule below it. Under that, 2 centred lines
in DM Sans: "What to do at Changi:" and "T1 to T4 and Jewel". No logos, no
photos, no people.

Colour source: `tailwind.config.js` only holds the shadcn `hsl(var(--…))`
defaults. The colours the app paints are `--tp-bg #0a0a0f` and
`--tp-accent #7c6dfa` in `src/index.css`, so the card uses those.

## Database

| Check | Result |
|---|---|
| `pg_class.reloptions` | `{security_invoker=on}` |
| `has_table_privilege`, 7 privileges × anon and authenticated | all 14 false |
| Anon REST `GET /rest/v1/analytics_acquisition` | HTTP 401, `42501 permission denied for view analytics_acquisition` |
| `select count(*) from analytics_acquisition` | **0** |
| Same SQL without the env/is_test filters, limited to this run's sessions | 2026-10-03: `test` 1 session / 1 with journey; `cc16_legacy` 1 / 1; `probe` 1 / 0; `direct` 4 / 2 (typed-QF1 tab, browser reopen, hostile POST with only utm_medium, picker tab) |

## Preview acceptance, round 1 (browser 375×812, `tp_test=1` set before the first app load, browser TZ Asia/Jerusalem)

In round 1, `acquisition_src` preferred the tab's utm_source and fell back to the
old `tp_acquisition_src`. Round 2 replaced that, so the round-1 rows below
reflect the old rule.

| Item | Result | Evidence |
|---|---|---|
| Link from another origin with `?utm_source=test&utm_medium=qa&utm_campaign=cc16` | PASS | Referrer page served locally at `http://127.0.0.1:8123/`. session_start **192**: `{ref_host: 127.0.0.1, utm_source: test, utm_medium: qa, utm_campaign: cc16, landing_path: /}`. Skip → journeys `7129ab39-7e6f-4f63-ad0b-5ec6d4d501d8` `acquisition_src = test` |
| Old-style `?src=` link | PASS | `?src=cc16_legacy` → session_start **200** `utm_source: cc16_legacy`. Journey `4447275c-c57e-40cd-9151-2b7f914bff73` `acquisition_src = cc16_legacy` |
| Old client (sends only `acquisition_src`) | PASS | Direct `POST /api/journey` → `5ed082f1-d0b7-44bc-9842-dc087277b359` `cc16_oldclient` |
| Invalid utm_source falls back | PASS | `utm_source: "<script>"` + `acquisition_src: cc16_fallback` → `dc19ed5c-50de-46be-954d-d9628f46abd8` `cc16_fallback` |
| Direct `POST /api/events` (300-char utm_source, `<script>` utm_campaign and landing_path, `evil.com/<x>` ref_host, unknown key `evil`, valid utm_medium) | PASS | 200 `{"inserted":1,"rejected":[]}`. Stored payload of **208**: `{"utm_medium": "qa"}` only |
| Other event types unchanged | PASS | recommendation_impression rows 193–199 keep `{slugs, placement}` |
| G2 caveat (`/sin?…`, returning user) | PASS | See G2: row **275** |
| 5 sitemap URLs render and set their own title | PASS | `/` static title, 0 canonical. `/vibe/discover` "Discover at Changi · Terminal+", 7 spots. `/collection/discover/jewel-experience` "Jewel Experience · Terminal+", 7 of 7. `/collection/comfort/lounge-life` "Lounge Life · Terminal+" (h1 "Lounge Life 💎"), 7 of 7. `/vibe/quick` "Quick at Changi · Terminal+", 7 spots. Each non-home page has exactly 1 canonical: `https://terminalplus.app<own path>` |
| 0 console errors: home, vibe, collection, amenity, search | PASS | `read_console_messages onlyErrors`: none, in both tabs. The warnings are SW preload mismatches ("cross-world service worker resource mismatch"), which predate this change. Caveat: the production build drops `console.*` (terser `drop_console`), so this catches uncaught exceptions and resource failures only |

## Preview SMOKE, round 1 (`tasks/release-2026-09-report.md`)

| # | Line | Result | Evidence |
|---|---|---|---|
| 1 | Capture gate shows | PASS | "What brings you to Changi?" with Departing / Connecting / Just landed |
| 2 | Skip works | PASS | Lands on Home; journeys rows `flight_source='skipped'` (7129ab39, 4447275c) |
| 3 | Typed QF1 | PASS | Departing → T1 → "Enter manually" → QF1 → "Terminal T1 · Gate D46 · Boards 22:45 → LHR" → Looks right. Flight bar "3h 42m to board · On Time, QF1 · SIN → LHR, D46, T1" |
| 4 | Board picker | PASS | Change flight → board loaded 140 departures → picked QF2 (T1, 19:30). Bar "BOARDING NOW · QF2 · SIN → SYD · D46 · T1". Journey `9b08a782-6334-4531-a314-5fe2fca84faa` `flight_source='picker'` |
| 5 | Home: 7 vibe rows, photos, counts | PASS | Refuel, Shop, Chill, Explore, Comfort, Quick, Work. 31 of 31 images load, 0 broken (24 are native `loading=lazy` and never trigger in the hidden headless tab, so they were forced eager to check). 32 cards show "N spots"; the 8 without counts are the 8 collections with no row |
| 6 | `/vibe/refuel`: 7 items | PASS | Kopitiam (T1), T2 Food Gallery, Fossa Chocolate, Grain Traders, Kélé, Wang Cafe (Jewel), TWG Tea (T4) |
| 7 | Collection, amenity, search | PASS | `/collection/refuel/coffee-worth-walk` "7 of 7 spots". `/amenity/grain-traders-jewel` "Open · Until 22:00", title "Grain Traders, Jewel Changi · Terminal+". `/search` "laksa" → Kopitiam (T1) |
| 8 | Change flight → "Keep QF1" | PASS | "Change flight" heading, "Keep QF1" once. After Keep, `tp_journey_context` byte-identical (`capturedAt 2026-10-03T08:54:11.546Z`) |
| 9 | Non-Singapore TZ: hours follow SGT | PASS (simulated clock) | At run time (SGT ≈19:08, local ≈14:08) no SIN amenity has an opening or closing time in between, so the real clock can't tell the two readings apart. The page's `Date` was shifted to 13:30 UTC (SGT 21:30, Jerusalem 16:30) and the app navigated in-app to `/amenity/canopy-park-jewel-new` (10:00–21:00): **"Closed · Opens 10:00"**. A local reading would say open. Reloaded afterwards; `Date` native again |
| 10 | Chat uses the flight | PASS | `POST /api/chat` 200. Reply: "You've got plenty of time! … walking back to T1 and gate D46". Cards Starbucks, Koi Thé, Sushi Tei (all T1) |
| 11 | MCP | PASS | `initialize` 200 (`2025-03-26`, `terminal-plus`). `tools/list`: get_airport_context, get_disruption_status, get_recommendations, get_route. `get_recommendations {refuel, SIN-T1}` → 7. agent_interactions `e84b69d7-ced5-4032-a602-6ee948647747`, `is_test`, `mcp_session_key smoke-cc16-20261003` |
| 12 | Recent events include session_start and recommendation_impression | PASS | This run's anon `a0aa3a0f…`: session_start, recommendation_impression, search_performed, amenity_detail_dwell, flight_not_found |
| 13 | Typed path wrote 1 journeys row | PASS | `6e2d6ee1-2426-4518-9c6e-89b15980f5ba` QF1, `typed`, `departing` |

## Test rows from round 1 (all `is_test = true`, env `preview`)

- events (85): 192–241, 251–259, 268–293. Anon `a0aa3a0f-0ca3-475c-b795-168fd359a0ed` (browser) and `04f5fe18-942c-4a20-867c-4cd093a0ec48` (hostile POST, id 208).
- journeys (6): `7129ab39-7e6f-4f63-ad0b-5ec6d4d501d8`, `4447275c-c57e-40cd-9151-2b7f914bff73`, `5ed082f1-d0b7-44bc-9842-dc087277b359`, `dc19ed5c-50de-46be-954d-d9628f46abd8`, `6e2d6ee1-2426-4518-9c6e-89b15980f5ba`, `9b08a782-6334-4531-a314-5fe2fca84faa`.
- agent_interactions (1): `e84b69d7-ced5-4032-a602-6ee948647747`. The chat turn writes no row in this code (`api/chat.ts` has no agent_interactions insert).
- Non-test rows written since the watermark (events id > 191, journeys and agent_interactions after 08:48:58 UTC), from any source: **0**.

Rows in the same window that aren't from this run: events 242–250 and 260–267
(anon `a73f77be…`, including the event type `gate_prompt_shown`, which this branch
doesn't have), journeys SQ322 and SQ34 from the same anon, and the conversational
agent_interactions rows. They come from other sessions' preview deployments
writing to the same DB. All are `is_test`.

## Round 2: Todd's corrections, re-run on the preview

Corrections (3 Oct):
1. `journeys.acquisition_src` is first touch per browser: the first utm_source or
   src this browser ever sees, stored once in localStorage under its own
   versioned key and never overwritten. This visit's source stays on
   session_start only. The old `?src=` fallback goes; with no stored first
   touch, null.
2. The service worker must not answer `/api/`, `/.well-known/`, `/og/`,
   `/robots.txt` and `/sitemap.xml`. With it installed, `/robots.txt` must show
   the text file.

Commit `1a665f2`. Local checks: `npx tsc --noEmit -p api/tsconfig.json` exit 0;
reachable-file typecheck 35 = 35 errors, the identical set; `npm run build`
exit 0, and `dist/sw.js` carries
`denylist:[/^\/api\//,/^\/\.well-known\//,/^\/og\//,/^\/robots\.txt/,/^\/sitemap\.xml/]`;
`npm run test:adversarial` 11/11.

Preview `dpl_FwV3wQYSnPMwfqdgDVC61tLSskVb`. Watermark: events id > 348, journeys
after 11:23:37 UTC (0 non-test rows at that point). Browser 375×812, TZ
Asia/Jerusalem. Before any app load, on `/robots.txt` of the new origin:
`localStorage.clear()`, `sessionStorage.clear()`, every SW registration
unregistered, every cache deleted (all were already empty), then `tp_test=1`.
Each step below ran in a new tab.

### Attribution

| Step | session_start (this visit) | `tp_first_touch_v1` after | journeys.acquisition_src |
|---|---|---|---|
| A1 link from `http://127.0.0.1:8123/` with `?utm_source=%3Cscript%3E` (first visit) | **362** `{ref_host: 127.0.0.1, landing_path: /}` (`<script>` dropped by the server) | **absent**: the malformed value didn't take the slot | `ce9faa6b-33b9-45cc-83d0-dd2910ca8c0d` **null** (Skip) |
| A2 link with `?utm_source=test&utm_medium=qa&utm_campaign=cc16` | **372** `{ref_host, utm_source: test, utm_medium: qa, utm_campaign: cc16, landing_path: /}` | `{"src":"test","at":"2026-10-03T11:24:54.050Z"}` | `38ee7e62-1fa1-4c38-8cc8-909017b1066b` **test** (Skip) |
| A3 link with `?src=cc16_legacy`, then typed QF1 | **380** `{ref_host, utm_source: cc16_legacy, landing_path: /}` | unchanged (same `at`); `tp_acquisition_src` never written | `462c53bd-1fe3-4474-a6f3-fa240e953d62` QF1 typed, **test** |
| G2 `/sin?utm_source=probe&utm_campaign=cc16-g2`, stored journey, then the board picker | **419** `{utm_source: probe, utm_campaign: cc16-g2, landing_path: /sin}`; URL after boot `/`, `location.search` empty | unchanged | `04190546-0d22-4a56-9f68-4d1fa9111c1b` CZ8048 picker, **test** |

Direct API calls (`x-tp-test: 1`):

| Call | Stored |
|---|---|
| `POST /api/events` session_start: 300-char utm_source, `<script>` utm_campaign and landing_path, `evil.com/<x>` ref_host, unknown key `evil`, utm_medium `qa` | **418** `{"utm_medium": "qa"}` |
| `POST /api/journey` `acquisition_src: "QR_T3_Poster"` (what a pre-CC-16 client sends from its old key) | `6bad3414-9e7b-474a-b7ed-616315f622fb` **qr_t3_poster** |
| `acquisition_src: "<script>"` | `19e4eabf-aa8a-4e53-90ea-2a4eacb2fcdb` **null** |
| only `utm_source: "cc16_utm_only"` (the round-1 field) | `d1ffe4ec-2b38-4df7-8b2d-9291168b637b` **null** (no longer read) |
| no source at all | `71a2bc11-4794-4934-8463-2da8d2622a1a` **null** |

### Service worker installed

The SW registered on the first app load (`sw.js`, state `activated`,
`navigator.serviceWorker.controller` set). With it controlling the tab:

| Navigation | Result |
|---|---|
| `/robots.txt` | `text/plain`, the robots file (Sitemap line present), no `#root` |
| `/sitemap.xml` | `application/xml`, 41 `<loc>`, no `#root` |
| `/og/terminalplus-1200x630.png` | `image/png`, 1200×630 |
| `/.well-known/mcp.json` | `application/json`, the MCP manifest |
| `/api/events` (GET) | `application/json` `{"error":"Method not allowed"}` (the route's own 405) |
| `/vibe/refuel` | the app, served through the SW (`workerStart > 0`), "Refuel at Changi · Terminal+" |

Round 1, before the fix: with the SW installed, opening `/robots.txt` booted the
app and redirected to `/`.

Vercel serves `/sitemap.xml` as `application/xml`, so no `vercel.json` header is
needed for the production check.

### SMOKE, round 2

| # | Line | Result | Evidence |
|---|---|---|---|
| 1 | Capture gate shows | PASS | A1, A2, A3 tabs: "What brings you to Changi?" |
| 2 | Skip works | PASS | journeys `ce9faa6b…`, `38ee7e62…` `flight_source='skipped'` |
| 3 | Typed QF1 | PASS | "Terminal T1 · Gate D46 · Boards 22:45 → LHR" → Looks right. Bar "3h 19m to board · On Time, QF1 · SIN → LHR, D46, T1". Journey `462c53bd…` |
| 4 | Board picker | PASS | Change flight → 144 departures → CZ8048 (T1, 21:00). Bar "55 min to board · On Time, CZ8048 · SIN → SZX, D35, T1". Journey `04190546…` `picker` |
| 5 | Home | PASS | 7 rows (Refuel, Shop, Chill, Explore, Comfort, Quick, Work), 31 of 31 images, 0 broken, 32 count cards |
| 6 | `/vibe/refuel` | PASS | Kopitiam, T2 Food Gallery, Fossa Chocolate, Grain Traders, Kélé, Wang Cafe, TWG Tea |
| 7 | Collection, amenity, search | PASS | coffee-worth-walk "7 of 7 spots"; grain-traders-jewel "Open · Until 22:00"; "laksa" → Kopitiam (T1) |
| 8 | Change flight → Keep QF1 | PASS | 1 "Keep QF1". Context byte-identical (`capturedAt 2026-10-03T11:25:59.369Z`) |
| 9 | Hours follow SGT | PASS (simulated clock) | Page `Date` set to 13:30 UTC (SGT 21:30, Jerusalem 16:30). In-app nav to Canopy Park (10:00–21:00): "Closed · Opens 10:00". Reloaded; `Date` native |
| 10 | Chat | PASS | `POST /api/chat` 200. Reply uses the flight ("just over 3 hours… hang near your gate"), T1 cards Toast Box, Starbucks, Koi Thé |
| 11 | MCP | PASS | initialize 200 (`2025-03-26`), 4 tools, `get_recommendations` refuel/T1 → 7. agent_interactions `a5d8d424-7828-4c31-b2dc-d78fc83184c0` `is_test`, key `smoke-cc16-r2-20261003` |
| 12 | Recent events include session_start and recommendation_impression | PASS | Anon `920e94b7…`: session_start, recommendation_impression, search_performed, flight_not_found |
| 13 | Typed path wrote 1 journeys row | PASS | `462c53bd-1fe3-4474-a6f3-fa240e953d62` QF1 `typed` |

Sitemap sample (clean tab): `/` static title, no canonical. `/vibe/discover`
"Discover at Changi · Terminal+". `/collection/discover/jewel-experience`
"Jewel Experience · Terminal+". `/collection/comfort/lounge-life` "Lounge Life ·
Terminal+". `/vibe/quick` "Quick at Changi · Terminal+". Each non-home page has
exactly 1 canonical to `https://terminalplus.app<own path>`.

Console: in a clean tab (Home, 2 vibes, 2 collections, amenity, search), **0
errors**. The SW-check tab logged 1 error: the 405 from my own GET to
`/api/events`.

### Database, round 2

`select count(*) from analytics_acquisition` → **0**. The same SQL without its
filters, limited to round 2's sessions: `test` 1 (1 with journey), `cc16_legacy`
2 (1), `probe` 1 (1), `127.0.0.1` 1 (1; the A1 session, ref_host only),
`direct` 2 (0; the hostile POST and the clean tab).

The second `cc16_legacy` session (session_start **410**, 11:28:08) comes from the
simulated clock. Jumping `Date` 2 h ahead in the A3 tab tripped the 30-minute
idle rotation, so a new session started and carried that tab's landing, as
designed.

### Test rows, round 2 (all `is_test = true`, env `preview`)

- events (71): 362, 365–388, 399–444. Anon `920e94b7-2b93-40b1-b9d3-255b5bbf13d6` (browser) and `d3031bb8-3a30-4cac-8123-ee1c7c7fe21d` (418, hostile POST).
- journeys (8): `ce9faa6b-33b9-45cc-83d0-dd2910ca8c0d`, `38ee7e62-1fa1-4c38-8cc8-909017b1066b`, `462c53bd-1fe3-4474-a6f3-fa240e953d62`, `6bad3414-9e7b-474a-b7ed-616315f622fb`, `19e4eabf-aa8a-4e53-90ea-2a4eacb2fcdb`, `d1ffe4ec-2b38-4df7-8b2d-9291168b637b`, `71a2bc11-4794-4934-8463-2da8d2622a1a`, `04190546-0d22-4a56-9f68-4d1fa9111c1b`.
- agent_interactions (1): `a5d8d424-7828-4c31-b2dc-d78fc83184c0`.
- Non-test rows since the round-2 watermark, from any source: **0**.

## Production: PENDING

The agent's permission layer refused `git push origin
cc-16/share-card-attribution:main` as a production deploy. Production and
origin/main are still `d1ccd07`, and the branch is a fast-forward of it. Todd
pushes:

```bash
git push origin cc-16/share-card-attribution:main
```

If another branch (CC-13 touches `api/events.ts`, `src/lib/telemetry.ts`,
`AmenityDetailPage.tsx` and `tasks/lessons.md`) lands on main first, this is no
longer a fast-forward and needs a merge plus a fresh preview SMOKE.

Then (acceptance):
- `curl -A "facebookexternalhit/1.1" https://terminalplus.app/`: every COPY tag, no `rel="canonical"`, no og:url, no replit.com.
- The og:image URL: 200 `image/png`, 1200×630, 110,990 bytes.
- `/robots.txt` names `https://terminalplus.app/sitemap.xml`. `/sitemap.xml` 200 `application/xml` (as on the preview), passes `xmllint`.
- 5 sampled URLs in a browser with `tp_test` on, and `/robots.txt` as text with the SW installed.

## Observations (not CC-16 failures)

- **Chat.** The hours field under each chat card renders 1 character ("{" for Starbucks, "0" or "1" for others). Replies show raw `**bold**`. One reply sent a departing passenger to Jewel, which is landside. Neither `ChatPanel.tsx` nor `api/chat.ts` is in this diff.
- **Same card for every URL.** Link-preview crawlers don't run JS, so every link shows the home card. Per-page cards need SSR or edge middleware.
- **Shared checkout and DB.** Other sessions (CC-13, CC-6) switched this directory's branch three times while CC-16's work was uncommitted (reflog 08:45–08:47 UTC). Nothing was lost, because all branches pointed at `d1ccd07`. They also applied migrations (`20261003084830`, `20261003085434`) and write `is_test` preview rows into the same tables, which is why every query in this report is scoped by this run's anon ids.
- **Old key left in place.** Browsers that saw `?src=` before CC-16 still hold `tp_acquisition_src` in localStorage. Nothing reads it now; it's left alone rather than deleted on every load.
