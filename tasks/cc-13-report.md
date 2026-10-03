# CC-13 Journey trail: report

**Status: DONE on the preview, not merged.** 19 of 21 acceptance checks pass. AC-8 is BLOCKED: it needs a real iPhone home-screen install. AC-21 is this report. Branch `cc-13-journey-trail`: code at `754c858` (3 commits on `d1ccd07`), plus this docs commit. Preview `dpl_G2UAZcNVnbbH41AFzSYqSv6U9xNw` READY. CI is green on all 3 commits. The migration is applied to the production DB; both views read 0 rows until real production rows exist. **Nothing is merged to `main`.** That waits for Todd's go.

Run date: 2026-10-03. This replaces the 2026-10-01 BLOCKED run (G1 failed then because CC-7 wasn't applied).

## Gates

| Gate | Result | Evidence |
|---|---|---|
| G1 CC-7 applied | PASS | `information_schema.columns`: `events.journey_id` uuid, `events.env` text, `events.is_test` boolean; `journeys.inbound_arrival_utc` timestamptz, `journeys.connection_minutes` integer; `journeys.created_at` timestamptz. `list_migrations` includes `20261002184806`, `20261002191525`, `20261003055908` |
| G2 EVENT_TYPES mirrored | PASS | Same 11 entries in the same order at `src/lib/telemetry.ts:15-27` and `api/events.ts:43-55` (1 line lower than on 1 Oct, from the CC-7 import) |
| G3 path discovery | Reported, approved | See below |

G3 findings:
- a. `track(type, fields)` passes `payload` through untouched, and `journey_id` is read from `tp_journey_context` on every row. The default `minutes_to_boarding` is clamped to ≥ 0; an explicit value isn't clamped.
- b. `api/events.ts` rejects bad rows one at a time with HTTP 200 + `rejected[]`. An all-rejected batch also got 200.
- c. `JourneyData` has `journey_id` (v3), `gate`, `boardingTime`, `scheduledDeparture`, `departureTerminal` and `capturedAt`. `hasDeparted()` handles the AeroDataBox time format.
- d. The sticky slot is in `AppShell.tsx` (`MobileHeader`, `TopBar`), not `App.tsx`. The "flight-capture bar" is `FlightStatusBar`'s "Add your flight" empty state. `tp_onboarded` is the sessionStorage skip flag.
- e. No detail-open event exists. `AmenityDetailPage` emits only `amenity_detail_dwell`; `amenity_tapped` fires from 2 list surfaces.
- f. `events` has no FK to journeys, `event_type` is plain text, and anon/authenticated hold no privileges.
- g. `FlightStatusBar` shows `gate` as `'—'` when unknown, so the gate chip reads `journey.gate`.
- h. Save exists (the Bookmark toggle). There's no directions control anywhere in live code.

## Decisions and deviations

| # | What | Why |
|---|---|---|
| 1 | Optional `banner` prop on `AppShell`, rendered under the flight bar | The sticky slot lives there (G3-d) |
| 2 | The candidate is recorded in `AmenityDetailPage` after load and on save → true. No event added. `directions` stays in the enum, but nothing emits it | No detail-open event to reuse (G3-e); no directions control (G3-h) |
| 3 | Per-row rejection stays. A batch with **no** valid rows now gets 400 | A 400 on a mixed batch makes the client re-send its valid rows |
| 4 | Extra module `src/lib/lastSeen.ts`; extra key `tp_outcome_ledger` | Keeps the engine pure. The resume snapshot has to be taken before React mounts |
| 5 | `stops` includes `outcome_reason` | "went or not (and why)" |
| 6 | `outcome_eligible` is logged on resume when rules 1-5 and 8 pass. Rules 6 and 7 only gate display | Todd, 3 Oct |
| 7 | First-ever session = no `tp_last_seen` at boot | Todd, 3 Oct |
| 8 | The No step has no auto-close. A held answer is written, with the step-2 field null, on hide or unmount | The spec gives 8 s only for Yes; step 1 must never be lost |
| 9 | `gap_minutes` and `candidate_age_minutes` are minutes to 1 decimal | Debug gaps are seconds; 0 would read like a bug |
| 10 | (fix `fc1c91b`) Debug builds keep their own `console` reference | `vite.config.ts:177` uses terser `drop_console`, so no `console.*` call survives a build. Production bundle: 0 `[outcome]` strings |
| 11 | (fix `754c858`) A strip that mounts replays only a resume under 10 s old | The strip isn't mounted behind the full-screen capture. Without this, a resume that fired there replayed after the next capture, asking about the previous trip's venue against a fresh ledger |
| 12 | (fix `754c858`) `FlightProvider` computes `minutesToBoarding` on the first render too | It was effect-only. Children's mount effects run first, so the capture-bar rule could miss the departed state on a cold boot |

## Files

| File | Change |
|---|---|
| `src/lib/outcomePrompt.ts` | new: pure engine, 4 `UNCALIBRATED` constants plus the debug minimum, enums, payload types, gate-chip rule |
| `src/lib/candidateTap.ts` | new: `tp_outcome_candidate` and `tp_outcome_ledger` (versioned) |
| `src/lib/lastSeen.ts` | new: `tp_last_seen` writer, resume snapshots, debug flag and log |
| `src/components/OutcomePrompt.tsx` | new: strip, spend and reason chips, held-response hook |
| `src/components/AppShell.tsx` | `banner` slot |
| `src/App.tsx` | static import + `banner={<OutcomePrompt />}` |
| `src/pages/AmenityDetailPage.tsx` | candidate on load and save; "I'm here" with inline spend |
| `src/components/FlightStatusBar.tsx` | `GateChip`; `minutesToBoarding` on first render |
| `src/lib/telemetry.ts`, `api/events.ts` | 5 event types mirrored; outcome and gate validation; all-rejected → 400 |
| `supabase/migrations/20261003085434_journey_trail_views.sql` | 2 views, revoke, comments |
| `tests/outcome-eligibility.test.ts` | new, 20 tests |
| `tasks/lessons.md` | 3 lessons |

Untouched: `api/mcp.ts`, `api/lib/ranking.ts`, `api/lib/flightGrouping.ts`, `api/flights/board.ts`, `tp_journey_context` (no new field, so no schema_version bump).

## Migration `20261003085434_journey_trail_views`

- Dry-run of the trail view inside `begin … rollback` returned 0 rows. Applied with `apply_migration`; the file was renamed to the version the DB recorded.
- After apply, both views have `reloptions` = `security_invoker=on`. `has_table_privilege` for anon and authenticated is false for SELECT and for INSERT/UPDATE/DELETE/TRUNCATE/REFERENCES/TRIGGER. `obj_description` carries the sample-bias warning on both.
- Production read: `analytics_journey_trail` 0 rows, `analytics_journey_trail_k5` 0 rows.

## Smoke setup

- Built-in browser at 375×812, on the branch alias `terminal-plus-frontend-git-cc-13-413bc6-…vercel.app`.
- `localStorage.tp_test = '1'` was set on `/robots.txt` before the first app load.
- `?tp_gap_debug=1` on a build with `VITE_TP_DEBUG=1`, now set on **Vercel Preview only** (`vercel env ls`: Preview, added 3 Oct). The gap minimum was 20 s.
- The headless tab is often natively hidden, so background and resume were simulated by overriding `Document.prototype.visibilityState` and dispatching `visibilitychange`.
- Smoke journey: SQ322 SIN → LHR, gate B5, captured for real (`890716db-00da-41e9-8f1e-9110c1280cf3`).
- Test-only edits:
  - The ledger's `shown_count` was reset to 0 twice, so 5 strips fit one journey under the cap of 2.
  - `tp_journey_context.boardingTime` / `scheduledDeparture` were edited for AC-10, AC-13 and AC-16.
  - `tp_last_seen` was back-dated for AC-15.

## Acceptance

| AC | Result | Evidence |
|---|---|---|
| AC-1 strip names the amenity | PASS | Grain Traders opened from a collection, backgrounded 23 s, resumed. Strip "Make it to Grain Traders?" [Yes] [No] (x) under the flight bar (screenshot taken). Console: `eligibility true: all rules pass {gapMinutes: 0.4, candidateAgeMinutes: 0.1}` |
| AC-2 Yes | PASS | Row 307: `outcome yes`, `outcome_source prompt`, `amenity_slug grain-traders-jewel`, `journey_id 890716db…`, `gap_minutes 0.4` |
| AC-3 Yes + S$10-30 | PASS | Row 307 `spend_band 10_30` |
| AC-4 Yes, no chip for 8 s | PASS | Row 311 (Bacha Coffee): `outcome yes`, `spend_band null`. The strip closed itself |
| AC-5 No + No time | PASS | Row 318 (Sushi Tei): `outcome no`, `outcome_reason no_time` |
| AC-6 No, close step 2 | PASS | Row 323 (Apple Store): `outcome no`, `outcome_reason null` |
| AC-7 close at step 1 | PASS | Row 327 (Butterfly Garden): `outcome dismissed` |
| AC-8 cold kill on an iPhone | **BLOCKED** | No WebKit or iOS device here. Chromium stand-in passed: the page was backgrounded, fully reloaded while hidden, then made visible. Console `resume boot {candidate: sushi-tei-t3-new}`, `candidateAgeMinutes 0.4`, which is the pre-reload tap (the re-recorded one would read 0), proving the snapshot is taken before the page re-records. Strip shown, rows 316-318 |
| AC-9 "I'm here" | PASS | Row 329 (Fragrance Bak Kwa): `outcome yes`, `outcome_source checkin`, `spend_band lt_10`, `gap_minutes null`. UI shows "You're here ✓". A later 23 s resume: `eligibility false: already_asked`, no strip |
| AC-10 gate chip | PASS | Boarding set to +40 min: "At Gate B5? Tap when you arrive" rendered. Row 332 `gate_prompt_shown` (gate B5, SIN-T3, 40), exactly once. Tap → row 340 `gate_reached` (B5, SIN-T3, 40). The chip disappeared, the bar didn't toggle, and the chip was still gone after a reload. Also seen live on the first capture (SQ34, 15 min to board): row 243 `gate_prompt_shown` B8 |
| AC-11 gap under threshold | PASS | 5 s gap: console `eligibility false: gap_below_min {gapMinutes: 0.1}`, no strip |
| AC-12 collections only | PASS | Gate Essentials only, 23 s gap: `eligibility false: no_candidate {gapMinutes: 0.4}`, no strip |
| AC-13 capture bar | PASS | With "Add your flight…" showing: `eligibility false: capture_bar {candidateEligible: true}`, no strip, row 321 `outcome_eligible` (Apple Store). Bar restored, next resume: strip "Make it to Apple Store?", row 322 `outcome_shown` |
| AC-14 no re-ask | PASS | Same candidate after answering, 23 s gap: `eligibility false: already_asked`, no strip |
| AC-15 gap over 360 | PASS | `eligibility false: gap_above_max {gapMinutes: 361}`, no strip |
| AC-16 after departure | PASS (cold boot) | Departure set 25 min in the past, fresh candidate, 23 s gap, reload: the journey was cleared and the capture screen shown, with no strip and no chip. The warm path (departure passes while the app stays open) is covered by unit tests (rule 8 `departed`; gate chip `departed`) |
| AC-17 eligible never shown | PASS | Row 313 `outcome_eligible` (Kinokuniya): held by the cap (`eligibility false: cap_reached {candidateEligible: true}`), never shown |
| AC-18 trail with test rows | PASS | The view body from the migration file, both filters swapped for `true`, scoped to the smoke journeys: 1 row for `890716db`, `SIN → LHR`, eligible 6, shown 5, answered 5, yes 3, check-in 1. 6 stops in order: Grain Traders yes 10_30 → Bacha yes → Sushi Tei no/no_time → Apple Store no → Butterfly Garden dismissed → Fragrance Bak Kwa check-in lt_10. `gate_reached_minutes_to_boarding` 40. Production views: 0 rows |
| AC-19 k5 suppression | PASS | A `DO` block inserted 9 production journeys (5 to ZZA, 4 to ZZB) with `outcome_eligible`, plus yes on 3 ZZA and 1 ZZB, then raised an exception (always rolls back). Raw cells: ZZA 5 journeys, ZZB 4. k5 view: only `LHR → SIN → ZZA` / `90-180`, eligible 5, yes 3, `yes_rate 0.600`, `k_journeys 5`. Afterwards: 0 synthetic events, 0 synthetic journeys |
| AC-20 types, build, CI | PASS | `npx tsc --noEmit -p api/tsconfig.json`: 0 errors. `npm run build`: passes. `npx tsx --test tests/*.test.ts`: 37/37 (20 new). GitHub CI runs `37118388819`, `37118695571`, `37119421488`: success. A typecheck limited to the touched files shows the same errors as the base minus one (pre-existing unused imports only) |
| AC-21 report | this file | |

API checks against the preview (all with `x-tp-test: 1`):
- `outcome: 'visited'` → **400** `invalid outcome`.
- `outcome yes` with `outcome_reason` → **400**.
- `gate: '<b>'` → **400** `invalid gate`.
- A mixed batch (1 valid, 1 `candidate_type: collection_open`) → **200**, `inserted 1`, `rejected [{index 1, invalid candidate_type}]`.

## Findings outside CC-13

1. **The PWA serves a stale shell after a deploy, and route chunks then fail to load: blank screen.**
   - What happened: after the `754c858` deploy, the open tab ran `index-CqYhjW4t.js` (the previous build) from the workbox precache.
   - The server was already serving `index-DDbR0kbh.js`.
   - The old shell's lazy chunk `HomePage-Ducj4UhL.js` came back as `text/html` (the SPA fallback), and React unmounted to a blank page.
   - Cause: `vite.config.ts` uses `registerType: 'autoUpdate'` with no `vite:preloadError` handler.
   - This predates CC-13 and will hit production users holding an open or cached app on every deploy. It belongs with CC-8 (PWA).
2. Every preview is now a debug build (`VITE_TP_DEBUG=1` on Preview): `?tp_gap_debug=1` works and `[outcome]` logs print there. Production builds have neither.
3. This branch and the uncommitted CC-16 attribution work in the main checkout both edit `src/lib/telemetry.ts`, `api/events.ts` and `src/pages/AmenityDetailPage.tsx`. Whichever merges second rebases.

## Harness artifacts (test rows that aren't product behaviour)

- Rows 363/364 (journey `b0633dff`): `outcome_eligible`/`outcome_shown` for Cabin Bar. These came from the **stale `fc1c91b` shell** (finding 1) replaying an old resume after a capture, the case fix 11 removes. Re-run on the real `754c858` build: console `resume too old to replay on mount, waiting for the next one`, no strip.
- Rows 396/397 (journey `eae6ea1d`): `outcome_eligible`/`outcome_shown` for YOTELAIR. A real `visibilitychange` fired when the browser pane toggled, while the override still answered "visible", so it read as a resume with no hidden step before it. Real browsers fire "visible" only after "hidden".
- Row 398 (journey `eae6ea1d`, `api-check-venue`): the valid half of the mixed-batch API check.

## Smoke row ids (all `is_test = true`, `env = preview`; the analytics views already exclude them)

- anon_ids: `a73f77be-362a-4b66-9f49-428467a2e7c2` (first preview origin), `ddda47a0-b0e6-47dc-9adf-1d07a1347efa` (branch alias).
- journeys (5):
  - `0bab26c1-2933-41d8-badc-00eb0c983b8f` (SQ34)
  - `d1fe7a3d-2445-424f-bdc2-54b7733c17ca` (SQ322, first origin)
  - `890716db-00da-41e9-8f1e-9110c1280cf3` (**smoke journey**)
  - `b0633dff-9203-437a-b04c-6b13f121b80f`
  - `eae6ea1d-fa64-42ac-8227-37ccfc6e5b93`
- events (84): 242-250, 260-267, 294-348, 363, 364, 389-398.

## Rollback

- Views: `drop view if exists public.analytics_journey_trail_k5, public.analytics_journey_trail;` (nothing else depends on them).
- Code: don't merge the branch, or revert its 3 commits. `api/events.ts` then accepts none of the 5 types again, and the all-rejected status goes back to 200.
- Env: `vercel env rm VITE_TP_DEBUG preview`.

## Next

1. Todd: go or no-go to fast-forward `main` after a production-style check of the merged tree. CC-16's overlapping edits land first or after, rebased.
2. AC-8 on a real iPhone home-screen install (cold kill, reopen past 12 min).
3. CC-8: handle `vite:preloadError` (reload once) or switch the SW to prompt-on-update, so a deploy can't blank an open app.
4. Calibrate the 4 `UNCALIBRATED` constants once `gap_minutes` and `candidate_age_minutes` have production volume.
