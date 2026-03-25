// Universal Collection Service
// Provides a clean, simple interface for fetching terminal collections

import { supabase } from '@/lib/supabase';

export interface TerminalCollection {
  collection_uuid: string;
  collection_id: string;
  collection_name: string;
  collection_icon: string;
  collection_gradient: string;
  spots_total: number;
  spots_near_you: number;
  health_score: 'Perfect' | 'Good' | 'Mixed' | 'Poor';
  health_color: string;
  is_featured: boolean;
  is_universal: boolean;
  amenity_count: number;
  terminal_amenity_count: number;
}

export interface UseTerminalCollectionsReturn {
  collections: TerminalCollection[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  stats: {
    totalCollections: number;
    totalSpots: number;
    totalNearYou: number;
    coveragePercentage: number;
    healthBreakdown: {
      perfect: number;
      good: number;
      mixed: number;
      poor: number;
    };
  };
}

/**
 * Universal hook for fetching terminal collections
 */
export function useTerminalCollections(
  airport: string,
  terminal: string,
  options: {
    includeHealth?: boolean;
    context?: 'departure' | 'arrival' | 'transit' | 'layover';
    maxResults?: number;
    featuredOnly?: boolean;
  } = {}
): UseTerminalCollectionsReturn {
  const [collections, setCollections] = useState<TerminalCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCollections = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const terminalCode = `${airport}-${terminal}`;
      
      // Try to use the optimized view first
      let data = await fetchFromView(terminalCode, options);
      
      // If no data, fall back to direct query
      if (!data || data.length === 0) {
        console.log('🔄 View returned no data, trying direct query...');
        data = await fetchFromDirectQuery(airport, terminalCode, options);
      }
      
      // If still no data, try basic collections
      if (!data || data.length === 0) {
        console.log('🔄 Direct query returned no data, trying basic collections...');
        data = await fetchBasicCollections(airport, terminalCode, options);
      }
      
      // Process and enhance the data
      const processedCollections = processCollections(data, options, airport, terminal);
      
      // Apply context-based sorting if requested
      if (options.context) {
        sortByContext(processedCollections, options.context);
      }
      
      // Limit results if specified
      if (options.maxResults) {
        processedCollections.splice(options.maxResults);
      }
      
      setCollections(processedCollections);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch collections';
      setError(errorMessage);
      console.error('Error fetching collections:', errorMessage);
    } finally {
      setLoading(false);
    }
  }, [airport, terminal, options]);

  // Initial fetch
  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  // Refetch function
  const refetch = useCallback(async () => {
    await fetchCollections();
  }, [fetchCollections]);

  // Calculate stats
  const stats = useMemo(() => {
    const totalCollections = collections.length;
    const totalSpots = collections.reduce((sum, c) => sum + c.spots_total, 0);
    const totalNearYou = collections.reduce((sum, c) => sum + c.spots_near_you, 0);
    const coveragePercentage = totalSpots > 0 ? Math.round((totalNearYou / totalSpots) * 100) : 0;
    
    const healthBreakdown = collections.reduce((acc, c) => {
      acc[c.health_score.toLowerCase() as keyof typeof acc]++;
      return acc;
    }, { perfect: 0, good: 0, mixed: 0, poor: 0 });

    return {
      totalCollections,
      totalSpots,
      totalNearYou,
      coveragePercentage,
      healthBreakdown
    };
  }, [collections]);

  return {
    collections,
    loading,
    error,
    refetch,
    stats
  };
}

/**
 * Fetch collections from the optimized view
 */
async function fetchFromView(
  terminalCode: string, 
  options: any
): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('collection_terminal_counts')
      .select(`
        collection_id,
        collection_name,
        icon,
        gradient,
        amenity_count,
        transit_amenity_count,
        is_featured,
        is_universal
      `)
      .eq('terminal_code', terminalCode)
      .order('amenity_count', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching from view:', error);
    return [];
  }
}

/**
 * Fetch collections using direct query
 */
async function fetchFromDirectQuery(
  airport: string, 
  terminalCode: string, 
  options: any
): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .rpc('get_collection_stats_for_terminal', {
        p_airport_code: airport,
        p_terminal_code: terminalCode
      });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error in direct query:', error);
    return [];
  }
}

/**
 * Fetch basic collections as last resort
 */
async function fetchBasicCollections(
  airport: string, 
  terminalCode: string, 
  options: any
): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('collections')
      .select(`
        collection_id,
        name,
        icon,
        gradient,
        is_featured,
        is_universal,
        collection_amenities!inner(
          amenity_detail!inner(
            id,
            terminal_code,
            available_in_tr
          )
        )
      `)
      .or(`universal.eq.true,airports.cs.{${airport}}`);

    if (error) throw error;
    
    // Process and count manually
    return (data || []).map(collection => {
      const amenitiesInTerminal = collection.collection_amenities?.filter(
        ca => ca.amenity_detail?.terminal_code === terminalCode
      ) || [];
      
      const transitAvailable = amenitiesInTerminal.filter(
        ca => ca.amenity_detail?.available_in_tr === true
      );

      return {
        collection_id: collection.collection_id,
        collection_name: collection.name,
        icon: collection.icon,
        gradient: collection.gradient,
        is_featured: collection.is_featured,
        is_universal: collection.is_universal,
        amenity_count: amenitiesInTerminal.length,
        transit_amenity_count: transitAvailable.length
      };
    });
    
  } catch (error) {
    console.error('Error in basic collections:', error);
    return [];
  }
}

/**
 * Process and enhance collection data
 */
function processCollections(data: any[], options: any, airport: string, terminal: string): TerminalCollection[] {
  return data.map(item => {
    const spots_total = item.amenity_count || item.terminal_amenities || 0;
    const spots_near_you = item.transit_amenity_count || item.near_amenities || 0;
    
    // Calculate health score
    const ratio = spots_near_you / Math.max(spots_total, 1);
    let health_score: 'Perfect' | 'Good' | 'Mixed' | 'Poor';
    let health_color: string;
    
    if (ratio === 1) {
      health_score = 'Perfect';
      health_color = 'text-green-600';
    } else if (ratio > 0.7) {
      health_score = 'Good';
      health_color = 'text-blue-600';
    } else if (ratio > 0.3) {
      health_score = 'Mixed';
      health_color = 'text-yellow-600';
    } else {
      health_score = 'Poor';
      health_color = 'text-red-600';
    }

    return {
      collection_uuid: item.collection_id || `uuid-${Math.random()}`,
      collection_id: item.collection_id,
      collection_name: item.collection_name || item.name,
      collection_icon: item.icon || item.collection_icon || '🏪',
      collection_gradient: item.gradient || item.collection_gradient || 'from-blue-500 to-purple-600',
      spots_total,
      spots_near_you,
      health_score,
      health_color,
      is_featured: item.is_featured || false,
      is_universal: item.is_universal || false,
      amenity_count: spots_total,
      terminal_amenity_count: spots_near_you,
      terminal_code: item.terminal_code || `${airport}-${terminal}`
    };
  });
}

/**
 * Sort collections by journey context
 */
function sortByContext(collections: TerminalCollection[], context: string) {
  const contextPriorities = {
    departure: ['coffee-chill', 'quick-bites', 'duty-free', 'lounge-life'],
    arrival: ['transport', 'comfort-spaces', 'quick-bites'],
    transit: ['lounge-life', 'entertainment', 'wellness'],
    layover: ['explore', 'entertainment', 'wellness', 'duty-free']
  };
  
  const priorities = contextPriorities[context as keyof typeof contextPriorities] || [];
  
  collections.sort((a, b) => {
    const aIndex = priorities.indexOf(a.collection_id);
    const bIndex = priorities.indexOf(b.collection_id);
    
    if (aIndex === -1 && bIndex === -1) return 0;
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    
    return aIndex - bIndex;
  });
}

// Import React hooks
import { useState, useEffect, useCallback, useMemo } from 'react';

export default {
  useTerminalCollections
};
