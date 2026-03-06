// src/pages/SavedPage.tsx
// Bookmarked amenities — reads from localStorage, offline-first

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { useSavedAmenities } from '../hooks/useBookmarks';

const TERMINAL_NAMES: Record<string, string> = {
  'SIN-T1': 'Terminal 1', 'SIN-T2': 'Terminal 2', 'SIN-T3': 'Terminal 3',
  'SIN-T4': 'Terminal 4', 'SIN-JEWEL': 'Jewel Changi',
};

const VIBE_COLORS: Record<string, { bg: string; text: string }> = {
  'Comfort': { bg: 'rgba(139,92,246,0.15)', text: '#a78bfa' },
  'Chill':   { bg: 'rgba(56,189,248,0.15)', text: '#38bdf8' },
  'Refuel':  { bg: 'rgba(251,146,60,0.15)', text: '#fb923c' },
  'Explore': { bg: 'rgba(52,211,153,0.15)', text: '#34d399' },
  'Work':    { bg: 'rgba(148,163,184,0.15)', text: '#94a3b8' },
  'Shop':    { bg: 'rgba(244,114,182,0.15)', text: '#f472b6' },
  'Quick':   { bg: 'rgba(251,191,36,0.15)',  text: '#fbbf24' },
};

const DEFAULT_VIBE = { bg: 'rgba(255,255,255,0.08)', text: 'rgba(255,255,255,0.5)' };

export default function SavedPage() {
  const navigate = useNavigate();
  const { items, remove } = useSavedAmenities();

  // Sort most recent first
  const sorted = [...items].sort((a, b) => b.savedAt.localeCompare(a.savedAt));

  return (
    <div className="min-h-screen" style={{ background: '#0a0a0f', color: '#f0f0f8' }}>
      {/* Header */}
      <header
        className="sticky top-0 z-50 px-4 pt-12 pb-3"
        style={{ background: 'rgba(10,10,15,0.95)', backdropFilter: 'blur(12px)' }}
      >
        <h1 className="text-[16px] font-bold text-white">
          Saved spots{sorted.length > 0 && (
            <span className="font-normal text-[13px] ml-1.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
              ({sorted.length})
            </span>
          )}
        </h1>
      </header>

      <div className="px-4 pt-2 pb-24">
        {/* Empty state */}
        {sorted.length === 0 && (
          <div className="text-center pt-16">
            <p className="text-[32px] mb-3">🔖</p>
            <p className="text-[15px] font-semibold text-white/60">No saved spots yet</p>
            <p className="text-[12px] mt-1 mb-6" style={{ color: 'rgba(255,255,255,0.3)' }}>
              Tap the bookmark on any amenity to save it here
            </p>
            <button
              onClick={() => navigate('/')}
              className="text-[13px] font-semibold px-5 py-2.5 rounded-xl"
              style={{ background: 'rgba(124,109,250,0.15)', color: '#a78bfa', border: '1px solid rgba(124,109,250,0.2)' }}
            >
              Explore vibes
            </button>
          </div>
        )}

        {/* Saved list */}
        {sorted.length > 0 && (
          <div className="flex flex-col gap-2">
            {sorted.map(item => {
              const vc = VIBE_COLORS[item.vibeTag] ?? DEFAULT_VIBE;
              return (
                <div
                  key={item.amenitySlug}
                  className="relative rounded-xl active:scale-[0.98] transition-transform"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <button
                    onClick={() => navigate(`/amenity/${item.amenitySlug}`)}
                    className="w-full text-left px-4 py-3.5 pr-10"
                  >
                    <p className="text-[14px] font-semibold text-white truncate">{item.name}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
                        {TERMINAL_NAMES[item.terminalCode] ?? item.terminalCode}
                      </span>
                      {item.vibeTag && (
                        <span
                          className="text-[10px] px-2 py-0.5 rounded-full"
                          style={{ background: vc.bg, color: vc.text }}
                        >
                          {item.vibeTag}
                        </span>
                      )}
                    </div>
                  </button>

                  {/* Remove button */}
                  <button
                    onClick={() => remove(item.amenitySlug)}
                    className="absolute top-3 right-3 p-1.5 rounded-full"
                    style={{ color: 'rgba(255,255,255,0.25)' }}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
