// VibeCollectionsService.ts
// Complete vibe-to-collection mapping with 4+2 adaptive system
// Handles all 31 collections (9 universal + 22 Singapore-specific)

export interface CollectionMapping {
  collection_slug: string;
  collection_name: string;
  vibe: string;
  priority: number;
  isCore?: boolean;
  isDynamic?: boolean;
  time_relevance?: {
    morning: number;
    afternoon: number;
    evening: number;
    lateNight: number;
  };
}

export interface VibeCollectionConfig {
  vibe: string;
  coreCollections: string[];  // Always visible (4)
  dynamicCollections: {       // Time-based swapping (2)
    slug: string;
    timeSlots: TimeSlot[];
  }[];
}

export type TimeSlot = 'earlyMorning' | 'morning' | 'afternoon' | 'evening' | 'lateNight';

// Complete collection mappings for all 31 collections
export const COLLECTION_MAPPINGS: CollectionMapping[] = [
  
  // ==================== COMFORT VIBE ====================
  {
    collection_slug: 'lounge-life',
    collection_name: 'Lounge Life 💎',
    vibe: 'comfort',
    priority: 1,
    isCore: true
  },
  {
    collection_slug: 'sleep-pods',
    collection_name: 'Sleep Pods',
    vibe: 'comfort',
    priority: 2,
    isCore: true
  },
  {
    collection_slug: 'post-red-eye-recovery',
    collection_name: 'Post Red-Eye Recovery',
    vibe: 'comfort',
    priority: 3,
    isCore: true
  },
  {
    collection_slug: 'spa-wellness',
    collection_name: 'Spa & Wellness',
    vibe: 'comfort',
    priority: 4,
    isCore: true
  },
  {
    collection_slug: 'morning-recovery',
    collection_name: 'Morning Recovery ☕',
    vibe: 'comfort',
    priority: 5,
    isDynamic: true,
    time_relevance: { morning: 10, afternoon: 3, evening: 2, lateNight: 5 }
  },
  {
    collection_slug: 'evening-relaxation',
    collection_name: 'Evening Wind Down 🌙',
    vibe: 'comfort',
    priority: 6,
    isDynamic: true,
    time_relevance: { morning: 2, afternoon: 5, evening: 10, lateNight: 8 }
  },

  // ==================== CHILL VIBE ====================
  {
    collection_slug: 'hidden-quiet-spots',
    collection_name: 'Hidden Quiet Spots',
    vibe: 'chill',
    priority: 1,
    isCore: true
  },
  {
    collection_slug: 'gardens-at-dawn',
    collection_name: 'Gardens at Dawn',
    vibe: 'chill',
    priority: 2,
    isCore: true,
    time_relevance: { morning: 10, afternoon: 6, evening: 4, lateNight: 2 }
  },
  {
    collection_slug: 'peaceful-corners',
    collection_name: 'Peaceful Corners',
    vibe: 'chill',
    priority: 3,
    isCore: true
  },
  {
    collection_slug: 'garden-paradise',
    collection_name: 'Garden Paradise 🌺',
    vibe: 'chill',
    priority: 4,
    isCore: true
  },

  // ==================== REFUEL VIBE ====================
  {
    collection_slug: 'local-food-real-prices',
    collection_name: 'Local Food Real Prices',
    vibe: 'refuel',
    priority: 1,
    isCore: true
  },
  {
    collection_slug: 'coffee-worth-walk',
    collection_name: 'Coffee Worth the Walk',
    vibe: 'refuel',
    priority: 2,
    isCore: true
  },
  {
    collection_slug: 'hawker-heaven',
    collection_name: 'Hawker Heaven 🥟',
    vibe: 'refuel',
    priority: 3,
    isCore: true
  },
  {
    collection_slug: 'healthy-choices',
    collection_name: 'Healthy Choices 🥗',
    vibe: 'refuel',
    priority: 4,
    isCore: true
  },
  {
    collection_slug: 'breakfast-champions',
    collection_name: 'Breakfast Champions 🌅',
    vibe: 'refuel',
    priority: 5,
    isDynamic: true,
    time_relevance: { morning: 10, afternoon: 2, evening: 1, lateNight: 3 }
  },
  {
    collection_slug: 'dinner-delights',
    collection_name: 'Dinner Delights 🍽️',
    vibe: 'refuel',
    priority: 6,
    isDynamic: true,
    time_relevance: { morning: 1, afternoon: 5, evening: 10, lateNight: 6 }
  },

  // ==================== WORK VIBE ====================
  {
    collection_slug: 'work-spots-real-wifi',
    collection_name: 'Work Spots with Real WiFi',
    vibe: 'work',
    priority: 1,
    isCore: true
  },
  {
    collection_slug: 'meeting-ready-spaces',
    collection_name: 'Meeting-Ready Spaces',
    vibe: 'work',
    priority: 2,
    isCore: true
  },
  {
    collection_slug: 'stay-connected',
    collection_name: 'Stay Connected 💼',
    vibe: 'work',
    priority: 3,
    isCore: true
  },
  {
    collection_slug: 'quiet-zones',
    collection_name: 'Quiet Zones',
    vibe: 'work',
    priority: 4,
    isCore: true
  },
  {
    collection_slug: 'business-centers',
    collection_name: 'Business Centers 💻',
    vibe: 'work',
    priority: 5,
    isDynamic: true,
    time_relevance: { morning: 9, afternoon: 10, evening: 5, lateNight: 2 }
  },
  {
    collection_slug: 'charging-stations',
    collection_name: 'Power Up ⚡',
    vibe: 'work',
    priority: 6,
    isDynamic: true,
    time_relevance: { morning: 7, afternoon: 8, evening: 9, lateNight: 10 }
  },

  // ==================== SHOP VIBE ====================
  {
    collection_slug: 'duty-free-deals',
    collection_name: 'Duty Free Deals 🛍️',
    vibe: 'shop',
    priority: 1,
    isCore: true
  },
  {
    collection_slug: 'singapore-exclusives',
    collection_name: 'Singapore Exclusives 🇸🇬',
    vibe: 'shop',
    priority: 2,
    isCore: true
  },
  {
    collection_slug: 'last-minute-gifts',
    collection_name: 'Last-Minute Gifts',
    vibe: 'shop',
    priority: 3,
    isCore: true
  },
  {
    collection_slug: 'local-treasures',
    collection_name: 'Local Treasures',
    vibe: 'shop',
    priority: 4,
    isCore: true
  },
  {
    collection_slug: 'singapore-shopping-trail',
    collection_name: 'Singapore Shopping Trail 🛍️',
    vibe: 'shop',
    priority: 5,
    isDynamic: true
  },
  {
    collection_slug: 'artisan-craft-masters',
    collection_name: 'Artisan & Craft Masters 🎨',
    vibe: 'shop',
    priority: 6,
    isDynamic: true
  },

  // ==================== QUICK VIBE ====================
  {
    collection_slug: '24-7-heroes',
    collection_name: '24/7 Heroes 🌙',
    vibe: 'quick',
    priority: 1,
    isCore: true
  },
  {
    collection_slug: 'gate-essentials',
    collection_name: 'Gate Essentials',
    vibe: 'quick',
    priority: 2,
    isCore: true
  },
  {
    collection_slug: '2-minute-stops',
    collection_name: '2-Minute Stops',
    vibe: 'quick',
    priority: 3,
    isCore: true
  },
  {
    collection_slug: 'grab-and-go',
    collection_name: 'Grab and Go',
    vibe: 'quick',
    priority: 4,
    isCore: true
  },
  {
    collection_slug: 'last-minute-essentials',
    collection_name: 'Last Minute Essentials 🏪',
    vibe: 'quick',
    priority: 5,
    isDynamic: true
  },
  {
    collection_slug: 'express-services',
    collection_name: 'Express Services',
    vibe: 'quick',
    priority: 6,
    isDynamic: true
  },

  // ==================== EXPLORE VIBE ====================
  {
    collection_slug: 'only-at-changi',
    collection_name: 'Only at Changi ✨',
    vibe: 'discover',
    priority: 1,
    isCore: true
  },
  {
    collection_slug: 'instagram-worthy-spots',
    collection_name: 'Instagram-Worthy Spots 📸',
    vibe: 'discover',
    priority: 2,
    isCore: true
  },
  {
    collection_slug: 'hidden-gems',
    collection_name: 'Hidden Gems',
    vibe: 'discover',
    priority: 3,
    isCore: true
  },
  {
    collection_slug: 'jewel-experience',
    collection_name: 'Jewel Experience 💎',
    vibe: 'discover',
    priority: 4,
    isCore: true
  },
  {
    collection_slug: 'entertainment-hub',
    collection_name: 'Entertainment Hub 🎮',
    vibe: 'discover',
    priority: 5,
    isDynamic: true,
    time_relevance: { morning: 4, afternoon: 8, evening: 10, lateNight: 6 }
  },
  {
    collection_slug: 'art-installations',
    collection_name: 'Art Installations 🎨',
    vibe: 'discover',
    priority: 6,
    isDynamic: true
  },

  // ==================== SPECIAL/SEASONAL (Optional) ====================
  {
    collection_slug: 'happy-hour',
    collection_name: 'Happy Hour 🍺',
    vibe: 'refuel',
    priority: 7,
    isDynamic: true,
    time_relevance: { morning: 0, afternoon: 6, evening: 10, lateNight: 5 }
  },
  {
    collection_slug: 'support-local-champions',
    collection_name: 'Support Local Champions 🏆',
    vibe: 'shop',
    priority: 7,
    isDynamic: true
  }
];

// Helper function to get current time slot
export const getTimeSlot = (): TimeSlot => {
  const hour = new Date().getHours();
  
  if (hour >= 5 && hour < 8) return 'earlyMorning';
  if (hour >= 8 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 22) return 'evening';
  return 'lateNight';
};

// Get collections for a specific vibe with 4+2 adaptive logic
export const getCollectionsForVibe = (
  vibe: string,
  timeSlot?: TimeSlot
): CollectionMapping[] => {
  const currentTimeSlot = timeSlot || getTimeSlot();
  
  // Get all collections for this vibe
  const vibeCollections = COLLECTION_MAPPINGS.filter(c => c.vibe === vibe);
  
  // Separate core and dynamic
  const coreCollections = vibeCollections.filter(c => c.isCore);
  const dynamicCollections = vibeCollections.filter(c => c.isDynamic);
  
  // Sort dynamic collections by time relevance
  const sortedDynamic = dynamicCollections.sort((a, b) => {
    const aScore = a.time_relevance?.[currentTimeSlot] || 5;
    const bScore = b.time_relevance?.[currentTimeSlot] || 5;
    return bScore - aScore;
  });
  
  // Return 4 core + top 2 dynamic
  return [
    ...coreCollections.slice(0, 4),
    ...sortedDynamic.slice(0, 2)
  ];
};

// Get all vibes in time-based order
export const getVibesInOrder = (timeSlot?: TimeSlot): string[] => {
  const hour = new Date().getHours();
  
  if (hour >= 5 && hour < 11) {
    // Morning: Comfort first for red-eye recovery
    return ['comfort', 'chill', 'refuel', 'quick', 'work', 'discover', 'shop'];
  } else if (hour >= 11 && hour < 14) {
    // Midday: Refuel for lunch
    return ['refuel', 'quick', 'discover', 'shop', 'chill', 'work', 'comfort'];
  } else if (hour >= 14 && hour < 17) {
    // Afternoon: Explore when energy is high
    return ['discover', 'refuel', 'shop', 'chill', 'quick', 'comfort', 'work'];
  } else if (hour >= 17 && hour < 23) {
    // Evening: Dinner and shopping
    return ['refuel', 'shop', 'comfort', 'discover', 'chill', 'quick', 'work'];
  } else {
    // Late Night: Comfort and quick options
    return ['comfort', 'quick', 'chill', 'refuel', 'work', 'discover', 'shop'];
  }
};

// Check if a collection should be visible at current time
export const isCollectionActiveNow = (collectionSlug: string): boolean => {
  const collection = COLLECTION_MAPPINGS.find(c => c.collection_slug === collectionSlug);
  
  if (!collection) return false;
  if (collection.isCore) return true; // Core collections always visible
  
  if (collection.isDynamic && collection.time_relevance) {
    const currentSlot = getTimeSlot();
    const relevance = collection.time_relevance[currentSlot] || 0;
    return relevance >= 5; // Show if relevance score is 5 or higher
  }
  
  return true;
};

// Get featured collections across all vibes
export const getFeaturedCollections = (limit: number = 3): CollectionMapping[] => {
  const currentTimeSlot = getTimeSlot();
  const vibeOrder = getVibesInOrder();
  
  const featured: CollectionMapping[] = [];
  
  // Get top collection from each vibe in order
  for (const vibe of vibeOrder) {
    const vibeCollections = getCollectionsForVibe(vibe, currentTimeSlot);
    if (vibeCollections.length > 0 && featured.length < limit) {
      featured.push(vibeCollections[0]);
    }
  }
  
  return featured.slice(0, limit);
};

// Export for use in components
export default {
  COLLECTION_MAPPINGS,
  getTimeSlot,
  getCollectionsForVibe,
  getVibesInOrder,
  isCollectionActiveNow,
  getFeaturedCollections
};
