# CC-23 report: the board picker list scrolls on iPhone

**Status: preview ready, real-iPhone check BLOCKED (Todd).** Not pushed to main.

- Branch `cc-23/board-scroll`, code `7a041cb` (2 files, +74 −7).
- Preview `dpl_3HCYGAiNaYz3rHmCPz3KyDZTfop5`, branch alias
  `terminal-plus-frontend-git-cc-23-b20211-todds-projects-d0181971.vercel.app`, bundle `index-BTuwYXLM.js`.
- Production unchanged: `f6f0b2a` (`dpl_9GVEgRDd65rRDjAwp7aA7zatBWj8`).

## Gates

| Gate | Result | Evidence |
|---|---|---|
| G1 own worktree, prod == origin/main | PASS | `~/tp-cc-23` from `f6f0b2a`; production `dpl_9GVEgRDd65rRDjAwp7aA7zatBWj8` = `f6f0b2a` (app code identical to `962e384`, Todd's test build) |
| G2 layers from the list up | PASS | Table below |
| G3 reproduce in Playwright WebKit | PASS (reproduced) | Below. The first install attempt was declined (connection lost); retried on Todd's go |

### G2

Measured at 375×664 on `dpl_xz6ShhM6Ui2jeHhvehUqTnkoaiHh` (same app code as production).

| Layer | file:line | Position | Height | Overflow | Flex min-height | Measured |
|---|---|---|---|---|---|---|
| Board list | `FlightPicker.tsx:258` | static | `maxHeight: 320` | `overflowY: auto` | n/a | y 612–932 |
| Picker wrapper | `FlightPicker.tsx:121` | static | none | visible | n/a | 752 px |
| Step 2 wrapper | `FlightContextCapture.tsx:533` | static | none | visible | n/a | 972 px |
| Card `S.card` | `FlightContextCapture.tsx:90` | static | none | **hidden** | auto (0, because of the overflow) | **558 px, clipping 972 px** |
| Overlay `S.screen` | `FlightContextCapture.tsx:77` | **fixed, inset 0** | layout viewport | visible (not a scroller) | n/a | `justify-content: center` |
| `#root`, body, html | `index.html`, `index.css` | static | 0 | visible | n/a | document 664/664 |

No layer sets `touch-action` or `overscroll-behavior`. No body/html scroll lock. No touchmove or
wheel handler calls `preventDefault` in reachable code (only `ChatPanel.tsx:75`, an Enter key, and
`chunkReload.ts:63`).

### G3

Playwright 1.48.2 in the scratchpad. `playwright install webkit` hangs in its own extractor on this
Mac (macOS 27, Node 26), in or out of the sandbox. The official build
(`webkit-mac-15-arm64.zip`, rev 2083, 62 MB) was fetched with curl and unpacked into the Playwright
cache; it launches as WebKit 18.0.

Mobile WebKit in Playwright has no wheel or touch-drag (tap only). Scrolling was driven by wheel in a
WebKit context at 375×664 with `hasTouch` and the iPhone 13 UA. The iPhone 13 profile run gave the
same geometry.

| Check, filter "SQ" (67 rows), before the fix | Result |
|---|---|
| What a finger could scroll | Only the list (320 px, 5,226 px of rows). Card: hidden, 556 of 971 px. Overlay and document: not scrollable |
| How much of the list shows | 31 px (y 610–640), under the card's clip |
| Wheel over that strip | List scrolls to its end (4906) |
| Last row SQ402 after that | y 852–922, below the card clip (640) and the screen (664): cannot be tapped |

**Cause.** `S.card` is a shrinkable flex item with `overflow: hidden` in a fixed, centred overlay. It
shrinks to the screen and clips the board. Nothing on the screen scrolls by touch, so rows below the
card's edge can't be reached. The iOS keyboard shrinks only the visual viewport, so the fixed overlay
keeps its full height behind the keyboard and the visible part shrinks further.

## Fix

Overlay-scroll (Todd, 14 Oct), plus the filter pin he asked for.

| File | Change |
|---|---|
| `src/pages/FlightContextCapture.tsx` | `S.screen`: `overflowY: auto`, `overscrollBehavior: contain`, `justify-content: flex-start`. The logo's `marginTop: auto` and the card's `marginBottom: auto` centre content that fits. `useVisibleArea()` sets the overlay's `top`/`height` from `window.visualViewport` (resize + scroll), so it ends at the keyboard. `S.card`: `flexShrink: 0` |
| `src/components/FlightPicker.tsx` | The list is no longer a scroll container (no `maxHeight`/`overflowY`). On filter focus and on each change, `afterViewportSettles` waits for visual-viewport resizes to stop (150 ms quiet, 350 ms if none), then `scrollIntoView({block: 'start'})` on the filter wrapper (`scrollMarginTop: 12`). No sticky positioning |

No new library. `api/mcp.ts` untouched.

Types: `tsc -p tsconfig.json` is blind here, so a config rooted at `src/main.tsx` was used: 31 errors
before and 31 after. The two in the touched files are pre-existing unused imports. `npm run build` OK.

## Acceptance (preview `dpl_3HCYGAiNaYz3rHmCPz3KyDZTfop5`, `tp_test` on)

### WebKit

| Check | 375×664 | 375×340 (keyboard height) |
|---|---|---|
| Filter focused: filter at top of visible area | PASS, y=12 | PASS, y=12 |
| Rows fully visible below it (≥ 4) | **PASS, 7** | **3 full + part of a 4th** (row pitch 78 px) |
| iPhone 13 profile, tap focus | PASS, y=12, 7 rows | n/a |
| "SQ", scroll to last row (TR568) | PASS, row at y=445, tappable | PASS, row at y=121 |
| Scroll back up: filter reachable, edit to "SQ3" | PASS (13 rows, filter re-pinned at y=12) | PASS |
| Pick the last row | PASS, journey `TR568`, `flight_source=picker` | PASS |

The 340 px height is a simulation: a desktop context shrinks the layout viewport too. Only a real
iPhone shows the true keyboard geometry.

Other capture steps, iPhone 13 profile (taps):

| Step | 375×664 | 375×812 |
|---|---|---|
| What brings you (Departing, Connecting, Just landed, Skip) | fits, centred (screenshot) | fits, centred |
| Terminal pick (T1–T4, Jewel, "I'm at") | fits, overlay scroll 0, 8/8 buttons in view | same |
| Board: Scan boarding pass | note shown | note shown |
| Manual entry | fits, scroll 0 | fits, scroll 0 |
| Looks right | fits, scroll 0; tap → step 3 → Home, journey `SQ231` | same |

### Chrome (built-in browser, 375×664, branch alias)

Focus: filter at y=12, 7 rows below. "SQ": 67 rows; wheel to the end, TR568 in view; back up, filter
at y=549, edited to "SQ3" (13 rows, re-pinned at y=12), back to "SQ". TR568 tapped → Home, flight bar
"5h 15m to board · TR568 · SIN → CRK · D35 T1", `flight_source=picker`. **PASS.**

### SMOKE 13/13 (Chrome 375×812, browser TZ Asia/Jerusalem)

| # | Line | Result | Evidence |
|---|---|---|---|
| 1 | Gate shows | PASS | Fresh storage: "What brings you to Changi?", 3 options, Skip |
| 2 | Skip works | PASS | Home ("Add your flight for personalised recommendations"); journeys `65f952de…` skipped |
| 3 | Typed QF1 | PASS | T1 → Enter manually → QF1 → "Terminal T1 · Gate D46 · Boards 22:45 → LHR" → Looks right. Bar "1h 32m to board · QF1 · SIN → LHR"; `flight_source=typed`, `schema_version` 4 |
| 4 | Board picker | PASS | TR568 picked from the board (see Chrome acceptance) |
| 5 | Home | PASS | 7 vibe rows (Explore, Shop, Refuel, Chill, Quick, Work, Comfort); 31 images, 28 loaded, 0 broken, 3 pending `loading=lazy` off screen; 32 "N spots" |
| 6 | `/vibe/refuel` | PASS | "7 spots across all terminals" |
| 7 | Collection, amenity, search | PASS | `coffee-worth-walk` "7 of 7 spots"; `grain-traders-jewel` renders, Open; "laksa" → Kopitiam (T1) |
| 8 | Change flight → Keep | PASS | "Change flight" heading; "Keep TR568" once (below the full board, reachable now); `capturedAt` unchanged |
| 9 | Hours follow SGT | PASS | Local 16:10 (UTC+3), SGT 21:10; Home "Evening picks" (local would be "Afternoon") |
| 10 | Chat | PASS | `POST /api/chat` 200; Bacha Coffee, Starbucks cards; reply cites TR568 |
| 11 | MCP | PASS | `initialize` 2025-03-26 `terminal-plus`; `tools/list` 4; `get_recommendations` refuel/SIN-T1 → 7 (`mcp-session-id: smoke-cc23-20261014`) |
| 12 | SQL events | PASS | Last 15 min: session_start 2, recommendation_impression 25, capture_opened 4, search_performed, amenity_detail_dwell, flight_not_found |
| 13 | SQL typed journey | PASS | `30bc1ff7-5d79-4068-ac36-ca793acb6640`: QF1, typed, departing, LHR, `device_timezone` Asia/Jerusalem |

### Real iPhone: BLOCKED (Todd)

On the branch alias, keyboard open and closed:
- the list scrolls;
- the filter pins to the top on focus;
- the last flight can be picked.

## Test rows

All `env=preview`, `is_test=true`, `is_bot=false`. 0 with `is_test=false` from this work.

| Table | Ids |
|---|---|
| events | 1474–1516 (43) |
| journeys | 11 rows, 13:05:59–13:12:45 UTC: TR568/picker ×3, SQ231/typed ×6, skipped `65f952de-4263-4c36-b6de-6fd0dad71b40`, QF1/typed `30bc1ff7-5d79-4068-ac36-ca793acb6640` |

Not this work: events 1455–1473 and 2 journeys (TR266, UA2, both picker) are production, non-test,
10:19–10:21 UTC, before CC-23 began. Most likely Todd's real-iPhone session on production.

## Observations

- Chat at T3 for a T1 flight suggests T3 coffee and asks the passenger to confirm the terminal. Not
  related to this change.
- The departures board lists flights up to 03:00 when SGT is 21:10 ("next 6 hours").
