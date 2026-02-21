// src/pages/VibePage.tsx
// Full list view for a single vibe - what users see when they tap "All >"

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, MapPin } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { smart7Select } from '@/utils/smart7Select';

// ── Config ──────────────────────────────────────────────────────────
const VIBE_CONFIG: Record<string, { icon: string; label: string; gradient: string; dbTag: string }> = {
  comfort:  { icon: '🛏️', label: 'Comfort',  gradient: 'from-violet-500 to-purple-600', dbTag: 'Comfort' },
  chill:    { icon: '😌', label: 'Chill',    gradient: 'from-sky-400 to-blue-500',      dbTag: 'Chill' },
  refuel:   { icon: '🍜', label: 'Refuel',   gradient: 'from-orange-400 to-red-500',    dbTag: 'Refuel' },
  explore:  { icon: '🧭', label: 'Explore',  gradient: 'from-emerald-400 to-teal-500',  dbTag: 'Explore' },
  discover: { icon: '🧭', label: 'Discover', gradient: 'from-green-400 to-teal-400',    dbTag: 'Explore' },
  work:     { icon: '💻', label: 'Work',     gradient: 'from-slate-500 to-gray-700',    dbTag: 'Work' },
  shop:     { icon: '🛍️', label: 'Shop',     gradient: 'from-pink-400 to-rose-500',     dbTag: 'Shop' },
  quick:    { icon: '⚡', label: 'Quick',    gradient: 'from-amber-400 to-yellow-500',  dbTag: 'Quick' },
};

const TERMINAL_SHORT: Record<string, string> = {
  'SIN-T1': 'T1', 'SIN-T2': 'T2', 'SIN-T3': 'T3', 'SIN-T4': 'T4', 'SIN-JEWEL': 'Jewel',
};

function isOpenNow(hours: string): boolean {
  if (!hours || hours === '24/7') return true;
  const match = hours.match(/(\d{2}):(\d{2})\s*[-–]\s*(\d{2}):(\d{2})/);
  if (!match) return true;
  const [, openH, openM, closeH, closeM] = match.map(Number);
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const openMinutes = openH * 60 + openM;
  let closeMinutes = closeH * 60 + closeM;
  if (closeMinutes <= openMinutes) {
    closeMinutes += 24 * 60;
    if (currentMinutes < openMinutes) return currentMinutes + 24 * 60 < closeMinutes;
  }
  return currentMinutes >= openMinutes && currentMinutes < closeMinutes;
}

// ── Component ──────────────────────────────────────────────────────
export default function VibePage() {
  const { vibeId } = useParams<{ vibeId: string }>();
  const navigate = useNavigate();
  const [amenities, setAmenities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [terminalFilter, setTerminalFilter] = useState('all');

  const vibe = VIBE_CONFIG[vibeId?.toLowerCase() || ''];
  const vibeKey = vibe?.dbTag || vibeId || '';

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);

      let query = supabase
        .from('amenity_detail')
        .select('id, amenity_slug, name, description, terminal_code, opening_hours, price_level, vibe_tags, logo_url')
        .eq('airport_code', 'SIN')
        .ilike('vibe_tags', `%${vibeKey}%`)
        .order('name')
        .limit(50);

      if (terminalFilter !== 'all') {
        query = query.eq('terminal_code', terminalFilter);
      }

      const { data, error } = await query;

      if (mounted) {
        if (error) {
          console.error('Error loading vibe amenities:', error);
          setAmenities([]);
        } else {
          const userTerminal = sessionStorage.getItem('tp_user_terminal') || null;
          const result = terminalFilter !== 'all'
            ? (data || []).sort((a, b) => {
                const aOpen = isOpenNow(a.opening_hours);
                const bOpen = isOpenNow(b.opening_hours);
                if (aOpen !== bOpen) return aOpen ? -1 : 1;
                return a.name.localeCompare(b.name);
              }).slice(0, 7)
            : smart7Select(data || [], userTerminal, 7);
          setAmenities(result);
        }
        setLoading(false);
      }
    };

    load();
    return () => { mounted = false; };
  }, [vibeKey, terminalFilter]);

  if (!vibe) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center">
          <p className="text-4xl mb-3">🤷</p>
          <h2 className="text-lg font-bold text-white mb-2">Vibe not found</h2>
          <button onClick={() => navigate('/')} className="text-blue-400 text-sm">Go Home</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] pb-20">
      {/* Header */}
      <header className={`bg-gradient-to-br ${vibe.gradient} text-white`}>
        <div className="px-4 pt-4 pb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 text-white/80 hover:text-white mb-4 text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <div className="flex items-center gap-3">
            <span className="text-4xl">{vibe.icon}</span>
            <div>
              <h1 className="text-2xl font-bold">{vibe.label}</h1>
              <p className="text-white/70 text-sm">
                {loading ? '...' : `${amenities.length} spots`}
                {terminalFilter !== 'all' ? ` in ${TERMINAL_SHORT[terminalFilter]}` : ' across all terminals'}
              </p>
            </div>
          </div>
        </div>

        {/* Terminal Filter Pills */}
        <div className="px-4 pb-4">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {[
              { value: 'all', label: 'All' },
              { value: 'SIN-T1', label: 'T1' },
              { value: 'SIN-T2', label: 'T2' },
              { value: 'SIN-T3', label: 'T3' },
              { value: 'SIN-T4', label: 'T4' },
              { value: 'SIN-JEWEL', label: 'Jewel' },
            ].map(opt => (
              <button
                key={opt.value}
                onClick={() => setTerminalFilter(opt.value)}
                className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  terminalFilter === opt.value
                    ? 'bg-white text-gray-900'
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Amenity List */}
      <div className="px-4 pt-4 space-y-2">
        {loading ? (
          [...Array(6)].map((_, i) => (
            <div key={i} className="h-20 bg-[#13131a] rounded-xl animate-pulse" />
          ))
        ) : amenities.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-sm">No {vibe.label.toLowerCase()} spots found</p>
          </div>
        ) : (
          amenities.map(amenity => {
            const open = isOpenNow(amenity.opening_hours);
            const termShort = TERMINAL_SHORT[amenity.terminal_code] || amenity.terminal_code;

            return (
              <button
                key={amenity.id}
                onClick={() => navigate(`/amenity/${amenity.amenity_slug}`, { state: { vibe: vibeId } })}
                className={`w-full flex items-center gap-3 p-3.5 bg-[#13131a] rounded-xl text-left transition-colors hover:bg-white/5 active:bg-white/10 ${
                  !open ? 'opacity-60' : ''
                }`}
              >
                {amenity.logo_url ? (
                  <img
                    src={amenity.logo_url}
                    alt={amenity.name}
                    className="w-12 h-12 rounded-lg object-cover flex-shrink-0 bg-white/10"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-gray-500" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-semibold text-white truncate">{amenity.name}</p>
                    {!open && (
                      <span className="text-[10px] text-red-400 font-medium bg-red-500/15 px-1.5 py-0.5 rounded flex-shrink-0">
                        Closed
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {termShort}
                    </span>
                    {amenity.opening_hours && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {amenity.opening_hours === '24/7' ? '24/7' : amenity.opening_hours}
                      </span>
                    )}
                    {amenity.price_level && amenity.price_level !== 'unknown' && (
                      <span>{amenity.price_level}</span>
                    )}
                  </div>
                </div>
                <div className="text-gray-500">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
