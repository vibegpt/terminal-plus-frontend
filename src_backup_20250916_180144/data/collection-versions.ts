// Smart Collection Versions for A/B Testing and Variety
// src/data/collection-versions.ts

import { SmartCollection } from '../types/amenity.enhanced.types';

// SYDNEY COLLECTIONS - Multiple Versions
export const SYD_COLLECTIONS = {
  // Must-See Highlights - 2 versions
  mustSeeV1: {
    id: 'must-see-v1',
    name: 'Must-See Highlights',
    description: 'Award winners & Instagram famous',
    items: [
      'Qantas First Lounge',
      'Marc Newson Chair Collection', 
      'Australian Wine Bar',
      'Heineken Bar',
      'Heritage Collection Display'
    ]
  },
  mustSeeV2: {
    id: 'must-see-v2',
    name: 'Must-See Highlights',
    description: 'Unique Sydney experiences',
    items: [
      'Australian Wine Bar',
      'Outdoor Observation Deck',
      'Qantas First Lounge',
      'Beach Burrito',
      'Madison Coffee'
    ]
  },

  // Trending Now - 3 versions (rotates based on time)
  trendingMorning: {
    id: 'trending-morning',
    name: 'Trending Now',
    description: 'Hot spots this morning',
    items: [
      'Madison Coffee',
      'Boost Juice',
      'Be Relax Spa Express',
      'Newslink',
      'Heineken Bar'
    ]
  },
  trendingAfternoon: {
    id: 'trending-afternoon',
    name: 'Trending Now',
    description: 'Busy this afternoon',
    items: [
      'Australian Wine Bar',
      'Beach Burrito',
      'Duty Free',
      'Maître Choux',
      'Qantas Business Lounge'
    ]
  },
  trendingEvening: {
    id: 'trending-evening',
    name: 'Trending Now',
    description: 'Popular tonight',
    items: [
      'Heineken Bar',
      'Australian Wine Bar',
      'Beach Burrito',
      'Be Relax Spa Express',
      'Quiet Zone Level 2'
    ]
  },

  // Solo Traveler - 2 versions
  soloBusinessV1: {
    id: 'solo-business',
    name: 'Solo Traveler Favorites',
    description: 'Work-friendly spots',
    items: [
      'Individual Pod Seating Gate 10',
      'Madison Coffee',
      'Quiet Zone Level 2',
      'Qantas Business Lounge',
      'Staff Cafeteria Guest Access'
    ]
  },
  soloLeisureV1: {
    id: 'solo-leisure',
    name: 'Solo Traveler Favorites',
    description: 'Perfect for flying alone',
    items: [
      'Heineken Bar',
      'Individual Pod Seating Gate 10',
      'Be Relax Spa Express',
      'Madison Coffee',
      'Outdoor Observation Deck'
    ]
  }
};

// SINGAPORE COLLECTIONS - Multiple Versions
export const SIN_COLLECTIONS = {
  // Must-See Highlights - 2 versions
  mustSeeV1: {
    id: 'must-see-v1',
    name: 'Must-See Highlights',
    description: 'World-famous attractions',
    items: [
      'Butterfly Garden',
      'The Slide @ T3',
      'Movie Theatre',
      'Jewel Waterfall Viewpoint',
      'Entertainment Deck'
    ]
  },
  mustSeeV2: {
    id: 'must-see-v2',
    name: 'Must-See Highlights',
    description: 'Unique Changi experiences',
    items: [
      'Jewel Waterfall Viewpoint',
      'Butterfly Garden',
      'Fish Spa',
      'The Slide @ T3',
      'Rooftop Cactus Garden'
    ]
  },

  // Family-Friendly - 2 versions
  familyActiveV1: {
    id: 'family-active',
    name: 'Family & Kids Zone',
    description: 'Active family fun',
    items: [
      'The Slide @ T3',
      'Butterfly Garden',
      'Entertainment Deck',
      'Movie Theatre',
      'A&W Root Beer'
    ]
  },
  familyRelaxedV1: {
    id: 'family-relaxed',
    name: 'Family & Kids Zone',
    description: 'Relaxed family time',
    items: [
      'Movie Theatre',
      'Butterfly Garden',
      'A&W Root Beer',
      'Cultural Performances Stage',
      'Rooftop Cactus Garden'
    ]
  },

  // Hidden Gems - 2 versions
  hiddenNatureV1: {
    id: 'hidden-nature',
    name: 'Hidden Gems',
    description: 'Secret gardens & quiet spots',
    items: [
      'Rooftop Cactus Garden',
      'Fish Spa',
      'Snooze Lounge',
      'Cultural Performances Stage'
    ]
  },
  hiddenExperiencesV1: {
    id: 'hidden-experiences',
    name: 'Hidden Gems',
    description: 'Unique experiences locals love',
    items: [
      'Fish Spa',
      'Entertainment Deck',
      'Cultural Performances Stage',
      'Rooftop Cactus Garden',
      'Snooze Lounge'
    ]
  }
};

// LONDON HEATHROW COLLECTIONS - Multiple Versions
export const LHR_COLLECTIONS = {
  // Must-See Highlights - 2 versions
  mustSeeLuxuryV1: {
    id: 'must-see-luxury',
    name: 'Must-See Highlights',
    description: 'Premium experiences',
    items: [
      'Concorde Room',
      'Gordon Ramsay Plane Food',
      'Harrods',
      'Burberry',
      'No.1 Lounge'
    ]
  },
  mustSeeBritishV1: {
    id: 'must-see-british',
    name: 'Must-See Highlights',
    description: 'Best of British',
    items: [
      'Gordon Ramsay Plane Food',
      'Harrods',
      'Ted Baker',
      'BA Heritage Museum',
      'Pret A Manger'
    ]
  },

  // Solo Traveler - 2 versions
  soloQuietV1: {
    id: 'solo-quiet',
    name: 'Solo Traveler Favorites',
    description: 'Peaceful work spots',
    items: [
      'Quiet Lounge B Gates',
      'Multi-faith Prayer Room',
      'Sofitel Dayroom',
      'EAT. Bar Seating',
      'BA Heritage Museum'
    ]
  },
  soloSocialV1: {
    id: 'solo-social',
    name: 'Solo Traveler Favorites',
    description: 'Great bar seating & WiFi',
    items: [
      'Gordon Ramsay Plane Food',
      'EAT. Bar Seating',
      'No.1 Lounge',
      'Pret A Manger',
      'Quiet Lounge B Gates'
    ]
  }
};

// Collection Selection Logic
export const getCollectionVersion = (
  collectionType: string,
  airport: string,
  context: {
    timeOfDay?: 'morning' | 'afternoon' | 'evening';
    userType?: 'business' | 'leisure' | 'family';
    vibeHistory?: string[];
  }
): any => {
  const collections = {
    'SYD': SYD_COLLECTIONS,
    'SIN': SIN_COLLECTIONS,
    'LHR': LHR_COLLECTIONS
  }[airport];

  if (!collections) return null;

  // Smart selection based on context
  if (collectionType === 'trending') {
    // Return time-appropriate trending
    const timeMap = {
      'morning': collections.trendingMorning,
      'afternoon': collections.trendingAfternoon,
      'evening': collections.trendingEvening
    };
    return timeMap[context.timeOfDay || 'afternoon'];
  }

  if (collectionType === 'solo' && context.userType) {
    // Return user-type appropriate solo collection
    if (context.userType === 'business') {
      return collections.soloBusinessV1 || collections.soloQuietV1;
    }
    return collections.soloLeisureV1 || collections.soloSocialV1;
  }

  // Default to V1 for other collections
  return collections[`${collectionType}V1`];
};

// Performance tracking for A/B testing
export interface CollectionPerformance {
  collectionId: string;
  impressions: number;
  clicks: number;
  saves: number;
  avgDwellTime: number;
  userSatisfaction: number;
}

// Track which version performs better
export const trackCollectionPerformance = (
  collectionId: string,
  metric: 'impression' | 'click' | 'save',
  additionalData?: any
) => {
  // This would connect to your analytics service
  console.log(`Collection ${collectionId}: ${metric}`, additionalData);
  
  // Store in localStorage for now
  const key = `collection_performance_${collectionId}`;
  const existing = localStorage.getItem(key);
  const data = existing ? JSON.parse(existing) : {
    impressions: 0,
    clicks: 0,
    saves: 0
  };
  
  data[`${metric}s`] = (data[`${metric}s`] || 0) + 1;
  localStorage.setItem(key, JSON.stringify(data));
};
