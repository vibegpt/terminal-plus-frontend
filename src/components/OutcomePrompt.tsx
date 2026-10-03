// src/components/OutcomePrompt.tsx
// The outcome strip (CC-13): "Make it to {venue}?" in the sticky header slot under the
// flight bar. Never a modal, overlay or scroll lock, and always dismissible.
//
// Two steps. Step 1 is Yes / No. Step 2 depends on the answer and is skippable:
// - Yes -> spend band, closing itself after 8 s with spend_band null.
// - No  -> "No time" (ranking right, walk-time model wrong) or "Changed my mind"
//          (ranking wrong). Those need opposite fixes.
// Closing step 1 writes outcome 'dismissed': shown-then-closed is data too.
//
// The answer is outcome_self_reported, a claim rather than a position fix.
// Eligibility rules live in src/lib/outcomePrompt.ts.

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { useJourney, hasDeparted } from '../context/JourneyContext';
import { useFlightContext } from './FlightStatusBar';
import { track } from '../lib/telemetry';
import {
  evaluateOutcome,
  gapMinMs,
  type Candidate,
  type OutcomeReason,
  type OutcomeResponsePayload,
  type SpendBand,
} from '../lib/outcomePrompt';
import { markAsked, readLedger } from '../lib/candidateTap';
import {
  isGapDebug,
  latestResume,
  outcomeDebugLog,
  subscribeResume,
  type ResumeSnapshot,
} from '../lib/lastSeen';

export const SPEND_OPTIONS: ReadonlyArray<{ band: SpendBand; label: string }> = [
  { band: 'none', label: 'Nothing' },
  { band: 'lt_10', label: 'Under S$10' },
  { band: '10_30', label: 'S$10-30' },
  { band: 'gt_30', label: 'Over S$30' },
];

const REASON_OPTIONS: ReadonlyArray<{ reason: OutcomeReason; label: string }> = [
  { reason: 'no_time', label: 'No time' },
  { reason: 'changed_mind', label: 'Changed my mind' },
];

/** The spend step closes itself after this long and writes spend_band null. */
export const SPEND_AUTO_CLOSE_MS = 8_000;

export function emitOutcomeResponse(slug: string, payload: OutcomeResponsePayload): void {
  track('outcome_response', { amenity_slug: slug, payload });
}

/**
 * Holds one outcome_response until its step 2 resolves, then writes exactly one row.
 * If the page hides or the component unmounts first, the held row is written with the
 * step-2 field still null, so a step-1 answer is never lost.
 */
export function useHeldResponse(onWritten: () => void) {
  const held = useRef<{ slug: string; payload: OutcomeResponsePayload } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onWrittenRef = useRef(onWritten);
  onWrittenRef.current = onWritten;

  const commit = useCallback((patch?: Partial<OutcomeResponsePayload>) => {
    const h = held.current;
    if (!h) return;
    held.current = null;
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    emitOutcomeResponse(h.slug, { ...h.payload, ...patch });
    onWrittenRef.current();
  }, []);

  const hold = useCallback(
    (slug: string, payload: OutcomeResponsePayload, autoCloseMs?: number) => {
      held.current = { slug, payload };
      if (autoCloseMs) timer.current = setTimeout(() => commit(), autoCloseMs);
    },
    [commit]
  );

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') commit();
    };
    const onPageHide = () => commit();
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', onPageHide);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', onPageHide);
      commit();
    };
  }, [commit]);

  return { hold, commit };
}

// ── Chips ─────────────────────────────────────────────────────────────

const CHIP: React.CSSProperties = {
  padding: '7px 13px',
  borderRadius: 999,
  border: '1px solid rgba(255,255,255,0.14)',
  background: 'rgba(255,255,255,0.06)',
  color: '#f0f0f8',
  fontSize: 13,
  fontWeight: 600,
  fontFamily: 'inherit',
  cursor: 'pointer',
};

export function SpendChips({ onPick }: { onPick: (band: SpendBand) => void }) {
  return (
    <>
      {SPEND_OPTIONS.map(o => (
        <button key={o.band} type="button" style={CHIP} onClick={() => onPick(o.band)}>
          {o.label}
        </button>
      ))}
    </>
  );
}

// ── Strip ─────────────────────────────────────────────────────────────

type Step = 'ask' | 'spend' | 'reason';

interface Strip {
  candidate: Candidate;
  journeyKey: string;
  gapMinutes: number;
  candidateAgeMinutes: number;
  step: Step;
}

// A resume is handled once per page, however often the strip remounts.
let lastHandledResume = 0;

// A resume is judged when it happens. The strip isn't mounted while the full-screen
// capture is up, so one that mounts later (after a capture) waits for the next resume,
// as it does behind the capture bar, instead of replaying an old one against a fresh
// journey's ledger. 10 s covers the normal boot, where the strip mounts within ms.
const RESUME_REPLAY_MS = 10_000;

export function OutcomePrompt() {
  const { journey } = useJourney();
  const { flight } = useFlightContext();
  const [strip, setStrip] = useState<Strip | null>(null);

  // The resume listener is registered once; it reads current state through this ref.
  const live = useRef({ journey, flight, strip });
  live.current = { journey, flight, strip };

  const close = useCallback(() => setStrip(null), []);
  const { hold, commit } = useHeldResponse(close);

  const handleResume = useCallback((s: ResumeSnapshot) => {
    if (s.id <= lastHandledResume) return;
    lastHandledResume = s.id;
    const { journey: j, flight: f, strip: current } = live.current;
    if (current) return; // a warm resume over a strip that's still up

    const journeyKey = j?.capturedAt ?? null;
    const ledger = readLedger(journeyKey);
    const v = evaluateOutcome({
      now: s.at,
      lastSeen: s.lastSeen,
      candidate: s.candidate,
      asked: ledger.asked,
      shownCount: ledger.shown_count,
      captureBarShowing: !f, // the flight bar shows "Add your flight" exactly when flight is null
      journeyActive: !!j,
      departed: hasDeparted(j),
      gapMinMs: gapMinMs(isGapDebug()),
    });
    outcomeDebugLog(`eligibility ${v.showable}:`, v.failed.join(', ') || 'all rules pass', {
      candidateEligible: v.candidateEligible,
      candidate: s.candidate?.slug ?? null,
      gapMinutes: v.gapMinutes,
      candidateAgeMinutes: v.candidateAgeMinutes,
      gapDebug: isGapDebug(),
    });

    const c = s.candidate;
    if (!c || !journeyKey || !v.candidateEligible || v.gapMinutes === null || v.candidateAgeMinutes === null) return;

    // The denominator: logged once per journey and venue, shown or not.
    if (ledger.asked[c.slug] !== 'eligible') {
      track('outcome_eligible', {
        amenity_slug: c.slug,
        payload: { candidate_type: c.type, gap_minutes: v.gapMinutes, candidate_age_minutes: v.candidateAgeMinutes },
      });
      markAsked(journeyKey, c.slug, 'eligible');
    }
    if (!v.showable) return;

    track('outcome_shown', {
      amenity_slug: c.slug,
      payload: { gap_minutes: v.gapMinutes, candidate_age_minutes: v.candidateAgeMinutes },
    });
    markAsked(journeyKey, c.slug, 'shown');
    setStrip({
      candidate: c,
      journeyKey,
      gapMinutes: v.gapMinutes,
      candidateAgeMinutes: v.candidateAgeMinutes,
      step: 'ask',
    });
  }, []);

  useEffect(() => {
    const pending = latestResume();
    if (pending && pending.id > lastHandledResume) {
      if (Date.now() - pending.at <= RESUME_REPLAY_MS) handleResume(pending);
      else {
        lastHandledResume = pending.id;
        outcomeDebugLog('resume too old to replay on mount, waiting for the next one', { kind: pending.kind });
      }
    }
    return subscribeResume(handleResume);
  }, [handleResume]);

  if (!strip) return null;
  const { candidate: c, step } = strip;

  const response = (outcome: OutcomeResponsePayload['outcome']): OutcomeResponsePayload => ({
    outcome,
    outcome_reason: null,
    outcome_source: 'prompt',
    spend_band: null,
    gap_minutes: strip.gapMinutes,
    candidate_age_minutes: strip.candidateAgeMinutes,
  });

  const answer = (outcome: 'yes' | 'no') => {
    markAsked(strip.journeyKey, c.slug, 'answered');
    if (outcome === 'yes') hold(c.slug, response('yes'), SPEND_AUTO_CLOSE_MS);
    else hold(c.slug, response('no'));
    setStrip({ ...strip, step: outcome === 'yes' ? 'spend' : 'reason' });
  };

  const onClose = () => {
    if (step === 'ask') {
      markAsked(strip.journeyKey, c.slug, 'dismissed');
      emitOutcomeResponse(c.slug, response('dismissed'));
      setStrip(null);
    } else {
      commit(); // skip step 2: the held answer is written with its step-2 field null
    }
  };

  const question =
    step === 'ask' ? `Make it to ${c.name}?` : step === 'spend' ? 'Spend anything?' : 'What happened?';

  return (
    <div
      role="region"
      aria-label="Did you make it there?"
      style={{
        marginTop: 8,
        padding: '10px 12px',
        borderRadius: 12,
        background: 'rgba(124,109,250,0.10)',
        border: '1px solid rgba(124,109,250,0.28)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: 600, color: '#f0f0f8' }}>{question}</span>
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: 'rgba(255,255,255,0.5)',
            cursor: 'pointer',
            padding: 6,
            display: 'flex',
          }}
        >
          <X size={16} />
        </button>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
        {step === 'ask' && (
          <>
            <button type="button" style={CHIP} onClick={() => answer('yes')}>Yes</button>
            <button type="button" style={CHIP} onClick={() => answer('no')}>No</button>
          </>
        )}
        {step === 'spend' && <SpendChips onPick={band => commit({ spend_band: band })} />}
        {step === 'reason' &&
          REASON_OPTIONS.map(o => (
            <button key={o.reason} type="button" style={CHIP} onClick={() => commit({ outcome_reason: o.reason })}>
              {o.label}
            </button>
          ))}
      </div>
    </div>
  );
}

export default OutcomePrompt;
