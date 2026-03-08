// src/pages/ProfilePage.tsx
// MVP profile — journey info, reset, app info

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plane, MapPin, Clock, AlertCircle } from 'lucide-react';
import { useJourney, type JourneyData } from '../context/JourneyContext';

const TERMINAL_FRIENDLY: Record<string, string> = {
  'SIN-T1': 'Terminal 1', 'SIN-T2': 'Terminal 2', 'SIN-T3': 'Terminal 3',
  'SIN-T4': 'Terminal 4', 'SIN-JEWEL': 'Jewel',
};

type BoardingState = 'future' | 'countdown' | 'soon' | 'departed';

function getBoardingDisplay(iso: string): { label: string; state: BoardingState } {
  const d = new Date(iso);
  const mins = Math.floor((d.getTime() - Date.now()) / 60000);

  if (mins < 0) return { label: 'Departed', state: 'departed' };
  if (mins < 15) return { label: 'Boarding soon', state: 'soon' };

  // 15 min – 6 h → countdown
  if (mins < 360) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    const parts = [];
    if (h > 0) parts.push(`${h}h`);
    if (m > 0) parts.push(`${m}m`);
    return { label: `${parts.join(' ')} until boarding`, state: 'countdown' };
  }

  // > 6 h → show date + time
  const time = d.toLocaleTimeString('en-SG', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Singapore' });
  const today = new Date();
  const isToday = d.toDateString() === today.toDateString();
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
  const isTomorrow = d.toDateString() === tomorrow.toDateString();
  const prefix = isToday ? 'Today' : isTomorrow ? 'Tomorrow' : d.toLocaleDateString('en-SG', { day: 'numeric', month: 'short' });
  return { label: `${prefix}, ${time}`, state: 'future' };
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const { journey, resetJourney } = useJourney();
  const [confirmReset, setConfirmReset] = useState(false);

  const handleReset = () => {
    resetJourney();
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen" style={{ background: '#0a0a0f', color: '#f0f0f8' }}>
      {/* Header */}
      <header
        className="sticky top-0 z-50 px-4 pt-12 pb-3"
        style={{ background: 'rgba(10,10,15,0.95)', backdropFilter: 'blur(12px)' }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-1 rounded-full"
            style={{ background: 'rgba(255,255,255,0.06)' }}
          >
            <ArrowLeft className="w-4 h-4 text-white/60" />
          </button>
          <h1 className="text-[16px] font-bold text-white">Profile</h1>
        </div>
      </header>

      <div className="px-4 pt-4 pb-24 max-w-md mx-auto">
        {/* ── Current Journey ──────────────────────────── */}
        <SectionLabel>Your flight</SectionLabel>

        {journey ? (
          <JourneyCard journey={journey} />
        ) : (
          <div
            className="rounded-2xl px-5 py-6 text-center"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
              backdropFilter: 'blur(12px)',
            }}
          >
            <AlertCircle className="w-5 h-5 mx-auto mb-2" style={{ color: 'rgba(255,255,255,0.2)' }} />
            <p className="text-[13px] mb-4" style={{ color: 'rgba(255,255,255,0.4)' }}>
              No flight details set
            </p>
            <button
              onClick={() => { resetJourney(); navigate('/', { replace: true }); }}
              className="text-[13px] font-semibold px-5 py-2.5 rounded-xl"
              style={{ background: 'rgba(124,109,250,0.15)', color: '#a78bfa', border: '1px solid rgba(124,109,250,0.2)' }}
            >
              Set up your flight
            </button>
          </div>
        )}

        {/* ── Change flight ──────────────────────────── */}
        {journey && (
          <div className="mt-4">
            {!confirmReset ? (
              <button
                onClick={() => setConfirmReset(true)}
                className="w-full text-center px-4 py-3.5 rounded-xl text-[13px] font-medium"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }}
              >
                Change flight details
              </button>
            ) : (
              <div
                className="rounded-xl px-4 py-4"
                style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}
              >
                <p className="text-[12px] mb-3" style={{ color: 'rgba(255,255,255,0.45)' }}>
                  Reset flight context?
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={handleReset}
                    className="text-[12px] font-medium"
                    style={{ color: '#ef4444' }}
                  >
                    Yes, reset
                  </button>
                  <button
                    onClick={() => setConfirmReset(false)}
                    className="text-[12px]"
                    style={{ color: 'rgba(255,255,255,0.4)' }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── App Info (plain footer, no card) ────────── */}
        <div className="mt-16 text-center pb-4">
          <p className="text-[12px] font-semibold" style={{ color: 'rgba(255,255,255,0.2)' }}>Terminal+</p>
          <p className="text-[10px] mt-1" style={{ color: 'rgba(255,255,255,0.15)' }}>v1.0.0 MVP</p>
          <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.12)' }}>Singapore Changi Airport</p>
        </div>
      </div>
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────

function SectionLabel({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <p
      className={`text-[10px] font-bold uppercase tracking-widest mb-2 px-1 ${className}`}
      style={{ color: 'rgba(255,255,255,0.25)' }}
    >
      {children}
    </p>
  );
}

function formatLastUpdated(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ago`;
}

function JourneyCard({ journey }: { journey: JourneyData }) {
  const terminal = TERMINAL_FRIENDLY[journey.departureTerminal] ?? journey.departureTerminal;
  const { label: boardingLabel, state: boardingState } = getBoardingDisplay(journey.boardingTime);

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.06)',
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* Flight number — hero */}
      <div className="px-5 pt-5 pb-3">
        <p className="text-[22px] font-bold text-white tracking-tight">
          {journey.departingFlight || '—'}
        </p>
        {journey.airline && (
          <p className="text-[12px] mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
            {journey.airline}
          </p>
        )}
      </div>

      {/* Details rows */}
      <Row icon={<MapPin className="w-3.5 h-3.5" />} label="Terminal" value={terminal} />
      <Row icon={<Plane className="w-3.5 h-3.5" />} label="Gate" value={journey.gate || 'Gate TBD'} />
      {journey.destination && (
        <Row icon={<MapPin className="w-3.5 h-3.5" />} label="To" value={journey.destination} />
      )}
      <div
        className="flex items-center gap-3 px-5 py-3"
      >
        <span style={{ color: boardingState === 'soon' ? '#ef4444' : 'rgba(255,255,255,0.25)' }}>
          <Clock className="w-3.5 h-3.5" style={boardingState === 'soon' ? { animation: 'tp-pulse-profile 1.5s infinite' } : undefined} />
        </span>
        <span className="text-[12px] w-16" style={{ color: 'rgba(255,255,255,0.35)' }}>Boarding</span>
        <span
          className="text-[13px] font-medium"
          style={{
            color: boardingState === 'departed' ? 'rgba(255,255,255,0.25)'
              : boardingState === 'soon' ? '#ef4444'
              : 'rgba(255,255,255,0.8)',
          }}
        >
          {boardingLabel}
        </span>
      </div>

      {journey.lastUpdated && (
        <div className="px-5 py-2" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.2)' }}>
            Updated {formatLastUpdated(journey.lastUpdated)}
          </p>
        </div>
      )}

      <style>{`
        @keyframes tp-pulse-profile {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div
      className="flex items-center gap-3 px-5 py-3"
      style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
    >
      <span style={{ color: 'rgba(255,255,255,0.25)' }}>{icon}</span>
      <span className="text-[12px] w-16" style={{ color: 'rgba(255,255,255,0.35)' }}>{label}</span>
      <span className="text-[13px] font-medium text-white/80">{value}</span>
    </div>
  );
}
