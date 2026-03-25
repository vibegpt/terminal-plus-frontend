import { useState, useEffect, useCallback, useMemo } from 'react';
import { progressiveLoadingService, AmenityData, LoadingPriority, PreloadStrategy } from '../services/progressiveLoadingService';
import { useSimpleJourneyContext } from './useSimpleJourneyContext';

export interface UseProgressiveLoadingOptions {
  terminal: string;
  enablePreloading?: boolean;
  enableBackgroundLoading?: boolean;
  maxCacheAge?: number; // milliseconds
}

export interface ProgressiveLoadingState {
  amenities: AmenityData[];
  loadingState: 'initial' | 'essential' | 'detail' | 'media' | 'complete' | 'error';
  loadingPriorities: LoadingPriority[];
  preloadStrategies: PreloadStrategy[];
  performanceMetrics: Record<string, number>;
  error: string | null;
  progress: {
    essential: number;
    detail: number;
    media: number;
    total: number;
  };
}

export const useProgressiveLoading = (options: UseProgressiveLoadingOptions): ProgressiveLoadingState & {
  loadDetailData: (amenityIds: string[]) => Promise<void>;
  loadMediaData: (amenityIds: string[]) => Promise<void>;
  refreshData: () => Promise<void>;
  preloadAdjacentTerminals: () => Promise<void>;
} => {
  const { location } = useSimpleJourneyContext();
  const [state, setState] = useState<ProgressiveLoadingState>({
    amenities: [],
    loadingState: 'initial',
    loadingPriorities: [],
    preloadStrategies: [],
    performanceMetrics: {},
    error: null,
    progress: { essential: 0, detail: 0, media: 0, total: 0 }
  });

  // Memoize loading priorities based on current terminal
  const loadingPriorities = useMemo(() => {
    return progressiveLoadingService.getLoadingPriority(
      options.terminal, 
      location.terminal || 'T1'
    );
  }, [options.terminal, location.terminal]);

  // Memoize preload strategies based on time of day
  const preloadStrategies = useMemo(() => {
    if (!options.enablePreloading) return [];
    return progressiveLoadingService.getPreloadStrategies();
  }, [options.enablePreloading]);

  // Load essential data immediately
  const loadEssentialData = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loadingState: 'essential' }));
      
      const essentialData = await progressiveLoadingService.loadEssentialData(options.terminal);
      
      const amenities: AmenityData[] = essentialData.map(essential => ({
        essential,
        loadingState: 'essential' as const
      }));

      setState(prev => ({
        ...prev,
        amenities,
        loadingState: 'essential',
        progress: { ...prev.progress, essential: amenities.length, total: amenities.length }
      }));

      // Start background loading of detail data for visible amenities
      if (options.enableBackgroundLoading) {
        const visibleAmenityIds = amenities.slice(0, 10).map(a => a.essential.amenity_slug);
        loadDetailData(visibleAmenityIds);
      }

    } catch (error) {
      setState(prev => ({
        ...prev,
        loadingState: 'error',
        error: error instanceof Error ? error.message : 'Failed to load essential data'
      }));
    }
  }, [options.terminal, options.enableBackgroundLoading]);

  // Load detail data on-demand
  const loadDetailData = useCallback(async (amenityIds: string[]) => {
    try {
      setState(prev => ({ ...prev, loadingState: 'detail' }));
      
      const detailData = await progressiveLoadingService.loadDetailData(amenityIds);
      
      setState(prev => {
        const updatedAmenities = prev.amenities.map(amenity => {
          const detail = detailData.find(d => d.name === amenity.essential.amenity_slug);
          if (detail) {
            return {
              ...amenity,
              detail,
              loadingState: 'detail' as const
            };
          }
          return amenity;
        });

        return {
          ...prev,
          amenities: updatedAmenities,
          loadingState: 'detail',
          progress: { 
            ...prev.progress, 
            detail: detailData.length,
            total: updatedAmenities.length 
          }
        };
      });

    } catch (error) {
      console.error('Failed to load detail data:', error);
      // Don't fail the entire loading process for detail data
    }
  }, []);

  // Load media data when needed
  const loadMediaData = useCallback(async (amenityIds: string[]) => {
    try {
      setState(prev => ({ ...prev, loadingState: 'media' }));
      
      const mediaData = await progressiveLoadingService.loadMediaData(amenityIds);
      
      setState(prev => {
        const updatedAmenities = prev.amenities.map(amenity => {
          const media = mediaData.find(m => m.logo_url || m.image_url);
          if (media) {
            return {
              ...amenity,
              media,
              loadingState: 'media' as const
            };
          }
          return amenity;
        });

        return {
          ...prev,
          amenities: updatedAmenities,
          loadingState: 'media',
          progress: { 
            ...prev.progress, 
            media: mediaData.length,
            total: updatedAmenities.length 
          }
        };
      });

    } catch (error) {
      console.error('Failed to load media data:', error);
      // Don't fail the entire loading process for media data
    }
  }, []);

  // Refresh all data
  const refreshData = useCallback(async () => {
    setState(prev => ({ ...prev, loadingState: 'initial', error: null }));
    await loadEssentialData();
  }, [loadEssentialData]);

  // Preload adjacent terminals
  const preloadAdjacentTerminals = useCallback(async () => {
    if (!options.enablePreloading) return;

    try {
      const priorities = loadingPriorities.filter(p => p.priority <= 2);
      
      for (const priority of priorities) {
        if (priority.loadStrategy === 'background') {
          // Start background loading of adjacent terminals
          progressiveLoadingService.loadEssentialData(priority.description.toLowerCase())
            .catch(error => console.warn(`Failed to preload ${priority.description}:`, error));
        }
      }
    } catch (error) {
      console.warn('Failed to preload adjacent terminals:', error);
    }
  }, [loadingPriorities, options.enablePreloading]);

  // Load essential data on mount
  useEffect(() => {
    loadEssentialData();
  }, [loadEssentialData]);

  // Preload adjacent terminals when essential data is loaded
  useEffect(() => {
    if (state.loadingState === 'essential' && options.enablePreloading) {
      preloadAdjacentTerminals();
    }
  }, [state.loadingState, options.enablePreloading, preloadAdjacentTerminals]);

  // Update performance metrics
  useEffect(() => {
    const metrics = progressiveLoadingService.getPerformanceMetrics();
    setState(prev => ({ ...prev, performanceMetrics: metrics }));
  }, [state.loadingState]);

  // Update state with loading priorities and preload strategies
  useEffect(() => {
    setState(prev => ({
      ...prev,
      loadingPriorities,
      preloadStrategies
    }));
  }, [loadingPriorities, preloadStrategies]);

  return {
    ...state,
    loadDetailData,
    loadMediaData,
    refreshData,
    preloadAdjacentTerminals
  };
};
