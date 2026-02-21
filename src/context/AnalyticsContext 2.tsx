// Analytics context for Terminal+
import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  initializeAnalytics,
  trackTravelEvent,
  updateHotjarTravelContext,
  TravelEventData
} from '@/lib/analytics';

interface AnalyticsContextValue {
  // Travel context state
  currentTravelContext: TravelEventData;
  updateTravelContext: (context: Partial<TravelEventData>) => void;
  
  // Event tracking methods
  trackEvent: (eventName: string, eventData?: TravelEventData) => void;
  trackPageView: (pageName: string) => void;
  
  // Travel-specific trackers
  trackEmotionChange: (emotion: string, confidence: number) => void;
  trackVibeChange: (vibe: string) => void;
  trackRecommendationAction: (action: string, recommendation: any) => void;
  trackSocialProofAction: (action: string, socialProofData: any) => void;
}

const AnalyticsContext = createContext<AnalyticsContextValue | null>(null);

export const AnalyticsProvider: React.FC<{ children: React.ReactNode }> = ({
  children
}) => {
  // Travel context state
  const [currentTravelContext, setCurrentTravelContext] = useState<TravelEventData>({
    journeyPhase: 'pre-travel',
    travelCompanions: 'solo',
    timeConstraints: 'moderate'
  });

  // Initialize analytics on mount
  useEffect(() => {
    try {
      initializeAnalytics();
    } catch (error) {
      console.warn('Analytics initialization failed:', error);
    }
  }, []);

  // Context methods
  const updateTravelContext = (context: Partial<TravelEventData>) => {
    setCurrentTravelContext(prev => ({ ...prev, ...context }));
  };

  const trackEvent = (eventName: string, eventData: TravelEventData = {}) => {
    try {
      trackTravelEvent(eventName, { ...currentTravelContext, ...eventData });
    } catch (error) {
      console.warn('Analytics tracking failed:', error);
    }
  };

  const trackEmotionChange = (emotion: string, confidence: number) => {
    trackEvent('emotion_detected', {
      emotionalState: emotion,
      emotionConfidence: confidence
    });
  };

  const trackVibeChange = (vibe: string) => {
    trackEvent('vibe_selected', {
      vibeSelected: vibe
    });
  };

  const trackRecommendationAction = (action: string, recommendation: any) => {
    trackEvent(`recommendation_${action}`, {
      recommendation_name: recommendation.name,
      recommendation_type: recommendation.type,
      vibe_alignment: recommendation.vibeAlignment
    });
  };

  const trackSocialProofAction = (action: string, socialProofData: any) => {
    trackEvent(`social_proof_${action}`, {
      social_proof_type: socialProofData.type,
      social_proof_users: socialProofData.userCount
    });
  };

  const value: AnalyticsContextValue = {
    currentTravelContext,
    updateTravelContext,
    trackEvent,
    trackPageView: (pageName: string) => trackEvent('page_view', { page: pageName }),
    trackEmotionChange,
    trackVibeChange,
    trackRecommendationAction,
    trackSocialProofAction
  };

  return (
    <AnalyticsContext.Provider value={value}>
      {children}
    </AnalyticsContext.Provider>
  );
};

// Hook for using analytics
export const useAnalytics = (): AnalyticsContextValue => {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error('useAnalytics must be used within AnalyticsProvider');
  }
  return context;
}; 