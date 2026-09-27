// src/lib/journeyRecord.ts
// Writes the captured journey to /api/journey, which holds the service-role key
// server-side — the same trust path as /api/events. No anon-client insert.
//
// Never throws into app code: onboarding must complete even if the write fails.

export type FlightSource =
  | 'scanned'
  | 'picker'
  | 'picker_ungrouped'
  | 'typed'
  | 'inferred'
  | 'skipped';

export type JourneyType = 'departing' | 'connecting' | 'just_landed' | 'skipped';

export interface JourneyRecord {
  journey_type: JourneyType;
  flight_number?: string | null;
  destination?: string | null;
  departure_time?: string | null;
  flight_source: FlightSource;
  inbound_flight?: string | null;
  inbound_origin?: string | null;
  inbound_flight_source?: FlightSource | null;
  onboarding_skipped?: boolean;
}

// Existing browser identities — reused, never minted here. telemetry.ts owns
// their lifecycle (src/lib/telemetry.ts, getAnonId/ensureSession).
const ANON_KEY = 'anon_id';
const SESSION_KEY = 'tp_session_id';
const ACQUISITION_KEY = 'tp_acquisition_src';

const DEV = typeof import.meta !== 'undefined' && import.meta.env?.DEV;

/**
 * Captured once, on the first open that carries ?src=, and never overwritten —
 * later visits must not relabel where a user originally came from.
 * Returns whatever was captured first, for every subsequent call.
 */
function acquisitionSrc(): string | null {
  try {
    const existing = localStorage.getItem(ACQUISITION_KEY);
    if (existing) return existing;

    const src = new URLSearchParams(window.location.search).get('src');
    if (!src) return null;

    const clean = src.trim().slice(0, 64);
    if (!clean) return null;
    localStorage.setItem(ACQUISITION_KEY, clean);
    return clean;
  } catch {
    return null;
  }
}

function deviceTimezone(): string | null {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || null;
  } catch {
    return null;
  }
}

/**
 * Fire-and-forget. Resolves to the new row id, or null if anything went wrong.
 * first_open_country is NOT sent — the server reads x-vercel-ip-country so the
 * client cannot spoof it.
 */
export async function recordJourney(record: JourneyRecord): Promise<string | null> {
  try {
    const journey = {
      ...record,
      session_id: sessionStorage.getItem(SESSION_KEY),
      anon_id: localStorage.getItem(ANON_KEY),
      onboarding_skipped: record.onboarding_skipped ?? false,
      onboarding_completed_at: new Date().toISOString(),
      acquisition_src: acquisitionSrc(),
      device_locale: navigator.language || null,
      device_timezone: deviceTimezone(),
    };

    const r = await fetch('/api/journey', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ journey }),
    });

    if (!r.ok) {
      if (DEV) console.warn('[journeyRecord] write failed:', r.status);
      return null;
    }
    const data = (await r.json()) as { id?: string };
    if (DEV) console.log('[journeyRecord] wrote', data.id);
    return data.id ?? null;
  } catch (err) {
    if (DEV) console.warn('[journeyRecord] error:', err);
    return null;
  }
}
