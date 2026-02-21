// Amenity structure, tags, vibe logic
// Used in: Recommendation engine, amenity cards

import type { Coordinates, CrowdLevel, Vibe } from './common.types';

// Core amenity interface
export interface Amenity {
  id: string;
  name: string;
  category: string;
  subcategory?: string;
  terminal?: string;
  location: string;
  priceRange?: string;
  accessibility?: boolean;
  rating?: number;
  hours?: string | Record<string, string>;
  tags?: string[];
  description?: string;
  image_url?: string;
  image?: string;
  walkTime?: number;
  crowdLevel?: CrowdLevel;
  waitTime?: number;
  urgency?: string;
  vibe_tags?: Vibe[];
  coordinates?: Coordinates;
  slug?: string;
  amenity_type?: string;
  location_description?: string;
  price_tier?: string;
  opening_hours?: Record<string, string>;
  terminal_code?: string;
  airport_code?: string;
  categories?: string;
  detailUrl?: string;
  has_free_perk?: boolean;
  crowd_metrics?: {
    current_level: CrowdLevel;
    queue_time_minutes: number;
    last_updated: string;
    capacity_percentage: number;
    historical_averages: {
      weekday: {
        morning: number;
        afternoon: number;
        evening: number;
      };
      weekend: {
        morning: number;
        afternoon: number;
        evening: number;
      };
    };
  };
}

// Legacy interface for backward compatibility
export interface TerminalAmenity extends Amenity {}

// Legacy interface for backward compatibility  
export interface AmenityLocation extends Amenity {}

// User preferences for amenity selection
export interface UserPreferences {
  categories: string[];
  priceRange?: string;
  accessibility?: boolean;
  rating?: number;
  preferred_vibes?: Vibe[];
  walking_speed_meters_per_minute?: number;
  max_walking_distance_meters?: number;
}

// Basic journey interface for amenity context
export interface Journey {
  id: string;
  userId: string;
  start: string;
  end: string;
  stops: Amenity[];
  preferences: UserPreferences;
}

// Type guards
export function isAmenity(obj: any): obj is Amenity {
  return obj && typeof obj === 'object' && 'id' in obj && 'name' in obj && 'category' in obj;
}

export function isJourney(obj: any): obj is Journey {
  return obj && typeof obj === 'object' && 'id' in obj && 'userId' in obj && Array.isArray(obj.stops);
} 