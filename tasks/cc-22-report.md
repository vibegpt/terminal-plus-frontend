# CC-22 report: the app never touches the clipboard uninvited

**Verdict: closed with no code change (Todd, 14 Oct, option 1).** G3 could not
reproduce a clipboard call. Nothing in the shipped app reads or writes the
clipboard. The earlier sightings (2 Oct, 14 Oct; also CC-13 report line 94)
came from the test browser's simulated input. The real-iPhone check (Safari
"Allow Paste" / "pasted from" banner) is Todd's.

Ships with this branch: `9ee178c` cherry-picked (CC-17 production checks in
`tasks/cc-17-report.md`), plus this report and a lesson. Docs only.

## Gates

| Gate | Result | Evidence |
|---|---|---|
| G1 worktree off main, prod == origin/main | PASS | `~/tp-cc-22`, branch `cc-22/clipboard` from `962e384`. Production `dpl_5dJdcDC75k1nJ6YJdbi9CjQmdtw1` = `962e384` = origin/main |
| G2 clipboard calls in reachable code | PASS, 0 hits | See below |
| G3 reproduce on a preview | NOT REPRODUCED (0 calls) | See below. Halted here; no fix to make |

### G2

- esbuild metafile from `src/main.tsx` (`@/` alias resolved): 53 files in `src/`,
  2 in `shared/ranking/`. Searched for `navigator.clipboard`, `execCommand`,
  `onPaste`, `onCopy`, `onCut`, `readText`, `writeText`, `ClipboardItem`,
  `clipboardData`, `ClipboardEvent`, and `'copy'`/`'paste'` literals: **0 first-party hits**.
- Flight fields: `src/pages/FlightContextCapture.tsx:362` and `:582` (typed
  entry, `autoFocus`), `src/components/FlightPicker.tsx:200` (board filter).
  Handlers are `onChange` and `onKeyDown` only.
- Third-party (2,106 node_modules inputs): `react-dom` (synthetic clipboard-event
  plumbing) and `lucide-react/icons/copy.js` (an icon). Neither calls a clipboard API.
- Production bundle: all 22 JS chunks listed in production `sw.js`, plus `sw.js`
  and `index.html`. The only match is `clipboardData` in `react-vendor-*.js`:
  React's `SyntheticClipboardEvent` getter, which runs only when a native
  copy/paste event fires and a handler reads it. No handler exists. GA4
  (`gtag.js`) runs in the page, so the G3 wrapper covers it.

### G3

Preview `dpl_xz6ShhM6Ui2jeHhvehUqTnkoaiHh` (Preview build of `962e384`; Vercel
skipped a duplicate build for the branch push), 375 px, `tp_test=1` set before
load, SW unregistered and caches cleared.

The wrapper was installed on `/saved` before capture opened, so mount-time and
`autoFocus` calls would be caught. It wrapped `Clipboard.prototype.{readText,
writeText,read,write}`, the `navigator.clipboard` getter, `document.execCommand`,
capture-phase `copy/cut/paste/beforecopy/beforepaste` listeners and
`navigator.permissions.query` for clipboard names. Each logged `[CLIP]` with a
stack. A sanity call proved it fired (1 hit), then the log was reset.

| Step | Clipboard calls |
|---|---|
| Add-flight bar → capture opens, Departing, T3 | 0 |
| Board filter field: focus, type "SQ", blur | 0 |
| "Enter manually": field mounts with autoFocus | 0 |
| Type "SQ2", blur | 0 |
| `form_input` SQ231, tap Look up flight, tap Looks right | 0 |

Console filtered on `CLIP`/`lipboard`: only the sanity call (stack
`<anonymous>:1:18`, before the reset).

Not run: picking a flight from the departures board, and SMOKE (no code change).

## Test rows

All `is_test = true`, `env = preview`, `is_bot = false`. 0 with `is_test = false`.

| Table | Id | Type |
|---|---|---|
| events | 1452 | session_start |
| events | 1453 | capture_opened |
| events | 1454 | flight_not_found |
| journeys | 4a60a193-7a3c-46dd-9239-25a85a523cd7 | |

## Open

- Real-iPhone check (Todd).
- Not checked: that "Scan boarding pass" requests the camera only after a tap.
