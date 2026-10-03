# CC-2B Journeys and legacy telemetry lockdown: report

**Status: DONE. Migration `20261003055908_rls_lockdown_part_b` is applied. anon and authenticated hold 0 privileges and 0 policies on journeys, amenity_interactions, user_sessions, events and agent_interactions. Anon REST gets 42501 on all 5. `/api/journey` and the browser capture flow still write on production, and every row written in this run is `is_test = true`.**

Runs:
- Gates: 2026-10-02 19:36 to 19:39 UTC. Production `dpl_GKAESzzYjM8xvvJvMWuyDJEyM1NU`, sha `7590fe6`.
- Apply and acceptance: 2026-10-03 05:57 to 06:02 UTC.

The first attempt (2 Oct, on `release/2026-09`) was BLOCKED at G1 because CC-1 wasn't live. That history is in git (`40ec948`).

## Changes from the pack's SQL (Todd, approved with the plan)

1. `revoke all` on journeys, events and agent_interactions, in place of `revoke insert, update, delete, truncate`. The partial revoke would have left SELECT, REFERENCES and TRIGGER, with RLS as the only barrier on reads.
2. `role_table_grants` captured before the apply, so the rollback restores grants as well as policies.

## Gates

| Gate | Result | Evidence |
|---|---|---|
| Production sha == origin/main | PASS | `get_deployment terminalplus.app` → `dpl_GKAESzzYjM8xvvJvMWuyDJEyM1NU`, READY, `githubCommitSha 7590fe6e877555c627e19533ad5227cef99fbb4b`. `git fetch`: origin/main = `7590fe6` |
| `/api/journey` typed path writes on production | PASS | `POST /api/journey`, `x-tp-test: 1`, typed QF1 → 200 `c5c2e12d-df4d-4611-acb9-28e46c3d767e`. DB: `typed`, `env='production'`, `is_test=true`, uuid ids |
| Client caller gate, 2 trees | PASS | See below. No reachable caller on `7590fe6` or `40ec948` |
| Server anon-key reader gate (added 3 Oct) | PASS, with one finding | No server-side anon-key client reads journeys, events or agent_interactions. The `saveJourney` edge function writes journeys with the anon key (see Findings) |
| Policy-name pre-check | PASS | 19:36:47 UTC: all 15 names match `pg_policies`. journeys 7, amenity_interactions 4, user_sessions 4. RLS on for all 5 tables |

### Client caller gate

Method: an esbuild metafile from `src/main.tsx`, built from `git archive` of each commit. `@/` resolves to `src/` with esbuild's own resolver; there were 0 unresolved aliases and 0 build errors. Bundling uses `splitting: true`, so lazy imports show up as `dynamic-import` edges. It ran twice per tree, with `import.meta.env.DEV` set true and false. The script is a scratch file, not committed.

| Tree | src .ts/.tsx | Reachable | Static | Lazy only | DEV-only |
|---|---|---|---|---|---|
| `7590fe6` (production head) | 802 | 38 | 23 | 15 | 0 (identical sets with DEV true or false) |
| `40ec948` (code rollback target) | 802 | 38 | 23 | 15 | 0 (set identical to `7590fe6`) |
| `dfd494e` (informational, no longer a rollback target) | 802 | 42 | 20 | 22 | 0 |

Known callers, classified:

| Caller | `7590fe6` | `40ec948` | `dfd494e` |
|---|---|---|---|
| `src/services/supabaseTrackingService.ts` (15, 45, 69, 216, 246) | not reachable | not reachable | not reachable |
| `src/services/supabaseDataService.ts` (215, 338, 504, 716) | not reachable | not reachable | not reachable |
| `src/pages/plan-journey.tsx:79` | not reachable | not reachable | not reachable |

The only mentions of the 3 table names in reachable files are 5 comments (`JourneyContext.tsx`, `telemetry.ts`). There are no `.rpc(` calls. On `dfd494e`, `my-journeys.tsx` is reachable but only uses `journeys` as a local state name; it has no Supabase import.

Cross-check against a real build: `vite build` of each tree emits 20 JS chunks. `amenity_interactions`, `user_sessions` and `journeys` appear **0 times** in the emitted JS. The only `.from()` targets are `amenity_detail` (5), `collections` (2), `amenity_vibe_descriptions` (1) and `collection_amenities` (1). Identical on both trees.

### Server-side clients

| File | Key | Tables |
|---|---|---|
| `api/journey.ts` | service role only | journeys (insert, `.select('id')`) |
| `api/events.ts` | service role only | events (insert) |
| `api/mcp.ts` | service role, falls back to anon | route_templates, route_stops, amenity_detail. agent_interactions via `logToolCall`, insert only, no read-back |
| `api/chat.ts` | service role, falls back to anon | amenity_detail |
| `api/cron/sync-reviews.ts` | service role, falls back to anon | amenity_detail |
| `scripts/resolve-place-ids.ts` | service role only | amenity_detail |
| Edge function `saveJourney` (deployed, ACTIVE v9) | **anon** | journeys, **insert only** |
| Edge function `log-emotion` (deployed, ACTIVE v4) | service role | emotion_logs |

DB side:
- No explicit column ACLs on the 5 tables.
- No `pg_cron` or `pg_net`.
- One trigger, `amenity_interactions.update_session_last_active` → `update_last_active()`. It updates user_sessions and is SECURITY INVOKER.
- `clean_old_sessions()` (SECURITY INVOKER) deletes from user_sessions. Nothing reachable calls it.
- Dependent views: the `analytics_*` views (`security_invoker=on`, already revoked from anon), and the `ab_experiment_results` matview on amenity_interactions (already revoked, CC-2 A). Todd confirmed on 2 Oct, 19:45 UTC, that no security-definer view reads the 5 tables.

## Before

### Policies (`pg_policies`, 2026-10-02 19:36:47 UTC)

| Table | Policy | Cmd | Roles | Using | With check |
|---|---|---|---|---|---|
| journeys | Allow insert for all | INSERT | public | | `true` |
| journeys | Allow insert for all (MVP mode) | INSERT | public | | `true` |
| journeys | Allow insert for anonymous users | INSERT | anon | | `true` |
| journeys | Allow insert for authenticated users | INSERT | public | | `auth.uid() = user_id` |
| journeys | Allow select for authenticated users | SELECT | public | `auth.uid() = user_id` | |
| journeys | own journey | SELECT | public | `user_id = auth.uid()` | |
| journeys | save journey | SELECT | public | `user_id = auth.uid()` | |
| amenity_interactions | Allow anonymous insert on amenity_interactions | INSERT | public | | `true` |
| amenity_interactions | Allow read on amenity_interactions | SELECT | public | `true` | |
| amenity_interactions | anon insert amenity_interactions | INSERT | anon | | `true` |
| amenity_interactions | anon read amenity_interactions | SELECT | anon | `true` | |
| user_sessions | Allow anonymous insert on user_sessions | INSERT | public | | `true` |
| user_sessions | Allow read on user_sessions | SELECT | public | `true` | |
| user_sessions | anon insert user_sessions | INSERT | anon | | `true` |
| user_sessions | anon read user_sessions | SELECT | anon | `true` | |
| agent_interactions | service_role_only | ALL | service_role | `true` | `true` |
| events | none | | | | |

All permissive.

### Grants (`information_schema.role_table_grants`, 2026-10-03 05:57:56 UTC, PG 15.8)

On all 5 tables, both `anon` and `authenticated` held `DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE`. Grantor `postgres`, not grantable. That's 70 grant rows, and `relacl` was `anon=arwdDxt/postgres, authenticated=arwdDxt/postgres` on each table. RLS doesn't govern TRUNCATE, so the anon TRUNCATE grant was held back only by PostgREST not exposing it.

Row counts: journeys 34 (0 non-test), events 136 (0), agent_interactions 15 (0), amenity_interactions 0, user_sessions 0.

## Migration

`supabase/migrations/20261003055908_rls_lockdown_part_b.sql`. The file was written first, then dry-run, then applied.

| Step | Result |
|---|---|
| Dry run | The file's statements ran inside a `DO` block that reported its checks and then raised, which forces a rollback. Result: `policies_left=[agent_interactions:service_role_only] client_privileges_left=[none] service_role_insert_journeys=t service_role_insert_events=t` |
| Nothing persisted | 05:58:50 UTC: 15 policies on the 3 tables, 70 client grant rows (unchanged) |
| Apply | `apply_migration rls_lockdown_part_b` → success. The DB recorded version `20261003055908`, and the file was renamed to match |

## After (2026-10-03 05:59:21 UTC)

| Check | Result |
|---|---|
| Policies on the 5 tables | `agent_interactions: service_role_only (ALL to service_role)` only. journeys, amenity_interactions, user_sessions and events have none |
| `role_table_grants` for anon and authenticated | 0 rows |
| `has_table_privilege` (2 roles × 5 tables × 7 privileges) | **0 of 70 true** |
| `has_any_column_privilege` (SELECT, INSERT, UPDATE, REFERENCES) | 0 true |
| `relacl` | `{postgres=arwdDxt/postgres, service_role=arwdDxt/postgres}` on all 5 |
| RLS | on for all 5 |

### Security advisors

| Lint | Before (05:57 UTC) | After (06:02 UTC) |
|---|---|---|
| `rls_enabled_no_policy` (INFO) | 23 | 26: adds journeys, amenity_interactions and user_sessions, which now deny all non-service roles by design |
| `function_search_path_mutable` (WARN) | 29 | 29 |
| `extension_in_public` (WARN) | 1 | 1 |
| `auth_otp_long_expiry` (WARN) | 1 | 1 |
| `auth_leaked_password_protection` (WARN) | 1 | 1 |
| `vulnerable_postgres_version` (WARN) | 1 | 1 |
| ERROR level | 0 | 0 |

## Acceptance

| Acceptance | Result | Evidence |
|---|---|---|
| Anon `POST /rest/v1/journeys` → 42501 | PASS | `{"code":"42501","message":"permission denied for table journeys"}`, HTTP 401. The probe body carried `is_test: true, env: 'cc2b-probe'`, in case it ever landed |
| Anon reads on the other tables | PASS | `GET` journeys, amenity_interactions, user_sessions, events and agent_interactions: 42501 on each. `PATCH journeys?id=eq.<zero uuid>`: 42501 |
| Catalogue reads unaffected | PASS | Anon `GET collections` → 200 |
| `/api/journey` typed path still writes on production | PASS | 05:59:45 UTC → 200 `917bea0b-fb1d-437c-a44b-26c12cb6fdc0`: `typed`, `env='production'`, `is_test=true` |
| Capture flow works in the browser | PASS | Production, 375 px, `tp_test=1` set from `/registerSW.js` before the first load. Departing → T1 → board filter "QF1" (not on the 6 h board) → "Enter manually" → QF1 → "Terminal T1 · Boards 22:45 → LHR" → Looks right → Home. Flight bar: "8h 44m to board · On Time, QF1 · SIN → LHR". Context `schema_version 3`, `flight_source typed`, `journey_id 744b9a86-92ad-4283-aff8-0283f3b8603d`. `/vibe/refuel`: "7 spots across all terminals" |
| No browser request touches a locked table | PASS | `performance.getEntriesByType('resource')`: 18 `supabase.co` requests on Home, REST `collections` plus storage images. On `/vibe/refuel`, REST `amenity_detail`. 0 requests to any of the 5 tables. `/api/events`, `/api/journey`, `/api/flights/board` and `/api/flight-status` all 200 |
| Console | PASS | 0 errors. Only the known service-worker preload-mismatch warnings |
| Browser rows | PASS | journeys `744b9a86…`: `typed`, `production`, `is_test=true`. events 182–191 (10): `session_start`, `flight_not_found`, `recommendation_impression`, all `production`, `is_test=true`, one anon id. 8 carry the `journey_id` |
| No row written here has `is_test=false` | PASS | Since the gate write (2 Oct 19:39 UTC): 0 non-test journeys, 0 non-test events (id > 172), 0 non-test agent_interactions |

## Test rows from this run (all `is_test = true`, `env = 'production'`)

| Table | Ids |
|---|---|
| journeys | `c5c2e12d-df4d-4611-acb9-28e46c3d767e` (gate, curl, `acquisition_src smoke-cc2b-gate`), `917bea0b-fb1d-437c-a44b-26c12cb6fdc0` (post-apply, curl, `smoke-cc2b-post`), `744b9a86-92ad-4283-aff8-0283f3b8603d` (browser) |
| events | 182–191 (browser, anon `906fd64b-466c-4aad-a897-2e39a2ba6467`). A hand-built `POST /api/events` without `surface` was rejected by validation and wrote 0 rows |
| agent_interactions | none |
| Anon REST probes | 0 rows (every probe was denied) |

## Findings

1. **The `saveJourney` edge function is still deployed and builds an anon-key client that inserts into journeys.** ACTIVE v9, last updated 2025-05-07, `verify_jwt true`. The deployed source (`get_edge_function`) matches `supabase/functions/saveJourney/index.ts`.
   - It doesn't read journeys: `.insert()` without `.select()` sends `return=minimal`.
   - It never reaches the insert: it calls `supabase.auth.api.getUser`, a supabase-js v1 API that's undefined in the v2 client it imports, and throws first.
   - Nothing calls it. Its 3 callers (`JourneyInputScreen.tsx`, `comfort-journey.tsx`, `simplified-explore.tsx`) aren't reachable on either tree. The only `functions/v1` string in the built JS is supabase-js's own `functionsUrl`. The logs show 0 function invocations in the 24 h window (1,335 edge requests).

   After this migration its insert would get 42501 anyway. It's dead surface: delete it in a separate step.
2. `log-emotion` is deployed: ACTIVE v4, 2025-07-25, `verify_jwt true`. My first pass filed it as "service role, out of scope". Todd's correction, verified on 3 Oct:
   - It inserts caller-supplied fields (`user_id`, `emotion`, `gpt_response` and more) with the **service-role key**, so RLS never applies.
   - Its target table doesn't exist: `to_regclass('public.emotion_logs')` is null, and 0 relations match `%emotion%`. Every call therefore returns 500.
   - `verify_jwt` accepts any validly signed project JWT, including the public anon key.

   The repo held only `index 2.ts` and `index 3.ts`, identical to the deployed `index.ts`. See the Follow-up section.
3. `api/mcp.ts`, `api/chat.ts` and `api/cron/sync-reviews.ts` fall back to the anon key when the service-role key is missing. None of them reads the 5 tables. Production has the service-role key (the CC-7 MCP smoke wrote agent_interactions as `production/true`).

## Rollback

Use this only if a reachable caller turns up broken. It reopens anon writes on journeys, and anon read and write on amenity_interactions and user_sessions. Policies alone restore nothing once the grants are gone, so it restores both.

```sql
begin;
grant select, insert, update, delete, truncate, references, trigger
  on public.journeys, public.amenity_interactions, public.user_sessions, public.events, public.agent_interactions
  to anon, authenticated;

create policy "Allow insert for all"                 on public.journeys for insert to public with check (true);
create policy "Allow insert for all (MVP mode)"      on public.journeys for insert to public with check (true);
create policy "Allow insert for anonymous users"     on public.journeys for insert to anon   with check (true);
create policy "Allow insert for authenticated users" on public.journeys for insert to public with check (auth.uid() = user_id);
create policy "Allow select for authenticated users" on public.journeys for select to public using (auth.uid() = user_id);
create policy "own journey"                          on public.journeys for select to public using (user_id = auth.uid());
create policy "save journey"                         on public.journeys for select to public using (user_id = auth.uid());

create policy "Allow anonymous insert on amenity_interactions" on public.amenity_interactions for insert to public with check (true);
create policy "Allow read on amenity_interactions"             on public.amenity_interactions for select to public using (true);
create policy "anon insert amenity_interactions"               on public.amenity_interactions for insert to anon   with check (true);
create policy "anon read amenity_interactions"                 on public.amenity_interactions for select to anon   using (true);
create policy "Allow anonymous insert on user_sessions"        on public.user_sessions for insert to public with check (true);
create policy "Allow read on user_sessions"                    on public.user_sessions for select to public using (true);
create policy "anon insert user_sessions"                      on public.user_sessions for insert to anon   with check (true);
create policy "anon read user_sessions"                        on public.user_sessions for select to anon   using (true);
commit;
```

After a rollback, check that `role_table_grants` shows 70 rows and `pg_policies` shows 15 on the 3 tables, matching the Before section.

Code rollback: `40ec948` (`dpl_DwvtuGCp6nzDwbwD8jVNk22dka4a`) has no reachable caller on these tables (gate above), so a code rollback stays safe against the new grants. `dfd494e` has none either.

## Ship

Commit: the migration, this report and `tasks/lessons.md`. `CLAUDE.local.md` stays local.

Secret scan of the staged diff:
- No gitleaks or trufflehog installed, so it was a pattern grep for JWT, Supabase secret and publishable key, Anthropic key, Stripe, AWS, GitHub and Slack token shapes, PEM headers, and `KEY|SECRET|TOKEN|PASSWORD=` assignments: 0 hits.
- A literal match of every `.env.local` value of 20+ characters against the diff: 0 hits.
- No `CLAUDE.local.md`, `Claude outputs/`, `.pem` or `.env*` path staged.

| Step | Result |
|---|---|
| Push | `7590fe6..a92b1e3 main -> main` at 06:04:23 UTC |
| Production deployment | `dpl_BJfmqu29NiTdj3tNcYUiiKKp9vPh`, sha `a92b1e354497eed821d07914e9f3ec457c3f5b07`, created 06:04:27, **READY 06:04:58 UTC**, sin1. `get_deployment terminalplus.app` resolves to it |
| Tagged `POST /api/journey` on the new deployment | 06:05:14 UTC → **200** `cf4249e7-76c5-4dab-89d7-201a7db46b5d`: `typed`, `env='production'`, **`is_test=true`** (`acquisition_src smoke-cc2b-deploy`) |
| Final sweep, 06:05:24 UTC | 0 non-test rows in journeys, events and agent_interactions (all time). 0 client grant rows on the 5 tables. 0 policies on journeys, amenity_interactions, user_sessions and events |

Post-deploy test row: journeys `cf4249e7-76c5-4dab-89d7-201a7db46b5d`. This section was added after the push, in a docs-only commit that goes out with the next push.

## Follow-up (Todd, 3 Oct)

| Item | Result | Evidence |
|---|---|---|
| Migrations dir holds only the renamed file | PASS | `ls supabase/migrations`: `20261003055908_rls_lockdown_part_b.sql` is the only 20261003 file. `20261003055810` was the pre-rename name (`mv` at apply time). It was never committed: `git log --all` on that path is empty |
| Edge function sources saved outside the repo | DONE | `~/terminal-plus-archive/edge-functions-2026-10-03/`: both deployed `index.ts` and `deno.json`, exactly as `get_edge_function` returned them, plus a README with ids, versions and dates. `cmp` against the repo copies: identical |
| Delete `saveJourney` and `log-emotion` from the project | Todd, in the dashboard | Not done from here. The Supabase MCP has no delete for edge functions, and the CLI isn't authenticated in the agent sandbox (it hung outside it). Todd chose the dashboard. No `supabase link` was run |
| Function list is empty | Checked after Todd's deletion | Recorded with `list_edge_functions` once Todd confirms. The result goes out with the next push |
| Repo copies removed | DONE | `git rm -r supabase/functions/saveJourney supabase/functions/log-emotion` (6 files; both `.npmrc` were comments only). The stale `[functions.saveJourney]` block is removed from `supabase/config.toml`. `supabase/functions/hello-test/` stays: it isn't deployed and was out of scope |
| CLAUDE.md standing rules | DONE | Added under "DB changes": the default-ACL rule and "caller gates cover api/, scripts/ and deployed edge functions" |
| Lessons | DONE | Secret scan gates only through `&&`. The edge-function lesson now records the `log-emotion` correction |

Stale docs that still describe `saveJourney` as live (`MVP-STATUS.md`, `terminalplus.mcp.md`) are left for CC-9.
