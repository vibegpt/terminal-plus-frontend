import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../main';
import { useAppStore } from '../../stores/useAppStore';

export function useVibeAmenities(vibe: string) {
  const terminal = useAppStore((state) => state.currentTerminal);
  
  return useQuery({
    queryKey: ['amenities', vibe, terminal?.code],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('amenity_detail')
        .select('*')
        .eq('terminal_code', terminal?.code)
        .contains('vibe_tags', [vibe])
        .limit(20);
      
      if (error) throw error;
      return data;
    },
    enabled: !!terminal && !!vibe,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useBookmarkAmenity() {
  const queryClient = useQueryClient();
  const { bookmarkAmenity } = useAppStore();
  
  return useMutation({
    mutationFn: async (amenityId: number) => {
      // Optimistic update
      bookmarkAmenity(amenityId);
      
      // Persist to backend
      const { error } = await supabase
        .from('user_bookmarks')
        .insert({ amenity_id: amenityId });
      
      if (error) throw error;
    },
    onError: (error, amenityId) => {
      // Revert optimistic update
      bookmarkAmenity(amenityId);
      console.error('Bookmark failed:', error);
    },
    onSettled: () => {
      // Refetch bookmarks
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
    },
  });
}

export function useAmenityDetails(amenityId: string) {
  return useQuery({
    queryKey: ['amenity', amenityId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('amenity_detail')
        .select('*')
        .eq('amenity_slug', amenityId)
        .single();
      
      if (error) throw error;
      return data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useAmenitiesByTerminal(terminalCode: string) {
  return useQuery({
    queryKey: ['amenities', 'terminal', terminalCode],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('amenity_detail')
        .select('*')
        .eq('terminal_code', terminalCode)
        .limit(50);
      
      if (error) throw error;
      return data;
    },
    enabled: !!terminalCode,
    staleTime: 5 * 60 * 1000,
  });
}

export function useSearchAmenities(query: string, filters?: {
  vibe?: string;
  terminal?: string;
  priceRange?: [number, number];
}) {
  const terminal = useAppStore((state) => state.currentTerminal);
  
  return useQuery({
    queryKey: ['amenities', 'search', query, filters],
    queryFn: async () => {
      let supabaseQuery = supabase
        .from('amenity_detail')
        .select('*')
        .or(`name.ilike.%${query}%,description.ilike.%${query}%`);
      
      if (filters?.terminal || terminal?.code) {
        supabaseQuery = supabaseQuery.eq('terminal_code', filters?.terminal || terminal?.code);
      }
      
      if (filters?.vibe) {
        supabaseQuery = supabaseQuery.contains('vibe_tags', [filters.vibe]);
      }
      
      if (filters?.priceRange) {
        const [min, max] = filters.priceRange;
        supabaseQuery = supabaseQuery.gte('price_level', min).lte('price_level', max);
      }
      
      const { data, error } = await supabaseQuery.limit(20);
      
      if (error) throw error;
      return data;
    },
    enabled: !!query && query.length > 2,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useBookmarkedAmenities() {
  const bookmarkedIds = useAppStore((state) => state.bookmarkedAmenities);
  
  return useQuery({
    queryKey: ['amenities', 'bookmarked', bookmarkedIds],
    queryFn: async () => {
      if (bookmarkedIds.length === 0) return [];
      
      const { data, error } = await supabase
        .from('amenity_detail')
        .select('*')
        .in('id', bookmarkedIds);
      
      if (error) throw error;
      return data;
    },
    enabled: bookmarkedIds.length > 0,
    staleTime: 5 * 60 * 1000,
  });
}

export function useRecentlyViewedAmenities() {
  const recentlyViewedIds = useAppStore((state) => state.recentlyViewed);
  
  return useQuery({
    queryKey: ['amenities', 'recently-viewed', recentlyViewedIds],
    queryFn: async () => {
      if (recentlyViewedIds.length === 0) return [];
      
      const { data, error } = await supabase
        .from('amenity_detail')
        .select('*')
        .in('id', recentlyViewedIds)
        .order('id', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: recentlyViewedIds.length > 0,
    staleTime: 5 * 60 * 1000,
  });
}
