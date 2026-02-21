import { useState, useEffect, useCallback } from 'react';

interface Smart7CollectionOptions {
  collectionSlug: string;
  terminal: string;
  enableCache?: boolean;
}

export const useSmart7WithCollections = ({
  collectionSlug,
  terminal = 'T3',
  enableCache = true
}: Smart7CollectionOptions) => {
  const [collectionData, setCollectionData] = useState<any>(null);
  const [smart7Items, setSmart7Items] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCollectionWithSmart7 = useCallback(async () => {
    try {
      setLoading(true);
      
      // Mock data for now - replace with actual Supabase call
      const mockCollection = {
        id: 1,
        name: 'Singapore Exclusives',
        description: 'Local Singapore brands and experiences',
        icon: '🇸🇬',
        gradient: 'from-green-500 to-blue-600',
        featured: true
      };

      const mockAmenities = [
        {
          id: 1,
          name: 'Ya Kun Kaya Toast',
          amenity_slug: 'ya-kun-kaya-toast',
          description: 'Traditional Singapore breakfast with kaya toast and soft-boiled eggs',
          terminal_code: `SIN-${terminal}`,
          price_level: '$',
          vibe_tags: 'Local,Refuel,Traditional',
          smart7_score: 95,
          is_featured: true
        },
        {
          id: 2,
          name: 'Bengawan Solo',
          amenity_slug: 'bengawan-solo',
          description: 'Famous Singapore bakery with traditional kueh and pastries',
          terminal_code: `SIN-${terminal}`,
          price_level: '$',
          vibe_tags: 'Local,Sweet,Traditional',
          smart7_score: 92,
          is_featured: true
        },
        {
          id: 3,
          name: 'Old Chang Kee',
          amenity_slug: 'old-chang-kee',
          description: 'Iconic Singapore curry puff and local snacks',
          terminal_code: `SIN-${terminal}`,
          price_level: '$',
          vibe_tags: 'Local,Quick,Snacks',
          smart7_score: 88,
          is_featured: false
        },
        {
          id: 4,
          name: 'TWG Tea',
          amenity_slug: 'twg-tea',
          description: 'Luxury Singapore tea brand with premium tea selection',
          terminal_code: `SIN-${terminal}`,
          price_level: '$$',
          vibe_tags: 'Premium,Tea,Luxury',
          smart7_score: 85,
          is_featured: false
        },
        {
          id: 5,
          name: 'Jewel Changi',
          amenity_slug: 'jewel-changi',
          description: 'Iconic waterfall and garden experience',
          terminal_code: `SIN-${terminal}`,
          price_level: 'Free',
          vibe_tags: 'Experience,Free,Iconic',
          smart7_score: 90,
          is_featured: true
        },
        {
          id: 6,
          name: 'Tiger Beer Bar',
          amenity_slug: 'tiger-beer-bar',
          description: 'Local Singapore beer with bar snacks',
          terminal_code: `SIN-${terminal}`,
          price_level: '$$',
          vibe_tags: 'Local,Drinks,Bar',
          smart7_score: 82,
          is_featured: false
        },
        {
          id: 7,
          name: 'Singapore Food Street',
          amenity_slug: 'singapore-food-street',
          description: 'Authentic local food court experience',
          terminal_code: `SIN-${terminal}`,
          price_level: '$',
          vibe_tags: 'Local,Food Court,Authentic',
          smart7_score: 87,
          is_featured: false
        }
      ];

      setCollectionData(mockCollection);
      setSmart7Items(mockAmenities);
      
    } catch (err) {
      console.error('Error loading Smart7 collection:', err);
      setError('Failed to load collection');
    } finally {
      setLoading(false);
    }
  }, [collectionSlug, terminal]);

  const refreshSelection = useCallback(async () => {
    await loadCollectionWithSmart7();
  }, [loadCollectionWithSmart7]);

  const trackClick = useCallback((amenityId: number) => {
    console.log('Amenity clicked:', amenityId);
    // Add actual tracking logic here
  }, []);

  useEffect(() => {
    loadCollectionWithSmart7();
  }, [loadCollectionWithSmart7]);

  return {
    collection: collectionData,
    smart7Items,
    loading,
    error,
    refreshSelection,
    trackClick
  };
};
