export interface TerminalAmenity {
  name: string;
  amenity_type?: string;
  location_description?: string;
  category?: string;
  vibe_tags?: string[];
  price_tier?: string;
  opening_hours?: Record<string, string>;
  image_url?: string;
  slug?: string;
  coordinates?: {
    x: number;
    y: number;
  };
  crowd_metrics?: {
    current_level: 'low' | 'medium' | 'high';
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
  // Properties from other data sources
  terminal?: string;
  terminal_code?: string;
  airport_code?: string;
  categories?: string;
  detailUrl?: string;
  image?: string;
} 