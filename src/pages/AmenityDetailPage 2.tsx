// src/pages/AmenityDetailPage.tsx
// MVP Amenity Detail - Loads real data from amenity_detail by slug

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, MapPin, DollarSign, Globe, ExternalLink, ChevronRight } from 'lucide-react';
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
  'Comfort': 'bg-violet-100 text-violet-700',
  'Chill': 'bg-sky-100 text-sky-700',
  'Refuel': 'bg-orange-100 text-orange-700',
  'Explore': 'bg-emerald-100 text-emerald-700',
  'Work': 'bg-slate-100 text-slate-700',
  'Shop': 'bg-pink-100 text-pink-700',
  'Quick': 'bg-amber-100 text-amber-700',
};

function isOpenNow(hours: string): { open: boolean; label: string } {
  if (!hours) return { open: true, label: 'Hours unknown' };
  if (hours === '24/7') return { open: true, label: 'Open 24/7' };
  
  const match = hours.match(/(\d{2}):(\d{2})\s*[-–]\s*(\d{2}):(\d{2})/);
  if (!match) return { open: true, label: hours };
  
  const [, openH, openM, closeH, closeM] = match.map(Number);
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const openMinutes = openH * 60 + openM;
  let closeMinutes = closeH * 60 + closeM;
  
  // Handle overnight hours
  if (closeMinutes <= openMinutes) {
    closeMinutes += 24 * 60;
    if (currentMinutes < openMinutes) {
      const isOpen = currentMinutes + 24 * 60 < closeMinutes;
      return { 
        open: isOpen, 
        label: isOpen ? `Open until ${String(closeH).padStart(2,'0')}:${String(closeM).padStart(2,'0')}` : `Opens at ${String(openH).padStart(2,'0')}:${String(openM).padStart(2,'0')}`
      };
    }
  }
  
  const isOpen = currentMinutes >= openMinutes && currentMinutes < closeMinutes;
  
  if (isOpen) {
    const closeHour = closeH === 0 ? '00' : String(closeH).padStart(2, '0');
    return { open: true, label: `Open until ${closeHour}:${String(closeM).padStart(2, '0')}` };
  } else {
    return { open: false, label: `Closed · Opens ${String(openH).padStart(2, '0')}:${String(openM).padStart(2, '0')}` };
  }
}

// ── Component ──────────────────────────────────────────────────────
export default function AmenityDetailPage() {
  const { slug, terminalCode } = useParams<{ slug: string; terminalCode?: string }>();
  const navigate = useNavigate();
  const [amenity, setAmenity] = useState<AmenityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [similarAmenities, setSimilarAmenities] = useState<AmenityData[]>([]);

  useEffect(() => {
    let mounted = true;
    
    const loadAmenity = async () => {
      if (!slug) { setError(true); setLoading(false); return; }
      
      setLoading(true);
      setError(false);

      const { data, error: fetchError } = await supabase
        .from('amenity_detail')
        .select('*')
        .eq('amenity_slug', slug)
        .single();

      if (!mounted) return;

      if (fetchError || !data) {
        console.error('Error loading amenity:', fetchError);
        setError(true);
        setLoading(false);
        return;
      }

      setAmenity(data);

      // Load similar amenities (same primary vibe, same terminal, excluding self)
      const primaryVibe = data.vibe_tags?.split(',')[0]?.trim();
      if (primaryVibe) {
        const { data: similar } = await supabase
          .from('amenity_detail')
          .select('id, amenity_slug, name, terminal_code, opening_hours, price_level, vibe_tags')
          .eq('airport_code', 'SIN')
          .eq('terminal_code', data.terminal_code)
          .ilike('vibe_tags', `%${primaryVibe}%`)
          .neq('id', data.id)
          .limit(6);

        if (mounted && similar) {
          setSimilarAmenities(similar.sort(() => Math.random() - 0.5).slice(0, 4));
        }
      }

      setLoading(false);
    };

    loadAmenity();
    return () => { mounted = false; };
  }, [slug]);

  // ── Loading ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="px-4 pt-4 pb-3">
          <div className="h-6 w-16 bg-gray-200 rounded animate-pulse mb-6" />
          <div className="h-8 w-3/4 bg-gray-200 rounded animate-pulse mb-2" />
          <div className="h-4 w-1/2 bg-gray-100 rounded animate-pulse mb-6" />
          <div className="h-48 bg-gray-100 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  // ── Error / Not Found ──────────────────────────────────────────
  if (error || !amenity) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-4xl mb-4">😕</p>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Amenity not found</h2>
          <p className="text-gray-500 text-sm mb-6">We couldn't find "{slug?.replace(/-/g, ' ')}"</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2.5 bg-gray-900 text-white rounded-full text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  // ── Derived Data ──────────────────────────────────────────────────
  const vibes = amenity.vibe_tags?.split(',').map(v => v.trim()).filter(Boolean) || [];
  const terminalName = TERMINAL_NAMES[amenity.terminal_code] || amenity.terminal_code;
  const openStatus = isOpenNow(amenity.opening_hours);
  const isTransit = amenity.available_in_tr === 'true' || amenity.available_in_tr === 'TRUE';

  // ── Render ──────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-white pb-24">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
        <div className="px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-1.5 -ml-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-semibold text-gray-900 truncate">{amenity.name}</h1>
            <p className="text-xs text-gray-500">{terminalName}</p>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="px-4 pt-5">
        {/* Name & Vibes */}
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{amenity.name}</h2>
        
        <div className="flex items-center gap-2 flex-wrap mb-4">
          {vibes.map(vibe => (
            <span
              key={vibe}
              className={`text-xs font-medium px-2.5 py-1 rounded-full ${VIBE_COLORS[vibe] || 'bg-gray-100 text-gray-700'}`}
            >
              {vibe}
            </span>
          ))}
          {isTransit && (
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-blue-50 text-blue-600">
              Transit Area
            </span>
          )}
        </div>

        {/* Status Bar */}
        <div className="flex items-center gap-4 py-3 border-y border-gray-100 mb-5">
          <div className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${openStatus.open ? 'bg-green-500' : 'bg-red-400'}`} />
            <span className={`text-sm font-medium ${openStatus.open ? 'text-green-700' : 'text-red-600'}`}>
              {openStatus.label}
            </span>
          </div>
          
          {amenity.price_level && amenity.price_level !== 'unknown' && (
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <DollarSign className="w-3.5 h-3.5" />
              <span>{amenity.price_level}</span>
            </div>
          )}
        </div>

        {/* Description */}
        {amenity.description && (
          <div className="mb-6">
            <p className="text-gray-600 text-sm leading-relaxed">{amenity.description}</p>
          </div>
        )}

        {/* Details Cards */}
        <div className="space-y-3 mb-6">
          {/* Location */}
          <div className="flex items-start gap-3 p-3.5 bg-gray-50 rounded-xl">
            <MapPin className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-gray-900">{terminalName}</p>
              <p className="text-xs text-gray-500">Changi Airport, Singapore</p>
            </div>
          </div>

          {/* Hours */}
          <div className="flex items-start gap-3 p-3.5 bg-gray-50 rounded-xl">
            <Clock className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-gray-900">
                {amenity.opening_hours === '24/7' ? 'Open 24 hours' : amenity.opening_hours || 'Hours not confirmed'}
              </p>
              <p className="text-xs text-gray-500">Daily</p>
            </div>
          </div>

          {/* Website */}
          {amenity.website_url && amenity.website_url !== 'null' && (
            <a
              href={amenity.website_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-3 p-3.5 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <Globe className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-blue-600">Visit Website</p>
                <p className="text-xs text-gray-500 truncate">{amenity.website_url}</p>
              </div>
              <ExternalLink className="w-4 h-4 text-gray-300 mt-0.5 flex-shrink-0" />
            </a>
          )}

          {/* Booking */}
          {amenity.booking_required === 'true' && (
            <div className="flex items-start gap-3 p-3.5 bg-amber-50 rounded-xl">
              <span className="text-lg">📋</span>
              <div>
                <p className="text-sm font-medium text-amber-900">Booking Required</p>
                <p className="text-xs text-amber-700">Reserve in advance for guaranteed access</p>
              </div>
            </div>
          )}
        </div>

        {/* Similar Nearby */}
        {similarAmenities.length > 0 && (
          <div className="mt-8">
            <h3 className="text-base font-bold text-gray-900 mb-3">More in {terminalName}</h3>
            <div className="space-y-2">
              {similarAmenities.map(sim => {
                const simOpen = isOpenNow(sim.opening_hours);
                return (
                  <button
                    key={sim.id}
                    onClick={() => navigate(`/amenity/${sim.amenity_slug}`)}
                    className="w-full flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors text-left"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{sim.name}</p>
                      <p className="text-xs text-gray-500">
                        {simOpen.open ? (
                          <span className="text-green-600">{simOpen.label}</span>
                        ) : (
                          <span className="text-red-500">{simOpen.label}</span>
                        )}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
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
