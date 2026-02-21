// src/hooks/useVibeAmenities.ts
import { useState, useEffect } from 'react';
import { VibeService, VibeAmenity, VibeInfo } from '../services/VibeService';

interface UseVibeAmenitiesOptions {
  terminalCode: string;
  airportCode: string;
  limitPerVibe?: number;
}

interface UseVibeAmenitiesReturn {
  vibesWithAmenities: Map<string, VibeAmenity[]>;
  vibeConfig: Record<string, VibeInfo>;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useVibeAmenities({
  terminalCode,
  airportCode,
  limitPerVibe = 10
}: UseVibeAmenitiesOptions): UseVibeAmenitiesReturn {
  const [vibesWithAmenities, setVibesWithAmenities] = useState<Map<string, VibeAmenity[]>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const vibeConfig = VibeService.getVibeConfig();

  const fetchAmenities = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await VibeService.getAllVibesWithAmenities(
        terminalCode,
        airportCode,
        limitPerVibe
      );
      setVibesWithAmenities(data);
    } catch (err) {
      setError('Failed to load amenities');
      console.error('Error fetching vibe amenities:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (terminalCode && airportCode) {
      fetchAmenities();
    }
  }, [terminalCode, airportCode, limitPerVibe]);

  return {
    vibesWithAmenities,
    vibeConfig,
    loading,
    error,
    refetch: fetchAmenities
  };
}

// Hook for single vibe
export function useSingleVibeAmenities(
  vibe: string,
  terminalCode: string,
  airportCode: string,
  limit: number = 20
) {
  const [amenities, setAmenities] = useState<VibeAmenity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAmenities = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const data = await VibeService.getAmenitiesForVibe(
          vibe,
          terminalCode,
          airportCode,
          limit
        );
        setAmenities(data);
      } catch (err) {
        setError('Failed to load amenities');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (vibe && terminalCode && airportCode) {
      fetchAmenities();
    }
  }, [vibe, terminalCode, airportCode, limit]);

  return { amenities, loading, error };
}

// Hook for featured content
export function useFeaturedContent(terminalCode: string, airportCode: string) {
  const [featuredCollection, setFeaturedCollection] = useState<any>(null);
  const [curatedCollections, setCuratedCollections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeatured = async () => {
      setLoading(true);
      try {
        const [featured, curated] = await Promise.all([
          VibeService.getFeaturedCollection(terminalCode, airportCode),
          VibeService.getCuratedCollections(terminalCode, airportCode, 3)
        ]);
        setFeaturedCollection(featured);
        setCuratedCollections(curated);
      } catch (err) {
        console.error('Error fetching featured content:', err);
      } finally {
        setLoading(false);
      }
    };

    if (terminalCode && airportCode) {
      fetchFeatured();
    }
  }, [terminalCode, airportCode]);

  return { featuredCollection, curatedCollections, loading };
}
