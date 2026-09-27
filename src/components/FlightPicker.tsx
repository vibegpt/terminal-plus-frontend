// src/components/FlightPicker.tsx
// Tap-only flight selection from a real SIN board. Replaces the free-text
// flight-number inputs in the capture flow.
//
// The board is fetched ONCE on mount and filtered client-side, so typing in the
// filter never issues a network request.

import React, { useEffect, useMemo, useState } from 'react';
import { Plane, Search, ScanLine, Loader2 } from 'lucide-react';
import { track } from '@/lib/telemetry';
import type { FlightSource } from '@/lib/journeyRecord';

export interface BoardFlight {
  flight_iata: string;
  airline_name: string | null;
  scheduled_at: string;
  terminal: string | null;
  gate: string | null;
  origin_iata: string | null;
  destination_iata: string | null;
  status: string;
  search_aliases: string[];
  operator_confidence: 'confirmed' | 'unknown';
}

interface BoardResponse {
  flights: BoardFlight[];
  fetched_at: string;
  cached: boolean;
  fixture?: boolean;
  degraded?: boolean;
}

interface FlightPickerProps {
  direction: 'departure' | 'arrival';
  title: string;
  subtitle: string;
  /** source is 'picker', or 'picker_ungrouped' when the operating carrier is unconfirmed. */
  onSelect: (flight: BoardFlight, source: FlightSource) => void;
  onManual: () => void;
  onSkip: () => void;
  skipLabel: string;
}

const SIN_TZ = 'Asia/Singapore';

function timeAtChangi(iso: string): string {
  try {
    return new Intl.DateTimeFormat('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: SIN_TZ,
    }).format(new Date(iso));
  } catch {
    return '--:--';
  }
}

export function FlightPicker({
  direction,
  title,
  subtitle,
  onSelect,
  onManual,
  onSkip,
  skipLabel,
}: FlightPickerProps) {
  const [flights, setFlights] = useState<BoardFlight[]>([]);
  const [loading, setLoading] = useState(true);
  const [degraded, setDegraded] = useState(false);
  const [fixture, setFixture] = useState(false);
  const [filter, setFilter] = useState('');
  const [scanNote, setScanNote] = useState(false);

  // Deps are [direction] only — the filter below must never refetch.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    fetch(`/api/flights/board?direction=${direction}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((data: BoardResponse) => {
        if (cancelled) return;
        setFlights(Array.isArray(data.flights) ? data.flights : []);
        setDegraded(data.degraded === true || (data.flights?.length ?? 0) === 0);
        setFixture(data.fixture === true);
      })
      .catch(() => {
        // Never a dead end — fall through to the typed entry below.
        if (!cancelled) setDegraded(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [direction]);

  // Pure client-side over the already-fetched array. Zero requests per keystroke.
  const visible = useMemo(() => {
    const q = filter.trim().toUpperCase().replace(/\s+/g, '');
    if (!q) return flights;
    return flights.filter(
      (f) =>
        f.flight_iata.includes(q) ||
        f.search_aliases.some((a) => a.includes(q)) ||
        (f.airline_name ?? '').toUpperCase().replace(/\s+/g, '').includes(q)
    );
  }, [flights, filter]);

  const handleManual = () => {
    track('flight_not_found', {
      payload: { direction, filter_length: filter.trim().length, board_size: flights.length },
    });
    onManual();
  };

  return (
    <div style={{ padding: '28px 24px 24px' }}>
      <div style={{ marginBottom: 18 }}>
        <h2 style={{ fontSize: 24, fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
          {title}
        </h2>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', marginTop: 6, lineHeight: 1.5 }}>
          {subtitle}
        </p>
      </div>

      {fixture && (
        <div
          style={{
            marginBottom: 14,
            padding: '10px 12px',
            borderRadius: 10,
            background: 'rgba(249,115,22,0.14)',
            border: '1px solid rgba(249,115,22,0.4)',
            color: '#fdba74',
            fontSize: 12,
            fontWeight: 700,
            lineHeight: 1.45,
          }}
        >
          DEV FIXTURE — these flights are not real. No API key configured.
        </div>
      )}

      {/* Primary CTA. Handler is stubbed; the scanner is a separate task. */}
      <button
        type="button"
        onClick={() => setScanNote(true)}
        style={{
          width: '100%',
          padding: '15px 20px',
          borderRadius: 14,
          border: '1px solid rgba(124,109,250,0.45)',
          background: 'rgba(124,109,250,0.14)',
          color: '#c4b5fd',
          fontSize: 15,
          fontWeight: 700,
          fontFamily: 'inherit',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          minHeight: 52,
        }}
      >
        <ScanLine size={17} /> Scan boarding pass
      </button>
      {scanNote && (
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 8, textAlign: 'center' }}>
          Boarding pass scanning is coming soon — pick your flight below for now.
        </p>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '18px 0 14px' }}>
        <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.08em' }}>
          OR PICK FROM THE BOARD
        </span>
        <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
      </div>

      {!degraded && (
        <div style={{ position: 'relative', marginBottom: 12 }}>
          <Search
            size={15}
            style={{
              position: 'absolute',
              left: 14,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'rgba(255,255,255,0.3)',
              pointerEvents: 'none',
            }}
          />
          <input
            style={{
              width: '100%',
              background: 'rgba(37,37,53,0.8)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 12,
              padding: '13px 16px 13px 40px',
              color: '#f0f0f8',
              fontSize: 15,
              fontWeight: 600,
              fontFamily: 'inherit',
              outline: 'none',
              boxSizing: 'border-box',
            }}
            placeholder="Filter by flight number or airline"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            autoComplete="off"
          />
        </div>
      )}

      {loading && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            padding: '32px 0',
            color: 'rgba(255,255,255,0.4)',
            fontSize: 14,
          }}
        >
          <Loader2 size={16} style={{ animation: 'tp-spin 1s linear infinite' }} />
          Loading the {direction === 'arrival' ? 'arrivals' : 'departures'} board…
        </div>
      )}

      {!loading && degraded && (
        <div
          style={{
            padding: '18px 16px',
            borderRadius: 12,
            background: 'rgba(37,37,53,0.5)',
            border: '1px solid rgba(255,255,255,0.08)',
            fontSize: 13,
            color: 'rgba(255,255,255,0.55)',
            lineHeight: 1.55,
            marginBottom: 12,
          }}
        >
          The live board isn't available right now. You can still enter your flight number
          yourself.
        </div>
      )}

      {!loading && !degraded && (
        <div style={{ maxHeight: 320, overflowY: 'auto', margin: '0 -4px', padding: '0 4px' }}>
          {visible.length === 0 && (
            <p
              style={{
                fontSize: 13,
                color: 'rgba(255,255,255,0.4)',
                textAlign: 'center',
                padding: '24px 0',
              }}
            >
              No flights match "{filter.trim()}".
            </p>
          )}

          {visible.map((f) => (
            <button
              key={`${f.flight_iata}-${f.scheduled_at}`}
              type="button"
              onClick={() =>
                onSelect(f, f.operator_confidence === 'confirmed' ? 'picker' : 'picker_ungrouped')
              }
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '13px 14px',
                marginBottom: 8,
                borderRadius: 12,
                border: '1px solid rgba(255,255,255,0.08)',
                background: 'rgba(37,37,53,0.55)',
                color: '#f0f0f8',
                fontFamily: 'inherit',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <Plane size={15} style={{ color: 'rgba(167,139,250,0.8)', flexShrink: 0 }} />
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <span style={{ fontSize: 15, fontWeight: 800, letterSpacing: '-0.01em' }}>
                    {f.flight_iata}
                  </span>
                  {f.search_aliases.length > 1 && (
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        color: 'rgba(255,255,255,0.35)',
                        background: 'rgba(255,255,255,0.06)',
                        borderRadius: 5,
                        padding: '2px 5px',
                      }}
                    >
                      +{f.search_aliases.length - 1} codes
                    </span>
                  )}
                </span>
                <span
                  style={{
                    display: 'block',
                    fontSize: 12,
                    color: 'rgba(255,255,255,0.42)',
                    marginTop: 2,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {f.airline_name ?? 'Unknown airline'}
                </span>
              </span>
              <span style={{ textAlign: 'right', flexShrink: 0 }}>
                <span style={{ display: 'block', fontSize: 14, fontWeight: 700 }}>
                  {timeAtChangi(f.scheduled_at)}
                </span>
                <span style={{ display: 'block', fontSize: 11, color: 'rgba(255,255,255,0.38)', marginTop: 2 }}>
                  {f.terminal ? `T${f.terminal}` : '—'}
                </span>
              </span>
            </button>
          ))}
        </div>
      )}

      <div
        style={{
          textAlign: 'center',
          fontSize: 12,
          color: 'rgba(255,255,255,0.42)',
          cursor: 'pointer',
          marginTop: 14,
          padding: '4px 0',
          userSelect: 'none',
          textDecoration: 'underline',
        }}
        onClick={handleManual}
      >
        Can't find it? Enter manually
      </div>

      <div
        style={{
          textAlign: 'center',
          fontSize: 12,
          color: 'rgba(255,255,255,0.28)',
          cursor: 'pointer',
          marginTop: 10,
          padding: '4px 0',
          userSelect: 'none',
        }}
        onClick={onSkip}
      >
        {skipLabel}
      </div>

      <style>{`@keyframes tp-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default FlightPicker;
