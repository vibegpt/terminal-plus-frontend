import { useState, useEffect } from "react";
import SmartRecommendationEngine from "../lib/SmartRecommendationEngine";
import type { Amenity } from "../types/amenity.types";
import type { UserContext, EnergySuggestion } from "../types/recommendation.types";

const engine = new SmartRecommendationEngine();

export function useRecommendations(
  venueData: Amenity[],
  userContext: UserContext,
  query: string = ""
) {
  const [recommendations, setRecommendations] = useState<Amenity[]>([]);
  const [energySuggestion, setEnergySuggestion] = useState<EnergySuggestion | null>(null);
  const [selectedEnergyLevel, setSelectedEnergyLevel] = useState<'low' | 'medium' | 'high' | null>(null);
  const [journeyContext, setJourneyContext] = useState<'departure' | 'transit' | 'arrival' | null>(null);
  const [fallbacks, setFallbacks] = useState<Amenity[]>([]);
  const [explanation, setExplanation] = useState<{
    energyLevel: string;
    reasoning: string[];
    factors: string[];
  } | null>(null);

  useEffect(() => {
    if (!venueData || venueData.length === 0) {
      setRecommendations([]);
      setEnergySuggestion(null);
      setJourneyContext(null);
      setFallbacks([]);
      setExplanation(null);
      return;
    }

    try {
      engine.loadVenues(venueData);

      // Suggest energy level based on fatigue
      const suggestion = engine.generateEnergySuggestion(userContext);
      setEnergySuggestion(suggestion);

      // Learn from override if present
      if (selectedEnergyLevel) {
        engine.recordUserCorrection(
          suggestion?.id || 'unknown',
          selectedEnergyLevel,
          userContext
        );
      }

      // Generate recommendations
      const result = engine.getSmartRecommendations(query, userContext);
      setRecommendations(result.recommendations);
      setJourneyContext(result.journeyContext);
      setFallbacks(result.fallbacks);
      setExplanation(result.explanation);
    } catch (error) {
      console.error("Error generating recommendations:", error);
      setRecommendations([]);
      setEnergySuggestion(null);
      setJourneyContext(null);
      setFallbacks([]);
      setExplanation({
        energyLevel: 'error',
        reasoning: ['Error generating recommendations'],
        factors: []
      });
    }
  }, [venueData, userContext, query, selectedEnergyLevel]);

  return {
    recommendations,
    energySuggestion,
    setSelectedEnergyLevel,
    journeyContext,
    fallbacks,
    explanation
  };
} 