import { useState, useEffect } from 'react';
import VibeCollectionsService, { VibeCollection } from '../services/VibeCollectionsService';

export function useVibeCollections(vibe: string) {
  const [collections, setCollections] = useState<VibeCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchVibeCollections() {
      try {
        setLoading(true);
        setError(null);
        
        console.log(`🔍 useVibeCollections: Fetching collections for vibe: ${vibe}`);
        
        const { data, error: serviceError } = await VibeCollectionsService.getCollectionsForVibe(vibe);
        
        if (serviceError) {
          console.warn(`⚠️ useVibeCollections: Database failed, using fallback for ${vibe}`);
          // Use fallback data if database fails
          const fallbackCollections = VibeCollectionsService.getFallbackCollectionsForVibe(vibe);
          setCollections(fallbackCollections);
        } else if (data) {
          console.log(`✅ useVibeCollections: Found ${data.length} collections for ${vibe}`);
          setCollections(data);
        } else {
          console.warn(`⚠️ useVibeCollections: No data returned for ${vibe}, using fallback`);
          const fallbackCollections = VibeCollectionsService.getFallbackCollectionsForVibe(vibe);
          setCollections(fallbackCollections);
        }
        
      } catch (err) {
        console.error(`❌ useVibeCollections: Error fetching ${vibe}:`, err);
        setError(err instanceof Error ? err.message : 'Failed to fetch vibe collections');
        
        // Always fallback to local data
        const fallbackCollections = VibeCollectionsService.getFallbackCollectionsForVibe(vibe);
        setCollections(fallbackCollections);
      } finally {
        setLoading(false);
      }
    }

    if (vibe) {
      fetchVibeCollections();
    }
  }, [vibe]);

  return { collections, loading, error };
}

export function useAllVibeCollections() {
  const [vibeCollections, setVibeCollections] = useState<Record<string, VibeCollection[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAllVibeCollections() {
      try {
        setLoading(true);
        setError(null);
        
        console.log('🔍 useAllVibeCollections: Fetching all vibe collections');
        
        const allVibes = ['Refuel', 'Explore', 'Chill', 'Quick', 'Comfort', 'Work', 'Shop'];
        const collections = await VibeCollectionsService.getCollectionsForVibes(allVibes);
        
        setVibeCollections(collections);
        
      } catch (err) {
        console.error('❌ useAllVibeCollections: Error fetching all vibes:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch all vibe collections');
        
        // Fallback to local data
        const fallbackCollections: Record<string, VibeCollection[]> = {};
        const allVibes = ['Refuel', 'Explore', 'Chill', 'Quick', 'Comfort', 'Work', 'Shop'];
        
        allVibes.forEach(vibe => {
          fallbackCollections[vibe] = VibeCollectionsService.getFallbackCollectionsForVibe(vibe);
        });
        
        setVibeCollections(fallbackCollections);
      } finally {
        setLoading(false);
      }
    }

    fetchAllVibeCollections();
  }, []);

  return { vibeCollections, loading, error };
}

export function useVibeCollection(vibe: string, collectionId: string) {
  const { collections } = useVibeCollections(vibe);
  
  const collection = collections.find(col => col.collection_id === collectionId);
  
  return {
    collection,
    loading: false, // Already handled by parent hook
    error: null
  };
}
