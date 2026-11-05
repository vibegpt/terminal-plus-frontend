# CC-27A · catalogue dedupe: report

Status, 5 Nov 2026: code on preview, all preview checks run. **Migration NOT applied.** Stopped before G2b
(Todd's pg_dump) as instructed. Branch `cc-27a/catalogue-dedupe` at `fdd651d`; preview
`dpl_Dxw8Zs8sLcfP1ihED6BnMR8M4M6D`, alias `terminal-plus-frontend-git-cc-27-27d57e-todds-projects-d0181971.vercel.app`,
bundle `index-ByyjJWpb.js` (= server's). Prompt: `tasks/cc-27a-catalogue-dedupe.md`.

## Gates

| Gate | Result | Evidence |
|---|---|---|
| G1 | PASS | Production `dpl_8U3f9zFk…` = `70bf1cf` = origin/main. Worktree `~/tp-cc-27a`. |
| G2a | PASS | JSON snapshot, `~/tp-backups/2026-11-05/` (700/600): amenity_detail 378, collection_amenities 989, amenity_vibe_mappings 398, amenity_vibe_descriptions 447, route_stops 30, collections 45. Each file parsed back; counts = live `count(*)`, unchanged at 09:18:56 UTC. |
| G2b | PASS (restore test, replaces the pg_dump; Todd, 5 Nov) | No `catalogue.sql` was found. Restore test instead: schema `restore_test`, 6 tables `like public.<t>`, loaded from the G2a JSON via `json_populate_recordset` (`supabase db query --linked -f`, project linked in a scratch workdir). Count and `md5(string_agg(row::text,'\|' order by id))` equal public for all 6: amenity_detail 378 `da682e39…`, collection_amenities 989 `527495fa…`, amenity_vibe_mappings 398 `4f6488eb…`, amenity_vibe_descriptions 447 `be443c70…`, route_stops 30 `6c866c24…`, collections 45 `65a7f711…`. `drop schema restore_test cascade`; 0 schemas, 0 relations left (10:12 UTC). Rollback script `scripts/cc27a-restore.sql` (not run) checks those fingerprints. |
| G3 | PASS (items held) | changiairport.com directory API (64 attractions, 54 facilities) + shop/dining directory JSON (770 outlets). Raw copies in `~/tp-backups/2026-11-05/g3/`. |
| G4 | PASS | 0 route_stops touched; amenity_interactions, user_visits, collection_amenity_mappings empty; old slugs only in dead files. min_items isn't read by live code. |
| G5 | PASS | URLs `/amenity/<slug>`; terminal route exists, unused. Sitemap had no amenity URLs. |
| G6 | PASS | See the decisions section of the chat record; summary below. |

Decisions (Todd, 5 Nov): approved as recommended. D3 hotels held (official name "Changi Transit Hotel");
D4 Sky Nets T1/T4 deleted; D5 unverified rows held; D6 keeper = most references, then lowest id; D7 accept
thinner collection variants; D8 brand key = shared brand_family else name stem; D9 sentence on
get_recommendations only, rule = no minutes; D10 sitemap gains amenity pages. Part E within-brand order
(Todd, 5 Nov): reachable > open now > passenger's terminal > same side > score > stable order.

## Action list (63 rows) and evidence

Generated, not typed: `supabase/migrations/20261105103155_cc27a_catalogue_dedupe.sql` holds every row with
its canonical slug and evidence URL (29 deleted, 1 moved, 33 merged). Per-row impact:
`~/tp-backups/2026-11-05/g4_actions_final.json`.

| Group | Rows | Canonical | Evidence |
|---|---|---|---|
| Butterfly Garden | t1/t2/t4-new deleted | butterfly-garden-t3-new | changiairport.com/en/experience/attractions-directory/butterfly-garden.html |
| Cactus Garden | t1-new, t2/t3/t4-new deleted | cactus-garden-t1 | …/attractions-directory/cactus-garden.html |
| Sunflower Garden | t1/t3/t4-new deleted | sunflower-garden-t2-new | …/attractions-directory/sunflower-garden.html |
| Canopy Park | t2/t3/t4-new deleted | canopy-park-jewel-new | jewelchangiairport.com/en/attractions/Mastercard-canopy-bridge.html |
| Mirror Maze | t1/t2/t4-new deleted | mirror-maze-jewel-new | …/mirror-maze.html |
| Rain Vortex | t1/t2-new deleted | rain-vortex-jewel-new | …/rain-vortex.html |
| Foggy Bowls | t2/t3-new deleted | foggy-bowls-jewel-new | …/foggy-bowls.html |
| Changi Experience Studio | t3/t4-new deleted | changi-experience-studio-jewel-new | …/ces.html |
| Shiseido Forest Valley | t1-new deleted | shiseido-forest-valley-jewel-new | …/forest-valley.html |
| Manulife Sky Nets (D4) | t1/t4-new deleted | manulife-sky-nets-jewel-new | …/walking-net.html |
| Travelling Family | travelling-family-sint1 deleted | travelling-family | …/attractions-directory/travelling-family.html |
| Vessel | vessel-sint2 deleted | vessel | …/attractions-directory/vessel.html |
| YOTELAIR | t2-new moved (Jewel, landside); t3/t4-new deleted | yotelair-singapore-changi-jewel | …/facilities-and-services-directory/transit-hotels.html |
| Lotte Wines & Spirits | 21 duplicates merged into 20 verified outlets | per outlet | …/shop-detail.lotte-duty-free-wines-spirits.html |
| Guardian | 3 merged (T1 #02-16, T2 #02-13, T3 #B2-24) | per outlet | …/shop-detail.guardian-health-beauty.html |
| Garrett, Tiffany, Victoria's Secret, Kering, Tod's, WH Smith ×3, LEGO | 9 merged | per outlet | each brand's shop-detail page |

Held (not in the migration): Koi Pond ×4, Entertainment Deck ×4, Jewel Waterfall Viewpoint, Sprint-Cass ×4,
Victoria's Secret T2, WH Smith T2 L1 #26 pair and T3 shop 7, Garrett T4 ×2, TWG T4 row 118, Lotte T2 #02-91
pair and the 3 generic "Lotte Duty Free" rows, Aerotel ×2, Ambassador ×2, lounges (Cathay, SilverKris,
SATS T4, dnata).

## Dry run (BEGIN … raise, 09:33 UTC; rolled back)

| Check | Before | After |
|---|---|---|
| amenity_detail | 378 | 316 |
| Lotte Wines & Spirits | 43 | 22 |
| collection_amenities | 989 | 809 |
| vibe mappings / descriptions | 398 / 447 | 315 / 369 |
| Jewel-only names off Jewel | 15 | 0 |
| Butterfly / Cactus / YOTELAIR | T1–T4 / 5 rows / T2–T4 | T3 / cactus-garden-t1 / Jewel landside |
| dup slugs / unique index | 1 / 0 | 0 / 1 |
| zones / mismatches / orphans / route_stops missing | 0 / 0 / 0 / 0 | 29 / 0 / 0 / 0 |
| backup rows | — | 63, 0 missing canonical or evidence |

Rollback check after the run: 378 / 989 / 398 / 447, no backup table, no index, 0 zones. Raw:
`~/tp-backups/2026-11-05/dryrun-2026-11-05T0933Z.json`.

## Code (`fdd651d`)

- `shared/ranking/policy.ts`: `agentJourneyType` (D2), `brandNameStem`, `brandKeyFor`, `compareOutlets`,
  `passengerIsLandside`, `withOtherOutlets`. `landsideCopy.ts`: `agentNoTime`.
- `api/lib/ranking.ts`: brand once, within-brand order, `other_outlets`, selects `brand_family, zone`,
  `agentNoTimeRule` + `landsideHiddenNoTime`.
- `api/mcp.ts` (zero-edit rule lifted for D and E): optional `landside_note`, `zone`, `other_outlets`; 1
  sentence on get_recommendations.
- `src/utils/smart7Select.ts` + `terminalSelect`; `src/pages/VibePage.tsx`: terminal tabs dedupe by brand
  (they had no dedupe), zone line, "+N more in T2".
- `scripts/cc27a-redirects.ts` → `vercel.json` redirects (124, both URL shapes); `--verify` after the
  migration. `scripts/sitemap.ts` gains amenity pages minus redirected slugs (regenerate after migration).
- Tests: adversarial 12–14, `tests/brand-outlets.test.ts` (4).

Local: api tsc exit 0; changed app files typecheck with 1 error that main has too (unused `React` in
VibePage); build exit 0; unit 20/20 + 4/4; adversarial 14/14.

## RQS (20 smart7-eval scenarios, score_smart7.py checks, shipped rankers, live data, fixed SGT clock)

| Path | main `70bf1cf` | branch `fdd651d` |
|---|---|---|
| Vibe feed (smart7Select) | 0.8083 (12/20 at 1.00) | 0.7500 (11/20) |
| MCP (rankAmenities) | 0.7917 (12/20) | 0.7500 (11/20) |

Changes, all three explained:
- s08 (T1 night Quick) and s11 (T3 20 min Quick): main filled 5–6 slots with Guardian outlets; with a
  brand once, fewer than 7 distinct open brands remain, so "7 results" and "min same terminal" fail. The
  old score counted duplicates as results; neither scenario checks brands.
- s07 (T3 premium Comfort): two SilverKris rows tie on terminal (neither T3), side and score; main broke the
  tie by static terminal priority and kept the T1 row, the only one flagged `is_flagship`. Stable order keeps
  T2. The flag sits on a row the official site doesn't list (SilverKris is T2 and T3).
Harness: scratchpad `_rqs.ts`, outputs in `~/tp-backups/2026-11-05/evidence/rqs-*.txt`. The 25 Sep numbers
came from a SQL port; this harness runs the TypeScript, so compare before/after here, not with 25 Sep.

## Acceptance on preview (current data, before the migration)

| AC | Result | Evidence |
|---|---|---|
| AC-5 | PASS (HTTP) | 124/124 redirect sources → 308 to the canonical path; destination 200 (`evidence/ac5.txt`). 200 is the SPA shell for any path; `yotelair-singapore-changi-jewel` renders only after the migration. Re-check after. |
| AC-8 | PASS on today's rows; re-run after | T1 60 min: no Butterfly, no Cactus, no Jewel attraction under a terminal. T4 240: Butterfly Garden at T3. YOTELAIR shows SIN-T4 until the migration. `evidence/ac8a.json`, `ac8b.json`. |
| AC-9 | Before-state captured; re-run after | Board pick QF36 (T1, 66 min). T1 tab: no Butterfly Garden (`ac9-t1-explore-66min.jpg`), but the phantom T1 row only ranks below 7. T3 tab: Butterfly Garden T3, and the phantom "Cactus Garden · T3" (`cactus-garden-t3-new`) the migration deletes (`ac9-t3-explore-66min.jpg`). |
| AC-11 | PASS | T1 refuel, no minutes: 7 recs, 0 landside, `landside_note` exact text. 240 min: 6 landside, each labelled "Landside: clear immigration both ways (visa rules apply)", no note. `ac11a.json`, `ac11b.json`. |
| AC-12 | PASS (Guardian) | MCP T2 shop 120: no brand twice. Guardian kept = T2 #02-155 (passenger's terminal), `other_outlets` 5 = T1 rows 27 + 50044 (#02-16, a duplicate pair the migration merges), 50045 (#02-69); T3 50244 (#02-66), 50245 (#02-29). Excluded: T2 #02-13 and T3 #B2-24 (landside ×4 rows; hidden at 120 min for an unknown-type passenger). Expected after the migration: 4, with zones. App T2 shop tab: Guardian once, no "+N more" (T2 has no other reachable Guardian). App All tab: "+1 more in T4" (LEGO) and "+1 more in T1" (Garrett). Zone line appears after the migration fills `zone`. |
| AC-13 SMOKE | 13/13 PASS | See below. |
| MCP smoke | PASS | `scripts/mcp-smoke.mjs` on the alias: 10/10 steps, 4 tools, p95 1833 ms. |
| Adversarial | 14/14 PASS | incl. 12–14 (local, live DB, anon key). |

### Preview SMOKE (375×812, browser TZ Asia/Jerusalem, 09:53–10:02 UTC, `?tp_test=1`)

| # | Result | Evidence |
|---|---|---|
| 1 | PASS | "What brings you to Changi?" + 3 types + Skip |
| 2 | PASS | Skip → Home; journeys `f8097b02` skipped |
| 3 | PASS | Change flight → Enter manually → QF1 → "Terminal T1 · Boards 23:00 → LHR" → Looks right; bar "4h 59m to board · QF1 · SIN → LHR"; journey v4 typed |
| 4 | PASS | Board loaded; picked QF36 → "1h 6m to board · On Time, D34, T1"; journeys `59d8b93b` picker |
| 5 | PASS | 7 vibe rows, 31/31 images, 32 counts |
| 6 | PASS | /vibe/refuel: 7 spots |
| 7 | PASS | coffee-worth-walk "7 of 7 spots"; /amenity/grain-traders-jewel renders; search "laksa" → Kopitiam T1 |
| 8 | PASS | Change flight → "Keep QF36" → `tp_journey_context` identical |
| 9 | PASS | Local 11:57, SGT 17:57; Home "Evening picks" |
| 10 | PASS | Chat: "plenty of time", cards dnata Lounge, Toast Box (Before immigration), Starbucks, all T1 |
| 11 | PASS | MCP initialize/tools/list (4)/tools/call |
| 12 | PASS | anon `f5dcdeec…`: session_start 1, recommendation_impression 17 (events 1846–1869, all is_test, preview) |
| 13 | PASS | journeys `7dea40dc` typed QF1, is_test, preview |

## Findings

1. At 375 px, "+1 more in T4" wraps the hours label onto two lines (`evidence/ac12-all-shop-more-line.jpg`).
   Proposed fix: put "+N more" on the zone line. Not changed yet.
2. At 240 min, T1 refuel (MCP and vibe feed) is mostly landside: 6 of the top 7. Existing editorial order,
   not this change.
3. Chat still suggests rows G3 couldn't verify (dnata Lounge). Chat isn't on rankAmenities (open follow-up).

## Next (needs Todd)

1. G2b: Todd's pg_dump.
2. Apply the migration (on Todd's go), then: `npx tsx scripts/cc27a-redirects.ts --verify`, regenerate the
   sitemap, AC-1–4, AC-6, AC-7 (reachable code), AC-10, re-run AC-5 (YOTELAIR renders), AC-8, AC-9, AC-12
   (count 4 + zone line).
3. Merge to main after that.

Test rows from this run: events 1846–1869, journeys `f8097b02`, `59d8b93b`, `7dea40dc`, agent_interactions
session `smoke-cc27a-20261105` (5) and the smoke script's session (4); all is_test.
