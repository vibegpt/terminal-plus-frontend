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
