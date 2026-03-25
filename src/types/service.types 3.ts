// API request/response, service-layer models
// Used in: Service layer (API calls) only

import type { Amenity } from './amenity.types';

// Recommendation service types
export interface RecommendationContext {
  current_terminal: string;
  current_gate: string;
  time_available_minutes: number;
  active_vibe: string;
  previous_vibe?: string;
  priority_flags: {
    show_time_sensitive: boolean;
    avoid_long_walks: boolean;
    prefer_quick_restore: boolean;
  };
  user_preferences?: UserPreferences;
  user_history?: UserHistory;
  current_location: Coordinates;
}

export interface RecommendedAction {
  title: string;
  type: string;
  slug: string;
  description: string;
  estimated_time_minutes: number;
  distance_meters: number;
  match_score: number;
  urgency: 'low' | 'medium' | 'high';
  transitions_well_from: string[];
  image_url: string;
  availability: 'low' | 'medium' | 'high';
  map_coordinates: {
    x: number;
    y: number;
  };
  tags: string[];
}

export interface RecommendationResponse {
  user_id: string;
  current_terminal: string;
  current_gate: string;
  current_time_utc: string;
  boarding_time_utc: string;
  time_available_minutes: number;
  active_vibe: string;
  previous_vibe?: string;
  vibe_changed: boolean;
  recommendation_strategy: string;
  priority_flags: {
    show_time_sensitive: boolean;
    avoid_long_walks: boolean;
    prefer_quick_restore: boolean;
  };
  suggested_actions: RecommendedAction[];
  events: {
    vibe_change_detected: boolean;
    recalculate_time_triggered: boolean;
    user_action_pending: boolean;
  };
  generated_at: string;
}

// Vibe mapping types
export interface VibeMapping {
  amenity_types: string[];
  weight: number;
  transitions: {
    from: string[];
    to: string[];
  };
  time_preferences: {
    min_time: number;
    max_time: number;
    ideal_time: number;
  };
}

// User preferences for services
export interface UserPreferences {
  preferred_price_tiers: string[];
  preferred_amenity_types: string[];
  preferred_vibes: string[];
  walking_speed_meters_per_minute: number;
  max_walking_distance_meters: number;
  time_preferences: {
    prefer_morning: boolean;
    prefer_afternoon: boolean;
    prefer_evening: boolean;
  };
}

// User history for recommendations
export interface UserHistory {
  visited_amenities: {
    amenity_slug: string;
    timestamp: string;
    vibe: string;
    duration_minutes: number;
    rating?: number;
  }[];
  vibe_transitions: {
    from: string;
    to: string;
    timestamp: string;
  }[];
}

// Coordinate types
export interface Coordinates {
  x: number;
  y: number;
}

// Terminal amenity with location
export interface TerminalAmenityWithLocation extends Amenity {
  coordinates: Coordinates;
}

// Crowd service types
export interface CrowdDataPoint {
  timestamp: string;
  crowd_level: 'low' | 'medium' | 'high' | 'peak';
  queue_time_minutes: number;
  capacity_percentage: number;
}

export interface CrowdDataResponse {
  amenity_slug: string;
  current_data: CrowdDataPoint;
  historical_data: CrowdDataPoint[];
  last_updated: string;
}

// Flight data types
export interface FetchFlightInfoParams {
  flightNumber: string;
  date?: string;
}

export interface FlightInfo {
  flightNumber: string;
  departure: string;
  arrival: string;
  departureTime: string;
  arrivalTime: string;
  status: string;
  terminal?: string;
  gate?: string;
}

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Authentication types
export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface AuthSession {
  user: AuthUser;
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

// Error types
export interface ApiError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
}

// Loading states
export interface LoadingState {
  isLoading: boolean;
  error: string | null;
  data: any | null;
}

// Query client types
export type UnauthorizedBehavior = "returnNull" | "throw";

// Adaptive recommendations hook types
export interface AdaptiveRecommendationContext {
  journeyData: any;
  currentTerminal?: string;
  currentGate?: string;
  currentLocation?: Coordinates;
  timeAvailableMinutes?: number;
  departureTime?: string | null;
  activeVibe?: string;
  previousVibe?: string;
  priorityFlags: {
    show_time_sensitive: boolean;
    avoid_long_walks: boolean;
    prefer_quick_restore: boolean;
  };
  userPreferences?: UserPreferences;
}

export interface UseRecommendationsProps {
  amenities: Amenity[];
  currentTerminal: string;
  currentGate: string;
  timeAvailableMinutes: number;
  initialVibe?: string;
}

export interface UseAmenityFilteringProps {
  amenities: Amenity[];
  filters: {
    categories: string[];
    terminals: string[];
    priceRange: string[];
    vibe: string;
  };
  onFilterChange: (filters: any) => void;
} 