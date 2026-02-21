// useRecommendationEngine.ts - Cleaned with Utils

import { normalizeAmenity } from "@/utils/normalizeAmenity"; // This import is now unused but kept for context
import {
  scoreVibeMatch,
  scoreGateProximity,
  scoreUrgency,
  scoreCategoryMatch,
  scorePrice,
  scoreOpeningHours
} from "@/utils/recommendationScorers";

export type RecommendationContext = {
  vibe?: string;
  gate?: string;
  timeLeft?: number;
  preferredCategories?: string[];
  pricePreference?: string;
  isTransit?: boolean;
  transitAirport?: string;
};

export function useRecommendationEngine(rawAmenities: any[], context: RecommendationContext) {
  // Don't normalize again - amenities should already be normalized
  const normalized = rawAmenities;

  function scoreAmenity(amenity: any) {
    const vibeScore = scoreVibeMatch(amenity, context.vibe);
    const gateScore = scoreGateProximity(amenity, context.gate);
    const urgencyScore = scoreUrgency(context.timeLeft);
    const categoryScore = scoreCategoryMatch(amenity, context.preferredCategories?.[0]); // Use first category for now
    const priceScore = scorePrice(amenity);
    const hoursScore = scoreOpeningHours(amenity);

    // Enhanced scoring for transit scenarios
    let transitBonus = 0;
    if (context.isTransit && context.transitAirport === "SIN") {
      // Bonus for amenities that are transit-accessible
      if (amenity.available_in_transit === true) {
        transitBonus = 10;
      }
      
      // Time-based filtering for transit
      if (context.timeLeft) {
        const walkTimeStr = amenity.walkTime || "5 min walk";
        const walkMinutes = parseInt(walkTimeStr.replace("min walk", "").trim()) || 5;
        
        // Heavily penalize amenities that take too long to reach
        if (walkMinutes > context.timeLeft - 5) {
          transitBonus -= 50; // Heavy penalty
        }
        
        // Bonus for quick access in short layovers
        if (context.timeLeft < 30 && walkMinutes <= 10) {
          transitBonus += 5;
        }
      }
    }

    const totalScore = vibeScore + gateScore + urgencyScore + categoryScore + priceScore + hoursScore + transitBonus;

    console.debug(`[Score] ${amenity.name}`, {
      vibeScore,
      gateScore,
      urgencyScore,
      categoryScore,
      priceScore,
      hoursScore,
      transitBonus,
      totalScore
    });

    return totalScore;
  }

  const scored = normalized
    .map((a) => ({ ...a, score: scoreAmenity(a) }))
    .sort((a, b) => b.score - a.score);

  return scored;
} 