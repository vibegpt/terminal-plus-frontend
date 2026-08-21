# Scorer Unification Fix — Report

**Date:** 2026-07-12 01:45 SGT · Executes the plan approved from `tasks/scorer-divergence-report.md`.
**Commits:** `061f946` feat(ranking): shared canonical comparator · `51fc8a5` fix(mcp): ranked candidate pool + shared scorer. Nothing pushed.

**Result: full parity.** MCP `get_recommendations` top-7 is now **order-identical** to the UI vibe surface for all 3 acceptance pairs (pre-fix overlap was 0/7, 3/7, 4/7). Adversarial suite 11/11 with the new permanent parity guard.

## What changed

| File | Change |
|------|--------|
| `api/lib/ranking.ts` | NEW (139 lines): canonical comparator (`editorial_score DESC → open-now(SGT) → terminal proximity → name`), `rankAmenities` (smart7Select's name-dedup + sort), `queryRankedAmenities` (editorial-ordered pool + agent filters). |
| `api/mcp.ts` | Scoped exception, **+12/−29** (approved diff, applied verbatim — see below). |
| `src/lib/displayConfig.ts` | `VIBE_POOL: 50` added; stale `COLLECTION_POOL` comment touched up. |
| `tests/adversarial/adversarial.test.ts` | Test #11 (pool guard + order parity), TZ pinned to Asia/Singapore, 2 imports. |
| Protected files (`api/lib/agent.ts`, `queryRouteMatch()`, `smart7Weights.ts`, tool schemas, telemetry, session handling) | **Zero changes** — confirmed by `git show --stat` (commit 2 touches api/mcp.ts only). |

### Approved deviation (flagged in plan, approved): pool cap 50, not 21

Live-data simulation during planning showed a 21-row pool fails the acceptance test on chill×T3 and shop×JEWEL: `smart7Select` dedups by name keeping the *best-terminal* instance, so a truncated pool can keep a high-editorial sibling the UI demotes (e.g. `dnata-lounge-t1-new` 13 vs `dnata-lounge-t3-new` 10). Pool cap now equals VibePage's `.limit(50)` via `DISPLAY.VIBE_POOL` — identical pools make parity structural. Knock-on: `total_available` now reports up to 50 (same field/shape; values now 44/39/50 for the 3 pairs).

## The api/mcp.ts diff as applied

`git diff` (now commit `51fc8a5`) matched the approved diff line-for-line; the only bookkeeping delta vs the plan's estimate was +12 vs +13 insertions (blank-line accounting). Verbatim:

```diff
@@ -3,6 +3,7 @@
 import { queryRouteMatch } from './lib/agent';
+import { queryRankedAmenities } from './lib/ranking';
 import { randomUUID } from 'node:crypto';
@@ -153,39 +154,21 @@
 async function handleGetRecommendations(args: any) {
   const supabase = getSupabase();
-  let query = supabase.from('amenity_detail')
-    .select('id, name, amenity_slug, description, terminal_code, vibe_tags, price_level, opening_hours, available_in_tr, booking_required, editorial_note, editorial_score, route_context')
-    .eq('airport_code', 'SIN');
-
-  if (args.vibe) query = query.ilike('vibe_tags', `%${args.vibe}%`);
-  if (args.terminal && args.time_until_boarding_minutes !== undefined && args.time_until_boarding_minutes < 30) {
-    query = query.eq('terminal_code', args.terminal);
-  }
-  if (args.exclude_jewel || (args.time_until_boarding_minutes !== undefined && args.time_until_boarding_minutes < 120)) {
-    query = query.neq('terminal_code', 'SIN-JEWEL');
-  }
-
   const resultLimit = Math.min(args.limit || 7, 12);
-  const { data: amenities, error } = await query.limit(resultLimit * 3);
 
-  if (error || !amenities?.length) {
+  const { pool, ranked, error } = await queryRankedAmenities(supabase, {
+    vibe: args.vibe,
+    userTerminal: args.terminal ?? null,
+    timeUntilBoardingMinutes: args.time_until_boarding_minutes,
+    excludeJewel: args.exclude_jewel,
+    limit: resultLimit,
+  });
+
+  if (error || !ranked.length) {
     return JSON.stringify({ recommendations: [], message: 'No matching amenities found.', total_available: 0 });
   }
 
-  const scored = amenities.map((a: any) => {
-    let score = 50;
-    if (args.terminal && a.terminal_code === args.terminal) score += 30;
-    if (args.terminal && a.terminal_code !== args.terminal && a.terminal_code !== 'SIN-JEWEL') score += 10;
-    if (a.terminal_code === 'SIN-JEWEL') score += (args.time_until_boarding_minutes && args.time_until_boarding_minutes > 240) ? 20 : -10;
-    if (args.vibe && a.vibe_tags?.toLowerCase().includes(args.vibe.toLowerCase())) score += 20;
-    if (a.available_in_tr) score += 5;
-    if (a.editorial_score && a.editorial_score >= 12) score += 10;
-    else if (a.editorial_score && a.editorial_score >= 10) score += 5;
-    return { ...a, _score: score };
-  });
-  scored.sort((a: any, b: any) => b._score - a._score);
-
-  const recs = scored.slice(0, resultLimit).map((a: any, i: number) => ({
+  const recs = ranked.map((a: any, i: number) => ({
     rank: i + 1, id: a.id, name: a.name, slug: a.amenity_slug,
 (…mapping fields unchanged…)
-  return JSON.stringify({ recommendations: recs, total_available: amenities.length, filters_applied: args }, null, 2);
+  return JSON.stringify({ recommendations: recs, total_available: pool.length, filters_applied: args }, null, 2);
 }
```

## Before/after ranked top-7 (MCP surface)

Pre-fix from `tasks/scorer-fix-baseline.md` (2026-07-10 22:50 SGT); post-fix run 2026-07-12 01:43 SGT. Post-fix MCP == UI **at the same moment** on every rank; tie order among equal editorial scores shifts with the open-now tiebreak across the day — on both surfaces equally, which is the point.

**refuel × SIN-T1** (pre-fix top-7 overlap 0/7 → now 7/7 order-identical)

| # | Pre-fix MCP | Post-fix MCP == UI |
|---|-------------|--------------------|
| 1 | starbucks-sint1 (ed 11) | sin-t1-kopitiam-… (ed 14) |
| 2 | coffee-bean-tea-leaf-sint1 (ed 10) | sin-t2-food-court-… (ed 14) |
| 3 | sin-t1-crystal-jade-… (ed 13) | wang-cafe-jewel (ed 14) |
| 4 | sin-t1-toast-box-… (ed 13) | fossa-chocolate-jewel (ed 14) |
| 5 | heavenly-wang-sint1 (ed 10) | grain-traders-jewel (ed 14) |
| 6 | sin-t1-ya-kun-… (ed 10) | kele-jewel (ed 14) |
| 7 | aw-root-beer-t3 (ed 13) | twg-tea-t4-new (ed 14) |

**chill × SIN-T3** (3/7 → 7/7): pre-fix `spa-express-t3-new, butterfly-garden-t3-new, canopy-park-t3-new, spa-express-t1-new, dnata-lounge-t1-new, ambassador-transit-hotel-t1-new, singapore-airlines-silverkris-lounge-t4-new` → post-fix == UI: `singapore-airlines-silverkris-lounge-t1-new, butterfly-garden-t3-new, ambassador-transit-hotel-t1-new, cactus-garden-t1, snooze-lounge-t1, cactus-garden-t3-new, spa-express-t3-new`.

**shop × SIN-JEWEL** (4/7 → 7/7): pre-fix `lego-airport-store, twg-tea-boutique-t3, irvins-salted-egg-t1, guardian-…-shop-16-sint1, montblanc, taste-singapore, victorias-secret-…-sint1` → post-fix == UI: `lego-airport-store, apple-store, fragrance-bak-kwa-t3, irvins-salted-egg-t1, taste-singapore, twg-tea-boutique-t3, guardian-health-beauty-sin-t3-basement-24`.

**Filter exclusions: none.** No time/exclude_jewel args in the acceptance calls, so no agent filter removed any UI item — every UI top-7 item appears in the MCP top-7 at the same rank.

## Parity gate evidence

- ✅ **Top-7 order-identical, 3/3 pairs** — comparison script driving the real `queryRankedAmenities` (the function mcp.ts now calls) vs the real `smart7Select` on VibePage's query: `OVERALL: ALL PASS`.
- ✅ **Pool regression guard, 3/3 pairs** — MCP candidate pool slug-list equal to direct SQL `ORDER BY editorial_score DESC NULLS LAST, name LIMIT 50` (slug-for-slug, order included). Pools: 44/39/50 rows.
- ✅ **UI unchanged** — the original baseline script re-run post-fix under identical conditions: UI ranked sections **byte-identical** to `tasks/scorer-fix-baseline.md` (`diff` empty). Code-level: no UI file changed (displayConfig change is an additive constant VibePage doesn't yet read).
- ✅ **Real MCP calls** — actual `api/mcp.ts` handler invoked in-process (JSON-RPC `tools/call`, shared `Mcp-Session-Id`) for all 3 pairs: HTTP 200, response shape unchanged (`recommendations` with `rank, id, name, slug, terminal, vibe_tags, price_level, description, editorial_note, editorial_score, route_context, app_url`; `total_available`; `filters_applied`), slugs in the new order.
- ✅ **Telemetry untouched, proven live** — those calls wrote 3 `agent_interactions` rows (one shared session id, correct tool_name/terminal/vibe, top-3 `result_slugs` matching the new ranking, latency 893–2022 ms), verified via SQL, then deleted (ids `c56f154a…`, `40600f60…`, `fb769716…`) — table back to pre-test state.
- ✅ **Build passes; adversarial 11/11** (test #11 = permanent pool + order-parity guard; process TZ pinned to Asia/Singapore in the suite).
- ✅ **`git diff api/mcp.ts` == approved diff**; commit 2 contains api/mcp.ts only (+12/−29). `git status` matches the file change table — remaining dirt is pre-existing (`api/lib/agentPrompt.ts`, task docs), untouched.

## Notes for follow-up tasks (out of scope here)

- UI refactor: point `smart7Select`/VibePage at `compareAmenities`/`DISPLAY.VIBE_POOL` so the comparator is single-source (currently mirrored, guarded by test 11).
- `api/chat.ts` still uses its own pool query (editorial-primary already); candidate for `queryRankedAmenities` adoption.
- Orphaned `api/lib/agent.ts queryAmenities` (test-only) and the dead Smart7 legacy chain — separate cleanup per the divergence report.
