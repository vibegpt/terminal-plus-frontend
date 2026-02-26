// src/pages/HomePage.tsx
// MVP Vibe Feed — photo cards, deduplicated by name, no price display on cards

import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, ChevronRight, Search } from 'lucide-react';
import { supabase } from '@/lib/supabase';

// ── Vibe Configuration ─────────────────────────────────────────────
const VIBES = [
  { key: 'Comfort',  icon: '🛏️', label: 'Comfort',  desc: 'Rest & recharge'      },
  { key: 'Chill',    icon: '😌', label: 'Chill',    desc: 'Peaceful spots'        },
  { key: 'Refuel',   icon: '🍜', label: 'Refuel',   desc: 'Food & drinks'         },
  { key: 'Explore',  icon: '🧭', label: 'Explore',  desc: 'Discover Changi'       },
  { key: 'Work',     icon: '💻', label: 'Work',     desc: 'Get things done'       },
  { key: 'Shop',     icon: '🛍️', label: 'Shop',     desc: 'Retail & duty free'    },
  { key: 'Quick',    icon: '⚡', label: 'Quick',    desc: 'Fast & essential'      },
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

// ── Deduplication ──────────────────────────────────────────────────
// Remove duplicates by normalised name (handles "Zara" at T2 + T4)
// Keeps the first occurrence (open ones sorted first, so open wins)
function deduplicateByName(amenities: Amenity[]): Amenity[] {
  const seen = new Set<string>();
  return amenities.filter(a => {
    const key = a.name.toLowerCase().trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
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
  logo_url: string;
}

const TERMINAL_SHORT: Record<string, string> = {
  'SIN-T1': 'T1', 'SIN-T2': 'T2', 'SIN-T3': 'T3',
  'SIN-T4': 'T4', 'SIN-JEWEL': 'Jewel',
};

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
    <button onClick={onClick} className="flex-shrink-0 text-left" style={{ width: 176 }}>
      <div
        className="relative rounded-2xl overflow-hidden active:scale-[0.97] transition-transform duration-150"
        style={{
          width: 176,
          height: 224,
          background: hasPhoto ? undefined : VIBE_FALLBACK[vibeKey],
        }}
      >
        {/* Hero photo */}
        {hasPhoto && (
          <img
            src={amenity.logo_url}
            alt={amenity.name}
            onError={() => setImgError(true)}
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
          />
        )}

        {/* Cinematic overlay */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.1) 35%, rgba(0,0,0,0.6) 65%, rgba(0,0,0,0.92) 100%)',
          }}
        />

        {/* Top: terminal badge + closed indicator */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
          <span
            className="text-[10px] font-semibold text-white px-2 py-0.5 rounded-full"
            style={{ background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)' }}
          >
            {term}
          </span>
          {!open && (
            <span
              className="text-[10px] font-medium text-white/75 px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}
            >
              Closed
            </span>
          )}
        </div>

        {/* Bottom: name only */}
        <div className="absolute bottom-0 left-0 right-0 p-3.5">
          <h3 className="font-semibold text-white text-[13px] leading-snug line-clamp-2">
            {amenity.name}
          </h3>
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
      <div className="px-4 flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <span className="text-xl">{vibe.icon}</span>
          <div>
            <h2 className="text-[15px] font-bold text-white leading-none">{vibe.label}</h2>
            <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{vibe.desc}</p>
          </div>
        </div>
        <button
          onClick={onSeeAll}
          className="flex items-center gap-0.5 text-[12px] transition-colors"
          style={{ color: 'rgba(255,255,255,0.35)' }}
        >
          See all <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

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
        {/* Scroll fade indicator */}
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
        // No price_level in select — not needed on card
        .select('id, amenity_slug, name, description, vibe_tags, terminal_code, opening_hours, logo_url')
        .eq('airport_code', 'SIN')
        .ilike('vibe_tags', `%${vibe.key}%`)
        .limit(40); // Fetch more to survive deduplication

      if (terminal !== 'all') q = q.eq('terminal_code', terminal);

      const { data } = await q;

      const shuffled = (data || []).sort(() => Math.random() - 0.5);
      const open   = shuffled.filter(a => isOpenNow(a.opening_hours));
      const closed = shuffled.filter(a => !isOpenNow(a.opening_hours));

      // Dedup AFTER sort so open wins over closed duplicate
      const deduped = deduplicateByName([...open, ...closed]);

      results.push({ vibe, amenities: deduped.slice(0, 9) });
    }

    setSections(results);
    setLoading(false);
  }, [terminal]);

  useEffect(() => { loadVibes(); }, [loadVibes]);

  const termLabel = terminal === 'all' ? 'All Terminals' : (TERMINAL_SHORT[terminal] || terminal);

  if (loading) {
    return (
      <div className="min-h-screen pb-24" style={{ background: '#0a0a0f' }}>
        <div className="px-4 pt-14 pb-4">
          <div className="h-6 w-28 rounded-lg animate-pulse mb-1.5" style={{ background: '#1a1a25' }} />
          <div className="h-3.5 w-36 rounded animate-pulse" style={{ background: '#151520' }} />
        </div>
        {[1, 2, 3].map(i => (
          <div key={i} className="py-4 px-4">
            <div className="h-5 w-20 rounded animate-pulse mb-3" style={{ background: '#1a1a25' }} />
            <div className="flex gap-3">
              {[1, 2, 3].map(j => (
                <div key={j} className="rounded-2xl animate-pulse flex-shrink-0"
                  style={{ width: 176, height: 224, background: '#151520' }} />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

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
            <button
              onClick={() => navigate('/search')}
              className="p-2 rounded-full"
              style={{ background: 'rgba(255,255,255,0.08)' }}
            >
              <Search className="w-4 h-4 text-white/70" />
            </button>

            <div className="relative">
              <button
                onClick={() => setShowPicker(!showPicker)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium text-white/80"
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

      <div className="pt-2">
        {sections.map(({ vibe, amenities }) => (
          <VibeSection
            key={vibe.key}
            vibe={vibe}
            amenities={amenities}
            onAmenityClick={slug => navigate(`/amenity/${slug}`)}
            onSeeAll={() => navigate(`/vibe/${vibe.key.toLowerCase()}`)}
          />
        ))}
      </div>

    </div>
  );
};

export default HomePage;
