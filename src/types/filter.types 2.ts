// filter.types.ts - Centralized filter and search types
// Used across filtering hooks, components, and utilities

import type { Amenity } from './amenity.types';
import type { VibeType } from './vibe.types';

// Core filter state interface
export interface Filters {
  categories: string[];
  terminals: string[];
  priceRange?: PriceRange;
  accessibility?: boolean;
  searchQuery?: string;
  rating?: number;
  vibe?: VibeType;
  distance?: number; // in meters
  openNow?: boolean;
  sortBy?: SortOption;
}

export type PriceRange = 'budget' | 'moderate' | 'premium';
export type SortOption = 'relevance' | 'rating' | 'distance' | 'name' | 'price';

// Filter hook props
export interface UseAmenityFilteringProps {
  amenities: Amenity[];
  initialFilters?: Partial<Filters>;
  maxResults?: number;
  enableRealTime?: boolean;
}

// Filter results and metadata
export interface FilterResults {
  amenities: Amenity[];
  totalCount: number;
  filteredCount: number;
  appliedFilters: Filters;
  availableOptions: {
    categories: string[];
    terminals: string[];
    priceRanges: PriceRange[];
    ratings: number[];
  };
}

// Filter validation and constraints
export interface FilterConstraints {
  maxDistance?: number;
  maxPrice?: PriceRange;
  requiredCategories?: string[];
  excludedCategories?: string[];
  minRating?: number;
}

// Runtime validation functions
export const isValidPriceRange = (value: string): value is PriceRange => {
  return ['budget', 'moderate', 'premium'].includes(value);
};

export const isValidSortOption = (value: string): value is SortOption => {
  return ['relevance', 'rating', 'distance', 'name', 'price'].includes(value);
};

export const validateFilters = (filters: unknown): Filters | null => {
  if (!filters || typeof filters !== 'object') return null;
  
  const f = filters as any;
  
  // Validate required arrays
  if (!Array.isArray(f.categories) || !Array.isArray(f.terminals)) {
    return null;
  }
  
  // Validate array contents
  if (!f.categories.every((c: unknown) => typeof c === 'string')) return null;
  if (!f.terminals.every((t: unknown) => typeof t === 'string')) return null;
  
  // Validate optional fields
  if (f.priceRange !== undefined && !isValidPriceRange(f.priceRange)) return null;
  if (f.accessibility !== undefined && typeof f.accessibility !== 'boolean') return null;
  if (f.searchQuery !== undefined && typeof f.searchQuery !== 'string') return null;
  if (f.rating !== undefined && (typeof f.rating !== 'number' || f.rating < 0 || f.rating > 5)) return null;
  if (f.distance !== undefined && (typeof f.distance !== 'number' || f.distance < 0)) return null;
  if (f.openNow !== undefined && typeof f.openNow !== 'boolean') return null;
  if (f.sortBy !== undefined && !isValidSortOption(f.sortBy)) return null;
  
  return {
    categories: f.categories,
    terminals: f.terminals,
    priceRange: f.priceRange,
    accessibility: f.accessibility,
    searchQuery: f.searchQuery,
    rating: f.rating,
    vibe: f.vibe,
    distance: f.distance,
    openNow: f.openNow,
    sortBy: f.sortBy
  };
};

// Filter utility functions
export const createEmptyFilters = (): Filters => ({
  categories: [],
  terminals: [],
  priceRange: undefined,
  accessibility: undefined,
  searchQuery: '',
  rating: undefined,
  vibe: undefined,
  distance: undefined,
  openNow: undefined,
  sortBy: 'relevance'
});

export const mergeFilters = (base: Filters, updates: Partial<Filters>): Filters => {
  return {
    ...base,
    ...updates,
    // Handle array merges properly
    categories: updates.categories !== undefined ? updates.categories : base.categories,
    terminals: updates.terminals !== undefined ? updates.terminals : base.terminals
  };
};

export const hasActiveFilters = (filters: Filters): boolean => {
  return (
    filters.categories.length > 0 ||
    filters.terminals.length > 0 ||
    filters.priceRange !== undefined ||
    filters.accessibility === true ||
    (filters.searchQuery && filters.searchQuery.trim() !== '') ||
    filters.rating !== undefined ||
    filters.vibe !== undefined ||
    filters.distance !== undefined ||
    filters.openNow === true
  );
};

export const clearFilters = (filters: Filters): Filters => {
  return createEmptyFilters();
};

// Filter application logic
export const applyFilters = (
  amenities: Amenity[],
  filters: Filters,
  constraints?: FilterConstraints
): Amenity[] => {
  let filtered = [...amenities];
  
  // Apply category filter
  if (filters.categories.length > 0) {
    filtered = filtered.filter(amenity => 
      filters.categories.includes(amenity.category)
    );
  }
  
  // Apply terminal filter
  if (filters.terminals.length > 0) {
    filtered = filtered.filter(amenity => 
      amenity.terminal && filters.terminals.includes(amenity.terminal)
    );
  }
  
  // Apply price range filter
  if (filters.priceRange) {
    filtered = filtered.filter(amenity => 
      amenity.priceRange === filters.priceRange
    );
  }
  
  // Apply accessibility filter
  if (filters.accessibility === true) {
    filtered = filtered.filter(amenity => 
      amenity.accessibility === true
    );
  }
  
  // Apply search query filter
  if (filters.searchQuery && filters.searchQuery.trim() !== '') {
    const query = filters.searchQuery.toLowerCase();
    filtered = filtered.filter(amenity =>
      amenity.name.toLowerCase().includes(query) ||
      amenity.description?.toLowerCase().includes(query) ||
      amenity.category.toLowerCase().includes(query)
    );
  }
  
  // Apply rating filter
  if (filters.rating !== undefined) {
    filtered = filtered.filter(amenity => 
      amenity.rating && amenity.rating >= filters.rating!
    );
  }
  
  // Apply vibe filter
  if (filters.vibe) {
    filtered = filtered.filter(amenity =>
      amenity.vibe_tags?.includes(filters.vibe!)
    );
  }
  
  // Apply distance filter (if location data available)
  if (filters.distance !== undefined) {
    // This would require location data to be implemented
    // For now, we'll skip this filter
  }
  
  // Apply open now filter
  if (filters.openNow === true) {
    // This would require opening hours data to be implemented
    // For now, we'll skip this filter
  }
  
  // Apply constraints
  if (constraints) {
    if (constraints.maxPrice) {
      filtered = filtered.filter(amenity => 
        amenity.priceRange !== 'premium' || constraints.maxPrice === 'premium'
      );
    }
    
    if (constraints.requiredCategories) {
      filtered = filtered.filter(amenity =>
        constraints.requiredCategories!.includes(amenity.category)
      );
    }
    
    if (constraints.excludedCategories) {
      filtered = filtered.filter(amenity =>
        !constraints.excludedCategories!.includes(amenity.category)
      );
    }
    
    if (constraints.minRating) {
      filtered = filtered.filter(amenity =>
        amenity.rating && amenity.rating >= constraints.minRating!
      );
    }
  }
  
  return filtered;
};

// Sorting functions
export const sortAmenities = (amenities: Amenity[], sortBy: SortOption): Amenity[] => {
  const sorted = [...amenities];
  
  switch (sortBy) {
    case 'rating':
      return sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    case 'name':
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
    case 'price':
      return sorted.sort((a, b) => {
        const priceOrder = { budget: 1, moderate: 2, premium: 3 };
        return (priceOrder[a.priceRange as keyof typeof priceOrder] || 0) - 
               (priceOrder[b.priceRange as keyof typeof priceOrder] || 0);
      });
    case 'distance':
      // Would require location data to implement
      return sorted;
    case 'relevance':
    default:
      // Keep original order (relevance is typically pre-sorted)
      return sorted;
  }
};

// Type guards for runtime safety
export const isFilters = (value: unknown): value is Filters => {
  return validateFilters(value) !== null;
};

export const isFilterResults = (value: unknown): value is FilterResults => {
  if (!value || typeof value !== 'object') return false;
  const results = value as any;
  
  return (
    Array.isArray(results.amenities) &&
    typeof results.totalCount === 'number' &&
    typeof results.filteredCount === 'number' &&
    isFilters(results.appliedFilters) &&
    results.amenities.every((a: unknown) => a && typeof a === 'object' && 'id' in a)
  );
};

export const isFilterConstraints = (value: unknown): value is FilterConstraints => {
  if (!value || typeof value !== 'object') return false;
  const constraints = value as any;
  
  return (
    (constraints.maxDistance === undefined || 
     (typeof constraints.maxDistance === 'number' && constraints.maxDistance >= 0)) &&
    (constraints.maxPrice === undefined || isValidPriceRange(constraints.maxPrice)) &&
    (constraints.requiredCategories === undefined || 
     (Array.isArray(constraints.requiredCategories) && 
      constraints.requiredCategories.every((c: unknown) => typeof c === 'string'))) &&
    (constraints.excludedCategories === undefined || 
     (Array.isArray(constraints.excludedCategories) && 
      constraints.excludedCategories.every((c: unknown) => typeof c === 'string'))) &&
    (constraints.minRating === undefined || 
     (typeof constraints.minRating === 'number' && constraints.minRating >= 0 && constraints.minRating <= 5))
  );
}; 