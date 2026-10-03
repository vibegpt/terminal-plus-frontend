# Terminal+

AI airport concierge PWA and MCP server for Singapore Changi (T1 to T4, Jewel). Prod: https://terminalplus.app
Root: ~/terminal-plus-frontend · Remote: github.com/vibegpt/terminal-plus-frontend

## Deploys
- Vercel Git integration. A push to `main` deploys production. Any other branch gets a preview deployment.
- Never push to `main` until a preview has passed the smoke checklist in tasks/release-2026-09-report.md.
- Rollback: Vercel Instant Rollback to the previous READY production deployment.

## Stack
- Frontend: React 18, TypeScript, Vite 6, Tailwind, Framer Motion, React Router 7, TanStack Query, vite-plugin-pwa.
- API: `api/` on Vercel, region sin1.
- DB: Supabase `bpbyhdjdezynyiclqezy`, region eu-central-1. The region stays (decided 25 Sep).
- LLM: Anthropic. Model IDs live only in api/lib/models.ts once CC-6 lands.
- Flights: AeroDataBox via api.market. `AERODATABOX_API_KEY` is server-only (api/flight-status.ts, api/flights/board.ts); never add a VITE_ copy.

## Live code map
- Routes: src/App.tsx. Live pages: HomePage, VibePage, CollectionDetailPage, AmenityDetailPage, SearchPage, ProfilePage, MapPage, SavedPage. FlightContextCapture gates the shell.
- Ranking:
  - api/lib/ranking.ts: server, canonical.
  - src/utils/smart7Select.ts: vibe feed.
  - src/utils/contextualScoring.ts: collections.
  - Keep them in sync until shared/ranking lands (CC-5).
- Most of src/ is dead. On 26 Sep, 37 of 801 files were reachable from src/main.tsx. Before editing a file, confirm something imports it. Files named "* 2.tsx" and anything in *_backup_* folders are dead.

## Do not touch without an approved plan
- api/mcp.ts: zero edits.
- api/lib/ranking.ts, api/lib/agent.ts, api/lib/flightGrouping.ts, api/flights/board.ts, api/chat.ts, api/flight-status.ts, public/.well-known/*, vercel.json.
- localStorage key `tp_journey_context`: never rename it. Version it with `schema_version` and a read-time migration.

## Standing rules
- Telemetry tables (events, journeys, agent_interactions) are service-role only. Write them through the validating routes (api/events.ts, api/journey.ts). Never add anon INSERT policies.
- All timestamps are timestamptz. Every analytics view filters out test and non-production rows.
- DB changes:
  - Write the migration file in supabase/migrations/ first, then apply it.
  - Introspect with information_schema.columns.
  - Before any bulk INSERT, run the slug verification query (LEFT JOIN from a VALUES list).
  - `pg_default_acl` in `public` grants anon and authenticated every privilege on each new table and view, and EXECUTE on each new function. The migration that creates one enables RLS, sets `security_invoker = on` on views, and revokes what anon doesn't need. Check with `has_table_privilege` / `has_function_privilege`.
  - Caller gates for a grant or policy change cover reachable client code (import trace from src/main.tsx), `api/`, `scripts/`, and every deployed edge function (`list_edge_functions`, then read the deployed source).
- Pull the vendor's OpenAPI spec before mapping a third-party response. Prove a join key exists before building on it.
- .env.local: never run `vercel env pull .env.local`, because it overwrites local-only keys. Pull to /tmp and merge by hand.
- Latency: every uncached DB call from sin1 to Frankfurt costs ~160 ms. Read the catalogue through the cache (api/lib/catalogue.ts once CC-3 lands), run independent queries in parallel, and keep telemetry writes off the response path.
- Segment by corridor (LHR→SIN→SYD), never by nationality or locale.
- Jewel is landside. One Jewel rule applies to every surface.
- No blank text box in the MVP. Order changes; visibility doesn't.

## Verify (Always Works)
- api types: `npx tsc --noEmit -p api/tsconfig.json`
- Frontend types: use `npm run typecheck` once CC-4 lands. Until then, `npx tsc --noEmit -p tsconfig.json` is BLIND: it stops at syntax errors in dead files, so a pass proves nothing.
- Build: `npm run build`
- Adversarial: `npm run test:adversarial`. It hits the live DB with the anon key.
- Observe every change:
  - UI: open the page in a browser.
  - API: make the real call.
  - DB: query the table.
- Report BLOCKED as BLOCKED.

## Prompt pattern
Plan mode → prerequisite gates (halt on failure) → file-change table → browser-observed acceptance → report in tasks/<name>-report.md.

## Lessons
Read tasks/lessons.md before starting. Append a lesson after any correction.
