# CC-27B · ship the catalogue dedupe: report

Status, 12 Nov 2026: Parts A and B done on the preview; **Part C (merge, production) waits for Todd's GO.**
Branch `cc-27a/catalogue-dedupe` (history intact, merge commit when shipped). Code commits `36190aa` (slug map,
card line, landside test) and `dd868d1` (bookmark collapse fix). Preview alias
`terminal-plus-frontend-git-cc-27-27d57e-todds-projects-d0181971.vercel.app`, `dpl_G55eWGkHwotv6Y96ZNzbuGipU8HR`,
bundle `index-C97M7USN.js`. Production still runs `70bf1cf` (`dpl_8U3f9zFk…`) on the migrated data.
Evidence (not committed): `~/tp-backups/2026-11-12/evidence/`.

## Gates

| Gate | Result | Evidence |
|---|---|---|
| G1 | PASS | origin/main = production = `70bf1cf`; branch 0 behind, 5 ahead; `~/tp-cc-27a` clean at `a6ec55e` |
| G2 | PASS | `amenity_detail` 316; backup 63 (deleted 29, moved 1, merged 33); 62 rows with slug <> canonical; `amenity_detail_amenity_slug_key` UNIQUE on `amenity_slug` |
| G3 | PASS | `--verify`: "63 rows → 124 redirects; vercel.json MATCHES". The prompt's "127 entries" is the CC-17 landside count; vercel.json has 124 |
| G4 | FAIL, then fixed | `npm ci` failed in puppeteer's postinstall (half-installed browser cache) and left `node_modules` empty; reran with `PUPPETEER_SKIP_DOWNLOAD=1`. Then 89/90 unit tests: the landside live test compared the live set to the 127 frozen slugs (live is now 100). Fixed with Todd's approval (below). Build, api tsc, adversarial 14/14 green |

## Part A · deferred CC-27A acceptance on the migrated data

| AC | Result | Evidence |
|---|---|---|
| AC-1 | PASS | 63 rows; 0 without canonical or evidence; 0 canonical slugs missing from `amenity_detail` |
| AC-2 | PARTIAL | 7 Jewel-only names exist only at SIN-JEWEL (7 rows, 0 elsewhere); Butterfly Garden 1 row T3; Cactus Garden 1 row T1 (`cactus-garden-t1`, name "Rooftop Cactus Garden"); YOTELAIR 1 row SIN-JEWEL, landside. **Aerotel is 2 rows (`aerotel-singapore-t2-new`, `-t3-new`), not 1 at T1**: held under D3 (5 Nov), reported, not patched |
| AC-3 | PASS | 0 terminal mismatches (non-null); 0 orphan links; 809 links, **118 with null `terminal_code`** (138 of 989 in the 5 Nov backup: pre-existing). Variants under `min_items` not re-listed (D7) |
| AC-4 | PASS | 0 non-null slugs missing; 4 of 30 stops have a null slug (same 4 in the backup) |
| AC-5 | PASS | 124/124 old URLs → 308 to the canonical path; 45 distinct destinations → 200 (`ac5.mjs`). `/amenity/yotelair-singapore-changi-jewel` renders "YOTELAIR Singapore Changi · Jewel Changi" with "Landside: outside immigration" (`a-ac5-yotelair-renders-jewel.jpg`) |
| AC-6 | PASS | sitemap 359 URLs (316 amenity); 0 of the 62 old slugs; `npm run sitemap` output identical to the committed file |
| AC-7 | PARTIAL | 0 hits in `src/ api/ shared/ public/ scripts/` outside 9 dead files (`CollectionService 2/3.ts`, 3 `scripts/*Clean*CSV 2.ts`, 4 `*missing-amenities*` csv/txt). CC-9 |
| AC-8 | PASS | T1 explore 60 min: Butterfly Garden only as T3; no Cactus Garden; no Jewel attraction under a terminal. T4 explore 240: Butterfly T3, no YOTELAIR (`mcp-out.json`) |
| AC-9 | PARTIAL | T1 tab: 7 spots, all T1, no Butterfly Garden (`a-ac9-t1-explore-tab.jpg`); T3 tab lists Butterfly Garden. The 60-minute board-pick condition was **not** reproduced |
| AC-10 | **FAIL as written** | Lotte Duty Free Wines & Spirits 22 rows = 20 verified + held #02-91 pair (id 64 `lotte-duty-free-wines-spirits-t2-level-2-91`, id 50155 `lotte-duty-free-wines-spirits-level-2-shop-91-sint2`, both SIN-T2 "Level 2, shop 91 (airside)"): 1 duplicate group. 3 generic "Lotte Duty Free" rows held. 0 duplicate slugs; UNIQUE index present. Todd accepted the held pair as known (12 Nov) |
| AC-11 | PASS | T1 refuel no minutes: `landside_note` present, 0 landside rows. 240 min: no note, 6 rows labelled landside |
| AC-12 | PASS | MCP shop T2 120 min, limit 12: no brand twice; Guardian kept at T2 #02-155 with `other_outlets` 4, each with a zone (Lotte is not in the top 12). App T2 shop tab at 375 px: Guardian once, zone line visible |

## Part B · slug map

| Change | File | Notes |
|---|---|---|
| `--slug-map` (D1) | `scripts/cc27a-redirects.ts` | reads the backup table (service role), sorted keys; `--verify --slug-map` checks both files: "62 slug-map entries; shared/catalogue/slugMap.ts MATCHES" |
| `SLUG_MAP`, `resolveSlug` | `shared/catalogue/slugMap.ts` (generated) | 62 entries; identity when absent; chains not followed |
| resolve before fetch (D2) | `src/pages/AmenityDetailPage.tsx` | `navigate('/amenity/<canonical>' + search, { replace: true, state })`; page stays loading, no "Not found" flash |
| bookmarks (D2) | `src/hooks/useBookmarks.ts` | `read()` maps, collapses duplicates keeping the canonical entry's fields and the earliest `savedAt`, writes back once |
| "+N more" line (D4) | `src/pages/VibePage.tsx` | on the zone line, alone when zone is null; hours label untouched |
| tests | `tests/slugMap.test.ts` (5), `tests/landside-policy.test.ts` | live landside test expects the 127 approved slugs mapped through `resolveSlug` (100 unique = the live set, 0 missing, 0 extra) |

Local: unit 95/95 (0 skipped, the live-table tests ran), `npm run build` exit 0, api tsc exit 0, adversarial 14/14.

## Acceptance · Part B (preview, SW installed and controlling, 375 px)

| AC | Result | Evidence |
|---|---|---|
| AC-B1 | PASS | 45 distinct canonical values (the 62 old slugs collapse onto 45; the prompt's "62" counts keys): 45 present in `amenity_detail`; 0 of the 62 keys present |
| AC-B2 | PASS | Cleared the SW and caches, reloaded onto the new build, `navigator.serviceWorker.controller !== null`, then a full navigation to the old URL. `butterfly-garden-t1-new` → `/amenity/butterfly-garden-t3-new`, "Butterfly Garden, Terminal 3", Open until 23:00. `yotelair-singapore-changi-t2-new` → `/amenity/yotelair-singapore-changi-jewel`, Jewel Changi, landside notice. `lotte-duty-free-wines-spirits-level-1-shop-10-sint1` → `…-t1-level-1-10`, Terminal 1. `b2-*.jpg`. The browser pane has no address bar, so the URL is `location.pathname` plus the tab title. This was on bundle `BN_GQKIu` (`36190aa`); the later commit changes only `useBookmarks` |
| AC-B3 | **FAIL as written** | Real offline (Chrome, SW-controlled, `setOfflineMode(true)`): the old slug resolves to the canonical URL, but the page shows "Not found". So does the canonical slug itself offline. Supabase REST isn't runtime-cached (`vite.config.ts:72` caches only `https://api.`), and any fetch error renders "Not found". Pre-existing; not caused by the map. `offline-*.png`. Follow-up below |
| AC-B4 | PASS | Seeded `butterfly-garden-t1-new` (T1) + `butterfly-garden-t3-new` (T3): 1 card "Butterfly Garden · Terminal 3 · Open until 23:00", storage `[{"amenitySlug":"butterfly-garden-t3-new",…,"terminalCode":"SIN-T3","savedAt":"2026-11-01T10:00:00.000Z"}]` (`b4-saved-after-fix.jpg`). Airside, so no landside chip. The first run (`36190aa`) showed "Terminal 1" for a T3 venue because the merge kept the old entry; fixed in `dd868d1` with a unit test (`b4-saved-first-run-wrong-terminal.jpg`) |
| AC-B5 | PASS | T2 shop at 375 px: Eu Yan Sang and Guardian both show "+1 more in T2" on the zone line; the hours label is one line (16 px). `b5-t2-shop-after-d4.jpg` beside `a-ac12-t2-shop-zone-line-before-d4.jpg` (wrapped) |
| AC-B6 | PASS | `curl -I`: `HTTP/2 308`, `location: /amenity/butterfly-garden-t3-new`. Fresh Chrome profile, no SW, direct hit: chain `308 …t1-new -> …t3-new`, lands on the canonical URL, "Butterfly Garden, Terminal 3", hours shown (`nosw-butterfly.png`) |
| AC-B7 | PASS | `npm run build` exit 0; `tests/slugMap.test.ts` 5/5 (CI runs `tests/*.test.ts`); `git diff a6ec55e -- api/mcp.ts api/lib/ranking.ts shared/ranking vercel.json supabase/migrations public/sitemap.xml` is empty, so those match the cc-27a diff |
| AC-B8 | this file | |

## Findings and follow-ups (none fixed here)

1. **Offline shows "Not found" for every amenity** (AC-B3). A fetch failure and a missing row take the same branch. Follow-up: tell a network error from a missing row and show an offline state; needs an `AmenityDetailPage` edit outside this prompt's list.
2. **A lone old bookmark keeps its old terminal.** A single bookmark saved under `butterfly-garden-t1-new` is remapped to the T3 slug but still shows "Terminal 1". SavedPage already fetches the catalogue row, so it should take the terminal (and name) from it. Not done.
3. Held Lotte #02-91 pair (ids 64, 50155) and Aerotel T2/T3: unchanged, Todd's holds.
4. YOTELAIR's description says "right in Terminal 2" and hours say "Until 23:00" (site: 24 hours); the record is at Jewel.
5. 118 collection links have a null `terminal_code`; 4 route stops have a null slug (pre-existing).
6. AC-9's 60-minute board-pick condition not reproduced; the capture flow in the pane ended on a test-tagged `SQ000` placeholder journey.
7. 9 dead files still hold old slugs (CC-9).

## Test rows written

Browser runs used `?tp_test=1` / `localStorage.tp_test`; MCP calls sent `x-tp-test: 1`. In the 4 h of this work: `events` 1889–1940 (52 rows, all `is_test`, `env = preview`, 0 non-test), `journeys` 1 row (is_test, preview, `SQ000`), `agent_interactions` 14 rows (all `is_test`). No production rows written.

## Part C · production

Not started: waiting for Todd's GO.
