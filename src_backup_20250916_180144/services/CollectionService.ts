// src/services/CollectionService.ts

interface Amenity {
  id: string;
  slug?: string;
  amenity_slug?: string;
  name: string;
  category: string;
  amenity_type?: string;
  description: string;
  terminal_code: string;
  airport_code: string;
  opening_hours?: any;
  vibe_tags: string[];
  price_tier?: string;
  location_description?: string;
  rating?: number;
  reviews?: number;
  image_url?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

interface CollectionConfig {
  id: string;
  title: string;
  subtitle: string;
  emoji: string;
  gradient: string;
  description: string;
  amenityMix: string[];
  amenitySlugs: string[];
}

// Collection configurations with their associated amenity slugs
export const COLLECTION_CONFIGS: Record<string, CollectionConfig> = {
  'must-see': {
    id: 'must-see',
    title: 'Must-See Highlights',
    subtitle: 'Award-winning spots you can\'t miss',
    emoji: '⭐',
    gradient: 'from-yellow-500 to-orange-500',
    description: 'Experience the best of the terminal with these iconic attractions and amenities that have won international acclaim.',
    amenityMix: ['Award winners', 'Unique to terminal', 'Instagram-worthy'],
    amenitySlugs: [
      'butterfly-garden-t3-new',
      'butterfly-garden-t1-new',
      'canopy-park-t3-new', // Has the slide
      'movie-theatre-sint3',
      'cactus-garden-t1-new',
      'heritage-zone-sint4',
      'entertainment-deck-t3-new'
    ]
  },
  'quiet-havens': {
    id: 'quiet-havens',
    title: 'Quiet Havens',
    subtitle: 'Peaceful spaces for tranquility',
    emoji: '😌',
    gradient: 'from-blue-500 to-purple-500',
    description: 'Find your zen in these peaceful retreats away from the terminal buzz.',
    amenityMix: ['Meditation rooms', 'Quiet lounges', 'Libraries', 'Reading areas'],
    amenitySlugs: [
      'butterfly-garden-t3-new',
      'cactus-garden-t1-new',
      'sunflower-garden-t1-new',
      'orchid-garden-t2-new'
    ]
  },
  'recharge-stations': {
    id: 'recharge-stations',
    title: 'Recharge Stations',
    subtitle: 'Rest, relax, and rejuvenate',
    emoji: '🛋️',
    gradient: 'from-purple-500 to-pink-500',
    description: 'Premium comfort zones for rest and relaxation between flights.',
    amenityMix: ['Sleep pods', 'Spas', 'Massage chairs', 'Day hotels'],
    amenitySlugs: [
      'spa-express-jewel-new',
      'spa-express-t1-new',
      'spa-express-t2-new',
      'plaza-premium-lounge-syd',
      'qantas-business-lounge'
    ]
  },
  'foodie-paradise': {
    id: 'foodie-paradise',
    title: 'Foodie Paradise',
    subtitle: 'Dining experiences worth the wait',
    emoji: '🍔',
    gradient: 'from-red-500 to-orange-500',
    description: 'Culinary delights from celebrity chefs to local favorites.',
    amenityMix: ['Restaurants', 'Cafes', 'Bars', 'Food courts'],
    amenitySlugs: [
      'food-street-t3-new',
      'irvins-salted-egg-jewel-new',
      'twelve-cupcakes-t1-new',
      'food-gallery-t2-new',
      'food-emporium-t4-new'
    ]
  },
  'discovery-trail': {
    id: 'discovery-trail',
    title: 'Discovery Trail',
    subtitle: 'Attractions and experiences to explore',
    emoji: '🧭',
    gradient: 'from-green-500 to-teal-500',
    description: 'Unique experiences and attractions that make your layover memorable.',
    amenityMix: ['Gardens', 'Art installations', 'Observation decks', 'Cinemas'],
    amenitySlugs: [
      'butterfly-garden-t3-new',
      'canopy-park-t3-new',
      'heritage-zone-sint4',
      'cactus-garden-t1-new',
      'sunflower-garden-t1-new',
      'orchid-garden-t2-new'
    ]
  },
  'entertainment-central': {
    id: 'entertainment-central',
    title: 'Entertainment Central',
    subtitle: 'Fun activities to pass the time',
    emoji: '🎮',
    gradient: 'from-indigo-500 to-purple-500',
    description: 'Keep yourself entertained with movies, games, and interactive experiences.',
    amenityMix: ['Gaming zones', 'Cinemas', 'Interactive displays'],
    amenitySlugs: [
      'movie-theatre-sint3',
      'entertainment-deck-t3-new',
      'entertainment-deck-t1-new',
      'entertainment-deck-t2-new',
      'canopy-park-t3-new'
    ]
  },
  'express-lane': {
    id: 'express-lane',
    title: 'Express Lane',
    subtitle: 'Everything under 10 minutes',
    emoji: '⚡',
    gradient: 'from-yellow-400 to-orange-400',
    description: 'Quick stops when time is tight - grab what you need and go.',
    amenityMix: ['Grab-and-go food', 'Convenience stores', 'Express services'],
    amenitySlugs: [
      'irvins-salted-egg-jewel-new',
      'twelve-cupcakes-t1-new',
      'food-gallery-t2-new'
    ]
  },
  'productivity-hubs': {
    id: 'productivity-hubs',
    title: 'Productivity Hubs',
    subtitle: 'Get work done between flights',
    emoji: '💼',
    gradient: 'from-blue-600 to-indigo-600',
    description: 'Professional spaces for productivity with WiFi, power, and quiet zones.',
    amenityMix: ['Business lounges', 'Work pods', 'Meeting rooms', 'Quiet workspaces'],
    amenitySlugs: [
      'plaza-premium-lounge-syd',
      'qantas-business-lounge',
      'spa-express-t1-new'
    ]
  },
  'retail-therapy': {
    id: 'retail-therapy',
    title: 'Retail Therapy',
    subtitle: 'Shopping, duty-free, and boutiques',
    emoji: '🛍️',
    gradient: 'from-pink-500 to-purple-500',
    description: 'Shop till you drop with duty-free deals and unique boutiques.',
    amenityMix: ['Duty-free shops', 'Boutiques', 'Souvenir stores', 'Fashion outlets'],
    amenitySlugs: [
      // Add shopping amenities when available in your data
    ]
  },
  'hidden-gems': {
    id: 'hidden-gems',
    title: 'Hidden Gems',
    subtitle: 'Secret spots locals love',
    emoji: '💎',
    gradient: 'from-indigo-500 to-purple-500',
    description: 'Off-the-beaten-path treasures that most travelers miss.',
    amenityMix: ['Off-path lounges', 'Local favorites', 'Quiet escapes', 'Secret gardens'],
    amenitySlugs: [
      'cactus-garden-t1-new',
      'koi-pond-t1-new',
      'sunflower-garden-t1-new',
      'orchid-garden-t2-new',
      'heritage-zone-sint4'
    ]
  }
};

export class CollectionService {
  private static amenitiesCache: Map<string, Amenity[]> = new Map();

  // Load amenities from JSON files
  static async loadAmenities(terminalCode: string): Promise<Amenity[]> {
    // Check cache first
    if (this.amenitiesCache.has(terminalCode)) {
      return this.amenitiesCache.get(terminalCode)!;
    }

    try {
      // Try multiple data sources
      let allAmenities: Amenity[] = [];
      
      // Try loading from enriched-amenities.json first
      try {
        const response = await fetch('/data/enriched-amenities.json');
        if (response.ok) {
          const data = await response.json();
          allAmenities = data;
        }
      } catch (e) {
        console.log('enriched-amenities.json not found, trying other sources');
      }
      
      // Try loading from amenities-from-csv.json
      if (allAmenities.length === 0) {
        try {
          const response = await fetch('/data/amenities-from-csv.json');
          if (response.ok) {
            const data = await response.json();
            allAmenities = data;
          }
        } catch (e) {
          console.log('amenities-from-csv.json not found');
        }
      }
      
      // Try loading from raw-amenities.json as fallback
      if (allAmenities.length === 0) {
        try {
          const response = await fetch('/data/raw-amenities.json');
          if (response.ok) {
            const data = await response.json();
            allAmenities = data;
          }
        } catch (e) {
          console.log('raw-amenities.json not found');
        }
      }
      
      // Filter by terminal code
      const filteredAmenities = allAmenities.filter((amenity: any) => {
        return amenity.terminal_code === terminalCode;
      });
      
      // Cache the results
      this.amenitiesCache.set(terminalCode, filteredAmenities);
      
      return filteredAmenities;
    } catch (error) {
      console.error('Error loading amenities:', error);
      // Return empty array instead of throwing to prevent app crash
      return [];
    }
  }

  // Get collection with populated amenities
  static async getCollectionWithAmenities(
    collectionId: string, 
    terminalCode: string
  ): Promise<{
    collection: CollectionConfig;
    amenities: Amenity[];
  }> {
    const collection = COLLECTION_CONFIGS[collectionId];
    if (!collection) {
      throw new Error(`Collection ${collectionId} not found`);
    }

    // Load all amenities for the terminal
    const allAmenities = await this.loadAmenities(terminalCode);
    
    // Filter amenities that belong to this collection
    // Check multiple possible slug fields for compatibility
    const collectionAmenities = allAmenities.filter(amenity => {
      const slug = amenity.slug || amenity.amenity_slug || amenity.id;
      return collection.amenitySlugs.includes(slug);
    });

    // Sort by rating if available, otherwise maintain order
    collectionAmenities.sort((a, b) => {
      const ratingA = a.rating || 0;
      const ratingB = b.rating || 0;
      return ratingB - ratingA;
    });

    return {
      collection,
      amenities: collectionAmenities
    };
  }

  // Calculate walking times (mock implementation)
  static calculateWalkTime(
    fromLocation: { lat: number; lng: number } | null,
    toLocation: { lat: number; lng: number }
  ): string {
    if (!fromLocation) return '5 min walk';
    
    // Simple distance calculation (in production, use proper routing API)
    const distance = Math.sqrt(
      Math.pow(toLocation.lat - fromLocation.lat, 2) +
      Math.pow(toLocation.lng - fromLocation.lng, 2)
    );
    
    const minutes = Math.max(2, Math.min(15, Math.round(distance * 1000)));
    return `${minutes} min walk`;
  }

  // Get live wait times (mock implementation)
  static getCurrentWaitTime(amenityId: string): string {
    // In production, this would call a real-time API
    const waitTimes = ['0 min', '5 min', '10 min', '15 min', '20 min'];
    return waitTimes[Math.floor(Math.random() * waitTimes.length)];
  }

  // Check if amenity is open
  static isOpenNow(openingHours: any): boolean {
    if (!openingHours) return true;
    
    // Handle 24/7 case
    if (typeof openingHours === 'object' && openingHours['Monday-Sunday'] === '24/7') {
      return true;
    }
    
    // Simple implementation - in production, use proper date/time logic
    const now = new Date();
    const day = now.toLocaleDateString('en-US', { weekday: 'long' });
    const currentTime = now.getHours() * 100 + now.getMinutes();
    
    const todayHours = openingHours[day] || openingHours['Monday-Sunday'];
    if (!todayHours || todayHours === '24/7') return true;
    
    // Parse hours like "06:00-22:00"
    try {
      const [open, close] = todayHours.split('-').map((t: string) => {
        const [h, m] = t.split(':').map(Number);
        return h * 100 + m;
      });
      
      return currentTime >= open && currentTime <= close;
    } catch {
      return true; // Default to open if parsing fails
    }
  }

  // Get similar collections for "More Like This" section
  static getSimilarCollections(collectionId: string): string[] {
    const similarityMap: Record<string, string[]> = {
      'must-see': ['discovery-trail', 'hidden-gems', 'entertainment-central'],
      'quiet-havens': ['recharge-stations', 'productivity-hubs', 'hidden-gems'],
      'recharge-stations': ['quiet-havens', 'foodie-paradise', 'productivity-hubs'],
      'discovery-trail': ['must-see', 'entertainment-central', 'hidden-gems'],
      'foodie-paradise': ['express-lane', 'recharge-stations', 'retail-therapy'],
      'entertainment-central': ['discovery-trail', 'must-see', 'express-lane'],
      'express-lane': ['foodie-paradise', 'retail-therapy', 'entertainment-central'],
      'productivity-hubs': ['quiet-havens', 'recharge-stations', 'express-lane'],
      'retail-therapy': ['foodie-paradise', 'express-lane', 'discovery-trail'],
      'hidden-gems': ['quiet-havens', 'discovery-trail', 'must-see']
    };
    
    return similarityMap[collectionId] || ['must-see', 'discovery-trail', 'foodie-paradise'];
  }
}
