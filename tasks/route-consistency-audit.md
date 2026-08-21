# Route Consistency Audit — 2026-04-03

**Commit:** `d183dbe` — fix: align MCP get_route with chat agent queryRouteMatch

---

## Divergences Found (Pre-Fix)

| Aspect | Chat agent (`queryRouteMatch`) | MCP (`handleGetRoute`) | Impact |
|--------|------|------|--------|
| Terminal match | OR on arrival/departure | Exact match on BOTH | MCP missed cross-terminal routes (Terminal Hop) |
| Gate buffer | 15 min, progressive strip | Not factored into strip | MCP returned routes that overran budget |
| amenity_detail join | Yes, for terminal codes | No | MCP stops lacked terminal_code |
| Best-fit selection | Closest midpoint | Takes first match | MCP picked wrong template when multiple matched |
| Flight number match | No | Yes | MCP-only feature, preserved |
| Dynamic fallback | No (uses amenity list) | Yes, editorial-scored | MCP-only feature, preserved |

## Fix Applied

Refactored `handleGetRoute` in `api/mcp.ts`:
1. **Flight-number matching** preserved as first-pass (MCP-specific feature) with gate buffer + progressive strip logic added
2. **Terminal+time matching** now delegates to shared `queryRouteMatch()` from `api/lib/agent.ts`
3. **Dynamic fallback** preserved for unmatched terminals
4. Both paths now include `gate_buffer_minutes` and `is_time_tight` in responses

## MCP Test Results (Post-Fix)

### Test A: T1, 120 min → Reverse Kangaroo
**PASS** — 5 stops: Ya Kun → Cactus Garden → Fish Spa → IRVINS → Kopitiam. gate_buffer=15, is_time_tight=false.

### Test B: T3, 180 min → Terminal Hop
**PASS** — 5 stops: Butterfly Garden → Sushi Tei → Rain Vortex → Grain Traders → Cactus Garden. Cross-terminal route now matched (was broken before fix).

### Test C: T4, 90 min → T4 Island
**PASS** — 3 stops (optional stripped): Heritage Zone → TWG Tea → Lego Store. is_time_tight=true.

### Test D: T2, 90 min → T2 Garden Run
**PASS** — 5 stops: Sunflower Garden → T2 Food Gallery → Orchid Garden → Kenangan Coffee → dnata Lounge. gate_buffer=15.

## Consistency Check

All 4 tests return identical route names and stop sequences as the chat agent for the same terminal+time inputs. Both paths now use `queryRouteMatch()` as the single source of truth for curated template matching.

| Test | Chat Agent Route | MCP Route | Match? |
|------|-----------------|-----------|--------|
| T1/120 | Reverse Kangaroo, 5 stops | Reverse Kangaroo, 5 stops | Yes |
| T3/180 | Terminal Hop, 5 stops | Terminal Hop, 5 stops | Yes |
| T4/90 | T4 Island, 3 stops (stripped) | T4 Island, 3 stops (stripped) | Yes |
| T2/90 | T2 Garden Run, 5 stops | T2 Garden Run, 5 stops | Yes |
