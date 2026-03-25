// =====================================================
// FIXED UNIFIED COLLECTIONS HOOK
// Properly connects to the RPC functions
// =====================================================

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface UnifiedCollection {
  id: string;
  collection_id: string;
  name: string;
  description: string;
  icon: string;
  gradient: string;
  spots_total: number;
  spots_in_terminal: number;
  spots_near_you: number;
  is_featured: boolean;
  is_universal: boolean;
}

interface UseUnifiedCollectionsReturn {
  collections: UnifiedCollection[];
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
 * Hook for fetching collections with proper terminal code handling
 * FIXED VERSION - Directly calls RPC function
 */
export function useUnifiedCollections(
  airport: string, 
  terminal: string
): UseUnifiedCollectionsReturn {
  const [collections, setCollections] = useState<UnifiedCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const fetchCollections = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log(`🔍 Fetching collections for ${airport} ${terminal}`);
      
      // Direct RPC call - this is what works!
      const { data, error: rpcError } = await supabase.rpc('get_collections_for_terminal', {
        p_airport_code: airport,
        p_terminal: terminal
      });
      
      if (rpcError) {
        throw rpcError;
      }
      
      if (!data || data.length === 0) {
        console.warn(`No collections found for ${airport} ${terminal}`);
        setCollections([]);
        return;
      }
      
      console.log(`✅ Found ${data.length} collections`);
      
      // Map RPC response to our format
      const mappedCollections: UnifiedCollection[] = data.map((item: any) => ({
        id: item.collection_uuid,
        collection_id: item.collection_slug,
        name: item.collection_name,
        description: item.description || '',
        icon: item.icon || '📦',
        gradient: item.gradient || 'from-blue-500 to-purple-600',
        spots_total: item.spots_total || 0,
        spots_in_terminal: item.spots_total || 0,  // Use spots_total for terminal count
        spots_near_you: item.spots_near_you || 0,   // Transit accessible
        is_featured: item.featured || false,
        is_universal: false
      }));
      
      setCollections(mappedCollections);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch collections';
      setError(errorMessage);
      console.error('Error fetching collections:', err);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    if (airport && terminal) {
      fetchCollections();
    }
  }, [airport, terminal]);
  
  // Calculate stats
  const stats = {
    totalCollections: collections.length,
    totalSpots: collections.reduce((sum, c) => sum + c.spots_total, 0),
    totalNearYou: collections.reduce((sum, c) => sum + c.spots_near_you, 0),
    coveragePercentage: 0,
    healthBreakdown: {
      perfect: 0,
      good: 0,
      mixed: 0,
      poor: 0
    }
  };
  
  // Calculate health breakdown
  collections.forEach(c => {
    const ratio = c.spots_near_you / Math.max(c.spots_total, 1);
    if (ratio === 1) stats.healthBreakdown.perfect++;
    else if (ratio > 0.7) stats.healthBreakdown.good++;
    else if (ratio > 0.3) stats.healthBreakdown.mixed++;
    else stats.healthBreakdown.poor++;
  });
  
  stats.coveragePercentage = stats.totalSpots > 0 
    ? Math.round((stats.totalNearYou / stats.totalSpots) * 100) 
    : 0;
  
  return { 
    collections, 
    loading, 
    error,
    refetch: fetchCollections,
    stats
  };
}

/**
 * Hook for fetching a specific collection's amenities
 */
export function useCollectionAmenities(
  collectionSlug: string,
  airport: string,
  terminal: string
) {
  const [collection, setCollection] = useState<any>(null);
  const [amenities, setAmenities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const fetchAmenities = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Get collection details first
      const { data: collectionData } = await supabase
        .from('collections')
        .select('*')
        .eq('collection_id', collectionSlug)
        .single();
      
      if (collectionData) {
        setCollection(collectionData);
      }
      
      // Get amenities using RPC
      const { data, error: rpcError } = await supabase.rpc('get_collection_amenities', {
        p_collection_slug: collectionSlug,
        p_airport_code: airport,
        p_terminal: terminal
      });
      
      if (rpcError) {
        throw rpcError;
      }
      
      setAmenities(data || []);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch amenities';
      setError(errorMessage);
      console.error('Error fetching amenities:', err);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    if (collectionSlug && airport && terminal) {
      fetchAmenities();
    }
  }, [collectionSlug, airport, terminal]);
  
  return {
    collection,
    amenities,
    loading,
    error,
    refetch: fetchAmenities
  };
}

// Default export for compatibility
export default {
  useUnifiedCollections,
  useCollectionAmenities
};
