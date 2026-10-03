// src/components/FlightStatusBar.tsx
// Persistent flight context bar — always visible, adapts to urgency state
// Wraps around existing Smart7 + vibe feed with no changes to underlying logic

import React, { useState, useEffect, useContext, createContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plane, Clock, MapPin, ChevronDown, ChevronUp, AlertCircle, Zap, Navigation, Pencil } from 'lucide-react';
import { useJourney, hasDeparted, type JourneyData } from '../context/JourneyContext';
import { track } from '../lib/telemetry';
import { readLedger, updateLedger } from '../lib/candidateTap';
import { gateChipVisible, normalizeGate } from '../lib/outcomePrompt';

// ─── TYPES ────────────────────────────────────────────────────────────────────

export interface FlightData {
  flightNumber: string;       // e.g. "SQ 321"
  origin: string;             // e.g. "SIN"
  destination: string;        // e.g. "SYD"
  gate: string;               // e.g. "C22"
  terminal: string;           // e.g. "T3"
  boardingTime: Date;         // actual boarding time (not departure)
  status: 'on-time' | 'delayed' | 'boarding' | 'gate-closed';
}

export type UrgencyLevel = 'relaxed' | 'moderate' | 'urgent' | 'boarding';

interface FlightContextValue {
  flight: FlightData | null;
  setFlight: (f: FlightData | null) => void;
  urgency: UrgencyLevel;
  minutesToBoarding: number | null;
}

// ─── CONTEXT ─────────────────────────────────────────────────────────────────
// Use this context in Smart7 + vibe ordering to filter by urgency

export const FlightContext = createContext<FlightContextValue>({
  flight: null,
  setFlight: () => {},
  urgency: 'relaxed',
  minutesToBoarding: null,
});

export const useFlightContext = () => useContext(FlightContext);

function journeyToFlightData(jc: Partial<JourneyData> | null): FlightData | null {
  try {
    if (!jc?.boardingTime) return null;

    // Determine status from journey context
    let status: FlightData['status'] = 'on-time';
    if (jc.status?.toLowerCase().includes('cancelled')) status = 'gate-closed';
    else if (jc.status?.toLowerCase().includes('delay')) status = 'delayed';

    return {
      flightNumber: jc.departingFlight || jc.arrivingFlight || '—',
      origin: 'SIN',
      destination: jc.destination || '—',
      gate: jc.gate || '—',
      terminal: (jc.departureTerminal || jc.currentTerminal || '').replace('SIN-', '') || '—',
      boardingTime: new Date(jc.boardingTime),
      status,
    };
  } catch {
    return null;
  }
}

function readJourneyAsFlightData(): FlightData | null {
  try {
    const raw = localStorage.getItem('tp_journey_context');
    return raw ? journeyToFlightData(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

export function FlightProvider({ children }: { children: React.ReactNode }) {
  // Reads the journey, so it must sit inside JourneyProvider (see App.tsx).
  const { journey } = useJourney();
  const [flight, setFlightState] = useState<FlightData | null>(() => journeyToFlightData(journey));
  const [minutesToBoarding, setMinutesToBoarding] = useState<number | null>(null);

  // Follow the journey in this tab. Capture, the flight poller and "update flight" all
  // go through JourneyProvider, so the bar changes without a reload. (The storage
  // event below only fires in other tabs.)
  useEffect(() => {
    setFlightState(journeyToFlightData(journey));
  }, [journey]);

  // Another tab changed the journey
  useEffect(() => {
    const onStorage = () => setFlightState(readJourneyAsFlightData());
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // Recalculate minutesToBoarding every 60s
  useEffect(() => {
    if (!flight) { setMinutesToBoarding(null); return; }
    const calc = () => {
      const mins = Math.round((flight.boardingTime.getTime() - Date.now()) / 60000);
      setMinutesToBoarding(mins);
    };
    calc();
    const id = setInterval(calc, 60_000);
    return () => clearInterval(id);
  }, [flight]);

  const setFlight = (f: FlightData | null) => {
    setFlightState(f);
  };

  // Boarding opens 35 min before departure, so a boarding time more than 35 min ago means
  // the flight has left: stop showing it as boarding and offer to add a flight instead.
  const departed = minutesToBoarding !== null && minutesToBoarding <= -35;

  const urgency: UrgencyLevel =
    minutesToBoarding === null || departed ? 'relaxed'
    : minutesToBoarding <= 0 ? 'boarding'
    : minutesToBoarding <= 25 ? 'urgent'
    : minutesToBoarding <= 75 ? 'moderate'
    : 'relaxed';

  return (
    <FlightContext.Provider
      value={{
        flight: departed ? null : flight,
        setFlight,
        urgency,
        minutesToBoarding: departed ? null : minutesToBoarding,
      }}
    >
      {children}
    </FlightContext.Provider>
  );
}

// ─── URGENCY CONFIG ───────────────────────────────────────────────────────────

const URGENCY_CONFIG = {
  relaxed: {
    dot: '#22c55e',
    border: 'rgba(20,184,166,0.25)',
    bg: 'linear-gradient(135deg, rgba(13,31,45,0.95) 0%, rgba(10,26,26,0.95) 100%)',
    timeColor: '#22c55e',
    label: 'Plenty of time',
    labelBg: 'rgba(34,197,94,0.12)',
    labelColor: '#22c55e',
    ctaBg: 'rgba(20,184,166,0.15)',
    ctaColor: '#14b8a6',
    ctaBorder: 'rgba(20,184,166,0.25)',
    progressWidth: '80%',
    progressColor: '#14b8a6',
  },
  moderate: {
    dot: '#f59e0b',
    border: 'rgba(245,158,11,0.3)',
    bg: 'linear-gradient(135deg, rgba(31,26,13,0.95) 0%, rgba(26,20,0,0.95) 100%)',
    timeColor: '#f59e0b',
    label: 'Good timing',
    labelBg: 'rgba(245,158,11,0.12)',
    labelColor: '#f59e0b',
    ctaBg: 'rgba(245,158,11,0.15)',
    ctaColor: '#f59e0b',
    ctaBorder: 'rgba(245,158,11,0.25)',
    progressWidth: '45%',
    progressColor: '#f59e0b',
  },
  urgent: {
    dot: '#ef4444',
    border: 'rgba(239,68,68,0.4)',
    bg: 'linear-gradient(135deg, rgba(31,13,13,0.97) 0%, rgba(26,0,0,0.97) 100%)',
    timeColor: '#ef4444',
    label: 'Board soon!',
    labelBg: 'rgba(239,68,68,0.12)',
    labelColor: '#ef4444',
    ctaBg: 'rgba(239,68,68,0.15)',
    ctaColor: '#ef4444',
    ctaBorder: 'rgba(239,68,68,0.3)',
    progressWidth: '12%',
    progressColor: '#ef4444',
  },
  boarding: {
    dot: '#ef4444',
    border: 'rgba(239,68,68,0.6)',
    bg: 'linear-gradient(135deg, rgba(40,10,10,0.97) 0%, rgba(30,0,0,0.97) 100%)',
    timeColor: '#ef4444',
    label: 'BOARDING NOW',
    labelBg: 'rgba(239,68,68,0.2)',
    labelColor: '#ef4444',
    ctaBg: '#ef4444',
    ctaColor: '#ffffff',
    ctaBorder: 'transparent',
    progressWidth: '4%',
    progressColor: '#ef4444',
  },
};

function getCTAText(urgency: UrgencyLevel, gate: string): string {
  switch (urgency) {
    case 'relaxed': return 'Explore Jewel →';
    case 'moderate': return `Stay in terminal →`;
    case 'urgent': return `⚡ Gate ${gate} →`;
    case 'boarding': return `🏃 Gate ${gate} NOW`;
  }
}

function formatMinutes(mins: number): string {
  if (mins <= 0) return 'NOW';
  if (mins >= 60) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }
  return `${mins} min`;
}

// ─── GATE CHIP (CC-13) ────────────────────────────────────────────────────────
// "At Gate C22? Tap when you arrive", from 45 min before boarding to 15 min after.
// gate_prompt_shown logs the first time it renders in a journey; one tap per journey
// writes gate_reached, and the chip doesn't come back. A self-report, not a position fix.

function GateChip({ compact = false }: { compact?: boolean }) {
  const { journey } = useJourney();
  const { minutesToBoarding } = useFlightContext();
  const journeyKey = journey?.capturedAt ?? null;
  const gate = normalizeGate(journey?.gate);
  const [reached, setReached] = useState(() => readLedger(journeyKey).gate_reached);

  useEffect(() => {
    setReached(readLedger(journeyKey).gate_reached);
  }, [journeyKey]);

  const visible = gateChipVisible({
    gate,
    minutesToBoarding,
    journeyActive: !!journey,
    departed: hasDeparted(journey),
    reached,
  });

  const fields = () => ({
    terminal_code: journey?.departureTerminal || null,
    minutes_to_boarding: minutesToBoarding,
    payload: { gate },
  });

  // Keyed on visibility, not on the minute tick: it fires once, when the chip first appears.
  useEffect(() => {
    if (!visible || readLedger(journeyKey).gate_prompt_logged) return;
    track('gate_prompt_shown', fields());
    updateLedger(journeyKey, () => ({ gate_prompt_logged: true }));
  }, [visible, journeyKey]);

  if (!visible) return null;

  const onTap = (ev: React.MouseEvent) => {
    ev.stopPropagation(); // the bar's main row toggles details on click
    track('gate_reached', fields());
    updateLedger(journeyKey, () => ({ gate_reached: true }));
    setReached(true);
  };

  return (
    <button
      type="button"
      onClick={onTap}
      style={{
        marginTop: compact ? 0 : 10,
        width: compact ? 'auto' : '100%',
        padding: compact ? '3px 10px' : '8px 12px',
        borderRadius: compact ? 20 : 10,
        border: '1px solid rgba(34,197,94,0.35)',
        background: 'rgba(34,197,94,0.12)',
        color: '#4ade80',
        fontSize: compact ? 11 : 13,
        fontWeight: 600,
        fontFamily: 'inherit',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        flexShrink: 0,
      }}
    >
      <MapPin size={compact ? 11 : 13} />
      At Gate {gate}? Tap when you arrive
    </button>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

interface FlightStatusBarProps {
  /** Compact mode for desktop topbar — single line only */
  compact?: boolean;
  /** Called when user taps the CTA button */
  onCTAPress?: (urgency: UrgencyLevel) => void;
  /** Called when user taps "Add flight" prompt */
  onAddFlight?: () => void;
  /** Called when user taps "Change flight" in the expanded bar */
  onChangeFlight?: () => void;
  className?: string;
}

export function FlightStatusBar({
  compact = false,
  onCTAPress,
  onAddFlight,
  onChangeFlight,
  className = '',
}: FlightStatusBarProps) {
  const { flight, urgency, minutesToBoarding } = useFlightContext();
  const [expanded, setExpanded] = useState(false);
  const config = URGENCY_CONFIG[urgency];

  // No flight entered — show prompt
  if (!flight) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className={`tp-fsb tp-fsb--empty ${className}`}
        style={{
          background: 'rgba(124,109,250,0.08)',
          border: '1px solid rgba(124,109,250,0.2)',
          borderRadius: compact ? '20px' : '14px',
          padding: compact ? '6px 14px' : '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          cursor: 'pointer',
        }}
        onClick={onAddFlight}
      >
        <Plane size={14} style={{ color: '#7c6dfa', opacity: 0.7 }} />
        <span style={{
          fontSize: compact ? '12px' : '13px',
          color: 'rgba(124,109,250,0.8)',
          fontWeight: 500,
        }}>
          Add your flight for personalised recommendations →
        </span>
      </motion.div>
    );
  }

  const ctaText = getCTAText(urgency, flight.gate);
  const timeLabel = minutesToBoarding !== null ? formatMinutes(minutesToBoarding) : '—';
  const isPulsing = urgency === 'urgent' || urgency === 'boarding';

  // ── COMPACT MODE (desktop topbar) ─────────────────────────────────────────
  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          background: 'rgba(255,255,255,0.05)',
          border: `1px solid ${config.border}`,
          borderRadius: '20px',
          padding: '5px 14px',
          fontSize: '12px',
          cursor: 'pointer',
        }}
        className={className}
      >
        <span style={{
          width: 7,
          height: 7,
          borderRadius: '50%',
          background: config.dot,
          flexShrink: 0,
          animation: isPulsing ? 'tp-pulse 1.5s infinite' : 'tp-pulse 3s infinite',
        }} />
        <span style={{ color: 'rgba(255,255,255,0.5)' }}>
          {flight.flightNumber} · {flight.origin} → {flight.destination}
        </span>
        <span style={{
          fontWeight: 700,
          color: config.timeColor,
          fontSize: '13px',
        }}>
          {timeLabel}
        </span>
        <span style={{ color: 'rgba(255,255,255,0.2)' }}>·</span>
        <span style={{ color: 'rgba(255,255,255,0.5)' }}>
          Gate {flight.gate}, {flight.terminal}
        </span>
        <GateChip compact />
      </motion.div>
    );
  }

  // ── FULL MODE (mobile sticky bar) ─────────────────────────────────────────
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`tp-fsb ${className}`}
      style={{
        background: config.bg,
        border: `1px solid ${config.border}`,
        borderRadius: 14,
        padding: '12px 16px',
        position: 'relative',
        overflow: 'hidden',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      {/* Main row: the whole bar opens the details (the chevron alone is a small target) */}
      <div
        onClick={() => setExpanded(e => !e)}
        style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
      >
        {/* Pulse dot */}
        <span style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: config.dot,
          flexShrink: 0,
          boxShadow: `0 0 0 0 ${config.dot}66`,
          animation: isPulsing ? 'tp-pulse-urgent 1.2s infinite' : 'tp-pulse 2.5s infinite',
        }} />

        {/* Flight info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.04em', color: config.timeColor }}>
            {urgency === 'boarding' ? '⚡ BOARDING NOW' : `${timeLabel} to board`}
            {flight.status === 'on-time' && urgency !== 'boarding' && (
              <span style={{ color: '#22c55e', fontWeight: 400, marginLeft: 6 }}>· On Time</span>
            )}
            {flight.status === 'delayed' && (
              <span style={{ color: '#f59e0b', fontWeight: 400, marginLeft: 6 }}>· Delayed</span>
            )}
          </span>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>
            {flight.flightNumber} · {flight.origin} → {flight.destination}
          </span>
        </div>

        {/* Gate */}
        <div style={{ marginLeft: 'auto', textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.85)' }}>
            {flight.gate}
          </div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>{flight.terminal}</div>
        </div>

        {/* Expand toggle */}
        <button
          onClick={(ev) => { ev.stopPropagation(); setExpanded(e => !e); }}
          aria-expanded={expanded}
          aria-label={expanded ? 'Hide flight details' : 'Show flight details'}
          style={{
            background: 'none',
            border: 'none',
            color: 'rgba(255,255,255,0.3)',
            cursor: 'pointer',
            padding: 4,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      <GateChip />

      {/* Expanded detail */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{
              marginTop: 12,
              paddingTop: 12,
              borderTop: '1px solid rgba(255,255,255,0.07)',
              display: 'flex',
              gap: 12,
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginBottom: 3 }}>FLIGHT</div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{flight.flightNumber}</div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginBottom: 3 }}>GATE</div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>Gate {flight.gate}</div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginBottom: 3 }}>TERMINAL</div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{flight.terminal}</div>
              </div>
            </div>

            {/* CTA */}
            <button
              onClick={() => onCTAPress?.(urgency)}
              style={{
                marginTop: 10,
                width: '100%',
                padding: '9px 12px',
                borderRadius: 10,
                border: `1px solid ${config.ctaBorder}`,
                background: config.ctaBg,
                color: config.ctaColor,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              <Navigation size={13} />
              {ctaText}
            </button>

            {/* Change flight: rebooked, or entered the wrong one. Delays update on their own. */}
            {onChangeFlight && (
              <button
                onClick={onChangeFlight}
                style={{
                  marginTop: 8,
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 10,
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'transparent',
                  color: 'rgba(255,255,255,0.6)',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                <Pencil size={12} />
                Change flight
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress bar */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        height: 2,
        width: config.progressWidth,
        background: config.progressColor,
        opacity: 0.4,
        transition: 'width 60s linear',
      }} />

      {/* Status label pill */}
      <span style={{
        position: 'absolute',
        top: 10,
        right: expanded ? 32 : 48,
        fontSize: 10,
        fontWeight: 700,
        padding: '2px 8px',
        borderRadius: 20,
        background: config.labelBg,
        color: config.labelColor,
        letterSpacing: '0.04em',
        transition: 'all 0.2s',
      }}>
        {config.label}
      </span>

      <style>{`
        @keyframes tp-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.3); }
        }
        @keyframes tp-pulse-urgent {
          0% { box-shadow: 0 0 0 0 ${config.dot}66; }
          70% { box-shadow: 0 0 0 6px ${config.dot}00; }
          100% { box-shadow: 0 0 0 0 ${config.dot}00; }
        }
      `}</style>
    </motion.div>
  );
}

export default FlightStatusBar;
