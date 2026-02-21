import { useState, useEffect, useCallback } from 'react';
import { 
  getCollectionsForTerminal, 
  getCollectionsDirectQuery, 
  getCollectionsWithHealth,
  getContextualCollections 
} from '../services/CollectionTerminalService';

interface CollectionWithCounts {
  collection_id: string;
  collection_name: string;
  icon: string;
  gradient: string;
  spots_total: number;
  spots_near_you: number;
}

interface CollectionWithHealth extends CollectionWithCounts {
  health_score: string;
  health_color: string;
}

interface UseCollectionTerminalReturn {
  collections: CollectionWithCounts[];
  collectionsWithHealth: CollectionWithHealth[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  healthScore: (collection: CollectionWithCounts) => { score: string; color: string };
}

/**
 * Hook for fetching collections with terminal-specific counts
 */
export function useCollectionTerminal(
  airport: string,
  terminal: string,
  options: {
    includeHealth?: boolean;
    context?: 'departure' | 'arrival' | 'transit' | 'layover';
    fallbackToDirect?: boolean;
  } = {}
): UseCollectionTerminalReturn {
  const [collections, setCollections] = useState<CollectionWithCounts[]>([]);
  const [collectionsWithHealth, setCollectionsWithHealth] = useState<CollectionWithHealth[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCollections = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      let data: CollectionWithCounts[];
      
      // Try primary method first
      data = await getCollectionsForTerminal(airport, terminal);
      
      // If no data and fallback is enabled, try direct query
      if ((!data || data.length === 0) && options.fallbackToDirect) {
        console.log('🔄 Primary method returned no data, trying direct query...');
        data = await getCollectionsDirectQuery(airport, terminal);
      }
      
      // If still no data, try contextual approach
      if ((!data || data.length === 0) && options.context) {
        console.log('🔄 Trying contextual collections...');
        data = await getContextualCollections(airport, terminal, options.context);
      }
      
      setCollections(data || []);
      
      // If health scoring is requested, fetch that too
      if (options.includeHealth) {
        const healthData = await getCollectionsWithHealth(airport, terminal);
        setCollectionsWithHealth(healthData || []);
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch collections';
      setError(errorMessage);
      console.error('Error fetching collections:', err);
    } finally {
      setLoading(false);
    }
  }, [airport, terminal, options.includeHealth, options.context, options.fallbackToDirect]);

  // Health score calculator
  const healthScore = useCallback((collection: CollectionWithCounts) => {
    const ratio = collection.spots_near_you / Math.max(collection.spots_total, 1);
    
    if (ratio === 1) {
      return { score: 'Perfect', color: 'text-green-600' };
    } else if (ratio > 0.7) {
      return { score: 'Good', color: 'text-blue-600' };
    } else if (ratio > 0.3) {
      return { score: 'Mixed', color: 'text-yellow-600' };
    } else {
      return { score: 'Poor', color: 'text-red-600' };
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  // Refetch function
  const refetch = useCallback(async () => {
    await fetchCollections();
  }, [fetchCollections]);

  return {
    collections,
    collectionsWithHealth,
    loading,
    error,
    refetch,
    healthScore
  };
}

/**
 * Simplified hook for basic collection fetching
 */
export function useCollectionsSimple(airport: string, terminal: string) {
  const { collections, loading, error } = useCollectionTerminal(airport, terminal);
  return { collections, loading, error };
}

/**
 * Hook for collections with health scoring
 */
export function useCollectionsWithHealth(airport: string, terminal: string) {
  const { collectionsWithHealth, loading, error, refetch } = useCollectionTerminal(
    airport, 
    terminal, 
    { includeHealth: true }
  );
  return { collections: collectionsWithHealth, loading, error, refetch };
}

/**
 * Hook for contextual collections
 */
export function useContextualCollections(
  airport: string, 
  terminal: string, 
  context: 'departure' | 'arrival' | 'transit' | 'layover'
) {
  const { collections, loading, error, refetch } = useCollectionTerminal(
    airport, 
    terminal, 
    { context, fallbackToDirect: true }
  );
  return { collections, loading, error, refetch };
}

export default useCollectionTerminal;
