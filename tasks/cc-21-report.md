# CC-21 · Supabase keep-alive cron

**Status: READY TO PUSH (12 Oct). Preview acceptance PASS, preview SMOKE 13/13. Not on main.**

Branch `cc-21/keepalive` (worktree `~/tp-cc-21`): `92e4958` handler, `729f2d5` vercel.json, plus this report. It fast-forwards origin/main `1b1360e`.
Preview: `dpl_E17pvSBSCx1fcBArHupHMet5kJwt` (sha `729f2d5`), alias `terminal-plus-frontend-git-cc-21-0c14af-todds-projects-d0181971.vercel.app`.
Rollback after the push: `dpl_9eyNRrcpjgZ8wdyxTAhLUp6JRhRS` (`1b1360e`).

## Why

A Supabase project on the Free plan pauses after 7 days of low activity. Real traffic is near zero, so the project could pause around 16 Oct and take down the catalogue, `/api/chat` and MCP. A daily cron reads 1 row. Supabase doesn't document what counts as activity, so treat this as a bridge: remove it once traffic or the plan makes it unnecessary.

## Gates

| Gate | Result | Evidence |
|---|---|---|
| G1 production == origin/main | PASS | Production `dpl_9eyNRrcpjgZ8wdyxTAhLUp6JRhRS` runs `1b1360e` = origin/main. Worktree `~/tp-cc-21` off origin/main, branch `cc-21/keepalive` |
| G2 existing crons | PASS (new code needed) | `vercel.json` has 1 cron: `/api/cron/sync-reviews` `0 3 * * 1`, weekly on Mondays. It reads `amenity_detail` and updates review fields from Google Places. Weekly is not enough to cover a 7-day window |
| G3 env names | PASS | `vercel env ls`, names only. `CRON_SECRET` and `SUPABASE_SERVICE_ROLE_KEY` are set for Production + Preview. `VITE_SUPABASE_URL` is set for Production + Preview. `SUPABASE_URL` is set for Production only, and the handler falls back to `VITE_SUPABASE_URL` |
| G4 vercel.json diff approved | PASS | Todd approved the diff below, 12 Oct |

## Files

| File | Change |
|---|---|
| `api/cron/keepalive.ts` | New. GET only (405 otherwise). 401 unless `Authorization: Bearer $CRON_SECRET`; with no secret configured it always answers 401, so `Bearer undefined` can't match. Uses a service-role client built the same way as `api/events.ts` (`api/` has no shared helper; no new package). Runs `select amenity_slug from amenity_detail limit 1`. Returns 200 `{ok:true, ms}`, or 503 `{ok:false, error}` plus `console.error`. Sends `Cache-Control: no-store`. Writes nothing |
| `vercel.json` | Adds `{"path":"/api/cron/keepalive","schedule":"17 3 * * *"}` (03:17 UTC, 11:17 SGT). Nothing else changes |

Spec deviation: the prompt says `select slug`. `amenity_detail` has no `slug` column (checked in `information_schema.columns`); the column is `amenity_slug`.

```diff
     {
       "path": "/api/cron/sync-reviews",
       "schedule": "0 3 * * 1"
+    },
+    {
+      "path": "/api/cron/keepalive",
+      "schedule": "17 3 * * *"
     }
```

## Acceptance

| Check | Result | Evidence |
|---|---|---|
| Local harness | PASS | Handler imported under tsx against the live DB with a throwaway secret: no header 401, wrong secret 401, POST 405, correct secret 200 `{ok:true, ms:1142}` (timed from a laptop) |
| Preview, no header | PASS | `HTTP/2 401`, `{"ok":false,"error":"Unauthorized"}`, `cache-control: no-store`, `x-vercel-id: lhr1::sin1::…`. Deployment Protection didn't intercept: the 401 body is the route's own |
| Preview, wrong secret / POST | PASS | 401 / 405 |
| Preview, with secret | PASS | 200 `{"ok":true,"ms":915}` cold, then 200 `{"ok":true,"ms":269}` warm. The secret came from `vercel env pull` into a 0600 scratch file, was never printed, and the file was deleted after use |
| 0 new telemetry rows | PASS | Before (03:28:20 UTC): events 1144 rows (max id 1203), journeys 105, agent_interactions 419. After the 5 preview calls (03:29:05 UTC): identical |
| `npx tsc --noEmit -p api/tsconfig.json` | PASS | 0 errors before and after |
| After merge: Cron Jobs lists the job, Run once, logs 200 | PENDING | Needs the push to main |

## Preview SMOKE (`tasks/release-2026-09-report.md`)

12 Oct, 03:29–03:36 UTC (11:29–11:36 SGT), built-in browser at 375×812, browser TZ Asia/Jerusalem. `tp_test = '1'` was set on `/robots.txt` before the app's first load. The SW was unregistered and caches cleared first. Bundle `assets/index-Bdu9pnPP.js`.

| # | Line | Result | Evidence |
|---|---|---|---|
| 1 | `/` capture gate shows | PASS | "What brings you to Changi?", with Departing / Connecting / Just landed / Skip |
| 2 | Skip works | PASS | Lands on Home ("Add your flight for personalised recommendations"). journeys `270d31f4-7f34-460e-821b-98fbc7ec3a7c` `flight_source='skipped'` |
| 3 | Typed QF1 works | PASS | Departing → T1 → Enter manually → `QF1` → "Terminal T1 · Boards 22:45 → LHR" → Looks right. Bar: "11h 14m to board · On Time, QF1 · SIN → LHR, T1". `tp_journey_context` `schema_version: 4`, `flight_source: "typed"` |
| 4 | Board picker works | PASS | Fresh session, the live board loaded, picked TR474 → bar "BOARDING NOW, TR474 · SIN → SZB, D40, T1". journeys `5555fb6d-edae-4577-9077-df6932b5f95a` `flight_source='picker'` |
| 5 | Home: 7 vibe rows with photos and counts | PASS | Refuel, Work, Quick, Explore, Chill, Shop, Comfort. 31 images, 0 broken, 32 "N spots" counts |
| 6 | `/vibe/refuel`: 7 items | PASS | "7 spots across all terminals": Kopitiam, T2 Food Gallery, Fossa Chocolate, Grain Traders, Kélé, Wang Cafe, TWG Tea |
| 7 | 1 collection, 1 amenity, 1 search | PASS | `/collection/refuel/coffee-worth-walk` "7 of 7 spots". `/amenity/grain-traders-jewel` renders. `/search` "laksa" → Kopitiam (T1) |
| 8 | Change flight → "Keep QF1" backs out unchanged | PASS | "Show flight details" → "Change flight" opens a screen headed "Change flight"; "Keep QF1" appears once. Afterwards `capturedAt` is unchanged (`03:31:15.361Z`) and there's still 1 typed journeys row |
| 9 | Non-Singapore TZ: hours follow SGT | PASS | Browser local time 06:31, SGT 11:31. Grain Traders (11:00–22:00) shows "Open · Until 22:00"; a local-time reading would show it closed |
| 10 | Chat uses the flight | PASS | "Where should I get coffee before my flight?" → the reply cites T1 and "your 22:45 boarding". Cards: Toast Box, dnata Lounge, Starbucks, all T1. agent_interactions `4d0c37c7-af7a-4c4b-900e-444485dfdec5` (conversational) |
| 11 | MCP initialize, tools/list, tools/call | PASS | Session `smoke-cc21-202610120335`: initialize 200 `2025-03-26` `terminal-plus`; tools/list returns 4; `get_recommendations {refuel, SIN-T1}` → 7. agent_interactions `561c6754-0c09-499e-a083-f53bfa15a2f4` |
| 12 | SQL: session_start and recommendation_impression | PASS | events 1204–1238: session_start 3, recommendation_impression 24, capture_opened 4, plus flight_not_found, search_performed, amenity_detail_dwell and gate_prompt_shown (1 each) |
| 13 | SQL: 1 typed journeys row | PASS | `5040707e-3263-449b-978f-3a1ff725562f` `flight_number='QF1'`, `flight_source='typed'` |

Every SMOKE row is `is_test = true`, `env = 'preview'`, `is_bot = false` (events 1204–1238, the 3 journeys and 2 agent_interactions above).

## After the push (Todd's go)

1. `git push origin cc-21/keepalive:main`, then wait for READY.
2. Vercel → Settings → Cron Jobs: confirm `/api/cron/keepalive` `17 3 * * *` is listed. Press Run once and check that the runtime logs show 200.
3. SQL: 0 new rows in events, journeys and agent_interactions from the run.
4. Watch the Supabase project status after 16 Oct. If it pauses despite the cron, a REST read doesn't count as activity and this bridge doesn't work.
