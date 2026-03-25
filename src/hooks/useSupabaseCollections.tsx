import { useState, useEffect } from 'react';

// Mock data for collections
const MOCK_AMENITIES = {
  'hidden-gems': [
    {
      id: 1,
      name: 'Butterfly Garden',
      description: 'Tropical butterfly sanctuary',
      terminal_code: 'T3',
      airport_code: 'SIN',
      vibe_tags: ['discover', 'nature', 'free'],
      price_level: 'Free',
      opening_hours: '24/7',
      image_url: '/images/butterfly.jpg',
      location_description: 'Level 2 & 3, multiple locations'
    },
    {
      id: 2,
      name: 'Sunflower Garden',
      description: 'Rooftop garden with sunflowers',
      terminal_code: 'T2',
      airport_code: 'SIN',
      vibe_tags: ['discover', 'nature', 'instagram'],
      price_level: 'Free',
      opening_hours: '24/7',
      image_url: '/images/sunflower.jpg',
      location_description: 'Level 3, Transit Area'
    },
    {
      id: 3,
      name: 'Orchid Garden',
      description: 'Beautiful orchid displays',
      terminal_code: 'T2',
      airport_code: 'SIN',
      vibe_tags: ['discover', 'nature', 'quiet'],
      price_level: 'Free',
      opening_hours: '24/7',
      image_url: '/images/orchid.jpg',
      location_description: 'Level 2, near Gate E'
    },
    {
      id: 4,
      name: 'Koi Pond',
      description: 'Tranquil koi fish pond',
      terminal_code: 'T1',
      airport_code: 'SIN',
      vibe_tags: ['discover', 'relaxation', 'quiet'],
      price_level: 'Free',
      opening_hours: '24/7',
      image_url: '/images/koi.jpg',
      location_description: 'Level 2, Central Area'
    },
    {
      id: 5,
      name: 'Movie Theatre',
      description: 'Free 24-hour cinema',
      terminal_code: 'T3',
      airport_code: 'SIN',
      vibe_tags: ['discover', 'entertainment', 'free'],
      price_level: 'Free',
      opening_hours: '24/7',
      image_url: '/images/cinema.jpg',
      location_description: 'Level 3, near Gate A'
    },
    {
      id: 6,
      name: 'Heritage Zone',
      description: 'Singapore cultural exhibits',
      terminal_code: 'T4',
      airport_code: 'SIN',
      vibe_tags: ['discover', 'culture', 'education'],
      price_level: 'Free',
      opening_hours: '24/7',
      image_url: '/images/heritage.jpg',
      location_description: 'Level 2M, Heritage Zone'
    },
    {
      id: 7,
      name: 'Rooftop Cactus Garden',
      description: 'Desert plants on the roof',
      terminal_code: 'T1',
      airport_code: 'SIN',
      vibe_tags: ['discover', 'nature', 'unique'],
      price_level: 'Free',
      opening_hours: '24/7',
      image_url: '/images/cactus.jpg',
      location_description: 'Level 3, Outdoor Area'
    }
  ],
  'quiet-zones': [
    {
      id: 8,
      name: 'Snooze Lounge',
      description: 'Comfortable rest areas',
      terminal_code: 'T1',
      airport_code: 'SIN',
      vibe_tags: ['chill', 'rest', 'quiet'],
      price_level: 'Free',
      opening_hours: '24/7'
    },
    {
      id: 9,
      name: 'Quiet Corner',
      description: 'Peaceful seating area',
      terminal_code: 'T2',
      airport_code: 'SIN',
      vibe_tags: ['chill', 'quiet', 'work'],
      price_level: 'Free',
      opening_hours: '24/7'
    }
  ],
  'coffee-chill': [
    {
      id: 10,
      name: 'Starbucks Reserve',
      description: 'Premium coffee experience',
      terminal_code: 'T3',
      airport_code: 'SIN',
      vibe_tags: ['chill', 'coffee', 'premium'],
      price_level: '$$$',
      opening_hours: '24/7'
    },
    {
      id: 11,
      name: 'Coffee Bean & Tea Leaf',
      description: 'Classic coffee and tea',
      terminal_code: 'T2',
      airport_code: 'SIN',
      vibe_tags: ['chill', 'coffee', 'quick'],
      price_level: '$$',
      opening_hours: '6am-midnight'
    }
  ],
  // Add more collections as needed
  'default': [
    {
      id: 99,
      name: 'Default Amenity',
      description: 'Placeholder amenity',
      terminal_code: 'T1',
      airport_code: 'SIN',
      vibe_tags: ['general'],
      price_level: '$$',
      opening_hours: '24/7'
    }
  ]
};

export function useCollectionAmenities(collectionId: string) {
  const [amenities, setAmenities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Simulate async loading with mock data
    const loadMockData = async () => {
      setLoading(true);
      setError(null);
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Get mock amenities for this collection
      const mockData = MOCK_AMENITIES[collectionId] || MOCK_AMENITIES['default'];
      
      console.log(`Loading mock data for collection: ${collectionId}`, mockData);
      
      setAmenities(mockData);
      setLoading(false);
    };

    loadMockData();
  }, [collectionId]);

  return { amenities, loading, error };
}

// Add other hooks if needed
export function useSupabaseCollections() {
  // Return mock collections list
  return {
    collections: [
      { id: 'hidden-gems', name: 'Hidden Gems', vibe: 'discover' },
      { id: 'quiet-zones', name: 'Quiet Zones', vibe: 'chill' },
      { id: 'coffee-chill', name: 'Coffee & Chill', vibe: 'chill' },
    ],
    loading: false,
    error: null
  };
}
