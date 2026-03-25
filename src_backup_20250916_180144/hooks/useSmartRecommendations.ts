import { useState, useEffect, useMemo } from "react";
import SmartRecommendationEngine from "../lib/SmartRecommendationEngine";
import type { Amenity } from "../types/amenity.types";
import type { JourneyData } from "../types/journey.types";
import type { UserContext, EnergySuggestion } from "../types/recommendation.types";

const engine = new SmartRecommendationEngine();

export function useSmartRecommendations(
  venueData: Amenity[],
  userContext: UserContext,
  query: string = ""
) {
  const [results, setResults] = useState({
    recommendations: [] as Amenity[],
    journeyContext: null as 'departure' | 'transit' | 'arrival' | null,
    fallbacks: [] as Amenity[],
    explanation: {} as {
      energyLevel: string;
      reasoning: string[];
      factors: string[];
    },
    energySuggestion: null as EnergySuggestion | null
  });

  const [selectedEnergyLevel, setSelectedEnergyLevel] = useState<'low' | 'medium' | 'high' | null>(null);
  const [energyOverridden, setEnergyOverridden] = useState(false);

  useEffect(() => {
    if (!venueData || venueData.length === 0) {
      setResults(prev => ({
        ...prev,
        recommendations: [],
        fallbacks: [],
        explanation: {
          energyLevel: 'unknown',
          reasoning: ['No venue data available'],
          factors: []
        }
      }));
      return;
    }

    try {
      engine.loadVenues(venueData);

      // Step 1: Energy suggestion (passive)
      const energySuggestion = engine.generateEnergySuggestion(userContext);

      // Step 2: If user has overridden, apply their level
      if (selectedEnergyLevel) {
        engine.recordUserCorrection(
          energySuggestion?.id || 'unknown',
          selectedEnergyLevel,
          userContext
        );
      }

      // Step 3: Run recommendations with context
      const recommendations = engine.getSmartRecommendations(query, userContext);

      setResults({
        ...recommendations,
        energySuggestion: energySuggestion || null
      });
    } catch (error) {
      console.error("Error generating smart recommendations:", error);
      setResults(prev => ({
        ...prev,
        recommendations: [],
        fallbacks: [],
        explanation: {
          energyLevel: 'error',
          reasoning: ['Error generating recommendations'],
          factors: []
        }
      }));
    }
  }, [venueData, userContext, query, selectedEnergyLevel]);

  // Memoize the return value to prevent unnecessary re-renders
  const returnValue = useMemo(() => ({
    ...results,
    selectedEnergyLevel,
    setSelectedEnergyLevel,
    energyOverridden,
    setEnergyOverridden
  }), [results, selectedEnergyLevel, energyOverridden]);

  return returnValue;
} 