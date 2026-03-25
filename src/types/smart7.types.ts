// Smart 7 Algorithm Types
export interface UserContext {
  currentTerminal: string;
  layoverMinutes: number;
  currentTime: Date;
  previousChoices?: string[];
  dietaryPreferences?: string[];
  pricePreference?: 'budget' | 'moderate' | 'premium';
  isRushing?: boolean;
}

export interface AmenityScore {
  amenityId: string;
  totalScore: number;
  factors: {
    proximity: number;      // Distance-based score
    temporal: number;       // Time-relevance score
    popularity: number;     // Ratings/visits score
    availability: number;   // Currently open score
    personalization: number; // User preference match
  };
  metadata: {
    walkingTime: number;
    isOpen: boolean;
    matchesPreferences: boolean;
    peakTime: boolean;
  };
}

export interface Smart7Config {
  mode: 'rush' | 'explorer' | 'leisure';
  weights: {
    proximity: number;
    temporal: number;
    popularity: number;
    availability: number;
    personalization: number;
  };
  rotationSeed?: number;
}

export interface CollectionAmenityWithScore {
  id: string;
  collection_id: string;
  amenity_detail_id: string;
  priority: number;
  is_featured: boolean;
  score: AmenityScore;
  hero?: boolean; // Is this the hero pick?
}

// Terminal proximity mappings
export const TERMINAL_DISTANCES: Record<string, Record<string, number>> = {
  'T1': { 'T1': 0, 'T2': 10, 'T3': 12, 'T4': 15, 'JW': 5 },
  'T2': { 'T1': 10, 'T2': 0, 'T3': 8, 'T4': 12, 'JW': 7 },
  'T3': { 'T1': 12, 'T2': 8, 'T3': 0, 'T4': 10, 'JW': 5 },
  'T4': { 'T1': 15, 'T2': 12, 'T3': 10, 'T4': 0, 'JW': 8 },
  'JW': { 'T1': 5, 'T2': 7, 'T3': 5, 'T4': 8, 'JW': 0 },
};

// Time-based mode detection
export const getSmartMode = (layoverMinutes: number): Smart7Config['mode'] => {
  if (layoverMinutes < 30) return 'rush';
  if (layoverMinutes < 90) return 'explorer';
  return 'leisure';
};

// Weight configurations per mode
export const SMART7_WEIGHTS: Record<Smart7Config['mode'], Smart7Config['weights']> = {
  rush: {
    proximity: 50,
    availability: 30,
    temporal: 10,
    popularity: 10,
    personalization: 0,
  },
  explorer: {
    proximity: 30,
    popularity: 25,
    availability: 20,
    temporal: 15,
    personalization: 10,
  },
  leisure: {
    popularity: 30,
    personalization: 25,
    proximity: 20,
    temporal: 15,
    availability: 10,
  },
};
