import { useState, useEffect, useCallback } from 'react';
import { VibeService, VibeAmenity } from '../services/VibeService';

interface UsePaginatedAmenitiesOptions {
  vibe: string;
  terminalCode: string;
  airportCode: string;
  pageSize?: number;
  enabled?: boolean;
}

interface UsePaginatedAmenitiesReturn {
  amenities: VibeAmenity[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  total: number;
  currentPage: number;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  reset: () => void;
}

export const usePaginatedAmenities = ({
  vibe,
  terminalCode,
  airportCode,
  pageSize = 20,
  enabled = true
}: UsePaginatedAmenitiesOptions): UsePaginatedAmenitiesReturn => {
  const [amenities, setAmenities] = useState<VibeAmenity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);

  const loadPage = useCallback(async (page: number, append: boolean = false) => {
    if (!enabled) return;

    setLoading(true);
    setError(null);

    try {
      const result = await VibeService.getAmenitiesForVibePaginated(
        vibe,
        terminalCode,
        airportCode,
        page,
        pageSize
      );

      if (append) {
        setAmenities(prev => [...prev, ...result.amenities]);
      } else {
        setAmenities(result.amenities);
      }

      setHasMore(result.hasMore);
      setTotal(result.total);
      setCurrentPage(page);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load amenities';
      setError(errorMessage);
      console.error('Error loading amenities:', err);
    } finally {
      setLoading(false);
    }
  }, [vibe, terminalCode, airportCode, pageSize, enabled]);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    await loadPage(currentPage + 1, true);
  }, [loadPage, currentPage, loading, hasMore]);

  const refresh = useCallback(async () => {
    setCurrentPage(0);
    await loadPage(1, false);
  }, [loadPage]);

  const reset = useCallback(() => {
    setAmenities([]);
    setCurrentPage(0);
    setHasMore(true);
    setError(null);
  }, []);

  // Load initial data
  useEffect(() => {
    if (enabled) {
      reset();
      loadPage(1, false);
    }
  }, [vibe, terminalCode, airportCode, pageSize, enabled, loadPage, reset]);

  return {
    amenities,
    loading,
    error,
    hasMore,
    total,
    currentPage,
    loadMore,
    refresh,
    reset
  };
};
