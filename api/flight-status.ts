import type { VercelRequest, VercelResponse } from '@vercel/node';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// ---------- Load .env.local for vercel dev ----------
try {
  const envPath = resolve(process.cwd(), '.env.local');
  const envContent = readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx);
    let val = trimmed.slice(eqIdx + 1);
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
} catch { /* .env.local not found in production */ }

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { flight, date } = req.query;

  if (!flight || typeof flight !== 'string') {
    return res.status(400).json({ error: 'Missing flight parameter' });
  }

  // Default to today Singapore time if no date
  const queryDate = (typeof date === 'string' && date)
    ? date
    : new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Singapore' });

  // Clean flight number: remove spaces, uppercase
  const cleanFlight = flight.replace(/\s+/g, '').toUpperCase();

  const apiKey = process.env.AERODATABOX_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    const response = await fetch(
      `https://aerodatabox.p.rapidapi.com/flights/number/${cleanFlight}/${queryDate}`,
      {
        headers: {
          'X-RapidAPI-Key': apiKey,
          'X-RapidAPI-Host': 'aerodatabox.p.rapidapi.com',
        },
      },
    );

    if (!response.ok) {
      if (response.status === 404) {
        return res.status(404).json({ error: 'Flight not found' });
      }
      if (response.status === 429) {
        return res.status(429).json({ error: 'Rate limited. Try again later.' });
      }
      return res.status(response.status).json({ error: 'API error' });
    }

    const data = await response.json();

    // AeroDataBox returns an array of flight segments
    const flights = Array.isArray(data) ? data : [data];

    // Find the segment relevant to SIN (Changi)
    const sinSegment = flights.find(
      (f: any) =>
        f.departure?.airport?.iata === 'SIN' ||
        f.arrival?.airport?.iata === 'SIN',
    ) || flights[0];

    if (!sinSegment) {
      return res.status(404).json({ error: 'No SIN segment found' });
    }

    // Determine if user is departing from or arriving at SIN
    const isDepartingFromSIN = sinSegment.departure?.airport?.iata === 'SIN';
    const relevantLeg = isDepartingFromSIN ? sinSegment.departure : sinSegment.arrival;
    const otherLeg = isDepartingFromSIN ? sinSegment.arrival : sinSegment.departure;

    // Extract what we need
    const result = {
      flightNumber: cleanFlight,
      airline: sinSegment.airline?.name || null,
      status: sinSegment.status || 'Unknown',

      // SIN-side details
      terminal: relevantLeg?.terminal || null,
      gate: relevantLeg?.gate || null,

      // Times
      scheduledTime: relevantLeg?.scheduledTime?.local || null,
      revisedTime: relevantLeg?.revisedTime?.local || null,
      actualTime: relevantLeg?.actualTime?.local || null,

      // The "other" airport
      destination: isDepartingFromSIN ? (otherLeg?.airport?.iata || null) : null,
      origin: !isDepartingFromSIN ? (otherLeg?.airport?.iata || null) : null,

      // Boarding time estimate: scheduledTime minus 35 minutes
      estimatedBoardingTime: null as string | null,

      isDepartingFromSIN,
    };

    // Calculate boarding time from best available departure time
    const depTimeStr = result.revisedTime || result.scheduledTime;
    if (depTimeStr && isDepartingFromSIN) {
      try {
        const depTime = new Date(depTimeStr);
        if (!isNaN(depTime.getTime())) {
          const boardingTime = new Date(depTime.getTime() - 35 * 60 * 1000);
          result.estimatedBoardingTime = boardingTime.toISOString();
        }
      } catch {
        // If date parsing fails, leave null
      }
    }

    // Cache for 5 minutes
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=60');

    return res.status(200).json(result);
  } catch (error) {
    console.error('Flight API error:', error);
    return res.status(500).json({ error: 'Failed to fetch flight data' });
  }
}
