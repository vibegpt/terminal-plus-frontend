# Ranking Parity — Baseline (pre-fix)

Date: 2026-07-05 | Fixed input: vibe=`refuel`, terminal=`SIN-T1`

## Method note — deviation from plan

The plan's first choice was to hit `api/chat.ts` and `api/mcp.ts` live via `vercel dev`. Attempted it:
`vercel dev --yes --listen 3210` → `Error: The specified token is not valid. Use \`vercel login\` to generate a new token.`

`vercel login` requires interactive account authentication — not something to trigger for a read-only baseline check, so I did not attempt it. Falling back to the plan's stated contingency: replicating each path's exact Supabase query directly via the Supabase MCP (`execute_sql`, project `bpbyhdjdezynyiclqezy`). This is still a fully deterministic, valid regression reference, and — importantly — neither `api/chat.ts`'s ranking logic nor `api/lib/agent.ts` (protected) is being edited by this fix scope, so their query output is invariant by construction; the SQL replica is sufficient to prove that.

For `VibePage`/`CollectionDetailPage`, rather than hand-simulate `smart7Select`/`selectScoredAmenities`/`isOpenNow`, I ran the **actual current source files** against real Supabase data via `tsx` (Node), for a byte-exact pre-fix baseline (not an approximation).

## 1. UI surfaces (current behavior — this is what's broken)

### VibePage (vibe=refuel, userTerminal=SIN-T1, default view → `smart7Select`)
Ran `src/utils/smart7Select.ts` (unmodified) against the live `amenity_detail` pool (`airport_code='SIN'`, `vibe_tags ilike '%refuel%'`, 44 rows):

| Rank | slug | name | terminal | editorial_score |
|---|---|---|---|---|
| 1 | `sin-t1-burger-king-1757008220.066062` | Burger King | SIN-T1 | 11 |
| 2 | `sin-t1-crystal-jade-1757008220.066062` | Crystal Jade Go | SIN-T1 | 13 |
| 3 | `heavenly-wang-sint1` | Heavenly Wang | SIN-T1 | 10 |

Ordered by open-status → terminal-proximity → **alphabetical name**. `editorial_score` (11, 13, 10) is not monotonic — confirms it plays no role.

### CollectionDetailPage ("Jewel Refuel", collection_id=`jewel-refuel`, 'relevance' sort → `selectScoredAmenities`)
Ran `src/utils/contextualScoring.ts` (unmodified logic; `import.meta.env.DEV` shimmed to `false` for Node execution — this only gates a cosmetic debug label, zero effect on scoring/sort) against the collection's junction-table pool (12 rows, all `priority=0`), context: terminal=SIN-T1, minutesToBoarding=120:

| Rank | slug | name | editorial_score | contextScore |
|---|---|---|---|---|
| 1 | `wang-cafe-jewel` | Wang Cafe | 14 | 64.3 |
| 2 | `a-w-restaurants` | A&W Restaurants | 12 | 59.0 |
| 3 | `leckerbaer-jewel` | Leckerbaer | 13 | 59.0 |

`a-w-restaurants` (score 12) ranks above `leckerbaer-jewel` (score 13) — a tie in `contextScore` (59.0) is broken by arbitrary original array order (DB row order, since all `priority=0`), not `editorial_score`. Confirms the bug.

## 2. Reference — what "editorial_score DESC, terminal-match tiebreak" (api/lib/agent.ts's documented algorithm) produces on the same VibePage pool

Not calling the protected file — replicated its two documented sort steps (SQL `editorial_score DESC`, then stable sort by terminal match) on the identical 44-row pool used above, purely as the target reference for what parity should look like:

| Rank | slug | name | editorial_score |
|---|---|---|---|
| 1 | `sin-t1-kopitiam-1757008220.066062` | Kopitiam | 14 |
| 2 | `sin-t1-crystal-jade-1757008220.066062` | Crystal Jade Go | 13 |
| 3 | `sin-t1-toast-box-1757008220.066062` | Toast Box | 13 |

This is the target: VibePage's post-fix top-3 should converge toward this set (exact match isn't guaranteed since VibePage keeps its own secondary tiebreakers by design — see plan — but `editorial_score` should now dominate the pick).

## 3. api/chat.ts's actual query pool (regression reference — this file is NOT being touched by Fix 1; only its two `.limit(40)` literals get swapped for `DISPLAY.SEARCH_LIMIT` in Fix 2, same value, so this must be unchanged after all fixes)

Replicated `queryAmenities()`'s exact filter (`terminal_code='SIN-T1'`, keyword `refuel` across name/description/vibe_tags, `editorial_score DESC`, limit 40) directly via SQL:

| Rank | slug | name | editorial_score |
|---|---|---|---|
| 1 | `sin-t1-kopitiam-1757008220.066062` | Kopitiam | 14 |
| 2 | `sin-t1-toast-box-1757008220.066062` | Toast Box | 13 |
| 3 | `sin-t1-crystal-jade-1757008220.066062` | Crystal Jade Go | 13 |

**Regression check after all fixes:** re-run this exact query, confirm top-3 unchanged (it must be, since `api/chat.ts`'s WHERE/ORDER clauses aren't touched — only a literal `40` becomes a named constant `40`).

## 4. MCP (`api/mcp.ts`) — not queried

Per the protected-files rule, `api/mcp.ts` was not opened or called. It isn't edited by this fix scope, so there is no regression surface to baseline there; noting its exclusion explicitly rather than silently skipping it.
