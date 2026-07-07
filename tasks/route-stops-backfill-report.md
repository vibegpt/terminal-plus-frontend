# Route Stops Slug Backfill — Report

Date: 2026-07-07
Project: bpbyhdjdezynyiclqezy · Data-only change (zero code edits)
Commit: `fix(data): backfill route_stops amenity slugs` (not pushed)

## Audit (all 6 routes — trusted the DB, not the docs)

Docs claimed all routes populated; only 4 were. 30 stops total, **10 null slugs** across two routes:

| route_id | route | terminal | stops | null (before) |
|---|---|---|---|---|
| qf1-quick-stop | The Kangaroo Quick Stop | T1→T1 | 5 | 5 |
| sq-connector | The SQ Connector | T3→T3 | 5 | 5 |
| reverse-kangaroo | The Reverse Kangaroo | T1→T1 | 5 | 0 |
| t2-garden-run | The T2 Garden Run | T2→T2 | 5 | 0 |
| t4-island | The T4 Island | T4→T4 | 5 | 0 |
| terminal-hop | The Terminal Hop | T3→T1 | 5 | 0 |

Structural insight: the 4 populated routes contain **zero buffer/facility stops**. The two null routes uniquely include navigation steps (restrooms, "walk to gate") — not amenities, correctly null.

## Applied mapping (6 UPDATEs — all resolve)

| Route | Stop | Term | Slug | Resolves to | Basis |
|---|---|---|---|---|---|
| qf1-quick-stop | 2 · Hawker stalls | T1 | `sin-t1-kopitiam-1757008220.066062` | Kopitiam | Only T1 hawker food court; same area; reverse-kangaroo uses this slug for its equivalent stop |
| qf1-quick-stop | 3 · Cactus Garden | T1 | `cactus-garden-t1` | Rooftop Cactus Garden | Area "T1 rooftop"; sibling routes reverse-kangaroo + terminal-hop use it (Todd confirmed over `-new`) |
| qf1-quick-stop | 4 · Duty-free corridor | T1 | `lotte-duty-free-t1-new` | Lotte Duty Free | Sole duty-free anchor at Changi |
| sq-connector | 2 · Butterfly Garden | T3 | `butterfly-garden-t3-new` | Butterfly Garden | Exact name + terminal; terminal-hop uses it |
| sq-connector | 3 · Luxury retail corridor | T3 | `louis-vuitton-t3` | Louis Vuitton | Stop's editorial_note names Louis Vuitton as anchor |
| sq-connector | 4 · 24hr Movie Theatre | T3 | `movie-theatre-t3` | Movie Theatre | Exact name + terminal |

Verification: table-wide `LEFT JOIN route_stops → amenity_detail` returned **0 broken refs**. Re-audit: null 10 → **4** (6 filled), exactly the review + intentional rows below.

## UNMATCHED — manual review (left null)

| Route | Stop | Term | Why | To resolve |
|---|---|---|---|---|
| sq-connector | 1 · SilverKris Business Lounge | T3 | `amenity_detail` has **no T3 SilverKris row** — only `singapore-airlines-silverkris-lounge-t1-new` (wrong terminal). T3 lounges present (Cathay Pacific, SATS Premier) are *different* lounges; mapping to them would be false data. | Create a real T3 SilverKris amenity row, then set this stop's slug to it. (Out of scope: no new amenities.) |

## Intentionally null — navigation steps, not amenities (correctly left null)

| Route | Stop | Type |
|---|---|---|
| qf1-quick-stop | 1 · Restrooms near D gates | facility |
| qf1-quick-stop | 5 · Walk to gate + security | buffer |
| sq-connector | 5 · Walk to departure gate | buffer |

These carry their own `name` + `editorial_note`, so `get_route` still renders them as guidance — they were never broken refs, just non-amenity steps.

## Before / after — sq-connector (authoritative DB state)

| # | Stop | Before | After → resolves to |
|---|---|---|---|
| 1 | SilverKris Business Lounge | null | null (UNMATCHED) |
| 2 | Butterfly Garden | null | `butterfly-garden-t3-new` → Butterfly Garden |
| 3 | Luxury retail corridor | null | `louis-vuitton-t3` → Louis Vuitton |
| 4 | 24hr Movie Theatre | null | `movie-theatre-t3` → Movie Theatre |
| 5 | Walk to departure gate | null | null (buffer) |

Reader path confirmed: `get_route {arrival_terminal:'SIN-T1', flight_number:'QF1'}` via the live MCP handler now returns Hawker stalls → `sin-t1-kopitiam-…`, Cactus Garden → `cactus-garden-t1`, Duty-free corridor → `lotte-duty-free-t1-new` (previously all null); `get_route {arrival_terminal:'SIN-T3', time_budget:150}` returns Butterfly Garden and Luxury retail corridor resolving (Movie Theatre present in DB; stripped from that response only by the existing optional-stop time budget logic, not the backfill).

## Verification checklist

- ✅ Build passes, adversarial 10/10 (before and after; no code touched)
- ✅ Write access confirmed (zero-row DML probe)
- ✅ 0 broken refs table-wide after apply
- ✅ Null count 10 → 4 = exactly 1 UNMATCHED + 3 intentional-null
- ✅ Real reader (MCP `get_route`) returns resolvable slugs for backfilled stops
- ✅ `git status`: only `supabase/seeds/route_stops_backfill_20260706.sql` added; zero code files (pre-existing `api/lib/agentPrompt.ts` untouched)

## Artifacts
- `supabase/seeds/route_stops_backfill_20260706.sql` — the 6 idempotent UPDATEs (guarded `where amenity_slug is null`), plus header documenting the UNMATCHED + intentional-null rows.
