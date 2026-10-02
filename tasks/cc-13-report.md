# CC-13 Journey trail: report

**Status: BLOCKED at G1.** No code, migration or DB write was made. No smoke rows exist.

Run date: 2026-10-01. Branch: `release/2026-09` at `e0b9e60`, clean.

## Gates

### G1 CC-7 applied: FAIL

Query, Supabase `bpbyhdjdezynyiclqezy`:

```sql
select table_name, ordinal_position, column_name, data_type
from information_schema.columns
where table_schema = 'public' and table_name in ('events','journeys')
order by table_name, ordinal_position;
```

| Required | Found |
|---|---|
| `events.journey_id` | absent |
| `events.env` | absent |
| `events.is_test` | absent |
| `journeys.inbound_arrival_utc` | absent |
| `journeys.connection_minutes` | absent |
| `journeys.created_at` timestamptz | `timestamp without time zone` |

`events` has 13 columns: id, occurred_at, anon_id, session_id, surface, event_type, terminal_code, vibe, amenity_slug, position, minutes_to_boarding, route_id, payload.

`journeys` has 22 columns, none of them the CC-7 columns.

`list_migrations`: the latest applied migration is `20260926085601_rls_lockdown_part_a`. No CC-7 migration exists in the DB or in `supabase/migrations/`.

### G2 EVENT_TYPES match: PASS

`src/lib/telemetry.ts:15-27` and `api/events.ts:42-54` hold the same 11 entries in the same order:

session_start, vibe_selected, recommendation_impression, amenity_tapped, amenity_detail_dwell, route_started, stop_completed, stop_skipped, search_performed, tool_called, flight_not_found.

A `diff` of the two lists was empty.

### G3 path discovery: NOT RUN

This gate was halted after G1. One item was checked because it cost a single query:

- `events.event_type` is `text` with no CHECK constraint and no enum.
- The only CHECK on `events` is `events_surface_check`, which allows `surface` in ('app', 'chat', 'mcp').

## Second blocker: the 25 Aug plan is missing

The prompt depends on these sections of the "25 Aug plan":
- §1.2, §1.4 and §1.5 (UX)
- §2 (eligibility constants)
- §3 (the 6 G3 items)
- §5 (AC-1 to AC-13)

No copy was found in `tasks/`, the local planning docs, or the usual document folders. Both filename and content searches came up empty. The plan needs to be supplied before CC-13 can be specified.

## Other observations

- `git fetch` failed with an SSL connection timeout, so `origin/main` couldn't be re-verified. The cached ref is `dfd494e`.
- CI runs `npx tsx --test tests/*.test.ts` (`.github/workflows/deploy.yml:23`), so new `tests/*.test.ts` files will be picked up.

## Unblock path

1. CC-1 to production: preview SMOKE, then fast-forward `main`, then prod SMOKE.
2. CC-7: apply the telemetry migration and make the route changes, then re-run G1.
3. Re-run CC-13 with the 25 Aug plan supplied.

## Smoke row ids

None. Nothing was written.
