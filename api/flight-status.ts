// api/flight-status.ts
// Vercel serverless function: proxies flight lookup to AeroDataBox via api.market.
// GET /api/flight-status?number=SQ321[&date=2026-03-07][&leg=departure|arrival]
//
// Returns enriched flight data with gate, terminal, destination, boarding time.
//
// Leg selection: AeroDataBox matches the requested date at either end of a flight, so an
// overnight leg that left SIN yesterday (and lands today) also comes back for today, often
// first. We pick the leg whose SIN-side local date is the requested date (default: today in
// Singapore), prefer a departure from SIN, and look at tomorrow once when today's departure
// has already gone.

import type { VercelRequest, VercelResponse } from '@vercel/node';

const API_KEY = process.env.AERODATABOX_API_KEY || '';
const API_BASE = 'https://prod.api.market/api/v1/aedbx/aerodatabox';
const SGT_OFFSET_MS = 8 * 3600_000; // Singapore is UTC+8 year-round
const DEPARTED_GRACE_MS = 60 * 60_000; // today's departure counts as gone 1h after it leaves

export type Leg = 'departure' | 'arrival';

function mapTerminal(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (/^\d$/.test(trimmed)) return `SIN-T${trimmed}`;
  return `SIN-${trimmed.toUpperCase()}`;
}

/** AeroDataBox times look like "2026-09-25 15:20Z" or "2026-09-25 23:20+08:00". */
export function parseAdbTime(value: unknown): number {
  return typeof value === 'string' && value ? Date.parse(value.replace(' ', 'T')) : NaN;
}

/** Calendar date in Singapore for an instant, as YYYY-MM-DD. */
export function sgtDate(ms: number): string {
  return new Date(ms + SGT_OFFSET_MS).toISOString().slice(0, 10);
}

function nextDate(date: string): string {
  return new Date(Date.parse(`${date}T00:00:00Z`) + 86_400_000).toISOString().slice(0, 10);
}

function estimateBoardingTime(departure: string): string | null {
  const ms = parseAdbTime(departure);
  return Number.isNaN(ms) ? null : new Date(ms - 35 * 60_000).toISOString();
}

function sinSide(flight: any, leg: Leg): any {
  return (leg === 'departure' ? flight?.departure : flight?.arrival) ?? {};
}

/** Local date at the SIN end of a leg. */
function sinLocalDate(side: any): string | null {
  const local = side?.scheduledTime?.local;
  if (typeof local === 'string' && /^\d{4}-\d{2}-\d{2}/.test(local)) return local.slice(0, 10);
  const ms = parseAdbTime(side?.scheduledTime?.utc);
  return Number.isNaN(ms) ? null : sgtDate(ms);
}

/** Best known time at the SIN end: revised if present, else scheduled. */
export function sinSideTime(side: any): number {
  const revised = parseAdbTime(side?.revisedTime?.utc);
  return Number.isNaN(revised) ? parseAdbTime(side?.scheduledTime?.utc) : revised;
}

/**
 * The leg the passenger is on: one that leaves (or lands at) SIN on `date`, SIN local
 * time. Without an explicit leg, a departure from SIN wins over an arrival.
 */
export function selectSinLeg(
  flights: any[],
  opts: { date: string; leg?: Leg }
): { flight: any; leg: Leg } | null {
  const legs: Leg[] = opts.leg ? [opts.leg] : ['departure', 'arrival'];
  const timeOf = (flight: any, leg: Leg): number => {
    const t = sinSideTime(sinSide(flight, leg));
    return Number.isNaN(t) ? Number.POSITIVE_INFINITY : t;
  };
  for (const leg of legs) {
    const candidates = flights
      .filter(
        (f) =>
          sinSide(f, leg).airport?.iata === 'SIN' &&
          sinLocalDate(sinSide(f, leg)) === opts.date
      )
      .sort((a, b) => timeOf(a, leg) - timeOf(b, leg));
    if (candidates.length > 0) return { flight: candidates[0], leg };
  }
  return null;
}

type Fetched = { ok: true; flights: any[] } | { ok: false; status: number };

async function fetchFlights(flightNumber: string, date: string): Promise<Fetched> {
  const url = `${API_BASE}/flights/number/${encodeURIComponent(flightNumber)}/${date}`;
  const response = await fetch(url, {
    headers: {
      'x-api-market-key': API_KEY,
      'Accept': 'application/json',
    },
  });
  // 204 means no flights on that date: treat it like 404
  if (response.status === 204 || response.status === 404) return { ok: true, flights: [] };
  if (!response.ok) return { ok: false, status: response.status };
  const body = await response.json();
  return { ok: true, flights: Array.isArray(body) ? body : [] };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=60');

  const { number, date, leg } = req.query;

  if (!number || typeof number !== 'string') {
    return res.status(400).json({ error: 'Missing flight number' });
  }

  if (!API_KEY) {
    return res.status(503).json({ error: 'Flight API not configured' });
  }

  const flightNumber = number.toUpperCase().replace(/\s/g, '');
  const requestedLeg: Leg | undefined =
    leg === 'departure' || leg === 'arrival' ? leg : undefined;

  // Default to today in Singapore
  const today = sgtDate(Date.now());
  const dateStr =
    typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : today;

  try {
    const first = await fetchFlights(flightNumber, dateStr);
    if (!first.ok) {
      return res.status(first.status).json({ error: 'API request failed' });
    }

    let pick = selectSinLeg(first.flights, { date: dateStr, leg: requestedLeg });

    // Nothing at SIN today, or today's departure has already gone: try tomorrow once.
    // Covers after-midnight departures and evenings after today's flight has left.
    const departedAlready =
      pick?.leg === 'departure' &&
      sinSideTime(pick.flight.departure) < Date.now() - DEPARTED_GRACE_MS;
    if (dateStr === today && requestedLeg !== 'arrival' && (!pick || departedAlready)) {
      const tomorrow = nextDate(dateStr);
      const second = await fetchFlights(flightNumber, tomorrow);
      const next = second.ok
        ? selectSinLeg(second.flights, { date: tomorrow, leg: requestedLeg })
        : null;
      if (next) pick = next;
    }

    if (!pick) {
      const touchesSin = first.flights.some(
        (f: any) => f?.departure?.airport?.iata === 'SIN' || f?.arrival?.airport?.iata === 'SIN'
      );
      const error =
        first.flights.length === 0
          ? 'Flight not found'
          : touchesSin
            ? 'No SIN leg on that date'
            : 'No SIN segment found for this flight';
      return res.status(404).json({ error });
    }

    const sinFlight = pick.flight;
    const dep = sinFlight.departure || {};
    const arr = sinFlight.arrival || {};
    const isDepartingFromSIN = pick.leg === 'departure';

    // Extract terminal/gate from the SIN side
    const sinLeg = isDepartingFromSIN ? dep : arr;
    const otherLeg = isDepartingFromSIN ? arr : dep;

    const rawTerminal = sinLeg.terminal;
    const terminal = mapTerminal(rawTerminal);
    const gate = sinLeg.gate || null;

    // Times
    const scheduledTime = isDepartingFromSIN
      ? dep.scheduledTime?.utc || dep.scheduledTime?.local || null
      : arr.scheduledTime?.utc || arr.scheduledTime?.local || null;

    const revisedTime = isDepartingFromSIN
      ? dep.revisedTime?.utc || dep.revisedTime?.local || null
      : arr.revisedTime?.utc || arr.revisedTime?.local || null;

    // Boarding time estimate (only for departures from SIN)
    let estimatedBoardingTime: string | null = null;
    if (isDepartingFromSIN) {
      const depTime = revisedTime || scheduledTime;
      if (depTime) {
        estimatedBoardingTime = estimateBoardingTime(depTime);
      }
    }

    // Destination / origin
    const destination = isDepartingFromSIN
      ? otherLeg.airport?.iata || otherLeg.airport?.name || null
      : null;
    const origin = !isDepartingFromSIN
      ? otherLeg.airport?.iata || otherLeg.airport?.name || null
      : null;

    // Status
    const status = sinFlight.status || 'Unknown';
    const airline = sinFlight.airline?.name || null;

    return res.json({
      flightNumber,
      airline,
      status,
      terminal,
      gate,
      scheduledTime,
      revisedTime,
      estimatedBoardingTime,
      destination,
      origin,
      isDepartingFromSIN,
      leg: pick.leg,
      date: sinLocalDate(sinLeg),
    });
  } catch (err) {
    console.error('[api/flight-status] Error:', err);
    return res.status(500).json({ error: 'Lookup failed' });
  }
}
