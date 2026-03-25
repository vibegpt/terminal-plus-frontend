// src/pages/CollectionDetailPage.tsx
// Collection detail — shows amenities for a vibe collection
// Route: /collection/:vibeSlug/:collectionId

import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Clock, Search, Filter, ChevronDown, ChevronRight, DollarSign } from 'lucide-react';
import { supabase } from '@/lib/supabase';

// ── Helpers ──────────────────────────────────────────────────────────
const TERMINAL_SHORT: Record<string, string> = {
  'SIN-T1': 'T1', 'SIN-T2': 'T2', 'SIN-T3': 'T3', 'SIN-T4': 'T4', 'SIN-JEWEL': 'Jewel',
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

  if (closeMinutes <= openMinutes) {
    closeMinutes += 24 * 60;
    if (currentMinutes < openMinutes) {
      const isOpen = currentMinutes + 24 * 60 < closeMinutes;
      return {
        open: isOpen,
        label: isOpen
          ? `Open until ${String(closeH).padStart(2,'0')}:${String(closeM).padStart(2,'0')}`
          : `Opens at ${String(openH).padStart(2,'0')}:${String(openM).padStart(2,'0')}`
      };
    }
  }

  const open = currentMinutes >= openMinutes && currentMinutes < closeMinutes;
  if (open) {
    return { open: true, label: `Open until ${String(closeH).padStart(2,'0')}:${String(closeM).padStart(2,'0')}` };
  }
  return { open: false, label: `Closed · Opens ${String(openH).padStart(2,'0')}:${String(openM).padStart(2,'0')}` };
}

// ── Component ──────────────────────────────────────────────────────
export const CollectionDetailPage: React.FC = () => {
  const { collectionId, vibeSlug } = useParams();
  const navigate = useNavigate();
  const [collection, setCollection] = useState<any>(null);
  const [amenities, setAmenities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'distance' | 'rating' | 'name' | 'price'>('name');
  const [filterBy, setFilterBy] = useState<'all' | 'open' | 'nearby'>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Map vibe slugs to DB vibe_tags values
  const VIBE_DB_TAG: Record<string, string> = {
    comfort: 'Comfort', chill: 'Chill', refuel: 'Refuel',
    work: 'Work', shop: 'Shop', quick: 'Quick',
    discover: 'Explore', explore: 'Explore',
  };

  useEffect(() => {
    let mounted = true;

    const loadCollectionAndAmenities = async () => {
      setLoading(true);

      try {
        // Load collection details by slug
        const { data: collectionData } = await supabase
          .from('collections')
          .select('*')
          .eq('collection_id', collectionId)
          .single();

        let rawAmenities: any[] = [];

        if (collectionData) {
          // Try junction table using the collection's UUID (id)
          const { data: amenityData } = await supabase
            .from('collection_amenities')
            .select(`
              *,
              amenity_detail!inner(*)
            `)
            .eq('collection_id', collectionData.id)
            .order('priority', { ascending: true });

          rawAmenities = amenityData?.map(item => item.amenity_detail) || [];
        }

        // Fallback: if no junction data, query amenity_detail by vibe
        if (rawAmenities.length === 0 && vibeSlug) {
          const vibeTag = VIBE_DB_TAG[vibeSlug.toLowerCase()] || vibeSlug;
          const { data: vibeAmenities } = await supabase
            .from('amenity_detail')
            .select('*')
            .eq('airport_code', 'SIN')
            .ilike('vibe_tags', `%${vibeTag}%`)
            .order('name')
            .limit(21);

          // Shuffle and take up to 12 for a collection-like experience
          rawAmenities = (vibeAmenities || [])
            .sort(() => Math.random() - 0.5)
            .slice(0, 12);
        }

        if (mounted) {
          // Use DB collection or create a synthetic one from the slug
          setCollection(collectionData || {
            name: collectionId?.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
            description: `${VIBE_DB_TAG[vibeSlug?.toLowerCase() || ''] || vibeSlug} spots at Changi`,
          });
          setAmenities(rawAmenities);
        }
      } catch (error) {
        if (mounted) {
          console.error('Error loading collection:', error);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadCollectionAndAmenities();

    return () => { mounted = false; };
  }, [collectionId, vibeSlug]);

  // Smart filtering and sorting
  const filteredAndSortedAmenities = useMemo(() => {
    let filtered = [...amenities];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(amenity =>
        amenity.name?.toLowerCase().includes(query) ||
        amenity.description?.toLowerCase().includes(query) ||
        amenity.vibe_tags?.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (filterBy === 'open') {
      filtered = filtered.filter(amenity => isOpenNow(amenity.opening_hours).open);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'distance':
          return (a.terminal_code || '').localeCompare(b.terminal_code || '');
        case 'name':
          return (a.name || '').localeCompare(b.name || '');
        case 'price': {
          const priceOrder: Record<string, number> = { '$': 1, '$$': 2, '$$$': 3, '$$$$': 4 };
          return (priceOrder[a.price_level] || 2) - (priceOrder[b.price_level] || 2);
        }
        default:
          return 0;
      }
    });

    return filtered;
  }, [amenities, searchQuery, sortBy, filterBy]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="px-4 pt-4">
          <div className="h-6 w-20 bg-gray-200 rounded animate-pulse mb-4" />
          <div className="h-8 w-3/4 bg-gray-200 rounded animate-pulse mb-2" />
          <div className="h-4 w-1/2 bg-gray-100 rounded animate-pulse mb-6" />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-white rounded-xl animate-pulse mb-2" />
          ))}
        </div>
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-4xl mb-4">📦</p>
          <h2 className="text-xl font-bold mb-2">Collection not found</h2>
          <p className="text-gray-500 text-sm mb-4">This collection may have been moved or removed.</p>
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

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-1.5 -ml-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold text-gray-900 truncate">{collection.name}</h1>
              {collection.description && (
                <p className="text-xs text-gray-500 truncate">{collection.description}</p>
              )}
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="px-4 py-2 border-t border-gray-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search amenities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Filters & Sort */}
        <div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <span>{filteredAndSortedAmenities.length} of {amenities.length} spots</span>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-1 px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <Filter className="w-4 h-4" />
              <span>Filter</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {showFilters && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-500">SORT:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="name">Name</option>
                    <option value="distance">Terminal</option>
                    <option value="price">Price</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-500">SHOW:</span>
                  <div className="flex gap-1">
                    {([
                      { value: 'all', label: 'All' },
                      { value: 'open', label: 'Open Now' },
                    ] as const).map(option => (
                      <button
                        key={option.value}
                        onClick={() => setFilterBy(option.value)}
                        className={`px-2 py-1 text-xs rounded transition-colors ${
                          filterBy === option.value
                            ? 'bg-blue-100 text-blue-700 border border-blue-200'
                            : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Amenity List */}
      <div className="px-4 pt-4 space-y-2">
        {filteredAndSortedAmenities.length > 0 ? (
          filteredAndSortedAmenities.map(amenity => {
            const openStatus = isOpenNow(amenity.opening_hours);
            const termShort = TERMINAL_SHORT[amenity.terminal_code] || amenity.terminal_code;

            return (
              <button
                key={amenity.id}
                onClick={() => navigate(`/amenity/${amenity.amenity_slug}`)}
                className={`w-full flex items-center gap-3 p-3.5 bg-white rounded-xl text-left transition-colors hover:bg-gray-50 active:bg-gray-100 ${
                  !openStatus.open ? 'opacity-60' : ''
                }`}
              >
                {amenity.logo_url ? (
                  <img
                    src={amenity.logo_url}
                    alt={amenity.name}
                    className="w-12 h-12 rounded-lg object-cover flex-shrink-0 bg-gray-100"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-gray-300" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-semibold text-gray-900 truncate">{amenity.name}</p>
                    {!openStatus.open && (
                      <span className="text-[10px] text-red-500 font-medium bg-red-50 px-1.5 py-0.5 rounded flex-shrink-0">
                        Closed
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {termShort}
                    </span>
                    {amenity.opening_hours && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {openStatus.label}
                      </span>
                    )}
                    {amenity.price_level && amenity.price_level !== 'unknown' && (
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3" />
                        {amenity.price_level}
                      </span>
                    )}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
              </button>
            );
          })
        ) : searchQuery.trim() ? (
          <div className="p-8 text-center text-gray-500">
            <Search className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <h3 className="text-lg font-medium mb-1">No results found</h3>
            <p className="text-sm">Try adjusting your search or filters</p>
            <button
              onClick={() => { setSearchQuery(''); setFilterBy('all'); }}
              className="mt-3 px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              Clear search
            </button>
          </div>
        ) : (
          <div className="p-8 text-center text-gray-500">
            <MapPin className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <h3 className="text-lg font-medium mb-1">No amenities yet</h3>
            <p className="text-sm">This collection is being curated</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CollectionDetailPage;
