import type { Amenity } from '../types/amenity.types';
import type { UserContext, EnergySuggestion, SmartRecommendationResult, RecommendationEngine } from '../types/recommendation.types';

export default class SmartRecommendationEngine implements RecommendationEngine {
  private venues: Amenity[] = [];
  private userCorrections: Map<string, string> = new Map();

  loadVenues(venues: Amenity[]): void {
    this.venues = venues;
  }

  generateEnergySuggestion(context: UserContext): EnergySuggestion | null {
    const { currentTime, timeOfDay, journeyData } = context;
    
    // Simple energy level logic based on time and journey context
    let suggestedLevel: 'low' | 'medium' | 'high' = 'medium';
    const reasoning: string[] = [];

    // Time-based energy assessment
    if (timeOfDay === 'morning') {
      suggestedLevel = 'high';
      reasoning.push('Morning energy levels are typically high');
    } else if (timeOfDay === 'evening' || timeOfDay === 'night') {
      suggestedLevel = 'low';
      reasoning.push('Evening/night energy levels are typically lower');
    }

    // Journey context adjustment
    if (journeyData.selected_vibe === 'chill') {
      suggestedLevel = 'low';
      reasoning.push('User selected chill vibe');
    } else if (journeyData.selected_vibe === 'explore') {
      suggestedLevel = 'high';
      reasoning.push('User selected explore vibe');
    }

    return {
      id: `energy_${Date.now()}`,
      suggestion: {
        level: suggestedLevel,
        confidence: 0.7,
        reasoning
      },
      alternatives: [
        { level: 'low', confidence: 0.3 },
        { level: 'medium', confidence: 0.5 },
        { level: 'high', confidence: 0.4 }
      ]
    };
  }

  recordUserCorrection(suggestionId: string, userLevel: string, context: UserContext): void {
    this.userCorrections.set(suggestionId, userLevel);
  }

  getSmartRecommendations(query: string, context: UserContext): SmartRecommendationResult {
    const { journeyData, preferences, constraints } = context;
    
    // Filter venues based on query and context
    let filteredVenues = this.venues.filter(venue => {
      // Basic query filtering
      if (query && !venue.name.toLowerCase().includes(query.toLowerCase())) {
        return false;
      }

      // Terminal filtering
      if (venue.terminal_code && venue.terminal_code !== context.location.terminal) {
        return false;
      }

      return true;
    });

    // Apply vibe preferences
    if (preferences.vibes.length > 0) {
      filteredVenues = filteredVenues.filter(venue => 
        venue.vibe_tags?.some(vibe => preferences.vibes.includes(vibe))
      );
    }

    // Sort by relevance (simplified scoring)
    const scoredVenues = filteredVenues.map(venue => ({
      ...venue,
      score: this.calculateRelevanceScore(venue, context)
    }));

    scoredVenues.sort((a, b) => b.score - a.score);

    const recommendations = scoredVenues.slice(0, 10).map(({ score, ...venue }) => venue);
    const fallbacks = scoredVenues.slice(10, 20).map(({ score, ...venue }) => venue);

    return {
      recommendations,
      journeyContext: this.determineJourneyContext(journeyData),
      fallbacks,
      explanation: {
        energyLevel: context.energyLevel,
        reasoning: [`Found ${recommendations.length} recommendations based on your preferences`],
        factors: ['Vibe preferences', 'Terminal location', 'User context']
      },
      energySuggestion: null // Will be set by the hook
    };
  }

  private calculateRelevanceScore(venue: Amenity, context: UserContext): number {
    let score = 0;

    // Vibe matching
    if (venue.vibe_tags?.some(vibe => context.preferences.vibes.includes(vibe))) {
      score += 10;
    }

    // Price range matching
    if (context.preferences.priceRange && venue.price_tier === context.preferences.priceRange) {
      score += 5;
    }

    // Accessibility matching
    if (context.preferences.accessibility && venue.accessibility) {
      score += 3;
    }

    // Time availability (simplified)
    if (venue.opening_hours) {
      score += 2;
    }

    return score;
  }

  private determineJourneyContext(journeyData: any): 'departure' | 'transit' | 'arrival' {
    // Simple logic based on journey data
    if (journeyData.layovers && journeyData.layovers.length > 0) {
      return 'transit';
    }
    
    const now = new Date();
    const journeyDate = new Date(journeyData.date);
    const timeDiff = journeyDate.getTime() - now.getTime();
    
    if (timeDiff < 0) {
      return 'arrival';
    } else if (timeDiff < 1000 * 60 * 60 * 2) { // 2 hours
      return 'departure';
    } else {
      return 'transit';
    }
  }
} 