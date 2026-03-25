import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { persist } from 'zustand/middleware';
import { devtools } from 'zustand/middleware';

export interface SearchFilters {
  terminal: string[];
  priceLevel: string[];
  vibeTags: string[];
  openNow: boolean;
  hasWiFi: boolean;
  hasParking: boolean;
  distance: {
    min: number;
    max: number;
  };
}

export interface SortOptions {
  by: 'name' | 'distance' | 'price' | 'rating' | 'popularity';
  order: 'asc' | 'desc';
}

export interface SearchHistoryItem {
  query: string;
  timestamp: Date;
  resultCount: number;
}

export interface SearchState {
  query: string;
  filters: SearchFilters;
  sortOptions: SortOptions;
  isSearching: boolean;
  searchHistory: SearchHistoryItem[];
  recentSearches: string[];
  savedSearches: string[];
  searchResults: any[];
  totalResults: number;
  currentPage: number;
  itemsPerPage: number;
  
  // Actions
  setQuery: (query: string) => void;
  clearQuery: () => void;
  
  updateFilters: (filters: Partial<SearchFilters>) => void;
  resetFilters: () => void;
  toggleFilter: (filterType: keyof SearchFilters, value: string | boolean) => void;
  
  setSortBy: (by: SortOptions['by']) => void;
  setSortOrder: (order: SortOptions['order']) => void;
  toggleSortOrder: () => void;
  
  setSearching: (isSearching: boolean) => void;
  setSearchResults: (results: any[], total: number) => void;
  clearSearchResults: () => void;
  
  addToHistory: (query: string, resultCount: number) => void;
  clearHistory: () => void;
  removeFromHistory: (timestamp: Date) => void;
  
  addRecentSearch: (query: string) => void;
  removeRecentSearch: (query: string) => void;
  clearRecentSearches: () => void;
  
  saveSearch: (query: string) => void;
  unsaveSearch: (query: string) => void;
  
  setPage: (page: number) => void;
  setItemsPerPage: (itemsPerPage: number) => void;
  
  // Computed
  getActiveFilters: () => Partial<SearchFilters>;
  hasActiveFilters: () => boolean;
  getSearchSuggestions: (partialQuery: string) => string[];
}

const initialFilters: SearchFilters = {
  terminal: [],
  priceLevel: [],
  vibeTags: [],
  openNow: false,
  hasWiFi: false,
  hasParking: false,
  distance: {
    min: 0,
    max: 1000,
  },
};

const initialSortOptions: SortOptions = {
  by: 'name',
  order: 'asc',
};

export const useSearchStore = create<SearchState>()(
  devtools(
    persist(
      immer((set, get) => ({
        query: '',
        filters: initialFilters,
        sortOptions: initialSortOptions,
        isSearching: false,
        searchHistory: [],
        recentSearches: [],
        savedSearches: [],
        searchResults: [],
        totalResults: 0,
        currentPage: 1,
        itemsPerPage: 20,
        
        setQuery: (query) => set((state) => {
          state.query = query;
        }),
        
        clearQuery: () => set((state) => {
          state.query = '';
        }),
        
        updateFilters: (filters) => set((state) => {
          Object.assign(state.filters, filters);
          state.currentPage = 1; // Reset to first page when filters change
        }),
        
        resetFilters: () => set((state) => {
          state.filters = { ...initialFilters };
          state.currentPage = 1;
        }),
        
        toggleFilter: (filterType, value) => set((state) => {
          if (typeof value === 'boolean') {
            // For boolean filters like openNow, hasWiFi, etc.
            state.filters[filterType] = value as any;
          } else {
            // For array filters like terminal, priceLevel, vibeTags
            const filterArray = state.filters[filterType] as string[];
            if (Array.isArray(filterArray)) {
              const index = filterArray.indexOf(value);
              if (index > -1) {
                filterArray.splice(index, 1);
              } else {
                filterArray.push(value);
              }
            }
          }
          state.currentPage = 1;
        }),
        
        setSortBy: (by) => set((state) => {
          state.sortOptions.by = by;
          state.currentPage = 1;
        }),
        
        setSortOrder: (order) => set((state) => {
          state.sortOptions.order = order;
          state.currentPage = 1;
        }),
        
        toggleSortOrder: () => set((state) => {
          state.sortOptions.order = state.sortOptions.order === 'asc' ? 'desc' : 'asc';
          state.currentPage = 1;
        }),
        
        setSearching: (isSearching) => set((state) => {
          state.isSearching = isSearching;
        }),
        
        setSearchResults: (results, total) => set((state) => {
          state.searchResults = results;
          state.totalResults = total;
        }),
        
        clearSearchResults: () => set((state) => {
          state.searchResults = [];
          state.totalResults = 0;
          state.currentPage = 1;
        }),
        
        addToHistory: (query, resultCount) => set((state) => {
          const historyItem: SearchHistoryItem = {
            query,
            timestamp: new Date(),
            resultCount,
          };
          
          // Remove existing entry with same query
          state.searchHistory = state.searchHistory.filter(item => item.query !== query);
          
          // Add new entry at the beginning
          state.searchHistory.unshift(historyItem);
          
          // Keep only last 50 items
          state.searchHistory = state.searchHistory.slice(0, 50);
        }),
        
        clearHistory: () => set((state) => {
          state.searchHistory = [];
        }),
        
        removeFromHistory: (timestamp) => set((state) => {
          state.searchHistory = state.searchHistory.filter(
            item => item.timestamp.getTime() !== timestamp.getTime()
          );
        }),
        
        addRecentSearch: (query) => set((state) => {
          // Remove if already exists
          state.recentSearches = state.recentSearches.filter(s => s !== query);
          
          // Add to beginning
          state.recentSearches.unshift(query);
          
          // Keep only last 10
          state.recentSearches = state.recentSearches.slice(0, 10);
        }),
        
        removeRecentSearch: (query) => set((state) => {
          state.recentSearches = state.recentSearches.filter(s => s !== query);
        }),
        
        clearRecentSearches: () => set((state) => {
          state.recentSearches = [];
        }),
        
        saveSearch: (query) => set((state) => {
          if (!state.savedSearches.includes(query)) {
            state.savedSearches.push(query);
          }
        }),
        
        unsaveSearch: (query) => set((state) => {
          state.savedSearches = state.savedSearches.filter(s => s !== query);
        }),
        
        setPage: (page) => set((state) => {
          state.currentPage = page;
        }),
        
        setItemsPerPage: (itemsPerPage) => set((state) => {
          state.itemsPerPage = itemsPerPage;
          state.currentPage = 1;
        }),
        
        getActiveFilters: () => {
          const state = get();
          const activeFilters: Partial<SearchFilters> = {};
          
          if (state.filters.terminal.length > 0) {
            activeFilters.terminal = state.filters.terminal;
          }
          
          if (state.filters.priceLevel.length > 0) {
            activeFilters.priceLevel = state.filters.priceLevel;
          }
          
          if (state.filters.vibeTags.length > 0) {
            activeFilters.vibeTags = state.filters.vibeTags;
          }
          
          if (state.filters.openNow) {
            activeFilters.openNow = state.filters.openNow;
          }
          
          if (state.filters.hasWiFi) {
            activeFilters.hasWiFi = state.filters.hasWiFi;
          }
          
          if (state.filters.hasParking) {
            activeFilters.hasParking = state.filters.hasParking;
          }
          
          return activeFilters;
        },
        
        hasActiveFilters: () => {
          const state = get();
          return (
            state.filters.terminal.length > 0 ||
            state.filters.priceLevel.length > 0 ||
            state.filters.vibeTags.length > 0 ||
            state.filters.openNow ||
            state.filters.hasWiFi ||
            state.filters.hasParking
          );
        },
        
        getSearchSuggestions: (partialQuery) => {
          const state = get();
          const query = partialQuery.toLowerCase();
          
          const suggestions = new Set<string>();
          
          // Add from recent searches
          state.recentSearches.forEach(search => {
            if (search.toLowerCase().includes(query)) {
              suggestions.add(search);
            }
          });
          
          // Add from saved searches
          state.savedSearches.forEach(search => {
            if (search.toLowerCase().includes(query)) {
              suggestions.add(search);
            }
          });
          
          // Add common airport terms
          const commonTerms = [
            'coffee', 'food', 'restaurant', 'shopping', 'duty free',
            'lounge', 'spa', 'pharmacy', 'atm', 'wifi', 'charging',
            'terminal 1', 'terminal 2', 'terminal 3', 'terminal 4', 'jewel'
          ];
          
          commonTerms.forEach(term => {
            if (term.toLowerCase().includes(query)) {
              suggestions.add(term);
            }
          });
          
          return Array.from(suggestions).slice(0, 8);
        },
      })),
      {
        name: 'terminal-plus-search',
        partialize: (state) => ({
          searchHistory: state.searchHistory,
          recentSearches: state.recentSearches,
          savedSearches: state.savedSearches,
          itemsPerPage: state.itemsPerPage,
        }),
      }
    ),
    {
      name: 'terminal-plus-search',
    }
  )
);

// Selectors
export const useSearchQuery = () => useSearchStore((state) => state.query);
export const useSearchFilters = () => useSearchStore((state) => state.filters);
export const useSortOptions = () => useSearchStore((state) => state.sortOptions);
export const useSearchResults = () => useSearchStore((state) => state.searchResults);
export const useSearchHistory = () => useSearchStore((state) => state.searchHistory);
export const useRecentSearches = () => useSearchStore((state) => state.recentSearches);
export const useSavedSearches = () => useSearchStore((state) => state.savedSearches);
export const useActiveFilters = () => useSearchStore((state) => state.getActiveFilters());
export const useHasActiveFilters = () => useSearchStore((state) => state.hasActiveFilters());
export const useSearchSuggestions = () => useSearchStore((state) => state.getSearchSuggestions);
