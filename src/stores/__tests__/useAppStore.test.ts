import { describe, it, expect, beforeEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useAppStore } from '../useAppStore';

// Mock amenity data
const mockAmenity = {
  id: 1,
  name: 'Starbucks',
  description: 'Coffee and light meals',
  terminal_code: 'T1',
  price_level: '$' as const,
  vibe_tags: ['coffee', 'quick'],
  opening_hours: '24/7',
  logo_url: 'https://example.com/logo.png'
};

const mockCollection = {
  id: 1,
  name: 'Coffee Collection',
  description: 'Best coffee spots',
  vibe: 'refuel',
  icon: '☕',
  color: '#667eea',
  amenityCount: 5,
  amenities: []
};

describe('useAppStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useAppStore.setState(useAppStore.getInitialState());
  });

  describe('Amenity Management', () => {
    it('should set amenities', () => {
      const { result } = renderHook(() => useAppStore());
      
      act(() => {
        result.current.setAmenities([mockAmenity]);
      });
      
      expect(result.current.amenities).toHaveLength(1);
      expect(result.current.amenities[0]).toEqual(mockAmenity);
    });

    it('should add amenity', () => {
      const { result } = renderHook(() => useAppStore());
      
      act(() => {
        result.current.addAmenity(mockAmenity);
      });
      
      expect(result.current.amenities).toHaveLength(1);
      expect(result.current.amenities[0]).toEqual(mockAmenity);
    });

    it('should update amenity', () => {
      const { result } = renderHook(() => useAppStore());
      
      act(() => {
        result.current.setAmenities([mockAmenity]);
        result.current.updateAmenity(1, { name: 'Updated Starbucks' });
      });
      
      expect(result.current.amenities[0].name).toBe('Updated Starbucks');
    });

    it('should remove amenity', () => {
      const { result } = renderHook(() => useAppStore());
      
      act(() => {
        result.current.setAmenities([mockAmenity]);
        result.current.removeAmenity(1);
      });
      
      expect(result.current.amenities).toHaveLength(0);
    });
  });

  describe('Bookmark Management', () => {
    it('should add bookmark', () => {
      const { result } = renderHook(() => useAppStore());
      
      act(() => {
        result.current.addBookmark(mockAmenity);
      });
      
      expect(result.current.bookmarks).toHaveLength(1);
      expect(result.current.bookmarks[0].amenityId).toBe(mockAmenity.id);
      expect(result.current.bookmarks[0].amenityName).toBe(mockAmenity.name);
    });

    it('should remove bookmark', () => {
      const { result } = renderHook(() => useAppStore());
      
      act(() => {
        result.current.addBookmark(mockAmenity);
        result.current.removeBookmark(mockAmenity.id);
      });
      
      expect(result.current.bookmarks).toHaveLength(0);
    });

    it('should check if amenity is bookmarked', () => {
      const { result } = renderHook(() => useAppStore());
      
      act(() => {
        result.current.addBookmark(mockAmenity);
      });
      
      expect(result.current.isBookmarked(mockAmenity.id)).toBe(true);
      expect(result.current.isBookmarked(999)).toBe(false);
    });

    it('should update bookmark', () => {
      const { result } = renderHook(() => useAppStore());
      
      act(() => {
        result.current.addBookmark(mockAmenity);
        result.current.updateBookmark(mockAmenity.id, { notes: 'Great coffee!' });
      });
      
      expect(result.current.bookmarks[0].notes).toBe('Great coffee!');
    });
  });

  describe('Search and Filtering', () => {
    it('should update search query', () => {
      const { result } = renderHook(() => useAppStore());
      
      act(() => {
        result.current.updateSearchQuery('coffee');
      });
      
      expect(result.current.searchState.query).toBe('coffee');
    });

    it('should update search filters', () => {
      const { result } = renderHook(() => useAppStore());
      
      act(() => {
        result.current.updateSearchFilters({ 
          terminal: ['T1'], 
          priceLevel: ['$'] 
        });
      });
      
      expect(result.current.searchState.filters.terminal).toEqual(['T1']);
      expect(result.current.searchState.filters.priceLevel).toEqual(['$']);
    });

    it('should clear search', () => {
      const { result } = renderHook(() => useAppStore());
      
      act(() => {
        result.current.updateSearchQuery('coffee');
        result.current.updateSearchFilters({ terminal: ['T1'] });
        result.current.clearSearch();
      });
      
      expect(result.current.searchState.query).toBe('');
      expect(result.current.searchState.filters.terminal).toEqual([]);
    });

    it('should set sort options', () => {
      const { result } = renderHook(() => useAppStore());
      
      act(() => {
        result.current.setSortBy('price');
        result.current.setSortOrder('desc');
      });
      
      expect(result.current.searchState.sortBy).toBe('price');
      expect(result.current.searchState.sortOrder).toBe('desc');
    });
  });

  describe('UI State', () => {
    it('should set selected terminal', () => {
      const { result } = renderHook(() => useAppStore());
      
      act(() => {
        result.current.setSelectedTerminal('SIN-T3');
      });
      
      expect(result.current.selectedTerminal).toBe('SIN-T3');
    });

    it('should set boarding time', () => {
      const { result } = renderHook(() => useAppStore());
      
      act(() => {
        result.current.setBoardingTime('14:30');
      });
      
      expect(result.current.boardingTime).toBe('14:30');
    });

    it('should set current vibe', () => {
      const { result } = renderHook(() => useAppStore());
      
      act(() => {
        result.current.setCurrentVibe('refuel');
      });
      
      expect(result.current.currentVibe).toBe('refuel');
    });

    it('should set loading state', () => {
      const { result } = renderHook(() => useAppStore());
      
      act(() => {
        result.current.setLoading(true);
      });
      
      expect(result.current.isLoading).toBe(true);
    });

    it('should set error state', () => {
      const { result } = renderHook(() => useAppStore());
      
      act(() => {
        result.current.setError('Something went wrong');
      });
      
      expect(result.current.error).toBe('Something went wrong');
    });

    it('should set theme', () => {
      const { result } = renderHook(() => useAppStore());
      
      act(() => {
        result.current.setTheme('light');
      });
      
      expect(result.current.theme).toBe('light');
    });
  });

  describe('Computed Selectors', () => {
    it('should get filtered amenities', () => {
      const { result } = renderHook(() => useAppStore());
      
      const amenities = [
        { ...mockAmenity, id: 1, name: 'Starbucks', terminal_code: 'T1', vibe_tags: ['coffee'] },
        { ...mockAmenity, id: 2, name: 'McDonald\'s', terminal_code: 'T2', vibe_tags: ['food'] },
        { ...mockAmenity, id: 3, name: 'Coffee Bean', terminal_code: 'T1', vibe_tags: ['coffee'] }
      ];
      
      act(() => {
        result.current.setAmenities(amenities);
        result.current.updateSearchQuery('McDonald');
      });
      
      const filtered = result.current.getFilteredAmenities();
      expect(filtered).toHaveLength(1);
      expect(filtered[0].name).toBe('McDonald\'s');
    });

    it('should get amenities by terminal', () => {
      const { result } = renderHook(() => useAppStore());
      
      const amenities = [
        { ...mockAmenity, id: 1, terminal_code: 'T1' },
        { ...mockAmenity, id: 2, terminal_code: 'T2' },
        { ...mockAmenity, id: 3, terminal_code: 'T1' }
      ];
      
      act(() => {
        result.current.setAmenities(amenities);
      });
      
      const t1Amenities = result.current.getAmenitiesByTerminal('T1');
      expect(t1Amenities).toHaveLength(2);
      
      const t2Amenities = result.current.getAmenitiesByTerminal('T2');
      expect(t2Amenities).toHaveLength(1);
    });

    it('should get amenities by vibe', () => {
      const { result } = renderHook(() => useAppStore());
      
      const amenities = [
        { ...mockAmenity, id: 1, vibe_tags: ['coffee', 'quick'] },
        { ...mockAmenity, id: 2, vibe_tags: ['food', 'quick'] },
        { ...mockAmenity, id: 3, vibe_tags: ['coffee', 'comfort'] }
      ];
      
      act(() => {
        result.current.setAmenities(amenities);
      });
      
      const coffeeAmenities = result.current.getAmenitiesByVibe('coffee');
      expect(coffeeAmenities).toHaveLength(2);
      
      const foodAmenities = result.current.getAmenitiesByVibe('food');
      expect(foodAmenities).toHaveLength(1);
    });
  });
});
