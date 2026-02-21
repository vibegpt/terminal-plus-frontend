import type { Amenity } from './amenity.types';
import type { JourneyData } from './journey.types';
import type { Vibe, CrowdLevel, TimePeriod } from './common.types';

// User context for smart recommendations
export interface UserContext {
  journeyData: JourneyData;
  currentTime: Date;
  timeOfDay: TimePeriod;
  energyLevel: 'low' | 'medium' | 'high';
  preferences: {
    vibes: Vibe[];
    priceRange?: string;
    accessibility?: boolean;
    maxWaitTime?: number;
    preferredCategories?: string[];
  };
  constraints: {
    timeAvailable: number; // minutes
    budget?: number;
    mobility?: 'high' | 'medium' | 'low';
  };
  location: {
    terminal: string;
    gate?: string;
    coordinates?: { lat: number; lng: number };
  };
}

// Energy level suggestion
export interface EnergySuggestion {
  id: string;
  suggestion: {
    level: 'low' | 'medium' | 'high';
    confidence: number;
    reasoning: string[];
  };
  alternatives: Array<{
    level: 'low' | 'medium' | 'high';
    confidence: number;
  }>;
}

// Smart recommendation result
export interface SmartRecommendationResult {
  recommendations: Amenity[];
  journeyContext: 'departure' | 'transit' | 'arrival';
  fallbacks: Amenity[];
  explanation: {
    energyLevel: string;
    reasoning: string[];
    factors: string[];
  };
  energySuggestion: EnergySuggestion | null;
}

// Recommendation engine interface
export interface RecommendationEngine {
  loadVenues(venues: Amenity[]): void;
  generateEnergySuggestion(context: UserContext): EnergySuggestion | null;
  recordUserCorrection(suggestionId: string, userLevel: string, context: UserContext): void;
  getSmartRecommendations(query: string, context: UserContext): SmartRecommendationResult;
} 