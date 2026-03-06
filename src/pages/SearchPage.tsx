// src/pages/SearchPage.tsx
// MVP search — queries amenity_detail via Supabase ilike

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface SearchResult {
  name: string;
  amenity_slug: string;
  terminal_code: string;
  vibe_tags: string | null;
  price_level: string | null;
  opening_hours: Record<string, string> | null;
}

const TERMINAL_SHORT: Record<string, string> = {
  'SIN-T1': 'T1', 'SIN-T2': 'T2', 'SIN-T3': 'T3',
  'SIN-T4': 'T4', 'SIN-JEWEL': 'Jewel',
};

function firstVibeTag(tags: string | null): string | null {
  if (!tags) return null;
  const first = tags.split(',')[0]?.trim();
  return first || null;
}

export default function SearchPage() {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  // Auto-focus on mount
  useEffect(() => { inputRef.current?.focus(); }, []);

  // Debounced search
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setSearched(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      const q = query.trim();
      const { data } = await supabase
        .from('amenity_detail')
        .select('name, amenity_slug, terminal_code, vibe_tags, price_level, opening_hours')
        .or(`name.ilike.%${q}%,description.ilike.%${q}%`)
        .limit(20);

      setResults(data ?? []);
      setSearched(true);
      setLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="min-h-screen" style={{ background: '#0a0a0f', color: '#f0f0f8' }}>
      {/* Header */}
      <header
        className="sticky top-0 z-50 px-3 pt-12 pb-3"
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

          <div
            className="flex-1 flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <Search className="w-4 h-4 text-white/30 flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search Changi..."
              className="flex-1 bg-transparent text-[14px] text-white placeholder-white/25 outline-none"
            />
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="px-4 pt-3 pb-24">
        {/* Empty state — no query */}
        {!searched && !loading && (
          <p className="text-[13px] mt-8 text-center" style={{ color: 'rgba(255,255,255,0.3)' }}>
            Search for restaurants, shops, lounges and more
          </p>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex flex-col gap-3 mt-2">
            {[1, 2, 3, 4].map(i => (
              <div
                key={i}
                className="rounded-xl animate-pulse"
                style={{ height: 68, background: 'rgba(255,255,255,0.04)' }}
              />
            ))}
          </div>
        )}

        {/* No results */}
        {searched && !loading && results.length === 0 && (
          <p className="text-[13px] mt-8 text-center" style={{ color: 'rgba(255,255,255,0.3)' }}>
            Nothing found for &lsquo;{query.trim()}&rsquo; — try something else
          </p>
        )}

        {/* Results */}
        {!loading && results.length > 0 && (
          <div className="flex flex-col gap-2">
            {results.map(r => {
              const tag = firstVibeTag(r.vibe_tags);
              const term = TERMINAL_SHORT[r.terminal_code] ?? r.terminal_code;
              return (
                <button
                  key={r.amenity_slug}
                  onClick={() => navigate(`/amenity/${r.amenity_slug}`)}
                  className="w-full text-left px-4 py-3.5 rounded-xl flex items-center gap-3 active:scale-[0.98] transition-transform"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] font-semibold text-white truncate">{r.name}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                        style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' }}
                      >
                        {term}
                      </span>
                      {tag && (
                        <span
                          className="text-[10px] px-2 py-0.5 rounded-full"
                          style={{ background: 'rgba(124,109,250,0.12)', color: 'rgba(124,109,250,0.8)' }}
                        >
                          {tag}
                        </span>
                      )}
                      {r.price_level && r.price_level !== 'unknown' && (
                        <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
                          {r.price_level}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-white/20 text-[18px]">&rsaquo;</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
