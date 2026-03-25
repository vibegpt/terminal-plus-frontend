// recommendationUtils.ts - Centralized recommendation logic
// Used in: useRecommendationEngine, recommendation services

import type { JourneyData, UserPreferences } from '@/types/journey.types';
import type { Amenity } from '@/types/amenity.types';

// Body clock and circadian rhythm helpers
export const getBodyClockVibes = (): string[] => {
  const localHour = new Date().getHours();
  
  if (localHour >= 6 && localHour < 12) return ['energize', 'focus'];
  if (localHour >= 12 && localHour < 18) return ['sustain', 'balance'];
  if (localHour >= 18 && localHour < 22) return ['unwind', 'socialize'];
  return ['rest', 'recharge'];
};

export const calculateLayoverDuration = (journeyData: JourneyData): number => {
  if (!journeyData.departure_time) return 120;
  // Simplified calculation - assume 2 hours for now
  return 120;
};

export const determineJourneyType = (journeyData: JourneyData): string => {
  if (journeyData.layover) return 'transit';
  if (journeyData.destination) return 'departure';
  return 'arrival';
};

export const calculateStressLevel = (departureTime: Date | null): string => {
  if (!departureTime) return 'medium';
  const timeUntilDeparture = (departureTime.getTime() - new Date().getTime()) / (1000 * 60);
  
  if (timeUntilDeparture < 30) return 'high';
  if (timeUntilDeparture < 60) return 'medium';
  return 'low';
};

// Relevance scoring and recommendation logic
export const calculateRelevanceScore = (amenity: Amenity, selectedVibe: string | undefined, preferences: UserPreferences): number => {
  let score = 0;
  
  // Base score from amenity rating
  score += (amenity.rating || 3) * 10;
  
  // Vibe match
  if (selectedVibe && amenity.vibe_tags?.includes(selectedVibe as any)) {
    score += 20;
  }
  
  // Category preference
  if (preferences.categories?.includes(amenity.category)) {
    score += 15;
  }
  
  return score;
};

export const generatePersonalizedReason = (amenity: Amenity, selectedVibe: string | undefined): string => {
  if (selectedVibe && amenity.vibe_tags?.includes(selectedVibe as any)) {
    return `Perfect for your ${selectedVibe} vibe`;
  }
  
  return 'Recommended based on your journey context';
};

export const calculateOptimalTiming = (amenity: Amenity) => {
  return {
    duration: 30, // Default 30 minutes
    bestTime: 'now',
    priority: 'medium' as const
  };
};

export const evaluateCircadianFit = (amenity: Amenity): string => {
  if (amenity.category === 'Food & Drink') {
    return 'optimal';
  }
  return 'good';
};

// Vibe transition and context helpers
export const shouldUseSelectedVibe = (isLive: boolean, isPreview: boolean, mixItUp: boolean): boolean => {
  if (mixItUp) return false;
  if (isLive) return true;
  if (isPreview) return false;
  return false;
};

export const isLiveContext = (currentAirport: string, userLocationAirport: string): boolean => {
  return currentAirport === userLocationAirport;
};

// Recommendation filtering and sorting
export const filterRecommendationsByCategory = (recommendations: Amenity[], category: string): Amenity[] => {
  return recommendations.filter(rec => rec.category === category);
};

export const filterRecommendationsForTimeframe = (recommendations: any[], minutes: number): any[] => {
  return recommendations.filter(rec => rec.suggestedTiming?.duration <= minutes);
};

export const getBodyClockRecommendations = (recommendations: any[]): any[] => {
  return recommendations.filter(r => r.circadianFit === 'optimal');
};

export const getUrgentRecommendations = (recommendations: any[]): any[] => {
  return recommendations.filter(r => r.priority === 'high');
}; 