// src/services/flightLookupService.ts
// Flight lookup: AviationStack API (if key exists) → local DB fallback

export interface FlightContext {
  flightNumber: string;
  airline: string;
  departureTime: string | null;   // ISO — null if from local DB
  boardingTime: string | null;    // departure minus 35 min
  gate: string;
  terminal: string;               // "T3"
  origin: string;                 // IATA code
  destination: string;            // IATA code
  flightDurationMinutes: number;
  minutesUntilBoarding: number;   // 0 if unknown
  circadianState: 'morning' | 'afternoon' | 'evening' | 'night';
  journeyPhase: 'departure' | 'transit' | 'arrival';
  hasRealTimeData: boolean;
}

// ── Local flight database ──────────────────────────────────────────
const SIN_COMMON_FLIGHTS: Record<string, {
  airline: string;
  route: string[];
  sinTerminal: string;
  durationMin: number;
  originTz: string;
  destTz: string;
}> = {
  'SQ317': { airline: 'Singapore Airlines', route: ['SIN','LHR'], sinTerminal: 'T3', durationMin: 780, originTz: 'Asia/Singapore', destTz: 'Europe/London' },
  'SQ318': { airline: 'Singapore Airlines', route: ['LHR','SIN'], sinTerminal: 'T3', durationMin: 780, originTz: 'Europe/London', destTz: 'Asia/Singapore' },
  'SQ221': { airline: 'Singapore Airlines', route: ['SIN','SYD'], sinTerminal: 'T3', durationMin: 480, originTz: 'Asia/Singapore', destTz: 'Australia/Sydney' },
  'SQ222': { airline: 'Singapore Airlines', route: ['SYD','SIN'], sinTerminal: 'T3', durationMin: 480, originTz: 'Australia/Sydney', destTz: 'Asia/Singapore' },
  'SQ25':  { airline: 'Singapore Airlines', route: ['SIN','FRA'], sinTerminal: 'T3', durationMin: 720, originTz: 'Asia/Singapore', destTz: 'Europe/Berlin' },
  'SQ26':  { airline: 'Singapore Airlines', route: ['FRA','SIN'], sinTerminal: 'T3', durationMin: 720, originTz: 'Europe/Berlin', destTz: 'Asia/Singapore' },
  'SQ321': { airline: 'Singapore Airlines', route: ['SIN','MEL'], sinTerminal: 'T3', durationMin: 480, originTz: 'Asia/Singapore', destTz: 'Australia/Melbourne' },
  'SQ322': { airline: 'Singapore Airlines', route: ['MEL','SIN'], sinTerminal: 'T3', durationMin: 480, originTz: 'Australia/Melbourne', destTz: 'Asia/Singapore' },
  'QF1':   { airline: 'Qantas', route: ['SYD','SIN','LHR'], sinTerminal: 'T1', durationMin: 480, originTz: 'Australia/Sydney', destTz: 'Europe/London' },
  'QF2':   { airline: 'Qantas', route: ['LHR','SIN','SYD'], sinTerminal: 'T1', durationMin: 780, originTz: 'Europe/London', destTz: 'Australia/Sydney' },
  'EK404': { airline: 'Emirates', route: ['SYD','SIN','DXB'], sinTerminal: 'T1', durationMin: 480, originTz: 'Australia/Sydney', destTz: 'Asia/Dubai' },
  'EK405': { airline: 'Emirates', route: ['DXB','SIN','SYD'], sinTerminal: 'T1', durationMin: 420, originTz: 'Asia/Dubai', destTz: 'Australia/Sydney' },
  'TR12':  { airline: 'Scoot', route: ['SIN','BKK'], sinTerminal: 'T1', durationMin: 150, originTz: 'Asia/Singapore', destTz: 'Asia/Bangkok' },
  'TR13':  { airline: 'Scoot', route: ['BKK','SIN'], sinTerminal: 'T1', durationMin: 150, originTz: 'Asia/Bangkok', destTz: 'Asia/Singapore' },
  '3K691': { airline: 'Jetstar Asia', route: ['SIN','HKG'], sinTerminal: 'T1', durationMin: 240, originTz: 'Asia/Singapore', destTz: 'Asia/Hong_Kong' },
  '3K692': { airline: 'Jetstar Asia', route: ['HKG','SIN'], sinTerminal: 'T1', durationMin: 240, originTz: 'Asia/Hong_Kong', destTz: 'Asia/Singapore' },
  'GA825': { airline: 'Garuda Indonesia', route: ['SIN','CGK'], sinTerminal: 'T3', durationMin: 120, originTz: 'Asia/Singapore', destTz: 'Asia/Jakarta' },
  'GA826': { airline: 'Garuda Indonesia', route: ['CGK','SIN'], sinTerminal: 'T3', durationMin: 120, originTz: 'Asia/Jakarta', destTz: 'Asia/Singapore' },
  'MH604': { airline: 'Malaysia Airlines', route: ['SIN','KUL'], sinTerminal: 'T1', durationMin: 60, originTz: 'Asia/Singapore', destTz: 'Asia/Kuala_Lumpur' },
  'MH605': { airline: 'Malaysia Airlines', route: ['KUL','SIN'], sinTerminal: 'T1', durationMin: 60, originTz: 'Asia/Kuala_Lumpur', destTz: 'Asia/Singapore' },
  'CX711': { airline: 'Cathay Pacific', route: ['SIN','HKG'], sinTerminal: 'T4', durationMin: 240, originTz: 'Asia/Singapore', destTz: 'Asia/Hong_Kong' },
  'CX714': { airline: 'Cathay Pacific', route: ['HKG','SIN'], sinTerminal: 'T4', durationMin: 240, originTz: 'Asia/Hong_Kong', destTz: 'Asia/Singapore' },
};

// ── Helpers ────────────────────────────────────────────────────────

function hourToCircadian(h: number): FlightContext['circadianState'] {
  if (h >= 5 && h < 12) return 'morning';
  if (h >= 12 && h < 17) return 'afternoon';
  if (h >= 17 && h < 21) return 'evening';
  return 'night';
}

function getCircadianState(
  journeyPhase: FlightContext['journeyPhase'],
  originTz: string,
  durationMin: number
): FlightContext['circadianState'] {
  if (journeyPhase === 'departure') {
    return hourToCircadian(new Date().getHours());
  }
  // transit/arrival: use body clock from origin timezone
  try {
    const bodyHour = parseInt(
      new Date().toLocaleString('en-US', { timeZone: originTz, hour12: false, hour: '2-digit' })
    );
    return hourToCircadian(bodyHour);
  } catch {
    // Fallback: for flights >6h, shift local hour back
    const localHour = new Date().getHours();
    const shiftedHour = (localHour - Math.floor(durationMin / 120) + 24) % 24;
    return hourToCircadian(shiftedHour);
  }
}

function deriveJourneyPhase(route: string[]): FlightContext['journeyPhase'] {
  const sinIndex = route.indexOf('SIN');
  if (sinIndex === 0) return 'departure';
  if (sinIndex === route.length - 1) return 'arrival';
  return 'transit';
}

// ── AviationStack API lookup ──────────────────────────────────────
// PRODUCTION: Move to Supabase Edge Function to keep key server-side
async function lookupViaAPI(flightNumber: string): Promise<FlightContext | null> {
  const apiKey = import.meta.env.VITE_AVIATIONSTACK_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch(
      `https://api.aviationstack.com/v1/flights?access_key=${apiKey}&flight_iata=${flightNumber}&limit=1`
    );
    if (!res.ok) return null;

    const json = await res.json();
    const flight = json?.data?.[0];
    if (!flight) return null;

    const departureTime = flight.departure?.estimated || flight.departure?.scheduled || null;
    const boardingTime = departureTime
      ? new Date(new Date(departureTime).getTime() - 35 * 60 * 1000).toISOString()
      : null;

    const now = Date.now();
    const minutesUntilBoarding = boardingTime
      ? Math.max(0, Math.floor((new Date(boardingTime).getTime() - now) / 60000))
      : 0;

    const origin = flight.departure?.iata || '';
    const destination = flight.arrival?.iata || '';
    const terminal = flight.departure?.terminal || flight.arrival?.terminal || '';
    const gate = flight.departure?.gate || '';

    // Build route for journey phase derivation
    const route = [origin, destination].filter(Boolean);
    const journeyPhase = deriveJourneyPhase(route);

    // Try to find in local DB for timezone info, fall back to Singapore tz
    const localFlight = SIN_COMMON_FLIGHTS[flightNumber.toUpperCase()];
    const originTz = localFlight?.originTz || 'Asia/Singapore';
    const durationMin = localFlight?.durationMin || 0;

    return {
      flightNumber: flightNumber.toUpperCase(),
      airline: flight.airline?.name || '',
      departureTime,
      boardingTime,
      gate,
      terminal,
      origin,
      destination,
      flightDurationMinutes: durationMin,
      minutesUntilBoarding,
      circadianState: getCircadianState(journeyPhase, originTz, durationMin),
      journeyPhase,
      hasRealTimeData: true,
    };
  } catch {
    return null;
  }
}

// ── Local DB lookup ───────────────────────────────────────────────
function lookupViaLocalDB(flightNumber: string): FlightContext | null {
  const flight = SIN_COMMON_FLIGHTS[flightNumber.toUpperCase()];
  if (!flight) return null;

  const journeyPhase = deriveJourneyPhase(flight.route);
  const sinIndex = flight.route.indexOf('SIN');

  // Origin = stop before SIN, destination = stop after SIN
  const origin = sinIndex > 0 ? flight.route[sinIndex - 1] : flight.route[0];
  const destination = sinIndex < flight.route.length - 1
    ? flight.route[sinIndex + 1]
    : flight.route[flight.route.length - 1];

  return {
    flightNumber: flightNumber.toUpperCase(),
    airline: flight.airline,
    departureTime: null,
    boardingTime: null,
    gate: '',
    terminal: flight.sinTerminal,
    origin,
    destination,
    flightDurationMinutes: flight.durationMin,
    minutesUntilBoarding: 0,
    circadianState: getCircadianState(journeyPhase, flight.originTz, flight.durationMin),
    journeyPhase,
    hasRealTimeData: false,
  };
}

// ── Main export ───────────────────────────────────────────────────
export async function lookupFlight(
  flightNumber: string,
  _currentTerminal: string
): Promise<FlightContext> {
  const normalized = flightNumber.toUpperCase().replace(/\s+/g, '');

  // Try API first
  const apiResult = await lookupViaAPI(normalized);
  if (apiResult) return apiResult;

  // Fall back to local DB
  const localResult = lookupViaLocalDB(normalized);
  if (localResult) return localResult;

  throw new Error('Flight not found');
}
