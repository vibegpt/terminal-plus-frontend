# Telemetry Phase 4 — Analytics Views (DD Charts) — Report

**Date:** 2026-07-12 SGT · **Migration:** `create_analytics_views` applied to `bpbyhdjdezynyiclqezy` via Supabase MCP, mirrored at `supabase/migrations/20260711182500_create_analytics_views.sql` (the file IS the applied SQL — full definitions there).
**Gates:** build passes · adversarial 11/11 (before and after) · all synthetic data cleaned up · `git status` matches file table.

**Result: all 6 views live, verified against hand-computed synthetic data (every number matched), locked to service-role, and the pre-existing `agent_interactions` anon hole is closed.** Plus one production finding that needs your attention (bottom).

## The views

| View | DD chart | Grain | Key columns |
|------|----------|-------|-------------|
| `analytics_ctr_by_position` | #1 Ordering drives behavior | vibe × terminal × position | impressions, taps, ctr |
| `analytics_editorial_engagement` | #2 Curation has signal | amenity | editorial_score, google_rating, impressions, taps, ctr, avg_dwell_ms |
| `analytics_agent_tool_volume` | #4 MCP traction | SGT day × tool | calls, avg_latency_ms, sessions, avg_calls_per_session |
| `analytics_surface_parity` | July-8 exhibit, monitored | SGT day × terminal × vibe | agent_calls, human_impressions, avg/min_top3_overlap |
| `analytics_funnel` | Telemetry alive + conversion | SGT day × surface | sessions→vibes→impressions→taps→dwells + step rates |
| `analytics_jewel_pull` | The Changi conversation | origin terminal × amenity terminal | impressions, taps, ctr, is_cross_terminal |

Conventions: SGT day boundaries; tap `position` is 0-based, impression slugs unnested `WITH ORDINALITY` shifted −1; `lower()` vibe matching across surfaces; every ratio wrapped in `nullif` (no div-by-zero anywhere).

## Empty-data proof (run before synthetic insert; `events` was empty)

All events-based views: **0 rows, zero errors**. `analytics_editorial_engagement`: 378 amenity rows, all zero counts, `ctr` NULL on all (no null explosion). `analytics_agent_tool_volume`: 1 row from the 10 pre-existing agent rows. Pre-test counts recorded: events=0, agent_interactions=10.

## Synthetic verification — expected vs actual (every cell matched)

Scenario: 2 sessions (S1@SIN-T1 with 7-slug refuel impression, taps at positions 0 and **3**, one 42000 ms dwell; S2@SIN-T3 with 3-slug impression, tap at 0) + 3 agent rows (2× get_recommendations SIN-T1/refuel latency 100/200 across 2 sessions, 1× get_route latency 300).

**CTR by position — including the off-by-one probe:**

| terminal | pos | expected imp/taps | actual |
|----------|-----|-------------------|--------|
| SIN-T1 | 0 | 1 / 1 | 1 / 1 ✓ |
| SIN-T1 | 1–2 | 1 / 0 | 1 / 0 ✓ |
| **SIN-T1** | **3** | **1 / 1 (tap on the 4th slug, ordinality 4 → position 3)** | **1 / 1 ✓ ctr 1.0** |
| SIN-T1 | 4–6 | 1 / 0 | 1 / 0 ✓ |
| SIN-T3 | 0 | 1 / 1 | 1 / 1 ✓ |
| SIN-T3 | 1–2 | 1 / 0 | 1 / 0 ✓ |

**Editorial engagement:** kopitiam 2 imp / 1 tap / ctr 0.5 ✓ · fossa 1/1/1.0 + avg_dwell 42000, dwell_count 1 ✓ · food-court 2/1/0.5 ✓ · wang-cafe 2/0/0 ✓ · google_rating populated where present (fossa 3.4, grain-traders 4.4, twg 4.2) ✓

**Tool volume:** get_recommendations calls 2, avg_latency 150, sessions 2, 1.0 calls/session ✓ · get_route 1 / 300 ✓

**Surface parity:** (2026-07-12, SIN-T1, refuel): agent_calls 2, human_impressions 1, avg_top3_overlap **3.0**, min 3 ✓ · no SIN-T3 row (no agent call there) ✓ — this is the post-scorer-fix "parity HELD" metric.

**Funnel (app):** sessions 2, vibes 2, impressions 2, taps 3, dwells 1; vibes_per_session 1.0, taps_per_impression 1.5, dwells_per_tap 0.333 ✓

**Jewel pull:** origin SIN-T1 × SIN-JEWEL: imp 4, taps 1, **ctr 0.25** ✓ · SIN-T3 × JEWEL: 1/0 ✓ · same-terminal row correctly `is_cross_terminal=false` ✓

## Cleanup proof

Deleted: 10 synthetic events + 3 synthetic agent rows + 1 production probe row (4 agent total). Post-cleanup counts: **events = 0, agent_interactions = 10** — exactly pre-test.

## Access control proof

- Anon-key REST select on **each of the 6 views** → `42501 permission denied` (HTTP 401). Views also carry `security_invoker = on`, so base-table RLS applies even if a grant ever leaks back.
- **Pre-existing hole closed (approved):** `agent_interactions` had policy `USING(true)` for ALL roles — anon could read AND write it. Post-fix: anon select returns `[]` with 13 rows present; anon insert → `42501 new row violates row-level security` (both shown live).
- PII: no view selects `user_message`/`agent_response`; search telemetry logs only `query_len`+`results_count` (verified at `SearchPage.tsx:72`).
- Note for a future dashboard role: `security_invoker` means any new reader role needs grants on the base tables too, not just the views.

## Example DD-chart pulls

```sql
-- #1 CTR curve by position (all-time, refuel)
select position, sum(impressions) imp, sum(taps) taps,
       round(sum(taps)::numeric / nullif(sum(impressions),0), 4) ctr
from analytics_ctr_by_position where vibe = 'refuel' group by 1 order by 1;

-- #2 Editorial score vs engagement (scatter source)
select editorial_score, google_rating, ctr, avg_dwell_ms, impressions
from analytics_editorial_engagement where impressions >= 20;

-- #4 MCP traction over time
select day_sgt, tool_name, calls, avg_latency_ms, avg_calls_per_session
from analytics_agent_tool_volume order by day_sgt, tool_name;

-- Parity monitor (alert if < 3)
select day_sgt, terminal, vibe, avg_top3_overlap, min_top3_overlap
from analytics_surface_parity order by day_sgt desc;

-- Funnel health (today)
select * from analytics_funnel where day_sgt = (now() at time zone 'Asia/Singapore')::date;

-- Jewel pull matrix
select origin_terminal, impressions, taps, ctr from analytics_jewel_pull
where amenity_terminal = 'SIN-JEWEL' order by ctr desc;
```

## Materialized-view threshold

Not worth it yet: plain views over ~10² rows answer in ms. Revisit when `events` passes ~1M rows or any DD query exceeds ~500 ms — then materialize `analytics_ctr_by_position` and `analytics_editorial_engagement` (the two that unnest jsonb per impression) with a cron refresh (hourly is plenty for DD charts).

## ⚠️ Production finding (action needed, separate from this task)

The live-prod guard call surfaced this: **production (terminalplus.app) is running an April 1 deployment.** Its MCP response still uses the pre-fix scorer ordering (rank 1 = starbucks-sint1), and its telemetry writes the legacy shape (constant `session_id='mcp-orchestrator'`, no `tool_name`/`latency`/`result_slugs`). Everything shipped since — editorial ranking fix (Jul 5), Phase-3 MCP telemetry (Jul 7), the scorer unification (Jul 11) — is on local `main`, unpushed/undeployed. The good news the probe proved: prod has `SUPABASE_SERVICE_ROLE_KEY`, so the RLS fix does not break prod logging, and the views will read whatever shape lands. **Recommend: push + deploy `main` as its own decision** — until then, DD charts fed by prod traffic reflect the old scorer, and `analytics_agent_tool_volume` won't see prod rows (they lack `tool_name`).

## File changes

| File | Status |
|------|--------|
| `supabase/migrations/20260711182500_create_analytics_views.sql` | committed — `feat(analytics): DD views over events + agent_interactions` |
| `tasks/telemetry-phase4-report.md` | this file (untracked, per task-doc convention) |
| Protected files, app code, base tables (beyond the approved policy fix) | untouched |
