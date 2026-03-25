import type { AmenityForSelection } from './smart7';

// Enhanced collection types for Smart7 system
export interface Smart7Collection {
  id: string;
  collection_id: string;
  name: string;
  description: string;
  vibe_category: 'comfort' | 'chill' | 'refuel' | 'work' | 'quick' | 'exclusive';
  icon: string;
  color: string;
  amenities: AmenityWithScore[];
  total_amenities: number;
  featured_amenities: number;
  avg_priority_score: number;
  terminals_covered: string[];
  is_smart7_eligible: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface AmenityWithScore {
  id: number;
  name: string;
  category: string;
  terminal_code: string;
  vibe_tags: string;
  priority_score: number;
  is_featured: boolean;
  collection_relevance: number;
  price_level?: string;
  rating?: number;
  review_count?: number;
  logo_url?: string;
  website_url?: string;
  features?: string[];
  status?: string;
  isOpen?: boolean;
}

// Collection categories with their characteristics
export interface CollectionCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  characteristics: string[];
  bestFor: string[];
  terminalFocus: string[];
}

// Vibe-based collection mapping
export const COLLECTION_CATEGORIES: Record<string, CollectionCategory> = {
  comfort: {
    id: 'comfort',
    name: 'Comfort',
    description: 'Relaxation and comfort amenities for travelers',
    icon: '🛋️',
    color: 'from-blue-400 to-indigo-600',
    characteristics: ['relaxing', 'comfortable', 'peaceful', 'restful'],
    bestFor: ['morning', 'night', 'long-layover', 'red-eye-recovery'],
    terminalFocus: ['T1', 'T2', 'T3']
  },
  chill: {
    id: 'chill',
    name: 'Chill',
    description: 'Peaceful and quiet spaces for relaxation',
    icon: '😌',
    color: 'from-green-400 to-emerald-600',
    characteristics: ['quiet', 'peaceful', 'calm', 'tranquil'],
    bestFor: ['afternoon', 'evening', 'medium-layover', 'stress-relief'],
    terminalFocus: ['T1', 'T2', 'T3', 'T4']
  },
  refuel: {
    id: 'refuel',
    name: 'Refuel',
    description: 'Food and beverage options for energy',
    icon: '🍽️',
    color: 'from-orange-400 to-red-600',
    characteristics: ['nourishing', 'energizing', 'satisfying', 'delicious'],
    bestFor: ['morning', 'lunch', 'dinner', 'snack-time'],
    terminalFocus: ['T1', 'T2', 'T3', 'T4']
  },
  work: {
    id: 'work',
    name: 'Work',
    description: 'Productive spaces for business travelers',
    icon: '💼',
    color: 'from-purple-400 to-pink-600',
    characteristics: ['productive', 'quiet', 'well-equipped', 'professional'],
    bestFor: ['morning', 'afternoon', 'business-travel', 'meetings'],
    terminalFocus: ['T1', 'T2', 'T3']
  },
  quick: {
    id: 'quick',
    name: 'Quick',
    description: 'Fast and efficient services',
    icon: '⚡',
    color: 'from-yellow-400 to-orange-600',
    characteristics: ['fast', 'efficient', 'convenient', 'time-saving'],
    bestFor: ['short-layover', 'gate-change', 'rush', 'essentials'],
    terminalFocus: ['T1', 'T2', 'T3', 'T4']
  },
  exclusive: {
    id: 'exclusive',
    name: 'Exclusive',
    description: 'Unique and premium experiences',
    icon: '✨',
    color: 'from-pink-400 to-rose-600',
    characteristics: ['unique', 'premium', 'exclusive', 'memorable'],
    bestFor: ['premium', 'experience', 'leisure', 'special-occasions'],
    terminalFocus: ['T1', 'T2', 'T3', 'Jewel']
  }
};

// Collection slugs mapping
export const COLLECTION_SLUGS = {
  // Comfort Collections
  'lounges-affordable': 'comfort',
  'sleep-pods': 'comfort',
  'post-red-eye-recovery': 'comfort',
  
  // Chill Collections
  'hidden-quiet-spots': 'chill',
  'gardens-at-dawn': 'chill',
  'peaceful-corners': 'chill',
  
  // Refuel Collections
  'local-food-real-prices': 'refuel',
  'coffee-worth-walk': 'refuel',
  'hawker-heaven': 'refuel',
  
  // Work Collections
  'work-spots-real-wifi': 'work',
  'meeting-ready-spaces': 'work',
  'quiet-zones': 'work',
  
  // Quick Collections
  'quick-bites': 'quick',
  'gate-essentials': 'quick',
  '2-minute-stops': 'quick',
  
  // Singapore Exclusives
  'only-at-changi': 'exclusive',
  'singapore-exclusives': 'exclusive',
  'changi-exclusives': 'exclusive'
} as const;

// Collection metadata for display
export interface CollectionMetadata {
  slug: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  vibe_category: keyof typeof COLLECTION_CATEGORIES;
  tags: string[];
  best_time: string[];
  terminal_coverage: string[];
  price_range: string[];
  amenities_count: number;
  featured_count: number;
  avg_priority: number;
}

// Collection performance metrics
export interface CollectionPerformance {
  collection_id: string;
  total_views: number;
  total_clicks: number;
  average_ctr: number;
  average_position_clicked: number;
  last_updated: string;
  user_satisfaction: number;
  recommendation_score: number;
}

// User collection preferences
export interface UserCollectionPreferences {
  user_id: string;
  favorite_categories: string[];
  preferred_terminals: string[];
  price_preferences: string[];
  time_preferences: string[];
  excluded_collections: string[];
  created_at: string;
  updated_at: string;
}

// Collection recommendation context
export interface CollectionRecommendationContext {
  userTerminal?: string;
  timeOfDay?: string;
  layoverDuration?: number;
  pricePreference?: string;
  vibePreferences?: string[];
  previousInteractions?: string[];
  accessibility?: string;
  groupSize?: number;
  purpose?: 'business' | 'leisure' | 'transit';
}

// Collection search and filter options
export interface CollectionSearchOptions {
  query?: string;
  vibe_category?: string;
  terminal?: string;
  price_range?: string;
  amenities_count?: {
    min: number;
    max: number;
  };
  priority_score?: {
    min: number;
    max: number;
  };
  is_featured?: boolean;
  sort_by?: 'relevance' | 'popularity' | 'name' | 'amenities_count' | 'priority_score';
  sort_order?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

// Collection API response types
export interface CollectionsApiResponse {
  collections: Smart7Collection[];
  total: number;
  page: number;
  limit: number;
  has_more: boolean;
  filters_applied: CollectionSearchOptions;
}

export interface CollectionAmenitiesResponse {
  collection: Smart7Collection;
  amenities: AmenityWithScore[];
  total: number;
  featured_count: number;
  avg_priority: number;
  terminals_covered: string[];
}

// Collection analytics and insights
export interface CollectionInsights {
  collection_id: string;
  popularity_trend: 'rising' | 'stable' | 'declining';
  user_satisfaction: number;
  completion_rate: number;
  average_time_spent: number;
  top_amenities: string[];
  user_feedback: {
    positive: number;
    neutral: number;
    negative: number;
  };
  recommendations: string[];
}

// Collection creation and management
export interface CollectionCreateRequest {
  name: string;
  description: string;
  vibe_category: keyof typeof COLLECTION_CATEGORIES;
  icon: string;
  color: string;
  tags: string[];
  terminal_coverage: string[];
  price_range: string[];
  is_smart7_eligible: boolean;
  amenities: number[];
}

export interface CollectionUpdateRequest {
  name?: string;
  description?: string;
  vibe_category?: keyof typeof COLLECTION_CATEGORIES;
  icon?: string;
  color?: string;
  tags?: string[];
  terminal_coverage?: string[];
  price_range?: string[];
  is_smart7_eligible?: boolean;
  amenities?: number[];
}

// Collection validation
export interface CollectionValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

// Export types for use in other modules
export type {
  Smart7Collection,
  AmenityWithScore,
  CollectionCategory,
  CollectionMetadata,
  CollectionPerformance,
  UserCollectionPreferences,
  CollectionRecommendationContext,
  CollectionSearchOptions,
  CollectionsApiResponse,
  CollectionAmenitiesResponse,
  CollectionInsights,
  CollectionCreateRequest,
  CollectionUpdateRequest,
  CollectionValidation
};
