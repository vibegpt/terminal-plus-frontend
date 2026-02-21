import { useMemo } from "react";
import SmartRecommendationEngine from "../lib/SmartRecommendationEngine";
import type { Amenity } from "../types/amenity.types";
import type { UserContext } from "../types/recommendation.types";

const engine = new SmartRecommendationEngine();

export function useRecommendationsEngine(
  venueData: Amenity[],
  userContext: UserContext,
  query: string = ""
) {
  return useMemo(() => {
    if (!venueData || venueData.length === 0) {
      return {
        recommendations: [],
        journeyContext: null,
        fallbacks: [],
        explanation: null
      };
    }

    try {
      engine.loadVenues(venueData);
      const result = engine.getSmartRecommendations(query, userContext);

      return {
        recommendations: result.recommendations,
        journeyContext: result.journeyContext,
        fallbacks: result.fallbacks,
        explanation: result.explanation
      };
    } catch (error) {
      console.error("Error in useRecommendationsEngine:", error);
      return {
        recommendations: [],
        journeyContext: null,
        fallbacks: [],
        explanation: {
          energyLevel: 'error',
          reasoning: ['Error generating recommendations'],
          factors: []
        }
      };
    }
  }, [venueData, userContext, query]);
} 