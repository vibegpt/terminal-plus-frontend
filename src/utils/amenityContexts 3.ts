// Amenity Contexts - Same amenity, different messaging per collection
// This allows amenities to appear in multiple collections with contextual relevance

export interface AmenityContext {
  collectionSlug: string;
  context: string;
  description: string;
  emphasis: string[];
  callToAction: string;
  icon: string;
  gradient: string;
  terminalSpecific?: {
    terminalCode: string;
    highlight: string;
    localDescription: string;
  };
}

export interface MultiContextAmenity {
  amenityId: string;
  name: string;
  baseDescription: string;
  contexts: AmenityContext[];
}

// Define how the same amenity appears in different collections
export const AMENITY_CONTEXTS: Record<string, MultiContextAmenity> = {
  'butterfly-garden': {
    amenityId: 'butterfly-garden',
    name: 'Butterfly Garden',
    baseDescription: 'A stunning indoor garden featuring thousands of butterflies',
    contexts: [
      {
        collectionSlug: 'explore',
        context: 'Discover tropical species',
        description: 'Explore one of the world\'s largest butterfly habitats with over 1,000 species',
        emphasis: ['biodiversity', 'tropical', 'species diversity'],
        callToAction: 'Discover rare butterflies',
        icon: '🦋',
        gradient: 'from-green-500 to-emerald-600',
        terminalSpecific: {
          terminalCode: 'SIN-T3',
          highlight: '🌟 T3 Highlight: Your terminal\'s butterfly paradise',
          localDescription: 'Right here in Terminal 3 - step into a world of fluttering beauty'
        }
      },
      {
        collectionSlug: 'chill',
        context: 'Peaceful nature escape',
        description: 'Find tranquility in this serene garden surrounded by fluttering butterflies',
        emphasis: ['peaceful', 'tranquil', 'relaxing'],
        callToAction: 'Find your zen',
        icon: '😌',
        gradient: 'from-blue-400 to-cyan-500',
        terminalSpecific: {
          terminalCode: 'SIN-T3',
          highlight: '😌 T3 Serenity: Your peaceful escape awaits',
          localDescription: 'Find your moment of peace right here in Terminal 3'
        }
      },
      {
        collectionSlug: 'changi-exclusives',
        context: 'World\'s largest butterfly habitat',
        description: 'Experience this unique Changi attraction - the largest indoor butterfly garden in the world',
        emphasis: ['world record', 'unique', 'exclusive'],
        callToAction: 'Experience the record-breaker',
        icon: '🏆',
        gradient: 'from-purple-500 to-pink-600',
        terminalSpecific: {
          terminalCode: 'SIN-T3',
          highlight: '🏆 T3 Exclusive: World record holder in your terminal',
          localDescription: 'Experience this world-famous attraction right here in Terminal 3'
        }
      }
    ]
  },
  
  'jewel-waterfall': {
    amenityId: 'jewel-waterfall',
    name: 'Rain Vortex',
    baseDescription: 'The world\'s tallest indoor waterfall',
    contexts: [
      {
        collectionSlug: 'explore',
        context: 'Engineering marvel',
        description: 'Marvel at this 40-meter tall engineering wonder that creates a stunning visual spectacle',
        emphasis: ['engineering', 'technology', 'innovation'],
        callToAction: 'Marvel at engineering',
        icon: '⚡',
        gradient: 'from-blue-600 to-cyan-700'
      },
      {
        collectionSlug: 'changi-exclusives',
        context: 'Jewel\'s centerpiece',
        description: 'The iconic centerpiece of Jewel Changi that draws visitors from around the world',
        emphasis: ['iconic', 'centerpiece', 'must-see'],
        callToAction: 'See the icon',
        icon: '💎',
        gradient: 'from-purple-600 to-pink-700'
      },
      {
        collectionSlug: 'chill',
        context: 'Soothing water sounds',
        description: 'Let the gentle sound of cascading water create a peaceful atmosphere',
        emphasis: ['soothing', 'peaceful', 'atmospheric'],
        callToAction: 'Find peace',
        icon: '🌊',
        gradient: 'from-teal-500 to-blue-600'
      }
    ]
  },
  
  'hawker-food-court': {
    amenityId: 'hawker-food-court',
    name: 'Local Hawker Food Court',
    baseDescription: 'Authentic Singapore street food experience',
    contexts: [
      {
        collectionSlug: 'refuel',
        context: 'Local food at real prices',
        description: 'Enjoy authentic Singapore street food without the tourist markup',
        emphasis: ['authentic', 'local prices', 'street food'],
        callToAction: 'Taste local flavors',
        icon: '🥘',
        gradient: 'from-orange-500 to-red-600'
      },
      {
        collectionSlug: 'local-eats-sin',
        context: 'Traditional Singapore cuisine',
        description: 'Experience the traditional flavors that make Singapore famous worldwide',
        emphasis: ['traditional', 'famous', 'Singapore'],
        callToAction: 'Experience tradition',
        icon: '🇸🇬',
        gradient: 'from-red-500 to-orange-600'
      },
      {
        collectionSlug: 'quick-bites',
        context: 'Fast local food',
        description: 'Quick, delicious local food perfect for travelers on the go',
        emphasis: ['quick', 'convenient', 'on-the-go'],
        callToAction: 'Grab a quick bite',
        icon: '⚡',
        gradient: 'from-yellow-400 to-orange-500'
      }
    ]
  },
  
  'coffee-shop': {
    amenityId: 'coffee-shop',
    name: 'Premium Coffee Shop',
    baseDescription: 'High-quality coffee and beverages',
    contexts: [
      {
        collectionSlug: 'coffee-chill',
        context: 'Artisanal coffee experience',
        description: 'Savor carefully crafted coffee made from premium beans',
        emphasis: ['artisanal', 'premium', 'crafted'],
        callToAction: 'Savor the craft',
        icon: '☕',
        gradient: 'from-amber-600 to-yellow-700'
      },
      {
        collectionSlug: 'chill',
        context: 'Relaxing coffee break',
        description: 'Take a peaceful break with excellent coffee in a comfortable setting',
        emphasis: ['relaxing', 'peaceful', 'comfortable'],
        callToAction: 'Take a break',
        icon: '😌',
        gradient: 'from-blue-400 to-cyan-500'
      },
      {
        collectionSlug: 'quick-bites',
        context: 'Quick caffeine fix',
        description: 'Fast service for travelers who need their coffee fix quickly',
        emphasis: ['fast', 'efficient', 'quick'],
        callToAction: 'Get your fix',
        icon: '⚡',
        gradient: 'from-yellow-400 to-orange-500'
      }
    ]
  },
  
  'lounge-area': {
    amenityId: 'lounge-area',
    name: 'Premium Lounge',
    baseDescription: 'Exclusive lounge with premium amenities',
    contexts: [
      {
        collectionSlug: 'lounge-life',
        context: 'Luxury airport experience',
        description: 'Experience airport luxury with premium services and exclusive amenities',
        emphasis: ['luxury', 'premium', 'exclusive'],
        callToAction: 'Experience luxury',
        icon: '💎',
        gradient: 'from-purple-600 to-pink-600'
      },
      {
        collectionSlug: 'comfort',
        context: 'Comfortable rest area',
        description: 'Find comfort and relaxation in this well-appointed lounge space',
        emphasis: ['comfortable', 'relaxing', 'well-appointed'],
        callToAction: 'Find comfort',
        icon: '🛋️',
        gradient: 'from-pink-500 to-rose-500'
      },
      {
        collectionSlug: 'work',
        context: 'Professional work space',
        description: 'Quiet, professional environment perfect for business travelers',
        emphasis: ['professional', 'quiet', 'business'],
        callToAction: 'Get work done',
        icon: '💼',
        gradient: 'from-amber-600 to-yellow-600'
      }
    ]
  },
  
  // Terminal-specific collections
  'jewel-explore': {
    amenityId: 'jewel-explore',
    name: 'Jewel Explore Collection',
    baseDescription: 'Must-see attractions in Jewel Changi',
    contexts: [
      {
        collectionSlug: 'explore',
        context: '7 must-see attractions',
        description: 'Discover the iconic attractions that make Jewel Changi world-famous',
        emphasis: ['iconic', 'world-famous', 'must-see'],
        callToAction: 'Explore Jewel',
        icon: '💎',
        gradient: 'from-blue-600 to-cyan-700',
        terminalSpecific: {
          terminalCode: 'SIN-T1',
          highlight: '🚶‍♂️ T1 Access: Direct walkway to Jewel',
          localDescription: 'From Terminal 1, take the direct walkway to Jewel Changi'
        }
      }
    ]
  },
  
  'garden-city-gems': {
    amenityId: 'garden-city-gems',
    name: 'Garden City Gems',
    baseDescription: 'Multiple gardens across terminals',
    contexts: [
      {
        collectionSlug: 'explore',
        context: 'Multiple gardens across terminals',
        description: 'Experience Singapore\'s garden city concept across all terminals',
        emphasis: ['gardens', 'nature', 'across terminals'],
        callToAction: 'Discover gardens',
        icon: '🌺',
        gradient: 'from-green-500 to-emerald-600',
        terminalSpecific: {
          terminalCode: 'SIN-T3',
          highlight: '🦋 T3 Highlight: Butterfly Garden in your terminal',
          localDescription: 'Your terminal features the famous Butterfly Garden - a must-visit!'
        }
      },
      {
        collectionSlug: 'chill',
        context: 'Nature retreats',
        description: 'Find peace in beautifully designed garden spaces',
        emphasis: ['peaceful', 'nature', 'retreats'],
        callToAction: 'Find peace',
        icon: '😌',
        gradient: 'from-blue-400 to-cyan-500',
        terminalSpecific: {
          terminalCode: 'SIN-T3',
          highlight: '😌 T3 Serenity: Butterfly Garden for relaxation',
          localDescription: 'Your terminal\'s Butterfly Garden offers perfect relaxation'
        }
      }
    ]
  },
  
  'terminal-specific-highlights': {
    amenityId: 'terminal-specific-highlights',
    name: 'Terminal-Specific Highlights',
    baseDescription: 'Unique attractions in your current terminal',
    contexts: [
      {
        collectionSlug: 'explore',
        context: 'Your terminal\'s best',
        description: 'Discover what makes your terminal special and unique',
        emphasis: ['local', 'unique', 'terminal-specific'],
        callToAction: 'Explore your terminal',
        icon: '📍',
        gradient: 'from-purple-500 to-pink-600',
        terminalSpecific: {
          terminalCode: 'SIN-T3',
          highlight: '🌟 T3 Exclusive: Butterfly Garden & More',
          localDescription: 'Terminal 3 features the world-famous Butterfly Garden and other unique attractions'
        }
      }
    ]
  }
};

// Helper functions
export function getAmenityContext(amenityId: string, collectionSlug: string): AmenityContext | null {
  const multiContextAmenity = AMENITY_CONTEXTS[amenityId];
  if (!multiContextAmenity) return null;
  
  return multiContextAmenity.contexts.find(ctx => ctx.collectionSlug === collectionSlug) || null;
}

export function getAmenityContexts(amenityId: string): AmenityContext[] {
  return AMENITY_CONTEXTS[amenityId]?.contexts || [];
}

export function getMultiContextAmenity(amenityId: string): MultiContextAmenity | null {
  return AMENITY_CONTEXTS[amenityId] || null;
}

export function getAllContextAmenities(): MultiContextAmenity[] {
  return Object.values(AMENITY_CONTEXTS);
}

// Get amenities that appear in a specific collection
export function getAmenitiesForCollection(collectionSlug: string): MultiContextAmenity[] {
  return Object.values(AMENITY_CONTEXTS).filter(amenity => 
    amenity.contexts.some(ctx => ctx.collectionSlug === collectionSlug)
  );
}

// Get all collections that feature a specific amenity
export function getCollectionsForAmenity(amenityId: string): string[] {
  const amenity = AMENITY_CONTEXTS[amenityId];
  return amenity ? amenity.contexts.map(ctx => ctx.collectionSlug) : [];
}

// Get terminal-specific context for an amenity
export function getTerminalSpecificContext(amenityId: string, terminalCode: string): AmenityContext | null {
  const amenity = AMENITY_CONTEXTS[amenityId];
  if (!amenity) return null;
  
  // Find context that has terminal-specific information matching the current terminal
  return amenity.contexts.find(ctx => 
    ctx.terminalSpecific?.terminalCode === terminalCode
  ) || null;
}

// Get all amenities that have terminal-specific contexts for a given terminal
export function getTerminalSpecificAmenities(terminalCode: string): MultiContextAmenity[] {
  return Object.values(AMENITY_CONTEXTS).filter(amenity => 
    amenity.contexts.some(ctx => ctx.terminalSpecific?.terminalCode === terminalCode)
  );
}

// Get terminal-specific highlights for a collection
export function getTerminalHighlightsForCollection(collectionSlug: string, terminalCode: string): AmenityContext[] {
  const highlights: AmenityContext[] = [];
  
  Object.values(AMENITY_CONTEXTS).forEach(amenity => {
    amenity.contexts.forEach(context => {
      if (context.collectionSlug === collectionSlug && 
          context.terminalSpecific?.terminalCode === terminalCode) {
        highlights.push(context);
      }
    });
  });
  
  return highlights;
}

// Check if an amenity is highlighted in the current terminal
export function isTerminalHighlight(amenityId: string, terminalCode: string): boolean {
  const amenity = AMENITY_CONTEXTS[amenityId];
  return amenity ? amenity.contexts.some(ctx => 
    ctx.terminalSpecific?.terminalCode === terminalCode
  ) : false;
}
