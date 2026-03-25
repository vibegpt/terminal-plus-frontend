import { useEffect, useRef } from 'react';
import {
  lookupFlight,
  flightToJourneyContext,
  saveJourneyContext,
  getJourneyContext,
} from '../services/flightService';

// Toast import for notifications
import { useToast } from './use-toast';

const POLL_INTERVAL_NORMAL = 30 * 60 * 1000; // 30 minutes
const POLL_INTERVAL_URGENT = 10 * 60 * 1000; // 10 minutes
const MAX_HOURS_AHEAD = 6;

const TERMINAL_STATUSES = ['Departed', 'Arrived', 'Cancelled', 'Landed'];

export function useFlightUpdates() {
  const { toast } = useToast();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    function shouldPoll(): boolean {
      // Don't poll if page is hidden
      if (document.visibilityState !== 'visible') return false;

      const ctx = getJourneyContext();
      if (!ctx || !ctx.flightNumber) return false;

      // Stop polling for terminal statuses
      if (TERMINAL_STATUSES.some(s => ctx.status?.toLowerCase().includes(s.toLowerCase()))) {
        return false;
      }

      // Don't poll if boarding is > 6 hours away
      if (ctx.boardingTime) {
        const boarding = new Date(ctx.boardingTime);
        const hoursAway = (boarding.getTime() - Date.now()) / (3600 * 1000);
        if (hoursAway > MAX_HOURS_AHEAD) return false;
      }

      return true;
    }

    function getInterval(): number {
      const ctx = getJourneyContext();
      if (!ctx?.scheduledDeparture) return POLL_INTERVAL_NORMAL;

      const dep = new Date(ctx.scheduledDeparture);
      const hoursUntilDeparture = (dep.getTime() - Date.now()) / (3600 * 1000);

      return hoursUntilDeparture < 2 ? POLL_INTERVAL_URGENT : POLL_INTERVAL_NORMAL;
    }

    async function poll() {
      if (!shouldPoll()) return;

      const ctx = getJourneyContext();
      if (!ctx) return;

      const result = await lookupFlight(ctx.flightNumber);
      if (!result) return;

      const newCtx = flightToJourneyContext(result);
      const oldGate = ctx.gate;
      const oldScheduled = ctx.scheduledDeparture;
      const oldStatus = ctx.status;

      // Save updated context
      saveJourneyContext(newCtx);

      // Notify on gate assignment
      if (!oldGate && newCtx.gate) {
        toast({
          title: '🚪 Gate assigned',
          description: `Your gate is ${newCtx.gate}`,
        });
      } else if (oldGate && newCtx.gate && oldGate !== newCtx.gate) {
        toast({
          title: '🚪 Gate changed',
          description: `Gate changed from ${oldGate} to ${newCtx.gate}`,
        });
      }

      // Notify on delay
      if (oldScheduled && newCtx.scheduledDeparture && oldScheduled !== newCtx.scheduledDeparture) {
        const newTime = new Date(newCtx.scheduledDeparture);
        const timeStr = newTime.toLocaleTimeString('en-SG', {
          hour: '2-digit',
          minute: '2-digit',
          timeZone: 'Asia/Singapore',
        });
        toast({
          title: '⏰ Departure time updated',
          description: `New departure time: ${timeStr}`,
        });
      }

      // Notify on cancellation
      if (oldStatus !== 'Cancelled' && newCtx.status?.toLowerCase().includes('cancel')) {
        toast({
          title: '⚠️ Flight cancelled',
          description: `${ctx.flightNumber} appears to be cancelled. Contact your airline.`,
          variant: 'destructive',
        });
      }
    }

    // Initial poll after short delay
    const initialTimeout = setTimeout(poll, 5000);

    // Set up interval
    function startPolling() {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(poll, getInterval());
    }
    startPolling();

    // Re-evaluate interval when visibility changes
    function handleVisibilityChange() {
      if (document.visibilityState === 'visible') {
        poll(); // poll immediately on return
        startPolling(); // restart interval
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearTimeout(initialTimeout);
      if (intervalRef.current) clearInterval(intervalRef.current);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [toast]);
}
