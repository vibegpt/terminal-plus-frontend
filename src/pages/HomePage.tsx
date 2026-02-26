// src/pages/HomePage.tsx
// MVP Vibe Feed - Photo cards with cinematic overlay treatment
// Mobile-first: 176×224px cards (4:5 ratio), 2.3 visible at 390px viewport

import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, ChevronRight, Search } from 'lucide-react';
import { supabase } from '@/lib/supabase';

// ── Vibe Configuration ──────────────────────────────────────────────
const VIBES = [
  { key: 'Comfort',  icon: '🛏️', label: 'Comfort',  desc: 'Rest & recharge',      color: '#7C3AED' },
  { key: 'Chill',    icon: '😌', label: 'Chill',    desc: 'Peaceful spots',        color: '#0284C7' },
  { key: 'Refuel',   icon: '🍜', label: 'Refuel',   desc: 'Food & drinks',         color: '#EA580C' },
  { key: 'Explore',  icon: '🧭', label: 'Explore',  desc: 'Discover Changi',       color: '#059669' },
  { key: 'Work',     icon: '💻', label: 'Work',     desc: 'Get things done',       color: '#475569' },
  { key: 'Shop',     icon: '🛍️', label: 'Shop',     desc: 'Retail & duty free',    color: '#DB2777' },
  { key: 'Quick',    icon: '⚡', label: 'Quick',    desc: 'Fast & essential',      color: '#D97706' },
] as const;

type VibeKey = typeof VIBES[number]['key'];

function getVibeOrder(): VibeKey[] {
  const h = new Date().getHours();
  if (h >= 5  && h < 9)  return ['Comfort','Refuel','Quick','Chill','Work','Explore','Shop'];
  if (h >= 9  && h < 12) return ['Refuel','Work','Quick','Explore','Shop','Chill','Comfort'];
  if (h >= 12 && h < 14) return ['Refuel','Quick','Chill','Explore','Shop','Work','Comfort'];
  if (h >= 14 && h < 18) return ['Explore','Shop','Refuel','Chill','Quick','Work','Comfort'];
  if (h >= 18 && h < 22) return ['Refuel','Shop','Chill','Explore','Comfort','Quick','Work'];
  return ['Comfort','Chill','Quick','Refuel','Explore','Shop','Work'];
}

function getTimeLabel(): string {
  const h = new Date().getHours();
  if (h >= 5  && h < 12) return 'Morning picks';
  if (h >= 12 && h < 17) return 'Afternoon picks';
  if (h >= 17 && h < 22) return 'Evening picks';
  return 'Late night picks';
}

function isOpenNow(hours: string): boolean {
  if (!hours || hours === '24/7') return true;
  const m = hours.match(/(\d{1,2}):(\d{2})\s*[-–]\s*(\d{1,2}):(\d{2})/);
  if (!m) return true;
  const [, oH, oM, cH, cM] = m.map(Number);
  const now = new Date().getHours() * 60 + new Date().getMinutes();
  const open = oH * 60 + oM;
  let close = cH * 60 + cM;
  if (close <= open) {
    close += 1440;
    if (now < open) return now + 1440 < close;
  }
  return now >= open && now < close;
}

// ── Types ──────────────────────────────────────────────────────────
interface Amenity {
  id: number;
  amenity_slug: string;
  name: string;
  description: string;
  vibe_tags: string;
  terminal_code: string;
  opening_hours: string;
  price_level: string;
  logo_url: string;
}

const TERMINAL_SHORT: Record<string, string> = {
  'SIN-T1': 'T1', 'SIN-T2': 'T2', 'SIN-T3': 'T3',
  'SIN-T4': 'T4', 'SIN-JEWEL': 'Jewel',
};

// ── Fallback gradient per vibe (shows when image is missing) ───────
const VIBE_FALLBACK: Record<string, string> = {
  Comfort:  'linear-gradient(160deg, #4C1D95 0%, #7C3AED 100%)',
  Chill:    'linear-gradient(160deg, #0C4A6E 0%, #0284C7 100%)',
  Refuel:   'linear-gradient(160deg, #7C2D12 0%, #EA580C 100%)',
  Explore:  'linear-gradient(160deg, #064E3B 0%, #059669 100%)',
  Work:     'linear-gradient(160deg, #1E293B 0%, #475569 100%)',
  Shop:     'linear-gradient(160deg, #831843 0%, #DB2777 100%)',
  Quick:    'linear-gradient(160deg, #78350F 0%, #D97706 100%)',
};

// ── AmenityCard ────────────────────────────────────────────────────
const AmenityCard: React.FC<{
  amenity: Amenity;
  vibeKey: string;
  onClick: () => void;
}> = ({ amenity, vibeKey, onClick }) => {
  const [imgError, setImgError] = useState(false);
  const open = isOpenNow(amenity.opening_hours);
  const term = TERMINAL_SHORT[amenity.terminal_code] || amenity.terminal_code;
  const hasPhoto = !!amenity.logo_url && !imgError;

  return (
    <button
      onClick={onClick}
      className="flex-shrink-0 text-left group"
      style={{ width: '176px' }}
    >
      {/* Card — 176×224px, 4:5 ratio */}
      <div
        className="relative rounded-2xl overflow-hidden active:scale-[0.97] transition-transform duration-150"
        style={{
          width: '176px',
          height: '224px',
          background: hasPhoto ? undefined : VIBE_FALLBACK[vibeKey],
        }}
      >
        {/* Hero image */}
        {hasPhoto && (
          <img
            src={amenity.logo_url}
            alt={amenity.name}
            onError={() => setImgError(true)}
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
          />
        )}

        {/* Cinematic gradient overlay:
            transparent at top → deep black at bottom
            Gives image maximum breathing room while keeping text readable */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.08) 40%, rgba(0,0,0,0.55) 70%, rgba(0,0,0,0.88) 100%)',
          }}
        />

        {/* Top badges row */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
          {/* Terminal pill */}
          <span
            className="text-[10px] font-semibold text-white px-2 py-0.5 rounded-full"
            style={{ background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)' }}
          >
            {term}
          </span>

          {/* Closed badge — only shown if closed */}
          {!open && (
            <span
              className="text-[10px] font-medium text-white/80 px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(8px)' }}
            >
              Closed
            </span>
          )}
        </div>

        {/* Bottom content */}
        <div className="absolute bottom-0 left-0 right-0 p-3.5">
          <h3 className="font-semibold text-white text-[13px] leading-snug line-clamp-2 mb-1">
            {amenity.name}
          </h3>
          <div className="flex items-center gap-2">
            {amenity.price_level && amenity.price_level !== 'unknown' && (
              <span className="text-[11px] text-white/60 font-medium">
                {amenity.price_level}
              </span>
            )}
            {amenity.opening_hours === '24/7' && (
              <span className="text-[11px] text-white/60">Open 24/7</span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
};

// ── VibeSection ────────────────────────────────────────────────────
const VibeSection: React.FC<{
  vibe: typeof VIBES[number];
  amenities: Amenity[];
  onAmenityClick: (slug: string) => void;
  onSeeAll: () => void;
}> = ({ vibe, amenities, onAmenityClick, onSeeAll }) => {
  if (amenities.length === 0) return null;

  return (
    <section className="py-4">
      {/* Section header */}
      <div className="px-4 flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <span className="text-xl">{vibe.icon}</span>
          <div>
            <h2 className="text-[15px] font-bold text-white leading-none">{vibe.label}</h2>
            <p className="text-[11px] text-white/45 mt-0.5">{vibe.desc}</p>
          </div>
        </div>
        <button
          onClick={onSeeAll}
          className="flex items-center gap-0.5 text-[12px] text-white/40 hover:text-white/70 transition-colors"
        >
          See all
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Horizontal scroll */}
      <div className="relative">
        <div
          className="flex gap-3 overflow-x-auto px-4 pb-1 scrollbar-hide"
          style={{ WebkitOverflowScrolling: 'touch', scrollSnapType: 'x mandatory' }}
        >
          {amenities.map(amenity => (
            <div key={amenity.id} style={{ scrollSnapAlign: 'start' }}>
              <AmenityCard
                amenity={amenity}
                vibeKey={vibe.key}
                onClick={() => onAmenityClick(amenity.amenity_slug)}
              />
            </div>
          ))}
        </div>

        {/* Right fade — signals scrollability */}
        <div
          className="absolute right-0 top-0 bottom-1 w-10 pointer-events-none"
          style={{ background: 'linear-gradient(to left, #0a0a0f, transparent)' }}
        />
      </div>
    </section>
  );
};

// ── HomePage ───────────────────────────────────────────────────────
export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [sections, setSections] = useState<{ vibe: typeof VIBES[number]; amenities: Amenity[] }[]>([]);
  const [loading, setLoading] = useState(true);
  const [terminal, setTerminal] = useState('all');
  const [showPicker, setShowPicker] = useState(false);

  const loadVibes = useCallback(async () => {
    setLoading(true);
    const vibeOrder = getVibeOrder();
    const orderedVibes = vibeOrder.map(k => VIBES.find(v => v.key === k)!);
    const results = [];

    for (const vibe of orderedVibes) {
      let q = supabase
        .from('amenity_detail')
        .select('id, amenity_slug, name, description, vibe_tags, terminal_code, opening_hours, price_level, logo_url')
        .eq('airport_code', 'SIN')
        .ilike('vibe_tags', `%${vibe.key}%`)
        .not('logo_url', 'is', null)  // Prefer amenities with photos
        .limit(21);

      if (terminal !== 'all') q = q.eq('terminal_code', terminal);

      const { data } = await q;

      // Sort: open first, then shuffle within each group
      const shuffled = (data || []).sort(() => Math.random() - 0.5);
      const open   = shuffled.filter(a => isOpenNow(a.opening_hours));
      const closed = shuffled.filter(a => !isOpenNow(a.opening_hours));
      results.push({ vibe, amenities: [...open, ...closed].slice(0, 9) });
    }

    setSections(results);
    setLoading(false);
  }, [terminal]);

  useEffect(() => { loadVibes(); }, [loadVibes]);

  const termLabel = terminal === 'all' ? 'All Terminals' : (TERMINAL_SHORT[terminal] || terminal);

  // ── Skeleton ─────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen pb-24" style={{ background: '#0a0a0f' }}>
        <div className="px-4 pt-12 pb-4">
          <div className="h-6 w-28 rounded-lg animate-pulse mb-1.5" style={{ background: '#1a1a25' }} />
          <div className="h-4 w-20 rounded animate-pulse" style={{ background: '#151520' }} />
        </div>
        {[1, 2, 3].map(i => (
          <div key={i} className="py-4 px-4">
            <div className="h-5 w-20 rounded animate-pulse mb-3" style={{ background: '#1a1a25' }} />
            <div className="flex gap-3">
              {[1, 2, 3].map(j => (
                <div
                  key={j}
                  className="rounded-2xl animate-pulse flex-shrink-0"
                  style={{ width: 176, height: 224, background: '#151520' }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen pb-24" style={{ background: '#0a0a0f' }}>

      {/* Header */}
      <header
        className="sticky top-0 z-50 px-4 pt-12 pb-3"
        style={{ background: 'rgba(10,10,15,0.92)', backdropFilter: 'blur(12px)' }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight">Terminal+</h1>
            <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.38)' }}>
              {getTimeLabel()} · Changi Airport
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Search button */}
            <button
              onClick={() => navigate('/search')}
              className="p-2 rounded-full transition-colors"
              style={{ background: 'rgba(255,255,255,0.08)' }}
            >
              <Search className="w-4 h-4 text-white/70" />
            </button>

            {/* Terminal picker */}
            <div className="relative">
              <button
                onClick={() => setShowPicker(!showPicker)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium text-white/80 transition-colors"
                style={{ background: 'rgba(255,255,255,0.08)' }}
              >
                <MapPin className="w-3 h-3 text-white/60" />
                {termLabel}
              </button>

              {showPicker && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowPicker(false)} />
                  <div
                    className="absolute right-0 top-full mt-2 z-50 rounded-xl py-1 min-w-[168px]"
                    style={{ background: '#1a1a25', border: '1px solid rgba(255,255,255,0.08)' }}
                  >
                    {[
                      { value: 'all',       label: 'All Terminals' },
                      { value: 'SIN-T1',    label: 'Terminal 1' },
                      { value: 'SIN-T2',    label: 'Terminal 2' },
                      { value: 'SIN-T3',    label: 'Terminal 3' },
                      { value: 'SIN-T4',    label: 'Terminal 4' },
                      { value: 'SIN-JEWEL', label: 'Jewel' },
                    ].map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => { setTerminal(opt.value); setShowPicker(false); }}
                        className="w-full text-left px-4 py-2.5 text-[13px] transition-colors"
                        style={{
                          color: terminal === opt.value ? '#a78bfa' : 'rgba(255,255,255,0.7)',
                          background: terminal === opt.value ? 'rgba(167,139,250,0.08)' : undefined,
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Vibe Feed */}
      <div className="pt-2">
        {sections.map(({ vibe, amenities }) => (
          <VibeSection
            key={vibe.key}
            vibe={vibe}
            amenities={amenities}
            onAmenityClick={(slug) => navigate(`/amenity/${slug}`)}
            onSeeAll={() => navigate(`/vibe/${vibe.key.toLowerCase()}`)}
          />
        ))}
      </div>

    </div>
  );
};

export default HomePage;
