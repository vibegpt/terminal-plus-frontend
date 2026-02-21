// Journey model, steps, transit logic
// Used in: Journey planning, journey views

import type { Amenity } from './amenity.types';
import type { Vibe } from './common.types';

// Core journey data structure
export interface JourneyData {
  from: string;
  to: string;
  flightNumber: string;
  date: string;
  layover?: string;
  selected_vibe?: Vibe;
  departureGate?: string | null;
  departure_time?: string | null;
  layovers?: string[];
  destination?: string;
  departure?: string;
  terminal?: string;
}

// Journey context for React Context
export interface JourneyContextType {
  journeyData: JourneyData | null;
  updateJourneyData: (update: Partial<JourneyData>) => void;
  clearJourneyData: () => void;
}

// Journey step for multi-airport trips
export interface JourneyStep {
  id: string;
  airport: string;
  terminal?: string;
  gate?: string;
  arrivalTime?: string;
  departureTime?: string;
  duration?: number;
  type: 'departure' | 'transit' | 'arrival';
  amenities?: Amenity[];
}

// Trip segment for complex journeys
export interface TripSegment {
  from: string;
  to: string;
  flightNumber: string;
  departureTime: string;
  arrivalTime: string;
  duration: number;
  terminal?: string;
  gate?: string;
}

// Trip data for multi-airport journeys
export interface TripData {
  id: string;
  stops: JourneyStep[];
  segments: TripSegment[];
  totalDuration: number;
  createdAt: string;
  updatedAt: string;
}

// Saved journey for persistence
export interface SavedJourney {
  id: string;
  userId: string;
  journeyData: JourneyData;
  stops: Amenity[];
  preferences: UserPreferences;
  createdAt: string;
  updatedAt: string;
}

// User preferences for journey planning
export interface UserPreferences {
  categories: string[];
  priceRange?: string;
  accessibility?: boolean;
  rating?: number;
  preferred_vibes?: Vibe[];
  walking_speed_meters_per_minute?: number;
  max_walking_distance_meters?: number;
}

// Journey planning context
export interface JourneyPlanningContext {
  currentJourney: JourneyData | null;
  isPlanning: boolean;
  getRecommendations: (count: number) => Amenity[];
  setCurrentJourney: (journey: JourneyData) => void;
  setIsPlanning: (planning: boolean) => void;
}

// Type guards
export function isJourney(obj: any): obj is JourneyData {
  return obj && 
         typeof obj === 'object' && 
         typeof obj.from === 'string' && 
         typeof obj.to === 'string' &&
         typeof obj.selected_vibe === 'string';
}

export function isJourneyStep(obj: any): obj is JourneyStep {
  return obj && 
         typeof obj === 'object' && 
         typeof obj.id === 'string' && 
         typeof obj.airport === 'string' &&
         typeof obj.type === 'string';
}

export function isTripData(obj: any): obj is TripData {
  return obj && 
         typeof obj === 'object' && 
         typeof obj.id === 'string' && 
         Array.isArray(obj.stops) &&
         Array.isArray(obj.segments);
} 