// src/hooks/useSimpleData.ts - Simple MVP data hook
import { useState, useEffect } from 'react';

interface DataState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export const useSimpleData = <T>(
  queryFn: () => Promise<T>,
  dependencies: any[] = []
): DataState<T> => {
  const [state, setState] = useState<DataState<T>>({
    data: null,
    loading: true,
    error: null
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setState({ data: null, loading: true, error: null });
        const result = await queryFn();
        setState({ data: result, loading: false, error: null });
      } catch (err) {
        console.error('Data fetch error:', err);
        setState({ 
          data: null, 
          loading: false, 
          error: err instanceof Error ? err.message : 'Failed to load data' 
        });
      }
    };
    
    fetchData();
  }, dependencies);

  return state;
};

// Convenience hook for collection amenities
export const useCollectionAmenitiesSimple = (collectionSlug: string | undefined) => {
  const { data: amenities, loading, error } = useSimpleData(
    async () => {
      if (!collectionSlug) return [];
      
      // Import dynamically to avoid circular dependencies
      const { getAmenitiesByCollection } = await import('../lib/supabase/queries');
      return await getAmenitiesByCollection(collectionSlug);
    },
    [collectionSlug]
  );

  return { amenities: amenities || [], loading, error };
};

// Convenience hook for collection data
export const useCollectionDataSimple = (collectionSlug: string | undefined) => {
  const { data: collection, loading, error } = useSimpleData(
    async () => {
      if (!collectionSlug) return null;
      
      // Import storage validation and collection verification
      const { validateCollection, getVibeForCollection, setCollection } = await import('../utils/storageManager');
      const { getVibeForCollection: getVibeFromVerifier } = await import('../utils/collectionVerifier');
      
      // Find the actual vibe for this collection
      const actualVibe = getVibeFromVerifier(collectionSlug);
      const defaultVibe = actualVibe || 'discover'; // Use actual vibe or fallback
      
      console.log('[useCollectionDataSimple] Collection:', collectionSlug, 'Vibe:', defaultVibe);
      
      // Try to validate with the actual vibe
      if (validateCollection(defaultVibe, collectionSlug)) {
        const stored = sessionStorage.getItem('selectedCollection');
        try {
          const parsed = JSON.parse(stored!);
          console.log('[useCollectionDataSimple] Using validated stored collection:', parsed);
          return parsed;
        } catch (e) {
          console.warn('Failed to parse stored collection:', e);
        }
      }
      
      console.log('[useCollectionDataSimple] Fetching fresh collection data for:', collectionSlug);
      
      // Import collections data to get proper collection info
      const { REFUEL_COLLECTIONS, DISCOVER_COLLECTIONS } = await import('../constants/adaptiveCollections');
      
      // Look for the collection in all available collections
      const allCollections = {
        ...REFUEL_COLLECTIONS,
        ...DISCOVER_COLLECTIONS
      };
      
      if (allCollections[collectionSlug]) {
        const collection = allCollections[collectionSlug];
        console.log('[useCollectionDataSimple] Found collection in constants:', collection);
        
        // Store the fresh data with correct vibe context for future validation
        const collectionData = {
          vibe: defaultVibe,
          slug: collection.slug,
          name: collection.name,
          description: collection.subtitle,
          icon: collection.emoji,
          gradient: collection.gradient
        };
        
        // Use the new StorageManager to set collection context
        setCollection(collectionData);
        return collectionData;
      }
      
      // Fallback to default collection data
      console.log('[useCollectionDataSimple] Using fallback for:', collectionSlug);
      const fallbackData = {
        vibe: defaultVibe,
        slug: collectionSlug,
        name: collectionSlug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        description: 'Collection details'
      };
      
      // Store fallback data with vibe context
      setCollection(fallbackData);
      return fallbackData;
    },
    [collectionSlug]
  );

  return { collection, loading, error };
};
