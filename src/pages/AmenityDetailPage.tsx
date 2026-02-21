// src/pages/AmenityDetailPage.tsx
// Redesigned: taller hero, richer content, mobile-first hierarchy

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Clock, MapPin, DollarSign, Globe, ExternalLink, ChevronRight, Bookmark, Share2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

// ── Types ──────────────────────────────────────────────────────────
interface AmenityData {
  id: number;
  amenity_slug: string;
  name: string;
  description: string;
  vibe_tags: string;
  terminal_code: string;
  airport_code: string;
  opening_hours: string;
  price_level: string;
  logo_url: string;
  website_url: string;
  booking_required: string;
  available_in_tr: string;
  walking_time_minutes?: string;
  category?: string;
}

// ── Helpers ──────────────────────────────────────────────────────────
const TERMINAL_NAMES: Record<string, string> = {
  'SIN-T1': 'Terminal 1',
  'SIN-T2': 'Terminal 2',
  'SIN-T3': 'Terminal 3',
  'SIN-T4': 'Terminal 4',
  'SIN-JEWEL': 'Jewel Changi',
};

const VIBE_COLORS: Record<string, string> = {
  'Comfort':  'bg-violet-500/20 text-violet-400 border border-violet-500/20',
  'Chill':    'bg-sky-500/20 text-sky-400 border border-sky-500/20',
  'Refuel':   'bg-orange-500/20 text-orange-400 border border-orange-500/20',
  'Explore':  'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20',
  'Work':     'bg-slate-500/20 text-slate-400 border border-slate-500/20',
  'Shop':     'bg-pink-500/20 text-pink-400 border border-pink-500/20',
  'Quick':    'bg-amber-500/20 text-amber-400 border border-amber-500/20',
};

// Category → emoji for quick-scan facts
const CATEGORY_EMOJI: Record<string, string> = {
  'Food & Dining': '🍽️',
  'Electronics': '📱',
  'Fashion': '👗',
  'Wellness': '🧘',
  'Lounge': '🛋️',
  'Hotel': '🏨',
  'Entertainment': '🎮',
  'Services': '🛎️',
  'Shopping': '🛍️',
  'Beauty': '💆',
  'Art': '🎨',
  'Finance': '💱',
};

function isOpenNow(hours: string): { open: boolean; label: string } {
  if (!hours) return { open: true, label: 'Hours not listed' };
  if (hours === '24/7') return { open: true, label: 'Open 24 hours' };

  const match = hours.match(/(\d{2}):(\d{2})\s*[-–]\s*(\d{2}):(\d{2})/);
  if (!match) return { open: true, label: hours };

  const [, openH, openM, closeH, closeM] = match.map(Number);
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const openMinutes = openH * 60 + openM;
  let closeMinutes = closeH * 60 + closeM;

  if (closeMinutes <= openMinutes) {
    closeMinutes += 24 * 60;
    if (currentMinutes < openMinutes) {
      const isOpen = currentMinutes + 24 * 60 < closeMinutes;
      return {
        open: isOpen,
        label: isOpen
          ? `Open until ${String(closeH).padStart(2,'0')}:${String(closeM).padStart(2,'0')}`
          : `Opens ${String(openH).padStart(2,'0')}:${String(openM).padStart(2,'0')}`
      };
    }
  }

  const isOpen = currentMinutes >= openMinutes && currentMinutes < closeMinutes;
  if (isOpen) {
    return { open: true, label: `Open until ${String(closeH).padStart(2,'0')}:${String(closeM).padStart(2,'0')}` };
  } else {
    // How long until opening?
    const minsUntilOpen = openMinutes > currentMinutes
      ? openMinutes - currentMinutes
      : (openMinutes + 24 * 60) - currentMinutes;
    const hoursUntil = Math.floor(minsUntilOpen / 60);
    const soonLabel = hoursUntil < 2
      ? `Opens in ${minsUntilOpen}min`
      : `Opens ${String(openH).padStart(2,'0')}:${String(openM).padStart(2,'0')}`;
    return { open: false, label: `Closed · ${soonLabel}` };
  }
}

function getPriceLabel(price: string): string {
  if (!price || price === 'unknown') return '';
  const map: Record<string, string> = {
    '$': 'Budget-friendly',
    '$$': 'Mid-range',
    '$$$': 'Premium',
    '$$$$': 'Luxury',
  };
  return map[price] || price;
}

// ── Component ──────────────────────────────────────────────────────
export default function AmenityDetailPage() {
  const { slug } = useParams<{ slug: string; terminalCode?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const vibeFromRoute = (location.state as { vibe?: string })?.vibe || null;
  const [amenity, setAmenity] = useState<AmenityData | null>(null);
  const [vibeDescription, setVibeDescription] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [similarAmenities, setSimilarAmenities] = useState<AmenityData[]>([]);
  const [imgError, setImgError] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadAmenity = async () => {
      if (!slug) { setError(true); setLoading(false); return; }
      setLoading(true);
      setError(false);
      setImgError(false);

      const { data, error: fetchError } = await supabase
        .from('amenity_detail')
        .select('*')
        .eq('amenity_slug', slug)
        .single();

      if (!mounted) return;
      if (fetchError || !data) { setError(true); setLoading(false); return; }

      setAmenity(data);

      // Fetch vibe-specific description if we arrived from a vibe context
      if (vibeFromRoute) {
        const { data: vibeDesc } = await supabase
          .from('amenity_vibe_descriptions')
          .select('description')
          .eq('amenity_id', data.id)
          .eq('vibe', vibeFromRoute)
          .single();

        if (mounted && vibeDesc?.description) {
          setVibeDescription(vibeDesc.description);
        }
      }

      // Load similar — same primary vibe, same terminal
      const primaryVibe = data.vibe_tags?.split(',')[0]?.trim();
      if (primaryVibe) {
        const { data: similar } = await supabase
          .from('amenity_detail')
          .select('id, amenity_slug, name, terminal_code, opening_hours, price_level, vibe_tags, logo_url, category')
          .eq('airport_code', 'SIN')
          .eq('terminal_code', data.terminal_code)
          .ilike('vibe_tags', `%${primaryVibe}%`)
          .neq('id', data.id)
          .limit(8);

        if (mounted && similar) {
          setSimilarAmenities(similar.sort(() => Math.random() - 0.5).slice(0, 4));
        }
      }

      setLoading(false);
    };

    loadAmenity();
    return () => { mounted = false; };
  }, [slug, vibeFromRoute]);

  // ── Loading ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f]">
        <div className="h-72 bg-white/5 animate-pulse" />
        <div className="px-4 pt-5 space-y-3">
          <div className="h-8 w-3/4 bg-white/10 rounded-lg animate-pulse" />
          <div className="h-4 w-1/2 bg-white/5 rounded animate-pulse" />
          <div className="h-20 bg-white/5 rounded-xl animate-pulse mt-4" />
        </div>
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────────────
  if (error || !amenity) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-4xl mb-4">😕</p>
          <h2 className="text-xl font-bold text-white mb-2">Not found</h2>
          <p className="text-gray-400 text-sm mb-6">We couldn't find "{slug?.replace(/-/g, ' ')}"</p>
          <button onClick={() => navigate('/')} className="px-6 py-2.5 bg-white text-[#0a0a0f] rounded-full text-sm font-medium">
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  // ── Derived ──────────────────────────────────────────────────────
  const vibes = amenity.vibe_tags?.split(',').map(v => v.trim()).filter(Boolean) || [];
  const terminalName = TERMINAL_NAMES[amenity.terminal_code] || amenity.terminal_code;
  const openStatus = isOpenNow(amenity.opening_hours);
  const isTransit = amenity.available_in_tr === 'true' || amenity.available_in_tr === 'TRUE';
  const priceLabel = getPriceLabel(amenity.price_level);
  const categoryEmoji = CATEGORY_EMOJI[amenity.category || ''] || '📍';
  const walkTime = amenity.walking_time_minutes ? `${amenity.walking_time_minutes} min walk from gates` : null;

  // ── Render ──────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0a0a0f] pb-24">

      {/* ── Hero Image — full bleed, tall, with gradient overlay ── */}
      <div className="relative w-full h-72 bg-[#13131a]">
        {amenity.logo_url && !imgError ? (
          <img
            src={amenity.logo_url}
            alt={amenity.name}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-6xl opacity-20">{categoryEmoji}</span>
          </div>
        )}

        {/* Dark gradient so header controls stay readable */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80" />

        {/* Back button — overlaid on hero */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 p-2 bg-black/40 backdrop-blur-sm rounded-full border border-white/10"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>

        {/* Save + Share — overlaid top right */}
        <div className="absolute top-4 right-4 flex gap-2">
          <button
            onClick={() => setSaved(s => !s)}
            className="p-2 bg-black/40 backdrop-blur-sm rounded-full border border-white/10"
          >
            <Bookmark className={`w-4 h-4 ${saved ? 'text-amber-400 fill-amber-400' : 'text-white'}`} />
          </button>
          <button
            onClick={() => navigator.share?.({ title: amenity.name, url: window.location.href })}
            className="p-2 bg-black/40 backdrop-blur-sm rounded-full border border-white/10"
          >
            <Share2 className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Name overlaid at bottom of hero */}
        <div className="absolute bottom-0 left-0 right-0 px-4 pb-4">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            {vibes.map(vibe => (
              <span key={vibe} className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${VIBE_COLORS[vibe] || 'bg-white/10 text-gray-200'}`}>
                {vibe}
              </span>
            ))}
            {isTransit && (
              <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/20">
                Transit ✓
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-white leading-tight">{amenity.name}</h1>
          <p className="text-sm text-gray-300 mt-0.5">{terminalName} · Changi Airport</p>
        </div>
      </div>

      {/* ── Quick facts strip ── */}
      <div className="flex items-center gap-0 border-b border-white/10 bg-[#13131a]">
        {/* Open status */}
        <div className="flex-1 flex flex-col items-center py-3 border-r border-white/10">
          <div className={`flex items-center gap-1.5 text-sm font-semibold ${openStatus.open ? 'text-green-400' : 'text-red-400'}`}>
            <div className={`w-2 h-2 rounded-full ${openStatus.open ? 'bg-green-500' : 'bg-red-400'}`} />
            {openStatus.open ? 'Open' : 'Closed'}
          </div>
          <p className="text-xs text-gray-500 mt-0.5">{openStatus.label.replace('Open until ', 'Until ').replace('Closed · ', '')}</p>
        </div>

        {/* Price */}
        {amenity.price_level && amenity.price_level !== 'unknown' && (
          <div className="flex-1 flex flex-col items-center py-3 border-r border-white/10">
            <p className="text-sm font-semibold text-white">{amenity.price_level}</p>
            <p className="text-xs text-gray-500 mt-0.5">{priceLabel}</p>
          </div>
        )}

        {/* Walk time */}
        {walkTime && (
          <div className="flex-1 flex flex-col items-center py-3">
            <p className="text-sm font-semibold text-white">{amenity.walking_time_minutes}min</p>
            <p className="text-xs text-gray-500 mt-0.5">from gates</p>
          </div>
        )}

        {/* Booking required */}
        {amenity.booking_required === 'true' && (
          <div className="flex-1 flex flex-col items-center py-3">
            <p className="text-sm font-semibold text-amber-400">Book</p>
            <p className="text-xs text-gray-500 mt-0.5">required</p>
          </div>
        )}
      </div>

      {/* ── Content ── */}
      <div className="px-4 pt-5">

        {/* Description — vibe-specific if available, otherwise generic */}
        {(vibeDescription || amenity.description) && (
          <div className="mb-6">
            <p className="text-gray-200 text-[15px] leading-relaxed">
              {vibeDescription || amenity.description}
            </p>
          </div>
        )}

        {/* Hours detail */}
        <div className="flex items-center gap-3 p-4 bg-[#13131a] rounded-xl mb-3">
          <Clock className="w-5 h-5 text-gray-500 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-white">
              {amenity.opening_hours === '24/7' ? 'Open 24 hours, every day' : amenity.opening_hours || 'Hours not confirmed'}
            </p>
            {amenity.opening_hours !== '24/7' && (
              <p className="text-xs text-gray-500 mt-0.5">Daily</p>
            )}
          </div>
        </div>

        {/* Location */}
        <div className="flex items-center gap-3 p-4 bg-[#13131a] rounded-xl mb-3">
          <MapPin className="w-5 h-5 text-gray-500 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-white">{terminalName}</p>
            <p className="text-xs text-gray-500 mt-0.5">
              Changi Airport, Singapore{walkTime ? ` · ${walkTime}` : ''}
            </p>
          </div>
        </div>

        {/* Website */}
        {amenity.website_url && amenity.website_url !== 'null' && (
          <a
            href={amenity.website_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 bg-[#13131a] hover:bg-white/5 rounded-xl mb-3 transition-colors"
          >
            <Globe className="w-5 h-5 text-gray-500 flex-shrink-0" />
            <p className="text-sm font-medium text-blue-400 flex-1">Visit Website</p>
            <ExternalLink className="w-4 h-4 text-gray-500" />
          </a>
        )}

        {/* ── Similar Nearby ── */}
        {similarAmenities.length > 0 && (
          <div className="mt-8">
            <h3 className="text-base font-bold text-white mb-1">More like this in {terminalName}</h3>
            <p className="text-xs text-gray-500 mb-3">Same vibe, same terminal</p>
            <div className="space-y-2">
              {similarAmenities.map(sim => {
                const simOpen = isOpenNow(sim.opening_hours);
                const simEmoji = CATEGORY_EMOJI[sim.category || ''] || '📍';
                return (
                  <button
                    key={sim.id}
                    onClick={() => navigate(`/amenity/${sim.amenity_slug}`)}
                    className="w-full flex items-center gap-3 p-3 bg-[#13131a] hover:bg-white/5 rounded-xl transition-colors text-left"
                  >
                    {sim.logo_url ? (
                      <img
                        src={sim.logo_url}
                        alt={sim.name}
                        className="w-12 h-12 rounded-lg object-cover flex-shrink-0 bg-white/10"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0 text-xl">
                        {simEmoji}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{sim.name}</p>
                      <p className="text-xs mt-0.5">
                        <span className={simOpen.open ? 'text-green-400' : 'text-red-400'}>
                          {simOpen.label}
                        </span>
                        {sim.price_level && sim.price_level !== 'unknown' && (
                          <span className="text-gray-500"> · {sim.price_level}</span>
                        )}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-600 flex-shrink-0" />
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
