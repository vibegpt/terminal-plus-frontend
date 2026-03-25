import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Smart7Algorithm } from '../utils/smart7Algorithm';
import { sessionTracker } from '../utils/sessionTracking';
import { supabaseTrackingService } from '../services/supabaseTrackingService';
import type {
  AmenityForSelection,
  SelectionResult,
  Smart7SelectionConfig,
  PreferenceSignals,
  DiversityRules
} from '../types/smart7';
import type { Smart7Context } from '../types/tracking';
import { supabase } from '../services/supabaseClient';

interface UseSmart7SelectionProps {
  collectionId: number;
  config?: Partial<Smart7SelectionConfig>;
  autoRefresh?: boolean;
  refreshInterval?: number; // in minutes
  overrideContext?: Partial<Smart7Context>;
}

interface UseSmart7SelectionReturn {
  selections: SelectionResult[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  updateContext: (context: Partial<Smart7Context>) => void;
  preferences: PreferenceSignals | null;
  totalAmenities: number;
  lastRefreshed: Date | null;
  algorithmVersion: string;
}

export const useSmart7Selection = ({
  collectionId,
  config,
  autoRefresh = false,
  refreshInterval = 30, // 30 minutes default
  overrideContext
}: UseSmart7SelectionProps): UseSmart7SelectionReturn => {
  const [selections, setSelections] = useState<SelectionResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [preferences, setPreferences] = useState<PreferenceSignals | null>(null);
  const [context, setContext] = useState<Smart7Context>(() => ({
    currentTime: new Date(),
    userTerminal: overrideContext?.userTerminal || sessionTracker.getSessionContext()?.terminal,
    layoverDuration: overrideContext?.layoverDuration,
    pricePreference: overrideContext?.pricePreference,
    ...overrideContext
  }));
  const [totalAmenities, setTotalAmenities] = useState(0);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  
  const algorithmRef = useRef<Smart7Algorithm>();
  const refreshTimerRef = useRef<NodeJS.Timeout>();
  const cacheRef = useRef<{
    amenities: AmenityForSelection[];
    timestamp: number;
  } | null>(null);

  // Initialize algorithm
  useEffect(() => {
    algorithmRef.current = new Smart7Algorithm({
      targetCount: 7,
      includeReasons: true,
      enableTracking: true,
      ...config,
      diversityRules: {
        maxSameTerminal: 3,
        maxSamePriceLevel: 3,
        maxSameCategory: 2,
        balanceCategories: true,
        ...config?.diversityRules
      }
    });
  }, [config]);

  /**
   * Fetch amenities from collection
   */
  const fetchAmenities = useCallback(async (): Promise<AmenityForSelection[]> => {
    try {
      // Check cache first (5 minute cache)
      if (cacheRef.current && Date.now() - cacheRef.current.timestamp < 5 * 60 * 1000) {
        return cacheRef.current.amenities;
      }

      // Fetch from Supabase
      const { data, error } = await supabase
        .from('collection_amenities')
        .select(`
          amenity_detail!inner(
            id,
            name,
            description,
            terminal_code,
            price_level,
            vibe_tags,
            opening_hours,
            zone,
            gate_location,
            walking_time_minutes,
            category,
            is_24_hours,
            peak_hours,
            meal_times,
            logo_url,
            website_url,
            rating,
            review_count,
            features,
            status,
            isOpen
          )
        `)
        .eq('collection_id', collectionId);

      if (error) throw error;
      if (!data || data.length === 0) throw new Error('No amenities found in collection');

      // Extract amenity details
      const amenities = data.map(item => item.amenity_detail as unknown as AmenityForSelection);

      // Update cache
      cacheRef.current = {
        amenities,
        timestamp: Date.now()
      };

      return amenities;
    } catch (err) {
      console.error('Failed to fetch amenities:', err);
      throw err;
    }
  }, [collectionId]);

  /**
   * Fetch user preferences from tracking service
   */
  const fetchPreferences = useCallback(async (): Promise<PreferenceSignals | null> => {
    try {
      const sessionId = sessionTracker.getSessionId();
      if (!sessionId) return null;

      // Get preferences from tracking service
      const prefs = await supabaseTrackingService.getUserPreferences(sessionId);
      
      // Get recent interactions
      const interactions = await supabaseTrackingService.getUserInteractionHistory(sessionId, 100);
      
      // Build preference signals
      const clickedIds = interactions
        .filter(i => i.interaction_type === 'click')
        .map(i => i.amenity_id);
      
      const viewedIds = interactions
        .filter(i => i.interaction_type === 'view')
        .map(i => i.amenity_id);
      
      const bookmarkedIds = interactions
        .filter(i => i.interaction_type === 'bookmark')
        .map(i => i.amenity_id);

      // Get session preferences
      const sessionPrefs = sessionTracker.getSessionContext()?.preferences;

      return {
        clickedAmenityIds: [...new Set(clickedIds)],
        viewedAmenityIds: [...new Set(viewedIds)],
        bookmarkedAmenityIds: [...new Set(bookmarkedIds)],
        preferredPriceLevels: prefs.preferredPriceLevel,
        preferredVibes: prefs.topVibePreferences,
        engagementPattern: prefs.engagementPattern,
        sessionPreferences: sessionPrefs
      };
    } catch (err) {
      console.error('Failed to fetch preferences:', err);
      return null;
    }
  }, []);

  /**
   * Run the Smart7 selection algorithm
   */
  const runSelection = useCallback(async () => {
    if (!algorithmRef.current) return;

    setIsLoading(true);
    setError(null);

    try {
      // Fetch amenities and preferences in parallel
      const [amenities, userPrefs] = await Promise.all([
        fetchAmenities(),
        fetchPreferences()
      ]);

      setTotalAmenities(amenities.length);
      setPreferences(userPrefs);

      // Update context with current time
      const currentContext = {
        ...context,
        currentTime: new Date(),
        previousInteractions: userPrefs ? 
          await supabaseTrackingService.getUserInteractionHistory(
            sessionTracker.getSessionId() || '', 
            20
          ) : []
      };

      // Run selection algorithm
      const results = algorithmRef.current.selectSmart7(
        amenities,
        currentContext,
        userPrefs || undefined
      );

      setSelections(results);
      setLastRefreshed(new Date());

      // Track the Smart7 display if tracking is enabled
      if (results.length > 0 && config?.enableTracking !== false) {
        try {
          // Use the tracking hook to track Smart7 display
          const { useTracking } = await import('./useTracking');
          // Note: In a real implementation, you'd need to call this from a component
          // For now, we'll use the session tracker directly
          results.forEach((result, index) => {
            sessionTracker.trackSmart7Selection(
              result.amenity.id,
              collectionId,
              index + 1,
              result.contextData
            );
          });
        } catch (trackingError) {
          console.warn('Failed to track Smart7 display:', trackingError);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to select amenities');
      console.error('Smart7 selection failed:', err);
    } finally {
      setIsLoading(false);
    }
  }, [context, collectionId, fetchAmenities, fetchPreferences, config?.enableTracking]);

  /**
   * Initial load and auto-refresh
   */
  useEffect(() => {
    runSelection();

    // Setup auto-refresh if enabled
    if (autoRefresh && refreshInterval > 0) {
      refreshTimerRef.current = setInterval(() => {
        runSelection();
      }, refreshInterval * 60 * 1000);

      return () => {
        if (refreshTimerRef.current) {
          clearInterval(refreshTimerRef.current);
        }
      };
    }
  }, [runSelection, autoRefresh, refreshInterval]);

  /**
   * Manual refresh
   */
  const refresh = useCallback(async () => {
    // Clear cache to force fresh data
    cacheRef.current = null;
    await runSelection();
  }, [runSelection]);

  /**
   * Update context
   */
  const updateContext = useCallback((newContext: Partial<Smart7Context>) => {
    setContext(prev => ({
      ...prev,
      ...newContext
    }));
  }, []);

  // Re-run selection when context changes significantly
  useEffect(() => {
    const contextChangeTimer = setTimeout(() => {
      if (context.userTerminal !== sessionTracker.getSessionContext()?.terminal ||
          context.pricePreference || context.layoverDuration) {
        runSelection();
      }
    }, 500); // Debounce

    return () => clearTimeout(contextChangeTimer);
  }, [context.userTerminal, context.pricePreference, context.layoverDuration, runSelection]);

  // Get algorithm version
  const algorithmVersion = useMemo(() => {
    return algorithmRef.current ? '1.0' : 'Unknown';
  }, [algorithmRef.current]);

  return {
    selections,
    isLoading,
    error,
    refresh,
    updateContext,
    preferences,
    totalAmenities,
    lastRefreshed,
    algorithmVersion
  };
};

/**
 * Hook for getting Smart7 stats and performance
 */
export const useSmart7Performance = (collectionId: number) => {
  const [stats, setStats] = useState<{
    clickThroughRate: number;
    avgPositionClicked: number;
    topPerformingPositions: number[];
    selectionEffectiveness: number;
  } | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Query Smart7 effectiveness view
        const { data, error } = await supabase
          .from('smart7_effectiveness')
          .select('*')
          .eq('collection_id', collectionId)
          .order('day', { ascending: false })
          .limit(7); // Last 7 days

        if (error) throw error;
        if (!data || data.length === 0) return;

        // Calculate aggregate stats
        const totalClicks = data.reduce((sum, d) => sum + (d.clicks || 0), 0);
        const totalViews = data.reduce((sum, d) => sum + (d.views || 0), 0);
        const ctr = totalViews > 0 ? totalClicks / totalViews : 0;

        // Find average position clicked
        const positionClicks = new Map<number, number>();
        data.forEach(d => {
          if (d.position_in_list && d.clicks) {
            positionClicks.set(
              d.position_in_list,
              (positionClicks.get(d.position_in_list) || 0) + d.clicks
            );
          }
        });

        const avgPosition = Array.from(positionClicks.entries())
          .reduce((sum, [pos, clicks]) => sum + (pos * clicks), 0) / totalClicks;

        // Top performing positions
        const topPositions = Array.from(positionClicks.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([pos]) => pos);

        // Selection effectiveness (clicks in top 3 vs bottom 4)
        const top3Clicks = Array.from(positionClicks.entries())
          .filter(([pos]) => pos <= 3)
          .reduce((sum, [, clicks]) => sum + clicks, 0);
        
        const effectiveness = totalClicks > 0 ? top3Clicks / totalClicks : 0;

        setStats({
          clickThroughRate: ctr,
          avgPositionClicked: avgPosition,
          topPerformingPositions: topPositions,
          selectionEffectiveness: effectiveness
        });
      } catch (err) {
        console.error('Failed to fetch Smart7 stats:', err);
      }
    };

    fetchStats();
  }, [collectionId]);

  return stats;
};
