# CC-2B Journeys write lock: report

**Status: BLOCKED at G1.** No migration file, DB write or code change was made. No smoke rows exist.

Run date: 2026-10-02. Branch: `release/2026-09` at `e0b9e60`.

## Gates

### G1 production sha == origin/main, with CC-1 live: FAIL

`git fetch origin` succeeded.

```
$ git log -1 --format='%h %ci %s' origin/main
dfd494e 2026-04-04 22:23:14 +0300 chore: add *.pem to gitignore for MCP registry key
$ git log -1 --format='%h %ci %s' origin/release/2026-09
e0b9e60 2026-09-29 06:55:26 +0000 fix(capture): one heading and one skip link on the flight step
```

Vercel, the newest READY production deployments (`list_deployments`, target production):

| Deployment | Created (UTC) | Sha |
|---|---|---|
| `dpl_32TTLN1DCmuZjEMJxPpVvimRbcEd` | 2026-09-29 06:47 | `dfd494e` |
| `dpl_FXqhc52PZMv24ppGtUXSZGEtkAmW` | 2026-09-27 13:24 | `dfd494e` |
| `dpl_3Ls7gtGcfdG3S66Gi1Beue9witWB` | 2026-09-27 10:43 | `dfd494e` |

`sha == origin/main` is true, but both are the 4 Apr code. CC-1 isn't live, so the `/api/journey` typed path can't be proven on production.

### G2 /api/journey typed path writes on production: NOT RUN

Halted after G1. Production doesn't serve `api/journey.ts` until CC-1 ships.

### G3 caller gate: NOT RUN, and the gate was widened

Halted after G1. One grep was run because it showed that the gate as written didn't cover what the migration touches.

The original gate checked only `.from('journeys')`. The migration also revokes everything on `amenity_interactions` and `user_sessions` from anon and authenticated. Those tables have client callers:

```
$ grep -rn "from(['\"]\(journeys\|amenity_interactions\|user_sessions\)['\"])" src/ api/ --include='*.ts' --include='*.tsx' | grep -v " 2\.\|_backup_"
src/pages/plan-journey.tsx:79:      ... supabase.from("journeys").insert([journeyData]);
src/services/supabaseTrackingService.ts:15:        .from('user_sessions')
src/services/supabaseTrackingService.ts:45:        .from('amenity_interactions')
src/services/supabaseTrackingService.ts:69:        .from('amenity_interactions')
src/services/supabaseTrackingService.ts:216:        .from('amenity_interactions')
src/services/supabaseTrackingService.ts:246:        .from('amenity_interactions')
src/services/supabaseDataService.ts:215:        .from('amenity_interactions')
src/services/supabaseDataService.ts:338:          .from('amenity_interactions')
src/services/supabaseDataService.ts:504:        .from('amenity_interactions')
src/services/supabaseDataService.ts:716:        .from('amenity_interactions')
api/journey.ts:171:    .from('journeys')
```

`api/journey.ts` is the service-role route and is expected. The other 10 are client code. One-hop importers:

| Module | Imported by |
|---|---|
| `plan-journey.tsx` | `src/routes-updated 3.tsx` (dead by name), `src/pages/journey-success.tsx`, `src/pages/your-journeys.tsx` |
| `supabaseTrackingService.ts` | `src/utils/smart7PerformanceOptimizer.ts`, `src/utils/sessionTracking.ts`, `src/hooks/useSmart7Selection.tsx`, `src/hooks/useTracking.tsx`, `src/services/supabaseDataService.ts` |
| `supabaseDataService.ts` | `src/utils/testSupabase.ts`, `src/components/Smart7Collections.tsx`, `src/services/index.ts` |

One hop doesn't prove reachability. If any of these is reachable, the migration turns its writes into permission errors. Reachability is **unproven** either way.

**The caller gate now reads (Todd, 2 Oct):**

> No reachable client code calls .from() on journeys, amenity_interactions or user_sessions.
> Full import trace from src/main.tsx (esbuild metafile, @/ aliases resolved) on two trees:
> the release head and dfd494e (the rollback target). Count lazy and DEV-gated chunks; flag DEV-only paths.
> Any reachable caller on either tree: halt and report the import chain.

## Unblock path

1. CC-1 to production (CC-1F): preview SMOKE, fast-forward `main`, prod SMOKE.
2. Prove the `/api/journey` typed path writes on production (CC-1F SMOKE line).
3. Run the widened caller gate on both trees.
4. Re-run the policy-name pre-check against `pg_policies`, then write and apply `supabase/migrations/<ts>_rls_lockdown_part_b.sql`.

## Smoke row ids

None. Nothing was written.
