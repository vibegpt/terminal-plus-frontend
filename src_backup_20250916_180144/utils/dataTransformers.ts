// src/utils/dataTransformers.ts
// Utilities to transform existing Terminal+ data into Best Of collections format

import type { Vibe } from '@/types/common.types';

// Interface for existing amenity data (from your current system)
interface ExistingAmenity {
  id: string;
  name: string;
  slug: string;
  category: string;
  description?: string;
  imageUrl?: string;
  logo_url?: string;
  rating?: number;
  walkTime?: string;
  duration?: string;
  terminal?: string;
  terminal_code?: string;
  vibe?: string;
  vibe_tags?: string[];
  highlights?: string[];
  wow_factor?: number;
  openHours?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

// Best Of collection item interface
interface CollectionItem {
  id: string;
  name: string;
  artist: string;
  category: string;
  description: string;
  image: string;
  walkTime: string;
  duration: string;
  highlights: string[];
  vibe_tags: string[];
  rating: number;
  wow_factor: number;
  plays: number;
  isPlaying: boolean;
  ugc_data?: UGCData;
}

// UGC data structure
interface UGCData {
  photos: Array<{
    id: string;
    url: string;
    user: { username: string; avatar: string };
    timestamp: string;
    likes: number;
    vibe_tags: string[];
    caption: string;
  }>;
  recent_visitors: string[];
  total_tagged: number;
  trending_hashtags: string[];
}

// Collection configuration with smart filtering
export const COLLECTION_CONFIGS = [
  {
    id: 'must-see',
    title: 'Must-See Experiences',
    subtitle: 'The iconic spots that make this terminal legendary',
    emoji: '✨',
    color: 'from-purple-500 to-pink-500',
    priority: 1,
    filters: {
      rating_min: 4.5,
      wow_factor_min: 85,
      categories: [],
      vibes: [],
      exclude_categories: ['convenience', 'services']
    }
  },
  {
    id: 'comfort-essentials',
    title: 'Comfort Essentials',
    subtitle: 'Recharge and relax during your layover',
    emoji: '🛋️',
    color: 'from-blue-500 to-cyan-500',
    priority: 2,
    filters: {
      vibes: ['comfort', 'chill', 'relax'],
      categories: ['lounge', 'spa', 'rest'],
      rating_min: 4.0
    }
  },
  {
    id: 'foodie-favorites',
    title: 'Foodie Favorites',
    subtitle: 'Taste local flavors without leaving the terminal',
    emoji: '🍜',
    color: 'from-orange-500 to-red-500',
    priority: 3,
    filters: {
      categories: ['restaurant', 'food', 'cafe', 'coffee', 'dining', 'bar'],
      vibes: ['refuel'],
      rating_min: 4.0
    }
  },
  {
    id: 'work-productivity',
    title: 'Work & Focus Zones',
    subtitle: 'Get productive in quiet, connected spaces',
    emoji: '💼',
    color: 'from-green-500 to-teal-500',
    priority: 4,
    filters: {
      vibes: ['work'],
      categories: ['lounge', 'workspace', 'business'],
      rating_min: 4.0
    }
  },
  {
    id: 'quick-essentials',
    title: 'Quick Essentials',
    subtitle: 'Grab what you need fast - no time wasted',
    emoji: '⚡',
    color: 'from-yellow-500 to-orange-500',
    priority: 5,
    filters: {
      vibes: ['quick'],
      categories: ['convenience', 'pharmacy', 'services'],
      max_walk_time: 5 // minutes
    }
  },
  {
    id: 'shopping-therapy',
    title: 'Shopping Therapy',
    subtitle: 'Browse, shop, and treat yourself to something special',
    emoji: '🛍️',
    color: 'from-pink-500 to-purple-500',
    priority: 6,
    filters: {
      vibes: ['shop'],
      categories: ['shopping', 'retail', 'duty-free', 'boutique'],
      rating_min: 3.8
    }
  }
];

// Transform existing amenity to collection item format
export const transformAmenityToCollectionItem = (
  amenity: ExistingAmenity,
  terminalCode: string
): CollectionItem => {
  return {
    id: amenity.id || amenity.slug,
    name: amenity.name,
    artist: amenity.category || 'Terminal Experience',
    category: amenity.category,
    description: amenity.description || `Experience ${amenity.name} at Terminal ${terminalCode}`,
    image: amenity.imageUrl || amenity.logo_url || generateFallbackImage(amenity.category),
    walkTime: amenity.walkTime || estimateWalkTime(),
    duration: amenity.duration || estimateDuration(amenity.category),
    highlights: amenity.highlights || generateHighlights(amenity),
    vibe_tags: normalizeVibeTags(amenity.vibe_tags || [amenity.vibe || 'explore']),
    rating: amenity.rating || 4.0,
    wow_factor: amenity.wow_factor || calculateWowFactor(amenity),
    plays: generateMockPlays(amenity.rating || 4.0),
    isPlaying: false,
    ugc_data: generateMockUGC(amenity, terminalCode)
  };
};

// Filter amenities for a specific collection
export const filterAmenitiesForCollection = (
  amenities: ExistingAmenity[],
  config: typeof COLLECTION_CONFIGS[0]
): ExistingAmenity[] => {
  return amenities.filter(amenity => {
    const { filters } = config;
    
    // Rating filter
    if (filters.rating_min && (amenity.rating || 0) < filters.rating_min) {
      return false;
    }
    
    // Wow factor filter
    if (filters.wow_factor_min && (amenity.wow_factor || 0) < filters.wow_factor_min) {
      return false;
    }
    
    // Category filters
    if (filters.categories && filters.categories.length > 0) {
      const amenityCategory = (amenity.category || '').toLowerCase();
      if (!filters.categories.some(cat => amenityCategory.includes(cat.toLowerCase()))) {
        return false;
      }
    }
    
    // Exclude categories
    if (filters.exclude_categories && filters.exclude_categories.length > 0) {
      const amenityCategory = (amenity.category || '').toLowerCase();
      if (filters.exclude_categories.some(cat => amenityCategory.includes(cat.toLowerCase()))) {
        return false;
      }
    }
    
    // Vibe filters
    if (filters.vibes && filters.vibes.length > 0) {
      const amenityVibes = [
        ...(amenity.vibe_tags || []),
        amenity.vibe || ''
      ].map(v => v.toLowerCase());
      
      if (!filters.vibes.some(vibe => 
        amenityVibes.includes(vibe.toLowerCase())
      )) {
        return false;
      }
    }
    
    // Walk time filter (if available)
    if (filters.max_walk_time && amenity.walkTime) {
      const walkMinutes = extractMinutesFromWalkTime(amenity.walkTime);
      if (walkMinutes > filters.max_walk_time) {
        return false;
      }
    }
    
    return true;
  });
};

// Generate collections from amenities data
export const generateCollectionsFromAmenities = (
  amenities: ExistingAmenity[],
  terminalCode: string,
  currentVibe?: Vibe
) => {
  const collections = COLLECTION_CONFIGS
    .map(config => {
      const filteredAmenities = filterAmenitiesForCollection(amenities, config);
      
      if (filteredAmenities.length === 0) return null;
      
      const items = filteredAmenities
        .slice(0, 8) // Limit to 8 items per collection
        .map(amenity => transformAmenityToCollectionItem(amenity, terminalCode));
      
      return {
        ...config,
        items,
        plays: items.reduce((sum, item) => sum + item.plays, 0)
      };
    })
    .filter(Boolean) // Remove empty collections
    .sort((a, b) => {
      // Sort by priority, but boost collections matching current vibe
      if (currentVibe) {
        const aMatchesVibe = a!.filters.vibes?.includes(currentVibe.toLowerCase());
        const bMatchesVibe = b!.filters.vibes?.includes(currentVibe.toLowerCase());
        
        if (aMatchesVibe && !bMatchesVibe) return -1;
        if (!aMatchesVibe && bMatchesVibe) return 1;
      }
      
      return a!.priority - b!.priority;
    });
    
  return collections;
};

// Utility functions
const generateFallbackImage = (category: string): string => {
  const categoryImageMap: Record<string, string> = {
    restaurant: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&q=80',
    food: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&q=80',
    cafe: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400&q=80',
    lounge: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&q=80',
    shopping: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&q=80',
    services: 'https://images.unsplash.com/photo-1556761175-4b46a572b786?w=400&q=80'
  };
  
  return categoryImageMap[category.toLowerCase()] || 
         'https://images.unsplash.com/photo-1556761175-4b46a572b786?w=400&q=80';
};

const estimateWalkTime = (): string => {
  const minutes = Math.floor(Math.random() * 10) + 2; // 2-12 minutes
  return `${minutes} min walk`;
};

const estimateDuration = (category: string): string => {
  const durationMap: Record<string, string> = {
    restaurant: '45-60 min',
    cafe: '15-30 min',
    lounge: '60-180 min',
    shopping: '20-45 min',
    services: '5-15 min',
    attraction: '30-60 min'
  };
  
  return durationMap[category.toLowerCase()] || '20-30 min';
};

const generateHighlights = (amenity: ExistingAmenity): string[] => {
  const highlights: string[] = [];
  
  if (amenity.rating && amenity.rating >= 4.5) highlights.push('Highly rated');
  if (amenity.wow_factor && amenity.wow_factor >= 90) highlights.push('Exceptional experience');
  if (amenity.openHours?.includes('24')) highlights.push('Open 24/7');
  if (amenity.category?.toLowerCase().includes('free')) highlights.push('Complimentary');
  
  // Add category-specific highlights
  const categoryHighlights: Record<string, string[]> = {
    restaurant: ['Local cuisine', 'Full service'],
    cafe: ['Quick service', 'Coffee specialist'],
    lounge: ['Premium comfort', 'Business facilities'],
    shopping: ['Duty-free prices', 'International brands']
  };
  
  const catKey = Object.keys(categoryHighlights).find(key => 
    amenity.category?.toLowerCase().includes(key)
  );
  
  if (catKey) {
    highlights.push(...categoryHighlights[catKey]);
  }
  
  return highlights.length > 0 ? highlights : ['Popular choice', 'Terminal favorite'];
};

const normalizeVibeTags = (tags: string[]): string[] => {
  const normalizedTags = tags.map(tag => {
    const lower = tag.toLowerCase();
    
    // Map common variations to standard vibes
    const vibeMap: Record<string, string> = {
      'relax': 'chill',
      'rest': 'comfort',
      'eat': 'refuel',
      'drink': 'refuel',
      'buy': 'shop',
      'browse': 'shop',
      'business': 'work',
      'wifi': 'work',
      'fast': 'quick',
      'express': 'quick',
      'discover': 'explore',
      'sightseeing': 'explore'
    };
    
    return vibeMap[lower] || lower;
  });
  
  return [...new Set(normalizedTags)]; // Remove duplicates
};

const calculateWowFactor = (amenity: ExistingAmenity): number => {
  let factor = 70; // Base score
  
  if (amenity.rating) {
    factor += (amenity.rating - 3) * 10; // Rating boost
  }
  
  if (amenity.category?.toLowerCase().includes('attraction')) factor += 15;
  if (amenity.category?.toLowerCase().includes('lounge')) factor += 10;
  if (amenity.name.toLowerCase().includes('free')) factor += 10;
  
  return Math.min(factor, 100);
};

const generateMockPlays = (rating: number): number => {
  const basePlay = Math.floor(rating * 30);
  const variance = Math.floor(Math.random() * 50);
  return basePlay + variance;
};

const extractMinutesFromWalkTime = (walkTime: string): number => {
  const match = walkTime.match(/(\d+)/);
  return match ? parseInt(match[1]) : 5;
};

const generateMockUGC = (amenity: ExistingAmenity, terminalCode: string): UGCData => {
  const usernames = ['travel_sarah', 'layover_luke', 'nomad_nina', 'airport_ace', 'jet_setter'];
  const avatars = ['👩🏽‍💼', '👨🏻‍💻', '👩🏻‍🎨', '👨🏾‍✈️', '👩🏼‍🎤'];
  const captions = [
    'This place exceeded my expectations! 🤩',
    'Perfect spot for a layover ✈️',
    'Hidden gem in the terminal! 📍',
    'Exactly what I needed right now 💯',
    'Would definitely come back! ⭐',
    'Great vibes and atmosphere 🌟'
  ];
  
  const randomUser = Math.floor(Math.random() * usernames.length);
  
  return {
    photos: [{
      id: `ugc_${amenity.id}_${Date.now()}`,
      url: amenity.imageUrl || amenity.logo_url || generateFallbackImage(amenity.category),
      user: { 
        username: usernames[randomUser], 
        avatar: avatars[randomUser]
      },
      timestamp: `${Math.floor(Math.random() * 180)}min ago`,
      likes: Math.floor(Math.random() * 100) + 20,
      vibe_tags: amenity.vibe_tags?.slice(0, 2) || ['explore'],
      caption: captions[Math.floor(Math.random() * captions.length)]
    }],
    recent_visitors: usernames.slice(0, 3).map(u => `@${u}`),
    total_tagged: Math.floor(Math.random() * 300) + 50,
    trending_hashtags: [`#${terminalCode}`, '#AirportLife', '#LayoverWin', '#TravelTips']
  };
};
