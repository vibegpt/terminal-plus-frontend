// src/hooks/useCollectionAmenities.ts - Custom hook for collection amenities
import { useState, useEffect } from 'react';
import { getAmenitiesByCollection } from '../lib/supabase/queries';
import { enrichAmenityData } from '../utils/collectionMapper';
import { Amenity, EnrichedAmenity } from '../types/database.types';

interface Filters {
  openNow?: boolean;
  priceLevel?: string;
  sortBy?: string;
  searchQuery?: string;
}

interface CollectionAmenitiesData {
  amenities: EnrichedAmenity[];
  loading: boolean;
  error: string | null;
  totalCount: number;
  filteredCount: number;
}

export const useCollectionAmenities = (
  collectionSlug: string | undefined,
  filters: Filters = {}
): CollectionAmenitiesData => {
  const [data, setData] = useState<CollectionAmenitiesData>({
    amenities: [],
    loading: true,
    error: null,
    totalCount: 0,
    filteredCount: 0
  });

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      if (!collectionSlug) {
        setData({
          amenities: [],
          loading: false,
          error: null,
          totalCount: 0,
          filteredCount: 0
        });
        return;
      }

      try {
        setData(prev => ({ ...prev, loading: true, error: null }));
        
        // Get user's current location context from sessionStorage
        const userContext = JSON.parse(
          sessionStorage.getItem('journeyContext') || '{}'
        );
        
        const { airportCode, terminalCode } = userContext;
        
        // Fetch amenities from database
        const amenities = await getAmenitiesByCollection(
          collectionSlug,
          airportCode,
          terminalCode
        );
        
        // Enrich with computed fields
        const enrichedAmenities = amenities.map(enrichAmenityData);
        
        if (mounted) {
          setData({
            amenities: enrichedAmenities,
            loading: false,
            error: null,
            totalCount: enrichedAmenities.length,
            filteredCount: enrichedAmenities.length
          });
        }
      } catch (error) {
        console.error('Error fetching collection amenities:', error);
        
        if (mounted) {
          setData(prev => ({
            ...prev,
            loading: false,
            error: error instanceof Error ? error.message : 'Failed to fetch amenities'
          }));
        }
      }
    };

    fetchData();

    return () => {
      mounted = false;
    };
  }, [collectionSlug]);

  // Apply filters and return filtered data
  const getFilteredAmenities = (): EnrichedAmenity[] => {
    let filtered = [...data.amenities];
    
    // Filter by open now
    if (filters.openNow) {
      filtered = filtered.filter(amenity => amenity.isOpen);
    }
    
    // Filter by price level
    if (filters.priceLevel && filters.priceLevel !== 'all') {
      filtered = filtered.filter(amenity => amenity.price_level === filters.priceLevel);
    }
    
    // Filter by search query
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(amenity => 
        amenity.name.toLowerCase().includes(query) ||
        amenity.description.toLowerCase().includes(query) ||
        amenity.features.some(feature => 
          feature.toLowerCase().includes(query)
        )
      );
    }
    
    // Apply sorting
    switch (filters.sortBy) {
      case 'distance':
        filtered.sort((a, b) => {
          const aTime = parseInt(a.walkTime.split(' ')[0]);
          const bTime = parseInt(b.walkTime.split(' ')[0]);
          return aTime - bTime;
        });
        break;
      case 'price-low':
        filtered.sort((a, b) => getPriceValue(a.price_level) - getPriceValue(b.price_level));
        break;
      case 'price-high':
        filtered.sort((a, b) => getPriceValue(b.price_level) - getPriceValue(a.price_level));
        break;
      case 'rating':
        filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'recommended':
      default:
        // Keep original order (already sorted by relevance from database)
        break;
    }
    
    return filtered;
  };

  // Helper function to get numeric price value for sorting
  const getPriceValue = (priceLevel: string): number => {
    switch (priceLevel) {
      case '$': return 1;
      case '$$': return 2;
      case '$$$': return 3;
      case '$$$$': return 4;
      default: return 0; // Free or unknown
    }
  };

  const filteredAmenities = getFilteredAmenities();

  return {
    ...data,
    amenities: filteredAmenities,
    filteredCount: filteredAmenities.length
  };
};
