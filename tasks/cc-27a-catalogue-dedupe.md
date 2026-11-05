# CC-27A · catalogue dedupe (prompt, 5 Nov 2026)

Saved verbatim from Todd's message. Source: terminal-plus-cc-27a-catalogue-dedupe-2026-11-05.md (2 code blocks).

```
- Read CLAUDE.md and tasks/lessons.md first.
- Plan mode first. Post the plan and a file-change table. Wait for approval before editing.
- Prerequisite gates: if one fails, halt and report it. Report BLOCKED items as BLOCKED.
- Evidence for every claim: command output, SQL result, or a browser observation.
  Never write "should work".
- Write the report to tasks/<prompt-id>-report.md. After any correction, append the lesson to tasks/lessons.md.
```

```
TASK (CC-27A): 4 fixes, 1 branch.
A Every unique Changi attraction and transit hotel lives in exactly 1 row, in its real location.
C Chains keep 1 row per physical outlet: merge the double-imported outlet rows, label outlets so 2 in the same
  terminal can be told apart, make amenity_slug unique.
D MCP calls with no boarding time hide landside venues and say why.
E Every list shows a brand once, with a count of its other outlets.
B (URLs) follows A and C.

WHY
- A connecting passenger in T1 with 60 minutes can be sent to "Butterfly Garden, T1". It's in T3. The landside flag
  (CC-17) stops Jewel copies reaching short layovers, but the rows still claim the wrong terminal, and the airside
  garden copies pass the landside rule untouched. Production app impressions (is_test = false) include
  cactus-garden-t3-new on 4 Nov and canopy-park-t3-new on 5 Oct. The 20 Aug plan (B3) had this fix; it never ran.
- Lotte Duty Free Wines & Spirits: 43 rows for 21 physical shops. Each shop was imported twice under 2 slug
  formats (lotte-duty-free-wines-spirits-level-2-shop-22-sint1 and lotte-duty-free-wines-spirits-t1-level-2-22),
  sometimes with different hours (06:00-00:00 vs 24/7). A T3 shop has a 3rd copy
  (lottedutyfreewinesspiritst3level210-sint3). 1 slug exists twice: lotte-duty-free-wines-spirits-t3-level-2-65.
  On a card, every outlet reads identically; in a 7-9 item list, 3 of them waste 3 slots.
- An agent that omits time_until_boarding_minutes gets landside rows today (5 Nov logs: T1 refuel returned
  fossa-chocolate-jewel and the T1 basement Kopitiam).

FACTS (5 Nov, live DB bpbyhdjdezynyiclqezy)
- amenity_detail: 378 SIN rows. 70 names appear in more than 1 terminal; most are real chains.
- No unique index on amenity_slug. brand_family is filled on 372 of 378 rows (256 brands).
  gate_location and zone are empty on every row; latitude on 51.
- Same brand, same terminal, same side, more than 1 row: 16 groups, 63 rows. Lotte is 43 of them; the rest are
  Guardian (T1 x3, T3 x2, T2 landside x2, T3 landside x2), Garrett Popcorn (T1 x2, T4 x2), TWG (T4 x2),
  Cactus Garden (T1 x2, handled in Part A).
- Lotte slugs carry level and shop number. Level 1 rows are flagged landside (likely arrival-hall shops,
  which connecting passengers can't reach: verify in G3).
- References to amenity_detail.id: collection_amenities (989 rows, FK ON DELETE CASCADE), amenity_vibe_mappings
  (398, CASCADE), amenity_vibe_descriptions (447, CASCADE), amenity_interactions (CASCADE), user_visits (0 rows,
  NO ACTION), collection_amenity_mappings (0 rows, NO ACTION). route_stops (30 rows) references amenity_slug with
  no FK. events and agent_interactions hold slugs as telemetry history.
- collection_amenities.terminal_code always equals the amenity's terminal_code or is null (851 equal, 138 null,
  0 different). Keep that invariant.
- The 25 certain phantoms in Part A carry 143 collection links (20 with null terminal), 43 vibe mappings,
  38 vibe descriptions and 0 route stops. Canonical rows already used by routes: butterfly-garden-t3-new,
  cactus-garden-t1, sunflower-garden-t2-new, rain-vortex-jewel-new.
- Supabase Free: 1 project serves preview AND production, and there's no point-in-time restore. A data change is
  a production change the moment it commits. The backup table plus a local dump is the only rollback.
- auth.users = 0 and every agent_interactions row is_test, so no saved favourites or agent traffic to migrate.

CANDIDATE LIST, PART A (expected location is Claude's Changi knowledge: VERIFY each one in G3 before acting)
| Name                      | Rows today              | Expected real location   | Proposed action                         |
|---------------------------|-------------------------|--------------------------|-----------------------------------------|
| Butterfly Garden          | T1 T2 T3 T4             | T3 transit               | delete T1, T2, T4                       |
| Cactus Garden             | T1 x2, T2, T3, T4       | T1 transit rooftop       | keep cactus-garden-t1; delete the other 4 |
| Sunflower Garden          | T1 T2 T3 T4             | T2 rooftop (still open?) | delete T1, T3, T4; T2 only if open       |
| Canopy Park               | Jewel, T2 T3 T4         | Jewel                    | delete T2, T3, T4                       |
| Mirror Maze               | Jewel, T1 T2 T4         | Jewel                    | delete T1, T2, T4                       |
| Rain Vortex               | Jewel, T1 T2            | Jewel                    | delete T1, T2                           |
| Manulife Sky Nets         | Jewel, T1 T4            | Jewel                    | delete T1, T4                           |
| Foggy Bowls               | Jewel, T2 T3            | Jewel                    | delete T2, T3                           |
| Changi Experience Studio  | Jewel, T3 T4            | Jewel                    | delete T3, T4                           |
| Shiseido Forest Valley    | Jewel, T1               | Jewel                    | delete T1                               |
| Koi Pond                  | T1 T2 T3 T4             | verify                   | keep verified locations only            |
| Entertainment Deck        | T1 T2 T3 T4             | verify                   | keep verified locations only            |
| Jewel Waterfall Viewpoint | T3 (landside)           | verify it exists          | keep or delete                          |
| Aerotel Singapore         | T2 T3 (none in T1)      | T1 transit               | MOVE 1 row to T1, delete the other      |
| YOTELAIR Singapore Changi | T2 T3 T4 (none in Jewel)| Jewel, landside          | MOVE 1 row to Jewel, delete the others  |
| Ambassador Transit Hotel  | T1 T4                   | verify (T3?)             | move or delete per verification         |
| Travelling Family         | T1 T4                   | verify (artwork)         | keep verified locations only            |
| Vessel                    | T2 T3                   | verify (artwork)         | keep verified locations only            |
G3 extends this list with any other unique attraction, artwork or hotel found in more than 1 terminal.

DECISIONS (filled in, Todd, 5 Nov)
D1 Multi-outlet chains are real: keep 1 row per physical outlet. Merge rows that are the same outlet
   (same brand, terminal, level and shop number, or same name spelt 2 ways). Label each outlet. Lists show a
   brand once.
D2 Agent with no boarding time: hide landside venues; the reply says Jewel means clearing immigration and to
   watch the boarding time.

APPROVALS IN THIS PROMPT
- 1 migration file: backup table, Part A and Part C changes, zone labels, UNIQUE index on amenity_slug,
  in 1 transaction.
- vercel.json: the "redirects" array only.
- scripts/sitemap.ts output regenerated.
- Part D: landsideAccess in shared/ranking/policy.ts and its call site in api/mcp.ts.
- Part E: the shared ranker (rankAmenities) and the amenity card component, for the brand rule and the zone line.
- api/mcp.ts: the zero-edit rule is lifted for Parts D and E only. Output changes add optional fields; nothing is
  renamed or removed.
- Show every code diff and wait before applying.

GATES (halt on failure)
G1 Production sha == origin/main. Own worktree off main, branch cc-27a/catalogue-dedupe.
G2 Local dump before anything else: supabase db dump --data-only for amenity_detail, collection_amenities,
   amenity_vibe_mappings, amenity_vibe_descriptions, route_stops, collections. Save it outside the repo
   (~/tp-backups/2026-11-05/). Report file sizes and row counts. Never commit it.
G3 Verification. Source: changiairport.com (the venue's page, or the store directory for chain outlets).
   Record the URL and the quoted location for each name. Part A: every candidate. Part C: for each outlet group,
   the official outlet count per terminal, level and unit, and which of each duplicate pair has the right hours.
   If the site can't be fetched, mark the name UNVERIFIED and leave its rows alone; don't fall back to memory or a
   third-party site.
G4 Impact, per row in the action list: collection links (with link terminal_code), vibe mappings, vibe
   descriptions, route_stops, and every hard-coded use of the slug in src/, api/, shared/, public/, scripts/.
   For each collection: item count before and after, and whether it drops below collections.min_items.
G5 URL shape: how an amenity URL is built today (path, terminal segment if any, per CC-26 D4) and how the
   sitemap lists them.
G6 Ranking surfaces: which surfaces call rankAmenities (MCP, agent cards, app feed, collections, search, chat),
   whether any already caps items per brand, and what each does today when minutes to boarding are unknown,
   including whether landside rows carry the landside label.
STOP after G1-G6. Post the final action list (slug, action, canonical slug, evidence URL) and the G6 table, and
wait for Todd's approval. Nothing is deleted on a name match alone.

PART A · unique attractions and hotels (in the migration)
1. Create public.amenity_dedupe_20261105: every column of amenity_detail for each affected row (Parts A and C),
   plus action (deleted | moved | merged), canonical_slug, evidence_url, reason. Revoke all from anon and
   authenticated. This table is also the slug map for analytics on old telemetry.
2. Moves (Aerotel, YOTELAIR, any verified others): update terminal_code (and is_landside, available_in_tr to
   match the real location), give the row a slug for its real location, and update its collection_amenities
   terminal_code to match (invariant above). Log old slug -> new slug in the backup table.
3. Before deleting a phantom: for each of its collection links with terminal_code null, insert a link to the
   canonical row in the same collection if the canonical isn't already in it (same priority). Links with a
   terminal_code are left to cascade: that terminal's variant shouldn't show the attraction.
4. route_stops: repoint any slug in the action list to its canonical slug. Expected 0 changes (G4 confirms).
5. Delete the phantoms. Cascades remove their vibe mappings and descriptions; the canonical rows keep theirs.
6. Leave events and agent_interactions untouched. Telemetry history keeps its old slugs.

PART C · chain outlets (in the same migration)
1. Merge same-outlet duplicates: same brand_family, terminal, side, level and shop number, or the same name spelt
   2 ways (Sprint-Cass, Victoria's Secret, Garrett Popcorn). Keep 1 row per outlet: the one whose slug matches
   G5's URL shape, with the hours G3 verified. Repoint its links the same way as Part A step 3, then delete the
   rest. Expected: Lotte Wines & Spirits 43 rows -> 21 (G3 confirms the shop list).
2. Label outlets: fill the existing zone column on every row whose brand has more than 1 outlet in its terminal,
   in a traveller's words: "Level 2, shop 22 (departures)" or "Arrival hall, level 1". Source: G3 store directory,
   else the level and shop number in the slug. Leave zone null where neither source gives it; never guess.
3. After the merges: CREATE UNIQUE INDEX on amenity_slug. The migration fails if a duplicate slug survives.

PART D · MCP with no boarding time (D2)
- Rule (landsideAccess): on MCP, time_until_boarding_minutes absent AND no stated arriving or landside context
  = treat as an airside connecting passenger: landside rows hidden.
- The response gets an optional field, landside_note, when rows were hidden for this reason. Text:
  "Landside venues, including Jewel, are hidden because no boarding time was given. Reaching Jewel means
  clearing immigration, and you'll clear it again on the way back. Check your boarding time before you go."
- Tool descriptions: 1 added sentence on get_recommendations and get_route: "Pass time_until_boarding_minutes
  so landside venues such as Jewel can be included when there's time."
- App surfaces and chat: unchanged in this prompt. Report what chat does today (G6); the same rule reaches chat
  when chat moves onto rankAmenities (open follow-up).
- Add to the adversarial suite: (1) T1 refuel, no minutes: 0 landside rows, landside_note present; (2) same with
  240 minutes: landside rows allowed and labelled, no landside_note.

PART E · a brand appears once per list (D1)
- In rankAmenities: after scoring and the landside and open-now filters, keep the best-ranked row per
  brand_family (null brand_family = its own brand). Ties: open now, then same terminal as the passenger, then
  stable order. No gate data exists, so "nearest outlet" isn't possible yet; when gate_location is filled, it
  becomes the first tiebreak.
- The kept item carries other_outlets: number of other open outlets of that brand the same passenger may reach,
  plus their zone labels (optional field on MCP; "+2 more in T1" on the app card).
- App card: when zone is filled, 1 line under the name in the existing muted style. 375 px.
- Collections are hand-curated and keep their own items; the rule applies only where the ranker fills a list.

PART B · URLs
- vercel.json redirects: every deleted, moved or merged slug -> its canonical amenity URL, permanent (301/308), in
  the G5 URL shape. Generated from the backup table by a script, not typed by hand.
- Regenerate the sitemap: 0 deleted, moved or merged slugs; canonical rows present.

ORDER
Dry run first: the whole migration inside BEGIN ... ROLLBACK, printing before/after counts per part. Post the counts.
Deploy the code (D, E, B) to preview and prove it against the CURRENT data. Then apply the migration on Todd's
go, then merge.

DO NOT
- delete, move or merge a row whose location G3 didn't verify, or touch a chain outlet that G3 confirms is real
- rename slugs of rows that stay where they are
- edit category or vibe_tags (follow-up prompt); hours change only on kept outlet rows, from G3
- rewrite telemetry (events, agent_interactions)
- commit the dump

ACCEPTANCE
- AC-1  amenity_dedupe_20261105 row count == approved action list; every row has canonical_slug and evidence_url.
- AC-2  SQL: Jewel-only attraction names (Canopy Park, Mirror Maze, Rain Vortex, Manulife Sky Nets, Foggy Bowls,
        Changi Experience Studio, Shiseido Forest Valley) exist only as SIN-JEWEL. Butterfly Garden: 1 row, T3.
        Cactus Garden: 1 row, T1. Aerotel: 1 row, T1, airside. YOTELAIR: 1 row, Jewel, landside. Paste the query.
- AC-3  collection_amenities: 0 rows where terminal_code <> the amenity's terminal_code; 0 orphan ids.
        List any collection variant now under min_items.
- AC-4  route_stops: 0 slugs missing from amenity_detail.
- AC-5  curl -I on preview: every deleted, moved or merged slug's old URL returns 301/308 to the canonical URL,
        which returns 200.
- AC-6  sitemap.xml: 0 deleted, moved or merged slugs.
- AC-7  grep for every deleted, moved or merged slug in src/ api/ shared/ public/ scripts/: 0 hits outside
        vercel.json.
- AC-8  MCP on preview: get_recommendations {terminal: SIN-T1, vibe: explore, time_until_boarding_minutes: 60}
        and {terminal: SIN-T4, vibe: explore, time_until_boarding_minutes: 240}: no Butterfly Garden, Cactus
        Garden outside T1, or Jewel attraction with a T1-T4 terminal. Paste both responses.
- AC-9  App at 375 px: T1 explore feed at 60 min shows no Butterfly Garden; T3 shows it. Screenshots.
- AC-10 Outlets: Lotte Wines & Spirits row count == G3's official shop count; 0 brand+terminal+level+shop
        duplicates; the UNIQUE index on amenity_slug exists (paste \d amenity_detail or pg_indexes).
- AC-11 No-time rule: MCP T1 refuel with no minutes returns 0 landside rows and landside_note with the exact text;
        with 240 minutes, landside rows are labelled and landside_note is absent. Paste both.
- AC-12 Brand rule: MCP T2 shop vibe, 120 min: no brand_family twice; the Lotte item carries other_outlets.
        App T2 shop feed at 375 px: Lotte once, "+N more in T2" visible, zone line visible. Screenshot.
- AC-13 Preview SMOKE 13/13, MCP smoke passes, adversarial suite passes (including Part D's 2 cases).
        tasks/cc-27a-report.md lists every row changed with its evidence URL.
```
