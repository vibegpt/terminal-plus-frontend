import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { devtools, subscribeWithSelector } from 'zustand/middleware';

// Types
interface Amenity {
  id: string;
  name: string;
  description?: string;
  amenity_slug: string;
  terminal_code?: string;
  primary_vibe?: string;
  vibe_tags?: string[];
  logo_url?: string;
  image_url?: string;
  price_level?: number;
  location?: {
    latitude: number;
    longitude: number;
    floor?: string;
    gate?: string;
  };
  hours?: {
    open: string;
    close: string;
    timezone: string;
  };
  contact?: {
    phone?: string;
    email?: string;
    website?: string;
  };
  features?: string[];
  rating?: number;
  reviews_count?: number;
}

interface AmenitiesState {
  // Data
  amenities: Amenity[];
  filteredAmenities: Amenity[];
  selectedAmenity: Amenity | null;
  bookmarkedAmenities: string[];
  recentlyViewed: string[];
  
  // Filters
  filters: {
    vibe: string | null;
    terminal: string | null;
    priceRange: [number, number] | null;
    distance: number | null;
    searchQuery: string;
    features: string[];
    rating: number | null;
  };
  
  // UI State
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  
  // Pagination
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    hasMore: boolean;
  };
  
  // Actions
  setAmenities: (amenities: Amenity[]) => void;
  addAmenity: (amenity: Amenity) => void;
  updateAmenity: (id: string, updates: Partial<Amenity>) => void;
  removeAmenity: (id: string) => void;
  
  setSelectedAmenity: (amenity: Amenity | null) => void;
  addToRecentlyViewed: (amenityId: string) => void;
  
  toggleBookmark: (amenityId: string) => void;
  isBookmarked: (amenityId: string) => boolean;
  
  setFilters: (filters: Partial<AmenitiesState['filters']>) => void;
  clearFilters: () => void;
  applyFilters: () => void;
  
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setLastUpdated: (date: Date) => void;
  
  setPagination: (pagination: Partial<AmenitiesState['pagination']>) => void;
  nextPage: () => void;
  prevPage: () => void;
  resetPagination: () => void;
  
  // Search
  searchAmenities: (query: string) => void;
  
  // Reset
  reset: () => void;
}

// Initial state
const initialState = {
  amenities: [],
  filteredAmenities: [],
  selectedAmenity: null,
  bookmarkedAmenities: [],
  recentlyViewed: [],
  filters: {
    vibe: null,
    terminal: null,
    priceRange: null,
    distance: null,
    searchQuery: '',
    features: [],
    rating: null,
  },
  isLoading: false,
  error: null,
  lastUpdated: null,
  pagination: {
    page: 1,
    pageSize: 20,
    total: 0,
    hasMore: false,
  },
};

// Filter functions
const filterAmenities = (amenities: Amenity[], filters: AmenitiesState['filters']): Amenity[] => {
  return amenities.filter((amenity) => {
    // Vibe filter
    if (filters.vibe && amenity.primary_vibe !== filters.vibe) {
      return false;
    }
    
    // Terminal filter
    if (filters.terminal && amenity.terminal_code !== filters.terminal) {
      return false;
    }
    
    // Price range filter
    if (filters.priceRange && amenity.price_level) {
      const [min, max] = filters.priceRange;
      if (amenity.price_level < min || amenity.price_level > max) {
        return false;
      }
    }
    
    // Search query filter
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      const matchesName = amenity.name.toLowerCase().includes(query);
      const matchesDescription = amenity.description?.toLowerCase().includes(query) || false;
      const matchesFeatures = amenity.features?.some(feature => 
        feature.toLowerCase().includes(query)
      ) || false;
      
      if (!matchesName && !matchesDescription && !matchesFeatures) {
        return false;
      }
    }
    
    // Features filter
    if (filters.features.length > 0 && amenity.features) {
      const hasAllFeatures = filters.features.every(feature =>
        amenity.features!.includes(feature)
      );
      if (!hasAllFeatures) {
        return false;
      }
    }
    
    // Rating filter
    if (filters.rating && amenity.rating) {
      if (amenity.rating < filters.rating) {
        return false;
      }
    }
    
    return true;
  });
};

// Create store
export const useAmenitiesStore = create<AmenitiesState>()(
  devtools(
    subscribeWithSelector(
      immer((set, get) => ({
        ...initialState,
        
        // Data Actions
        setAmenities: (amenities) =>
          set((state) => {
            state.amenities = amenities;
            state.filteredAmenities = filterAmenities(amenities, state.filters);
            state.pagination.total = state.filteredAmenities.length;
            state.lastUpdated = new Date();
          }),
        
        addAmenity: (amenity) =>
          set((state) => {
            state.amenities.push(amenity);
            state.filteredAmenities = filterAmenities(state.amenities, state.filters);
            state.pagination.total = state.filteredAmenities.length;
          }),
        
        updateAmenity: (id, updates) =>
          set((state) => {
            const index = state.amenities.findIndex(a => a.id === id);
            if (index !== -1) {
              state.amenities[index] = { ...state.amenities[index], ...updates };
              state.filteredAmenities = filterAmenities(state.amenities, state.filters);
              state.pagination.total = state.filteredAmenities.length;
            }
          }),
        
        removeAmenity: (id) =>
          set((state) => {
            state.amenities = state.amenities.filter(a => a.id !== id);
            state.filteredAmenities = filterAmenities(state.amenities, state.filters);
            state.pagination.total = state.filteredAmenities.length;
          }),
        
        setSelectedAmenity: (amenity) =>
          set((state) => {
            state.selectedAmenity = amenity;
            if (amenity) {
              state.addToRecentlyViewed(amenity.id);
            }
          }),
        
        addToRecentlyViewed: (amenityId) =>
          set((state) => {
            if (!state.recentlyViewed.includes(amenityId)) {
              state.recentlyViewed.unshift(amenityId);
              // Keep only last 10
              if (state.recentlyViewed.length > 10) {
                state.recentlyViewed = state.recentlyViewed.slice(0, 10);
              }
            }
          }),
        
        toggleBookmark: (amenityId) =>
          set((state) => {
            const index = state.bookmarkedAmenities.indexOf(amenityId);
            if (index === -1) {
              state.bookmarkedAmenities.push(amenityId);
            } else {
              state.bookmarkedAmenities.splice(index, 1);
            }
          }),
        
        isBookmarked: (amenityId) => {
          const state = get();
          return state.bookmarkedAmenities.includes(amenityId);
        },
        
        setFilters: (filters) =>
          set((state) => {
            state.filters = { ...state.filters, ...filters };
          }),
        
        clearFilters: () =>
          set((state) => {
            state.filters = {
              vibe: null,
              terminal: null,
              priceRange: null,
              distance: null,
              searchQuery: '',
              features: [],
              rating: null,
            };
            state.filteredAmenities = state.amenities;
            state.pagination.total = state.filteredAmenities.length;
          }),
        
        applyFilters: () =>
          set((state) => {
            state.filteredAmenities = filterAmenities(state.amenities, state.filters);
            state.pagination.total = state.filteredAmenities.length;
            state.pagination.page = 1; // Reset to first page
          }),
        
        setLoading: (loading) =>
          set((state) => {
            state.isLoading = loading;
          }),
        
        setError: (error) =>
          set((state) => {
            state.error = error;
          }),
        
        setLastUpdated: (date) =>
          set((state) => {
            state.lastUpdated = date;
          }),
        
        setPagination: (pagination) =>
          set((state) => {
            state.pagination = { ...state.pagination, ...pagination };
          }),
        
        nextPage: () =>
          set((state) => {
            if (state.pagination.hasMore) {
              state.pagination.page += 1;
            }
          }),
        
        prevPage: () =>
          set((state) => {
            if (state.pagination.page > 1) {
              state.pagination.page -= 1;
            }
          }),
        
        resetPagination: () =>
          set((state) => {
            state.pagination = {
              page: 1,
              pageSize: 20,
              total: state.filteredAmenities.length,
              hasMore: state.filteredAmenities.length > 20,
            };
          }),
        
        searchAmenities: (query) =>
          set((state) => {
            state.filters.searchQuery = query;
            state.filteredAmenities = filterAmenities(state.amenities, state.filters);
            state.pagination.total = state.filteredAmenities.length;
            state.pagination.page = 1;
          }),
        
        reset: () =>
          set(() => ({ ...initialState })),
      }))
    ),
    {
      name: 'amenities-store',
      partialize: (state) => ({
        bookmarkedAmenities: state.bookmarkedAmenities,
        recentlyViewed: state.recentlyViewed,
        filters: state.filters,
      }),
    }
  )
);

// Selectors
export const useAmenities = () => useAmenitiesStore((state) => state.amenities);
export const useFilteredAmenities = () => useAmenitiesStore((state) => state.filteredAmenities);
export const useSelectedAmenity = () => useAmenitiesStore((state) => state.selectedAmenity);
export const useBookmarkedAmenities = () => useAmenitiesStore((state) => state.bookmarkedAmenities);
export const useRecentlyViewed = () => useAmenitiesStore((state) => state.recentlyViewed);
export const useAmenitiesFilters = () => useAmenitiesStore((state) => state.filters);
export const useAmenitiesPagination = () => useAmenitiesStore((state) => state.pagination);
export const useAmenitiesLoading = () => useAmenitiesStore((state) => state.isLoading);
export const useAmenitiesError = () => useAmenitiesStore((state) => state.error);

// Actions
export const useAmenitiesActions = () => useAmenitiesStore((state) => ({
  setAmenities: state.setAmenities,
  addAmenity: state.addAmenity,
  updateAmenity: state.updateAmenity,
  removeAmenity: state.removeAmenity,
  setSelectedAmenity: state.setSelectedAmenity,
  addToRecentlyViewed: state.addToRecentlyViewed,
  toggleBookmark: state.toggleBookmark,
  isBookmarked: state.isBookmarked,
  setFilters: state.setFilters,
  clearFilters: state.clearFilters,
  applyFilters: state.applyFilters,
  setLoading: state.setLoading,
  setError: state.setError,
  setLastUpdated: state.setLastUpdated,
  setPagination: state.setPagination,
  nextPage: state.nextPage,
  prevPage: state.prevPage,
  resetPagination: state.resetPagination,
  searchAmenities: state.searchAmenities,
  reset: state.reset,
}));

export default useAmenitiesStore;
