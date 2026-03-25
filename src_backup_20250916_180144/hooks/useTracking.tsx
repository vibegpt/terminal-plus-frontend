import { useEffect, useCallback, useRef } from 'react';
import { sessionTracker } from '../utils/sessionTracking';
import { supabaseTrackingService } from '../services/supabaseTrackingService';
import type { AmenityInteraction, SessionContext } from '../types/tracking';

interface UseTrackingOptions {
  amenityId?: number;
  collectionId?: number;
  autoTrackView?: boolean;
  viewThresholdMs?: number; // Minimum time to count as a view
}

interface UseTrackingReturn {
  sessionId: string | null;
  sessionContext: SessionContext | null;
  trackClick: () => void;
  trackBookmark: () => void;
  trackShare: () => void;
  trackNavigate: () => void;
  trackView: (amenityId: number) => void;
  trackSmart7Display: (amenityIds: number[], contextData?: Record<string, any>) => void;
  setTerminal: (terminal: string) => void;
  updatePreference: (key: keyof SessionContext['preferences'], value: any) => void;
  getUserPreferences: () => Promise<any>;
  clearSession: () => void;
}

export const useTracking = ({
  amenityId,
  collectionId,
  autoTrackView = false,
  viewThresholdMs = 1000
}: UseTrackingOptions = {}): UseTrackingReturn => {
  const viewTimerRef = useRef<NodeJS.Timeout | null>(null);
  const viewStartRef = useRef<Date | null>(null);
  const hasTrackedView = useRef(false);

  /**
   * Auto track view if enabled
   */
  useEffect(() => {
    if (autoTrackView && amenityId && !hasTrackedView.current) {
      // Start view tracking
      viewStartRef.current = new Date();
      sessionTracker.startAmenityView(amenityId);
      
      // Set timer for minimum view threshold
      viewTimerRef.current = setTimeout(() => {
        hasTrackedView.current = true;
      }, viewThresholdMs);

      return () => {
        // Clean up on unmount
        if (viewTimerRef.current) {
          clearTimeout(viewTimerRef.current);
        }
        
        if (amenityId && viewStartRef.current) {
          sessionTracker.endAmenityView(amenityId);
        }
      };
    }
  }, [amenityId, autoTrackView, viewThresholdMs]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (viewTimerRef.current) {
        clearTimeout(viewTimerRef.current);
      }
      
      if (amenityId && viewStartRef.current) {
        sessionTracker.endAmenityView(amenityId);
      }
    };
  }, [amenityId]);

  /**
   * Track click interaction
   */
  const trackClick = useCallback(() => {
    if (!amenityId) return;

    sessionTracker.trackInteraction(amenityId, 'click', {
      collection_id: collectionId,
      interaction_timestamp: new Date().toISOString()
    });
  }, [amenityId, collectionId]);

  /**
   * Track bookmark interaction
   */
  const trackBookmark = useCallback(() => {
    if (!amenityId) return;

    sessionTracker.trackInteraction(amenityId, 'bookmark', {
      collection_id: collectionId,
      interaction_timestamp: new Date().toISOString()
    });
  }, [amenityId, collectionId]);

  /**
   * Track share interaction
   */
  const trackShare = useCallback(() => {
    if (!amenityId) return;

    sessionTracker.trackInteraction(amenityId, 'share', {
      collection_id: collectionId,
      interaction_timestamp: new Date().toISOString()
    });
  }, [amenityId, collectionId]);

  /**
   * Track navigation to amenity
   */
  const trackNavigate = useCallback(() => {
    if (!amenityId) return;

    sessionTracker.trackInteraction(amenityId, 'navigate', {
      collection_id: collectionId,
      interaction_timestamp: new Date().toISOString()
    });
  }, [amenityId, collectionId]);

  /**
   * Manually track a view
   */
  const trackView = useCallback((viewAmenityId: number) => {
    sessionTracker.trackInteraction(viewAmenityId, 'view', {
      collection_id: collectionId,
      interaction_timestamp: new Date().toISOString()
    });
  }, [collectionId]);

  /**
   * Track Smart7 selection display
   */
  const trackSmart7Display = useCallback((
    amenityIds: number[], 
    contextData?: Record<string, any>
  ) => {
    if (!collectionId) return;

    amenityIds.forEach((id, index) => {
      sessionTracker.trackSmart7Selection(
        id,
        collectionId,
        index + 1, // Position starts at 1
        contextData
      );
    });
  }, [collectionId]);

  /**
   * Set user terminal
   */
  const setTerminal = useCallback((terminal: string) => {
    sessionTracker.setTerminal(terminal);
  }, []);

  /**
   * Update user preference
   */
  const updatePreference = useCallback(
    (key: keyof SessionContext['preferences'], value: any) => {
      sessionTracker.updatePreference(key, value);
    },
    []
  );

  /**
   * Get user preferences from backend
   */
  const getUserPreferences = useCallback(async () => {
    const sessionId = sessionTracker.getSessionId();
    if (!sessionId) return null;

    return await supabaseTrackingService.getUserPreferences(sessionId);
  }, []);

  /**
   * Clear session and start fresh
   */
  const clearSession = useCallback(() => {
    sessionTracker.clearSession();
    hasTrackedView.current = false;
  }, []);

  return {
    sessionId: sessionTracker.getSessionId(),
    sessionContext: sessionTracker.getSessionContext(),
    trackClick,
    trackBookmark,
    trackShare,
    trackNavigate,
    trackView,
    trackSmart7Display,
    setTerminal,
    updatePreference,
    getUserPreferences,
    clearSession
  };
};

/**
 * Hook for tracking collection performance
 */
export const useCollectionTracking = (collectionId: number) => {
  useEffect(() => {
    // Track collection view when component mounts
    sessionTracker.trackCollectionView(collectionId);
  }, [collectionId]);

  const getPerformanceStats = useCallback(async (
    dateRange?: { start: string; end: string }
  ) => {
    return await supabaseTrackingService.getCollectionPerformance(
      collectionId,
      dateRange
    );
  }, [collectionId]);

  return {
    getPerformanceStats
  };
};
