# CC-16 report: share card, sitemap, session attribution

**Status: preview PASS (SMOKE 13/13 and all preview acceptance). Production: PENDING.**
The fast-forward push to `main` was refused by the agent's permission layer as a
production deploy, so production is unchanged. Production still runs
`d1ccd07` (`dpl_HEo7r8fyJrkJ3YQKfcw6k4ovXS7L`). The production section below lists
what remains.

Run date: 2026-10-03. Branch `cc-16/share-card-attribution`, head `3762540`.
Preview `dpl_8mhCrAckP4A2hVbY2W8WbqfJ9sEM`
(`terminal-plus-frontend-2ukh5l8dz-…vercel.app`), READY 08:51 UTC, sin1.
Rollback target: `dpl_HEo7r8fyJrkJ3YQKfcw6k4ovXS7L` (`d1ccd07`).

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
| `vite.config.ts` | Manifest `id: '/'`, `start_url: '/?utm_source=homescreen&utm_medium=pwa'`. Also `globIgnores: ['og/**']`, so the service worker doesn't precache the share card (27 → 26 precache entries, 2025 → 1917 KiB). Not in the prompt; it undoes a side effect of adding the PNG |
| `src/lib/telemetry.ts` | `captureLanding()` at module load, stored once per tab in sessionStorage `tp_landing`: utm_* (≤64 chars), `?src=` as utm_source when that's absent, `ref_host` when the referrer is another host, `landing_path` (≤128). Every session_start carries it |
| `src/lib/journeyRecord.ts` | Sends `utm_source` from the landing |
| `api/lib/attribution.ts` | New. `utmValue()` and `sessionStartPayload()`. Invalid values are dropped, never cleaned |
| `api/events.ts` | session_start payload reduced to the 7 keys. Other types unchanged |
| `api/journey.ts` | `acquisition_src = utmValue(utm_source) ?? str(acquisition_src, 64)` |
| `src/hooks/usePageMeta.ts` + Vibe, Collection, Amenity pages | Per-page `document.title` and rel=canonical to the page's own path; restored on unmount. Emoji stripped from collection names in titles |
| `supabase/migrations/20261003084912_analytics_acquisition.sql` | View per SGT day × source (`coalesce(utm_source, ref_host, 'direct')`): sessions, sessions_with_journey, sessions_with_tap. `security_invoker = on`, production non-test rows only, `revoke all` from anon and authenticated. Applied with `apply_migration analytics_acquisition`; the DB recorded `20261003084912`, and the file (written as `…084701`) was renamed to match before commit |
| `package.json`, lock | devDependency `@resvg/resvg-js` 2.6.2 (lock diff adds only `@resvg/*`). Scripts `og:image`, `sitemap` |

Commits: `e2dac96` (card, sitemap, manifest), `69f6de3` (attribution, titles),
`3762540` (migration). Each was gated `scan && git commit` on the staged diff's
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

## Preview acceptance (browser 375×812, `tp_test=1` set before the first app load, browser TZ Asia/Jerusalem)

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

## Preview SMOKE (`tasks/release-2026-09-report.md`)

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

## Test rows from this run (all `is_test = true`, env `preview`)

- events (85): 192–241, 251–259, 268–293. Anon `a0aa3a0f-0ca3-475c-b795-168fd359a0ed` (browser) and `04f5fe18-942c-4a20-867c-4cd093a0ec48` (hostile POST, id 208).
- journeys (6): `7129ab39-7e6f-4f63-ad0b-5ec6d4d501d8`, `4447275c-c57e-40cd-9151-2b7f914bff73`, `5ed082f1-d0b7-44bc-9842-dc087277b359`, `dc19ed5c-50de-46be-954d-d9628f46abd8`, `6e2d6ee1-2426-4518-9c6e-89b15980f5ba`, `9b08a782-6334-4531-a314-5fe2fca84faa`.
- agent_interactions (1): `e84b69d7-ced5-4032-a602-6ee948647747`. The chat turn writes no row in this code (`api/chat.ts` has no agent_interactions insert).
- Non-test rows written since the watermark (events id > 191, journeys and agent_interactions after 08:48:58 UTC), from any source: **0**.

Rows in the same window that aren't from this run: events 242–250 and 260–267
(anon `a73f77be…`, including the event type `gate_prompt_shown`, which this branch
doesn't have), journeys SQ322 and SQ34 from the same anon, and the conversational
agent_interactions rows. They come from other sessions' preview deployments
writing to the same DB. All are `is_test`.

## Production: PENDING

Not done: the agent's permission layer refused `git push origin
cc-16/share-card-attribution:main` as a production deploy. Production and
origin/main are still `d1ccd07`, and `cc-16/share-card-attribution` is a
fast-forward of it. To ship:

```bash
git push origin cc-16/share-card-attribution:main
```

Then check (acceptance):
- `curl -A "facebookexternalhit/1.1" https://terminalplus.app/`: every COPY tag, no `rel="canonical"`, no og:url, no replit.com.
- `curl -sI https://terminalplus.app/og/terminalplus-1200x630.png`: 200 `image/png`, 110,990 bytes.
- `/robots.txt` names `https://terminalplus.app/sitemap.xml`. `/sitemap.xml` 200 with an XML content type, passes `xmllint`. If the content type isn't XML, the fix is a `vercel.json` header (protected; needs a plan).
- 5 sampled URLs in a browser with `tp_test` on.

## Observations (not CC-16 failures)

- **Service worker and robots/sitemap.** The PWA's generated service worker has a `NavigationRoute` with no denylist, so a browser that already has the SW installed gets the app shell when it navigates to `/robots.txt` or `/sitemap.xml`. Seen on the preview: opening `/robots.txt` after an earlier app load booted the app and redirected to `/`. Crawlers don't run service workers, so the curl acceptance is unaffected. A person checking the sitemap in their own browser will see the app. Fix: `navigateFallbackDenylist: [/^\/api\//, /\.(xml|txt)$/]` in `vite.config.ts`.
- **First-touch `?src=` fallback.** `journeys.acquisition_src` prefers this tab's utm_source, then falls back to the first-touch localStorage `tp_acquisition_src`. A later direct visit in another tab therefore credits an earlier link: the QF1 and QF2 journeys came from tabs with no source but carry `cc16_legacy`. session_start rows don't have this (they carry only the tab's own landing).
- **Chat cards.** The hours field under each card renders 1 character ("{" for Starbucks, "1" for Koi Thé). The reply also sent a departing passenger to Jewel, which is landside. Neither `ChatPanel.tsx` nor `api/chat.ts` is in this diff.
- **Same card for every URL.** Link-preview crawlers don't run JS, so every link shows the home card. Per-page cards need SSR or edge middleware.
- **Shared checkout.** Other sessions (CC-13, CC-6) switched this directory's branch three times while CC-16's work was uncommitted (reflog 08:45–08:47 UTC). Nothing was lost, because all branches pointed at `d1ccd07`. CC-6 also applied migration `20261003084830_agent_interactions_chat_usage` a minute before CC-16's.
