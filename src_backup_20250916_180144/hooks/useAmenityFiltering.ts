import { useState, useMemo } from 'react';
import type { AmenityLocation, UserPreferences } from '../types/amenity.types';

type Filters = {
  categories: string[];
  terminals: string[];
  priceRange?: string;
  accessibility?: boolean;
  searchQuery?: string;
  rating?: number;
};

interface UseAmenityFilteringProps {
  amenities: AmenityLocation[];
  initialFilters?: Partial<Filters>;
}

export function useAmenityFiltering({ amenities, initialFilters = {} }: UseAmenityFilteringProps) {
  const [filters, setFilters] = useState<Filters>({
    categories: initialFilters.categories || [],
    terminals: initialFilters.terminals || [],
    priceRange: initialFilters.priceRange,
    accessibility: initialFilters.accessibility,
    searchQuery: initialFilters.searchQuery || '',
    rating: initialFilters.rating,
  });

  const availableCategories = useMemo(() => {
    const cats = new Set<string>();
    amenities.forEach(a => a.category && cats.add(a.category));
    return Array.from(cats).sort();
  }, [amenities]);

  const availableTerminals = useMemo(() => {
    const terms = new Set<string>();
    amenities.forEach(a => a.terminal && terms.add(a.terminal));
    return Array.from(terms).sort();
  }, [amenities]);

  const filteredAmenities = useMemo(() => {
    return amenities.filter(a => {
      if (filters.categories.length && !filters.categories.includes(a.category)) return false;
      if (filters.terminals.length && !filters.terminals.includes(a.terminal)) return false;
      if (filters.priceRange && a.priceRange !== filters.priceRange) return false;
      if (filters.accessibility && !a.accessibility) return false;
      if (filters.rating && (!a.rating || a.rating < filters.rating)) return false;
      if (filters.searchQuery && !a.name.toLowerCase().includes(filters.searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [amenities, filters]);

  const updateFilter = <K extends keyof Filters>(key: K, value: Filters[K]) => {
    setFilters(f => ({ ...f, [key]: value }));
  };

  const resetFilters = () => {
    setFilters({
      categories: [],
      terminals: [],
      priceRange: undefined,
      accessibility: undefined,
      searchQuery: '',
      rating: undefined,
    });
  };

  return {
    filters,
    filteredAmenities,
    availableCategories,
    availableTerminals,
    updateFilter,
    resetFilters,
    totalResults: filteredAmenities.length,
  };
} 