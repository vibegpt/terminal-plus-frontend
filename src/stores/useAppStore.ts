import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { persist } from 'zustand/middleware';
import { devtools } from 'zustand/middleware';

// Types
export interface Amenity {
  id: number;
  name: string;
  description: string;
  terminal_code: string;
  price_level: '$' | '$$' | '$$$';
  vibe_tags: string[];
  opening_hours: string;
  logo_url?: string;
  website_url?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface Collection {
  id: number;
  name: string;
  description: string;
  vibe: string;
  icon: string;
  color: string;
  amenityCount: number;
  amenities: Amenity[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  preferences: {
    terminal: string;
    boardingTime?: string;
    favoriteVibes: string[];
    notifications: boolean;
    darkMode: boolean;
  };
}

export interface Bookmark {
  id: number;
  amenityId: number;
  amenityName: string;
  terminal: string;
  addedAt: Date;
  notes?: string;
}

export interface SearchState {
  query: string;
  filters: {
    terminal: string[];
    priceLevel: string[];
    vibeTags: string[];
    openNow: boolean;
  };
  sortBy: 'name' | 'distance' | 'price' | 'rating';
  sortOrder: 'asc' | 'desc';
}

export interface AppState {
  // User state
  user: User | null;
  isAuthenticated: boolean;
  
  // Data state
  amenities: Amenity[];
  collections: Collection[];
  bookmarks: Bookmark[];
  isLoading: boolean;
  error: string | null;
  
  // UI state
  selectedTerminal: string;
  boardingTime: string;
  currentVibe: string | null;
  searchState: SearchState;
  
  // App state
  isOnline: boolean;
  lastSyncTime: Date | null;
  theme: 'light' | 'dark';
  
  // Actions
  setUser: (user: User | null) => void;
  setAuthenticated: (isAuthenticated: boolean) => void;
  
  setAmenities: (amenities: Amenity[]) => void;
  setCollections: (collections: Collection[]) => void;
  addAmenity: (amenity: Amenity) => void;
  updateAmenity: (id: number, updates: Partial<Amenity>) => void;
  removeAmenity: (id: number) => void;
  
  addBookmark: (amenity: Amenity) => void;
  removeBookmark: (amenityId: number) => void;
  updateBookmark: (amenityId: number, updates: Partial<Bookmark>) => void;
  isBookmarked: (amenityId: number) => boolean;
  
  setSelectedTerminal: (terminal: string) => void;
  setBoardingTime: (time: string) => void;
  setCurrentVibe: (vibe: string | null) => void;
  
  updateSearchQuery: (query: string) => void;
  updateSearchFilters: (filters: Partial<SearchState['filters']>) => void;
  setSortBy: (sortBy: SearchState['sortBy']) => void;
  setSortOrder: (sortOrder: SearchState['sortOrder']) => void;
  clearSearch: () => void;
  
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  setOnline: (isOnline: boolean) => void;
  setLastSyncTime: (time: Date) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  
  // Computed selectors
  getFilteredAmenities: () => Amenity[];
  getBookmarkedAmenities: () => Amenity[];
  getAmenitiesByTerminal: (terminal: string) => Amenity[];
  getAmenitiesByVibe: (vibe: string) => Amenity[];
}

// Initial state
const initialState = {
  user: null,
  isAuthenticated: false,
  amenities: [],
  collections: [],
  bookmarks: [],
  isLoading: false,
  error: null,
  selectedTerminal: 'SIN-T1',
  boardingTime: '',
  currentVibe: null,
  searchState: {
    query: '',
    filters: {
      terminal: [],
      priceLevel: [],
      vibeTags: [],
      openNow: false,
    },
    sortBy: 'name' as const,
    sortOrder: 'asc' as const,
  },
  isOnline: true,
  lastSyncTime: null,
  theme: 'dark' as const,
};

// Create the store
export const useAppStore = create<AppState>()(
  devtools(
    persist(
      immer((set, get) => ({
        ...initialState,
        
        // User actions
        setUser: (user) => set((state) => {
          state.user = user;
        }),
        
        setAuthenticated: (isAuthenticated) => set((state) => {
          state.isAuthenticated = isAuthenticated;
        }),
        
        // Data actions
        setAmenities: (amenities) => set((state) => {
          state.amenities = amenities;
        }),
        
        setCollections: (collections) => set((state) => {
          state.collections = collections;
        }),
        
        addAmenity: (amenity) => set((state) => {
          state.amenities.push(amenity);
        }),
        
        updateAmenity: (id, updates) => set((state) => {
          const index = state.amenities.findIndex(a => a.id === id);
          if (index !== -1) {
            Object.assign(state.amenities[index], updates);
          }
        }),
        
        removeAmenity: (id) => set((state) => {
          state.amenities = state.amenities.filter(a => a.id !== id);
        }),
        
        // Bookmark actions
        addBookmark: (amenity) => set((state) => {
          const bookmark: Bookmark = {
            id: Date.now(),
            amenityId: amenity.id,
            amenityName: amenity.name,
            terminal: amenity.terminal_code,
            addedAt: new Date(),
          };
          state.bookmarks.push(bookmark);
        }),
        
        removeBookmark: (amenityId) => set((state) => {
          state.bookmarks = state.bookmarks.filter(b => b.amenityId !== amenityId);
        }),
        
        updateBookmark: (amenityId, updates) => set((state) => {
          const bookmark = state.bookmarks.find(b => b.amenityId === amenityId);
          if (bookmark) {
            Object.assign(bookmark, updates);
          }
        }),
        
        isBookmarked: (amenityId) => {
          const state = get();
          return state.bookmarks.some(b => b.amenityId === amenityId);
        },
        
        // UI actions
        setSelectedTerminal: (terminal) => set((state) => {
          state.selectedTerminal = terminal;
        }),
        
        setBoardingTime: (time) => set((state) => {
          state.boardingTime = time;
        }),
        
        setCurrentVibe: (vibe) => set((state) => {
          state.currentVibe = vibe;
        }),
        
        // Search actions
        updateSearchQuery: (query) => set((state) => {
          state.searchState.query = query;
        }),
        
        updateSearchFilters: (filters) => set((state) => {
          Object.assign(state.searchState.filters, filters);
        }),
        
        setSortBy: (sortBy) => set((state) => {
          state.searchState.sortBy = sortBy;
        }),
        
        setSortOrder: (sortOrder) => set((state) => {
          state.searchState.sortOrder = sortOrder;
        }),
        
        clearSearch: () => set((state) => {
          state.searchState = initialState.searchState;
        }),
        
        // App actions
        setLoading: (isLoading) => set((state) => {
          state.isLoading = isLoading;
        }),
        
        setError: (error) => set((state) => {
          state.error = error;
        }),
        
        setOnline: (isOnline) => set((state) => {
          state.isOnline = isOnline;
        }),
        
        setLastSyncTime: (time) => set((state) => {
          state.lastSyncTime = time;
        }),
        
        setTheme: (theme) => set((state) => {
          state.theme = theme;
        }),
        
        // Computed selectors
        getFilteredAmenities: () => {
          const state = get();
          let filtered = [...state.amenities];
          
          // Apply search query
          if (state.searchState.query) {
            const query = state.searchState.query.toLowerCase();
            filtered = filtered.filter(amenity =>
              amenity.name.toLowerCase().includes(query) ||
              amenity.description.toLowerCase().includes(query) ||
              amenity.vibe_tags.some(tag => tag.toLowerCase().includes(query))
            );
          }
          
          // Apply filters
          const { filters } = state.searchState;
          if (filters.terminal.length > 0) {
            filtered = filtered.filter(amenity =>
              filters.terminal.includes(amenity.terminal_code)
            );
          }
          
          if (filters.priceLevel.length > 0) {
            filtered = filtered.filter(amenity =>
              filters.priceLevel.includes(amenity.price_level)
            );
          }
          
          if (filters.vibeTags.length > 0) {
            filtered = filtered.filter(amenity =>
              amenity.vibe_tags.some(tag => filters.vibeTags.includes(tag))
            );
          }
          
          // Apply sorting
          filtered.sort((a, b) => {
            let comparison = 0;
            
            switch (state.searchState.sortBy) {
              case 'name':
                comparison = a.name.localeCompare(b.name);
                break;
              case 'price':
                const priceOrder = { '$': 1, '$$': 2, '$$$': 3 };
                comparison = priceOrder[a.price_level] - priceOrder[b.price_level];
                break;
              case 'distance':
                // For now, sort by terminal (could be enhanced with actual distance)
                comparison = a.terminal_code.localeCompare(b.terminal_code);
                break;
              case 'rating':
                // Placeholder - would need rating data
                comparison = 0;
                break;
            }
            
            return state.searchState.sortOrder === 'desc' ? -comparison : comparison;
          });
          
          return filtered;
        },
        
        getBookmarkedAmenities: () => {
          const state = get();
          return state.amenities.filter(amenity =>
            state.bookmarks.some(bookmark => bookmark.amenityId === amenity.id)
          );
        },
        
        getAmenitiesByTerminal: (terminal) => {
          const state = get();
          return state.amenities.filter(amenity => amenity.terminal_code === terminal);
        },
        
        getAmenitiesByVibe: (vibe) => {
          const state = get();
          return state.amenities.filter(amenity =>
            amenity.vibe_tags.includes(vibe)
          );
        },
      })),
      {
        name: 'terminal-plus-store',
        partialize: (state) => ({
          user: state.user,
          selectedTerminal: state.selectedTerminal,
          boardingTime: state.boardingTime,
          bookmarks: state.bookmarks,
          searchState: state.searchState,
          theme: state.theme,
        }),
      }
    ),
    {
      name: 'terminal-plus-store',
    }
  )
);

// Selectors for performance optimization
export const useAmenities = () => useAppStore((state) => state.amenities);
export const useCollections = () => useAppStore((state) => state.collections);
export const useBookmarks = () => useAppStore((state) => state.bookmarks);
export const useUser = () => useAppStore((state) => state.user);
export const useSelectedTerminal = () => useAppStore((state) => state.selectedTerminal);
export const useSearchState = () => useAppStore((state) => state.searchState);
export const useFilteredAmenities = () => useAppStore((state) => state.getFilteredAmenities());
export const useBookmarkedAmenities = () => useAppStore((state) => state.getBookmarkedAmenities());