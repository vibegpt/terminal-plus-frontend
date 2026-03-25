// ---------- Types ----------

export interface FlightData {
  flightNumber: string;
  airline: string | null;
  status: string;
  terminal: string | null;       // raw from API: "1", "2", etc.
  terminalCode: string;           // mapped: "SIN-T3"
  gate: string | null;            // "C22" or null
  scheduledTime: string | null;   // ISO local time
  revisedTime: string | null;     // updated time if delayed
  estimatedBoardingTime: string | null;
  destination: string | null;
  origin: string | null;
  isDepartingFromSIN: boolean;
}

// ---------- Terminal mapping ----------

export function mapTerminalToCode(terminal: string | null): string {
  if (!terminal) return 'SIN-T3'; // default

  const clean = terminal.replace(/^T/i, '').trim();
  switch (clean) {
    case '1': return 'SIN-T1';
    case '2': return 'SIN-T2';
    case '3': return 'SIN-T3';
    case '4': return 'SIN-T4';
    default: return 'SIN-T3';
  }
}

// ---------- Flight lookup ----------

export async function lookupFlight(
  flightNumber: string,
  date?: string,
): Promise<FlightData | null> {
  try {
    const params = new URLSearchParams({ flight: flightNumber });
    if (date) params.set('date', date);

    const res = await fetch(`/api/flight-status?${params.toString()}`);

    if (!res.ok) {
      console.warn(`Flight lookup failed: ${res.status}`);
      return null;
    }

    const data = await res.json();

    return {
      flightNumber: data.flightNumber,
      airline: data.airline,
      status: data.status,
      terminal: data.terminal,
      terminalCode: mapTerminalToCode(data.terminal),
      gate: data.gate,
      scheduledTime: data.scheduledTime,
      revisedTime: data.revisedTime,
      estimatedBoardingTime: data.estimatedBoardingTime,
      destination: data.destination,
      origin: data.origin,
      isDepartingFromSIN: data.isDepartingFromSIN,
    };
  } catch (err) {
    console.warn('Flight lookup error:', err);
    return null;
  }
}

// ---------- Journey context helpers ----------

export interface JourneyContext {
  flightNumber: string;
  terminal: string;
  gate: string | null;
  boardingTime: string | null;
  scheduledDeparture: string | null;
  airline: string | null;
  destination: string | null;
  status: string;
  lastUpdated: string;
}

export function flightToJourneyContext(flight: FlightData): JourneyContext {
  return {
    flightNumber: flight.flightNumber,
    terminal: flight.terminalCode,
    gate: flight.gate,
    boardingTime: flight.estimatedBoardingTime,
    scheduledDeparture: flight.revisedTime || flight.scheduledTime,
    airline: flight.airline,
    destination: flight.destination,
    status: flight.status,
    lastUpdated: new Date().toISOString(),
  };
}

export function saveJourneyContext(context: JourneyContext): void {
  localStorage.setItem('tp_journey_context', JSON.stringify(context));
  sessionStorage.setItem('tp_user_terminal', context.terminal);
}

export function getJourneyContext(): JourneyContext | null {
  try {
    const raw = localStorage.getItem('tp_journey_context');
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
