# CC-23b report: "Enter manually" always in reach on the board picker

**Status: preview PASS, SMOKE 13/13, real iPhone PASS (Todd, 15 Oct, all 4 checks). Shipping to main.**

- Branch `cc-23b/manual-entry` off main `55a336a`.
- Commits:
  - `a62e569`: CC-24 production checks, cherry-picked from `4c9e0ec`.
  - `55d8cf7`: the change.
- Preview `dpl_FtxfJgtNxvXsB4y8CCE3Ao3NRCFb`, alias
  `terminal-plus-frontend-git-cc-23-137951-todds-projects-d0181971.vercel.app`, bundle `index-BQSpiOag.js`.

## Gates

| Gate | Result | Evidence |
|---|---|---|
| G1 own worktree, prod == origin/main | PASS | `~/tp-cc-23b` from `55a336a`; production `dpl_HJ7EYkVrWCw5xXf5TbHFqBvstqKv` = `55a336a` = origin/main |
| G2 element list, components | PASS | Below |

### G2: the board step on production (`55a336a`), Chrome, rendered y (top–bottom)

| Element | 664 | 664 focused | 812 | 812 focused |
|---|---|---|---|---|
| Logo TERMINAL+ | 24–47 | off | 24–47 | off |
| STEP 2 OF 2 | 112–128 | off | 112–128 | off |
| "What's your departing flight?" | 136–208 | off | 136–208 | off |
| Step subtitle | 214–256 | off | 214–256 | off |
| "Which flight are you on?" | 308–380 | off | 308–380 | off (−60–12) |
| Picker subtitle | 386–428 | off | 386–428 | 18–60 |
| Scan boarding pass | 446–501 | off | 446–501 | 78–132 |
| OR PICK FROM THE BOARD | 519–535 | 2–19 | 519–535 | 150–167 |
| Filter | 549–600 | 33–83 | 549–600 | 181–231 |
| List box | 612–1032 (off) | 95–515 | 612–1032 (off) | 243–663 |
| **Enter manually** | **1046–1072 (off)** | 529–555 | **1046–1072 (off)** | 677–703 |
| Skip / Keep … | 1082–1108 (off) | 565–591 | 1082–1108 (off) | 713–739 |

- "Enter manually": a `<div>` in `FlightPicker`, `src/components/FlightPicker.tsx:395–410`
  (`onClick={handleManual}`, `:147`).
- "Keep …": `FlightPicker.tsx:412–425` (`{skipLabel}`). The text comes from
  `FlightContextCapture.tsx:467–468` (`keepLabel`) and is passed in at `:581`.

## Changes

| File | Change |
|---|---|
| `src/components/FlightPicker.tsx` | "Can't find it? Enter manually" is a `<button>`, directly under the filter, inside the block that pins to the top on focus. With no board (load error or empty), it sits under the divider and there is no filter. The old link under the list is gone. 0 matches: `No flights match "<text>".` plus an "Enter manually" button. The list box drops `overscroll-behavior: contain`; its max height is `min(420px, visible − 122px)` (122 = 12 + filter 51 + button 35 + 12 + 12). `flight_not_found` sends only `{ from }` |
| `api/events.ts` | `flight_not_found` keeps only `from`, and only `under_filter`, `empty_state` or `board_unavailable`; anything else becomes `{}`. Same pattern as `capture_opened` and CC-16's `session_start` |

`from` values:
- `under_filter`: the board is loaded.
- `board_unavailable`: loading, or loaded with an error or no flights.
- `empty_state`: the 0-matches button.

No new event type, no event-type list change, no migration. `api/mcp.ts` untouched.

How a flight was captured off the board is already in `journeys.flight_source`:
- `picker` / `picker_ungrouped` = board pick;
- `typed` = manual entry.

On the departures step and the arrivals step, typed entry can only be reached through `onManual`
(`FlightContextCapture.tsx:359`, `:579`).

Types: `api/` 0 errors (main 0). The frontend type-check scoped to reachable files: 31 errors, the same
count as main; the `FlightPicker.tsx` one is the old unused `React` import. `npm run build` exits 0.

## Acceptance (preview)

**"Enter manually" fully visible without scrolling:**

| Engine, size | Not focused | Focused |
|---|---|---|
| Chrome 664 | 608–638 in view | 93–123 in view (filter 35–85, list 135–555) |
| Chrome 812 | 608–638 in view | 241–271 in view (list 283–703) |
| Chrome 340 (keyboard-height stand-in) | n/a | 71–101 in view; list box shrinks to 218 px (113–331) |
| WebKit iPhone 13, 664 | 606–636 in view | 93–123 in view |
| WebKit iPhone 13, 812 | 606–636 in view | 241–271 in view |

WebKit and the 340 px run are geometry only (lesson, 15 Oct). The phone decides.

**Swipes carry on to the page:** Chrome 812, "SQ", overlay at 0, list at its end (5546/5546). One wheel
over the list moved the overlay 0 → 367 (its maximum). Under CC-23's `contain`, the same move only
scrolled the list. In SMOKE line 8, wheeling only over the list ran it to its end (9864/9864), then the
page to its end (306/306), and "Keep QF1" came into view.

**Empty state:** "ZZZ" shows `No flights match "ZZZ".` and an "Enter manually" button (in view). Tapping
it opens manual entry with the flight field focused. Event 1587 `{"from":"empty_state"}`.

**Board unavailable:** with `/api/flights/board` forced to 503 by a test-only fetch override in the
page, there is no filter. The button sits right under the divider (555–585, divider ends at 541),
above the "live board isn't available" message. Tapping it opens manual entry. Event 1589
`{"from":"board_unavailable"}`.

**Server allowlist** (direct POST, `x-tp-test: 1`, session `c3042ce2…`):
- `{from:'hack', extra:'x'}` stored `{}` (event 1583);
- `{from:'empty_state', direction, board_size:99}` stored `{"from":"empty_state"}` (event 1584).

Both `is_test`.

**`on_board` (addition 3):** no event fires after a successful typed lookup. The only `track()` calls in
capture are `flight_not_found` and `capture_opened`. Logged as a follow-up below.

## SMOKE 13/13

Preview, Chrome 375×812, `?tp_test=1`, session `3f368c00…`, TZ Asia/Jerusalem.

| # | Result | Evidence |
|---|---|---|
| 1 | PASS | Gate shows |
| 2 | PASS | Skip → Home |
| 3 | PASS | T1 → **Enter manually (under the filter)** → QF1 → Looks right; bar "6h 1m to board · QF1 · SIN → LHR"; `typed`, v4; journey `22a00b5c…`; event `flight_not_found {from: under_filter}` |
| 4 | PASS | Change flight → "SQ" (76 rows) → list to its end → SQ468 tapped → bar "SQ468 · SIN → CMB", `picker`; journey `2c6dff53…` |
| 5 | PASS | 7 vibe rows; 31 images, 0 broken; 32 counts |
| 6 | PASS | `/vibe/refuel` "7 spots across all terminals" |
| 7 | PASS | Collection "7 of 7 spots"; amenity "Grain Traders / Open"; search "laksa" → Kopitiam (T1) |
| 8 | PASS | Change flight → "Keep QF1" once, reached by wheeling over the list only → `capturedAt` unchanged |
| 9 | PASS | Local 11 (UTC+3), SGT 16; Home "Afternoon picks" |
| 10 | PASS | `POST /api/chat` 200; reply uses the passenger's terminal and time ("You're in T1 with plenty of time"): Toast Box, Starbucks |
| 11 | PASS | MCP `initialize` 2025-03-26; `tools/list` 4; `get_recommendations` → 7 (`smoke-cc23b-20261015`) |
| 12 | PASS | session_start, recommendation_impression, capture_opened, search_performed, flight_not_found in this run |
| 13 | PASS | Journey `22a00b5c…`: QF1, typed |

## Test rows

All preview, all `is_test=true`. 0 rows with `is_test=false` since 08:38 UTC.

| Table | Ids |
|---|---|
| events | 1583–1605 (23): direct POSTs 1583–1584; acceptance sessions `bffe953c…` (1585–1589); WebKit `8af41f79…`, `eddd5698…`; SMOKE `3f368c00…` |
| journeys | skipped, QF1/typed `22a00b5c…`, SQ468/picker `2c6dff53…` |
| agent_interactions | 1 conversational, 1 mcp |

## Report SQL: board pick vs manual, split by `from`

Taps are matched to journeys by `session_id` first, then by time: each journey takes the last tap in
its session between that session's previous and next journey. A
later board pick doesn't inherit an earlier tap, and a tap whose batched event lands a few seconds after
its journey still counts: `occurred_at` is the server's insert time (`api/events.ts:224`). Session
`e0188b12` had the tap at 13:07:20 and the journey at 13:07:17.

```sql
with j as (                       -- each journey, with its session's previous and next journey times
  select id, session_id, flight_source, journey_type, created_at,
         lag(created_at)  over (partition by session_id order by created_at) as prev_at,
         lead(created_at) over (partition by session_id order by created_at) as next_at
  from journeys
  where not is_test and not is_bot and env = 'production'
),
taps as (                         -- every manual tap, keyed by session
  select session_id, occurred_at, coalesce(payload->>'from', '(before CC-23b)') as manual_from
  from events
  where event_type = 'flight_not_found' and not is_test and not is_bot and env = 'production'
),
matched as (                      -- 1) same session_id, 2) tap between the previous and the next journey
  select distinct on (j.id) j.id, t.manual_from     --    (occurred_at is server insert time; events are batched)
  from j join taps t on t.session_id = j.session_id
  where t.occurred_at > coalesce(j.prev_at, '-infinity')
    and t.occurred_at <= coalesce(j.next_at, 'infinity')
  order by j.id, t.occurred_at desc
)
select case when j.flight_source in ('picker', 'picker_ungrouped') then 'board pick'
            when j.flight_source = 'typed' then 'manual from the board'
            else j.flight_source end as route,
       coalesce(m.manual_from, '(no manual tap)') as manual_from,
       count(*) as journeys
from j left join matched m on m.id = j.id
where j.journey_type <> 'skipped'
group by 1, 2
order by 3 desc;
```

Proved on test rows since 14 Oct (`is_test`, preview and production):
- board pick / (no manual tap): 12;
- manual from the board / `(before CC-23b)`: 7;
- manual from the board / `under_filter`: 1;
- manual from the board / (no manual tap): 5.

The last 5 are 14 Oct WebKit runs that closed the browser before the event queue flushed, so the tap
event never arrived. A real tab sends the queue at unload with sendBeacon.

Two earlier versions were wrong:
- a session-level join credited a later board pick with an earlier tap;
- "tap at or before the journey" missed batched taps.

`flight_not_found` rows written before this ship carry the old payload (`direction`, `filter_length`,
`board_size`) and no `from`. The query labels them `(before CC-23b)`, so they never pass for "no manual
tap".

## Follow-ups

- **Events lost when the app closes right after capture (Todd, 15 Oct):** the 5 typed journeys with no
  tap event lost theirs because the browser closed before the batch was sent. Check that the
  telemetry flush on `visibilitychange` → hidden and on `pagehide` runs on iOS Safari (tab closed,
  app switched, home-screen app swiped away), so a passenger who closes the app straight after
  capture doesn't lose events. Needs a real-iPhone check: Playwright can't stand in for it.

- **`on_board` (Todd's addition 3):** no event fires after a successful typed lookup, so there's nowhere
  to put `on_board` without a new event type. Candidate: a `flight_confirmed` event, or a field on
  the journey row, carrying `on_board` (was that flight number in the loaded board). Needs a plan.

## Real iPhone: PASS (Todd, 15 Oct, all 4 checks)

On the preview alias, keyboard open and closed:
- "Enter manually" is visible under the filter without scrolling;
- a swipe at the end of the list carries on to the page;
- "ZZZ" shows the empty state, and its button opens manual entry.

No push to main before this.

## Round 2 (15 Oct, before the iPhone check)

**1. Allowlist on the redeployed preview** (`fabd68d`, bundle `index-DYg80EiL.js`). Direct POST with
`x-tp-test: 1`, payload `{"from":"hack","extra":"x"}`, response `{"inserted":1,"rejected":[]}`. Stored
row:

| id | event_type | payload | is_test | env | occurred_at |
|---|---|---|---|---|---|
| 1606 | flight_not_found | `{}` | true | preview | 2026-10-15 08:52:58.574+00 |

**2. Board unavailable: message first** (`fabd68d`). Forced 503 (test-only fetch override in the page),
Chrome 375×812:
- no filter;
- message at y 557–655, then the button at 663–693, in view;
- tapping it opens manual entry; event 1609 `{"from":"board_unavailable"}`.

Rows: session `b572a570…`, events 1607–1609, `is_test`.

**3. Report SQL rewritten** (above): join on `session_id`, then the time window from `lag`/`lead` over
that session's journeys. Re-proved on the test rows since 14 Oct (`is_test`, preview + production):
- board pick / (no manual tap): 12;
- manual from the board / `(before CC-23b)`: 7;
- manual from the board / (no manual tap): 5;
- manual from the board / `under_filter`: 1.

These are the same counts as the earlier version.

0 rows with `is_test=false` from this round.
