// src/lib/sgTime.ts
// Changi runs on Singapore time (UTC+8, no daylight saving). Everything the app shows or
// decides by the clock uses it: opening hours, time-of-day picks, "today". The traveller's
// phone may still be on home time, so never read the device clock for these.

const SGT_OFFSET_MS = 8 * 60 * 60 * 1000;

function sgWallClock(at: Date | number = Date.now()): Date {
  const ms = typeof at === 'number' ? at : at.getTime();
  // A Date whose UTC fields read as Singapore wall-clock time.
  return new Date(ms + SGT_OFFSET_MS);
}

/** Hour of the day in Singapore, 0 to 23. */
export function sgHour(at?: Date | number): number {
  return sgWallClock(at).getUTCHours();
}

/** Minutes since midnight in Singapore, 0 to 1439. */
export function sgMinutesOfDay(at?: Date | number): number {
  const d = sgWallClock(at);
  return d.getUTCHours() * 60 + d.getUTCMinutes();
}

/** Calendar date in Singapore, as YYYY-MM-DD. */
export function sgDateKey(at?: Date | number): string {
  return sgWallClock(at).toISOString().slice(0, 10);
}
