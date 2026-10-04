# Lessons

Running notes on things that were assumed wrong, so they aren't re-assumed.

---

## 2026-08-24 — The `events` anon-insert gate was mis-specified

**Assumed:** `events` needed an anon INSERT policy ("Phase E2") for the browser to
write telemetry, and the gate was to prove it with a live anon insert.

**Actual:** `events` has RLS enabled with **zero policies**, and always has —
`supabase/migrations/20260705095346_create_events_table.sql` contains no
`create policy` and no `grant`. There was never a Phase E2 policy.

```
$ grep -rn "SERVICE_ROLE" src/          -> no matches (browser bundle clean)
$ grep -rn "supabase.from('events')" src/ api/
api/events.ts:195:  const { error } = await supabase.from('events').insert(rows)
```

The browser POSTs to `/api/events`, which holds `SUPABASE_SERVICE_ROLE_KEY`
server-side. Anon insert policies are unnecessary, and adding one would be
actively harmful: `api/events.ts` is the validation layer (event_type allowlist,
UUID checks, terminal allowlist, 8KB payload cap, 50-per-batch). An anon policy
lets anyone bypass all of it and write straight to PostgREST.

**Rule going forward:** telemetry-shaped tables stay service-role only, written
through a serverless route that validates. `api/journey.ts` was built the same
way for the same reason — two related tables on two different trust paths is a
refactor that gets more expensive every week.

---

## 2026-08-24 — AeroDataBox `withLeg` is a trap

**Assumed:** the FIDS board needs `withLeg=true` to get both ends of the
corridor (origin and destination).

**Actual:** the opposite. Per the api.market OpenAPI spec, the default
`movement` object already carries both:

> "Flight information relevant applicable to current airport... **Airport
> sub-property, however, stands for the 'opposite' airport in the route**:
> airport of destination for departing flight or origin for arriving flight."

`withLeg=true` *replaces* `movement` with `departure`/`arrival` and then omits
the airport sub-property when it equals the requested airport — strictly worse
for corridor capture. Leave it off.

Same spec run also caught three nullability traps that a naive mapping walks
straight into: `scheduledTime` is **not** in the contract's `required` list,
`airport.iata` is nullable, and an empty board returns **204 No Content**, where
`response.json()` throws.

**Rule going forward:** pull the OpenAPI spec before mapping a third-party
response. It is one curl, and it settled in minutes what two rounds of docs
searching could not.

---

## 2026-08-24 — There is no codeshare -> operating-flight key

**Assumed:** something in the response joins a codeshare row (LH9756) to the
flight that actually operates it (SQ322).

**Actual:** nothing does. `AirportFlightContract` carries only
movement/departure/arrival, number, callSign, status, codeshareStatus, isCargo,
aircraft, airline, location. No `operatedBy`, no `operatingFlightNumber`.

- `codeshareStatus` labels a row but does not point anywhere, and its `Unknown`
  case ships with an explicit "false results are possible" warning.
- `aircraft.reg` is nullable and usually unassigned 6h out.
- `scheduledTime.utc` is not a key alone.
- `callSign` is the one field that would be exact — an ATC callsign belongs to
  the operating aircraft — but it is nullable and its fill rate at SIN is
  **still unmeasured**.

Resolved with a two-strategy seam (`api/lib/flightGrouping.ts`) rather than a
hardcoded heuristic, so the exact path is a branch to delete rather than a file
to rewrite. `codeshare_group_stats` is logged on every upstream fetch to measure
the real fill rate.

**Rule going forward:** when a join key is assumed, prove it exists in the schema
before building on it. Groups with no confirmed operator are marked
`picker_ungrouped` rather than silently resolved — the `place_id` contamination
is the precedent: a confident wrong value that looks identical to a right one is
the expensive failure mode.

---

## 2026-08-24 — `npm run build` does not typecheck

`tsconfig.json` is `"include": ["src"]` and `npm run build` is bare `vite build`,
which does no type checking at all. A green build proves nothing about types, and
**nothing** in `api/` is ever checked. `api/events.ts:196` has had a real type
error sitting in it undetected for this reason.

Verify with an explicit pass over both trees:
```bash
npx tsc --noEmit -p tsconfig.json
```

---

## 2026-10-02 — A lockdown gate must cover every table the migration touches

**Assumed:** CC-2B's caller gate ("no reachable client code calls
`.from('journeys')`") was enough to make the RLS part B migration safe.

**Actual:** the migration also revokes everything on `amenity_interactions`
and `user_sessions` from anon and authenticated, and the gate never looked at
them. One grep found 9 client call sites on those tables in
`src/services/supabaseTrackingService.ts` and `src/services/supabaseDataService.ts`,
plus a direct `.from("journeys").insert` in `src/pages/plan-journey.tsx:79`.
A one-hop importer list can't settle whether they're reachable.

**Rule going forward:** derive the caller gate from the migration's own
`revoke`/`drop policy` targets, never from the headline table. Prove
reachability with a full import trace from `src/main.tsx` (esbuild metafile,
`@/` aliases resolved), and do it on both the release head and the rollback
target, because a rollback puts the old tree back against the new grants.

---

## 2026-10-02 — "The route only writes UUIDs" was a claim about clients, not code

**Assumed (CC-7 gate):** `api/journey.ts` only ever writes uuid-shaped `anon_id`
and `session_id`, so casting the columns to `uuid` is safe.

**Actual:** the route stored `str(j.session_id, 64)` and `str(j.anon_id, 64)`,
any string up to 64 chars. Every client happens to mint `crypto.randomUUID()`,
so the data was clean (0 of 28 rows failed the cast), but nothing enforced it.
After the cast, one non-UUID value would have turned an insert into a 500 and
lost the journey.

**Rule going forward:** before tightening a column type, find the server line
that enforces the new type on every write path. If there isn't one, ship the
validation first (null or reject at the boundary) and cast afterwards.
"Clients only send X" isn't a constraint.

---

## 2026-10-02 — `create or replace view` silently drops `security_invoker`

Proven on this DB inside a rolled-back transaction:

```
create view _p with (security_invoker = on) as select 1 as x;  -- reloptions {security_invoker=on}
create or replace view _p as select 1 as x;                    -- reloptions NULL
```

A replace without a `WITH` clause resets the view's options, so it quietly
goes back to running with owner rights and bypassing base-table RLS.

**Rule going forward:** when changing an `analytics_*` (or any
security_invoker) view, either `drop` + `create … with (security_invoker = on)`
or repeat the `WITH` on the replace, then check `pg_class.reloptions` and
`has_table_privilege('anon', …)` after applying.

---

## 2026-10-03 — `pg_default_acl` opens every new object in `public` to the client roles

Proven on this DB (`pg_default_acl`, `aclexplode`), for objects created by both
`postgres` and `supabase_admin` in schema `public`:

```
tables+views  anon, authenticated: SELECT INSERT UPDATE DELETE TRUNCATE REFERENCES TRIGGER
functions     anon, authenticated: EXECUTE
sequences     anon, authenticated: SELECT UPDATE USAGE
```

A new table is fully writable by anyone holding the public anon key until RLS is
enabled, and a new function is callable through `/rest/v1/rpc` the moment it exists.

**Rule going forward:** every migration that creates a table, view or function
enables RLS (tables), sets `security_invoker = on` (views), and revokes from anon
and authenticated whatever they don't need, in the same migration. Check with
`has_table_privilege` / `has_function_privilege` after applying.

---

## 2026-10-03 — A lockdown revokes everything, and its rollback restores everything

**Assumed (CC-2B plan):** revoking the write verbs (`insert, update, delete,
truncate`) on journeys, events and agent_interactions was enough, because RLS with
no anon policy returns 0 rows on SELECT. And a rollback was "recreate the policies".

**Actual (Todd's correction):** the partial revoke left SELECT, REFERENCES and
TRIGGER granted, so one later `disable row level security` or permissive policy
would expose the rows. RLS was the only barrier on reads. And once the grants are
revoked, recreating the policies restores nothing: the role has no privilege for
a policy to filter.

**Rule going forward:** service-role-only tables get `revoke all ... from anon,
authenticated`. Before applying any lockdown, capture
`information_schema.role_table_grants` for the client roles, and write the
rollback as grants plus policies. Verify with `has_table_privilege` across all 7
table privileges, not only the ones the migration names.

---

## 2026-10-03 — Deployed edge functions are callers too

**Assumed:** the caller gate for a table lockdown is `src/` (reachable client code)
plus `api/`.

**Actual:** `list_edge_functions` showed `saveJourney` ACTIVE (v9, May 2025), with
an anon-key client inserting into journeys. The repo copy exists, but nothing in
the repo said it was deployed, and the repo needn't hold the deployed entrypoint
(`log-emotion`'s deployed `index.ts` existed only as `index 2.ts`/`index 3.ts`).
It turned out to be dead (it calls the v1 `auth.api` against the v2 client and has
0 invocations), but only reading the deployed source settled that.

Correction (Todd): I filed `log-emotion` as "service role, out of scope". It was
the worse of the two. It inserts caller-supplied fields with the service-role key,
so RLS never applies, and `verify_jwt` accepts the public anon key. It was harmless
only because its target table, `emotion_logs`, doesn't exist.

**Rule going forward:** a caller gate covers reachable client code, `api/`,
`scripts/`, and every deployed edge function (`list_edge_functions`, then
`get_edge_function` for the deployed source). Classify each function by three
things: the key it writes with, the JWT it accepts (`verify_jwt: true` still
admits the anon key), and whether its target exists. A service-role writer
reachable with the anon key is an open write path, whatever the grants say.
Check the function logs for live traffic before calling one dead.

---

## 2026-10-03 — A secret scan gates a commit only through `&&`

**Assumed:** running the scan in the same command as `git commit` made it a gate.

**Actual:** CC-2B's post-deploy commit ran `scan ; git commit`. The scan
printed `1` hit, and the `;` committed anyway. The hit turned out to be the
report's own description of the scan (the literal Supabase secret-key prefix), so nothing
leaked. But the gate was decorative: a real key would have been committed the
same way.

**Rule going forward:** chain the scan to the commit with `&&`, and make the scan
exit non-zero on a hit (`! git diff --cached | grep -qE '<patterns>'`), or check
`$?` explicitly before committing. A count printed to the terminal isn't a gate.
When a write-up has to name a secret pattern, describe it ("Supabase secret-key
prefix") rather than spelling the literal, so the scan stays quiet on docs.

---

## 2026-10-03 — One attribution column, one attribution model

**Assumed (CC-16 round 1):** `journeys.acquisition_src` could take the current
tab's utm_source and fall back to the old first-touch `tp_acquisition_src`.

**Actual (Todd's correction):** that mixed two models in one column. A tab
with no source of its own was credited to whatever link the browser saw first,
and a later link relabelled the browser. The round-1 preview showed both: QF1
and QF2 journeys from tabs with no source carried `cc16_legacy`.

**Rule going forward:** pick the model per column and write it down.
`journeys.acquisition_src` is first touch per browser: stored once in its own
versioned localStorage key (`tp_first_touch_v1`), never overwritten, and
normalised before it takes the slot, so a malformed value can't burn it. Null
when there's none, with no fallback. Each visit's own source goes on
session_start only.

---

## 2026-10-03 — A file that beats the SPA fallback on the server can still lose to the service worker

**Assumed (CC-16 gate G3):** proving with curl that Vercel serves a `public/`
file ahead of the SPA rewrite was enough for `/robots.txt` and `/sitemap.xml`.

**Actual (Todd's correction):** the PWA's generated service worker has a
`NavigationRoute` that answers every navigation with `index.html`. In a browser
with the app installed, opening `/robots.txt` booted the app and redirected to
`/`. Crawlers don't run service workers, so curl never shows it.

**Rule going forward:** any path a person might open directly (`/api/`,
`/.well-known/`, `/og/`, `/robots.txt`, `/sitemap.xml`, and any new static file)
goes in `workbox.navigateFallbackDenylist`. Workbox matches pathname + search,
so use prefix patterns, not ones anchored with `$`. Verify in a browser with the
SW installed and controlling the page, not only with curl.

---

## 2026-10-04 — Header injection doesn't tag a headless run's unload beacons

**Assumed (CC-18 headless check):** puppeteer request interception adding
`x-tp-test: 1` to every request was enough to keep a headless run's telemetry
out of the real data, with storage left empty.

**Actual:** the app sends its unload flush with `navigator.sendBeacon` when
`tp_test` isn't in storage. One beacon (event 476, `amenity_detail_dwell`) left
after the page target closed, outside the interception, so it landed
`is_test = false`. It was flagged by hand.

**Rule going forward:** in headless runs, set `localStorage.tp_test = '1'` with
`evaluateOnNewDocument` before any page script runs. Since the body-flag fix
(`fix/test-flag-in-body`), the app then puts `test: true` in the body of every
send, beacons included, and the server reads it there. Navigate to `about:blank`
and wait before closing each page. To prove an empty-storage render, run once untagged, then
check the event table and flag any untagged row at once.

---

## 2026-10-03 — A fixed primary/fallback split inside one budget kills healthy slow turns

**Assumed (CC-6 plan):** a 15 s chat budget split as 10 s for the primary model
and the rest for 1 fallback call, "re-checked against baseline p95".

**Actual:** the first baseline run on the preview (`claude-sonnet-4-5-20250929`,
current payload) returned 500 on 3 of 20 turns. All 3 were the primary hitting
the 10 s cutoff while still healthy (successful turns took up to 10.5 s
server-side), followed by a `claude-sonnet-4-6` fallback that couldn't finish in
the 5 s left. Production before CC-6 gave one call the full 15 s, so the split
would have shipped a regression that looked like resilience.

**Rule going forward:** a fallback budget triggers on a *stall* (no output by N
seconds, via streaming) or a fast failure (529, 404), never on a fixed
wall-clock slice of a model that is still streaming. Measure the latency
distribution before choosing any cutoff, and test every fallback path (slow,
stalled, overloaded, unknown model, over budget) against a local mock of the
API before trusting the one path a preview can force.

---

## 2026-10-03 — An eval that scores a 200 has to check it got the answer it asked for

**Assumed (CC-6 eval runner):** a 200 from `/api/chat` is a chat reply, so scoring
can start from the status code.

**Actual:** the first claude-sonnet-4-6 run hit the preview while it was still
rolling out. Every request came back 200 in ~0.4 s with no chat body (the SPA
shell), and the runner scored 20/20 on slug quality and 4/5 adversarial,
because an empty slug list satisfies most count and subset checks. 0 rows
were logged, which is what gave it away.

**Rule going forward:** score a turn only when the response carries its own
shape (here: the test-only `debug` block), count anything else as a failed
turn, and cross-check every run against an independent record (the logged
rows). Wait for the deployment to report READY before an eval, not for a ping.

---

## 2026-10-04 — A place the user mentions isn't where they are

**Assumed (chat pre-filter, kept through CC-6 round 2):** a terminal named in the
question ("Can I go to Jewel?", "food in T2") was the user's terminal, so it
went into the prompt as "User terminal".

**Actual (Todd's correction):** replies said "you're already at Jewel" (n10 and a2
in the 5-5 and 4-6 arms; j2 and j3 before the Jewel rule), and the client then
kept the model's extracted terminal, so the wrong location stuck for the rest
of the chat. The round-2 eval scored cards only, so it never saw it.

**Rule going forward:** location and the place asked about are separate fields.
Location comes only from the stored journey or an explicit "I'm at / I'm in";
the place asked about widens the search but never becomes the location, and the
model's extraction never sets it. The eval checks every reply for placing the
user anywhere but their known location.
