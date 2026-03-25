// api/flight.ts
// Vercel serverless function: proxies flight lookup to AviationStack API.
// Required because AviationStack free plan is HTTP-only (CORS blocked in browser).
//
// GET /api/flight?number=SQ123&type=departure
// GET /api/flight?number=QF1&type=arrival
//
// Returns:
// {
//   flightNumber, terminal, scheduledTime, boardingTime, gate, status
// }

import type { VercelRequest, VercelResponse } from '@vercel/node';

const API_KEY =
  process.env.AVIATIONSTACK_KEY || process.env.VITE_AVIATIONSTACK_KEY || '';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const { number, type } = req.query;

  if (!number || typeof number !== 'string') {
    return res.status(400).json({ error: 'Missing flight number' });
  }

  if (!API_KEY) {
    return res.status(503).json({ error: 'Flight API not configured' });
  }

  const flightIata = number.toUpperCase().replace(/\s/g, '');
  const isDeparture = type !== 'arrival';

  // Build AviationStack query
  const params = new URLSearchParams({
    access_key: API_KEY,
    flight_iata: flightIata,
    limit: '3',
    ...(isDeparture ? { dep_iata: 'SIN' } : { arr_iata: 'SIN' }),
  });

  try {
    const response = await fetch(
      `http://api.aviationstack.com/v1/flights?${params.toString()}`
    );

    if (!response.ok) {
      return res.status(response.status).json({ error: 'API request failed' });
    }

    const data = await response.json();

    if (!data.data || data.data.length === 0) {
      return res.status(404).json({ error: 'Flight not found' });
    }

    // Use most recent entry
    const f = data.data[0];
    const leg = isDeparture ? f.departure : f.arrival;

    // AviationStack returns terminal as "3", "1", etc. → map to SIN-T3
    const rawTerminal = leg?.terminal;
    let terminal: string | null = null;
    if (rawTerminal) {
      terminal = rawTerminal.match(/^\d$/)
        ? `SIN-T${rawTerminal}`
        : `SIN-${rawTerminal.toUpperCase()}`;
    }

    const scheduledTime: string | null = leg?.scheduled ?? null;

    // Boarding time = scheduled departure - 40 min (industry standard for SIN)
    let boardingTime: string | null = null;
    if (isDeparture && scheduledTime) {
      const scheduled = new Date(scheduledTime);
      boardingTime = new Date(scheduled.getTime() - 40 * 60_000).toISOString();
    }

    return res.json({
      flightNumber: flightIata,
      terminal,
      scheduledTime,
      boardingTime,
      gate: leg?.gate ?? null,
      status: f.flight_status ?? 'scheduled',
    });
  } catch (err) {
    console.error('[api/flight] Error:', err);
    return res.status(500).json({ error: 'Lookup failed' });
  }
}
