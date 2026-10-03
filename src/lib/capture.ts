// src/lib/capture.ts
// Where the flight capture flow was opened from, and the session-scoped
// dismissal of the "Add flight" bar on page routes.

/**
 * Sent as capture_opened {entry} (api/events.ts allowlists these values):
 * - gate: the full-screen capture on a Home landing
 * - bar: "Add flight" on the slim bar shown on page routes
 * - prompt: Home's header prompt or the desktop sidebar's "Add Flight"
 * - change_flight: "Change flight" on an existing journey
 */
export type CaptureEntry = 'gate' | 'bar' | 'prompt' | 'change_flight';

// sessionStorage: the bar comes back in a new session until a journey exists.
const BAR_DISMISSED_KEY = 'tp_add_flight_bar_dismissed';

export function isAddFlightBarDismissed(): boolean {
  try {
    return sessionStorage.getItem(BAR_DISMISSED_KEY) === '1';
  } catch {
    return false;
  }
}

export function dismissAddFlightBar(): void {
  try {
    sessionStorage.setItem(BAR_DISMISSED_KEY, '1');
  } catch { /* storage blocked: the bar just stays */ }
}
