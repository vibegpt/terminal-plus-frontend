import type { Smart7Context } from './tracking';

export interface AmenityForSelection {
  id: number;
  name: string;
  description: string;
  terminal_code: string;
  price_level: string | null;
  vibe_tags: string[];
  opening_hours: string | null;
  zone?: string;
  gate_location?: string;
  walking_time_minutes?: number;
  category?: string;
  is_24_hours?: boolean;
  peak_hours?: string[];
  meal_times?: ('breakfast' | 'lunch' | 'dinner' | 'snack')[];
  logo_url?: string;
  website_url?: string;
  rating?: number;
  review_count?: number;
  features?: string[];
  status?: 'quiet' | 'moderate' | 'busy';
  isOpen?: boolean;
}

export interface ScoringWeights {
  timeRelevance: number;      // Default 0.35
  proximity: number;           // Default 0.25
  preference: number;          // Default 0.25
  diversity: number;           // Default 0.15
}

export interface ScoringFactors {
  timeScore: number;           // 0-1 based on current time vs amenity hours
  proximityScore: number;      // 0-1 based on distance from user terminal
  preferenceScore: number;     // 0-1 based on past interactions
  diversityScore: number;      // 0-1 based on variety in selection
  totalScore: number;          // Weighted sum of all scores
}

export interface SelectionResult {
  amenity: AmenityForSelection;
  score: ScoringFactors;
  selectionReason: string;     // Human-readable reason for selection
  rank: number;                // Position in final selection (1-7)
  contextData?: Record<string, any>; // Additional context for tracking
}

export interface Smart7SelectionConfig {
  targetCount: number;         // Usually 7, but configurable
  weights?: Partial<ScoringWeights>;
  includeReasons?: boolean;    // Generate human-readable reasons
  diversityRules?: DiversityRules;
  fallbackStrategy?: 'random' | 'popular' | 'recent';
  enableTracking?: boolean;    // Whether to track selections
}

export interface DiversityRules {
  maxSameTerminal?: number;    // Max amenities from same terminal
  maxSamePriceLevel?: number;  // Max amenities with same price
  maxSameCategory?: number;    // Max amenities from same category
  requiredVibes?: string[];    // Must include amenities with these vibes
  balanceCategories?: boolean; // Try to balance across categories
}

export interface TimeRelevanceConfig {
  breakfastHours: { start: number; end: number }; // e.g., { start: 6, end: 11 }
  lunchHours: { start: number; end: number };     // e.g., { start: 11, end: 14 }
  dinnerHours: { start: number; end: number };    // e.g., { start: 18, end: 22 }
  lateNightHours: { start: number; end: number }; // e.g., { start: 22, end: 6 }
}

export interface ProximityConfig {
  sameTerminalBonus: number;      // Bonus for same terminal (e.g., 1.0)
  adjacentTerminalScore: number;  // Score for adjacent terminal (e.g., 0.7)
  farTerminalScore: number;       // Score for far terminal (e.g., 0.3)
  terminalDistanceMap: Record<string, Record<string, 'same' | 'adjacent' | 'far'>>;
}

export interface PreferenceSignals {
  clickedAmenityIds: number[];
  viewedAmenityIds: number[];
  bookmarkedAmenityIds: number[];
  preferredPriceLevels: string[];
  preferredVibes: string[];
  avoidedAmenityIds?: number[];  // Amenities user didn't interact with
  engagementPattern: 'quick' | 'explorer' | 'focused';
  sessionPreferences?: {
    priceLevel?: string[];
    vibePreferences?: string[];
    clickedAmenities?: number[];
    viewedCollections?: number[];
  };
}

// Terminal relationships for Changi Airport
export const CHANGI_TERMINAL_DISTANCES: ProximityConfig['terminalDistanceMap'] = {
  'T1': { 'T1': 'same', 'T2': 'adjacent', 'T3': 'adjacent', 'T4': 'far', 'Jewel': 'adjacent' },
  'T2': { 'T2': 'same', 'T1': 'adjacent', 'T3': 'adjacent', 'T4': 'far', 'Jewel': 'adjacent' },
  'T3': { 'T3': 'same', 'T1': 'adjacent', 'T2': 'adjacent', 'T4': 'adjacent', 'Jewel': 'adjacent' },
  'T4': { 'T4': 'same', 'T3': 'adjacent', 'T1': 'far', 'T2': 'far', 'Jewel': 'far' },
  'Jewel': { 'Jewel': 'same', 'T1': 'adjacent', 'T2': 'adjacent', 'T3': 'adjacent', 'T4': 'far' }
};

// Default time relevance configuration
export const DEFAULT_TIME_CONFIG: TimeRelevanceConfig = {
  breakfastHours: { start: 6, end: 11 },
  lunchHours: { start: 11, end: 14 },
  dinnerHours: { start: 18, end: 22 },
  lateNightHours: { start: 22, end: 6 }
};

// Default scoring weights
export const DEFAULT_WEIGHTS: ScoringWeights = {
  timeRelevance: 0.35,
  proximity: 0.25,
  preference: 0.25,
  diversity: 0.15
};

// Default proximity configuration
export const DEFAULT_PROXIMITY_CONFIG: ProximityConfig = {
  sameTerminalBonus: 1.0,
  adjacentTerminalScore: 0.7,
  farTerminalScore: 0.3,
  terminalDistanceMap: CHANGI_TERMINAL_DISTANCES
};
