// Configuration for vibe relationships and scoring
const VIBE_CONFIG = {
  // Define vibe relationships for better matching
  relationships: {
    'Relax': ['lounge', 'spa', 'quiet', 'relaxation', 'seating', 'rest', 'wellness', 'massage', 'calm'],
    'Work': ['business-center', 'wifi', 'workspace', 'quiet', 'charging', 'meeting-room', 'desk', 'focus'],
    'Refuel': ['restaurant', 'cafe', 'food', 'dining', 'bar', 'snacks', 'beverages', 'meals', 'fast-food'],
    'Quick': ['grab-and-go', 'fast-food', 'convenience', 'express', 'self-service', 'takeaway', 'urgent'],
    'Explore': ['entertainment', 'art', 'exhibits', 'culture', 'activities', 'experiences', 'tours', 'duty-free', 'events', 'pop-up', 'local-products', 'souvenirs', 'discover'],
    'Comfort': ['lounge', 'wellness', 'massage', 'quiet', 'relaxation', 'rest-area', 'shower', 'prayer-room', 'family-room']
  },
  
  // Scoring weights
  scoring: {
    EXACT_MATCH: 10,
    RELATED_MATCH: 5,
    BASE_SCORE: 1,
    PROXIMITY_MULTIPLIER: 3,
    VARIETY_BONUS: 2,
    ANTI_VIBE_PENALTY: -3
  }
};

interface Amenity {
  id: number;
  name: string;
  category: string;
  vibe_tags: string[];
  location?: { x: number; y: number };
  priority?: boolean;
  rating?: number;
  estimated_duration?: number;
  quick_service?: boolean;
  operating_hours?: { open: number; close: number };
}

interface Journey {
  selected_vibe?: string;
  airport_name: string;
  current_stage: 'departure' | 'transit' | 'arrival';
  viewing_stage?: 'departure' | 'transit' | 'arrival';
  departure_time: string;
  departureGate?: { x: number; y: number };
}

interface RecommendationContext {
  maxResults?: number;
  diversityWeight?: number;
  userLocation?: { lat: number; lng: number };
  airportLocation?: { lat: number; lng: number };
  mode?: 'preview' | 'live' | 'no-location';
}

/**
 * Enhanced recommendation engine for airport amenities
 * Supports Preview Mode, Live Mode, and No Location scenarios
 */
export class AmenityRecommendationEngine {
  private config: typeof VIBE_CONFIG;

  constructor(config = VIBE_CONFIG) {
    this.config = config;
  }

  /**
   * Main entry point - determines mode and generates appropriate recommendations
   */
  getRecommendations(journey: Journey, amenitiesForAirport: Amenity[], context: RecommendationContext = {}) {
    const { 
      maxResults = 10, 
      diversityWeight = 0.3,
      userLocation = null,
      airportLocation = null,
      mode = this.determineMode(journey, userLocation, airportLocation)
    } = context;

    switch (mode) {
      case 'preview':
        return this.getPreviewRecommendations(journey, amenitiesForAirport, maxResults);
      case 'live':
        return this.getLiveRecommendations(journey, amenitiesForAirport, { maxResults, diversityWeight });
      case 'no-location':
        return this.getGenericRecommendations(journey, amenitiesForAirport, maxResults);
      default:
        return this.getLiveRecommendations(journey, amenitiesForAirport, { maxResults, diversityWeight });
    }
  }

  /**
   * Determine which mode to use based on context
   */
  private determineMode(journey: Journey, userLocation: any, airportLocation: any): 'preview' | 'live' | 'no-location' {
    // No location detected
    if (!userLocation) return 'no-location';
    
    // User is at departure airport looking at transit/arrival
    if (journey.current_stage === 'departure' && 
        journey.viewing_stage !== 'departure') {
      return 'preview';
    }
    
    // User is on-site at the airport they're viewing
    if (this.isUserAtAirport(userLocation, airportLocation)) {
      return 'live';
    }
    
    // Default to preview mode
    return 'preview';
  }

  /**
   * Preview Mode: Show diverse sample without requiring vibe selection
   */
  private getPreviewRecommendations(journey: Journey, amenities: Amenity[], maxResults: number) {
    // Create diverse sample across all vibes and categories
    const curatedSample = this.createDiverseSample(amenities, maxResults);
    
    return curatedSample.map((amenity, index) => ({
      ...amenity,
      rank: index + 1,
      mode: 'preview',
      confidence: 85, // High confidence for curated content
      preview_note: `Here's a taste of what's waiting at ${journey.airport_name} — select a vibe when you arrive for personalized picks.`
    }));
  }

  /**
   * Live Mode: Full personalized recommendations with vibe
   */
  private getLiveRecommendations(journey: Journey, amenities: Amenity[], options: { maxResults: number; diversityWeight: number }) {
    if (!journey.selected_vibe) {
      return this.getVibePromptResponse(journey);
    }

    const scoredAmenities = this.scoreAmenities(journey, amenities);
    const diversifiedResults = this.applyDiversityBonus(scoredAmenities, options.diversityWeight);
    
    return this.finalizeRecommendations(diversifiedResults, options.maxResults, 'live');
  }

  /**
   * No Location: Generic recommendations with option to select vibe
   */
  private getGenericRecommendations(journey: Journey, amenities: Amenity[], maxResults: number) {
    const topRated = amenities
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, maxResults);

    return topRated.map((amenity, index) => ({
      ...amenity,
      rank: index + 1,
      mode: 'no-location',
      confidence: 70,
      generic_note: "Popular choices at this airport. Enable location for personalized recommendations."
    }));
  }

  /**
   * Create diverse sample for preview mode
   */
  private createDiverseSample(amenities: Amenity[], maxResults: number) {
    const vibeCategories = Object.keys(this.config.relationships);
    const sampleSize = Math.floor(maxResults / vibeCategories.length);
    const diverseSample: Amenity[] = [];

    // Get top items for each vibe category
    vibeCategories.forEach(vibe => {
      const vibeAmenities = amenities.filter(amenity => 
        this.calculateVibeScore(vibe, amenity.vibe_tags) > 0
      );
      
      const topForVibe = vibeAmenities
        .sort((a, b) => (b.rating || 0) - (a.rating || 0))
        .slice(0, sampleSize + 1);
      
      diverseSample.push(...topForVibe);
    });

    // Fill remaining slots with highest rated overall
    const remaining = maxResults - diverseSample.length;
    if (remaining > 0) {
      const additional = amenities
        .filter(amenity => !diverseSample.includes(amenity))
        .sort((a, b) => (b.rating || 0) - (a.rating || 0))
        .slice(0, remaining);
      
      diverseSample.push(...additional);
    }

    // Remove duplicates and return top rated
    const unique = [...new Set(diverseSample)];
    return unique
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, maxResults);
  }

  /**
   * Handle vibe prompt response for live mode
   */
  private getVibePromptResponse(journey: Journey) {
    return {
      mode: 'vibe-prompt',
      message: `You've landed at ${journey.airport_name}! How do you want to vibe this stop?`,
      vibes: Object.keys(this.config.relationships),
      airport_name: journey.airport_name
    };
  }

  /**
   * Check if user is at the airport location
   */
  private isUserAtAirport(userLocation: any, airportLocation: any, threshold = 5000): boolean {
    if (!userLocation || !airportLocation) return false;
    
    const distance = this.calculateRealDistance(userLocation, airportLocation);
    return distance <= threshold; // Within 5km of airport
  }

  /**
   * Calculate real geographic distance
   */
  private calculateRealDistance(pos1: any, pos2: any): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = pos1.lat * Math.PI/180;
    const φ2 = pos2.lat * Math.PI/180;
    const Δφ = (pos2.lat-pos1.lat) * Math.PI/180;
    const Δλ = (pos2.lng-pos1.lng) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance in meters
  }

  /**
   * Score each amenity based on multiple factors
   */
  private scoreAmenities(journey: Journey, amenities: Amenity[]) {
    const isUrgent = this.isUrgentDeparture(journey);
    
    return amenities.map(amenity => {
      const vibeScore = this.calculateVibeScore(journey.selected_vibe!, amenity.vibe_tags);
      const proximityScore = isUrgent ? this.calculateProximityScore(amenity, journey) : 0;
      const timeCompatibilityScore = this.calculateTimeCompatibility(amenity, journey);
      
      const totalScore = this.config.scoring.BASE_SCORE + 
                        vibeScore + 
                        proximityScore + 
                        timeCompatibilityScore;

      return {
        ...amenity,
        score: Math.max(0, totalScore), // Ensure non-negative scores
        breakdown: { vibeScore, proximityScore, timeCompatibilityScore }
      };
    });
  }

  /**
   * Calculate vibe compatibility score
   */
  private calculateVibeScore(selectedVibe: string, amenityTags: string[]): number {
    if (!selectedVibe || !amenityTags?.length) return 0;

    // Exact match
    if (amenityTags.includes(selectedVibe)) {
      return this.config.scoring.EXACT_MATCH;
    }

    // Related match
    const relatedVibes = this.config.relationships[selectedVibe as keyof typeof this.config.relationships] || [];
    if (amenityTags.some(tag => relatedVibes.includes(tag))) {
      return this.config.scoring.RELATED_MATCH;
    }

    // Anti-vibe penalty (opposite vibes)
    if (this.hasAntiVibe(selectedVibe, amenityTags)) {
      return this.config.scoring.ANTI_VIBE_PENALTY;
    }

    return 0;
  }

  /**
   * Calculate proximity score for urgent departures
   */
  private calculateProximityScore(amenity: Amenity, journey: Journey): number {
    if (!amenity.location || !journey.departureGate) return 0;

    const distance = this.calculateDistance(amenity.location, journey.departureGate);
    const maxDistance = 1000; // meters
    const proximityRatio = Math.max(0, (maxDistance - distance) / maxDistance);
    
    return proximityRatio * this.config.scoring.PROXIMITY_MULTIPLIER;
  }

  /**
   * Calculate time compatibility with vibe-specific logic
   */
  private calculateTimeCompatibility(amenity: Amenity, journey: Journey): number {
    let score = 0;
    const currentTime = new Date();
    const departureTime = new Date(journey.departure_time);
    const timeUntilDeparture = (departureTime - currentTime) / (1000 * 60); // minutes

    // Check if amenity is open
    if (!this.isAmenityOpen(amenity, currentTime)) return -5;

    // Vibe-specific time logic
    const selectedVibe = journey.selected_vibe;
    
    if (selectedVibe === 'Quick') {
      // Quick vibe: heavily favor fast options when time is limited
      if (timeUntilDeparture < 60 && amenity.quick_service) score += 5;
      if (timeUntilDeparture < 90 && amenity.estimated_duration && amenity.estimated_duration <= 15) score += 3;
    } else if (selectedVibe === 'Relax') {
      // Relax vibe: needs adequate time to relax
      if (timeUntilDeparture < 60) score -= 3; // Not enough time to be comfortable
      if (timeUntilDeparture > 120) score += 2; // Plenty of time to enjoy
    } else if (selectedVibe === 'Comfort') {
      // Comfort vibe: needs time for comfort activities
      if (timeUntilDeparture < 45) score -= 2; // Need some time for comfort
      if (timeUntilDeparture > 90) score += 2; // Good comfort time available
    } else if (selectedVibe === 'Work') {
      // Work vibe: needs sufficient time for productivity
      if (timeUntilDeparture < 45) score -= 4; // Can't get much work done
      if (timeUntilDeparture > 90) score += 3; // Good work session possible
    } else if (selectedVibe === 'Explore') {
      // Explore vibe: needs time to discover and enjoy
      if (timeUntilDeparture < 75) score -= 2;
      if (timeUntilDeparture > 150) score += 3;
    }

    // General time penalties
    const estimatedDuration = amenity.estimated_duration || 30;
    if (estimatedDuration > timeUntilDeparture - 30) score -= 2; // Need 30min buffer

    return score;
  }

  /**
   * Apply diversity bonus to prevent monotonous recommendations
   */
  private applyDiversityBonus(scoredAmenities: any[], diversityWeight: number) {
    const categoryCount: Record<string, number> = {};
    
    return scoredAmenities.map(amenity => {
      const category = amenity.category || 'other';
      categoryCount[category] = (categoryCount[category] || 0) + 1;
      
      // Apply diminishing returns for same category
      const diversityPenalty = Math.log(categoryCount[category]) * diversityWeight;
      
      return {
        ...amenity,
        score: amenity.score - diversityPenalty
      };
    });
  }

  /**
   * Finalize recommendations with priority handling and sorting
   */
  private finalizeRecommendations(scoredAmenities: any[], maxResults: number, mode = 'live') {
    return scoredAmenities
      .sort(this.createSortComparator())
      .slice(0, maxResults)
      .map((amenity, index) => ({
        ...amenity,
        rank: index + 1,
        mode: mode,
        confidence: this.calculateConfidence(amenity.score)
      }));
  }

  /**
   * Create sorting comparator with priority handling
   */
  private createSortComparator() {
    return (a: any, b: any) => {
      // Priority items always come first
      if (a.priority !== b.priority) {
        return (b.priority ? 1 : 0) - (a.priority ? 1 : 0);
      }
      
      // Then by score
      if (Math.abs(a.score - b.score) > 0.1) {
        return b.score - a.score;
      }
      
      // Tie-breaker: prefer higher rated amenities
      return (b.rating || 0) - (a.rating || 0);
    };
  }

  // Helper Methods
  private isUrgentDeparture(journey: Journey): boolean {
    const now = new Date();
    const departure = new Date(journey.departure_time);
    const minutesUntilDeparture = (departure - now) / (1000 * 60);
    return minutesUntilDeparture < 120; // Less than 2 hours
  }

  private hasAntiVibe(selectedVibe: string, amenityTags: string[]): boolean {
    const antiVibes: Record<string, string[]> = {
      'Relax': ['loud', 'crowded', 'energetic', 'busy', 'fast-paced'],
      'Work': ['loud', 'entertainment', 'social', 'distracting', 'no-wifi', 'party'],
      'Refuel': ['light-snacks-only', 'no-food', 'closed-kitchen', 'bar', 'nightlife', 'alcohol-only'],
      'Quick': ['slow-service', 'full-service', 'lengthy', 'reservation-required'],
      'Explore': ['boring', 'static', 'closed-exhibits', 'no-activities', 'quiet-zone', 'business-only', 'restricted-access'],
      'Comfort': ['loud', 'party', 'standing-only', 'crowded', 'rushed']
    };
    
    const conflicting = antiVibes[selectedVibe] || [];
    return amenityTags.some(tag => conflicting.includes(tag));
  }

  private calculateDistance(location1: any, location2: any): number {
    // Simplified distance calculation (you might use a proper geospatial library)
    if (!location1 || !location2) return 1000;
    
    const dx = location1.x - location2.x;
    const dy = location1.y - location2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  private isAmenityOpen(amenity: Amenity, currentTime: Date): boolean {
    if (!amenity.operating_hours) return true; // Assume open if no hours specified
    
    const hour = currentTime.getHours();
    const { open, close } = amenity.operating_hours;
    
    if (close > open) {
      return hour >= open && hour < close;
    } else {
      // Handles overnight operations
      return hour >= open || hour < close;
    }
  }

  private calculateConfidence(score: number): number {
    // Convert score to confidence percentage
    const maxExpectedScore = 20;
    return Math.min(100, Math.max(0, (score / maxExpectedScore) * 100));
  }
}

// Export the engine instance
export const amenityRecommendationEngine = new AmenityRecommendationEngine(); 