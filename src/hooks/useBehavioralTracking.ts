import { useEffect, useCallback, useRef } from 'react';
import { behavioralTracking } from '../services/behavioralTrackingService';
import { useLocation } from 'react-router-dom';

export const useBehavioralTracking = () => {
  const location = useLocation();
  const lastScrollTime = useRef(Date.now());

  // Track scroll behavior with debouncing
  useEffect(() => {
    const handleScroll = () => {
      const now = Date.now();
      if (now - lastScrollTime.current > 500) { // Debounce 500ms
        lastScrollTime.current = now;
        
        const scrollDepth = window.scrollY;
        const maxScroll = document.body.scrollHeight - window.innerHeight;
        behavioralTracking.trackScroll(scrollDepth, maxScroll);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Track amenity clicks
  const trackAmenityClick = useCallback((
    amenity: any,
    collectionId?: string
  ) => {
    behavioralTracking.trackAmenityClick(
      amenity.id,
      amenity.name,
      {
        terminal_code: amenity.terminal_code,
        collection_id: collectionId,
        vibe_context: amenity.vibe_tags,
        journey_phase: 'at_airport', // You can make this dynamic
        device_type: window.innerWidth <= 768 ? 'mobile' : 'desktop'
      }
    );
  }, []);

  // Track collection views
  const trackCollectionView = useCallback((
    collectionId: string,
    collectionName: string
  ) => {
    behavioralTracking.trackCollectionView(collectionId, collectionName);
  }, []);

  // Get personalized recommendations
  const getRecommendations = useCallback(async (
    terminalCode: string,
    timeUntilBoarding?: number
  ) => {
    return await behavioralTracking.getPersonalizedRecommendations(
      terminalCode,
      timeUntilBoarding
    );
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      behavioralTracking.cleanup();
    };
  }, []);

  return {
    trackAmenityClick,
    trackCollectionView,
    getRecommendations
  };
};

