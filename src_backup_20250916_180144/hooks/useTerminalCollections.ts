// src/hooks/useTerminalCollections.ts
// Custom hook to integrate Best Of collections with existing Terminal+ data

import { useMemo } from 'react';
import { useAmenities } from '@/hooks/useAmenities';
import { useVoiceEmotion } from '@/hooks/useVoiceEmotion';
import { useSmartRecommendations } from '@/hooks/useSmartRecommendations';
import { generateCollectionsFromAmenities, COLLECTION_CONFIGS } from '@/utils/dataTransformers';
import type { Vibe } from '@/types/common.types';

interface UseTerminalCollectionsProps {
  terminalCode: string;
  currentVibe?: Vibe;
  journeyPhase?: 'departure' | 'transit' | 'arrival';
}

interface TerminalStats {
  totalExperiences: number;
  avgRating: number;
  totalPlays: number;
  duration: string;
}

export const useTerminalCollections = ({
  terminalCode,
  currentVibe,
  journeyPhase = 'transit'
}: UseTerminalCollectionsProps) => {
  
  // Existing hooks
  const { amenities, loading: amenitiesLoading } = useAmenities();
  const { currentEmotion, isListening } = useVoiceEmotion();
  const { recommendations, loading: recommendationsLoading } = useSmartRecommendations();

  // Filter amenities by terminal
  const terminalAmenities = useMemo(() => {
    if (!amenities?.length) return [];
    
    return amenities.filter(amenity => {
      const amenityTerminal = amenity.terminal_code || amenity.terminal || '';
      return amenityTerminal.toLowerCase() === terminalCode.toLowerCase() ||
             !amenityTerminal; // Include amenities without terminal specification
    });
  }, [amenities, terminalCode]);

  // Generate collections with emotion and vibe integration
  const collections = useMemo(() => {
    if (!terminalAmenities.length) return [];
    
    // Determine effective vibe from current emotion or passed vibe
    let effectiveVibe = currentVibe;
    
    if (!effectiveVibe && currentEmotion) {
      // Map emotions to vibes
      const emotionVibeMap: Record<string, Vibe> = {
        'stressed': 'comfort',
        'anxious': 'chill', 
        'tired': 'comfort',
        'excited': 'explore',
        'happy': 'explore',
        'focused': 'work',
        'hungry': 'refuel',
        'bored': 'explore',
        'relaxed': 'chill',
        'energetic': 'explore'
      };
      
      effectiveVibe = emotionVibeMap[currentEmotion.toLowerCase()] || 'explore';
    }

    // Adjust collections based on journey phase
    const phaseAdjustedCollections = COLLECTION_CONFIGS.map(config => {
      let adjustedConfig = { ...config };
      
      switch (journeyPhase) {
        case 'departure':
          // Prioritize quick essentials and comfort for departure
          if (config.id === 'quick-essentials') {
            adjustedConfig.priority = 1;
          } else if (config.id === 'comfort-essentials') {
            adjustedConfig.priority = 2;
          }
          break;
          
        case 'transit':
          // Balance all collections for transit
          // Default priorities work well
          break;
          
        case 'arrival':
          // Prioritize must-see and foodie favorites for arrival
          if (config.id === 'must-see') {
            adjustedConfig.priority = 1;
          } else if (config.id === 'foodie-favorites') {
            adjustedConfig.priority = 2;
          }
          break;
      }
      
      return adjustedConfig;
    });

    return generateCollectionsFromAmenities(
      terminalAmenities,
      terminalCode,
      effectiveVibe
    );
  }, [terminalAmenities, terminalCode, currentVibe, currentEmotion, journeyPhase]);

  // Calculate terminal statistics
  const terminalStats = useMemo((): TerminalStats => {
    if (!terminalAmenities.length) {
      return {
        totalExperiences: 0,
        avgRating: 0,
        totalPlays: 0,
        duration: '0-0 hours'
      };
    }

    const totalExperiences = terminalAmenities.length;
    const avgRating = terminalAmenities.reduce((sum, amenity) => 
      sum + (amenity.rating || 4.0), 0) / totalExperiences;
    
    const totalPlays = collections.reduce((sum, collection) => 
      sum + collection.plays, 0);
    
    // Estimate duration based on number of experiences
    const estimatedHours = Math.max(2, Math.min(6, Math.ceil(totalExperiences / 8)));
    const duration = `${estimatedHours}-${estimatedHours + 2} hours`;

    return {
      totalExperiences,
      avgRating: Math.round(avgRating * 10) / 10,
      totalPlays,
      duration
    };
  }, [terminalAmenities, collections]);

  // Get featured collection (highest priority with items)
  const featuredCollection = useMemo(() => {
    return collections.find(collection => collection.items.length > 0) || null;
  }, [collections]);

  // Get collections by vibe match
  const getCollectionsByVibe = (vibe: Vibe) => {
    return collections.filter(collection => 
      collection.filters.vibes?.includes(vibe.toLowerCase())
    );
  };

  // Get quick access collections (for departure phase)
  const quickAccessCollections = useMemo(() => {
    if (journeyPhase !== 'departure') return [];
    
    return collections.filter(collection => 
      ['quick-essentials', 'comfort-essentials'].includes(collection.id)
    );
  }, [collections, journeyPhase]);

  // Get discovery collections (for arrival phase)
  const discoveryCollections = useMemo(() => {
    if (journeyPhase !== 'arrival') return [];
    
    return collections.filter(collection => 
      ['must-see', 'foodie-favorites', 'shopping-therapy'].includes(collection.id)
    );
  }, [collections, journeyPhase]);

  // Loading state
  const loading = amenitiesLoading || recommendationsLoading;

  // Error state
  const hasError = !loading && terminalAmenities.length === 0;

  return {
    // Core data
    collections,
    terminalAmenities,
    terminalStats,
    
    // Featured content
    featuredCollection,
    quickAccessCollections,
    discoveryCollections,
    
    // Utility functions
    getCollectionsByVibe,
    
    // State
    loading,
    hasError,
    isListening,
    
    // Context
    currentEmotion,
    journeyPhase,
    terminalCode
  };
};
