import { amenityRecommendationEngine } from './AmenityRecommendationEngine';
import amenitiesData from '../data/amenities.json';

// Interface to match your existing amenity structure
interface AirportAmenity {
  id: number;
  name: string;
  terminal: string;
  category: string;
  tags: string[];
  location: string;
  gate: number;
  rating: number;
  priority?: boolean;
  vibe_tags?: string[]; // For compatibility with new engine
  estimated_duration?: number;
  quick_service?: boolean;
}

// Convert your existing amenities to the new engine format
const convertAmenitiesForEngine = (amenities: AirportAmenity[]) => {
  return amenities.map(amenity => ({
    id: amenity.id,
    name: amenity.name,
    category: amenity.category,
    vibe_tags: amenity.vibe_tags || amenity.tags, // Use vibe_tags if available, fallback to tags
    location: { x: 0, y: 0 }, // You'll need to add proper coordinates
    priority: amenity.priority || false,
    rating: amenity.rating || 4.0,
    estimated_duration: amenity.estimated_duration || 30,
    quick_service: amenity.quick_service || false
  }));
};

// Enhanced recommendation function that integrates with your existing system
export const getEnhancedRecommendations = (
  journey: {
    selected_vibe?: string;
    airport_name: string;
    current_stage: 'departure' | 'transit' | 'arrival';
    viewing_stage?: 'departure' | 'transit' | 'arrival';
    departure_time: string;
    departureGate?: { x: number; y: number };
  },
  context: {
    maxResults?: number;
    userLocation?: { lat: number; lng: number };
    airportLocation?: { lat: number; lng: number };
  } = {}
) => {
  // Use your existing amenities data
  const amenities = convertAmenitiesForEngine(amenitiesData as AirportAmenity[]);
  
  // Get recommendations using the new engine
  const recommendations = amenityRecommendationEngine.getRecommendations(journey, amenities, {
    maxResults: context.maxResults || 10,
    userLocation: context.userLocation || null,
    airportLocation: context.airportLocation || null
  });

  return recommendations;
};

// Example usage with your existing vibe names
export const getRecommendationsForVibe = (vibe: 'Relax' | 'Work' | 'Refuel' | 'Quick' | 'Explore' | 'Comfort') => {
  const mockJourney = {
    selected_vibe: vibe,
    airport_name: 'Sydney Airport',
    current_stage: 'transit' as const,
    viewing_stage: 'transit' as const,
    departure_time: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
    departureGate: { x: 100, y: 200 }
  };

  return getEnhancedRecommendations(mockJourney, {
    maxResults: 8,
    userLocation: { lat: -33.9399, lng: 151.1753 }, // Sydney Airport coordinates
    airportLocation: { lat: -33.9399, lng: 151.1753 }
  });
};

// Export the engine for direct use
export { amenityRecommendationEngine }; 