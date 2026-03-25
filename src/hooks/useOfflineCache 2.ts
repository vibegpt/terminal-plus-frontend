import { useState, useEffect, useCallback } from 'react';

interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface UseOfflineCacheOptions {
  key: string;
  ttl?: number; // Time to live in milliseconds
  maxAge?: number; // Maximum age in milliseconds
}

export function useOfflineCache<T>({
  key,
  ttl = 5 * 60 * 1000, // 5 minutes default
  maxAge = 24 * 60 * 60 * 1000 // 24 hours default
}: UseOfflineCacheOptions) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [cache, setCache] = useState<CacheItem<T> | null>(null);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load from cache on mount
  useEffect(() => {
    const cached = localStorage.getItem(`cache_${key}`);
    if (cached) {
      try {
        const item: CacheItem<T> = JSON.parse(cached);
        const now = Date.now();
        
        // Check if cache is still valid
        if (now < item.expiresAt && (now - item.timestamp) < maxAge) {
          setCache(item);
        } else {
          // Cache expired, remove it
          localStorage.removeItem(`cache_${key}`);
        }
      } catch (error) {
        console.warn('Failed to parse cached data:', error);
        localStorage.removeItem(`cache_${key}`);
      }
    }
  }, [key, maxAge]);

  const setCacheData = useCallback((data: T) => {
    const now = Date.now();
    const item: CacheItem<T> = {
      data,
      timestamp: now,
      expiresAt: now + ttl
    };

    setCache(item);
    
    try {
      localStorage.setItem(`cache_${key}`, JSON.stringify(item));
    } catch (error) {
      console.warn('Failed to save to cache:', error);
    }
  }, [key, ttl]);

  const getCacheData = useCallback((): T | null => {
    if (!cache) return null;
    
    const now = Date.now();
    if (now >= cache.expiresAt || (now - cache.timestamp) >= maxAge) {
      // Cache expired
      setCache(null);
      localStorage.removeItem(`cache_${key}`);
      return null;
    }

    return cache.data;
  }, [cache, maxAge, key]);

  const clearCache = useCallback(() => {
    setCache(null);
    localStorage.removeItem(`cache_${key}`);
  }, [key]);

  const isCacheValid = useCallback((): boolean => {
    if (!cache) return false;
    
    const now = Date.now();
    return now < cache.expiresAt && (now - cache.timestamp) < maxAge;
  }, [cache, maxAge]);

  const getCacheAge = useCallback((): number => {
    if (!cache) return 0;
    return Date.now() - cache.timestamp;
  }, [cache]);

  const getTimeUntilExpiry = useCallback((): number => {
    if (!cache) return 0;
    return Math.max(0, cache.expiresAt - Date.now());
  }, [cache]);

  return {
    isOnline,
    cache: getCacheData(),
    setCache: setCacheData,
    clearCache,
    isCacheValid: isCacheValid(),
    cacheAge: getCacheAge(),
    timeUntilExpiry: getTimeUntilExpiry(),
    hasCache: !!cache
  };
}

// Utility hook for specific data types
export function useAmenityCache(terminalCode: string, airportCode: string) {
  return useOfflineCache({
    key: `amenities_${airportCode}_${terminalCode}`,
    ttl: 10 * 60 * 1000, // 10 minutes
    maxAge: 2 * 60 * 60 * 1000 // 2 hours
  });
}

export function useCollectionCache(collectionId: string) {
  return useOfflineCache({
    key: `collection_${collectionId}`,
    ttl: 15 * 60 * 1000, // 15 minutes
    maxAge: 4 * 60 * 60 * 1000 // 4 hours
  });
}

export function useVibeCache(vibe: string, terminalCode: string) {
  return useOfflineCache({
    key: `vibe_${vibe}_${terminalCode}`,
    ttl: 5 * 60 * 1000, // 5 minutes
    maxAge: 1 * 60 * 60 * 1000 // 1 hour
  });
}