// Collection Definitions with Exact Amenity Lists
// As specified by the user

export const COLLECTIONS_TO_SHOW = [
  'local-eats',
  'hawker-heaven', 
  'coffee-chill',
  'jewel-gardens'
] as const;

// Exact amenity lists for each collection
export const COLLECTION_AMENITIES: Record<string, {
  amenities: string[];
  minCount: number;
}> = {
  "local-eats": {
    amenities: ["bengawan-solo", "ya-kun", "old-chang-kee", 
                "tiger-street-lab", "song-fa", "paradise-dynasty"],
    minCount: 5
  },
  "hawker-heaven": {
    amenities: ["heritage-zone", "taste-singapore", "din-tai-fung", 
                "hawker-center", "food-court", "local-stalls"],
    minCount: 5
  },
  "coffee-chill": {
    amenities: ["koi-the", "twg-tea", "ya-kun", 
                "starbucks", "coffee-bean", "local-cafes"],
    minCount: 5
  },
  "jewel-gardens": {
    amenities: ["rain-vortex", "shiseido-forest", "canopy-park", 
                "social-tree", "foggy-bowls"],
    minCount: 5
  }
};

// Collection counts based on exact amenity lists
export const COLLECTION_COUNTS: Record<string, number> = {
  'local-eats': 6,
  'hawker-heaven': 6,
  'coffee-chill': 6,
  'jewel-gardens': 5
};

export const VIBE_COLLECTION_MAP: Record<string, string[]> = {
  'comfort': ['coffee-chill', 'jewel-gardens'],
  'chill': ['coffee-chill', 'jewel-gardens'],
  'refuel': ['hawker-heaven', 'local-eats'],
  'work': ['coffee-chill'],
  'shop': ['jewel-gardens', 'local-eats'],
  'quick': ['local-eats', 'coffee-chill'],
  'explore': ['jewel-gardens', 'hawker-heaven']
};

// Collection metadata for display
export const COLLECTION_METADATA: Record<string, {
  name: string;
  description: string;
  icon: string;
  gradient: string;
}> = {
  'local-eats': {
    name: 'Local Eats Singapore 🇸🇬',
    description: 'Traditional local dishes and famous brands',
    icon: '🇸🇬',
    gradient: 'from-green-500 to-emerald-600'
  },
  'hawker-heaven': {
    name: 'Hawker Heaven 🥟',
    description: 'Curated local food courts and hawker centers',
    icon: '🥟',
    gradient: 'from-red-500 to-orange-600'
  },
  'coffee-chill': {
    name: 'Coffee & Chill ☕',
    description: 'Relaxing cafes, tea houses, and coffee spots',
    icon: '☕',
    gradient: 'from-amber-600 to-yellow-700'
  },
  'jewel-gardens': {
    name: 'Jewel Gardens 🌺',
    description: 'Beautiful gardens and attractions in Jewel Changi',
    icon: '🌺',
    gradient: 'from-blue-600 to-cyan-700'
  }
};

// Helper functions
export function getCollectionCount(slug: string): number {
  return COLLECTION_COUNTS[slug] || 0;
}

export function getCollectionMetadata(slug: string) {
  return COLLECTION_METADATA[slug] || null;
}

export function getCollectionsForVibe(vibeKey: string): string[] {
  return VIBE_COLLECTION_MAP[vibeKey] || [];
}

export function getTotalAmenityCount(): number {
  return Object.values(COLLECTION_COUNTS).reduce((sum, count) => sum + count, 0);
}

// New helper functions for exact amenity lists
export function getCollectionAmenities(slug: string): string[] {
  return COLLECTION_AMENITIES[slug]?.amenities || [];
}

export function getCollectionMinCount(slug: string): number {
  return COLLECTION_AMENITIES[slug]?.minCount || 0;
}

export function isAmenityInCollection(amenityId: string, collectionSlug: string): boolean {
  const collectionAmenities = getCollectionAmenities(collectionSlug);
  return collectionAmenities.includes(amenityId);
}

export function getCollectionsForAmenity(amenityId: string): string[] {
  return Object.entries(COLLECTION_AMENITIES)
    .filter(([_, collection]) => collection.amenities.includes(amenityId))
    .map(([slug, _]) => slug);
}

export function validateCollectionAmenities(collectionSlug: string, foundAmenities: string[]): {
  isValid: boolean;
  expectedCount: number;
  foundCount: number;
  missingAmenities: string[];
  extraAmenities: string[];
} {
  const expected = getCollectionAmenities(collectionSlug);
  const minCount = getCollectionMinCount(collectionSlug);
  
  const missingAmenities = expected.filter(id => !foundAmenities.includes(id));
  const extraAmenities = foundAmenities.filter(id => !expected.includes(id));
  
  const isValid = foundAmenities.length >= minCount && missingAmenities.length === 0;
  
  return {
    isValid,
    expectedCount: expected.length,
    foundCount: foundAmenities.length,
    missingAmenities,
    extraAmenities
  };
}
