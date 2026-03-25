// src/types/database.types.ts - Database schema types
// Based on CSV structure and collection mapping requirements

export interface Amenity {
  id: number;
  amenity_slug: string;
  name: string;
  description: string;
  vibe_tags: string;
  price_level: string;
  opening_hours: string;
  terminal_code: string;
  airport_code: string;
  website_url?: string;
  logo_url?: string;
  booking_required: boolean;
  available_in_tr: boolean;
  created_at: string;
}

export interface Collection {
  collection_slug: string;
  collection_name: string;
  vibes: string[]; // Array of vibe tags to match
  icon: string;
  gradient: string;
  description: string;
}

export interface EnrichedAmenity extends Amenity {
  isOpen: boolean;
  walkTime: string;
  status: 'quiet' | 'moderate' | 'busy';
  features: string[];
  gradient: string;
  rating?: number;
  trending?: boolean;
}

export interface CollectionVibeMap {
  [collectionSlug: string]: {
    vibes: string[];
    description: string;
    icon: string;
    gradient: string;
  };
}

export interface BestOfCategory {
  category: string;
  orderBy?: string;
  ascending?: boolean;
  filter?: string;
  value?: any;
}
