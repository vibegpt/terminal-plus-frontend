# CC-26 report: agent-ready MCP server

Status, 17 Oct 2026: Part A on review (branch `cc-26a/privacy`). Parts B to G not started.

## G1
Production `dpl_GfrDKorW2rF2yuKQokhNNwnCx3D2` = `afb5dc2` = origin/main. Worktree `~/tp-cc-26`.

## Part A: /privacy (branch `cc-26a/privacy`, commit `b59cccc`)

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
Not changed; for Todd to decide:
1. Country is recorded when a flight is skipped too (`FlightContextCapture.tsx:966` writes a `skipped` journey; `first_open_country` rides on it). The page says "when you add a flight".
2. Voice input (`useVoice.ts`, Web Speech API) isn't mentioned. In Chrome the audio is processed by Google.
3. `auth.users` holds 3 old accounts with email addresses, while the page says no email is collected.
4. The "groups under 5 left out" promise is enforced only in `analytics_journey_trail_k5`.
5. AeroDataBox / API.market processing location not verified.
6. Anthropic also receives flight number, destination, gate and passenger type (covered by "such as").

Lawyer flags: GA4 cookies without a consent step (EU/UK visitors); no retention limit; US transfers.

### Test rows
events 1754 (session_start, preview, is_test true). MCP discovery calls (production, `smoke-cc26-g2-*` session, is_test true): agent_interactions `45bca66f-6c44-4034-b817-32969c17d845`, `595ea990-3ced-4111-beff-7b668008992f`, `72998ad6-7938-4cd5-9654-ff86d40e93d6`, `0410b22e-7665-42f9-98bd-9e4d0d4f2692`. 0 rows with is_test false.

### G2g
Repo-root `mcp-registry-key.pem` is ECDSA P-384; its compressed public key equals the `p=` in the live `/.well-known/mcp-registry-auth` (compared in a shell variable, never printed). No new key needed.
