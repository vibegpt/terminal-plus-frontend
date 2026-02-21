import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { supabase } from '../main';

export function useOptimizedAmenities(terminal: string, vibe: string) {
  return useQuery({
    queryKey: ['amenities', terminal, vibe],
    queryFn: async () => {
      // Select only needed fields
      const { data, error } = await supabase
        .from('amenity_detail')
        .select('id, name, amenity_slug, logo_url, price_level')
        .eq('terminal_code', terminal)
        .eq('primary_vibe', vibe)
        .limit(10);
      
      if (error) throw error;
      return data;
    },
    
    // Cache aggressively
    staleTime: 5 * 60 * 1000,     // 5 minutes
    gcTime: 10 * 60 * 1000,       // 10 minutes (formerly cacheTime)
    
    // Network optimization
    refetchOnWindowFocus: false,
    refetchOnReconnect: 'always',
    retry: 2,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

// Optimized hook for collections
export function useOptimizedCollections(terminal: string) {
  return useQuery({
    queryKey: ['collections', terminal],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('collections')
        .select('collection_id, name, description, image_url, amenity_count')
        .eq('terminal_code', terminal)
        .limit(20);
      
      if (error) throw error;
      return data;
    },
    
    staleTime: 10 * 60 * 1000,    // 10 minutes
    gcTime: 30 * 60 * 1000,       // 30 minutes
    refetchOnWindowFocus: false,
    retry: 1,
  });
}

// Optimized hook for single amenity
export function useOptimizedAmenity(slug: string) {
  return useQuery({
    queryKey: ['amenity', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('amenity_detail')
        .select('*')
        .eq('amenity_slug', slug)
        .single();
      
      if (error) throw error;
      return data;
    },
    
    staleTime: 15 * 60 * 1000,    // 15 minutes
    gcTime: 60 * 60 * 1000,       // 1 hour
    refetchOnWindowFocus: false,
    retry: 2,
  });
}

// Prefetch hook for better UX
export function usePrefetchAmenities() {
  const queryClient = useQueryClient();
  
  const prefetchAmenity = useCallback((slug: string) => {
    queryClient.prefetchQuery({
      queryKey: ['amenity', slug],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('amenity_detail')
          .select('*')
          .eq('amenity_slug', slug)
          .single();
        
        if (error) throw error;
        return data;
      },
      staleTime: 15 * 60 * 1000,
    });
  }, [queryClient]);
  
  return { prefetchAmenity };
}

export default useOptimizedAmenities;
