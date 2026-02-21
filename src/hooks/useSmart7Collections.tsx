import { useState, useMemo } from 'react';
import { useCollectionAmenities } from './useSupabaseCollections';
import { Smart7Algorithm } from '../lib/smart7Algorithm';
import { UserContext } from '../types/smart7.types';
import { useSimpleJourneyContext } from './useSimpleJourneyContext';

export const useSmart7Collections = (collectionId: string) => {
  const [rotation, setRotation] = useState(0);
  const { location, phase, userState, timeContext } = useSimpleJourneyContext();
  
  // Get all amenities for the collection
  const { amenities: allAmenities, loading, error } = useCollectionAmenities(collectionId);
  
  // Build user context from journey context
  const userContext: UserContext = useMemo(() => {
    // Calculate layover time based on phase
    let layoverMinutes = 60; // Default
    if (phase === 'transit') layoverMinutes = 120; // Typical transit
    if (phase === 'departure') layoverMinutes = 45; // Pre-flight
    if (phase === 'arrival') layoverMinutes = 90; // Post-arrival
    
    // Determine if user is rushing based on time available
    const isRushing = userState.timeAvailable === 'rushed' || layoverMinutes < 30;
    
    return {
      currentTerminal: location.terminal || 'T1',
      layoverMinutes,
      currentTime: new Date(),
      previousChoices: [], // TODO: Track visited amenities
      dietaryPreferences: [], // TODO: Add dietary preferences to user state
      pricePreference: 'moderate' as const, // TODO: Add price preference to user state
      isRushing,
    };
  }, [location, phase, userState, timeContext]);
  
  // Create Smart7 algorithm instance
  const algorithm = useMemo(
    () => new Smart7Algorithm(userContext),
    [userContext]
  );
  
  // Get Smart 7 amenities
  const smart7Amenities = useMemo(() => {
    if (!allAmenities || allAmenities.length === 0) return [];
    
    // Transform amenities to match the algorithm's expected format
    const transformedAmenities = allAmenities.map(amenity => ({
      id: amenity.id.toString(),
      collection_id: collectionId,
      amenity_detail_id: amenity.id.toString(),
      priority: 1, // Default priority
      is_featured: false, // Default featured status
              amenity_detail: {
          id: amenity.id.toString(), // Convert to string to match interface
          name: amenity.name,
          description: amenity.description,
          terminal_code: amenity.terminal_code,
          airport_code: amenity.airport_code,
          vibe_tags: amenity.vibe_tags,
          price_level: amenity.price_level,
          opening_hours: amenity.opening_hours,
          image_url: amenity.image_url,
          location_description: amenity.location_description,
        },
    }));
    
    return algorithm.getSmart7(transformedAmenities, rotation);
  }, [allAmenities, algorithm, rotation, collectionId]);
  
  // Rotation functions
  const showNextSet = () => {
    setRotation((prev) => prev + 1);
  };
  
  const resetRotation = () => {
    setRotation(0);
  };
  
  return {
    amenities: smart7Amenities,
    loading,
    error,
    rotation,
    showNextSet,
    resetRotation,
    totalCount: allAmenities?.length || 0,
    mode: algorithm.getModeRecommendations(),
    contextPills: algorithm.getContextPills(),
    hasMore: (allAmenities?.length || 0) > 7,
    userContext,
    algorithm,
  };
};
