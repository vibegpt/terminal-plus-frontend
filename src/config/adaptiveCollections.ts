// Adaptive Collections Configuration - COMPLETE
// 4+2 System: 4 contextual core + 2 dynamic collections

import { getHours } from 'date-fns';

export interface Collection {
  slug: string;
  name: string;
  subtitle: string;
  emoji: string;
  gradient: string;
  amenityCount: number;
  tags?: string[];
  timeRelevance?: string[];
  priority?: number;
}

export interface VibeCollections {
  core: Collection[];      // All 5 core collections
  dynamic: Collection[];   // All dynamic collections
}

// Time slots for contextual display
export type TimeSlot = 'earlyMorning' | 'morning' | 'afternoon' | 'evening' | 'lateNight';

export const getTimeSlot = (): TimeSlot => {
  const hour = getHours(new Date());
  
  if (hour >= 5 && hour < 8) return 'earlyMorning';
  if (hour >= 8 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 22) return 'evening';
  return 'lateNight';
};

// Core swap rules based on time
export const CORE_SWAP_RULES: Record<TimeSlot, {
  hide: string[];
  prioritize: string[];
}> = {
  earlyMorning: {
    hide: ['fine-dining', 'bars-lounges', 'shopping', 'entertainment'],
    prioritize: ['quick-bites', 'coffee', 'breakfast', 'grab-go']
  },
  morning: {
    hide: ['fine-dining', 'bars-lounges', 'late-night'],
    prioritize: ['quick-bites', 'coffee', 'local-eats', 'breakfast']
  },
  afternoon: {
    hide: ['breakfast', 'early-morning'],
    prioritize: ['local-eats', 'shopping', 'quick-bites', 'lounges']
  },
  evening: {
    hide: ['breakfast', 'morning-coffee'],
    prioritize: ['fine-dining', 'local-eats', 'bars', 'dinner']
  },
  lateNight: {
    hide: ['breakfast', 'shopping', 'coffee', 'business'],
    prioritize: ['24-7-options', 'late-night', 'quick-bites', 'comfort']
  }
};

// ALL VIBE COLLECTIONS
const VIBES_DATA: Record<string, VibeCollections> = {
  // REFUEL (Food & Drinks)
  refuel: {
    core: [
      {
        slug: 'quick-bites',
        name: 'Quick Bites',
        subtitle: 'Fast & convenient meals',
        emoji: '🥪',
        gradient: 'from-yellow-400 to-orange-500',
        amenityCount: 12,
        priority: 1
      },
      {
        slug: 'local-eats',
        name: 'Local Eats',
        subtitle: 'Authentic Singapore cuisine',
        emoji: '🍜',
        gradient: 'from-red-400 to-pink-600',
        amenityCount: 12,
        priority: 2
      },
      {
        slug: 'coffee-chill',
        name: 'Coffee & Chill',
        subtitle: 'Cafes and relaxing spots',
        emoji: '☕',
        gradient: 'from-amber-500 to-brown-600',
        amenityCount: 12,
        priority: 3
      },
      {
        slug: 'fine-dining',
        name: 'Fine Dining',
        subtitle: 'Premium restaurant experiences',
        emoji: '🍽️',
        gradient: 'from-purple-500 to-indigo-600',
        amenityCount: 10,
        priority: 4
      },
      {
        slug: 'food-courts',
        name: 'Food Courts',
        subtitle: 'Hawker-style variety',
        emoji: '🍴',
        gradient: 'from-green-400 to-teal-600',
        amenityCount: 10,
        priority: 5
      }
    ],
    dynamic: [
      {
        slug: 'breakfast-champions',
        name: 'Breakfast Champions',
        subtitle: 'Start your day right',
        emoji: '🌅',
        gradient: 'from-yellow-300 to-orange-400',
        amenityCount: 8,
        timeRelevance: ['earlyMorning', 'morning']
      },
      {
        slug: 'healthy-start',
        name: 'Healthy Start',
        subtitle: 'Nutritious morning options',
        emoji: '🥗',
        gradient: 'from-green-400 to-lime-500',
        amenityCount: 8,
        timeRelevance: ['earlyMorning', 'morning']
      },
      {
        slug: 'happy-hour',
        name: 'Happy Hour',
        subtitle: 'Evening deals & drinks',
        emoji: '🍻',
        gradient: 'from-purple-400 to-pink-500',
        amenityCount: 8,
        timeRelevance: ['afternoon', 'evening']
      },
      {
        slug: 'late-night-eats',
        name: 'Late Night Eats',
        subtitle: '24/7 and late options',
        emoji: '🌙',
        gradient: 'from-blue-900 to-purple-900',
        amenityCount: 8,
        timeRelevance: ['evening', 'lateNight']
      },
      {
        slug: 'comfort-food',
        name: 'Comfort Food',
        subtitle: 'Familiar favorites',
        emoji: '🍲',
        gradient: 'from-orange-400 to-amber-600',
        amenityCount: 8,
        timeRelevance: ['afternoon', 'evening', 'lateNight']
      }
    ]
  },

  // DISCOVER (Unique Experiences)
  discover: {
    core: [
      {
        slug: 'hidden-gems',
        name: 'Hidden Gems',
        subtitle: 'Secret spots to explore',
        emoji: '💎',
        gradient: 'from-purple-400 to-pink-600',
        amenityCount: 10,
        priority: 1
      },
      {
        slug: 'instagram-spots',
        name: 'Instagram Spots',
        subtitle: 'Picture-perfect locations',
        emoji: '📸',
        gradient: 'from-pink-400 to-rose-600',
        amenityCount: 12,
        priority: 2
      },
      {
        slug: 'only-at-changi',
        name: 'Only at Changi',
        subtitle: 'Unique experiences',
        emoji: '✨',
        gradient: 'from-amber-400 to-orange-600',
        amenityCount: 10,
        priority: 3
      },
      {
        slug: 'art-culture',
        name: 'Art & Culture',
        subtitle: 'Creative expressions',
        emoji: '🎨',
        gradient: 'from-purple-400 to-indigo-600',
        amenityCount: 8,
        priority: 4
      },
      {
        slug: 'jewel-wonders',
        name: 'Jewel Wonders',
        subtitle: 'Architectural marvels',
        emoji: '💠',
        gradient: 'from-blue-400 to-cyan-600',
        amenityCount: 10,
        priority: 5
      }
    ],
    dynamic: [
      {
        slug: 'morning-photography',
        name: 'Morning Light Spots',
        subtitle: 'Best sunrise photo ops',
        emoji: '🌅',
        gradient: 'from-yellow-300 to-pink-400',
        amenityCount: 6,
        timeRelevance: ['earlyMorning', 'morning']
      },
      {
        slug: 'quiet-discoveries',
        name: 'Quiet Discoveries',
        subtitle: 'Peaceful hidden corners',
        emoji: '🤫',
        gradient: 'from-blue-400 to-purple-500',
        amenityCount: 8,
        timeRelevance: ['earlyMorning', 'lateNight']
      },
      {
        slug: 'sunset-views',
        name: 'Sunset Views',
        subtitle: 'Golden hour spots',
        emoji: '🌇',
        gradient: 'from-orange-400 to-pink-600',
        amenityCount: 6,
        timeRelevance: ['afternoon', 'evening']
      },
      {
        slug: 'night-wonders',
        name: 'Night Wonders',
        subtitle: 'After-dark attractions',
        emoji: '🌃',
        gradient: 'from-indigo-600 to-purple-800',
        amenityCount: 8,
        timeRelevance: ['evening', 'lateNight']
      }
    ]
  },

  // CHILL (Relax & Unwind)
  chill: {
    core: [
      {
        slug: 'quiet-zones',
        name: 'Quiet Zones',
        subtitle: 'Peaceful spaces',
        emoji: '🤫',
        gradient: 'from-blue-400 to-indigo-500',
        amenityCount: 10,
        priority: 1
      },
      {
        slug: 'garden-spaces',
        name: 'Garden Spaces',
        subtitle: 'Natural environments',
        emoji: '🌿',
        gradient: 'from-green-400 to-emerald-600',
        amenityCount: 10,
        priority: 2
      },
      {
        slug: 'lounges',
        name: 'Lounges',
        subtitle: 'Comfortable seating areas',
        emoji: '🛋️',
        gradient: 'from-purple-400 to-pink-500',
        amenityCount: 12,
        priority: 3
      },
      {
        slug: 'reading-spots',
        name: 'Reading Spots',
        subtitle: 'Books & quiet corners',
        emoji: '📚',
        gradient: 'from-amber-400 to-orange-500',
        amenityCount: 8,
        priority: 4
      },
      {
        slug: 'viewing-decks',
        name: 'Viewing Decks',
        subtitle: 'Watch planes & relax',
        emoji: '✈️',
        gradient: 'from-blue-400 to-cyan-500',
        amenityCount: 8,
        priority: 5
      }
    ],
    dynamic: [
      {
        slug: 'morning-calm',
        name: 'Morning Calm',
        subtitle: 'Peaceful start spots',
        emoji: '🌄',
        gradient: 'from-purple-300 to-blue-400',
        amenityCount: 6,
        timeRelevance: ['earlyMorning', 'morning']
      },
      {
        slug: 'meditation-spaces',
        name: 'Meditation Spaces',
        subtitle: 'Mindfulness zones',
        emoji: '🧘',
        gradient: 'from-indigo-400 to-purple-500',
        amenityCount: 6,
        timeRelevance: ['morning', 'afternoon', 'evening']
      },
      {
        slug: 'sunset-chill',
        name: 'Sunset Chill',
        subtitle: 'Evening wind-down',
        emoji: '🌅',
        gradient: 'from-orange-400 to-purple-600',
        amenityCount: 8,
        timeRelevance: ['evening']
      },
      {
        slug: 'night-serenity',
        name: 'Night Serenity',
        subtitle: 'Late night calm',
        emoji: '🌙',
        gradient: 'from-blue-800 to-indigo-900',
        amenityCount: 6,
        timeRelevance: ['lateNight']
      }
    ]
  },

  // SHOP (Retail Therapy)
  shop: {
    core: [
      {
        slug: 'duty-free',
        name: 'Duty Free',
        subtitle: 'Tax-free shopping',
        emoji: '🛒',
        gradient: 'from-green-400 to-emerald-600',
        amenityCount: 12,
        priority: 1
      },
      {
        slug: 'luxury-brands',
        name: 'Luxury Brands',
        subtitle: 'Premium boutiques',
        emoji: '💎',
        gradient: 'from-purple-500 to-pink-600',
        amenityCount: 10,
        priority: 2
      },
      {
        slug: 'souvenirs',
        name: 'Souvenirs',
        subtitle: 'Singapore memories',
        emoji: '🎁',
        gradient: 'from-red-400 to-orange-600',
        amenityCount: 10,
        priority: 3
      },
      {
        slug: 'tech-gadgets',
        name: 'Tech & Gadgets',
        subtitle: 'Electronics & innovation',
        emoji: '📱',
        gradient: 'from-blue-400 to-indigo-600',
        amenityCount: 8,
        priority: 4
      },
      {
        slug: 'fashion',
        name: 'Fashion',
        subtitle: 'Trending styles',
        emoji: '👗',
        gradient: 'from-pink-400 to-purple-500',
        amenityCount: 10,
        priority: 5
      }
    ],
    dynamic: [
      {
        slug: 'morning-deals',
        name: 'Morning Deals',
        subtitle: 'Early bird specials',
        emoji: '🌅',
        gradient: 'from-yellow-400 to-orange-500',
        amenityCount: 6,
        timeRelevance: ['earlyMorning', 'morning']
      },
      {
        slug: 'last-minute-gifts',
        name: 'Last Minute Gifts',
        subtitle: 'Quick gift ideas',
        emoji: '🎁',
        gradient: 'from-red-400 to-pink-500',
        amenityCount: 8,
        timeRelevance: ['morning', 'afternoon', 'evening']
      },
      {
        slug: 'evening-boutiques',
        name: 'Evening Boutiques',
        subtitle: 'Extended hours shops',
        emoji: '🛍️',
        gradient: 'from-purple-400 to-indigo-600',
        amenityCount: 6,
        timeRelevance: ['evening', 'lateNight']
      }
    ]
  },

  // COMFORT (Premium Rest & Wellness)
  comfort: {
    core: [
      {
        slug: 'sleep-pods',
        name: 'Sleep Solutions',
        subtitle: 'Nap & rest areas',
        emoji: '😴',
        gradient: 'from-indigo-500 to-purple-600',
        amenityCount: 8,
        priority: 1
      },
      {
        slug: 'spa-wellness',
        name: 'Spa & Wellness',
        subtitle: 'Massage & treatments',
        emoji: '💆',
        gradient: 'from-pink-400 to-rose-600',
        amenityCount: 10,
        priority: 2
      },
      {
        slug: 'premium-lounges',
        name: 'Premium Lounges',
        subtitle: 'Business & first class',
        emoji: '🥂',
        gradient: 'from-amber-500 to-yellow-600',
        amenityCount: 10,
        priority: 3
      },
      {
        slug: 'showers',
        name: 'Shower Suites',
        subtitle: 'Refresh & rejuvenate',
        emoji: '🚿',
        gradient: 'from-blue-400 to-cyan-500',
        amenityCount: 6,
        priority: 4
      },
      {
        slug: 'day-hotels',
        name: 'Day Hotels',
        subtitle: 'Hourly room rentals',
        emoji: '🏨',
        gradient: 'from-purple-400 to-indigo-600',
        amenityCount: 8,
        priority: 5
      }
    ],
    dynamic: [
      {
        slug: 'morning-refresh',
        name: 'Morning Refresh',
        subtitle: 'Wake up services',
        emoji: '🌅',
        gradient: 'from-yellow-300 to-orange-400',
        amenityCount: 6,
        timeRelevance: ['earlyMorning', 'morning']
      },
      {
        slug: 'afternoon-recharge',
        name: 'Afternoon Recharge',
        subtitle: 'Midday rest spots',
        emoji: '☀️',
        gradient: 'from-orange-400 to-yellow-500',
        amenityCount: 8,
        timeRelevance: ['afternoon']
      },
      {
        slug: 'overnight-comfort',
        name: 'Overnight Comfort',
        subtitle: 'Red-eye solutions',
        emoji: '🌙',
        gradient: 'from-blue-800 to-purple-900',
        amenityCount: 8,
        timeRelevance: ['lateNight']
      }
    ]
  },

  // WORK (Productivity)
  work: {
    core: [
      {
        slug: 'business-centers',
        name: 'Business Centers',
        subtitle: 'Work stations & offices',
        emoji: '💼',
        gradient: 'from-gray-600 to-gray-800',
        amenityCount: 8,
        priority: 1
      },
      {
        slug: 'meeting-rooms',
        name: 'Meeting Rooms',
        subtitle: 'Private spaces',
        emoji: '🤝',
        gradient: 'from-blue-500 to-indigo-600',
        amenityCount: 6,
        priority: 2
      },
      {
        slug: 'wifi-zones',
        name: 'WiFi Zones',
        subtitle: 'High-speed internet',
        emoji: '📡',
        gradient: 'from-cyan-400 to-blue-600',
        amenityCount: 10,
        priority: 3
      },
      {
        slug: 'charging-stations',
        name: 'Charging Stations',
        subtitle: 'Power up devices',
        emoji: '🔌',
        gradient: 'from-yellow-400 to-orange-500',
        amenityCount: 12,
        priority: 4
      },
      {
        slug: 'quiet-workspaces',
        name: 'Quiet Workspaces',
        subtitle: 'Focus zones',
        emoji: '🤐',
        gradient: 'from-purple-500 to-indigo-600',
        amenityCount: 8,
        priority: 5
      }
    ],
    dynamic: [
      {
        slug: 'morning-productivity',
        name: 'Morning Productivity',
        subtitle: 'Early work spots',
        emoji: '🌅',
        gradient: 'from-blue-300 to-indigo-400',
        amenityCount: 6,
        timeRelevance: ['earlyMorning', 'morning']
      },
      {
        slug: 'conference-ready',
        name: 'Conference Ready',
        subtitle: 'Video call spaces',
        emoji: '📹',
        gradient: 'from-green-400 to-blue-500',
        amenityCount: 6,
        timeRelevance: ['morning', 'afternoon']
      },
      {
        slug: 'evening-workspace',
        name: 'Evening Workspace',
        subtitle: 'Late work sessions',
        emoji: '🌃',
        gradient: 'from-purple-600 to-indigo-800',
        amenityCount: 6,
        timeRelevance: ['evening', 'lateNight']
      }
    ]
  },

  // QUICK (Time-Pressed)
  quick: {
    core: [
      {
        slug: 'grab-go',
        name: 'Grab & Go',
        subtitle: 'Quick food options',
        emoji: '🏃',
        gradient: 'from-red-400 to-orange-500',
        amenityCount: 10,
        priority: 1
      },
      {
        slug: 'express-services',
        name: 'Express Services',
        subtitle: 'Fast-track everything',
        emoji: '⚡',
        gradient: 'from-yellow-400 to-amber-500',
        amenityCount: 8,
        priority: 2
      },
      {
        slug: 'gate-essentials',
        name: 'Gate Essentials',
        subtitle: 'Right by your gate',
        emoji: '🚪',
        gradient: 'from-blue-400 to-cyan-500',
        amenityCount: 10,
        priority: 3
      },
      {
        slug: 'quick-charge',
        name: 'Quick Charge',
        subtitle: 'Rapid charging',
        emoji: '🔋',
        gradient: 'from-green-400 to-emerald-500',
        amenityCount: 8,
        priority: 4
      },
      {
        slug: '5-min-stops',
        name: '5-Min Stops',
        subtitle: 'Ultra-quick services',
        emoji: '⏱️',
        gradient: 'from-purple-400 to-pink-500',
        amenityCount: 8,
        priority: 5
      }
    ],
    dynamic: [
      {
        slug: 'morning-rush',
        name: 'Morning Rush',
        subtitle: 'Beat the crowds',
        emoji: '🌅',
        gradient: 'from-orange-300 to-red-400',
        amenityCount: 6,
        timeRelevance: ['earlyMorning', 'morning']
      },
      {
        slug: 'boarding-soon',
        name: 'Boarding Soon',
        subtitle: 'Last-minute needs',
        emoji: '🚨',
        gradient: 'from-red-500 to-pink-600',
        amenityCount: 6,
        timeRelevance: ['morning', 'afternoon', 'evening']
      },
      {
        slug: 'red-eye-essentials',
        name: 'Red-Eye Essentials',
        subtitle: 'Late flight needs',
        emoji: '🌙',
        gradient: 'from-indigo-600 to-purple-800',
        amenityCount: 6,
        timeRelevance: ['lateNight']
      }
    ]
  }
};

// Get adaptive collections for a vibe based on time and context
export function getAdaptiveCollections(
  vibeSlug: string,
  userContext?: {
    timeSlot?: TimeSlot;
    flightTime?: number; // minutes until flight
    previousVisits?: string[];
  }
): Collection[] {
  const timeSlot = userContext?.timeSlot || getTimeSlot();
  
  // Get collections for the vibe
  const collections = VIBES_DATA[vibeSlug];
  if (!collections) return [];
  
  // Get swap rules for current time
  const swapRules = CORE_SWAP_RULES[timeSlot];
  
  // Filter core collections based on swap rules
  const visibleCore = collections.core
    .filter(c => !swapRules.hide.some(hidden => c.slug.includes(hidden)))
    .sort((a, b) => {
      // Prioritize based on rules
      const aPriority = swapRules.prioritize.some(p => a.slug.includes(p)) ? 0 : 1;
      const bPriority = swapRules.prioritize.some(p => b.slug.includes(p)) ? 0 : 1;
      return aPriority - bPriority || a.priority - b.priority;
    })
    .slice(0, 4); // Take top 4 core collections
  
  // Select dynamic collections based on time relevance
  const relevantDynamic = collections.dynamic
    .filter(c => c.timeRelevance?.includes(timeSlot))
    .sort((a, b) => {
      // Add randomization for A/B testing
      return Math.random() - 0.5;
    })
    .slice(0, 2); // Take 2 dynamic collections
  
  // Return 4 core + 2 dynamic = 6 total
  return [...visibleCore, ...relevantDynamic];
}

// Get all vibes with their adaptive collections
export function getAllAdaptiveVibes() {
  return [
    {
      slug: 'discover',
      name: 'Discover',
      subtitle: 'Unique experiences',
      emoji: '🔍',
      gradient: 'from-purple-500 to-pink-500',
      getCollections: (context?: any) => getAdaptiveCollections('discover', context)
    },
    {
      slug: 'chill',
      name: 'Chill',
      subtitle: 'Relax & unwind',
      emoji: '😌',
      gradient: 'from-blue-400 to-cyan-400',
      getCollections: (context?: any) => getAdaptiveCollections('chill', context)
    },
    {
      slug: 'comfort',
      name: 'Comfort',
      subtitle: 'Rest & wellness',
      emoji: '🛏️',
      gradient: 'from-indigo-500 to-purple-500',
      getCollections: (context?: any) => getAdaptiveCollections('comfort', context)
    },
    {
      slug: 'shop',
      name: 'Shop',
      subtitle: 'Retail therapy',
      emoji: '🛍️',
      gradient: 'from-blue-500 to-cyan-500',
      getCollections: (context?: any) => getAdaptiveCollections('shop', context)
    },
    {
      slug: 'refuel',
      name: 'Refuel',
      subtitle: 'Food & drinks',
      emoji: '🍜',
      gradient: 'from-orange-500 to-red-500',
      getCollections: (context?: any) => getAdaptiveCollections('refuel', context)
    },
    {
      slug: 'work',
      name: 'Work',
      subtitle: 'Stay productive',
      emoji: '💼',
      gradient: 'from-gray-600 to-gray-800',
      getCollections: (context?: any) => getAdaptiveCollections('work', context)
    },
    {
      slug: 'quick',
      name: 'Quick',
      subtitle: 'Time-pressed',
      emoji: '⚡',
      gradient: 'from-yellow-400 to-amber-400',
      getCollections: (context?: any) => getAdaptiveCollections('quick', context)
    }
  ];
}

// Track collection performance for optimization
export interface CollectionMetrics {
  slug: string;
  clicks: number;
  conversions: number;
  averageTimeSpent: number;
  lastShown: Date;
}

// A/B testing configuration
export const AB_TEST_CONFIG = {
  enabled: true,
  testGroups: {
    A: ['breakfast-champions', 'healthy-start'],
    B: ['power-breakfast', 'grab-n-run'],
    C: ['healthy-start', 'grab-n-run']
  },
  rotationInterval: 7 * 24 * 60 * 60 * 1000, // 1 week in ms
};