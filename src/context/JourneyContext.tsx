// src/context/JourneyContext.tsx
// Single source of truth for the user's journey at Changi.
// Persisted to localStorage so returning users skip the capture flow.
// Also syncs derived values to sessionStorage so contextualScoring.ts
// can read them without needing a React context dependency.

import React, { createContext, useContext, useState, useEffect } from 'react';

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
}

interface JourneyContextType {
  journey: JourneyData | null;
  setJourney: (data: JourneyData) => void;
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

function loadFromStorage(): JourneyData | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as JourneyData;
  } catch {
    return null;
  }
}

function saveToStorage(data: JourneyData) {
  localStorage.setItem(LS_KEY, JSON.stringify(data));
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
  resetJourney: () => {},
  isComplete: false,
});

export function JourneyProvider({ children }: { children: React.ReactNode }) {
  const [journey, setJourneyState] = useState<JourneyData | null>(() => {
    const data = loadFromStorage();
    console.log('[Journey] isComplete:', !!data);
    return data;
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

  const resetJourney = () => {
    localStorage.removeItem(LS_KEY);
    sessionStorage.removeItem('tp_user_terminal');
    sessionStorage.removeItem('terminal_plus_flight');
    setJourneyState(null);
  };

  return (
    <JourneyContext.Provider value={{ journey, setJourney, resetJourney, isComplete: !!journey }}>
      {children}
    </JourneyContext.Provider>
  );
}

export function useJourney() {
  return useContext(JourneyContext);
}
