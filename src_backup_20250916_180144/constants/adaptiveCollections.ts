// Adaptive Collections System - 4+2 Architecture
// Smart collection management with contextual swapping and A/B testing

export interface Collection {
  slug: string;
  name: string;
  subtitle: string;
  emoji: string;
  gradient: string;
  amenities: string[];
  isCore?: boolean;
  timeRelevance?: TimeSlot[];
  travelerRelevance?: TravelerType[];
  minAmenities?: number;
  maxAmenities?: number;
}

export type TimeSlot = 'early-morning' | 'morning' | 'afternoon' | 'evening' | 'late-night';
export type TravelerType = 'business' | 'leisure' | 'family' | 'transit';
export type VibeSlug = 'discover' | 'chill' | 'comfort' | 'shop' | 'refuel' | 'work' | 'quick';

// Time slot definitions
export const TIME_SLOTS = {
  'early-morning': { start: 5, end: 8 },    // 5am-8am
  'morning': { start: 8, end: 12 },         // 8am-12pm
  'afternoon': { start: 12, end: 17 },      // 12pm-5pm
  'evening': { start: 17, end: 22 },        // 5pm-10pm
  'late-night': { start: 22, end: 5 }       // 10pm-5am
};

// Get current time slot
export function getCurrentTimeSlot(): TimeSlot {
  const hour = new Date().getHours();
  
  if (hour >= 5 && hour < 8) return 'early-morning';
  if (hour >= 8 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 22) return 'evening';
  return 'late-night';
}

// Core swap rules - which collections to hide/show based on context
export const CORE_SWAP_RULES: Record<TimeSlot, Record<VibeSlug, {
  hide?: string[];
  prioritize?: string[];
  swapIn?: string[];
}>> = {
  'early-morning': {
    refuel: {
      hide: ['fine-dining', 'bar-bites'],
      prioritize: ['breakfast-champions', 'grab-go-morning'],
      swapIn: ['fresh-start', 'morning-fuel']
    },
    comfort: {
      hide: ['spa-wellness'],
      prioritize: ['shower-refresh', 'quick-rest']
    },
    discover: {
      hide: ['nightlife-spots'],
      prioritize: ['morning-walks', 'sunrise-views']
    },
    chill: {
      hide: ['chill-bars'],
      prioritize: ['morning-coffee', 'quiet-corners']
    },
    shop: {
      hide: ['luxury-boulevard'],
      prioritize: ['travel-essentials', 'quick-gifts']
    },
    work: {
      prioritize: ['quiet-workspaces', 'charging-stations']
    },
    quick: {
      prioritize: ['grab-and-go', 'quick-charge']
    }
  },
  'morning': {
    refuel: {
      hide: ['fine-dining'],
      prioritize: ['coffee-chill', 'breakfast-champions'],
      swapIn: ['brunch-spots']
    },
    comfort: {
      hide: ['sleep-solutions'],
      prioritize: ['spa-wellness', 'premium-lounges']
    },
    discover: {
      prioritize: ['instagram-hotspots', 'jewel-wonders']
    },
    chill: {
      hide: ['chill-bars'],
      prioritize: ['coffee-casual', 'garden-vibes']
    },
    shop: {
      prioritize: ['duty-free-deals', 'singapore-souvenirs']
    },
    work: {
      prioritize: ['business-lounges', 'meeting-rooms']
    },
    quick: {
      prioritize: ['5-minute-stops', 'express-services']
    }
  },
  'afternoon': {
    refuel: {
      hide: ['breakfast-champions'],
      prioritize: ['local-eats', 'quick-bites'],
      swapIn: ['lunch-favorites', 'afternoon-treats']
    },
    comfort: {
      prioritize: ['spa-wellness', 'quiet-sanctuaries']
    },
    discover: {
      prioritize: ['art-culture', 'only-at-changi']
    },
    chill: {
      prioritize: ['garden-vibes', 'social-lounges']
    },
    shop: {
      prioritize: ['fashion-forward', 'tech-gadgets']
    },
    work: {
      prioritize: ['wifi-zones', 'quiet-workspaces']
    },
    quick: {
      prioritize: ['gate-essentials', 'quick-charge']
    }
  },
  'evening': {
    refuel: {
      hide: ['breakfast-champions', 'morning-fuel'],
      prioritize: ['fine-dining', 'local-eats'],
      swapIn: ['dinner-delights', 'happy-hour']
    },
    comfort: {
      prioritize: ['premium-lounges', 'spa-wellness']
    },
    discover: {
      prioritize: ['nightlife-spots', 'evening-entertainment']
    },
    chill: {
      hide: ['quiet-corners'],
      prioritize: ['chill-bars', 'social-lounges']
    },
    shop: {
      prioritize: ['luxury-boulevard', 'duty-free-deals']
    },
    work: {
      hide: ['meeting-rooms'],
      prioritize: ['quiet-workspaces', 'charging-stations']
    },
    quick: {
      prioritize: ['dinner-dash', 'evening-essentials']
    }
  },
  'late-night': {
    refuel: {
      hide: ['fine-dining', 'breakfast-champions'],
      prioritize: ['24-7-eats', 'midnight-snacks'],
      swapIn: ['late-night-comfort']
    },
    comfort: {
      hide: ['spa-wellness'],
      prioritize: ['sleep-solutions', 'quiet-sanctuaries']
    },
    discover: {
      hide: ['instagram-hotspots', 'art-culture'],
      prioritize: ['24-7-attractions', 'quiet-explorations']
    },
    chill: {
      hide: ['garden-vibes'],
      prioritize: ['quiet-corners', '24-7-lounges']
    },
    shop: {
      hide: ['fashion-forward', 'luxury-boulevard'],
      prioritize: ['24-7-convenience', 'travel-essentials']
    },
    work: {
      hide: ['business-lounges'],
      prioritize: ['24-7-workspaces', 'charging-stations']
    },
    quick: {
      prioritize: ['night-essentials', 'emergency-services']
    }
  }
};

// Enhanced REFUEL collections (10 total)
export const REFUEL_COLLECTIONS: Record<string, Collection> = {
  // Core Collections (5)
  'quick-bites': {
    slug: 'quick-bites',
    name: 'Quick Bites',
    subtitle: 'Fast & convenient meals',
    emoji: '🥪',
    gradient: 'from-yellow-400 to-orange-600',
    isCore: true,
    amenities: [
      'subway', 'mcdonalds', 'burger-king', 'kfc',
      'pizza-hut', 'dominos', 'taco-bell', 'wendys',
      'five-guys', 'shake-shack', 'popeyes', 'chipotle'
    ]
  },
  'local-eats': {
    slug: 'local-eats',
    name: 'Local Eats',
    subtitle: 'Authentic Singapore cuisine',
    emoji: '🍜',
    gradient: 'from-red-400 to-pink-600',
    isCore: true,
    amenities: [
      'hainanese-chicken-rice', 'laksa', 'char-kway-teow',
      'bak-kut-teh', 'fish-head-curry', 'roti-prata',
      'nasi-lemak', 'satay', 'hokkien-mee', 'chilli-crab'
    ]
  },
  'coffee-chill': {
    slug: 'coffee-chill',
    name: 'Coffee & Chill',
    subtitle: 'Relaxing beverage spots',
    emoji: '☕',
    gradient: 'from-brown-400 to-amber-600',
    isCore: true,
    amenities: [
      'starbucks', 'coffee-bean', 'costa-coffee', 'peets',
      'local-coffee', 'yakun-kaya', 'toast-box', 'bacha-coffee',
      'huggs-coffee', 'tim-hortons', 'old-town-coffee'
    ]
  },
  'fine-dining': {
    slug: 'fine-dining',
    name: 'Fine Dining',
    subtitle: 'Elegant culinary experiences',
    emoji: '🍽️',
    gradient: 'from-purple-400 to-indigo-600',
    isCore: true,
    amenities: [
      'crystal-jade', 'din-tai-fung', 'paradise-dynasty',
      'imperial-treasure', 'summer-pavilion', 'lei-garden',
      'long-beach-seafood', 'jumbo-seafood', 'no-signboard'
    ]
  },
  'food-courts': {
    slug: 'food-courts',
    name: 'Food Courts',
    subtitle: 'Variety under one roof',
    emoji: '🍴',
    gradient: 'from-green-400 to-teal-600',
    isCore: true,
    amenities: [
      'food-republic', 'kopitiam', 'food-opera', 'koufu',
      'food-junction', 'rasapura-masters', 'food-emporium',
      'hawker-hall', 'food-village', 'asian-flavours'
    ]
  },
  
  // Dynamic Collections (5)
  'breakfast-champions': {
    slug: 'breakfast-champions',
    name: 'Breakfast Champions',
    subtitle: 'Start your day right',
    emoji: '🌅',
    gradient: 'from-orange-300 to-yellow-500',
    isCore: false,
    timeRelevance: ['early-morning', 'morning'],
    amenities: [
      'yakun-breakfast', 'toast-box-set', 'mcdonalds-breakfast',
      'subway-breakfast', 'starbucks-breakfast', 'delifrance-morning',
      'paris-baguette-am', 'coffee-bean-breakfast'
    ],
    maxAmenities: 8
  },
  'grab-go-morning': {
    slug: 'grab-go-morning',
    name: 'Grab & Go Morning',
    subtitle: 'Quick morning fuel',
    emoji: '☀️',
    gradient: 'from-yellow-300 to-orange-400',
    isCore: false,
    timeRelevance: ['early-morning', 'morning'],
    amenities: [
      'sandwich-express', 'fruit-cup', 'yogurt-parfait',
      'breakfast-wrap', 'coffee-pastry', 'juice-bar'
    ],
    maxAmenities: 6
  },
  'lunch-favorites': {
    slug: 'lunch-favorites',
    name: 'Lunch Favorites',
    subtitle: 'Midday meal solutions',
    emoji: '🍱',
    gradient: 'from-green-400 to-blue-500',
    isCore: false,
    timeRelevance: ['afternoon'],
    amenities: [
      'sandwich-bar', 'salad-station', 'poke-bowl', 'sushi-express',
      'noodle-bar', 'rice-bowl', 'wrap-station', 'soup-kitchen'
    ],
    maxAmenities: 8
  },
  'happy-hour': {
    slug: 'happy-hour',
    name: 'Happy Hour Specials',
    subtitle: 'Evening drinks & bites',
    emoji: '🍻',
    gradient: 'from-amber-500 to-orange-600',
    isCore: false,
    timeRelevance: ['evening'],
    amenities: [
      'tiger-tavern', 'harrys-bar', 'brewerkz', 'wine-bar',
      'cocktail-lounge', 'tapas-bar', 'sports-bar-deals'
    ],
    maxAmenities: 7
  },
  '24-7-eats': {
    slug: '24-7-eats',
    name: '24/7 Eats',
    subtitle: 'Always open, always ready',
    emoji: '🌙',
    gradient: 'from-indigo-600 to-purple-700',
    isCore: false,
    timeRelevance: ['late-night', 'early-morning'],
    amenities: [
      'mcdonalds-24h', '7-eleven', 'cheers', 'convenience-deli',
      'vending-zone', '24h-coffee', 'midnight-noodles'
    ],
    maxAmenities: 7
  }
};

// Similar structure for other vibes...
export const DISCOVER_COLLECTIONS: Record<string, Collection> = {
  // Core Collections (5)
  'hidden-gems': {
    slug: 'hidden-gems',
    name: 'Hidden Gems',
    subtitle: 'Secret spots locals love',
    emoji: '💎',
    gradient: 'from-purple-400 to-pink-600',
    isCore: true,
    amenities: [
      'rooftop-cactus-garden', 'heritage-zone', 'prayer-room-garden',
      'staff-canteen', 'viewing-mall', 'transit-hotel-pool',
      'basement-food-court', 'orchid-garden', 'koi-pond'
    ]
  },
  'instagram-hotspots': {
    slug: 'instagram-hotspots',
    name: 'Instagram Hotspots',
    subtitle: 'Picture-perfect moments',
    emoji: '📸',
    gradient: 'from-pink-400 to-rose-600',
    isCore: true,
    amenities: [
      'rain-vortex', 'social-tree', 'butterfly-garden',
      'sunflower-garden', 'kinetic-rain', 'light-installations',
      'mirror-maze', 'canopy-park', 'shiseido-forest'
    ]
  },
  'jewel-wonders': {
    slug: 'jewel-wonders',
    name: 'Jewel Wonders',
    subtitle: 'Architectural marvels',
    emoji: '💎',
    gradient: 'from-blue-400 to-cyan-600',
    isCore: true,
    amenities: [
      'rain-vortex', 'canopy-park', 'shiseido-forest-valley',
      'hedge-maze', 'sky-nets', 'foggy-bowls',
      'discovery-slides', 'canopy-bridge', 'topiary-walk'
    ]
  },
  'art-culture': {
    slug: 'art-culture',
    name: 'Art & Culture',
    subtitle: 'Creative expressions',
    emoji: '🎨',
    gradient: 'from-purple-400 to-indigo-600',
    isCore: true,
    amenities: [
      'kinetic-rain', 'social-tree', 'heritage-zone',
      'peranakan-gallery', 'cultural-performances', 'art-installations',
      'music-stage', 'sculpture-collection', 'local-artists'
    ]
  },
  'only-at-changi': {
    slug: 'only-at-changi',
    name: 'Only at Changi',
    subtitle: 'Unique experiences',
    emoji: '✨',
    gradient: 'from-amber-400 to-orange-600',
    isCore: true,
    amenities: [
      'butterfly-garden', 'movie-theater', 'swimming-pool',
      'slide-t3', 'gaming-lounge', 'enchanted-garden',
      'kinetic-rain', 'social-tree', 'heritage-zone'
    ]
  },
  
  // Dynamic Collections (5)
  'morning-walks': {
    slug: 'morning-walks',
    name: 'Morning Walks',
    subtitle: 'Start with fresh air',
    emoji: '🌅',
    gradient: 'from-blue-300 to-green-400',
    isCore: false,
    timeRelevance: ['early-morning', 'morning'],
    amenities: [
      'outdoor-deck', 'garden-trail', 'sunrise-viewpoint',
      'walking-path', 'zen-garden-morning', 'fresh-air-zone'
    ],
    maxAmenities: 6
  },
  'family-fun': {
    slug: 'family-fun',
    name: 'Family Fun',
    subtitle: 'Kid-friendly adventures',
    emoji: '👨‍👩‍👧‍👦',
    gradient: 'from-yellow-400 to-pink-500',
    isCore: false,
    travelerRelevance: ['family'],
    amenities: [
      'playground', 'butterfly-garden-kids', 'movie-theater-family',
      'gaming-zone', 'slides', 'discovery-zone', 'interactive-art'
    ],
    maxAmenities: 7
  },
  'evening-entertainment': {
    slug: 'evening-entertainment',
    name: 'Evening Entertainment',
    subtitle: 'After-dark attractions',
    emoji: '🌃',
    gradient: 'from-purple-500 to-pink-600',
    isCore: false,
    timeRelevance: ['evening', 'late-night'],
    amenities: [
      'light-show', 'movie-theater-evening', 'music-performances',
      'rooftop-bar-view', 'night-garden', 'illuminated-art'
    ],
    maxAmenities: 6
  },
  'quiet-explorations': {
    slug: 'quiet-explorations',
    name: 'Quiet Explorations',
    subtitle: 'Peaceful discoveries',
    emoji: '🤫',
    gradient: 'from-indigo-400 to-purple-500',
    isCore: false,
    timeRelevance: ['late-night', 'early-morning'],
    amenities: [
      'meditation-garden', 'library', 'quiet-observation-deck',
      'zen-corner', 'reading-nook', 'silent-art-space'
    ],
    maxAmenities: 6
  },
  'tech-wonders': {
    slug: 'tech-wonders',
    name: 'Tech Wonders',
    subtitle: 'Digital experiences',
    emoji: '🤖',
    gradient: 'from-cyan-400 to-blue-600',
    isCore: false,
    travelerRelevance: ['business'],
    amenities: [
      'vr-experience', 'digital-art-wall', 'interactive-displays',
      'holographic-show', 'gaming-lounge-vr', 'tech-museum'
    ],
    maxAmenities: 6
  }
};

// Collection Performance Tracking (for A/B testing)
export interface CollectionMetrics {
  clickThrough: number;
  conversion: number;
  averageTimeSpent: number;
  userSatisfaction: number;
  lastUpdated: Date;
}

export const collectionMetrics: Record<string, CollectionMetrics> = {};

// Smart Collection Selection Algorithm - SINGLE IMPLEMENTATION
export function getAdaptiveCollections(
  vibeSlug: VibeSlug,
  userContext?: {
    timeSlot?: TimeSlot;
    travelerType?: TravelerType;
    previousVisits?: string[];
    flightTimeRemaining?: number;
  }
): Collection[] {
  const timeSlot = userContext?.timeSlot || getCurrentTimeSlot();
  const allCollections = getAllCollectionsForVibe(vibeSlug);
  const swapRules = CORE_SWAP_RULES[timeSlot][vibeSlug];
  
  // Get core collections
  let coreCollections = allCollections
    .filter(c => c.isCore)
    .filter(c => !swapRules?.hide?.includes(c.slug));
  
  // Prioritize certain core collections based on time
  if (swapRules?.prioritize) {
    coreCollections = coreCollections.sort((a, b) => {
      const aPriority = swapRules.prioritize!.indexOf(a.slug);
      const bPriority = swapRules.prioritize!.indexOf(b.slug);
      if (aPriority === -1) return 1;
      if (bPriority === -1) return -1;
      return aPriority - bPriority;
    });
  }
  
  // Take top 4 core collections
  coreCollections = coreCollections.slice(0, 4);
  
  // Get dynamic collections relevant to current context
  let dynamicCollections = allCollections
    .filter(c => !c.isCore)
    .filter(c => {
      // Filter by time relevance
      if (c.timeRelevance && !c.timeRelevance.includes(timeSlot)) {
        return false;
      }
      // Filter by traveler type if specified
      if (userContext?.travelerType && c.travelerRelevance) {
        if (!c.travelerRelevance.includes(userContext.travelerType)) {
          return false;
        }
      }
      return true;
    });
  
  // Sort dynamic collections by performance metrics
  dynamicCollections = dynamicCollections.sort((a, b) => {
    const metricsA = collectionMetrics[a.slug];
    const metricsB = collectionMetrics[b.slug];
    
    if (!metricsA && !metricsB) return 0;
    if (!metricsA) return 1;
    if (!metricsB) return -1;
    
    // Calculate weighted score
    const scoreA = (metricsA.clickThrough * 0.3) + 
                   (metricsA.conversion * 0.4) + 
                   (metricsA.userSatisfaction * 0.3);
    const scoreB = (metricsB.clickThrough * 0.3) + 
                   (metricsB.conversion * 0.4) + 
                   (metricsB.userSatisfaction * 0.3);
    
    return scoreB - scoreA;
  });
  
  // Add collections from swapIn if specified
  if (swapRules?.swapIn) {
    const swapInCollections = dynamicCollections.filter(c => 
      swapRules.swapIn!.includes(c.slug)
    );
    dynamicCollections = [
      ...swapInCollections,
      ...dynamicCollections.filter(c => !swapRules.swapIn!.includes(c.slug))
    ];
  }
  
  // Take top 2 dynamic collections
  dynamicCollections = dynamicCollections.slice(0, 2);
  
  // Return 4 core + 2 dynamic = 6 total
  return [...coreCollections, ...dynamicCollections];
}

// Helper to get all collections for a vibe
function getAllCollectionsForVibe(vibeSlug: VibeSlug): Collection[] {
  switch (vibeSlug) {
    case 'refuel':
      return Object.values(REFUEL_COLLECTIONS);
    case 'discover':
      return Object.values(DISCOVER_COLLECTIONS);
    // Add other vibes...
    default:
      return [];
  }
}

// Track collection interaction - SINGLE IMPLEMENTATION
export function trackCollectionInteraction(
  collectionSlug: string,
  interactionType: 'view' | 'click' | 'conversion',
  value?: number
) {
  if (!collectionMetrics[collectionSlug]) {
    collectionMetrics[collectionSlug] = {
      clickThrough: 0,
      conversion: 0,
      averageTimeSpent: 0,
      userSatisfaction: 0,
      lastUpdated: new Date()
    };
  }
  
  const metrics = collectionMetrics[collectionSlug];
  
  switch (interactionType) {
    case 'click':
      metrics.clickThrough = (metrics.clickThrough + (value || 1)) / 2;
      break;
    case 'conversion':
      metrics.conversion = (metrics.conversion + (value || 1)) / 2;
      break;
  }
  
  metrics.lastUpdated = new Date();
}

// Get collection recommendations based on user history
export function getPersonalizedCollections(
  vibeSlug: VibeSlug,
  userHistory: string[],
  limit: number = 2
): Collection[] {
  const allCollections = getAllCollectionsForVibe(vibeSlug);
  
  // Score collections based on user history
  const scoredCollections = allCollections
    .filter(c => !c.isCore)
    .map(collection => {
      const historyScore = collection.amenities.filter(a => 
        userHistory.includes(a)
      ).length;
      
      return {
        collection,
        score: historyScore
      };
    })
    .sort((a, b) => b.score - a.score);
  
  return scoredCollections
    .slice(0, limit)
    .map(item => item.collection);
}

// Collection vibe mapping for queries
export const COLLECTION_VIBE_MAP: Record<string, { vibes: string[] }> = {
  'quick-bites': { vibes: ['fast-food', 'casual', 'quick'] },
  'local-eats': { vibes: ['local', 'authentic', 'singapore'] },
  'coffee-chill': { vibes: ['coffee', 'cafe', 'relaxed'] },
  'fine-dining': { vibes: ['upscale', 'elegant', 'premium'] },
  'food-courts': { vibes: ['variety', 'hawker', 'local'] },
  'breakfast-champions': { vibes: ['breakfast', 'morning', 'early'] },
  'grab-go-morning': { vibes: ['quick', 'morning', 'takeaway'] },
  'lunch-favorites': { vibes: ['lunch', 'midday', 'afternoon'] },
  'happy-hour': { vibes: ['drinks', 'evening', 'bar'] },
  '24-7-eats': { vibes: ['24-hours', 'late-night', 'always-open'] },
  'hidden-gems': { vibes: ['secret', 'unique', 'special'] },
  'instagram-hotspots': { vibes: ['photogenic', 'instagram', 'scenic'] },
  'jewel-wonders': { vibes: ['jewel', 'architecture', 'spectacular'] },
  'art-culture': { vibes: ['art', 'culture', 'creative'] },
  'only-at-changi': { vibes: ['unique', 'exclusive', 'changi'] },
  'morning-walks': { vibes: ['outdoor', 'morning', 'walking'] },
  'family-fun': { vibes: ['family', 'kids', 'entertainment'] },
  'evening-entertainment': { vibes: ['evening', 'entertainment', 'nightlife'] },
  'quiet-explorations': { vibes: ['quiet', 'peaceful', 'serene'] },
  'tech-wonders': { vibes: ['technology', 'digital', 'innovation'] }
};