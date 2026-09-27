// api/flights/board.ts
// Vercel serverless function: SIN departures/arrivals board from AeroDataBox.
//
// GET /api/flights/board?direction=departure   -> now .. now+6h
// GET /api/flights/board?direction=arrival     -> now-120m .. now+15m
//
// Feeds the tap-only flight pickers. The picker fetches ONCE and filters the
// returned array client-side, so this endpoint is not called per keystroke.
//
// Upstream is the same host + auth header as api/flight-status.ts.

import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  groupCodeshares,
  type FlightRow,
  type RawFlight,
} from '../lib/flightGrouping';
import fixtureBoard from '../fixtures/sin-board-sample.json';

const API_KEY = process.env.AERODATABOX_API_KEY || '';
const API_BASE = 'https://prod.api.market/api/v1/aedbx/aerodatabox';

const CACHE_TTL_MS = 300_000; // 300s
const DEPARTURE_WINDOW_MIN = 6 * 60;
const ARRIVAL_LOOKBACK_MIN = 120;
const ARRIVAL_LOOKAHEAD_MIN = 15;

// Singapore is UTC+8 year-round — no DST, so a fixed offset is correct here.
const SIN_OFFSET_MS = 8 * 3_600_000;

type Direction = 'departure' | 'arrival';

interface BoardPayload {
  flights: FlightRow[];
  fetched_at: string;
  cached: boolean;
  fixture?: boolean;
  degraded?: boolean;
}

// ── Cache (separate entry per direction) ────────────────────────────
// Module scope: warm on a reused instance only. At MVP traffic most production
// requests land on a cold instance and legitimately miss.

interface CacheEntry {
  flights: FlightRow[];
  fetched_at: string;
  fixture: boolean;
  expiresAt: number;
}

const cache = new Map<Direction, CacheEntry>();

// ── Time window ─────────────────────────────────────────────────────

/** AeroDataBox wants local airport time as YYYY-MM-DDTHH:mm. */
function sinLocal(d: Date): string {
  return new Date(d.getTime() + SIN_OFFSET_MS).toISOString().slice(0, 16);
}

function windowFor(direction: Direction, now: Date): { from: string; to: string } {
  if (direction === 'departure') {
    return {
      from: sinLocal(now),
      to: sinLocal(new Date(now.getTime() + DEPARTURE_WINDOW_MIN * 60_000)),
    };
  }
  return {
    from: sinLocal(new Date(now.getTime() - ARRIVAL_LOOKBACK_MIN * 60_000)),
    to: sinLocal(new Date(now.getTime() + ARRIVAL_LOOKAHEAD_MIN * 60_000)),
  };
}

// ── Sorting ─────────────────────────────────────────────────────────
// Time only. No rank boosting of any kind.

function sortFlights(flights: FlightRow[], direction: Direction): FlightRow[] {
  return [...flights].sort((a, b) =>
    direction === 'arrival'
      ? b.scheduled_at.localeCompare(a.scheduled_at) // most recent landing first
      : a.scheduled_at.localeCompare(b.scheduled_at) // next departure first
  );
}

// ── Upstream ────────────────────────────────────────────────────────

function extractRows(body: unknown, direction: Direction): RawFlight[] {
  if (typeof body !== 'object' || body === null) return [];
  const key = direction === 'departure' ? 'departures' : 'arrivals';
  const arr = (body as Record<string, unknown>)[key];
  return Array.isArray(arr) ? (arr as RawFlight[]) : [];
}

async function fetchBoard(direction: Direction, now: Date): Promise<FlightRow[]> {
  const { from, to } = windowFor(direction, now);
  const apiDirection = direction === 'departure' ? 'Departure' : 'Arrival';

  // withCodeshared stays TRUE: a passenger holding LH9756 is physically on
  // SQ322 and must be able to find their flight. Duplicate rows are collapsed
  // by groupCodeshares, not hidden by the upstream filter.
  const params = new URLSearchParams({
    direction: apiDirection,
    withCodeshared: 'true',
    withCargo: 'false',
    withPrivate: 'false',
  });

  const url =
    `${API_BASE}/flights/airports/iata/SIN/${from}/${to}?${params.toString()}`;

  const response = await fetch(url, {
    headers: { 'x-api-market-key': API_KEY, Accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`upstream ${response.status}`);
  }

  // An empty board is 204 No Content — response.json() throws on an empty body.
  if (response.status === 204) {
    console.log(`[board] ${direction} upstream 204 (empty board)`);
    return [];
  }

  const rows = extractRows(await response.json(), direction);
  const { flights, stats } = groupCodeshares(rows, direction);

  // Logged on upstream fetch only, never on a cache hit. Within a day of real
  // traffic these say whether the composite heuristic holds.
  console.log(
    `[board] codeshare_group_stats ${direction} ${JSON.stringify(stats)}`
  );

  return flights;
}

// ── Handler ─────────────────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const raw = req.query.direction;
  const direction = typeof raw === 'string' ? raw.toLowerCase() : '';
  if (direction !== 'departure' && direction !== 'arrival') {
    return res
      .status(400)
      .json({ error: "direction must be 'departure' or 'arrival'" });
  }

  const now = new Date();

  const hit = cache.get(direction);
  if (hit && hit.expiresAt > now.getTime()) {
    console.log(`[board] cache HIT ${direction}`);
    const payload: BoardPayload = {
      flights: sortFlights(hit.flights, direction),
      fetched_at: hit.fetched_at,
      cached: true,
    };
    if (hit.fixture) payload.fixture = true;
    return res.status(200).json(payload);
  }
  console.log(`[board] cache MISS ${direction}`);

  // No key configured.
  if (!API_KEY) {
    if (process.env.NODE_ENV === 'production') {
      // Never serve fabricated flights to a real passenger.
      console.error(
        '[board] AERODATABOX_API_KEY missing in production — serving degraded'
      );
      const payload: BoardPayload = {
        flights: [],
        fetched_at: now.toISOString(),
        cached: false,
        degraded: true,
      };
      return res.status(200).json(payload);
    }

    console.warn(
      '\n' +
        '='.repeat(72) +
        '\n[board] AERODATABOX_API_KEY MISSING — SERVING FIXTURE DATA.\n' +
        '[board] These flights are NOT REAL. Any screenshot taken now is not\n' +
        '[board] evidence for a live-data acceptance criterion.\n' +
        '='.repeat(72)
    );
    const rows = extractRows(fixtureBoard, direction);
    const { flights, stats } = groupCodeshares(rows, direction);
    console.log(
      `[board] codeshare_group_stats ${direction} (FIXTURE) ${JSON.stringify(stats)}`
    );
    cache.set(direction, {
      flights,
      fetched_at: now.toISOString(),
      fixture: true,
      expiresAt: now.getTime() + CACHE_TTL_MS,
    });
    return res.status(200).json({
      flights: sortFlights(flights, direction),
      fetched_at: now.toISOString(),
      cached: false,
      fixture: true,
    } satisfies BoardPayload);
  }

  try {
    const flights = await fetchBoard(direction, now);
    cache.set(direction, {
      flights,
      fetched_at: now.toISOString(),
      fixture: false,
      expiresAt: now.getTime() + CACHE_TTL_MS,
    });
    return res.status(200).json({
      flights: sortFlights(flights, direction),
      fetched_at: now.toISOString(),
      cached: false,
    } satisfies BoardPayload);
  } catch (err) {
    // 200 with an empty board, never a dead end: the UI falls back to typed entry.
    console.error('[board] upstream failed:', err);
    return res.status(200).json({
      flights: [],
      fetched_at: now.toISOString(),
      cached: false,
      degraded: true,
    } satisfies BoardPayload);
  }
}
