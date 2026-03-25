import {
  UserContext,
  AmenityScore,
  Smart7Config,
  CollectionAmenityWithScore,
  TERMINAL_DISTANCES,
  getSmartMode,
  SMART7_WEIGHTS,
} from '../types/smart7.types';

// Interface for amenity data from Supabase
interface CollectionAmenity {
  id: string;
  collection_id: string;
  amenity_detail_id: string;
  priority: number;
  is_featured: boolean;
  amenity_detail?: {
    id: string;
    name: string;
    description: string;
    terminal_code: string;
    airport_code: string;
    vibe_tags: string[];
    price_level?: string;
    opening_hours?: string;
    image_url?: string;
    location_description?: string;
  };
}

export class Smart7Algorithm {
  private userContext: UserContext;
  private config: Smart7Config;

  constructor(userContext: UserContext) {
    this.userContext = userContext;
    this.config = {
      mode: getSmartMode(userContext.layoverMinutes),
      weights: SMART7_WEIGHTS[getSmartMode(userContext.layoverMinutes)],
      rotationSeed: Date.now(),
    };
  }

  /**
   * Calculate proximity score based on terminal distance
   */
  private calculateProximityScore(amenityTerminal: string): number {
    const distance = TERMINAL_DISTANCES[this.userContext.currentTerminal]?.[amenityTerminal] ?? 20;
    
    // Inverse relationship: closer = higher score
    if (distance === 0) return 100; // Same terminal
    if (distance <= 5) return 80;   // Adjacent/Jewel
    if (distance <= 10) return 50;  // One terminal away
    if (distance <= 15) return 20;  // Two terminals away
    return 0; // Far away
  }

  /**
   * Calculate temporal relevance score based on time of day
   */
  private calculateTemporalScore(amenity: CollectionAmenity): number {
    const hour = this.userContext.currentTime.getHours();
    const vibes = amenity.amenity_detail?.vibe_tags?.toLowerCase() || '';
    
    // Breakfast time (6am-11am)
    if (hour >= 6 && hour < 11) {
      if (vibes.includes('breakfast') || vibes.includes('coffee')) return 100;
      if (vibes.includes('bakery') || vibes.includes('cafe')) return 80;
      if (amenity.amenity_detail?.name?.toLowerCase().includes('toast') || 
          amenity.amenity_detail?.name?.toLowerCase().includes('coffee')) return 70;
    }
    
    // Lunch time (11am-2pm)
    if (hour >= 11 && hour < 14) {
      if (vibes.includes('lunch') || vibes.includes('hawker')) return 100;
      if (vibes.includes('quick') || vibes.includes('fast')) return 80;
    }
    
    // Happy hour (5pm-7pm)
    if (hour >= 17 && hour < 19) {
      if (vibes.includes('bar') || vibes.includes('cocktail')) return 100;
      if (vibes.includes('wine') || vibes.includes('beer')) return 80;
    }
    
    // Late night (10pm-5am)
    if (hour >= 22 || hour < 5) {
      if (amenity.amenity_detail?.opening_hours?.includes('24') || 
          amenity.amenity_detail?.opening_hours?.includes('24/7')) return 100;
      if (vibes.includes('bar') || vibes.includes('lounge')) return 60;
    }
    
    return 50; // Default neutral score
  }

  /**
   * Calculate availability score based on current opening hours
   */
  private calculateAvailabilityScore(amenity: CollectionAmenity): number {
    const hour = this.userContext.currentTime.getHours();
    const openingHours = amenity.amenity_detail?.opening_hours?.toLowerCase() || '';
    
    // 24/7 venues always get high score
    if (openingHours.includes('24/7') || openingHours.includes('24 hours')) {
      return 100;
    }
    
    // Parse opening hours (simplified - you may want more robust parsing)
    if (openingHours.includes('closed')) return 0;
    
    // Check if currently open (basic implementation)
    // In production, parse actual hours properly
    const isLikelyOpen = 
      (hour >= 6 && hour <= 22) || // Most places open during day
      openingHours.includes('late') || // Late night venues
      openingHours.includes('early'); // Early morning venues
    
    return isLikelyOpen ? 80 : 20;
  }

  /**
   * Calculate popularity score (would come from DB in production)
   */
  private calculatePopularityScore(amenity: CollectionAmenity): number {
    // In production, this would use actual metrics from your database
    // For now, using placeholder logic
    const name = amenity.amenity_detail?.name?.toLowerCase() || '';
    
    // Simulate popular venues
    if (name.includes('starbucks') || name.includes('toast box')) return 90;
    if (name.includes('killiney')) return 95;
    if (amenity.amenity_detail?.price_level === '$') return 70; // Budget friendly tends to be popular
    if (amenity.amenity_detail?.price_level === '$$$$') return 60; // Premium less frequented
    
    return 50; // Default middle score
  }

  /**
   * Calculate personalization score based on user preferences
   */
  private calculatePersonalizationScore(amenity: CollectionAmenity): number {
    let score = 50; // Base score
    
    // Price preference matching
    if (this.userContext.pricePreference) {
      const amenityPrice = amenity.amenity_detail?.price_level?.length || 2;
      const prefMap = { 'budget': 1, 'moderate': 2, 'premium': 4 };
      const prefPrice = prefMap[this.userContext.pricePreference];
      
      if (amenityPrice === prefPrice) score += 30;
      else if (Math.abs(amenityPrice - prefPrice) === 1) score += 10;
    }
    
    // Dietary preferences
    if (this.userContext.dietaryPreferences?.length) {
      const vibes = amenity.amenity_detail?.vibe_tags?.toLowerCase() || '';
      const description = amenity.amenity_detail?.description?.toLowerCase() || '';
      
      this.userContext.dietaryPreferences.forEach(pref => {
        if (vibes.includes(pref) || description.includes(pref)) {
          score += 20;
        }
      });
    }
    
    // Previous choices influence
    if (this.userContext.previousChoices?.includes(amenity.id)) {
      score -= 30; // Deprioritize recently visited
    }
    
    return Math.min(100, Math.max(0, score));
  }

  /**
   * Score a single amenity based on all factors
   */
  private scoreAmenity(amenity: CollectionAmenity): AmenityScore {
    const factors = {
      proximity: this.calculateProximityScore(amenity.amenity_detail?.terminal_code || 'T1'),
      temporal: this.calculateTemporalScore(amenity),
      availability: this.calculateAvailabilityScore(amenity),
      popularity: this.calculatePopularityScore(amenity),
      personalization: this.calculatePersonalizationScore(amenity),
    };
    
    // Calculate weighted total
    const weights = this.config.weights;
    const totalScore = 
      (factors.proximity * weights.proximity / 100) +
      (factors.temporal * weights.temporal / 100) +
      (factors.availability * weights.availability / 100) +
      (factors.popularity * weights.popularity / 100) +
      (factors.personalization * weights.personalization / 100);
    
    // Calculate metadata
    const walkingTime = TERMINAL_DISTANCES[this.userContext.currentTerminal]?.[amenity.amenity_detail?.terminal_code || 'T1'] || 0;
    
    return {
      amenityId: amenity.id,
      totalScore,
      factors,
      metadata: {
        walkingTime,
        isOpen: factors.availability > 50,
        matchesPreferences: factors.personalization > 70,
        peakTime: factors.temporal > 80,
      },
    };
  }

  /**
   * Get the Smart 7 amenities for a collection
   */
  public getSmart7(
    amenities: CollectionAmenity[],
    rotation: number = 0
  ): CollectionAmenityWithScore[] {
    // Score all amenities
    const scoredAmenities: CollectionAmenityWithScore[] = amenities.map(amenity => ({
      id: amenity.id,
      collection_id: amenity.collection_id,
      amenity_detail_id: amenity.amenity_detail_id,
      priority: amenity.priority,
      is_featured: amenity.is_featured,
      score: this.scoreAmenity(amenity),
    }));
    
    // Sort by score
    scoredAmenities.sort((a, b) => b.score.totalScore - a.score.totalScore);
    
    // Apply rotation for discovery
    const rotationOffset = rotation * 7;
    const availableCount = Math.min(scoredAmenities.length, 21); // Keep top 21 for 3 rotations
    const pooledAmenities = scoredAmenities.slice(0, availableCount);
    
    // Rotate through pools of 7
    let selectedAmenities: CollectionAmenityWithScore[] = [];
    
    if (rotationOffset < pooledAmenities.length) {
      // Get 7 starting from rotation offset
      selectedAmenities = pooledAmenities.slice(
        rotationOffset,
        Math.min(rotationOffset + 7, pooledAmenities.length)
      );
      
      // If we don't have 7, wrap around to the beginning
      if (selectedAmenities.length < 7) {
        const remaining = 7 - selectedAmenities.length;
        selectedAmenities.push(...pooledAmenities.slice(0, remaining));
      }
    } else {
      // Rotation exceeded, start over
      selectedAmenities = pooledAmenities.slice(0, 7);
    }
    
    // Mark the first one as hero
    if (selectedAmenities.length > 0) {
      selectedAmenities[0].hero = true;
    }
    
    return selectedAmenities;
  }

  /**
   * Get mode-specific recommendations
   */
  public getModeRecommendations(): string[] {
    switch (this.config.mode) {
      case 'rush':
        return [
          'Showing nearest options first',
          'Filtered for quick service',
          'Currently open venues only'
        ];
      case 'explorer':
        return [
          'Balanced distance and quality',
          'Mix of popular and hidden gems',
          'Perfect for your layover time'
        ];
      case 'leisure':
        return [
          'Curated for best experiences',
          'Personalized to your preferences',
          'Discover something special'
        ];
    }
  }

  /**
   * Get smart context pills for UI
   */
  public getContextPills(): string[] {
    const pills: string[] = [];
    
    // Time context
    if (this.userContext.layoverMinutes < 30) {
      pills.push(`⏱️ ${this.userContext.layoverMinutes} min layover`);
    }
    
    // Terminal context
    pills.push(`📍 Terminal ${this.userContext.currentTerminal}`);
    
    // Mode context
    const modeLabels = {
      'rush': '⚡ Quick picks',
      'explorer': '🎯 Smart selection',
      'leisure': '✨ Best experiences'
    };
    pills.push(modeLabels[this.config.mode]);
    
    return pills;
  }

  /**
   * Get the current algorithm weights for analytics
   */
  getWeights(): Record<string, number> {
    return this.config.weights;
  }

  /**
   * Get the current algorithm mode for analytics
   */
  getMode(): string {
    return this.config.mode;
  }
}
