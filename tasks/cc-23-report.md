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

## Round 2 (15 Oct): real iPhone FAILS; layout readout

Todd, real iPhone, preview: after filtering "SQ", about 75% of the first row shows and the other
rows sit below a hard line. The list scrolls, but the rows stay hidden. Closing the keyboard doesn't
help. Per Todd, the WebKit results above don't count as evidence for this bug (lesson, 15 Oct).

### Entry paths

All of them render the same container:
- Gate on `/`: initial state, `App.tsx:101`.
- Add-flight bar and the top-bar prompt: `onEditFlight` → `App.tsx:131`.
- Flight bar → Change flight: `App.tsx:137`.

Each sets `captureEntry`, and `App.tsx:143` renders `<FlightContextCapture>` *instead of* `AppShell`.
`FlightPicker` is rendered only there (`:345` arrivals, `:559` departures), always inside
`S.screen` (fixed overlay) → `S.card`. No path skips the fixed container.

### Readout (`581b038`)

`src/components/LayoutDebug.tsx` only shows on a `VITE_TP_DEBUG=1` build when the tab has opened
`?tp_layout=1` (kept in sessionStorage). Production builds compile it out: 0 matches in a plain
`npm run build`. It updates every 250 ms and on visual-viewport resize or scroll. It shows:
- the loaded bundle, and whether a service worker controls the page;
- `innerHeight`, and the visual viewport's height and offsetTop;
- the overlay's applied height and top, and its clientHeight, scrollHeight and scrollTop;
- the top and bottom of the card, filter and list, and the component rendering the list;
- what sits at the bottom of the visible area;
- every element in the overlay that clips or scrolls (`clip …` lines).

Hooks: `data-tp-layout` = overlay, card, filter, list.

Browser check, Chrome 375×664 (Add-flight bar path, "SQ"):

```
bundle index-Cd24p1tF.js sw:none
inner 664 vv 664 @0
ov h=664px top=0px ch=664 sh=7896 st=537
card -454–7335
filter 12–63
list 75–7210 by FlightPicker
bottom: list > span (static)
clip overlay ovY=auto maxH=none 664/7896 st=537
```

### Suspects and the readout line that settles each

| Suspect | What the readout shows if it's the cause |
|---|---|
| Stale build: the old `maxHeight: 320` list in a clipped card ("the list scrolls" matches the old code, not this one) | A bundle other than `index-Cd24p1tF.js`, or no yellow box at all (production and older builds don't have it). `clip` lines naming `list … maxH=320px` and `card ovY=hidden` |
| Height measured with the keyboard open, never reset | After the keyboard closes, `ov h` stays below `vv` height (e.g. 330 vs 664) |
| `100dvh` vs Safari's toolbar | No viewport units in the capture chain. The only `100vh` is in `AppShell` (`:441`, `:474`, `:503`), which isn't rendered while capture is open. The overlay height comes from `visualViewport`; a mismatch shows as `ov h` ≠ `vv` height |
| An ancestor still `overflow: hidden` or max-height capped | A `clip` line other than `overlay` |
| A fixed element covering the bottom | The `bottom:` line names something other than the overlay's content |

Rows from this check: events 1520–1521 (`839495bc…`), preview, `is_test`.

## Round 3 (15 Oct): the screenshots, and a list capped at about 5 rows

**Todd's iPhone screenshots (9:57)** were taken on `terminalplus.app`, which is production on
`f6f0b2a` with the old code. No readout box. The hard line is the old card's clipped bottom edge.
They show the original bug, not the preview.

**Todd's desktop Safari on the preview (10:00):** the readout shows `index-Cd24p1tF.js`, the overlay
is the only scroller, and nothing else clips. The fix holds. Todd then asked for a design change:
"5 or so entries visible", with the rest scrolling.

**`f2ba6ac`:** the list is its own scroll box again, this time inside a card that never clips.
- `maxHeight: min(420px, calc(var(--tp-visible-h) - 87px))`, `overflowY: auto`,
  `overscrollBehavior: contain`.
- The overlay sets `--tp-visible-h` from `visualViewport`.
- 87 px = filter top 12 + filter 51 + gap 12 + bottom margin 12.

Checked in Chrome on the preview (bundle `index-CKIRLKQN.js`). Regression only; the iPhone decides:
- **375×664, "SQ" (88 rows):** the list box is 420 px with 5 rows fully inside plus half of a 6th.
  "Enter manually" and Skip sit right below it, in view.
- **Wheel over the list:** it scrolls to its end (6488/6488), the last row VN656 sits inside the box,
  and the overlay doesn't move.
- **375×340:** the box shrinks to 253 px (340 − 87), so with the keyboard open it can't extend
  behind the keyboard.
- **Board API:** one browser load got the "live board isn't available" fallback. A direct call to
  the preview API a minute later returned 142 flights in 2.6 s. Production returned 142 in 2.7 s
  twice, after one curl run cut off at 30 s. Transient.

The readout's clip lines now list 2 scrollers: `overlay` and `list … maxH=420px`.

**Rows, 15 Oct:**

| Ids | Env | Tagged | Whose |
|---|---|---|---|
| 1520–1521, 1526–1528 | preview | yes | Claude, test sessions |
| 1518–1519 | production | no | 06:47 UTC; matches Todd's iPhone screenshots on terminalplus.app (9:57) |
| 1522–1525 | preview | no | 07:00 UTC; matches Todd's desktop Safari screenshot of the preview (10:00); that browser had no `tp_test` |

Real iPhone: still BLOCKED (Todd), on the preview link with `?tp_layout=1`.

## Round 4 (15 Oct): real iPhone PASS; pre-launch rows marked test

**Real iPhone on the preview: PASS (Todd, 15 Oct).** The list box shows about 5 rows and scrolls.

**Data (Todd: "all the visitors are test visitors so far").** Migration
`20261015075543_mark_prelaunch_visits_test` (applied, version `20261015075543`) set `is_test` on every
events and journeys row that was not test and not bot:
- events 775, 1010–1011, 1198–1201, 1455–1473, 1518–1519, 1522–1525, 1529–1532 (36);
- journeys `38a2ed1f-e30e-4213-a7f0-18580ca47a47` and `f59fc56e-0cc2-4cdd-919f-cfba9d955789`.

Each update asserts its exact count. Bot rows (16) are left alone; the views already exclude them.
agent_interactions had 0. After applying: 0 rows with `not is_test and not is_bot` in events and
journeys, 0 non-test in agent_interactions. Rollback: set `is_test = false` on exactly those ids.

**SMOKE re-run on the current preview** (`f2ba6ac`/`acb58cf`, bundle `index-CKIRLKQN.js`, Chrome
375×812, `tp_test` on). Only the lines that pass through capture were re-run, because the code since
SMOKE 13/13 only touched capture (`FlightPicker.tsx`, `FlightContextCapture.tsx`, preview-only
`LayoutDebug.tsx`):

| # | Result | Evidence |
|---|---|---|
| 1 | PASS | Gate: "What brings you to Changi?", 3 options, Skip |
| 2 | PASS | Skip → Home; journeys `57a014fb…` skipped |
| 3 | PASS | T1 → Enter manually → QF1 → Looks right; bar "6h 48m to board · QF1 · SIN → LHR"; `flight_source=typed`, v4 |
| 4 | PASS | Change flight → "SQ" (87 rows) → list box scrolled to its end (6410/6410) → last row SQ968 tapped → bar "SQ968 · SIN → CGK", `flight_source=picker`, journey `0b625360…` |
| 8 | PASS | Change flight → "Change flight" heading, "Keep QF1" once → `capturedAt` unchanged |
| 12 | PASS | Session `29bd7c84…`: events 1533–1545 include session_start and recommendation_impression |
| 13 | PASS | `30340414-89d9-45d9-bbf7-34363e8225f1`: QF1, typed |

Lines 5–7 and 9–11 (Home, vibe, collection, amenity, search, hours, chat, MCP) are outside capture
and were last run on `7a041cb` (PASS).

Rows: events 1533–1545, journeys `57a014fb…`, `30340414…`, `0b625360…`. All preview, all `is_test`.

**Observation (not blocking).** With `overscroll-behavior: contain`, a swipe that starts on the list
box scrolls only the list, even at its end. To reach "Enter manually" or "Keep …" below the box when
they're off screen, the passenger swipes outside the box (heading or side margin). At 375×812 they
were one short scroll below. Removing `contain` would let a swipe at the list's end carry on to the
page.

## Production (15 Oct)

- **Push:** `f6f0b2a..b00dc23 main` (fast-forward), approved by Todd. `git ls-remote`: `refs/heads/main` = `b00dc237…`.
- **Deployment:** `dpl_2sxqfY9pNibnpXPzCPAM5W7n3djn`, target production, sha `b00dc23`, READY.
- **Rollback target:** `dpl_9GVEgRDd65rRDjAwp7aA7zatBWj8` (`f6f0b2a`). Not used.
- **Bundle:** `fetch /?x=…` serves `assets/index-uzOUSjLw.js`, the same as a plain local build of
  `b00dc23`, and production `sw.js` precaches it. The production bundle has 0 readout strings (`ovY=`,
  `tp_layout`) and has the list cap (`tp-visible-h`).

Capture checks on https://terminalplus.app (Chrome 375×812, `tp_test` set before the first load,
service worker and caches cleared):

| # | Result | Evidence |
|---|---|---|
| 1 | PASS | Gate shows, bundle `index-uzOUSjLw.js`, overlay `overflow-y: auto`, no readout box |
| 2 | PASS | Skip → Home ("Add your flight for personalised recommendations"); journey `ad4087e1…` skipped |
| 3 | PASS | T1 → board (list box 420 px, 142 rows) → Enter manually → QF1 → Looks right; bar "6h 38m to board · QF1 · SIN → LHR"; `flight_source=typed`, v4, journey `32cccd8b…` |
| 4 | PASS | Change flight → "SQ" (86 rows) → list box scrolled to its end (6331/6331) → last row NH844 tapped → bar "NH844 · SIN → HND", `flight_source=picker`, journey `8eae24ff…` |
| 8 | PASS | Change flight → "Change flight" heading, "Keep QF1" once → `capturedAt` unchanged |

Rows: events 1546–1558 and journeys `ad4087e1-2d55-40fa-a50c-510acc1af13e`,
`32cccd8b-b5b0-4ffe-a14e-48e413d0cef7`, `8eae24ff-bec3-4930-9eda-dfdca85a0be9`: all production,
all `is_test`. After the run there are 0 rows with `not is_test and not is_bot`.

Test-harness note: a screenshot taken 1 s after a step click can still show the previous step. The
DOM had already moved on, so the click had worked. Read the DOM, not the screenshot, before
re-clicking.

## Follow-up (Todd, 15 Oct; not in this ship)

CC-23b, the swipe fix:
- "Enter manually" moves directly under the filter.
- `overscroll-behavior: contain` comes off the list, so a swipe at the list's end carries on to the
  page.

Acceptance: a real-iPhone check for both.

## Migration 20261015075543: rows changed, by session (for Todd to confirm)

| Session | Env | First – last (UTC) | Rows | Landing |
|---|---|---|---|---|
| `5b305a2b…` | preview | 10-04 18:27:49 | 775 session_start | none recorded |
| `8acc9d03…` | production | 10-06 01:14:44 | 1010 session_start, 1011 capture_opened | `/` |
| `3f97f75c…` | production | 10-09 02:58:42 | 1198 session_start, 1199 capture_opened | `/` |
| `517a7e64…` | production | 10-09 08:29:05 | 1200 session_start, 1201 capture_opened | `/` |
| `150816bf…` | production | 10-14 10:19:38 – 10:21:57 | 1455–1473 (session_start, 4 capture_opened, 14 recommendation_impression) + journeys TR266, UA2 (picker, Asia/Jerusalem) | `/` |
| `e73b693d…` | production | 10-15 06:47:43 | 1518 session_start, 1519 capture_opened | `/` |
| `d601675a…` | preview | 10-15 07:00:35 – 07:00:55 | 1522–1525 (2× session_start, 2× capture_opened) | `/` |
| `7939bc97…` | production | 10-15 07:48:39 | 1529 session_start, 1530 capture_opened | `/` |
| `20151b47…` | preview | 10-15 07:48:51 | 1531 session_start, 1532 capture_opened | `/` |

No session carries a utm source or a referrer host.
