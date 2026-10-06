// src/lib/eligibility.ts
// The passenger, the minutes to boarding and the Singapore clock that
// shared/ranking/policy.ts decides with, read from the stored journey.

import { useEffect, useMemo, useState } from 'react';
import { useJourney, type JourneyData } from '@/context/JourneyContext';
import { sgMinutesOfDay } from '@/lib/sgTime';
import { knownJourneyType, type EligibilityContext } from '../../shared/ranking/policy';

// Written when the onward flight is skipped: not real flights, so no minutes.
const PLACEHOLDER_FLIGHTS = new Set(['SQ000', 'UNKNOWN']);

// Test clock: localStorage.tp_clock_sgt = "00:30" sets the Singapore time the
// rules use, on DEV and VITE_TP_DEBUG=1 builds only (Preview, never production).
const CLOCK_KEY = 'tp_clock_sgt';
const DEBUG_BUILD = import.meta.env.DEV || import.meta.env.VITE_TP_DEBUG === '1';

/** Minutes since midnight, Singapore time, or the test clock on a debug build. */
export function sgtNow(now: number = Date.now()): number {
  if (DEBUG_BUILD) {
    try {
      const m = localStorage.getItem(CLOCK_KEY)?.match(/^([01]\d|2[0-3]):([0-5]\d)$/);
      if (m) return Number(m[1]) * 60 + Number(m[2]);
    } catch { /* storage blocked */ }
  }
  return sgMinutesOfDay(now);
}

/** Minutes to boarding from the stored journey; null with no journey or a skipped onward flight. */
export function minutesToBoarding(
  journey: Pick<JourneyData, 'departingFlight' | 'boardingTime'> | null | undefined,
  now: number = Date.now(),
): number | null {
  if (!journey?.departingFlight || PLACEHOLDER_FLIGHTS.has(journey.departingFlight)) return null;
  const ms = Date.parse(journey.boardingTime);
  return Number.isNaN(ms) ? null : Math.floor((ms - now) / 60_000);
}

export function eligibilityFromJourney(
  journey: JourneyData | null | undefined,
  now: number = Date.now(),
): EligibilityContext {
  return {
    journeyType: knownJourneyType(journey?.journey_type),
    minutesToBoarding: minutesToBoarding(journey, now),
    nowSgt: sgtNow(now),
  };
}

/** The current context, re-read every minute. */
export function useEligibility(): EligibilityContext {
  const { journey } = useJourney();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);
  const ctx = eligibilityFromJourney(journey, now);
  const { journeyType, minutesToBoarding: minutes, nowSgt } = ctx;
  return useMemo(
    () => ({ journeyType, minutesToBoarding: minutes, nowSgt }),
    [journeyType, minutes, nowSgt],
  );
}
