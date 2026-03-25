import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useAppStore } from '../../stores/useAppStore';
import { supabase } from '../../main';

export function usePrefetchStrategy() {
  const queryClient = useQueryClient();
  const terminal = useAppStore((state) => state.currentTerminal);
  const selectedVibes = useAppStore((state) => state.selectedVibes);
  
  useEffect(() => {
    // Prefetch next likely vibes based on time
    const hour = new Date().getHours();
    const vibesToPrefetch = getVibesForTimeOfDay(hour);
    
    vibesToPrefetch.forEach(vibe => {
      queryClient.prefetchQuery({
        queryKey: ['amenities', vibe, terminal?.code],
        queryFn: () => fetchVibeAmenities(vibe, terminal?.code),
        staleTime: 10 * 60 * 1000,
      });
    });
  }, [terminal, queryClient]);
  
  // Prefetch adjacent vibes when user selects one
  useEffect(() => {
    selectedVibes.forEach(vibe => {
      const relatedVibes = getRelatedVibes(vibe);
      relatedVibes.forEach(relatedVibe => {
        queryClient.prefetchQuery({
          queryKey: ['amenities', relatedVibe, terminal?.code],
          queryFn: () => fetchVibeAmenities(relatedVibe, terminal?.code),
        });
      });
    });
  }, [selectedVibes, terminal, queryClient]);
}

async function fetchVibeAmenities(vibe: string, terminalCode?: string) {
  if (!terminalCode) return [];
  
  const { data, error } = await supabase
    .from('amenity_detail')
    .select('*')
    .eq('terminal_code', terminalCode)
    .contains('vibe_tags', [vibe])
    .limit(20);
  
  if (error) throw error;
  return data;
}

function getVibesForTimeOfDay(hour: number): string[] {
  if (hour >= 5 && hour < 11) return ['refuel', 'quick', 'work'];
  if (hour >= 11 && hour < 14) return ['refuel', 'chill'];
  if (hour >= 14 && hour < 18) return ['shop', 'discover', 'chill'];
  if (hour >= 18 && hour < 22) return ['refuel', 'shop', 'comfort'];
  return ['comfort', 'chill', 'quick'];
}

function getRelatedVibes(vibe: string): string[] {
  const relatedVibesMap: Record<string, string[]> = {
    'refuel': ['quick', 'comfort', 'chill'],
    'quick': ['refuel', 'work', 'comfort'],
    'work': ['quick', 'refuel', 'chill'],
    'chill': ['comfort', 'refuel', 'discover'],
    'comfort': ['chill', 'refuel', 'shop'],
    'shop': ['discover', 'comfort', 'chill'],
    'discover': ['shop', 'chill', 'comfort'],
  };
  
  return relatedVibesMap[vibe] || [];
}

// Hook for prefetching based on user behavior
export function useBehavioralPrefetch() {
  const queryClient = useQueryClient();
  const terminal = useAppStore((state) => state.currentTerminal);
  const preferences = useAppStore((state) => state.preferences);
  
  useEffect(() => {
    // Prefetch based on user preferences
    if (preferences.vibePreferences.length > 0) {
      preferences.vibePreferences.forEach(vibe => {
        queryClient.prefetchQuery({
          queryKey: ['amenities', vibe, terminal?.code],
          queryFn: () => fetchVibeAmenities(vibe, terminal?.code),
          staleTime: 15 * 60 * 1000, // 15 minutes for preferred vibes
        });
      });
    }
    
    // Prefetch based on price range
    if (preferences.priceRange !== 'any') {
      const priceLevel = getPriceLevel(preferences.priceRange);
      queryClient.prefetchQuery({
        queryKey: ['amenities', 'price', priceLevel, terminal?.code],
        queryFn: () => fetchAmenitiesByPrice(priceLevel, terminal?.code),
        staleTime: 10 * 60 * 1000,
      });
    }
  }, [preferences, terminal, queryClient]);
}

async function fetchAmenitiesByPrice(priceLevel: number, terminalCode?: string) {
  if (!terminalCode) return [];
  
  const { data, error } = await supabase
    .from('amenity_detail')
    .select('*')
    .eq('terminal_code', terminalCode)
    .eq('price_level', priceLevel)
    .limit(20);
  
  if (error) throw error;
  return data;
}

function getPriceLevel(priceRange: string): number {
  const priceMap: Record<string, number> = {
    '$': 1,
    '$$': 2,
    '$$$': 3,
  };
  
  return priceMap[priceRange] || 0;
}

// Hook for prefetching based on journey context
export function useJourneyPrefetch() {
  const queryClient = useQueryClient();
  const journey = useAppStore((state) => state.journey);
  const terminal = useAppStore((state) => state.currentTerminal);
  
  useEffect(() => {
    if (!journey || !terminal) return;
    
    // Prefetch amenities near the gate
    if (journey.gate) {
      queryClient.prefetchQuery({
        queryKey: ['amenities', 'near-gate', journey.gate, terminal.code],
        queryFn: () => fetchAmenitiesNearGate(journey.gate!, terminal.code),
        staleTime: 5 * 60 * 1000,
      });
    }
    
    // Prefetch amenities based on boarding time
    if (journey.boardingTime) {
      const timeToBoarding = journey.boardingTime.getTime() - Date.now();
      const hoursToBoarding = timeToBoarding / (1000 * 60 * 60);
      
      let vibesToPrefetch: string[] = [];
      
      if (hoursToBoarding > 2) {
        vibesToPrefetch = ['discover', 'shop', 'chill'];
      } else if (hoursToBoarding > 1) {
        vibesToPrefetch = ['refuel', 'quick', 'comfort'];
      } else {
        vibesToPrefetch = ['quick', 'refuel'];
      }
      
      vibesToPrefetch.forEach(vibe => {
        queryClient.prefetchQuery({
          queryKey: ['amenities', vibe, terminal.code],
          queryFn: () => fetchVibeAmenities(vibe, terminal.code),
          staleTime: 2 * 60 * 1000, // 2 minutes for time-sensitive prefetch
        });
      });
    }
  }, [journey, terminal, queryClient]);
}

async function fetchAmenitiesNearGate(gate: string, terminalCode: string) {
  const { data, error } = await supabase
    .from('amenity_detail')
    .select('*')
    .eq('terminal_code', terminalCode)
    .ilike('location', `%${gate}%`)
    .limit(10);
  
  if (error) throw error;
  return data;
}
