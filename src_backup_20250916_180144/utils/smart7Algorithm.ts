import type {
  AmenityForSelection,
  ScoringWeights,
  ScoringFactors,
  SelectionResult,
  Smart7SelectionConfig,
  TimeRelevanceConfig,
  ProximityConfig,
  PreferenceSignals,
  DiversityRules
} from '../types/smart7';
import type { Smart7Context } from '../types/tracking';
import {
  DEFAULT_WEIGHTS,
  DEFAULT_TIME_CONFIG,
  DEFAULT_PROXIMITY_CONFIG
} from '../types/smart7';

export class Smart7Algorithm {
  private weights: ScoringWeights;
  private timeConfig: TimeRelevanceConfig;
  private proximityConfig: ProximityConfig;
  private config: Smart7SelectionConfig;

  constructor(config?: Partial<Smart7SelectionConfig>) {
    this.config = {
      targetCount: 7,
      includeReasons: true,
      fallbackStrategy: 'popular',
      enableTracking: true,
      ...config
    };
    
    this.weights = {
      ...DEFAULT_WEIGHTS,
      ...config?.weights
    };
    
    this.timeConfig = DEFAULT_TIME_CONFIG;
    this.proximityConfig = DEFAULT_PROXIMITY_CONFIG;
  }

  /**
   * Main selection method - picks best amenities based on context
   */
  public selectSmart7(
    amenities: AmenityForSelection[],
    context: Smart7Context,
    preferences?: PreferenceSignals
  ): SelectionResult[] {
    try {
      // Validate inputs
      if (!amenities || amenities.length === 0) {
        console.warn('Smart7: No amenities provided for selection');
        return [];
      }

      if (!context) {
        console.warn('Smart7: No context provided for selection');
        return [];
      }

      // If we have 7 or fewer amenities, return all of them
      if (amenities.length <= this.config.targetCount) {
        return this.wrapAllAmenities(amenities);
      }

      // Score all amenities
      const scoredAmenities = amenities.map(amenity => ({
        amenity,
        score: this.calculateTotalScore(amenity, context, preferences)
      }));

      // Sort by score (highest first)
      scoredAmenities.sort((a, b) => b.score.totalScore - a.score.totalScore);

      // Apply diversity rules if configured
      let selectedAmenities = this.config.diversityRules
        ? this.applyDiversityRules(scoredAmenities, this.config.diversityRules)
        : scoredAmenities.slice(0, this.config.targetCount);

      // Ensure we have exactly targetCount amenities
      if (selectedAmenities.length < this.config.targetCount) {
        // Fill with remaining high-scoring amenities
        const remaining = scoredAmenities.filter(item => 
          !selectedAmenities.some(selected => selected.amenity.id === item.amenity.id)
        );
        selectedAmenities.push(...remaining.slice(0, this.config.targetCount - selectedAmenities.length));
      }

      // Generate selection reasons if requested
      const results = selectedAmenities.map((item, index) => ({
        amenity: item.amenity,
        score: item.score,
        selectionReason: this.config.includeReasons 
          ? this.generateSelectionReason(item.amenity, item.score, context)
          : '',
        rank: index + 1,
        contextData: {
          algorithm_version: '1.0',
          selection_time: context.currentTime.toISOString(),
          user_terminal: context.userTerminal,
          layover_duration: context.layoverDuration,
          price_preference: context.pricePreference,
          scoring_weights: this.weights
        }
      }));

      return results;
    } catch (error) {
      console.error('Smart7 selection failed:', error);
      // Fallback to simple selection
      return this.fallbackSelection(amenities);
    }
  }

  /**
   * Calculate total score for an amenity
   */
  private calculateTotalScore(
    amenity: AmenityForSelection,
    context: Smart7Context,
    preferences?: PreferenceSignals
  ): ScoringFactors {
    try {
      const timeScore = this.calculateTimeRelevance(amenity, context.currentTime);
      const proximityScore = this.calculateProximityScore(amenity, context.userTerminal);
      const preferenceScore = preferences 
        ? this.calculatePreferenceScore(amenity, preferences)
        : 0.5; // Neutral if no preferences
      const diversityScore = 0.5; // Will be adjusted during diversity rules

      const totalScore = 
        (timeScore * this.weights.timeRelevance) +
        (proximityScore * this.weights.proximity) +
        (preferenceScore * this.weights.preference) +
        (diversityScore * this.weights.diversity);

      return {
        timeScore,
        proximityScore,
        preferenceScore,
        diversityScore,
        totalScore
      };
    } catch (error) {
      console.error('Score calculation failed for amenity:', amenity.id, error);
      // Return neutral score on error
      return {
        timeScore: 0.5,
        proximityScore: 0.5,
        preferenceScore: 0.5,
        diversityScore: 0.5,
        totalScore: 0.5
      };
    }
  }

  /**
   * Calculate time relevance score (0-1)
   */
  private calculateTimeRelevance(
    amenity: AmenityForSelection,
    currentTime: Date
  ): number {
    try {
      const hour = currentTime.getHours();
      
      // Check if amenity is 24 hours
      if (amenity.is_24_hours) {
        return 0.8; // Good any time, but not perfect
      }

      // Check if amenity has specific meal times
      if (amenity.meal_times && amenity.meal_times.length > 0) {
        const mealTimeScore = this.getMealTimeScore(hour, amenity.meal_times);
        if (mealTimeScore > 0) return mealTimeScore;
      }

      // Parse opening hours if available
      if (amenity.opening_hours) {
        const isOpen = this.isOpenAtTime(amenity.opening_hours, hour);
        if (!isOpen) return 0.1; // Very low score if closed
      }

      // Default time-based scoring
      let baseScore = 0.5;
      
      // Boost for peak hours
      if (amenity.peak_hours?.includes(String(hour))) {
        baseScore += 0.3;
      }

      // Food/dining boost during meal times
      if (amenity.category?.toLowerCase().includes('food') || 
          amenity.category?.toLowerCase().includes('restaurant')) {
        if (this.isInTimeRange(hour, this.timeConfig.breakfastHours)) {
          baseScore = amenity.vibe_tags?.includes('breakfast') ? 0.95 : 0.4;
        } else if (this.isInTimeRange(hour, this.timeConfig.lunchHours)) {
          baseScore = 0.85;
        } else if (this.isInTimeRange(hour, this.timeConfig.dinnerHours)) {
          baseScore = 0.9;
        }
      }

      // Shopping boost during daytime
      if (amenity.category?.toLowerCase().includes('shop') || 
          amenity.category?.toLowerCase().includes('retail')) {
        if (hour >= 10 && hour <= 20) {
          baseScore = 0.8;
        } else {
          baseScore = 0.4;
        }
      }

      // Lounge boost during layover times
      if (amenity.category?.toLowerCase().includes('lounge') || 
          amenity.vibe_tags?.includes('relaxation')) {
        if (this.isInTimeRange(hour, this.timeConfig.lateNightHours)) {
          baseScore = 0.9;
        }
      }

      return Math.min(1, Math.max(0, baseScore)); // Clamp between 0 and 1
    } catch (error) {
      console.error('Time relevance calculation failed:', error);
      return 0.5; // Neutral score on error
    }
  }

  /**
   * Calculate proximity score based on terminal distance
   */
  private calculateProximityScore(
    amenity: AmenityForSelection,
    userTerminal?: string
  ): number {
    try {
      if (!userTerminal) return 0.5; // Neutral if no terminal specified

      const amenityTerminal = amenity.terminal_code;
      if (!amenityTerminal) return 0.5;

      // Check terminal distance
      const distance = this.proximityConfig.terminalDistanceMap[userTerminal]?.[amenityTerminal];
      
      switch (distance) {
        case 'same':
          return this.proximityConfig.sameTerminalBonus;
        case 'adjacent':
          return this.proximityConfig.adjacentTerminalScore;
        case 'far':
          return this.proximityConfig.farTerminalScore;
        default:
          return 0.5; // Unknown relationship
      }
    } catch (error) {
      console.error('Proximity score calculation failed:', error);
      return 0.5; // Neutral score on error
    }
  }

  /**
   * Calculate preference score based on user history
   */
  private calculatePreferenceScore(
    amenity: AmenityForSelection,
    preferences: PreferenceSignals
  ): number {
    try {
      let score = 0.5; // Start neutral

      // Boost for previously clicked amenities
      if (preferences.clickedAmenityIds.includes(amenity.id)) {
        score += 0.3;
      }

      // Boost for bookmarked amenities
      if (preferences.bookmarkedAmenityIds?.includes(amenity.id)) {
        score += 0.4;
      }

      // Penalty for avoided amenities
      if (preferences.avoidedAmenityIds?.includes(amenity.id)) {
        score -= 0.3;
      }

      // Price level matching
      if (amenity.price_level && preferences.preferredPriceLevels.length > 0) {
        if (preferences.preferredPriceLevels.includes(amenity.price_level)) {
          score += 0.2;
        } else {
          score -= 0.1;
        }
      }

      // Vibe tag matching
      if (amenity.vibe_tags && preferences.preferredVibes.length > 0) {
        const matchingVibes = amenity.vibe_tags.filter(vibe => 
          preferences.preferredVibes.includes(vibe)
        );
        score += (matchingVibes.length * 0.1); // 0.1 per matching vibe
      }

      // Adjust based on engagement pattern
      switch (preferences.engagementPattern) {
        case 'explorer':
          // Explorers like variety - penalize if already viewed
          if (preferences.viewedAmenityIds.includes(amenity.id)) {
            score -= 0.2;
          }
          break;
        case 'focused':
          // Focused users prefer familiar - boost if viewed before
          if (preferences.viewedAmenityIds.includes(amenity.id)) {
            score += 0.15;
          }
          break;
        case 'quick':
          // Quick users prefer efficiency - neutral
          break;
      }

      return Math.max(0, Math.min(1, score)); // Clamp between 0 and 1
    } catch (error) {
      console.error('Preference score calculation failed:', error);
      return 0.5; // Neutral score on error
    }
  }

  /**
   * Helper methods
   */
  private isInTimeRange(hour: number, range: { start: number; end: number }): boolean {
    try {
      if (range.start <= range.end) {
        return hour >= range.start && hour < range.end;
      } else {
        // Handles ranges that cross midnight
        return hour >= range.start || hour < range.end;
      }
    } catch (error) {
      console.error('Time range check failed:', error);
      return false;
    }
  }

  private getMealTimeScore(hour: number, mealTimes: string[]): number {
    try {
      if (this.isInTimeRange(hour, this.timeConfig.breakfastHours) && 
          mealTimes.includes('breakfast')) {
        return 0.95;
      }
      if (this.isInTimeRange(hour, this.timeConfig.lunchHours) && 
          mealTimes.includes('lunch')) {
        return 0.9;
      }
      if (this.isInTimeRange(hour, this.timeConfig.dinnerHours) && 
          mealTimes.includes('dinner')) {
        return 0.9;
      }
      if (mealTimes.includes('snack')) {
        return 0.7; // Snacks are good any time
      }
      return 0;
    } catch (error) {
      console.error('Meal time score calculation failed:', error);
      return 0;
    }
  }

  private isOpenAtTime(openingHours: string, hour: number): boolean {
    try {
      // Parse various opening hour formats
      // Examples: "24 hours", "06:00-22:00", "0600-2200", "6am-10pm"
      
      if (openingHours.toLowerCase().includes('24 hour') || 
          openingHours.toLowerCase().includes('24hr')) {
        return true;
      }

      // Try to parse time range
      const timeMatch = openingHours.match(/(\d{1,2}):?(\d{0,2})\s*-\s*(\d{1,2}):?(\d{0,2})/);
      if (timeMatch) {
        const openHour = parseInt(timeMatch[1]);
        const closeHour = parseInt(timeMatch[3]);
        
        if (openHour <= closeHour) {
          return hour >= openHour && hour < closeHour;
        } else {
          // Crosses midnight
          return hour >= openHour || hour < closeHour;
        }
      }

      // If we can't parse, assume open
      return true;
    } catch (error) {
      console.error('Opening hours parsing failed:', error);
      return true; // Assume open on error
    }
  }

  private wrapAllAmenities(amenities: AmenityForSelection[]): SelectionResult[] {
    return amenities.map((amenity, index) => ({
      amenity,
      score: {
        timeScore: 1,
        proximityScore: 1,
        preferenceScore: 1,
        diversityScore: 1,
        totalScore: 1
      },
      selectionReason: 'Featured in this specialized collection',
      rank: index + 1,
      contextData: {
        algorithm_version: '1.0',
        reason: 'small_collection'
      }
    }));
  }

  private fallbackSelection(amenities: AmenityForSelection[]): SelectionResult[] {
    // Simple fallback - take first 7 amenities
    const selected = amenities.slice(0, this.config.targetCount);
    return selected.map((amenity, index) => ({
      amenity,
      score: {
        timeScore: 0.5,
        proximityScore: 0.5,
        preferenceScore: 0.5,
        diversityScore: 0.5,
        totalScore: 0.5
      },
      selectionReason: 'Fallback selection due to algorithm error',
      rank: index + 1,
      contextData: {
        algorithm_version: '1.0',
        reason: 'fallback_error'
      }
    }));
  }

  private applyDiversityRules(
    scoredAmenities: Array<{ amenity: AmenityForSelection; score: ScoringFactors }>,
    rules: DiversityRules
  ): Array<{ amenity: AmenityForSelection; score: ScoringFactors }> {
    try {
      const selected: Array<{ amenity: AmenityForSelection; score: ScoringFactors }> = [];
      const terminalCounts = new Map<string, number>();
      const priceCounts = new Map<string, number>();
      const categoryCounts = new Map<string, number>();

      for (const item of scoredAmenities) {
        // Check if we've reached target count
        if (selected.length >= this.config.targetCount) break;

        const { amenity } = item;
        let canAdd = true;

        // Check terminal diversity
        if (rules.maxSameTerminal && amenity.terminal_code) {
          const currentCount = terminalCounts.get(amenity.terminal_code) || 0;
          if (currentCount >= rules.maxSameTerminal) canAdd = false;
        }

        // Check price diversity
        if (rules.maxSamePriceLevel && amenity.price_level) {
          const currentCount = priceCounts.get(amenity.price_level) || 0;
          if (currentCount >= rules.maxSamePriceLevel) canAdd = false;
        }

        // Check category diversity
        if (rules.maxSameCategory && amenity.category) {
          const currentCount = categoryCounts.get(amenity.category) || 0;
          if (currentCount >= rules.maxSameCategory) canAdd = false;
        }

        if (canAdd) {
          selected.push(item);
          
          // Update counts
          if (amenity.terminal_code) {
            terminalCounts.set(amenity.terminal_code, 
              (terminalCounts.get(amenity.terminal_code) || 0) + 1);
          }
          if (amenity.price_level) {
            priceCounts.set(amenity.price_level, 
              (priceCounts.get(amenity.price_level) || 0) + 1);
          }
          if (amenity.category) {
            categoryCounts.set(amenity.category, 
              (categoryCounts.get(amenity.category) || 0) + 1);
          }
        }
      }

      return selected;
    } catch (error) {
      console.error('Diversity rules application failed:', error);
      // Return original selection on error
      return scoredAmenities.slice(0, this.config.targetCount);
    }
  }

  private generateSelectionReason(
    amenity: AmenityForSelection,
    score: ScoringFactors,
    context: Smart7Context
  ): string {
    try {
      const reasons: string[] = [];
      
      // Find the dominant reason
      const scores = [
        { type: 'time', value: score.timeScore },
        { type: 'proximity', value: score.proximityScore },
        { type: 'preference', value: score.preferenceScore }
      ];
      
      scores.sort((a, b) => b.value - a.value);
      const topReason = scores[0];

      if (topReason.type === 'time' && topReason.value > 0.8) {
        const hour = context.currentTime.getHours();
        if (this.isInTimeRange(hour, this.timeConfig.breakfastHours)) {
          reasons.push('Perfect for breakfast');
        } else if (this.isInTimeRange(hour, this.timeConfig.lunchHours)) {
          reasons.push('Great lunch option');
        } else if (this.isInTimeRange(hour, this.timeConfig.dinnerHours)) {
          reasons.push('Ideal for dinner');
        } else if (amenity.is_24_hours) {
          reasons.push('Open 24 hours');
        }
      }

      if (topReason.type === 'proximity' && topReason.value > 0.8) {
        if (context.userTerminal === amenity.terminal_code) {
          reasons.push('In your terminal');
        } else {
          reasons.push('Nearby terminal');
        }
      }

      if (topReason.type === 'preference' && topReason.value > 0.7) {
        reasons.push('Based on your preferences');
      }

      // Fallback reasons
      if (reasons.length === 0) {
        if (amenity.vibe_tags?.includes('popular')) {
          reasons.push('Popular choice');
        } else if (amenity.vibe_tags?.includes('quick')) {
          reasons.push('Quick stop');
        } else {
          reasons.push('Recommended for you');
        }
      }

      return reasons[0] || 'Featured amenity';
    } catch (error) {
      console.error('Selection reason generation failed:', error);
      return 'Featured amenity';
    }
  }
}
