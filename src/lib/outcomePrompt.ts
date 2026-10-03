// src/lib/outcomePrompt.ts
// Eligibility engine for the outcome strip (CC-13): "Make it to {venue}?"
//
// Pure: no browser globals, no storage, no React. tests/outcome-eligibility.test.ts
// runs it under node. The browser side lives in lastSeen.ts (the gap) and
// candidateTap.ts (the candidate and the per-journey ledger).
//
// What the answer is: outcome_self_reported. A tap on Yes is a claim, not a position
// fix. Never call it "visited", and never infer it from dwell time or location.
//
// Sample bias: only people who reopen the app can answer, and whether they reopen
// correlates with the outcome. The denominator is eligible candidates
// (outcome_eligible), never answers.
//
// Two tiers, by decision (3 Oct):
// - candidateEligible: rules 1-5 and 8 hold, so the candidate is a valid question on
//   this resume. Log outcome_eligible (once per journey and venue).
// - showable: rules 6 and 7 hold as well, so render the strip. Rules 6 and 7 only
//   gate display: a candidate they hold back stays eligible-but-not-shown.

// ── Constants ───────────────────────────────────────────────────────
// Fit these from the gap_minutes and candidate_age_minutes logged on every outcome event.

/** UNCALIBRATED. Shortest gap since the app was last seen that can mean "went somewhere". */
export const OUTCOME_GAP_MIN_MINUTES = 12;
/** UNCALIBRATED. Longest gap still worth asking about. */
export const OUTCOME_GAP_MAX_MINUTES = 360;
/** UNCALIBRATED. Most minutes from the candidate tap to backgrounding the app. */
export const OUTCOME_CANDIDATE_WINDOW_MINUTES = 20;
/** UNCALIBRATED. Most strips shown per journey. */
export const OUTCOME_MAX_PROMPTS_PER_JOURNEY = 2;
/** Debug only: ?tp_gap_debug=1 on a DEV or VITE_TP_DEBUG=1 build replaces the gap minimum. */
export const OUTCOME_DEBUG_GAP_MIN_SECONDS = 20;

// ── Contract (mirror of api/events.ts — keep in sync) ───────────────

export const CANDIDATE_TYPES = ['detail_open', 'save', 'directions'] as const;
export const OUTCOMES = ['yes', 'no', 'dismissed'] as const;
export const OUTCOME_REASONS = ['no_time', 'changed_mind'] as const;
// Only 'prompt' and 'checkin' are emitted today; 'qr' and 'inferred' exist from day one.
export const OUTCOME_SOURCES = ['prompt', 'checkin', 'qr', 'inferred'] as const;
export const SPEND_BANDS = ['none', 'lt_10', '10_30', 'gt_30'] as const;

export type CandidateType = (typeof CANDIDATE_TYPES)[number];
export type Outcome = (typeof OUTCOMES)[number];
export type OutcomeReason = (typeof OUTCOME_REASONS)[number];
export type OutcomeSource = (typeof OUTCOME_SOURCES)[number];
export type SpendBand = (typeof SPEND_BANDS)[number];

/** The most recent amenity detail open, save or directions tap. */
export interface Candidate {
  slug: string;
  name: string;
  type: CandidateType;
  /** Epoch ms of the tap. */
  at: number;
}

/**
 * Where a venue stands in this journey's ledger. 'eligible' was logged but not shown
 * (cap or capture bar), so it can still be shown on a later resume. Every other
 * status means it was shown, asked or answered: never ask again.
 */
export type AskedStatus = 'eligible' | 'shown' | 'dismissed' | 'answered' | 'checked_in';

export type IneligibleReason =
  | 'no_candidate'     // rule 1
  | 'first_session'    // no last-seen time existed: a first-ever page load
  | 'gap_below_min'    // rule 2
  | 'gap_above_max'    // rule 3
  | 'candidate_stale'  // rule 4
  | 'already_asked'    // rule 5
  | 'cap_reached'      // rule 6 (display gate)
  | 'capture_bar'      // rule 7 (display gate)
  | 'no_journey'       // rule 8
  | 'departed';        // rule 8

const DISPLAY_GATES: ReadonlySet<IneligibleReason> = new Set(['cap_reached', 'capture_bar']);

export interface OutcomeInput {
  /** The resume moment (epoch ms). */
  now: number;
  /** tp_last_seen as read before this resume wrote it. Null = first-ever page load. */
  lastSeen: number | null;
  candidate: Candidate | null;
  /** This journey's ledger. */
  asked: Record<string, AskedStatus>;
  shownCount: number;
  /** The flight bar is showing its "Add your flight" capture state. */
  captureBarShowing: boolean;
  journeyActive: boolean;
  /** hasDeparted(journey) from JourneyContext. */
  departed: boolean;
  /** Gap minimum in ms. Defaults to OUTCOME_GAP_MIN_MINUTES. */
  gapMinMs?: number;
}

export interface OutcomeVerdict {
  /** Rules 1-5 and 8: log outcome_eligible. */
  candidateEligible: boolean;
  /** candidateEligible plus rules 6 and 7: render the strip. */
  showable: boolean;
  /** Every rule that failed, in table order. */
  failed: IneligibleReason[];
  /** now - lastSeen, in minutes to 1 decimal. */
  gapMinutes: number | null;
  /** Candidate tap -> backgrounding (lastSeen - candidate.at), in minutes to 1 decimal. */
  candidateAgeMinutes: number | null;
}

const MIN = 60_000;

/** Minutes to 1 decimal, floored at 0. */
export function toMinutes(ms: number): number {
  return Math.max(0, Math.round(ms / 6_000) / 10);
}

export function gapMinMs(debug: boolean): number {
  return debug ? OUTCOME_DEBUG_GAP_MIN_SECONDS * 1000 : OUTCOME_GAP_MIN_MINUTES * MIN;
}

/** ?tp_gap_debug=1, honoured only on a DEV build or one built with VITE_TP_DEBUG=1. */
export function parseDebugFlag(search: string, isDev: boolean, viteTpDebug: unknown): boolean {
  if (!isDev && viteTpDebug !== '1') return false;
  try {
    return new URLSearchParams(search).get('tp_gap_debug') === '1';
  } catch {
    return false;
  }
}

export function evaluateOutcome(input: OutcomeInput): OutcomeVerdict {
  const failed: IneligibleReason[] = [];
  const { now, lastSeen, candidate } = input;

  const gapMs = lastSeen === null ? null : now - lastSeen;
  // A candidate tapped after the last heartbeat has age 0, not a negative one.
  const ageMs = candidate && lastSeen !== null ? Math.max(0, lastSeen - candidate.at) : null;

  // 1. A candidate exists
  if (!candidate) failed.push('no_candidate');

  // 2-3. The gap. No last-seen time means a first-ever page load: never prompt.
  if (gapMs === null) {
    failed.push('first_session');
  } else {
    if (gapMs < (input.gapMinMs ?? OUTCOME_GAP_MIN_MINUTES * MIN)) failed.push('gap_below_min');
    if (gapMs > OUTCOME_GAP_MAX_MINUTES * MIN) failed.push('gap_above_max');
  }

  // 4. Candidate tap -> backgrounding within the window
  if (ageMs !== null && ageMs > OUTCOME_CANDIDATE_WINDOW_MINUTES * MIN) failed.push('candidate_stale');

  // 5. Not already shown, asked or answered this journey
  const status = candidate ? input.asked[candidate.slug] : undefined;
  if (status && status !== 'eligible') failed.push('already_asked');

  // 6. Strips shown this journey under the cap (display gate)
  if (input.shownCount >= OUTCOME_MAX_PROMPTS_PER_JOURNEY) failed.push('cap_reached');

  // 7. Flight-capture bar not showing (display gate)
  if (input.captureBarShowing) failed.push('capture_bar');

  // 8. Before the journey's departure
  if (!input.journeyActive) failed.push('no_journey');
  else if (input.departed) failed.push('departed');

  const candidateEligible = failed.every(r => DISPLAY_GATES.has(r));
  return {
    candidateEligible,
    showable: failed.length === 0,
    failed,
    gapMinutes: gapMs === null ? null : toMinutes(gapMs),
    candidateAgeMinutes: ageMs === null ? null : toMinutes(ageMs),
  };
}

// ── Event payloads (amenity_slug, terminal_code and minutes_to_boarding are columns) ──

export type OutcomeEligiblePayload = {
  candidate_type: CandidateType;
  gap_minutes: number;
  candidate_age_minutes: number;
};

export type OutcomeShownPayload = {
  gap_minutes: number;
  candidate_age_minutes: number;
};

export type OutcomeResponsePayload = {
  outcome: Outcome;
  outcome_reason: OutcomeReason | null;
  outcome_source: OutcomeSource;
  spend_band: SpendBand | null;
  gap_minutes: number | null;
  candidate_age_minutes: number | null;
};

export type GatePayload = { gate: string };

/** Gate chip window, minutes to boarding (inclusive). */
export const GATE_CHIP_MAX_MINUTES = 45;
export const GATE_CHIP_MIN_MINUTES = -15;

/** Gates are short codes like C22; strip whitespace so "C 22" doesn't fail validation. */
export function normalizeGate(gate: string | null | undefined): string | null {
  const g = (gate ?? '').replace(/\s+/g, '').toUpperCase();
  return /^[A-Z0-9-]{1,8}$/.test(g) && g !== '-' ? g : null;
}

export function gateChipVisible(args: {
  gate: string | null | undefined;
  minutesToBoarding: number | null;
  journeyActive: boolean;
  departed: boolean;
  reached: boolean;
}): boolean {
  const m = args.minutesToBoarding;
  return (
    args.journeyActive &&
    !args.departed &&
    !args.reached &&
    normalizeGate(args.gate) !== null &&
    m !== null &&
    m <= GATE_CHIP_MAX_MINUTES &&
    m >= GATE_CHIP_MIN_MINUTES
  );
}
