import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../services/supabaseClient';
import type { 
  Smart7Collection, 
  AmenityWithScore, 
  CollectionRecommendationContext 
} from '../types/collections';

interface CollectionSmart7Options {
  collectionSlug: string;
  airport: string;
  terminal: string;
  userContext?: CollectionRecommendationContext;
  enableCaching?: boolean;
  maxAmenities?: number;
}

interface CollectionSmart7Result {
  amenities: AmenityWithScore[];
  smart7Selection: AmenityWithScore[];
  collectionInfo: {
    name: string;
    description: string;
    gradient: string;
    icon: string;
    vibe_category: string;
    total_amenities: number;
    featured_count: number;
    avg_priority: number;
  } | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
  performance: {
    load_time: number;
    cache_hit: boolean;
    algorithm_version: string;
  };
}

export const useCollectionSmart7 = ({
  collectionSlug,
  airport,
  terminal,
  userContext,
  enableCaching = true,
  maxAmenities = 50
}: CollectionSmart7Options): CollectionSmart7Result => {
  const [amenities, setAmenities] = useState<AmenityWithScore[]>([]);
  const [smart7Selection, setSmart7Selection] = useState<AmenityWithScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [collectionInfo, setCollectionInfo] = useState<any>(null);
  const [performance, setPerformance] = useState({
    load_time: 0,
    cache_hit: false,
    algorithm_version: '1.0.0'
  });

  // Cache key for this collection
  const cacheKey = useMemo(() => 
    `collection_${airport}_${collectionSlug}_${terminal}`, 
    [airport, collectionSlug, terminal]
  );

  const loadCollection = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const startTime = Date.now();
      
      // Check cache first
      let cachedData = null;
      if (enableCaching) {
        cachedData = getCachedData(cacheKey);
        if (cachedData) {
          setAmenities(cachedData.amenities);
          setSmart7Selection(cachedData.smart7Selection);
          setCollectionInfo(cachedData.collectionInfo);
          setPerformance({
            load_time: Date.now() - startTime,
            cache_hit: true,
            algorithm_version: '1.0.0'
          });
          setLoading(false);
          return;
        }
      }
      
      // Get collection details from Supabase
      const { data: collection, error: supabaseError } = await supabase
        .from('collections')
        .select(`
          *,
          collection_amenities!inner(
            priority,
            is_featured,
            amenity_detail!inner(
              id,
              name,
              amenity_slug,
              description,
              vibe_tags,
              terminal_code,
              price_level,
              opening_hours,
              logo_url,
              website_url,
              rating,
              review_count,
              features,
              status,
              isOpen
            )
          )
        `)
        .eq('collection_id', collectionSlug)
        .eq('collection_amenities.amenity_detail.airport_code', airport)
        .single();

      if (supabaseError) {
        throw new Error(`Collection not found: ${supabaseError.message}`);
      }

      if (!collection) {
        throw new Error('Collection not found');
      }

      // Extract collection info
      const info = {
        name: collection.name,
        description: collection.description,
        gradient: collection.gradient || 'from-blue-500 to-purple-600',
        icon: collection.icon || '📁',
        vibe_category: getVibeCategoryFromSlug(collection.collection_id),
        total_amenities: collection.collection_amenities?.length || 0,
        featured_count: collection.collection_amenities?.filter((ca: any) => ca.is_featured).length || 0,
        avg_priority: collection.collection_amenities?.reduce((sum: number, ca: any) => sum + (ca.priority || 0), 0) / 
                     (collection.collection_amenities?.length || 1) || 0
      };

      setCollectionInfo(info);

      // Extract and process amenities
      const collectionAmenities = (collection.collection_amenities || [])
        .map((ca: any) => ({
          id: ca.amenity_detail.id,
          name: ca.amenity_detail.name,
          category: ca.amenity_detail.category || 'General',
          terminal_code: ca.amenity_detail.terminal_code,
          vibe_tags: ca.amenity_detail.vibe_tags,
          priority_score: ca.priority || 50,
          is_featured: ca.is_featured || false,
          collection_relevance: ca.priority || 50,
          price_level: ca.amenity_detail.price_level,
          rating: ca.amenity_detail.rating,
          review_count: ca.amenity_detail.review_count,
          logo_url: ca.amenity_detail.logo_url,
          website_url: ca.amenity_detail.website_url,
          features: ca.amenity_detail.features,
          status: ca.amenity_detail.status,
          isOpen: ca.amenity_detail.isOpen
        }))
        .sort((a: AmenityWithScore, b: AmenityWithScore) => {
          // Sort by featured first, then priority
          if (a.is_featured && !b.is_featured) return -1;
          if (!a.is_featured && b.is_featured) return 1;
          return b.priority_score - a.priority_score;
        })
        .slice(0, maxAmenities);

      setAmenities(collectionAmenities);

      // Apply Smart7 selection
      const selected = applySmartSelection(collectionAmenities, terminal, userContext);
      setSmart7Selection(selected);

      // Cache the results
      if (enableCaching) {
        cacheData(cacheKey, {
          amenities: collectionAmenities,
          smart7Selection: selected,
          collectionInfo: info
        });
      }

      // Set performance metrics
      const loadTime = Date.now() - startTime;
      setPerformance({
        load_time: loadTime,
        cache_hit: false,
        algorithm_version: '1.0.0'
      });

    } catch (err: any) {
      console.error('Error loading collection:', err);
      setError(err.message || 'Failed to load collection');
    } finally {
      setLoading(false);
    }
  }, [collectionSlug, airport, terminal, userContext, enableCaching, maxAmenities, cacheKey]);

  const applySmartSelection = (
    amenities: AmenityWithScore[],
    terminal: string,
    context?: CollectionRecommendationContext
  ): AmenityWithScore[] => {
    // Filter for terminal if specified
    const terminalFiltered = terminal
      ? amenities.filter(a => 
          a.terminal_code === `${airport}-${terminal}` ||
          a.terminal_code === terminal ||
          a.terminal_code.includes(terminal)
        )
      : amenities;

    // If we have fewer than 7 in terminal, include from other terminals
    let finalList = terminalFiltered;
    if (terminalFiltered.length < 7) {
      const otherTerminals = amenities.filter(a => 
        !terminalFiltered.includes(a)
      );
      finalList = [...terminalFiltered, ...otherTerminals];
    }

    // Apply enhanced Smart7 scoring
    const scored = finalList.map(amenity => {
      let score = amenity.priority_score || 50;
      
      // Boost featured items
      if (amenity.is_featured) score += 25;
      
      // Terminal proximity boost
      if (terminal && amenity.terminal_code.includes(terminal)) {
        score += 20;
      }
      
      // Time of day boost
      if (context?.timeOfDay) {
        const hour = parseInt(context.timeOfDay);
        if (!isNaN(hour)) {
          const isOpen = checkIfOpen(amenity, hour);
          if (isOpen) score += 15;
        }
      }
      
      // Price preference boost
      if (context?.pricePreference && context.pricePreference !== 'any') {
        if (amenity.price_level === context.pricePreference) {
          score += 10;
        }
      }
      
      // Rating boost
      if (amenity.rating && amenity.review_count && amenity.review_count > 10) {
        score += Math.min(10, amenity.rating * 2);
      }
      
      // Vibe tag relevance boost
      if (context?.vibePreferences && amenity.vibe_tags) {
        const userVibes = context.vibePreferences;
        const amenityVibes = amenity.vibe_tags.split(',').map(t => t.trim().toLowerCase());
        const matchingVibes = userVibes.filter(v => 
          amenityVibes.some(av => av.includes(v.toLowerCase()))
        );
        score += matchingVibes.length * 5;
      }
      
      return { 
        ...amenity, 
        smart7_score: Math.min(100, score),
        collection_relevance: score
      };
    });

    // Sort by score and apply diversity rules
    const sorted = scored.sort((a, b) => (b.smart7_score || 0) - (a.smart7_score || 0));
    
    // Apply diversity rules
    const selected: AmenityWithScore[] = [];
    const usedTerminals = new Set<string>();
    const usedVibes = new Set<string>();
    
    for (const amenity of sorted) {
      if (selected.length >= 7) break;
      
      const terminal = amenity.terminal_code;
      const vibes = amenity.vibe_tags?.split(',').map(t => t.trim()) || [];
      
      // Check diversity constraints
      const terminalDiversity = usedTerminals.size < 3 || !usedTerminals.has(terminal);
      const vibeDiversity = usedVibes.size < 5 || vibes.some(v => !usedVibes.has(v));
      
      if (terminalDiversity && vibeDiversity) {
        selected.push(amenity);
        usedTerminals.add(terminal);
        vibes.forEach(v => usedVibes.add(v));
      }
    }
    
    // Fill remaining slots if needed
    while (selected.length < 7 && selected.length < sorted.length) {
      const remaining = sorted.filter(s => 
        !selected.some(sel => sel.id === s.id)
      );
      
      if (remaining.length === 0) break;
      
      selected.push(remaining[0]);
    }
    
    return selected;
  };

  const checkIfOpen = (amenity: AmenityWithScore, hour: number): boolean => {
    // Simplified opening hours check
    // In a real implementation, you'd parse the opening_hours field
    if (!amenity.opening_hours) return true; // Assume open if no hours specified
    
    // Basic time-based logic
    if (hour >= 6 && hour <= 22) return true; // Assume open during normal hours
    return false;
  };

  const getVibeCategoryFromSlug = (slug: string): string => {
    const vibeMap: Record<string, string> = {
      'lounges-affordable': 'comfort',
      'sleep-pods': 'comfort',
      'post-red-eye-recovery': 'comfort',
      'hidden-quiet-spots': 'chill',
      'gardens-at-dawn': 'chill',
      'peaceful-corners': 'chill',
      'local-food-real-prices': 'refuel',
      'coffee-worth-walk': 'refuel',
      'hawker-heaven': 'refuel',
      'work-spots-real-wifi': 'work',
      'meeting-ready-spaces': 'work',
      'quiet-zones': 'work',
      'quick-bites': 'quick',
      'gate-essentials': 'quick',
      '2-minute-stops': 'quick',
      'only-at-changi': 'exclusive',
      'singapore-exclusives': 'exclusive',
      'changi-exclusives': 'exclusive'
    };
    
    return vibeMap[slug] || 'general';
  };

  // Cache management
  const getCachedData = (key: string) => {
    try {
      const cached = sessionStorage.getItem(key);
      if (cached) {
        const data = JSON.parse(cached);
        const now = Date.now();
        if (data.timestamp && (now - data.timestamp) < 5 * 60 * 1000) { // 5 minutes TTL
          return data.data;
        }
      }
    } catch (error) {
      console.warn('Failed to read cache:', error);
    }
    return null;
  };

  const cacheData = (key: string, data: any) => {
    try {
      const cacheData = {
        data,
        timestamp: Date.now()
      };
      sessionStorage.setItem(key, JSON.stringify(cacheData));
    } catch (error) {
      console.warn('Failed to cache data:', error);
    }
  };

  const refresh = useCallback(() => {
    // Clear cache and reload
    if (enableCaching) {
      try {
        sessionStorage.removeItem(cacheKey);
      } catch (error) {
        console.warn('Failed to clear cache:', error);
      }
    }
    loadCollection();
  }, [loadCollection, enableCaching, cacheKey]);

  // Load collection on mount and when dependencies change
  useEffect(() => {
    loadCollection();
  }, [loadCollection]);

  return {
    amenities,
    smart7Selection,
    collectionInfo,
    loading,
    error,
    refresh,
    performance
  };
};

// Export utility functions for testing
export {
  getVibeCategoryFromSlug,
  checkIfOpen,
  applySmartSelection
};
