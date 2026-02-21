// Enhanced Amenity Data Structure with Metadata for Collections
// src/types/amenity.enhanced.types.ts

export interface EnhancedAmenity {
  // Core fields (existing schema)
  id?: number;
  name: string;
  slug: string;
  terminal_code: string;
  airport_code: string;
  category: string;
  amenity_type?: string;
  description?: string;
  location_description?: string;
  vibe_tags: string[];
  
  // Location & Access
  coordinates?: {
    lat: number;
    lng: number;
  };
  gate_proximity?: string; // "Gate 1-10", "Central", "Far end"
  walking_time_from_center?: number; // minutes
  floor_level?: string;
  
  // Operational
  opening_hours?: Record<string, string>;
  price_tier?: string; // $, $$, $$$, $$$$
  booking_required?: boolean;
  access_requirements?: string[]; // ["Business Class", "Priority Pass", "Pay-per-use"]
  
  // Media & Social Proof
  image_url?: string;
  logo_url?: string;
  photo_gallery?: string[];
  instagram_hashtag?: string;
  instagram_posts_count?: number;
  
  // Quality Indicators (for collections)
  awards?: string[]; // ["Skytrax Best Lounge 2023", "Airport Service Quality Award"]
  ratings?: {
    google?: number;
    tripadvisor?: number;
    internal?: number;
  };
  review_count?: number;
  
  // Collection Metadata
  collection_tags?: string[]; // ["must-see", "hidden-gem", "instagram-worthy", "award-winner"]
  unique_features?: string[]; // ["Only airport butterfly garden", "World's tallest indoor slide"]
  best_for?: string[]; // ["families", "solo-travelers", "business", "long-layovers"]
  
  // Time-based Intelligence
  peak_hours?: string[]; // ["06:00-09:00", "17:00-20:00"]
  average_dwell_time?: number; // minutes
  queue_times?: {
    peak: number;
    offPeak: number;
  };
  time_required?: number; // minutes for full experience
  
  // Real-time Data (when available)
  live_data?: {
    current_occupancy?: number;
    wait_time?: number;
    is_open?: boolean;
    special_status?: string; // "Temporarily closed", "Special event"
  };
  
  // Personalization Helpers
  suitable_for_vibes?: string[]; // Which vibes this strongly matches
  energy_level?: 'low' | 'medium' | 'high'; // For matching user energy
  noise_level?: 'quiet' | 'moderate' | 'loud';
  
  // Business Intelligence
  partner_status?: 'featured' | 'premium' | 'standard' | null;
  promotional_content?: string;
  booking_link?: string;
  loyalty_program?: string;
  
  // Status
  status: 'active' | 'inactive' | 'coming_soon' | 'seasonal';
  last_updated?: string;
  verified_date?: string;
}

// Collection Definition with Dynamic Rules
export interface SmartCollection {
  id: string;
  name: string;
  description: string;
  
  // Collection Rules (for dynamic population)
  filters: {
    must_have_tags?: string[]; // All of these tags required
    should_have_tags?: string[]; // At least one of these
    must_not_have_tags?: string[]; // None of these
    
    min_rating?: number;
    max_price_tier?: number;
    max_walking_time?: number;
    
    awards_required?: boolean;
    instagram_threshold?: number; // Min posts for "instagram-worthy"
    
    time_constraints?: {
      max_duration?: number; // For time-pressed collections
      min_duration?: number; // For leisurely collections
    };
  };
  
  // Sorting & Ranking
  sort_by: 'rating' | 'popularity' | 'distance' | 'time_required' | 'trending';
  
  // Display Limits
  min_items: number;
  max_items: number;
  
  // Versioning (for A/B testing)
  versions?: {
    [key: string]: {
      name: string;
      filters: any;
      performance_metrics?: {
        ctr: number;
        satisfaction: number;
      };
    };
  };
}

// Usage Example
export const MUST_SEE_HIGHLIGHTS: SmartCollection = {
  id: 'must-see-highlights',
  name: 'Must-See Highlights',
  description: 'Award-winning spots everyone loves',
  
  filters: {
    should_have_tags: ['award-winner', 'unique-feature', 'instagram-worthy'],
    min_rating: 4.5,
    awards_required: true,
    instagram_threshold: 1000
  },
  
  sort_by: 'rating',
  min_items: 5,
  max_items: 8,
  
  versions: {
    'v1': {
      name: 'Classic Must-See',
      filters: { min_rating: 4.5 }
    },
    'v2': {
      name: 'Social Proof Must-See',
      filters: { instagram_threshold: 5000 }
    }
  }
};
