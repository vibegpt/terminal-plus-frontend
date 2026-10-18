# CC-26 report: agent-ready MCP server

Status, 17 Oct 2026: Part A SHIPPED (PR #5, merge `c9e2446`, production `dpl_DKJ5mnXnQUKahB9kzc3yZkUd58hL` READY). Parts B to G SHIPPED (PR #6, merge `3aa05f3`, production `dpl_J6XxL7MBApAD4AGkk24ZXxNAJc6k` READY 15:09:17 UTC). Rate limits live. Registry publish and directory submissions HELD until the monitor shows 7 days green.

## G1
Production `dpl_GfrDKorW2rF2yuKQokhNNwnCx3D2` = `afb5dc2` = origin/main. Worktree `~/tp-cc-26`.

## Part A: /privacy (PR #5: `b59cccc`, `d431a24`, `f7c78f8`, `6aa739d` GA removal, `a6cd5b3`; merge `c9e2446`)

| File | Change |
|---|---|
| `public/privacy/index.html` | Todd's text, unchanged (sha256 `fa88efe5…`) |
| `vite.config.ts` | `/^\/privacy/` in `navigateFallbackDenylist` |
| `src/pages/ProfilePage.tsx` | footer link `<a href="/privacy">Privacy</a>`, muted |
| `scripts/sitemap.ts`, `public/sitemap.xml` | `/privacy` added; 42 URLs (33 collections unchanged) |
| `public/security.txt`, `public/.well-known/security.txt` | mailto contact, expires 2027-10-17, canonical on terminalplus.app |

`vercel.json`: not needed. `/privacy` resolves to `privacy/index.html` without a rewrite.

### Checks (preview `dpl_C4CVPyC6wtCQ1G68BAYmBqvBpwkb`)
- `npm run build` exit 0; `dist/sw.js` denylist ends `/^\/privacy/`; `npx tsc --noEmit -p api/tsconfig.json` exit 0.
- curl `/privacy` and `/privacy/`: 200 text/html, 10,074 B, contains "Last updated 17 October 2026", no app shell. `/vibe/refuel` and `/profile` still get the 2,782 B shell.
- `/security.txt` and `/.well-known/security.txt`: 200 text/plain, new content.
- Browser at 375 px, SW active and controlling: Profile footer shows "Privacy" (10 px, rgba(255,255,255,0.25)); tapping it loaded the static page (title "Privacy | Terminal+", no `#root`, served through the SW from the network, transfer 4,617 B), no horizontal overflow. The page loads no scripts of its own.
- The SW precaches `privacy/index.html` (globPatterns include html); navigation still goes to the network because of the denylist.

### Privacy text vs collected data (G2d)
Round 1 found 6 issues; Todd decided them (17 Oct):
1. Country at first setup, flight added or skipped: E1. Confirmed on preview: the skipped journey `94d8daa0…` carries `first_open_country`.
2. Voice section added (E2). The "Scan boarding pass" button is a stub ("coming soon", no camera), so "no photos or files" holds; a real scanner needs a privacy update first.
3. The 3 old accounts deleted (see Data below).
4. k5 suppression "before anything is shared" (E4) + CLAUDE.md standing rule: anything shared outside comes only from `*_k5` views.
5. Processing countries widened (E5).
6. Anthropic context listed in full (E6).

Lawyer flags still open: no retention limit; US transfers. GA4 consent is moot (removed).

### A2: Google Analytics removed (`6aa739d`)
- `index.html` tag block deleted. `src/lib/gtag.ts` and `src/hooks/usePerformanceMonitoring.ts` deleted: not in the esbuild import trace from `src/main.tsx` (58 files), no importers.
- Remaining `gtag` mentions are in ~10 unreachable files (numbered duplicates, unused utils); 0 in reachable files, `api/`, `public/`, `index.html`, `CLAUDE.md`, `dist/`. Left for CC-9.
- /privacy: Google card is Fonts only; Cookies: "Terminal+ sets no cookies".

### Data
- `20261017075423` unlinked 7 test journeys from auth user `c3da094f`; `20261017101550` unlinked 2 test journeys from orphan `6e2ee41f` (applied before its file was written; file added under the applied version). Rollback SQL in each file.
- Auth admin API DELETE (200 ×3): `a2bef105…`, `13aee150…`, `c3da094f…`. Now `auth.users` 0, `auth.identities` 0, journeys with user_id 0.
- Sign-ups: `GET /auth/v1/settings` → `disable_signup: false` at 10:25 UTC; Todd switched it off; re-read 10:26:47 UTC → `disable_signup: true`, anonymous sign-ins false.
- Registry key (D1): moved to `~/.config/terminalplus/mcp-registry-key.pem` (dir 700, file 600); its public key still equals the live `mcp-registry-auth`.
- Reachable auth calls (condition 1): `src/hooks/useAuth.tsx` (AuthProvider in `main.tsx`: getUser, onAuthStateChange on load) and `src/lib/fetchWithAuth.ts` (getSession, via queryClient). No reachable code calls signUp/signIn/signOut. Accepted by Todd as read-only.

### Preview checks (`dpl_4VsGSu1caYShKTCyrKkDm1qeeiiG`, `a6cd5b3`, 375 px, browser TZ Asia/Jerusalem)
- GA: one document Home → /vibe/refuel → /amenity/grain-traders-jewel → /search "laksa": Google hosts in resource timing = fonts.googleapis.com only; network log 0 google requests; `document.cookie` empty; `gtag`, `dataLayer` undefined; 0 console errors.
- utm: `?utm_source=test&utm_medium=qa&tp_test=1` → event 1756 session_start payload `{utm_source: test, utm_medium: qa, landing_path: /}`, is_test.

| # | Result | Evidence |
|---|---|---|
| 1 | PASS | Gate "What brings you to Changi?", 3 options + Skip, TEST pill |
| 2 | PASS | Skip → Home; journey `94d8daa0-76b4-4c49-8687-656276686c64` skipped |
| 3 | PASS | Departing → T1 → Enter manually → QF1 → "Terminal T1 · Boards 22:45 → LHR" → Looks right; bar "4h 25m to board · On Time, QF1 · SIN → LHR"; context v4 typed departing; journey `aace9bd9-f253-4378-9656-607a34f5ba73` |
| 4 | PASS | Change flight → filter "SQ" → SQ966 → bar "SQ966 · SIN → CGK, D40, T2, Boarding now"; journey `52e7eaa9-ddaa-46a6-bed1-72da72732dc2` picker |
| 5 | PASS | 7 vibe rows; 31/31 images; 32 "N spots" |
| 6 | PASS | `/vibe/refuel`: "7 spots across all terminals" |
| 7 | PASS | Collection "7 of 7 spots"; amenity Grain Traders (Open); search "laksa" → Kopitiam |
| 8 | PASS | Change flight → "Keep QF1" (once) → `tp_journey_context` byte-identical, capturedAt 10:19:38.811Z |
| 9 | PASS | Local 13:17 (UTC+3), SGT 18:17; Home "Evening picks" |
| 10 | PASS | Chat "Where should I get coffee before my flight?" → Toast Box (T1, Before immigration), dnata Lounge; agent_interactions `a57264ff-9682-416e-89ed-45832d65955f` SIN-T1, 264 min, claude-sonnet-5-5, is_test |
| 11 | PASS | MCP initialize 2025-03-26; tools/list 4; get_recommendations refuel/SIN-T1 → 7; `d23ada0b-8504-4a90-b4bd-cd01a11c0144` (`smoke-cc26a-1792232463`), is_test |
| 12 | PASS | anon `a7b2c75c…`: session_start, recommendation_impression, vibe_selected, amenity_tapped, amenity_detail_dwell, search_performed, capture_opened, flight_not_found |
| 13 | PASS | `aace9bd9…` QF1 typed |

### Production (`dpl_DKJ5mnXnQUKahB9kzc3yZkUd58hL`, `c9e2446`)
- `/` and `/vibe/refuel`: 0 of googletagmanager / gtag / G-F136HW3V8Q.
- `/privacy`: 200, 10,347 B, "Last updated 17 October 2026", Voice, Google Fonts, "sets no cookies", skip wording, passenger type, k5 wording, other countries; no "Google Analytics".
- `/.well-known/security.txt` new content; sitemap lists /privacy.

### Test rows
Preview round 1: event 1754. Preview round 2 (anon `a7b2c75c-27ac-43b9-82ff-124b7b56e687`): events 1755–1786; journeys `94d8daa0-76b4-4c49-8687-656276686c64`, `aace9bd9-f253-4378-9656-607a34f5ba73`, `52e7eaa9-ddaa-46a6-bed1-72da72732dc2`; agent_interactions `a57264ff-9682-416e-89ed-45832d65955f`, `d23ada0b-8504-4a90-b4bd-cd01a11c0144`. All is_test true. MCP discovery calls (production, `smoke-cc26-g2-*` session, is_test true): agent_interactions `45bca66f-6c44-4034-b817-32969c17d845`, `595ea990-3ced-4111-beff-7b668008992f`, `72998ad6-7938-4cd5-9654-ff86d40e93d6`, `0410b22e-7665-42f9-98bd-9e4d0d4f2692`. 0 rows with is_test false.

### G2g
Repo-root `mcp-registry-key.pem` is ECDSA P-384; its compressed public key equals the `p=` in the live `/.well-known/mcp-registry-auth` (compared in a shell variable, never printed). No new key needed.


## Parts B to G (branch `cc-26/agent-ready`, preview `dpl_EToZJAJEQx12NYUqTh2Tm11CPgBr`, `7aa858f`)

| Commit | Part |
|---|---|
| `99a4b29` | C: mcp.ts annotations, descriptions, landside rule, clean outputs + url, transport, zero_reason, x-tp-test; migration `20261017102844` |
| `7105b60` | D7: AeroDataBox module cache in api/flight-status.ts |
| `2345d20` | B + E: /agents, llms.txt, mcp.json, server-card.json, server.json 1.1.0, SW denylist, sitemap (43) |
| `65a949d` | D6: T+ icons (192, 512, maskable 512, apple-touch 180), `npm run icons`, index.html links |
| `7aa858f` | D: scripts/mcp-smoke.mjs, .github/workflows/mcp-monitor.yml |
| `214e7f3` | migration `20261017103745` (my url-check rows → test) + lesson |

### Decisions applied
- D1: key moved to `~/.config/terminalplus/` (700/600), still matches the live auth file.
- D2: B1 fixed (minutes to boarding from UTC; SQ322 showed −49 before). Landside + open-now in the flight-match and dynamic route branches via `eligibility`; Jewel suggestion via `landsideAccess` with its copy (no landside numbers in mcp.ts; delay severity 15/60/120 and urgency 30/90 bands are unrelated and unchanged). ping, CORS (allow Mcp-Session-Id, Mcp-Protocol-Version, X-Tp-Test; expose Mcp-Session-Id).
- D3: `isTest = x-tp-test header || smoke-/test- session prefix`.
- D4: urls are `/amenity/<slug>`. No slug spans two terminals; the one duplicate slug (`lotte-duty-free-wines-spirits-t3-level-2-65`, ids 71 and 72, both T3) 406s on its page today because `AmenityDetailPage` (a CC-25 file) does `.single()` on slug and ignores `:terminalCode`. Data fix for Todd: delete one of the two rows.
- D5: `zero_reason` text + check; upstream_error also covers a failed catalogue query (no other value fits). Client privileges on agent_interactions: none (checked).
- D6: icons below. The DM Serif + is a hairline at 180/192; a heavier + is an option if Todd wants it.
- D7: rule JSON below, not applied. Cache keyed on number + date: AeroDataBox answers every leg in one call and the leg is chosen afterwards.
- D8: monitor crons `15,45 * * * *` (catalogue tools) and `0 */3 * * *` (all 4). Scheduled runs start only once the workflow is on main.

### Acceptance on preview
- Smoke: `node scripts/mcp-smoke.mjs <preview>/api/mcp` → PASS, 10 steps, p95 2,341 ms.
- AC-3 Inspector 2.11.0 CLI (Streamable HTTP, `--header x-tp-test:1`): tools/list shows 4 tools with titles and annotations; all 4 tools/call succeed. Production run + UI screenshot after merge.
- AC-4: GET + `Accept: text/event-stream` → 405; plain GET → 200 JSON; notifications/initialized → 202 (smoke steps).
- AC-5: get_recommendations refuel at 170 min → 8 venues, 0 landside; at 200 min → 12, the landside ones labelled "Landside: clear immigration both ways (visa rules apply)". get_route QF1 T1 at 170 min drops the Kopitiam stop; at 200 min keeps it, labelled.
- AC-7: zero rows `2ad04ca9…` no_recommendations, `ad28f1f3…` no_route_stops, `2039ed47…` flight_not_found.
- D7 proof: two flight-status calls (CDN bypassed by a unique query param, both `x-vercel-cache: MISS`): first `x-tp-adb-calls: 1`, second `x-tp-adb-calls: 0`, `x-tp-adb-cache-hits: 1`.
- D4: three urls open the exact venue on terminalplus.app: Kopitiam (T1), TWG Tea (T4), Bacha Coffee (T3).
- AC-1: /agents and /agents/ 200 (7,403 B, no app shell); at 375 px with the SW controlling, /agents loads the static page (no `#root`, no horizontal overflow). AC-2: /llms.txt 200 text/plain (7 lines).
- AC-9 (part): /.well-known/mcp.json, /.well-known/mcp/server-card.json, /.well-known/mcp-registry-auth 200 on preview; `mcp-publisher validate` ✅; `mcp-publisher login http --algorithm ecdsap384 --domain terminalplus.app` → "Successfully logged in" (token in `~/.mcp_publisher_token`, 600). Not published.
- AC-11: `git diff origin/main -- api/chat.ts api/lib/ranking.ts shared/ranking/policy.ts` empty; 0 CC-25 files touched; unit tests 80/80; adversarial 11/11; build and api tsc exit 0.
- Preview SMOKE 13/13 (anon `8f5ce973-ebd3-45dc-9f94-eec56a957016`): gate; skip journey `fc7f72c8-e120-4b64-b51a-f4e254ceeed5`; typed QF1 `835dd36c-35cc-4ca3-bec2-b3015942d6a1` ("4h 4m to board · On Time"); picker SQ424 `6da17581-6d0c-49ae-9880-ee6d378b7724`; 7 rows, 31/31 images, 32 counts; refuel 7; collection 7 of 7, Grain Traders, laksa → Kopitiam; Keep QF1 unchanged; Evening picks (local 13:39 UTC+3, SGT 18:39); chat `30f5b592-0ec1-4c6a-9640-9f00b99a94dc` (SIN-T1, 243 min); MCP refuel/SIN-T1 → 7; events 1790–1819.

### AC-6: one full response (get_recommendations, refuel, 170 min, preview)
```json
{
  "recommendations": [
    {
      "rank": 1,
      "name": "TWG Tea",
      "terminal": "SIN-T4",
      "vibe_tags": "Refuel",
      "price_level": "$$",
      "description": "Grab Singapore's premium tea brand for a quick pick-me-up between flights. Choose from rare single-origin blends or pair with fresh pastries to rechar",
      "editorial_note": "TWG is Singapore's premium tea brand — the tea salon serves full afternoon tea sets alongside single-pot brews. The 1837 Black Tea and Silver Moon Tea are signature blends. Gift tins are among the most elegant Singapore souvenirs.",
      "route_context": "T4 — tea salon or gift tin purchase",
      "url": "https://terminalplus.app/amenity/twg-tea-t4-new?utm_source=mcp&utm_medium=agent"
    },
    {
      "rank": 2,
      "name": "A&W Root Beer",
      "terminal": "SIN-T3",
      "vibe_tags": "Refuel,Quick",
      "price_level": "$",
      "description": "Nostalgic American fast food chain, famous for root beer floats",
      "editorial_note": "A&W is extinct in most countries but thrives at Changi T3 — the root beer float (ice cream + root beer) is nostalgic and delicious. Curly fries are the side order. Under for a combo. A genuine novelty for younger travellers.",
      "route_context": "T3 — unique find; allow 10 min",
      "url": "https://terminalplus.app/amenity/aw-root-beer-t3?utm_source=mcp&utm_medium=agent"
    },
    {
      "rank": 3,
      "name": "Bacha Coffee",
      "terminal": "SIN-T3",
      "vibe_tags": "Refuel,Explore",
      "price_level": "$$$",
      "description": "Opulent Moroccan-heritage coffee house and the jewel of Changi's T3 transit hall. Single-origin coffees from over 30 producing countries, fresh pastri",
      "editorial_note": "The world's largest Bacha Coffee outlet — 7,000 sq ft of Moroccan stained-glass ceilings and over 200 Arabica coffees. It's takeaway only (no dine-in seating), but even grabbing a cup to sip by the gates feels like a luxury moment.",
      "route_context": "Any T3 departure — quickest luxury coffee stop airside",
      "url": "https://terminalplus.app/amenity/bacha-coffee-sint3?utm_source=mcp&utm_medium=agent"
    },
    {
      "rank": 4,
      "name": "Starbucks",
      "terminal": "SIN-T3",
      "vibe_tags": "Refuel",
      "price_level": "$$",
      "description": "Popular coffeehouse in T3 transit area. Grab your favourite espresso drink, Frappuccino, or pastry between flights.",
      "editorial_note": "Best seating of four terminals — counter seats facing the atrium glass. 'Singapore Exclusive' drinks include pandan and coconut variations.",
      "route_context": "T3 — 30+ min layover, enjoy atrium views",
      "url": "https://terminalplus.app/amenity/starbucks-sint3?utm_source=mcp&utm_medium=agent"
    },
    {
      "rank": 5,
      "name": "The Coffee Bean & Tea Leaf",
      "terminal": "SIN-T3",
      "vibe_tags": "Refuel",
      "price_level": "$$",
      "description": "Reliable cafe in the T3 transit area. Espresso drinks, signature ice blended beverages, and pastries.",
      "editorial_note": "T3 CBTL with premium seating and terminal views. Original Ice Blended Coffee consistently good. Quieter than nearby Starbucks during peak hours.",
      "route_context": "T3",
      "url": "https://terminalplus.app/amenity/coffee-bean-tea-leaf-sint3?utm_source=mcp&utm_medium=agent"
    },
    {
      "rank": 6,
      "name": "Ya Kun Kaya Toast",
      "terminal": "SIN-T3",
      "vibe_tags": "Refuel,Explore",
      "price_level": "$$",
      "description": "Grab Singapore's iconic breakfast in minutes: soft-boiled eggs, kaya jam, and buttered toast with coffee or tea. Perfect for layover refueling or a qu",
      "editorial_note": "Over 70 years of kaya toast tradition: charcoal-grilled bread, homemade coconut jam, thick kopi. The fastest, cheapest, most authentically Singaporean meal at Changi — and very affordable.",
      "route_context": "Early morning transits — best quick Singaporean breakfast at Changi",
      "url": "https://terminalplus.app/amenity/ya-kun-kaya-toast-t3-new?utm_source=mcp&utm_medium=agent"
    },
    {
      "rank": 7,
      "name": "Hudsons Coffee",
      "terminal": "SIN-T2",
      "vibe_tags": "Refuel",
      "price_level": "$$",
      "description": "Australian specialty coffee chain and the only Hudsons outside Australia. Proper flat whites, long blacks, and espresso drinks in the T2 transit area.",
      "editorial_note": "Australian coffee chain — familiar if you're from Melbourne or Sydney. Flat whites are reliably good. The Ham & Cheese Toastie is a safe bet. Feels like home before a long flight.",
      "route_context": "T2 airside",
      "url": "https://terminalplus.app/amenity/hudsons-coffee-sint2?utm_source=mcp&utm_medium=agent"
    },
    {
      "rank": 8,
      "name": "McDonald's T2 Transit",
      "terminal": "SIN-T2",
      "vibe_tags": "Quick,Refuel",
      "price_level": "$",
      "description": "The only airside McDonald's at Changi. Self-order kiosks, full menu including Singapore-exclusive items like the McSpicy. Located in the T2 Departure/",
      "editorial_note": "The only McDonald's you can reach without leaving transit. Self-order kiosks, full Singapore menu including McSpicy. Open 24/7. The familiar fallback when nothing else appeals at 3am.",
      "route_context": null,
      "url": "https://terminalplus.app/amenity/mcdonalds-t2-transit?utm_source=mcp&utm_medium=agent"
    }
  ]
}
```
No `id`, `slug`, `editorial_score`, `total_available` or `filters_applied`; every venue has a url with utm_source=mcp. Data note: TWG/A&W editorial text has a dropped price ("Under for a combo").

### Icons (D6)
`public/icon-192.png`, `public/icon-512.png`, `public/icon-maskable.png` (glyphs reach 29% of the width from centre, inside the 40% safe circle), `public/apple-touch-icon.png` (180).

### Part F proposal (not applied; Vercel Pro, WAF rate limiting included, fixed window, key ip)
```json
[
  {"action": "rules.insert", "value": {"name": "Rate limit chat and agent cards", "active": true,
    "description": "60 requests per minute per IP (CC-26 F)",
    "conditionGroup": [{"conditions": [{"type": "path", "op": "eq", "value": "/api/chat"}]},
                       {"conditions": [{"type": "path", "op": "eq", "value": "/api/agent-card"}]}],
    "action": {"mitigate": {"action": "rate_limit", "rateLimit": {"algo": "fixed_window", "window": 60, "limit": 60, "keys": ["ip"], "action": "deny"}}}}},
  {"action": "rules.insert", "value": {"name": "Rate limit MCP", "active": true,
    "description": "600 requests per minute per IP: assistants share a few egress IPs (CC-26 F)",
    "conditionGroup": [{"conditions": [{"type": "path", "op": "eq", "value": "/api/mcp"}]}],
    "action": {"mitigate": {"action": "rate_limit", "rateLimit": {"algo": "fixed_window", "window": 60, "limit": 600, "keys": ["ip"], "action": "deny"}}}}}
]
```
Rate-limited requests get 429. Counters are per region. Proof after apply: a scripted burst of 70 POSTs to /api/chat with an invalid body (no Anthropic call) → 429 after 60; one normal chat turn from another IP stays 200.

### Test rows (Parts B to G)
agent_interactions (all is_test): `3736792f…` `1d2256fc…` `d344362f…` `8625bf87…` (smoke), `4b2d1e18…` `6c480022…` `a960ac74…` `04ef524c…` (AC-5), `2ad04ca9…` `ad28f1f3…` `2039ed47…` (AC-7), `b7a7f19f…` `5d973e4e…` `914be4f8…` `80f99868…` (Inspector), `994ba3bb…` (SMOKE 11), `30f5b592…` (chat). events 1787–1789 (fixed to test), 1790–1819. 0 rows with is_test false.

### Open for Todd
1. Apply the Part F rules (JSON above).
2. Merge `cc-26/agent-ready` to main. Then: production smoke, Inspector UI screenshot, monitor green scheduled run + red dispatch run (AC-8), burst test (AC-10).
3. Duplicate amenity row 71/72.
4. `mcp-publisher publish` (server.json above), then the directory submissions (`tasks/cc-26-submission-kit.md`).


## GO 1: rate limits (17 Oct, Todd)

**Correction:** the report's JSON used `rateLimit.action: "deny"`, which answers 403. The Vercel default action `rate_limit` answers 429, so I applied `"rate_limit"`; everything else is as written. The connector's firewall endpoints (PATCH, PUT, GET) all returned 404 "Seawall Config not found" for a project with no config. I used `vercel@64.5.0 firewall rules add --data … --yes` (2 rules staged, `firewall diff` showed exactly those 2), then `firewall publish`. Published ~15:02:36 UTC. `firewall status`: Enabled, 2 active rules, nothing else changed (OWASP off, bot protection off, attack mode off).

Burst from one IP, every request with `x-tp-test: 1`:

| Target | Requests | Result | Recovery after the window |
|---|---|---|---|
| POST /api/chat, body `{}` (400 at the `query is required` check, before any model call or telemetry) | 75 | 60 × 400, then 429 from #61 | 15:04:26 → 400 |
| POST /api/agent-card, body `{}` (404: CC-25 not deployed; the WAF counts by path) | 70 | 60 × 404, then 429 from #61 | 15:08:08 → 404 |
| GET /api/mcp (liveness: no DB, no AeroDataBox) | 620 | 600 × 200, then 429 from #601 | 15:08:08 → 200 |

Cost: agent_interactions 509 rows before (last 10:42:25 UTC) and 509 after, 0 rows since 15:02. The chat path logs every valid turn, so 0 rows means 0 turns reached Anthropic. /api/chat and /api/agent-card share one rule, so their counters add up.

## GO 2: merge and production

- #5 merged (`c9e2446`). `cc-26/agent-ready` was 0 commits behind main, so the rebase was a no-op; the preview SMOKE 13/13 above ran on `7aa858f`, and later commits are docs, a migration file and lessons only.
- PR #6 merged `3aa05f3`; its CI `verify` (pull_request, `93895c0`) completed success. Production `dpl_J6XxL7MBApAD4AGkk24ZXxNAJc6k` READY 15:09:17 UTC.
- Production smoke (all 4 tools): PASS, p95 2,304 ms. /agents, /llms.txt, /.well-known/mcp.json, /.well-known/mcp/server-card.json, /.well-known/mcp-registry-auth, /icon-512.png: 200.
- AC-3 Inspector 2.11.0 UI against https://terminalplus.app/api/mcp (custom header x-tp-test: 1): Connected, MCP 2025-03-26; Tools (4) with titles; get_recommendations shows READ-ONLY and returns venues with urls (screenshot in the session). Inspector CLI on production: get_route, get_airport_context, get_disruption_status all succeed.
- Production MCP rows, all is_test: `cfdf904a…` `0c860e42…` `83fc3dc6…` `979a64ac…` (smoke), `8aab40dd…` (Inspector UI), `f5828b2c…` `88ecdf53…` `f4c6bfee…` (Inspector CLI).
- AC-8 red run: dispatch with url `https://terminalplus.app/api/mcp-does-not-exist` → run 39044026933 failed at `GET (plain): HTTP 404`. Failure email: not verified here (the Gmail connector needs reconnecting); Todd to confirm.
- Monitor schedule: active on main since 15:08:46 UTC (`gh api …/actions/workflows/387731475`: state active). No scheduled run had fired by 17:12 UTC (slots 15:15, 15:45, 16:15, 16:45 passed; 0 agent_interactions rows between 15:13 and 17:13). (Superseded 18 Oct, below.)
- Green path proven by dispatch: run 39052776334 (17:13 UTC, production, catalogue tools) PASS, p95 2,648 ms; rows `16ee6b5d…` `d241288a…` is_test.
- Registry publish and directory submissions: HELD (Todd) until 7 days green with 0 unexplained reds; the clock starts at the first green scheduled run.

### Monitor, 18 Oct (AC-8 PASS)
- **First green scheduled run: 2026-10-17 17:52:19 UTC** (run 39055636933), about 2h44m after the workflow reached main. The 7-day clock started there and **completes 2026-10-24 17:52 UTC**, provided every run stays green and any red is explained.
- By 2026-10-18 17:00 UTC: 13 scheduled runs, 13 green, 0 red (plus the deliberate red dispatch 39044026933 and the green dispatch 39052776334, both 17 Oct).
- GitHub throttles the schedule: 13 runs in 23 h instead of about 56; gaps between runs are 11 to 201 min, median 131. Monitoring resolution is therefore about 2 to 3 hours, not 30 min. The keep-alive effect is unaffected (the DB is read every few hours).
- Production MCP rows from the monitor since 17:52: 36, all is_test, 0 zero_reason; 10 flight-tool calls, so about 10 AeroDataBox units a day (≈300 a month).
- No workflow edit made: Todd's go to touch mcp-monitor.yml was to re-register a schedule that hadn't fired, and it had already started. Re-registering could restart GitHub's delay.
- Publish and directory submissions stay HELD until 2026-10-24 17:52 UTC at the earliest.
