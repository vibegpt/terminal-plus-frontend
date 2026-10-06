// shared/ranking/landsideCopy.ts
// Every string the landside and open-now rules show, on every surface (pages,
// flight bar, capture, chat cards, MCP). The thresholds live in policy.ts; the
// strings that quote one take it as an argument, so no number is written here.

/** 180 → "3 hours", 90 → "90 minutes". */
export function durationText(minutes: number): string {
  return minutes >= 120 && minutes % 60 === 0 ? `${minutes / 60} hours` : `${minutes} minutes`;
}

export const LANDSIDE_COPY = {
  /** Card label for a landside venue that's shown. */
  label: {
    departing: 'Before immigration',
    connecting: 'Landside: clear immigration both ways (visa rules apply)',
    unknown: 'Landside: outside immigration',
  },
  /** Why a landside venue is hidden. Shown on the venue's page, saved items and the map. */
  reason: {
    connecting: (minMinutes: number) =>
      `This is landside. A connection under ${durationText(minMinutes)} doesn't leave time to clear immigration both ways.`,
    departing: (minMinutes: number) =>
      `This is landside. With under ${durationText(minMinutes)} to boarding, it's time to go through immigration.`,
    /** Departing or connecting with no boarding time (the onward flight was skipped). */
    noTime: "This is landside. Add your onward flight to see if there's time to clear immigration.",
  },
} as const;

export const HOURS_COPY = {
  /** One-word status; unknown hours are never called open or closed. */
  state: { open: 'Open', closed: 'Closed', unknown: 'Hours' },
  /** The short line under the status on a venue's page. */
  allDay: '24 hours',
  until: (hhmm: string) => `Until ${hhmm}`,
  seeBelow: 'See below',
  open24: 'Open 24 hours',
  openUntil: (hhmm: string) => `Open until ${hhmm}`,
  /** A venue that's closed now (amenity page, saved, any list that shows it). */
  closedOpens: (hhmm: string) => `Closed · Opens ${hhmm}`,
  /** A list filled with a venue that opens soon. */
  opensAt: (hhmm: string) => `Opens ${hhmm}`,
  /** Hours we can't read: shown as written, never as open or closed. */
  notListed: 'Hours not listed',
} as const;

/** Places outside the venue lists that mention Jewel. */
export const JEWEL_COPY = {
  /** Flight bar call to action with time to spare. */
  ctaShown: 'Explore Jewel →',
  ctaHidden: 'Explore the terminal →',
  /** Capture, last step. */
  captureShownTitle: 'Jewel Changi is within reach',
  captureShownDetail: 'You have time to explore',
  captureHiddenTitle: 'Jewel Changi: not this time',
} as const;

export const LIST_COPY = {
  /** A collection whose venues are all closed now (and none opens soon). */
  nothingOpen: 'Nothing here is open right now. Check back later.',
  /** Search, when matches were left out because they're closed. */
  closedHidden: (n: number) => `${n} closed ${n === 1 ? 'match' : 'matches'} not shown.`,
} as const;
