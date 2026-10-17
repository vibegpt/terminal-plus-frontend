# CC-26 report: agent-ready MCP server

Status, 17 Oct 2026: Part A SHIPPED (PR #5, merge `c9e2446`, production `dpl_DKJ5mnXnQUKahB9kzc3yZkUd58hL` READY). Parts B to G not started.

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
