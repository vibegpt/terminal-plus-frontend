// src/pages/FlightContextCapture.tsx
// 3-step context capture: Where are you? → Departing flight → Summary
// Runs on first launch. Skipped for returning users (localStorage-gated).
// Step 3 auto-navigates after 2 seconds.

import React, { useState, useEffect } from 'react';
import { Plane, ArrowRight, Check, AlertCircle, Loader2, Clock } from 'lucide-react';
import {
  useJourney,
  getWalkTime,
  calcUsableWindow,
  type JourneyData,
} from '../context/JourneyContext';

// ── Constants ──────────────────────────────────────────────────────

const TERMINALS = [
  { code: 'SIN-T1', label: 'T1', desc: 'Terminal 1' },
  { code: 'SIN-T2', label: 'T2', desc: 'Terminal 2' },
  { code: 'SIN-T3', label: 'T3', desc: 'Terminal 3' },
  { code: 'SIN-T4', label: 'T4', desc: 'Terminal 4' },
  { code: 'SIN-JEWEL', label: 'Jewel', desc: 'Jewel Changi' },
] as const;

type FlightResult = {
  flightNumber: string;
  terminal: string | null;
  scheduledTime: string | null;
  boardingTime: string | null;
  gate: string | null;
  status: string;
};

// ── API helper ──────────────────────────────────────────────────────

async function lookupFlight(
  number: string,
  type: 'departure' | 'arrival' = 'departure'
): Promise<FlightResult | null> {
  try {
    const r = await fetch(`/api/flight?number=${encodeURIComponent(number)}&type=${type}`);
    if (!r.ok) return null;
    return await r.json();
  } catch {
    return null;
  }
}

// ── Shared styles ──────────────────────────────────────────────────

const S = {
  screen: {
    position: 'fixed' as const,
    inset: 0,
    background: '#0a0a0f',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px 20px',
    zIndex: 200,
    fontFamily: '"DM Sans", system-ui, sans-serif',
    color: '#f0f0f8',
  },
  card: {
    width: '100%',
    maxWidth: 440,
    background: 'rgba(19,19,26,0.98)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 24,
    overflow: 'hidden',
    boxShadow: '0 32px 64px rgba(0,0,0,0.6)',
  } as React.CSSProperties,
  input: {
    width: '100%',
    background: 'rgba(37,37,53,0.8)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: '14px 16px',
    color: '#f0f0f8',
    fontSize: 16,
    fontWeight: 600,
    fontFamily: 'inherit',
    outline: 'none',
    boxSizing: 'border-box' as const,
    textTransform: 'uppercase' as const,
  },
  btn: {
    width: '100%',
    padding: '15px 20px',
    borderRadius: 14,
    border: 'none',
    background: 'linear-gradient(135deg, #7c6dfa 0%, #a855f7 100%)',
    color: 'white',
    fontSize: 15,
    fontWeight: 700,
    fontFamily: 'inherit',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 52,
  },
  btnSecondary: {
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)',
  },
  skip: {
    textAlign: 'center' as const,
    fontSize: 12,
    color: 'rgba(255,255,255,0.28)',
    cursor: 'pointer',
    marginTop: 14,
    padding: '4px 0',
    userSelect: 'none' as const,
  },
};

// ── Step dots ──────────────────────────────────────────────────────

function StepDots({ current }: { current: 1 | 2 | 3 }) {
  return (
    <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
      {([1, 2, 3] as const).map(n => (
        <div key={n} style={{
          width: n === current ? 28 : 8,
          height: 8,
          borderRadius: 4,
          background: n <= current ? '#7c6dfa' : 'rgba(255,255,255,0.12)',
          transition: 'all 0.3s ease',
        }} />
      ))}
    </div>
  );
}

// ── Terminal picker ────────────────────────────────────────────────

function TerminalPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (code: string) => void;
}) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
      {TERMINALS.map(t => {
        const active = value === t.code;
        return (
          <button
            key={t.code}
            onClick={() => onChange(t.code)}
            style={{
              padding: '14px 8px',
              borderRadius: 12,
              border: `1.5px solid ${active ? '#7c6dfa' : 'rgba(255,255,255,0.08)'}`,
              background: active ? 'rgba(124,109,250,0.15)' : 'rgba(37,37,53,0.5)',
              color: active ? '#a78bfa' : 'rgba(255,255,255,0.6)',
              fontFamily: 'inherit',
              fontWeight: 700,
              fontSize: 15,
              cursor: 'pointer',
              transition: 'all 0.15s',
              minHeight: 56,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
            }}
          >
            <span style={{ fontSize: 16 }}>{t.label}</span>
            {t.code === 'SIN-JEWEL' && (
              <span style={{ fontSize: 10, opacity: 0.6 }}>mall</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ── STEP 1: Where are you? ─────────────────────────────────────────

interface Step1Props {
  onTerminal: (terminal: string, arrivingFlight?: string) => void;
  onSkip: () => void;
}

function Step1({ onTerminal, onSkip }: Step1Props) {
  const [mode, setMode] = useState<'flight' | 'terminal'>('flight');
  const [flightInput, setFlightInput] = useState('');
  const [lookupState, setLookupState] = useState<'idle' | 'loading' | 'error'>('idle');
  const [selectedTerminal, setSelectedTerminal] = useState('SIN-T3');

  const handleFlightLookup = async () => {
    const num = flightInput.trim();
    if (!num) return;
    setLookupState('loading');
    const result = await lookupFlight(num, 'arrival');
    if (result?.terminal) {
      onTerminal(result.terminal, num.toUpperCase());
    } else {
      setLookupState('error');
      // After brief error, drop into terminal picker (clean state)
      setTimeout(() => { setMode('terminal'); setLookupState('idle'); }, 1500);
    }
  };

  const heading = (
    <div style={{ marginBottom: 24 }}>
      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
        Step 1 of 2
      </p>
      <h2 style={{ fontSize: 24, fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
        Where are you right now?
      </h2>
      <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', marginTop: 6, lineHeight: 1.5 }}>
        We'll personalise your recommendations based on your location.
      </p>
    </div>
  );

  const modeToggle = (
    <div style={{ display: 'flex', background: 'rgba(37,37,53,0.5)', borderRadius: 10, padding: 3, marginBottom: 20 }}>
      {(['flight', 'terminal'] as const).map(m => (
        <button
          key={m}
          type="button"
          onClick={() => setMode(m)}
          style={{
            flex: 1, padding: '9px 0', borderRadius: 8, border: 'none',
            fontFamily: 'inherit', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            transition: 'all 0.15s',
            background: mode === m ? 'rgba(124,109,250,0.2)' : 'transparent',
            color: mode === m ? '#a78bfa' : 'rgba(255,255,255,0.4)',
          }}
        >
          {m === 'flight' ? '✈️ Arriving flight' : '📍 Pick terminal'}
        </button>
      ))}
    </div>
  );

  // ── BLOCK A: flight lookup — contains autoFocus input, NO terminal buttons ──
  if (mode === 'flight') {
    return (
      <div style={{ padding: '28px 24px 24px' }}>
        {heading}
        {modeToggle}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ position: 'relative' }}>
            <Plane size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', pointerEvents: 'none' }} />
            <input
              style={{ ...S.input, paddingLeft: 40 }}
              placeholder="e.g. QF1, BA15"
              value={flightInput}
              onChange={e => setFlightInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleFlightLookup()}
              autoComplete="off"
              autoFocus
            />
          </div>

          {lookupState === 'error' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#f87171' }}>
              <AlertCircle size={13} />
              Couldn't find that flight — switching to terminal picker…
            </div>
          )}

          <button
            type="button"
            onClick={handleFlightLookup}
            disabled={!flightInput.trim() || lookupState === 'loading'}
            style={{ ...S.btn, opacity: flightInput.trim() ? 1 : 0.4, cursor: flightInput.trim() ? 'pointer' : 'not-allowed' }}
          >
            {lookupState === 'loading' ? (
              <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Finding your terminal…</>
            ) : (
              <>Find my terminal <ArrowRight size={16} /></>
            )}
          </button>
        </div>

        <div style={S.skip} onClick={onSkip}>Skip — browse all terminals →</div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ── BLOCK B: terminal picker — NO input, NO autoFocus anywhere ──
  console.log('[Step1] Block B rendering — onTerminal type:', typeof onTerminal, 'selectedTerminal:', selectedTerminal);
  return (
    <div style={{ padding: '28px 24px 24px' }}>
      {heading}
      {modeToggle}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <TerminalPicker value={selectedTerminal} onChange={setSelectedTerminal} />
        <button
          type="button"
          onClick={() => {
            console.log('[Step1] CONFIRM CLICKED — onTerminal type:', typeof onTerminal, 'terminal:', selectedTerminal);
            if (typeof onTerminal === 'function') {
              onTerminal(selectedTerminal);
            } else {
              console.error('[Step1] onTerminal is not a function!', onTerminal);
            }
          }}
          style={S.btn}
        >
          I'm at {TERMINALS.find(t => t.code === selectedTerminal)?.label} <ArrowRight size={16} />
        </button>
      </div>

      <div style={S.skip} onClick={onSkip}>Skip — browse all terminals →</div>
    </div>
  );
}

// ── Helpers (pre-declared so Step2 can reference them) ─────────────

function buildManualBoardingTime(hour: string, min: string): string | null {
  const h = parseInt(hour, 10);
  const m = parseInt(min, 10);
  if (isNaN(h) || isNaN(m) || h < 0 || h > 23 || m < 0 || m > 59) return null;

  // Build ISO string explicitly in Singapore timezone (UTC+8)
  // so it's correct regardless of the user's device timezone.
  const nowSin = new Date(Date.now() + 8 * 60 * 60 * 1000); // shift to SIN
  const yyyy = nowSin.getUTCFullYear();
  const MM   = String(nowSin.getUTCMonth() + 1).padStart(2, '0');
  const dd   = String(nowSin.getUTCDate()).padStart(2, '0');
  const hh   = String(h).padStart(2, '0');
  const mm   = String(m).padStart(2, '0');

  let iso = `${yyyy}-${MM}-${dd}T${hh}:${mm}:00+08:00`;

  // If in the past, roll to tomorrow (Singapore date)
  if (new Date(iso).getTime() <= Date.now()) {
    const tomorrowSin = new Date(nowSin.getTime() + 24 * 60 * 60 * 1000);
    const ddT  = String(tomorrowSin.getUTCDate()).padStart(2, '0');
    const MMT  = String(tomorrowSin.getUTCMonth() + 1).padStart(2, '0');
    iso = `${tomorrowSin.getUTCFullYear()}-${MMT}-${ddT}T${hh}:${mm}:00+08:00`;
  }

  return iso;
}

// Default boarding time: Singapore now + 2 h, rounded up to nearest 5 min
function getDefaultBoardingTime(): { h: string; m: string } {
  const sinMs = Date.now() + (8 + 2) * 60 * 60 * 1000; // UTC+8 +2h ahead
  const d = new Date(sinMs);
  let h = d.getUTCHours();
  let m = Math.ceil(d.getUTCMinutes() / 5) * 5;
  if (m >= 60) { h = (h + 1) % 24; m = 0; }
  return { h: String(h).padStart(2, '0'), m: String(m).padStart(2, '0') };
}

// ── STEP 2: Departing flight ──────────────────────────────────────

interface Step2Props {
  currentTerminal: string;
  onConfirm: (result: { flightNumber: string; departureTerminal: string; boardingTime: string; gate: string | null }) => void;
  onSkip: () => void;
}

function Step2({ currentTerminal, onConfirm, onSkip }: Step2Props) {
  const [flightInput, setFlightInput] = useState('');
  const [lookupState, setLookupState] = useState<'idle' | 'loading' | 'found' | 'error'>('idle');
  const [result, setResult] = useState<FlightResult | null>(null);

  // Manual fallback state — pre-fill time so button is usable immediately
  const [manualTerminal, setManualTerminal] = useState(currentTerminal);
  const [manualHour, setManualHour] = useState(() => getDefaultBoardingTime().h);
  const [manualMin, setManualMin] = useState(() => getDefaultBoardingTime().m);

  const handleLookup = async () => {
    const num = flightInput.trim();
    if (!num) return;
    setLookupState('loading');
    const r = await lookupFlight(num, 'departure');
    if (r && (r.terminal || r.boardingTime)) {
      setResult(r);
      setLookupState('found');
    } else {
      setLookupState('error');
    }
  };

  const handleConfirmFound = () => {
    if (!result) return;
    const terminal = result.terminal || currentTerminal;
    const boardingTime = result.boardingTime || buildManualBoardingTime(manualHour, manualMin);
    if (!boardingTime) return;
    onConfirm({
      flightNumber: result.flightNumber,
      departureTerminal: terminal,
      boardingTime,
      gate: result.gate,
    });
  };

  const handleConfirmManual = () => {
    console.log('[Step2] handleConfirmManual called', { flightInput, manualTerminal, manualHour, manualMin, canSubmitManual });
    const bt = buildManualBoardingTime(manualHour, manualMin);
    console.log('[Step2] boardingTime built:', bt);
    if (!bt) { console.warn('[Step2] BLOCKED — invalid time'); return; }
    if (!flightInput.trim()) { console.warn('[Step2] BLOCKED — no flight number'); return; }
    onConfirm({
      flightNumber: flightInput.trim().toUpperCase(),
      departureTerminal: manualTerminal,
      boardingTime: bt,
      gate: null,
    });
  };

  const formatTime = (iso: string) => {
    try {
      return new Date(iso).toLocaleTimeString('en-SG', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Singapore' });
    } catch { return iso; }
  };

  const termLabel = (code: string) =>
    TERMINALS.find(t => t.code === code)?.label ?? code.replace('SIN-', '');

  const canSubmitManual =
    flightInput.trim().length >= 2 &&
    manualHour.length > 0 &&
    manualMin.length > 0;

  return (
    <div style={{ padding: '28px 24px 24px' }}>
      <div style={{ marginBottom: 24 }}>
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
          Step 2 of 2
        </p>
        <h2 style={{ fontSize: 24, fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
          What's your departing flight?
        </h2>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', marginTop: 6, lineHeight: 1.5 }}>
          We'll tell you exactly how long you have and what's reachable.
        </p>
      </div>

      {/* ── State: idle / loading — show flight input + lookup button ── */}
      {(lookupState === 'idle' || lookupState === 'loading') && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ position: 'relative' }}>
            <Plane size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', pointerEvents: 'none' }} />
            <input
              style={{ ...S.input, paddingLeft: 40 }}
              placeholder="e.g. SQ123, EK432"
              value={flightInput}
              onChange={e => setFlightInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLookup()}
              autoComplete="off"
              autoFocus
            />
          </div>
          <button
            type="button"
            onClick={handleLookup}
            disabled={!flightInput.trim() || lookupState === 'loading'}
            style={{ ...S.btn, opacity: flightInput.trim() ? 1 : 0.4 }}
          >
            {lookupState === 'loading' ? (
              <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Looking up flight…</>
            ) : (
              <>Look up flight <ArrowRight size={16} /></>
            )}
          </button>
        </div>
      )}

      {/* ── State: error — manual fallback, NO flight input rendered ── */}
      {lookupState === 'error' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Flight pill + change link */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Plane size={14} color="#a78bfa" />
              <span style={{ fontWeight: 700, fontSize: 15, letterSpacing: '0.05em' }}>
                {flightInput.trim().toUpperCase()}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setLookupState('idle')}
              style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', padding: '4px 0' }}
            >
              Change
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#fb923c' }}>
            <AlertCircle size={13} />
            Couldn't find that flight — enter details manually
          </div>

          {/* Terminal picker */}
          <div>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
              Departure terminal
            </p>
            <TerminalPicker value={manualTerminal} onChange={setManualTerminal} />
          </div>

          {/* Boarding time */}
          <div>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
              Boarding time (24h)
            </p>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Clock size={13} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', pointerEvents: 'none' }} />
                <input
                  style={{ ...S.input, paddingLeft: 32, textAlign: 'center', textTransform: 'none' }}
                  placeholder="14"
                  maxLength={2}
                  value={manualHour}
                  onChange={e => setManualHour(e.target.value.replace(/\D/g, '').slice(0, 2))}
                  type="text"
                  inputMode="numeric"
                />
              </div>
              <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 20, fontWeight: 700 }}>:</span>
              <input
                style={{ ...S.input, flex: 1, textAlign: 'center', textTransform: 'none' }}
                placeholder="45"
                maxLength={2}
                value={manualMin}
                onChange={e => setManualMin(e.target.value.replace(/\D/g, '').slice(0, 2))}
                type="text"
                inputMode="numeric"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              console.log('CONFIRM CLICKED', { flightInput, manualHour, manualMin, manualTerminal, canSubmitManual });
              handleConfirmManual();
            }}
            disabled={!canSubmitManual}
            style={{ ...S.btn, opacity: canSubmitManual ? 1 : 0.4 }}
          >
            Confirm <Check size={16} />
          </button>
        </div>
      )}

      {/* Confirmation card */}
      {lookupState === 'found' && result && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{
            background: 'rgba(124,109,250,0.1)',
            border: '1px solid rgba(124,109,250,0.3)',
            borderRadius: 16,
            padding: '16px 18px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 40, height: 40,
                borderRadius: '50%',
                background: 'rgba(124,109,250,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Plane size={18} color="#a78bfa" />
              </div>
              <div>
                <p style={{ margin: 0, fontWeight: 800, fontSize: 18, letterSpacing: '-0.01em' }}>
                  {result.flightNumber}
                </p>
                <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>
                  {result.terminal ? `Terminal ${termLabel(result.terminal)}` : 'Terminal TBC'}
                  {result.gate ? ` · Gate ${result.gate}` : ''}
                  {result.boardingTime ? ` · Boards ${formatTime(result.boardingTime)}` : ''}
                </p>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => setLookupState('idle')}
              style={{ ...S.btn, ...S.btnSecondary, flex: 1 }}
            >
              Change
            </button>
            <button
              onClick={handleConfirmFound}
              style={{ ...S.btn, flex: 2 }}
            >
              Looks right <Check size={16} />
            </button>
          </div>
        </div>
      )}

      <div style={S.skip} onClick={onSkip}>
        Skip — I'll add this later →
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── STEP 3: Summary ────────────────────────────────────────────────

interface Step3Props {
  journey: JourneyData;
  onComplete: () => void;
}

function Step3({ journey, onComplete }: Step3Props) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const start = performance.now();
    const duration = 2000;
    const frame = () => {
      const elapsed = performance.now() - start;
      const p = Math.min(elapsed / duration, 1);
      setProgress(p);
      if (p < 1) requestAnimationFrame(frame);
      else onComplete();
    };
    requestAnimationFrame(frame);
  }, [onComplete]);

  const termLabel = (code: string) =>
    TERMINALS.find(t => t.code === code)?.label ?? code.replace('SIN-', '');

  const formatTime = (iso: string) => {
    try {
      return new Date(iso).toLocaleTimeString('en-SG', {
        hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Singapore'
      });
    } catch { return '—'; }
  };

  const sameTerminal = journey.currentTerminal === journey.departureTerminal;

  return (
    <div style={{ padding: '28px 24px 28px' }}>
      {/* Heading */}
      <div style={{ marginBottom: 24, textAlign: 'center' }}>
        <div style={{ fontSize: 36, marginBottom: 8 }}>✅</div>
        <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>You're all set</h2>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', marginTop: 6 }}>
          Personalising your Changi experience…
        </p>
      </div>

      {/* Journey summary cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
        {/* Route */}
        <div style={{ background: 'rgba(37,37,53,0.5)', borderRadius: 14, padding: '14px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ textAlign: 'center' }}>
              <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Currently at</p>
              <p style={{ margin: '4px 0 0', fontWeight: 800, fontSize: 22, color: '#a78bfa' }}>
                {termLabel(journey.currentTerminal)}
              </p>
            </div>
            <div style={{ fontSize: 18, color: 'rgba(255,255,255,0.2)' }}>→</div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Departing from</p>
              <p style={{ margin: '4px 0 0', fontWeight: 800, fontSize: 22, color: '#34d399' }}>
                {termLabel(journey.departureTerminal)}
              </p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Boards</p>
              <p style={{ margin: '4px 0 0', fontWeight: 700, fontSize: 16 }}>
                {formatTime(journey.boardingTime)}
              </p>
            </div>
          </div>
        </div>

        {/* Time info */}
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ flex: 1, background: 'rgba(37,37,53,0.5)', borderRadius: 14, padding: '14px 16px', textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {sameTerminal ? 'Time available' : 'Walk to gate'}
            </p>
            <p style={{ margin: '6px 0 0', fontWeight: 800, fontSize: 20 }}>
              {sameTerminal ? `${journey.usableWindowMinutes}m` : `${journey.walkMinutes}m`}
            </p>
            {!sameTerminal && (
              <p style={{ margin: '2px 0 0', fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
                shuttle required
              </p>
            )}
          </div>

          {!sameTerminal && (
            <div style={{ flex: 1, background: 'rgba(37,37,53,0.5)', borderRadius: 14, padding: '14px 16px', textAlign: 'center' }}>
              <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Usable window
              </p>
              <p style={{ margin: '6px 0 0', fontWeight: 800, fontSize: 20 }}>
                {journey.usableWindowMinutes}m
              </p>
            </div>
          )}
        </div>

        {/* Jewel viability */}
        <div style={{
          background: journey.jewelViable
            ? 'rgba(52,211,153,0.08)'
            : 'rgba(255,255,255,0.03)',
          border: `1px solid ${journey.jewelViable ? 'rgba(52,211,153,0.2)' : 'rgba(255,255,255,0.06)'}`,
          borderRadius: 14,
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}>
          <span style={{ fontSize: 20 }}>💎</span>
          <div>
            <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: journey.jewelViable ? '#34d399' : 'rgba(255,255,255,0.4)' }}>
              Jewel Changi {journey.jewelViable ? 'is viable' : 'not recommended'}
            </p>
            <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>
              {journey.jewelViable
                ? 'You have enough time to explore'
                : 'Need 90+ min — skip it this trip'}
            </p>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 4, height: 3, overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${progress * 100}%`,
          background: 'linear-gradient(90deg, #7c6dfa, #a855f7)',
          transition: 'none',
        }} />
      </div>
      <p style={{ textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.2)', marginTop: 8 }}>
        Taking you to your feed…
      </p>
    </div>
  );
}

// ── MAIN COMPONENT ─────────────────────────────────────────────────

interface FlightContextCaptureProps {
  onComplete: () => void;
}

export function FlightContextCapture({ onComplete }: FlightContextCaptureProps) {
  const { setJourney } = useJourney();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [currentTerminal, setCurrentTerminal] = useState('SIN-T3');
  const [arrivingFlight, setArrivingFlight] = useState<string | undefined>();
  const [pendingJourney, setPendingJourney] = useState<JourneyData | null>(null);

  const handleStep1 = (terminal: string, flight?: string) => {
    console.log('[FlightCapture] handleStep1 called — terminal:', terminal, 'flight:', flight);
    setCurrentTerminal(terminal);
    setArrivingFlight(flight);
    setStep(2);
    console.log('[FlightCapture] setStep(2) called');
  };

  const handleStep1Skip = () => {
    // Skipped → defaults to SIN-T3, no personalisation
    setCurrentTerminal('SIN-T3');
    buildAndComplete('SQ000', 'SIN-T3', new Date(Date.now() + 180 * 60_000).toISOString(), null);
  };

  const handleStep2 = ({
    flightNumber,
    departureTerminal,
    boardingTime,
  }: {
    flightNumber: string;
    departureTerminal: string;
    boardingTime: string;
    gate: string | null;
  }) => {
    buildAndComplete(flightNumber, departureTerminal, boardingTime, null);
  };

  const handleStep2Skip = () => {
    // No departure info → assume 3h window from current terminal
    buildAndComplete('UNKNOWN', currentTerminal, new Date(Date.now() + 180 * 60_000).toISOString(), null);
  };

  function buildAndComplete(
    flightNumber: string,
    departureTerminal: string,
    boardingTime: string,
    _gate: string | null
  ) {
    const walkMinutes = getWalkTime(currentTerminal, departureTerminal);
    const usableWindowMinutes = calcUsableWindow(boardingTime, walkMinutes);
    const jewelViable = usableWindowMinutes > 90;

    const data: JourneyData = {
      currentTerminal,
      arrivingFlight,
      departingFlight: flightNumber,
      departureTerminal,
      boardingTime,
      walkMinutes,
      usableWindowMinutes,
      jewelViable,
      capturedAt: new Date().toISOString(),
    };

    setJourney(data);
    setPendingJourney(data);
    setStep(3);
  }

  console.log('[FlightCapture] render — step:', step, 'currentTerminal:', currentTerminal);

  return (
    <div style={S.screen}>
      {/* Logo */}
      <div style={{ marginBottom: 8, fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.05em' }}>
        TERMINAL+
      </div>

      <StepDots current={step} />

      {/* Plain keyed div — no AnimatePresence, no pointer-events interference */}
      <div key={step} style={{ ...S.card, animation: 'tp-fadein 0.18s ease-out' }}>
        {step === 1 && (
          <Step1
            onTerminal={handleStep1}
            onSkip={handleStep1Skip}
          />
        )}
        {step === 2 && (
          <Step2
            currentTerminal={currentTerminal}
            onConfirm={handleStep2}
            onSkip={handleStep2Skip}
          />
        )}
        {step === 3 && pendingJourney && (
          <Step3
            journey={pendingJourney}
            onComplete={onComplete}
          />
        )}
      </div>

      <style>{`@keyframes tp-fadein { from { opacity: 0; transform: translateX(16px); } to { opacity: 1; transform: translateX(0); } }`}</style>
    </div>
  );
}

export default FlightContextCapture;

