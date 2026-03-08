// api/flight-status.ts
// Vercel serverless function: proxies flight lookup to AeroDataBox (RapidAPI).
// GET /api/flight-status?number=SQ321&date=2026-03-07
//
// Returns enriched flight data with gate, terminal, destination, boarding time.

import type { VercelRequest, VercelResponse } from '@vercel/node';

const API_KEY = process.env.AERODATABOX_API_KEY || '';
const API_HOST = 'aerodatabox.p.rapidapi.com';

function mapTerminal(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (/^\d$/.test(trimmed)) return `SIN-T${trimmed}`;
  return `SIN-${trimmed.toUpperCase()}`;
}

function estimateBoardingTime(scheduledDepartureIso: string): string {
  const dep = new Date(scheduledDepartureIso);
  return new Date(dep.getTime() - 35 * 60_000).toISOString();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=60');

  const { number, date } = req.query;

  if (!number || typeof number !== 'string') {
    return res.status(400).json({ error: 'Missing flight number' });
  }

  if (!API_KEY) {
    return res.status(503).json({ error: 'Flight API not configured' });
  }

  const flightNumber = number.toUpperCase().replace(/\s/g, '');

  // Default to today in Singapore timezone
  const dateStr =
    typeof date === 'string' && date
      ? date
      : new Date(Date.now() + 8 * 3600_000)
          .toISOString()
          .slice(0, 10);

  try {
    const url = `https://aerodatabox.p.rapidapi.com/flights/number/${encodeURIComponent(flightNumber)}/${dateStr}`;

    const response = await fetch(url, {
      headers: {
        'x-rapidapi-key': API_KEY,
        'x-rapidapi-host': API_HOST,
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return res.status(404).json({ error: 'Flight not found' });
      }
      return res.status(response.status).json({ error: 'API request failed' });
    }

    const flights = await response.json();

    if (!Array.isArray(flights) || flights.length === 0) {
      return res.status(404).json({ error: 'Flight not found' });
    }

    // Find the segment involving SIN (departure or arrival)
    const sinFlight = flights.find(
      (f: any) =>
        f.departure?.airport?.iata === 'SIN' ||
        f.arrival?.airport?.iata === 'SIN'
    );

    if (!sinFlight) {
      return res.status(404).json({ error: 'No SIN segment found for this flight' });
    }

    const dep = sinFlight.departure || {};
    const arr = sinFlight.arrival || {};
    const isDepartingFromSIN = dep.airport?.iata === 'SIN';

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
    });
  } catch (err) {
    console.error('[api/flight-status] Error:', err);
    return res.status(500).json({ error: 'Lookup failed' });
  }
}
