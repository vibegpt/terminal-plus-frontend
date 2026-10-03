// src/lib/candidateTap.ts
// The outcome candidate and the per-journey ledger (CC-13), both in localStorage
// because iOS evicts backgrounded tabs and the cold boot is the common resume path.
//
// tp_outcome_candidate: the most recent amenity detail open, save or directions tap.
//   Global, not journey-scoped: a tap made before a flight was added can still be
//   asked about once the journey exists.
// tp_outcome_ledger: per journey (keyed by the journey's capturedAt, which exists
//   before the journeys row id does). Which venues were eligible, shown, dismissed,
//   answered or checked in, how many strips were shown, and the gate chip state.
//   A new journey starts a fresh ledger.
//
// Both are versioned objects. Every read and write is wrapped: storage can be blocked.

import type { AskedStatus, Candidate, CandidateType } from './outcomePrompt';
import { CANDIDATE_TYPES } from './outcomePrompt';

const CANDIDATE_KEY = 'tp_outcome_candidate';
const LEDGER_KEY = 'tp_outcome_ledger';
const SCHEMA_VERSION = 1;

// ── Candidate ───────────────────────────────────────────────────────

type StoredCandidate = Candidate & { schema_version: number };

export function parseCandidate(raw: string | null): Candidate | null {
  if (!raw) return null;
  try {
    const c = JSON.parse(raw) as Partial<StoredCandidate>;
    if (c.schema_version !== SCHEMA_VERSION) return null;
    if (typeof c.slug !== 'string' || !c.slug) return null;
    if (typeof c.at !== 'number' || !Number.isFinite(c.at)) return null;
    if (!CANDIDATE_TYPES.includes(c.type as CandidateType)) return null;
    return { slug: c.slug, name: typeof c.name === 'string' ? c.name : c.slug, type: c.type as CandidateType, at: c.at };
  } catch {
    return null;
  }
}

export function readCandidate(): Candidate | null {
  try {
    return parseCandidate(localStorage.getItem(CANDIDATE_KEY));
  } catch {
    return null;
  }
}

/** Record a detail open, save or directions tap as the current candidate. */
export function recordCandidate(slug: string, name: string, type: CandidateType, at = Date.now()): void {
  try {
    const stored: StoredCandidate = { schema_version: SCHEMA_VERSION, slug, name, type, at };
    localStorage.setItem(CANDIDATE_KEY, JSON.stringify(stored));
  } catch { /* storage blocked: no candidate, no prompt */ }
}

// ── Ledger ──────────────────────────────────────────────────────────

export interface Ledger {
  schema_version: number;
  journey_key: string | null;
  asked: Record<string, AskedStatus>;
  shown_count: number;
  gate_prompt_logged: boolean;
  gate_reached: boolean;
}

export function emptyLedger(journeyKey: string | null): Ledger {
  return {
    schema_version: SCHEMA_VERSION,
    journey_key: journeyKey,
    asked: {},
    shown_count: 0,
    gate_prompt_logged: false,
    gate_reached: false,
  };
}

/** The stored ledger if it belongs to this journey, else a fresh one. */
export function ledgerFor(raw: string | null, journeyKey: string | null): Ledger {
  if (!raw) return emptyLedger(journeyKey);
  try {
    const l = JSON.parse(raw) as Partial<Ledger>;
    if (l.schema_version !== SCHEMA_VERSION || l.journey_key !== journeyKey) return emptyLedger(journeyKey);
    return {
      ...emptyLedger(journeyKey),
      asked: l.asked && typeof l.asked === 'object' ? l.asked : {},
      shown_count: typeof l.shown_count === 'number' ? l.shown_count : 0,
      gate_prompt_logged: l.gate_prompt_logged === true,
      gate_reached: l.gate_reached === true,
    };
  } catch {
    return emptyLedger(journeyKey);
  }
}

export function readLedger(journeyKey: string | null): Ledger {
  try {
    return ledgerFor(localStorage.getItem(LEDGER_KEY), journeyKey);
  } catch {
    return emptyLedger(journeyKey);
  }
}

function writeLedger(ledger: Ledger): void {
  try {
    localStorage.setItem(LEDGER_KEY, JSON.stringify(ledger));
  } catch { /* storage blocked */ }
}

/** Read-modify-write this journey's ledger. */
export function updateLedger(journeyKey: string | null, patch: (l: Ledger) => Partial<Ledger>): Ledger {
  const current = readLedger(journeyKey);
  const next = { ...current, ...patch(current) };
  writeLedger(next);
  return next;
}

/** Set a venue's status for this journey. 'shown' also counts toward the cap. */
export function markAsked(journeyKey: string | null, slug: string, status: AskedStatus): Ledger {
  return updateLedger(journeyKey, l => ({
    asked: { ...l.asked, [slug]: status },
    shown_count: status === 'shown' ? l.shown_count + 1 : l.shown_count,
  }));
}
