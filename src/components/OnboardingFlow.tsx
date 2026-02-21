// src/components/OnboardingFlow.tsx
// 3-screen onboarding: Splash → Flight Input → Vibe Selection
// Skippable at every step. Stores completion in sessionStorage.
// On complete, populates FlightContext so FlightStatusBar activates immediately.

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plane, Clock, Hash, DoorOpen, ArrowRight, X } from 'lucide-react';
import { useFlightContext, FlightData } from './FlightStatusBar';

// ─── VIBES CONFIG ─────────────────────────────────────────────────────────────

const VIBES = [
  { key: 'chill',   emoji: '😌', label: 'Chill',   color: '#6366f1', bg: 'rgba(99,102,241,0.12)'  },
  { key: 'refuel',  emoji: '🍜', label: 'Refuel',  color: '#f97316', bg: 'rgba(249,115,22,0.12)'  },
  { key: 'explore', emoji: '🗺️', label: 'Explore', color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)'  },
  { key: 'comfort', emoji: '🛋️', label: 'Comfort', color: '#ec4899', bg: 'rgba(236,72,153,0.12)'  },
  { key: 'work',    emoji: '💻', label: 'Work',    color: '#0ea5e9', bg: 'rgba(14,165,233,0.12)'  },
  { key: 'shop',    emoji: '🛍️', label: 'Shop',    color: '#eab308', bg: 'rgba(234,179,8,0.12)'   },
  { key: 'quick',   emoji: '⚡', label: 'Quick',   color: '#22c55e', bg: 'rgba(34,197,94,0.12)'   },
];

// ─── TYPES ────────────────────────────────────────────────────────────────────

interface OnboardingFlowProps {
  onComplete: (selectedVibes: string[]) => void;
}

interface FlightInputState {
  flightNumber: string;
  gate: string;
  terminal: string;
  boardingHour: string;
  boardingMinute: string;
}

// ─── HELPER: PARSE FLIGHT DATA ────────────────────────────────────────────────

function buildFlightData(input: FlightInputState): FlightData | null {
  if (!input.flightNumber.trim()) return null;

  const h = parseInt(input.boardingHour || '0', 10);
  const m = parseInt(input.boardingMinute || '0', 10);
  const boardingTime = new Date();
  boardingTime.setHours(h, m, 0, 0);
  // If time has already passed today, assume tomorrow
  if (boardingTime < new Date()) boardingTime.setDate(boardingTime.getDate() + 1);

  return {
    flightNumber: input.flightNumber.toUpperCase().trim(),
    origin: 'SIN',
    destination: '—',
    gate: input.gate.toUpperCase().trim() || 'TBC',
    terminal: input.terminal || 'T3',
    boardingTime,
    status: 'on-time',
  };
}

// ─── SHARED STYLES ────────────────────────────────────────────────────────────

const styles = {
  overlay: {
    position: 'fixed' as const,
    inset: 0,
    background: 'rgba(10,10,15,0.96)',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    zIndex: 1000,
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    background: 'rgba(19,19,26,0.95)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 24,
    overflow: 'hidden',
    boxShadow: '0 32px 64px rgba(0,0,0,0.5)',
  },
  input: {
    background: 'rgba(37,37,53,0.8)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: '12px 14px',
    color: '#f0f0f8',
    fontSize: 15,
    fontWeight: 600,
    fontFamily: 'inherit',
    width: '100%',
    outline: 'none',
  },
  label: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.35)',
    fontWeight: 600,
    letterSpacing: '0.1em',
    textTransform: 'uppercase' as const,
    marginBottom: 6,
    display: 'block',
  },
  primaryBtn: {
    width: '100%',
    padding: '14px',
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
  },
  skipLink: {
    textAlign: 'center' as const,
    fontSize: 12,
    color: 'rgba(255,255,255,0.3)',
    cursor: 'pointer',
    marginTop: 12,
    padding: '4px 0',
  },
};

// ─── STEP 1: SPLASH ───────────────────────────────────────────────────────────

function StepSplash({ onNext, onSkip }: { onNext: () => void; onSkip: () => void }) {
  return (
    <div>
      {/* Hero */}
      <div style={{
        background: 'linear-gradient(160deg, #0a0a2e 0%, #1a0a3a 50%, #0a1a2e 100%)',
        padding: '48px 32px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Stars */}
        {[...Array(12)].map((_, i) => (
          <div key={i} style={{
            position: 'absolute',
            width: i % 3 === 0 ? 3 : 2,
            height: i % 3 === 0 ? 3 : 2,
            borderRadius: '50%',
            background: 'white',
            top: `${10 + (i * 7) % 75}%`,
            left: `${5 + (i * 17) % 90}%`,
            opacity: 0.3 + (i % 4) * 0.1,
            animation: `tp-twinkle ${1.5 + (i % 3) * 0.7}s infinite alternate`,
            animationDelay: `${(i * 0.2) % 1.5}s`,
          }} />
        ))}

        <div style={{
          fontSize: 52,
          fontFamily: '"DM Serif Display", Georgia, serif',
          background: 'linear-gradient(135deg, #a78bfa, #818cf8)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          letterSpacing: '-0.02em',
          marginBottom: 8,
        }}>
          Terminal+
        </div>
        <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>
          Your airport, intelligently guided.
        </div>
        <div style={{ marginTop: 16, fontSize: 28 }}>✈️</div>
      </div>

      {/* Body */}
      <div style={{ padding: '24px 28px 28px' }}>
        <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 8, color: '#f0f0f8' }}>
          Welcome to Changi
        </div>
        <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6, marginBottom: 24 }}>
          Discover the best of Singapore Changi Airport — curated by mood, time, and your flight. No account needed.
        </div>
        <button style={styles.primaryBtn} onClick={onNext}>
          Get Started <ArrowRight size={16} />
        </button>
        <div style={styles.skipLink} onClick={onSkip}>
          Skip — just browse →
        </div>
      </div>
    </div>
  );
}

// ─── STEP 2: FLIGHT INPUT ─────────────────────────────────────────────────────

function StepFlightInput({
  onNext,
  onSkip,
}: {
  onNext: (data: FlightInputState) => void;
  onSkip: () => void;
}) {
  const [form, setForm] = useState<FlightInputState>({
    flightNumber: '',
    gate: '',
    terminal: 'T3',
    boardingHour: '',
    boardingMinute: '',
  });

  const update = (field: keyof FlightInputState) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => setForm(f => ({ ...f, [field]: e.target.value }));

  const canProceed = form.flightNumber.trim().length >= 2;

  return (
    <div>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #0d0d20 0%, #161630 100%)',
        padding: '28px 28px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{ fontSize: 36, textAlign: 'center', marginBottom: 4 }}>✈️</div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', textAlign: 'center', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Step 2 of 3</div>
      </div>

      {/* Body */}
      <div style={{ padding: '24px 28px 28px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 6, color: '#f0f0f8' }}>Your flight info</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', lineHeight: 1.6 }}>
            We'll personalise every recommendation — what to see, how far you can go, and when to head to your gate.
          </div>
        </div>

        {/* Flight number */}
        <div>
          <label style={styles.label}>Flight Number</label>
          <div style={{ position: 'relative' }}>
            <Plane size={14} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
            <input
              style={{ ...styles.input, paddingLeft: 36 }}
              placeholder="e.g. SQ 321"
              value={form.flightNumber}
              onChange={update('flightNumber')}
              autoComplete="off"
            />
          </div>
        </div>

        {/* Gate + Terminal */}
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ flex: 1.5 }}>
            <label style={styles.label}>Gate</label>
            <div style={{ position: 'relative' }}>
              <DoorOpen size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
              <input
                style={{ ...styles.input, paddingLeft: 32 }}
                placeholder="e.g. C22"
                value={form.gate}
                onChange={update('gate')}
              />
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <label style={styles.label}>Terminal</label>
            <select
              style={{ ...styles.input, WebkitAppearance: 'none', cursor: 'pointer' }}
              value={form.terminal}
              onChange={update('terminal')}
            >
              {['T1', 'T2', 'T3', 'T4', 'Jewel'].map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Boarding time */}
        <div>
          <label style={styles.label}>Boarding Time</label>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Clock size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
              <input
                style={{ ...styles.input, paddingLeft: 32, textAlign: 'center' }}
                placeholder="14"
                maxLength={2}
                value={form.boardingHour}
                onChange={update('boardingHour')}
                type="number"
                min="0"
                max="23"
              />
            </div>
            <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 18, fontWeight: 700 }}>:</span>
            <input
              style={{ ...styles.input, flex: 1, textAlign: 'center' }}
              placeholder="35"
              maxLength={2}
              value={form.boardingMinute}
              onChange={update('boardingMinute')}
              type="number"
              min="0"
              max="59"
            />
          </div>
        </div>

        <button
          style={{
            ...styles.primaryBtn,
            opacity: canProceed ? 1 : 0.4,
            cursor: canProceed ? 'pointer' : 'not-allowed',
          }}
          onClick={() => canProceed && onNext(form)}
          disabled={!canProceed}
        >
          Confirm Flight ✓
        </button>
        <div style={styles.skipLink} onClick={onSkip}>
          Skip — I'll add it later →
        </div>
      </div>
    </div>
  );
}

// ─── STEP 3: VIBE SELECTION ───────────────────────────────────────────────────

function StepVibeSelect({
  onComplete,
  onSkip,
}: {
  onComplete: (vibes: string[]) => void;
  onSkip: () => void;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggle = (key: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  return (
    <div>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #0d0d20 0%, #161630 100%)',
        padding: '24px 28px 16px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Step 3 of 3</div>
      </div>

      {/* Body */}
      <div style={{ padding: '24px 28px 28px' }}>
        <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 6, color: '#f0f0f8' }}>What's your vibe?</div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', lineHeight: 1.6, marginBottom: 20 }}>
          Pick one or more and we'll surface the best collections first. You can change this anytime.
        </div>

        {/* Vibe grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 20 }}>
          {VIBES.map(v => {
            const active = selected.has(v.key);
            return (
              <motion.button
                key={v.key}
                whileTap={{ scale: 0.94 }}
                onClick={() => toggle(v.key)}
                style={{
                  background: active ? v.bg : 'rgba(37,37,53,0.5)',
                  border: `1.5px solid ${active ? v.color : 'rgba(255,255,255,0.07)'}`,
                  borderRadius: 12,
                  padding: '12px 8px',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.15s',
                  fontFamily: 'inherit',
                }}
              >
                <div style={{ fontSize: 22, marginBottom: 4 }}>{v.emoji}</div>
                <div style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: active ? v.color : 'rgba(255,255,255,0.5)',
                }}>
                  {v.label}
                </div>
              </motion.button>
            );
          })}
        </div>

        <button
          style={styles.primaryBtn}
          onClick={() => onComplete([...selected])}
        >
          Start Exploring →
        </button>
        <div style={styles.skipLink} onClick={onSkip}>
          Skip — show me everything →
        </div>
      </div>
    </div>
  );
}

// ─── MAIN EXPORT ─────────────────────────────────────────────────────────────

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [flightInput, setFlightInput] = useState<FlightInputState | null>(null);
  const { setFlight } = useFlightContext();

  const finishOnboarding = (vibes: string[]) => {
    // Mark onboarding as done so it doesn't show again this session
    sessionStorage.setItem('tp_onboarded', '1');

    // Populate flight context if user filled it in
    if (flightInput) {
      const fd = buildFlightData(flightInput);
      if (fd) setFlight(fd);
    }

    onComplete(vibes);
  };

  const skipAll = () => finishOnboarding([]);

  const variants = {
    enter: { opacity: 0, x: 30 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -30 },
  };

  return (
    <div style={styles.overlay}>
      {/* Skip all button */}
      <button
        onClick={skipAll}
        style={{
          position: 'absolute',
          top: 24,
          right: 24,
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '50%',
          width: 36,
          height: 36,
          color: 'rgba(255,255,255,0.4)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <X size={16} />
      </button>

      {/* Step dots */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        {[1, 2, 3].map(n => (
          <div key={n} style={{
            width: n === step ? 24 : 8,
            height: 8,
            borderRadius: 4,
            background: n === step ? '#7c6dfa' : 'rgba(255,255,255,0.15)',
            transition: 'all 0.3s',
          }} />
        ))}
      </div>

      {/* Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.22, ease: 'easeOut' }}
          style={styles.card}
        >
          {step === 1 && (
            <StepSplash onNext={() => setStep(2)} onSkip={skipAll} />
          )}
          {step === 2 && (
            <StepFlightInput
              onNext={(data) => { setFlightInput(data); setStep(3); }}
              onSkip={() => setStep(3)}
            />
          )}
          {step === 3 && (
            <StepVibeSelect onComplete={finishOnboarding} onSkip={skipAll} />
          )}
        </motion.div>
      </AnimatePresence>

      <style>{`
        @keyframes tp-twinkle {
          from { opacity: 0.2; transform: scale(1); }
          to { opacity: 0.7; transform: scale(1.4); }
        }
      `}</style>
    </div>
  );
}

// ─── HOOK: MANAGE ONBOARDING STATE ───────────────────────────────────────────

export function useOnboarding() {
  const hasOnboarded = sessionStorage.getItem('tp_onboarded') === '1';
  return { showOnboarding: !hasOnboarded };
}

export default OnboardingFlow;
