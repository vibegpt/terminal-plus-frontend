# MCP Capability Card Audit — 2026-04-03

**Commit:** `473a2d8` — fix: sync MCP capability card with actual tool schemas

---

## Divergences Found

| Field | Card (before) | Code (source of truth) | Fixed |
|-------|--------------|----------------------|-------|
| `name` | `Terminal+ Airport Agent` | `terminal-plus` | Yes |
| `version` | `1.0.0-beta` | `1.0.0` | Yes |
| `transport` | `["streamable-http"]` | Plain JSON-RPC over HTTP POST | Changed to `["json-rpc-http"]` |
| Tool schemas | Simplified `{required:[], optional:[]}` | Full `inputSchema` with types, enums, descriptions | Replaced with full schemas |
| `get_route` output description | Generic | Missing `route_type`, `gate_buffer` fields | Updated |
| `specialisation` | Missing `route_planning` | `get_route` tool exists | Added |
| `data_sources` | Missing `routes` | 6 curated route templates | Added |
| `get_recommendations` output | No mention of editorial notes | Returns editorial_note, editorial_score | Updated |

## Tool-by-Tool Verification

### get_airport_context
- **Params match:** `flight_number` (required, string), `date` (optional, string) ✅
- **Description:** Accurate ✅

### get_recommendations
- **Params match:** `terminal`, `vibe` (with enum), `time_until_boarding_minutes`, `gate`, `exclude_jewel`, `limit` — all optional ✅
- **Enum values match:** `['explore', 'refuel', 'comfort', 'chill', 'work', 'shop', 'quick']` ✅

### get_disruption_status
- **Params match:** `flight_number` (required, string), `date` (optional, string) ✅
- **Description:** Accurate ✅

### get_route
- **Params match:** `arrival_terminal` (required), `time_budget_minutes` (required), `departure_terminal`, `flight_number`, `vibe` — all correct ✅
- **Enum values match** for `vibe` ✅
- **Output description updated** to mention `route_type` ('curated'/'dynamic') and gate buffer ✅

## Endpoint Verification

Card says `https://terminalplus.app/api/mcp` — note that `terminalplus.app` DNS currently points to wrong IP. Vercel deployment works at `terminal-plus-frontend-*.vercel.app/api/mcp`. Card URL is correct for when DNS is fixed.

## No Missing/Extra Tools

- Card lists 4 tools: `get_airport_context`, `get_recommendations`, `get_disruption_status`, `get_route` ✅
- Code registers 4 tools: same 4 ✅
- No orphaned tools in either direction ✅
