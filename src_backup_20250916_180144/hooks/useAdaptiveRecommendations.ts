import { useRecommendationEngine, RecommendationContext } from "./useRecommendationEngine";

export function useAdaptiveRecommendations(amenities: any[], context: RecommendationContext) {
  if (!amenities || amenities.length === 0) return [];
  return useRecommendationEngine(amenities, context);
} 