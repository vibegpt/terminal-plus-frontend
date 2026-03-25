import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { devtools, subscribeWithSelector } from 'zustand/middleware';

// Types
interface Collection {
  id: string;
  name: string;
  description: string;
  image_url?: string;
  terminal_code: string;
  primary_vibe: string;
  amenity_count: number;
  amenities: string[]; // Array of amenity IDs
  created_at: string;
  updated_at: string;
  is_featured: boolean;
  is_smart7: boolean;
  tags: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  estimated_duration: number; // in minutes
  distance: number; // in meters
}

interface CollectionsState {
  // Data
  collections: Collection[];
  filteredCollections: Collection[];
  selectedCollection: Collection | null;
  featuredCollections: Collection[];
  smart7Collections: Collection[];
  
  // Filters
  filters: {
    vibe: string | null;
    terminal: string | null;
    difficulty: string | null;
    duration: [number, number] | null;
    distance: number | null;
    searchQuery: string;
    tags: string[];
    isFeatured: boolean | null;
    isSmart7: boolean | null;
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
  setCollections: (collections: Collection[]) => void;
  addCollection: (collection: Collection) => void;
  updateCollection: (id: string, updates: Partial<Collection>) => void;
  removeCollection: (id: string) => void;
  
  setSelectedCollection: (collection: Collection | null) => void;
  
  setFilters: (filters: Partial<CollectionsState['filters']>) => void;
  clearFilters: () => void;
  applyFilters: () => void;
  
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setLastUpdated: (date: Date) => void;
  
  setPagination: (pagination: Partial<CollectionsState['pagination']>) => void;
  nextPage: () => void;
  prevPage: () => void;
  resetPagination: () => void;
  
  // Search
  searchCollections: (query: string) => void;
  
  // Special collections
  setFeaturedCollections: (collections: Collection[]) => void;
  setSmart7Collections: (collections: Collection[]) => void;
  
  // Reset
  reset: () => void;
}

// Initial state
const initialState = {
  collections: [],
  filteredCollections: [],
  selectedCollection: null,
  featuredCollections: [],
  smart7Collections: [],
  filters: {
    vibe: null,
    terminal: null,
    difficulty: null,
    duration: null,
    distance: null,
    searchQuery: '',
    tags: [],
    isFeatured: null,
    isSmart7: null,
  },
  isLoading: false,
  error: null,
  lastUpdated: null,
  pagination: {
    page: 1,
    pageSize: 12,
    total: 0,
    hasMore: false,
  },
};

// Filter functions
const filterCollections = (collections: Collection[], filters: CollectionsState['filters']): Collection[] => {
  return collections.filter((collection) => {
    // Vibe filter
    if (filters.vibe && collection.primary_vibe !== filters.vibe) {
      return false;
    }
    
    // Terminal filter
    if (filters.terminal && collection.terminal_code !== filters.terminal) {
      return false;
    }
    
    // Difficulty filter
    if (filters.difficulty && collection.difficulty !== filters.difficulty) {
      return false;
    }
    
    // Duration filter
    if (filters.duration && collection.estimated_duration) {
      const [min, max] = filters.duration;
      if (collection.estimated_duration < min || collection.estimated_duration > max) {
        return false;
      }
    }
    
    // Distance filter
    if (filters.distance && collection.distance) {
      if (collection.distance > filters.distance) {
        return false;
      }
    }
    
    // Search query filter
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      const matchesName = collection.name.toLowerCase().includes(query);
      const matchesDescription = collection.description.toLowerCase().includes(query);
      const matchesTags = collection.tags.some(tag => 
        tag.toLowerCase().includes(query)
      );
      
      if (!matchesName && !matchesDescription && !matchesTags) {
        return false;
      }
    }
    
    // Tags filter
    if (filters.tags.length > 0) {
      const hasAllTags = filters.tags.every(tag =>
        collection.tags.includes(tag)
      );
      if (!hasAllTags) {
        return false;
      }
    }
    
    // Featured filter
    if (filters.isFeatured !== null && collection.is_featured !== filters.isFeatured) {
      return false;
    }
    
    // Smart7 filter
    if (filters.isSmart7 !== null && collection.is_smart7 !== filters.isSmart7) {
      return false;
    }
    
    return true;
  });
};

// Create store
export const useCollectionsStore = create<CollectionsState>()(
  devtools(
    subscribeWithSelector(
      immer((set, get) => ({
        ...initialState,
        
        // Data Actions
        setCollections: (collections) =>
          set((state) => {
            state.collections = collections;
            state.filteredCollections = filterCollections(collections, state.filters);
            state.pagination.total = state.filteredCollections.length;
            state.lastUpdated = new Date();
            
            // Update featured and smart7 collections
            state.featuredCollections = collections.filter(c => c.is_featured);
            state.smart7Collections = collections.filter(c => c.is_smart7);
          }),
        
        addCollection: (collection) =>
          set((state) => {
            state.collections.push(collection);
            state.filteredCollections = filterCollections(state.collections, state.filters);
            state.pagination.total = state.filteredCollections.length;
            
            if (collection.is_featured) {
              state.featuredCollections.push(collection);
            }
            if (collection.is_smart7) {
              state.smart7Collections.push(collection);
            }
          }),
        
        updateCollection: (id, updates) =>
          set((state) => {
            const index = state.collections.findIndex(c => c.id === id);
            if (index !== -1) {
              state.collections[index] = { ...state.collections[index], ...updates };
              state.filteredCollections = filterCollections(state.collections, state.filters);
              state.pagination.total = state.filteredCollections.length;
              
              // Update featured and smart7 collections
              state.featuredCollections = state.collections.filter(c => c.is_featured);
              state.smart7Collections = state.collections.filter(c => c.is_smart7);
            }
          }),
        
        removeCollection: (id) =>
          set((state) => {
            state.collections = state.collections.filter(c => c.id !== id);
            state.filteredCollections = filterCollections(state.collections, state.filters);
            state.pagination.total = state.filteredCollections.length;
            
            // Update featured and smart7 collections
            state.featuredCollections = state.collections.filter(c => c.is_featured);
            state.smart7Collections = state.collections.filter(c => c.is_smart7);
          }),
        
        setSelectedCollection: (collection) =>
          set((state) => {
            state.selectedCollection = collection;
          }),
        
        setFilters: (filters) =>
          set((state) => {
            state.filters = { ...state.filters, ...filters };
          }),
        
        clearFilters: () =>
          set((state) => {
            state.filters = {
              vibe: null,
              terminal: null,
              difficulty: null,
              duration: null,
              distance: null,
              searchQuery: '',
              tags: [],
              isFeatured: null,
              isSmart7: null,
            };
            state.filteredCollections = state.collections;
            state.pagination.total = state.filteredCollections.length;
          }),
        
        applyFilters: () =>
          set((state) => {
            state.filteredCollections = filterCollections(state.collections, state.filters);
            state.pagination.total = state.filteredCollections.length;
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
              pageSize: 12,
              total: state.filteredCollections.length,
              hasMore: state.filteredCollections.length > 12,
            };
          }),
        
        searchCollections: (query) =>
          set((state) => {
            state.filters.searchQuery = query;
            state.filteredCollections = filterCollections(state.collections, state.filters);
            state.pagination.total = state.filteredCollections.length;
            state.pagination.page = 1;
          }),
        
        setFeaturedCollections: (collections) =>
          set((state) => {
            state.featuredCollections = collections;
          }),
        
        setSmart7Collections: (collections) =>
          set((state) => {
            state.smart7Collections = collections;
          }),
        
        reset: () =>
          set(() => ({ ...initialState })),
      }))
    ),
    {
      name: 'collections-store',
      partialize: (state) => ({
        filters: state.filters,
      }),
    }
  )
);

// Selectors
export const useCollections = () => useCollectionsStore((state) => state.collections);
export const useFilteredCollections = () => useCollectionsStore((state) => state.filteredCollections);
export const useSelectedCollection = () => useCollectionsStore((state) => state.selectedCollection);
export const useFeaturedCollections = () => useCollectionsStore((state) => state.featuredCollections);
export const useSmart7Collections = () => useCollectionsStore((state) => state.smart7Collections);
export const useCollectionsFilters = () => useCollectionsStore((state) => state.filters);
export const useCollectionsPagination = () => useCollectionsStore((state) => state.pagination);
export const useCollectionsLoading = () => useCollectionsStore((state) => state.isLoading);
export const useCollectionsError = () => useCollectionsStore((state) => state.error);

// Actions
export const useCollectionsActions = () => useCollectionsStore((state) => ({
  setCollections: state.setCollections,
  addCollection: state.addCollection,
  updateCollection: state.updateCollection,
  removeCollection: state.removeCollection,
  setSelectedCollection: state.setSelectedCollection,
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
  searchCollections: state.searchCollections,
  setFeaturedCollections: state.setFeaturedCollections,
  setSmart7Collections: state.setSmart7Collections,
  reset: state.reset,
}));

export default useCollectionsStore;
