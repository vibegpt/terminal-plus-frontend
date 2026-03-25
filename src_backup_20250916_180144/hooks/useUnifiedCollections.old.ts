// =====================================================
// UNIFIED COLLECTIONS REACT HOOK
// Simple hook for using collections in components
// =====================================================

import { useState, useEffect, useCallback } from 'react';
import { getCollectionsWithCounts, getCollectionAmenities } from '@/services/TerminalCollectionService';

interface CollectionCount {
  id: string;
  slug: string;
  name: string;
  icon: string;
  gradient: string;
  description: string;
  featured: boolean;
  spots_in_terminal: number;
  spots_near_you: number;
  total_spots: number;
}

interface CollectionAmenity {
  id: number;
  name: string;
  slug: string;
  description: string;
  terminal_code: string;
  vibe_tags: string;
  price_level: string;
  opening_hours: any;
  available_in_tr: boolean;
  priority: number;
}

interface UseUnifiedCollectionsReturn {
  collections: CollectionCount[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  getAmenities: (collectionSlug: string) => Promise<CollectionAmenity[]>;
  stats: {
    totalCollections: number;
    totalSpots: number;
    totalNearYou: number;
    coveragePercentage: number;
  };
}

/**
 * Unified hook for fetching collections across all airports and terminals
 * This integrates with TerminalCollectionService for consistent data
 */
export function useUnifiedCollections(
  airport: string,
  terminal: string,
  options: {
    autoFetch?: boolean;
    includeStats?: boolean;
  } = {}
): UseUnifiedCollectionsReturn {
  const [collections, setCollections] = useState<CollectionCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCollections = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log(`🔄 Fetching collections for ${airport} ${terminal}`);
      
      // Use the TerminalCollectionService function
      const data = await getCollectionsWithCounts(airport, terminal);
      
      if (data && data.length > 0) {
        console.log(`✅ Found ${data.length} collections for ${airport} ${terminal}`);
        setCollections(data);
      } else {
        console.log(`⚠️ No collections found for ${airport} ${terminal}`);
        setCollections([]);
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch collections';
      setError(errorMessage);
      console.error(`❌ Error fetching collections for ${airport} ${terminal}:`, err);
      setCollections([]);
    } finally {
      setLoading(false);
    }
  }, [airport, terminal]);

  // Function to get amenities for a specific collection
  const getAmenities = useCallback(async (collectionSlug: string): Promise<CollectionAmenity[]> => {
    try {
      console.log(`🔄 Fetching amenities for ${collectionSlug} in ${airport} ${terminal}`);
      
      // Use the TerminalCollectionService function
      const data = await getCollectionAmenities(collectionSlug, airport, terminal);
      
      console.log(`✅ Found ${data.length} amenities for ${collectionSlug}`);
      return data;
      
    } catch (err) {
      console.error(`❌ Error fetching amenities for ${collectionSlug}:`, err);
      return [];
    }
  }, [airport, terminal]);

  // Calculate stats
  const stats = {
    totalCollections: collections.length,
    totalSpots: collections.reduce((sum, c) => sum + c.spots_in_terminal, 0),
    totalNearYou: collections.reduce((sum, c) => sum + c.spots_near_you, 0),
    coveragePercentage: collections.length > 0 
      ? Math.round((collections.reduce((sum, c) => sum + c.spots_near_you, 0) / 
                    collections.reduce((sum, c) => sum + c.spots_in_terminal, 1)) * 100)
      : 0
  };

  // Initial fetch
  useEffect(() => {
    if (options.autoFetch !== false) {
      fetchCollections();
    }
  }, [fetchCollections, options.autoFetch]);

  // Refetch function
  const refetch = useCallback(async () => {
    await fetchCollections();
  }, [fetchCollections]);

  return {
    collections,
    loading,
    error,
    refetch,
    getAmenities,
    stats
  };
}

/**
 * Simplified hook for basic collection display
 */
export function useCollectionsSimple(airport: string, terminal: string) {
  const { collections, loading, error } = useUnifiedCollections(airport, terminal);
  return { collections, loading, error };
}

/**
 * Hook for collections with amenities pre-loaded
 */
export function useCollectionsWithAmenities(
  airport: string,
  terminal: string,
  collectionSlugs: string[] = []
) {
  const { collections, loading, error, getAmenities } = useUnifiedCollections(airport, terminal);
  const [amenitiesMap, setAmenitiesMap] = useState<Record<string, CollectionAmenity[]>>({});
  const [amenitiesLoading, setAmenitiesLoading] = useState(false);

  const loadAmenities = useCallback(async () => {
    if (collectionSlugs.length === 0) return;
    
    setAmenitiesLoading(true);
    const newAmenitiesMap: Record<string, CollectionAmenity[]> = {};
    
    try {
      await Promise.all(
        collectionSlugs.map(async (slug) => {
          const amenities = await getAmenities(slug);
          newAmenitiesMap[slug] = amenities;
        })
      );
      
      setAmenitiesMap(newAmenitiesMap);
    } catch (err) {
      console.error('Error loading amenities:', err);
    } finally {
      setAmenitiesLoading(false);
    }
  }, [collectionSlugs, getAmenities]);

  useEffect(() => {
    if (collections.length > 0 && collectionSlugs.length > 0) {
      loadAmenities();
    }
  }, [collections, loadAmenities, collectionSlugs.length]);

  return {
    collections,
    amenitiesMap,
    loading: loading || amenitiesLoading,
    error,
    refetchAmenities: loadAmenities
  };
}

/**
 * Hook for fetching a specific collection's amenities
 * Perfect for collection detail pages
 */
export function useCollectionAmenities(
  collectionSlug: string,
  airport: string,
  terminal: string
) {
  const [collection, setCollection] = useState<CollectionCount | null>(null);
  const [amenities, setAmenities] = useState<CollectionAmenity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCollectionData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // First get the collection info
      const collections = await getCollectionsWithCounts(airport, terminal);
      const currentCollection = collections.find(c => c.slug === collectionSlug);
      
      if (!currentCollection) {
        setError('Collection not found');
        return;
      }
      
      setCollection(currentCollection);
      
      // Then get the amenities for this collection
      const amenitiesData = await getCollectionAmenities(collectionSlug, airport, terminal);
      setAmenities(amenitiesData);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch collection data';
      setError(errorMessage);
      console.error('Error fetching collection data:', err);
    } finally {
      setLoading(false);
    }
  }, [collectionSlug, airport, terminal]);

  useEffect(() => {
    if (collectionSlug && airport && terminal) {
      fetchCollectionData();
    }
  }, [collectionSlug, airport, terminal, fetchCollectionData]);

  const refetch = useCallback(async () => {
    await fetchCollectionData();
  }, [fetchCollectionData]);

  return {
    collection,
    amenities,
    loading,
    error,
    refetch
  };
}

export default useUnifiedCollections;
