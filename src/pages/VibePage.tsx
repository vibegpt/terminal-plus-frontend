// src/pages/VibePage.tsx
// Full list view for a single vibe - what users see when they tap "All >"

import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, MapPin } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { smart7Select, type AmenityRow } from '@/utils/smart7Select';
import { DISPLAY } from '@/lib/displayConfig';
import { track, trackImpressionOnce } from '@/lib/telemetry';
import { usePageMeta } from '@/hooks/usePageMeta';
import { useEligibility } from '@/lib/eligibility';
import { AccessChip, LandsideNotice, OpensChip } from '@/components/EligibilityChips';
import { hoursLabel, landsideAccess, openNow, pickEligible } from '../../shared/ranking/policy';

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

// ── Component ──────────────────────────────────────────────────────
export default function VibePage() {
  const { vibeId } = useParams<{ vibeId: string }>();
  const navigate = useNavigate();
  const [pool, setPool] = useState<AmenityRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [terminalFilter, setTerminalFilter] = useState('all');
  const eligibility = useEligibility();

  const vibe = VIBE_CONFIG[vibeId?.toLowerCase() || ''];
  const vibeKey = vibe?.dbTag || vibeId || '';
  usePageMeta(vibe ? `${vibe.label} at Changi · Terminal+` : null);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);

      let query = supabase
        .from('amenity_detail')
        .select('id, amenity_slug, name, description, terminal_code, opening_hours, price_level, vibe_tags, logo_url, editorial_score, is_landside')
        .eq('airport_code', 'SIN')
        .ilike('vibe_tags', `%${vibeKey}%`)
        // RANKING: editorial_score DESC — keep in sync with api/lib
        .order('editorial_score', { ascending: false, nullsFirst: false })
        .order('name')
        .limit(50);

      if (terminalFilter !== 'all') {
        query = query.eq('terminal_code', terminalFilter);
      }

      const { data, error } = await query;

      if (mounted) {
        if (error) console.error('Error loading vibe amenities:', error);
        setPool(error ? [] : (data as AmenityRow[]) || []);
        setLoading(false);
      }
    };

    load();
    return () => { mounted = false; };
  }, [vibeKey, terminalFilter]);

  // Both eligibility rules, then the top 7 (shared/ranking/policy.ts).
  const amenities = useMemo(() => {
    if (terminalFilter === 'all') {
      const userTerminal = sessionStorage.getItem('tp_user_terminal') || null;
      return smart7Select(pool, userTerminal, DISPLAY.COLLECTION_VISIBLE, eligibility);
    }
    return pickEligible(pool, eligibility, DISPLAY.COLLECTION_VISIBLE, (rows, n) =>
      [...rows].sort((a, b) => {
        // RANKING: editorial_score DESC — keep in sync with api/lib
        const scoreDiff = (b.editorial_score ?? 0) - (a.editorial_score ?? 0);
        if (scoreDiff !== 0) return scoreDiff;
        return a.name.localeCompare(b.name);
      }).slice(0, n),
      a => a.amenity_slug,
    );
  }, [pool, terminalFilter, eligibility]);

  // The Jewel tab, when the rule keeps Jewel out of this passenger's lists.
  const jewelReason = terminalFilter === 'SIN-JEWEL'
    ? landsideAccess({ isLandside: true, ...eligibility }).reason
    : null;

  // Impression: keyed on list content, not renders — telemetry dedups
  // identical ordered slug lists per session
  useEffect(() => {
    if (!loading && amenities.length > 0) {
      trackImpressionOnce({
        vibe: vibeId?.toLowerCase() ?? null,
        slugs: amenities.map(a => a.amenity_slug),
      });
    }
  }, [amenities, loading, vibeId]);

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
          jewelReason ? (
            <div className="py-6"><LandsideNotice text={jewelReason} /></div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 text-sm">No {vibe.label.toLowerCase()} spots found</p>
            </div>
          )
        ) : (
          amenities.map((amenity, index) => {
            const termShort = TERMINAL_SHORT[amenity.terminal_code] || amenity.terminal_code;

            return (
              <button
                key={amenity.id}
                onClick={() => {
                  track('amenity_tapped', {
                    amenity_slug: amenity.amenity_slug,
                    position: index,
                    vibe: vibeId?.toLowerCase() ?? null,
                  });
                  navigate(`/amenity/${amenity.amenity_slug}`, { state: { vibe: vibeId } });
                }}
                className="w-full flex items-center gap-3 p-3.5 bg-[#13131a] rounded-xl text-left transition-colors hover:bg-white/5 active:bg-white/10"
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
                    <OpensChip label={amenity.opens_label} />
                  </div>
                  {amenity.access_label && (
                    <div className="mb-1"><AccessChip label={amenity.access_label} /></div>
                  )}
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {termShort}
                    </span>
                    {amenity.opening_hours && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {hoursLabel(openNow({ openingHours: amenity.opening_hours, nowSgt: eligibility.nowSgt }), amenity.opening_hours)}
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
