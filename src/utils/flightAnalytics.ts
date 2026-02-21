// src/utils/flightAnalytics.ts
// Flight context analytics events — console.log fallback (no gtag service found)

type FlightEvent =
  | 'flight_banner_shown'
  | 'flight_banner_expanded'
  | 'flight_banner_dismissed'
  | 'flight_number_submitted'
  | 'flight_lookup_success'
  | 'flight_lookup_failed'
  | 'flight_context_cleared'
  | 'vibe_reorder_with_flight';

export function trackFlightEvent(event: FlightEvent, data?: Record<string, unknown>): void {
  // Use window.gtag if available, otherwise console.log
  if (typeof window !== 'undefined' && 'gtag' in window && typeof (window as any).gtag === 'function') {
    (window as any).gtag('event', event, data);
  } else {
    console.log('[Analytics]', event, data || {});
  }
}
