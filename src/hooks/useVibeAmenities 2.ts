// src/hooks/useVibeAmenities.ts - ENHANCED VERSION
import { useState, useEffect, useRef } from 'react';
import { VibeService, VibeAmenity, VibeInfo } from '../services/VibeService';
import { ErrorService, AppError } from '../services/errorService';
import { useOfflineCache } from './useOfflineCache';

interface UseVibeAmenitiesOptions {
  terminalCode: string;
  airportCode: string;
  limitPerVibe?: number;
}

interface UseVibeAmenitiesReturn {
  vibesWithAmenities: Map<string, VibeAmenity[]>;
  vibeConfig: Record<string, VibeInfo>;
  loading: boolean;
  error: AppError | null;
  errorMessage: string | null;
  refetch: () => Promise<void>;
  isRetrying: boolean;
  isOffline: boolean;
  hasCachedData: boolean;
}

export function useVibeAmenities({
  terminalCode,
  airportCode,
  limitPerVibe = 10
}: UseVibeAmenitiesOptions): UseVibeAmenitiesReturn {
  const [vibesWithAmenities, setVibesWithAmenities] = useState<Map<string, VibeAmenity[]>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AppError | null>(null);
  const retryCount = useRef(0);
  const maxRetries = 3;

  const vibeConfig = VibeService.getVibeConfig();
  
  // Use offline cache for this specific terminal/airport combination
  const cacheKey = `vibes_${airportCode}_${terminalCode}`;
  const {
    isOnline,
    cache: cachedData,
    setCache,
    isCacheValid,
    hasCache
  } = useOfflineCache<Map<string, VibeAmenity[]>>({
    key: cacheKey,
    ttl: 5 * 60 * 1000, // 5 minutes
    maxAge: 2 * 60 * 60 * 1000 // 2 hours
  });

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
      setCache(data); // Cache the successful result
      retryCount.current = 0; // Reset on success
      
    } catch (err) {
      const appError = ErrorService.handle(err);
      setError(appError);
      ErrorService.logError(appError, { terminalCode, airportCode, limitPerVibe });
      
      // Auto-retry for retryable errors
      if (ErrorService.shouldRetry(appError, retryCount.current)) {
        retryCount.current++;
        const delay = ErrorService.getRetryDelay(retryCount.current - 1);
        
        console.log(`Retrying... attempt ${retryCount.current}/${maxRetries} in ${delay}ms`);
        
        setTimeout(() => {
          fetchAmenities();
        }, delay);
      }
    } finally {
      setLoading(false);
    }
  };

  // Load cached data if available and valid
  useEffect(() => {
    if (cachedData && isCacheValid) {
      setVibesWithAmenities(cachedData);
      setLoading(false);
    }
  }, [cachedData, isCacheValid]);

  // Fetch fresh data when online and no valid cache
  useEffect(() => {
    if (terminalCode && airportCode && isOnline && (!hasCache || !isCacheValid)) {
      fetchAmenities();
    }
  }, [terminalCode, airportCode, limitPerVibe, isOnline, hasCache, isCacheValid]);

  return {
    vibesWithAmenities,
    vibeConfig,
    loading,
    error,
    errorMessage: error ? ErrorService.getUserMessage(error) : null,
    refetch: fetchAmenities,
    isRetrying: retryCount.current > 0,
    isOffline: !isOnline,
    hasCachedData: hasCache && isCacheValid
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
