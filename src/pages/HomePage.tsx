// src/pages/HomePage.tsx
// MVP Vibe Feed - Queries amenity_detail directly by vibe_tags
// No collections table, no junction tables, no middleware services

import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Clock, ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { smart7Select } from '@/utils/smart7Select';

// ── Vibe Configuration ──────────────────────────────────────────────
const VIBES = [
  { key: 'Comfort', icon: '🛏️', label: 'Comfort', desc: 'Rest, recharge & recover', gradient: 'from-violet-500 to-purple-600', bg: 'bg-violet-50' },
  { key: 'Chill', icon: '😌', label: 'Chill', desc: 'Peaceful spots to unwind', gradient: 'from-sky-400 to-blue-500', bg: 'bg-sky-50' },
  { key: 'Refuel', icon: '🍜', label: 'Refuel', desc: 'Food & drinks', gradient: 'from-orange-400 to-red-500', bg: 'bg-orange-50' },
  { key: 'Explore', icon: '🧭', label: 'Explore', desc: 'Discover & experience', gradient: 'from-emerald-400 to-teal-500', bg: 'bg-emerald-50' },
  { key: 'Work', icon: '💻', label: 'Work', desc: 'Get things done', gradient: 'from-slate-500 to-gray-700', bg: 'bg-slate-50' },
  { key: 'Shop', icon: '🛍️', label: 'Shop', desc: 'Retail & duty free', gradient: 'from-pink-400 to-rose-500', bg: 'bg-pink-50' },
  { key: 'Quick', icon: '⚡', label: 'Quick', desc: 'Fast & essential', gradient: 'from-amber-400 to-yellow-500', bg: 'bg-amber-50' },
] as const;

// Time-based vibe ordering
function getVibeOrder(): string[] {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 9)   return ['Comfort', 'Refuel', 'Quick', 'Chill', 'Work', 'Explore', 'Shop'];
  if (hour >= 9 && hour < 12)  return ['Refuel', 'Work', 'Quick', 'Explore', 'Shop', 'Chill', 'Comfort'];
  if (hour >= 12 && hour < 14) return ['Refuel', 'Quick', 'Chill', 'Explore', 'Shop', 'Work', 'Comfort'];
  if (hour >= 14 && hour < 18) return ['Explore', 'Shop', 'Refuel', 'Chill', 'Quick', 'Work', 'Comfort'];
  if (hour >= 18 && hour < 22) return ['Refuel', 'Shop', 'Chill', 'Explore', 'Comfort', 'Quick', 'Work'];
  return ['Comfort', 'Chill', 'Quick', 'Refuel', 'Explore', 'Shop', 'Work']; // Late night
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12)  return 'Good morning ✈️';
  if (hour >= 12 && hour < 17) return 'Good afternoon ✈️';
  if (hour >= 17 && hour < 22) return 'Good evening ✈️';
  return 'Late night? We got you 🌙';
}

// Check if amenity is currently open
function isOpenNow(hours: string): boolean {
  if (!hours) return true;
  if (hours === '24/7') return true;
  
  const match = hours.match(/(\d{2}):(\d{2})\s*[-–]\s*(\d{2}):(\d{2})/);
  if (!match) return true; // Can't parse, assume open
  
  const [, openH, openM, closeH, closeM] = match.map(Number);
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const openMinutes = openH * 60 + openM;
  let closeMinutes = closeH * 60 + closeM;
  
  // Handle overnight hours (e.g., 06:00-01:00)
  if (closeMinutes <= openMinutes) {
    closeMinutes += 24 * 60;
    if (currentMinutes < openMinutes) {
      return currentMinutes + 24 * 60 < closeMinutes;
    }
  }
  
  return currentMinutes >= openMinutes && currentMinutes < closeMinutes;
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

interface VibeSection {
  vibe: typeof VIBES[number];
  amenities: Amenity[];
}

// ── Terminal Display Names ──────────────────────────────────────────
const TERMINAL_SHORT: Record<string, string> = {
  'SIN-T1': 'T1',
  'SIN-T2': 'T2',
  'SIN-T3': 'T3',
  'SIN-T4': 'T4',
  'SIN-JEWEL': 'Jewel',
};

// ── Component ──────────────────────────────────────────────────────
export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [sections, setSections] = useState<VibeSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [terminal, setTerminal] = useState('all'); // 'all' or specific terminal
  const [showTerminalPicker, setShowTerminalPicker] = useState(false);

  const loadVibes = useCallback(async () => {
    setLoading(true);
    const vibeOrder = getVibeOrder();
    const orderedVibes = vibeOrder.map(key => VIBES.find(v => v.key === key)!);

    const results: VibeSection[] = [];

    for (const vibe of orderedVibes) {
      let query = supabase
        .from('amenity_detail')
        .select('id, amenity_slug, name, description, vibe_tags, terminal_code, opening_hours, price_level, logo_url')
        .eq('airport_code', 'SIN')
        .ilike('vibe_tags', `%${vibe.key}%`)
        .limit(50); // Pool of 50, deduplicate to 7

      if (terminal !== 'all') {
        query = query.eq('terminal_code', terminal);
      }

      const { data, error } = await query;

      if (error) {
        console.error(`Error loading ${vibe.key}:`, error);
        results.push({ vibe, amenities: [] });
        continue;
      }

      const userTerminal = sessionStorage.getItem('tp_user_terminal') || null;
      const smart7 = terminal !== 'all'
        ? (data || []).sort((a, b) => {
            const aOpen = isOpenNow(a.opening_hours);
            const bOpen = isOpenNow(b.opening_hours);
            if (aOpen !== bOpen) return aOpen ? -1 : 1;
            return a.name.localeCompare(b.name);
          }).slice(0, 7)
        : smart7Select(data || [], userTerminal, 7);

      results.push({ vibe, amenities: smart7 });
    }

    setSections(results);
    setLoading(false);
  }, [terminal]);

  useEffect(() => {
    loadVibes();
  }, [loadVibes]);

  const terminalLabel = terminal === 'all' ? 'All Terminals' : TERMINAL_SHORT[terminal] || terminal;

  // ── Loading State ──────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="px-4 pt-12 pb-4">
          <div className="h-8 w-48 bg-gray-200 rounded-lg animate-pulse mb-2" />
          <div className="h-5 w-32 bg-gray-100 rounded animate-pulse" />
        </div>
        {[1, 2, 3].map(i => (
          <div key={i} className="px-4 py-6">
            <div className="h-6 w-24 bg-gray-200 rounded animate-pulse mb-4" />
            <div className="flex gap-3 overflow-hidden">
              {[1, 2, 3].map(j => (
                <div key={j} className="w-44 h-48 bg-gray-100 rounded-2xl animate-pulse flex-shrink-0" />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // ── Main Render ──────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
        <div className="px-4 pt-3 pb-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Terminal+</h1>
              <p className="text-sm text-gray-500">{getGreeting()}</p>
            </div>
            
            {/* Terminal Picker */}
            <div className="relative">
              <button
                onClick={() => setShowTerminalPicker(!showTerminalPicker)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-sm font-medium text-gray-700 transition-colors"
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>{terminalLabel}</span>
              </button>
              
              {showTerminalPicker && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowTerminalPicker(false)} />
                  <div className="absolute right-0 top-full mt-2 z-50 bg-white rounded-xl shadow-lg border border-gray-200 py-1 min-w-[160px]">
                    {[
                      { value: 'all', label: 'All Terminals' },
                      { value: 'SIN-T1', label: 'Terminal 1' },
                      { value: 'SIN-T2', label: 'Terminal 2' },
                      { value: 'SIN-T3', label: 'Terminal 3' },
                      { value: 'SIN-T4', label: 'Terminal 4' },
                      { value: 'SIN-JEWEL', label: 'Jewel' },
                    ].map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => { setTerminal(opt.value); setShowTerminalPicker(false); }}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
                          terminal === opt.value ? 'text-blue-600 font-medium bg-blue-50' : 'text-gray-700'
                        }`}
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

      {/* Vibe Sections */}
      {sections.map(({ vibe, amenities }) => {
        if (amenities.length === 0) return null;
        
        return (
          <section key={vibe.key} className="py-5">
            {/* Vibe Header */}
            <div className="px-4 flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">{vibe.icon}</span>
                <div>
                  <h2 className="text-base font-bold text-gray-900">{vibe.label}</h2>
                  <p className="text-xs text-gray-500">{vibe.desc}</p>
                </div>
              </div>
              <button
                onClick={() => navigate(`/vibe/${vibe.key.toLowerCase()}`)}
                className="flex items-center gap-0.5 text-sm text-gray-400 hover:text-gray-600 transition-colors"
              >
                All
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Amenity Cards - Horizontal Scroll */}
            <div className="relative">
              <div
                className="flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-hide"
                style={{ WebkitOverflowScrolling: 'touch' }}
              >
                {amenities.map((amenity) => {
                  const open = isOpenNow(amenity.opening_hours);
                  const termShort = TERMINAL_SHORT[amenity.terminal_code] || amenity.terminal_code;
                  
                  return (
                    <button
                      key={amenity.id}
                      onClick={() => navigate(`/amenity/${amenity.amenity_slug}`)}
                      className="flex-shrink-0 w-40 text-left group"
                    >
                      {/* Card */}
                      <div className={`relative h-44 rounded-2xl overflow-hidden bg-gradient-to-br ${vibe.gradient} p-3.5 flex flex-col justify-between transition-transform active:scale-[0.97]`}>
                        {/* Terminal badge */}
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-semibold text-white/70 bg-white/15 px-2 py-0.5 rounded-full">
                            {termShort}
                          </span>
                          {!open && (
                            <span className="text-[10px] font-medium text-white/60 bg-black/20 px-2 py-0.5 rounded-full">
                              Closed
                            </span>
                          )}
                        </div>

                        {/* Name */}
                        <div>
                          <h3 className="font-semibold text-white text-sm leading-tight line-clamp-2 mb-1">
                            {amenity.name}
                          </h3>
                          {amenity.opening_hours && amenity.opening_hours !== '24/7' && (
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-white/50" />
                              <span className="text-[10px] text-white/60">{amenity.opening_hours}</span>
                            </div>
                          )}
                          {amenity.opening_hours === '24/7' && (
                            <span className="text-[10px] text-white/70 font-medium">24/7</span>
                          )}
                          {amenity.price_level && amenity.price_level !== 'unknown' && (
                            <span className="text-[10px] text-white/60 ml-1">{amenity.price_level}</span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
              
              {/* Right fade indicator */}
              {amenities.length > 2 && (
                <div className="absolute right-0 top-0 bottom-2 w-8 bg-gradient-to-l from-gray-50 to-transparent pointer-events-none" />
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
};

export default HomePage;
