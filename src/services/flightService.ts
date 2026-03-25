// src/services/flightService.ts
// Flight lookup service using AeroDataBox API proxy

export interface FlightData {
  flightNumber: string;
  airline: string | null;
  status: string;
  terminal: string | null;
  gate: string | null;
  scheduledTime: string | null;
  revisedTime: string | null;
  estimatedBoardingTime: string | null;
  destination: string | null;
  origin: string | null;
  isDepartingFromSIN: boolean;
}

export function mapTerminalToCode(terminal: string | null | undefined): string | null {
  if (!terminal) return null;
  const trimmed = terminal.trim();
  if (/^\d$/.test(trimmed)) return `SIN-T${trimmed}`;
  if (trimmed.startsWith('SIN-')) return trimmed;
  return `SIN-${trimmed.toUpperCase()}`;
}

export async function lookupFlight(
  flightNumber: string,
  date?: string
): Promise<FlightData | null> {
  try {
    const params = new URLSearchParams({
      number: flightNumber.trim().toUpperCase(),
    });
    if (date) params.set('date', date);

    const r = await fetch(`/api/flight-status?${params.toString()}`);
    if (!r.ok) return null;
    return await r.json();
  } catch {
    return null;
  }
}
