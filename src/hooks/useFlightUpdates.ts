// src/hooks/useFlightUpdates.ts
// Background polling for gate/delay updates via AeroDataBox

import { useEffect, useRef, useCallback } from 'react';
import { useJourney } from '../context/JourneyContext';
import { lookupFlight } from '../services/flightService';

type ToastInfo = { message: string; type: 'gate' | 'delay' | 'cancelled' };

let showToastCallback: ((info: ToastInfo) => void) | null = null;

export function setFlightToastHandler(cb: (info: ToastInfo) => void) {
  showToastCallback = cb;
}

function getPollingInterval(boardingTimeIso: string): number | null {
  const minsToBoarding = Math.floor(
    (new Date(boardingTimeIso).getTime() - Date.now()) / 60_000
  );

  // Don't poll if > 6h away or flight is in the past
  if (minsToBoarding > 360 || minsToBoarding < -30) return null;

  // < 2h → poll every 10 min
  if (minsToBoarding <= 120) return 10 * 60_000;

  // 2h – 6h → poll every 30 min
  return 30 * 60_000;
}

export function useFlightUpdates() {
  const { journey, setJourney } = useJourney();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const poll = useCallback(async () => {
    if (!journey?.departingFlight || journey.departingFlight === 'UNKNOWN' || journey.departingFlight === 'SQ000') {
      return;
    }

    // Skip if tab is hidden
    if (document.visibilityState !== 'visible') return;

    const data = await lookupFlight(journey.departingFlight);
    if (!data) return;

    let updated = false;
    const updates: Partial<typeof journey> = {};

    // Gate change
    if (data.gate && data.gate !== journey.gate) {
      updates.gate = data.gate;
      updated = true;
      showToastCallback?.({
        message: journey.gate ? `Gate changed: ${data.gate}` : `Gate assigned: ${data.gate}`,
        type: 'gate',
      });
    }

    // Delay / revised time
    if (data.revisedTime && data.revisedTime !== journey.scheduledDeparture) {
      updates.status = 'Delayed';
      updated = true;
      showToastCallback?.({
        message: `Flight delayed — new time available`,
        type: 'delay',
      });
    }

    // Boarding time update
    if (data.estimatedBoardingTime && data.estimatedBoardingTime !== journey.boardingTime) {
      updates.boardingTime = data.estimatedBoardingTime;
      updated = true;
    }

    // Destination (if we didn't have it)
    if (data.destination && !journey.destination) {
      updates.destination = data.destination;
      updated = true;
    }

    // Cancelled
    if (data.status?.toLowerCase().includes('cancelled')) {
      updates.status = 'Cancelled';
      updated = true;
      showToastCallback?.({
        message: `Flight ${journey.departingFlight} CANCELLED`,
        type: 'cancelled',
      });
    }

    if (updated) {
      const newJourney = {
        ...journey,
        ...updates,
        lastUpdated: new Date().toISOString(),
      };
      setJourney(newJourney);
    }
  }, [journey, setJourney]);

  useEffect(() => {
    if (!journey?.boardingTime) return;

    const interval = getPollingInterval(journey.boardingTime);
    if (!interval) return;

    // Initial poll after 5s
    timerRef.current = setTimeout(() => {
      poll();
      // Then regular interval
      timerRef.current = setInterval(poll, interval) as any;
    }, 5_000);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        clearInterval(timerRef.current);
      }
    };
  }, [journey?.boardingTime, journey?.departingFlight, poll]);
}
