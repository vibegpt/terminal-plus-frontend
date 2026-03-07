// src/pages/MapPage.tsx
// MVP static terminal map — tab selector, placeholder images, pinch-to-zoom

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Compass, ExternalLink } from 'lucide-react';
import { useJourney } from '../context/JourneyContext';

const TERMINAL_MAPS: Record<string, { url: string; imageUrl?: string }> = {
  'SIN-T1':    { url: 'https://www.changiairport.com/en/airport-guide/terminal-guides/terminal-1.html' },
  'SIN-T2':    { url: 'https://www.changiairport.com/en/airport-guide/terminal-guides/terminal-2.html' },
  'SIN-T3':    { url: 'https://www.changiairport.com/en/airport-guide/terminal-guides/terminal-3.html' },
  'SIN-T4':    { url: 'https://www.changiairport.com/en/airport-guide/terminal-guides/terminal-4.html' },
  'SIN-JEWEL': { url: 'https://www.jewelchangiairport.com/en/directory.html' },
};

const TERMINALS = [
  { code: 'SIN-T1', short: 'T1', name: 'Terminal 1' },
  { code: 'SIN-T2', short: 'T2', name: 'Terminal 2' },
  { code: 'SIN-T3', short: 'T3', name: 'Terminal 3' },
  { code: 'SIN-T4', short: 'T4', name: 'Terminal 4' },
  { code: 'SIN-JEWEL', short: 'Jewel', name: 'Jewel Changi' },
] as const;

const TERMINAL_COLORS: Record<string, string> = {
  'SIN-T1': '#4C1D95',
  'SIN-T2': '#0C4A6E',
  'SIN-T3': '#064E3B',
  'SIN-T4': '#78350F',
  'SIN-JEWEL': '#831843',
};

function getDefaultTerminal(): string {
  try {
    const raw = localStorage.getItem('tp_journey_context');
    if (raw) {
      const jc = JSON.parse(raw);
      if (jc.currentTerminal) return jc.currentTerminal;
      if (jc.departureTerminal) return jc.departureTerminal;
    }
    const ss = sessionStorage.getItem('tp_user_terminal');
    if (ss) return ss;
  } catch {}
  return 'SIN-T3';
}

export default function MapPage() {
  const navigate = useNavigate();
  const { journey } = useJourney();
  const [selected, setSelected] = useState(getDefaultTerminal);

  const terminal = TERMINALS.find(t => t.code === selected) ?? TERMINALS[2];

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
          <h1 className="text-[16px] font-bold text-white">Terminal Map</h1>
        </div>
      </header>

      <div className="pb-24">
        {/* Terminal tabs */}
        <div
          className="flex gap-2 px-4 py-3 overflow-x-auto scrollbar-hide"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {TERMINALS.map(t => {
            const active = t.code === selected;
            return (
              <button
                key={t.code}
                onClick={() => setSelected(t.code)}
                className="flex-shrink-0 px-4 py-2 rounded-full text-[13px] font-medium transition-all"
                style={{
                  background: active ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${active ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.06)'}`,
                  color: active ? '#fff' : 'rgba(255,255,255,0.4)',
                  backdropFilter: active ? 'blur(12px)' : undefined,
                }}
              >
                {t.short}
              </button>
            );
          })}
        </div>

        {/* Map area */}
        <div className="px-4 mt-1">
          <div
            className="rounded-2xl overflow-auto"
            style={{
              background: `linear-gradient(160deg, ${TERMINAL_COLORS[selected]}44 0%, rgba(10,10,15,0.95) 100%)`,
              border: '1px solid rgba(255,255,255,0.1)',
              touchAction: 'pinch-zoom',
              WebkitOverflowScrolling: 'touch',
            }}
          >
            {(() => {
              const mapData = TERMINAL_MAPS[selected];
              if (mapData?.imageUrl) {
                return (
                  <img
                    src={mapData.imageUrl}
                    alt={`${terminal.name} map`}
                    className="w-full h-auto"
                    style={{ minHeight: 280 }}
                  />
                );
              }
              return (
                <div
                  className="flex flex-col items-center justify-center text-center px-6"
                  style={{ aspectRatio: '4/3', minHeight: 280 }}
                >
                  <a
                    href={mapData?.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center gap-3 group"
                  >
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center"
                      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
                    >
                      <Compass className="w-6 h-6" style={{ color: 'rgba(255,255,255,0.35)' }} />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[15px] font-medium text-white/80 group-hover:text-white transition-colors">
                        View {terminal.name} Map
                      </span>
                      <ExternalLink className="w-3.5 h-3.5 text-white/40 group-hover:text-white/60 transition-colors" />
                    </div>
                    <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.2)' }}>
                      Opens {selected === 'SIN-JEWEL' ? 'jewelchangiairport.com' : 'changiairport.com'}
                    </p>
                  </a>
                </div>
              );
            })()}
          </div>
        </div>

        {/* Quick info bar */}
        <div className="px-4 mt-4">
          {journey ? (
            <div
              className="rounded-xl px-4 py-3 flex items-center gap-3"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <MapPin className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'rgba(124,109,250,0.6)' }} />
              <p className="text-[12px]" style={{ color: 'rgba(255,255,255,0.5)' }}>
                Your gate: <span className="text-white/70 font-medium">Gate TBD</span>
                {' · '}
                <span className="text-white/70 font-medium">
                  {TERMINALS.find(t => t.code === journey.departureTerminal)?.name ?? journey.departureTerminal}
                </span>
              </p>
            </div>
          ) : (
            <button
              onClick={() => navigate('/', { replace: true })}
              className="w-full rounded-xl px-4 py-3 text-left"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <p className="text-[12px]" style={{ color: 'rgba(124,109,250,0.7)' }}>
                Set up your flight for gate info
              </p>
            </button>
          )}
        </div>

        {/* Legend */}
        <div className="px-4 mt-4">
          <div className="flex gap-4 justify-center flex-wrap">
            {[
              { icon: '🍽', label: 'Food' },
              { icon: '☕', label: 'Coffee' },
              { icon: '🛋', label: 'Lounges' },
              { icon: '🚻', label: 'Restrooms' },
              { icon: '🛍', label: 'Shopping' },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-1.5">
                <span className="text-[14px]">{item.icon}</span>
                <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.25)' }}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
