// src/context/JourneyContext.tsx
// Single source of truth for the user's journey at Changi.
// Persisted to localStorage so returning users skip the capture flow.
// Also syncs derived values to sessionStorage so contextualScoring.ts
// can read them without needing a React context dependency.

import React, { createContext, useContext, useState, useEffect } from 'react';
import type { FlightSource } from '../lib/journeyRecord';

// ── Types ──────────────────────────────────────────────────────────

export interface JourneyData {
  currentTerminal: string;       // 'SIN-T3'
  arrivingFlight?: string;       // 'QF1' — optional, only if user entered it
  departingFlight: string;       // 'SQ123'
  departureTerminal: string;     // 'SIN-T3'
  boardingTime: string;          // ISO-8601 with timezone
  walkMinutes: number;           // inter-terminal walk time
  usableWindowMinutes: number;   // time to boarding minus walk
  jewelViable: boolean;          // usable > 90 min
  capturedAt: string;            // ISO-8601 — when context was captured
  // AeroDataBox enrichment (optional — existing localStorage data won't break)
  gate?: string | null;
  airline?: string | null;
  destination?: string | null;
  scheduledDeparture?: string;
  status?: string;
  lastUpdated?: string;
  // ── v2: capture provenance ────────────────────────────────────────
  // schema_version absent => a v1 record written before tap-only capture.
  schema_version?: number;
  flight_source?: FlightSource;
  inbound_flight_source?: FlightSource;
  inbound_flight?: string;
  inbound_origin?: string;
  // ── v3: the journeys row this capture wrote (CC-7), so events join to it ──
  journey_id?: string;
  inbound_arrival_utc?: string;  // scheduled SIN arrival of the inbound leg (AeroDataBox)
}

interface JourneyContextType {
  journey: JourneyData | null;
  setJourney: (data: JourneyData) => void;
  /** Stamp the journeys row id onto the capture identified by capturedAt, if it's still current. */
  attachJourneyId: (capturedAt: string, id: string) => void;
  resetJourney: () => void;
  isComplete: boolean;
}

// ── Walk time table ────────────────────────────────────────────────

export const WALK_TIMES: Record<string, number> = {
  'SIN-T1:SIN-T2': 10, 'SIN-T2:SIN-T1': 10,
  'SIN-T1:SIN-T3': 20, 'SIN-T3:SIN-T1': 20,
  'SIN-T2:SIN-T3': 15, 'SIN-T3:SIN-T2': 15,
  'SIN-T3:SIN-T4': 20, 'SIN-T4:SIN-T3': 20,
  'SIN-T1:SIN-T4': 25, 'SIN-T4:SIN-T1': 25,
  'SIN-T2:SIN-T4': 25, 'SIN-T4:SIN-T2': 25,
  'SIN-T1:SIN-JEWEL': 10, 'SIN-JEWEL:SIN-T1': 10,
  'SIN-T2:SIN-JEWEL': 10, 'SIN-JEWEL:SIN-T2': 10,
  'SIN-T3:SIN-JEWEL': 10, 'SIN-JEWEL:SIN-T3': 10,
  'SIN-T4:SIN-JEWEL': 25, 'SIN-JEWEL:SIN-T4': 25,
};

export function getWalkTime(from: string, to: string): number {
  if (from === to) return 0;
  return WALK_TIMES[`${from}:${to}`] ?? 15;
}

export function calcUsableWindow(
  boardingTimeIso: string,
  walkMinutes: number
): number {
  const boarding = new Date(boardingTimeIso).getTime();
  const now = Date.now();
  const totalMinutes = Math.floor((boarding - now) / 60000);
  return Math.max(0, totalMinutes - walkMinutes);
}

// ── Storage key ────────────────────────────────────────────────────

const LS_KEY = 'tp_journey_context';

export const JOURNEY_SCHEMA_VERSION = 3;

/**
 * Read-time migration, one step per version, then stamp the current version and
 * write it back. Field names and reader signatures never change, so the existing
 * readers of tp_journey_context are unaffected.
 * - v1 → v2: a record with no schema_version predates tap-only capture, so every
 *   flight number in it was typed by hand: backfill flight_source accordingly.
 * - v2 → v3: adds journey_id. A v2 record never stored its journeys row id and it
 *   can't be recovered, so it stays absent until the next capture.
 */
function migrate(data: JourneyData): JourneyData {
  if (data.schema_version === JOURNEY_SCHEMA_VERSION) return data;
  let d = data;
  if ((d.schema_version ?? 1) < 2) {
    d = {
      ...d,
      flight_source: d.flight_source ?? 'typed',
      inbound_flight_source:
        d.inbound_flight_source ?? (d.arrivingFlight ? 'typed' : undefined),
      inbound_flight: d.inbound_flight ?? d.arrivingFlight,
    };
  }
  return { ...d, schema_version: JOURNEY_SCHEMA_VERSION };
}

function loadFromStorage(): JourneyData | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as JourneyData;
    const migrated = migrate(parsed);
    if (migrated !== parsed) {
      saveToStorage(migrated);
      console.log('[Journey] migrated stored context to v%d', JOURNEY_SCHEMA_VERSION);
    }
    return migrated;
  } catch {
    return null;
  }
}

/**
 * True when the stored onward flight has already departed, so the capture flow
 * should run again instead of restoring a stale journey.
 */
export function hasDeparted(data: JourneyData | null): boolean {
  if (!data) return false;
  const when = data.scheduledDeparture || data.boardingTime;
  if (!when) return false;
  // AeroDataBox times look like "2026-09-26 15:00Z". The JS spec only guarantees
  // the ISO form with a "T", and Safari has returned Invalid Date for the space form.
  const t = new Date(when.replace(' ', 'T')).getTime();
  return Number.isNaN(t) ? false : t < Date.now();
}

function saveToStorage(data: JourneyData) {
  localStorage.setItem(
    LS_KEY,
    JSON.stringify({ ...data, schema_version: JOURNEY_SCHEMA_VERSION })
  );
}

// Sync derived values to sessionStorage so contextualScoring.ts
// and other non-context utilities can read them.
function syncToSession(data: JourneyData) {
  sessionStorage.setItem('tp_user_terminal', data.currentTerminal);

  const minutesUntilBoarding = Math.max(
    0,
    Math.floor((new Date(data.boardingTime).getTime() - Date.now()) / 60000)
  );

  sessionStorage.setItem(
    'terminal_plus_flight',
    JSON.stringify({
      minutesUntilBoarding,
      journeyPhase: 'departure',
      circadianState: null,
      terminal: data.departureTerminal.replace('SIN-', ''),
      origin: 'SIN',
    })
  );
}

// ── Context ────────────────────────────────────────────────────────

const JourneyContext = createContext<JourneyContextType>({
  journey: null,
  setJourney: () => {},
  attachJourneyId: () => {},
  resetJourney: () => {},
  isComplete: false,
});

export function JourneyProvider({ children }: { children: React.ReactNode }) {
  const [journey, setJourneyState] = useState<JourneyData | null>(() => {
    const data = loadFromStorage();
    // A departed flight is not a current journey. App's capture gate clears the stored
    // copy and runs capture again; starting from null keeps Home, the flight bar and the
    // session mirror in step with it.
    const current = hasDeparted(data) ? null : data;
    console.log('[Journey] isComplete:', !!current);
    return current;
  });

  // Sync to session on mount and whenever journey changes
  useEffect(() => {
    if (journey) syncToSession(journey);
  }, [journey]);

  // Re-sync every minute (usableWindowMinutes changes over time)
  useEffect(() => {
    if (!journey) return;
    const interval = setInterval(() => syncToSession(journey), 60_000);
    return () => clearInterval(interval);
  }, [journey]);

  const setJourney = (data: JourneyData) => {
    saveToStorage(data);
    syncToSession(data);
    setJourneyState(data);
    console.log('[Terminal+] Journey context captured:', data);
  };

  // The journeys write resolves after capture has already been saved. Patch the id
  // into both the stored copy and state (so a later setJourney({...journey}) keeps
  // it), but only if the user hasn't captured a different journey in the meantime.
  const attachJourneyId = (capturedAt: string, id: string) => {
    const stored = loadFromStorage();
    if (stored?.capturedAt === capturedAt) saveToStorage({ ...stored, journey_id: id });
    setJourneyState(prev =>
      prev && prev.capturedAt === capturedAt ? { ...prev, journey_id: id } : prev
    );
  };

  const resetJourney = () => {
    localStorage.removeItem(LS_KEY);
    sessionStorage.removeItem('tp_user_terminal');
    sessionStorage.removeItem('terminal_plus_flight');
    setJourneyState(null);
  };

  return (
    <JourneyContext.Provider value={{ journey, setJourney, attachJourneyId, resetJourney, isComplete: !!journey }}>
      {children}
    </JourneyContext.Provider>
  );
}

export function useJourney() {
  return useContext(JourneyContext);
}
