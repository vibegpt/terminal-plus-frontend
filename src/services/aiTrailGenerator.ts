// AI Trail Generator
// Creates personalized shopping trails based on user preferences and real-time data

import { shoppingTrailService } from './shoppingTrailService';
import { smartQueue, ActionType, Priority } from './smartQueue';

export interface UserPreferences {
  userId: string;
  interests: string[];
  budget: {
    min: number;
    max: number;
    currency: string;
  };
  duration: number; // hours
  pace: 'leisurely' | 'moderate' | 'fast';
  accessibility: 'standard' | 'wheelchair' | 'low-mobility';
  groupSize: number;
  weatherPreference: 'indoor' | 'outdoor' | 'mixed';
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'any';
}

export interface TrailStop {
  amenityId: string;
  name: string;
  category: string;
  estimatedDuration: number; // minutes
  estimatedCost: number;
  priority: number;
  location: {
    latitude: number;
    longitude: number;
    terminal: string;
  };
  vibeTags: string[];
  openingHours: Record<string, string>;
  crowdLevel?: number; // 1-5 scale
  specialFeatures?: string[];
}

export interface GeneratedTrail {
  id: string;
  userId: string;
  name: string;
  description: string;
  stops: TrailStop[];
  totalDuration: number; // minutes
  totalEstimatedCost: number;
  difficulty: 'easy' | 'moderate' | 'challenging';
  accessibility: string;
  weatherDependent: boolean;
  crowdOptimized: boolean;
  createdAt: Date;
  expiresAt: Date;
}

export interface TrailOptimizationParams {
  avoidCrowds?: boolean;
  minimizeWalking?: boolean;
  maximizeVariety?: boolean;
  preferIndoor?: boolean;
  budgetOptimized?: boolean;
}

class AITrailGenerator {
  private static instance: AITrailGenerator;
  private openaiApiKey: string | null = null;
  private fallbackMode: boolean = false;

  private constructor() {
    this.initializeOpenAI();
  }

  public static getInstance(): AITrailGenerator {
    if (!AITrailGenerator.instance) {
      AITrailGenerator.instance = new AITrailGenerator();
    }
    return AITrailGenerator.instance;
  }

  // Initialize OpenAI API
  private async initializeOpenAI(): Promise<void> {
    try {
      // Check for API key in environment or config
      this.openaiApiKey = process.env.REACT_APP_OPENAI_API_KEY || null;
      
      if (!this.openaiApiKey) {
        console.log('OpenAI API key not found, using fallback mode');
        this.fallbackMode = true;
      }
    } catch (error) {
      console.error('Failed to initialize OpenAI:', error);
      this.fallbackMode = true;
    }
  }

  // Generate personalized trail
  public async generateAITrail(
    preferences: UserPreferences,
    optimizationParams?: TrailOptimizationParams
  ): Promise<GeneratedTrail> {
    try {
      // Get available amenities
      const collection = await shoppingTrailService.getCollectionDetails();
      if (!collection) {
        throw new Error('Failed to get collection details');
      }

      // Get real-time crowd data
      const crowdData = await this.getRealTimeCrowdData();
      
      // Generate trail using AI or fallback algorithm
      let trail: GeneratedTrail;
      
      if (this.openaiApiKey && !this.fallbackMode) {
        trail = await this.generateWithAI(preferences, collection, crowdData, optimizationParams);
      } else {
        trail = await this.generateWithFallback(preferences, collection, crowdData, optimizationParams);
      }

      // Queue trail creation for analytics
      this.queueTrailCreation(trail);

      return trail;
    } catch (error) {
      console.error('Error generating AI trail:', error);
      throw new Error('Failed to generate personalized trail');
    }
  }

  // Generate trail using OpenAI
  private async generateWithAI(
    preferences: UserPreferences,
    collection: any,
    crowdData: any,
    optimizationParams?: TrailOptimizationParams
  ): Promise<GeneratedTrail> {
    try {
      // This would be the actual OpenAI API call
      // For now, we'll simulate it and use the fallback
      console.log('AI trail generation not implemented, using fallback');
      return await this.generateWithFallback(preferences, collection, crowdData, optimizationParams);
    } catch (error) {
      console.error('AI generation failed, falling back to algorithm:', error);
      return await this.generateWithFallback(preferences, collection, crowdData, optimizationParams);
    }
  }

  // Generate trail using fallback algorithm
  private async generateWithFallback(
    preferences: UserPreferences,
    collection: any,
    crowdData: any,
    optimizationParams?: TrailOptimizationParams
  ): Promise<GeneratedTrail> {
    const availableAmenities = collection.collection_amenities || [];
    
    // Filter amenities based on preferences
    let filteredAmenities = this.filterAmenitiesByPreferences(availableAmenities, preferences);
    
    // Apply optimization parameters
    if (optimizationParams) {
      filteredAmenities = this.applyOptimizationFilters(filteredAmenities, optimizationParams, crowdData);
    }
    
    // Score and rank amenities
    const scoredAmenities = this.scoreAmenities(filteredAmenities, preferences, crowdData);
    
    // Select optimal stops based on duration and budget
    const selectedStops = this.selectOptimalStops(scoredAmenities, preferences);
    
    // Create trail object
    const trail: GeneratedTrail = {
      id: this.generateTrailId(),
      userId: preferences.userId,
      name: this.generateTrailName(preferences),
      description: this.generateTrailDescription(preferences, selectedStops),
      stops: selectedStops,
      totalDuration: this.calculateTotalDuration(selectedStops),
      totalEstimatedCost: this.calculateTotalCost(selectedStops),
      difficulty: this.calculateDifficulty(selectedStops, preferences),
      accessibility: preferences.accessibility,
      weatherDependent: this.isWeatherDependent(selectedStops),
      crowdOptimized: optimizationParams?.avoidCrowds || false,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    };

    return trail;
  }

  // Filter amenities based on user preferences
  private filterAmenitiesByPreferences(amenities: any[], preferences: UserPreferences): any[] {
    return amenities.filter(amenity => {
      const detail = amenity.amenity_detail;
      
      // Budget filter
      if (detail.price_level) {
        const priceLevel = this.parsePriceLevel(detail.price_level);
        if (priceLevel < preferences.budget.min || priceLevel > preferences.budget.max) {
          return false;
        }
      }
      
      // Interest filter
      if (preferences.interests.length > 0) {
        const hasMatchingInterest = preferences.interests.some(interest =>
          detail.vibe_tags?.some((tag: string) => 
            tag.toLowerCase().includes(interest.toLowerCase())
          )
        );
        if (!hasMatchingInterest) return false;
      }
      
      // Accessibility filter
      if (preferences.accessibility !== 'standard') {
        // This would check for accessibility features in the amenity data
        // For now, we'll include all amenities
      }
      
      // Weather preference filter
      if (preferences.weatherPreference !== 'mixed') {
        // This would check if the amenity is indoor/outdoor
        // For now, we'll include all amenities
      }
      
      return true;
    });
  }

  // Apply optimization filters
  private applyOptimizationFilters(
    amenities: any[],
    optimizationParams: TrailOptimizationParams,
    crowdData: any
  ): any[] {
    let filtered = [...amenities];
    
    // Avoid crowds
    if (optimizationParams.avoidCrowds) {
      filtered = filtered.filter(amenity => {
        const crowdLevel = crowdData[amenity.amenity_detail.id] || 3;
        return crowdLevel <= 3; // Only include low to medium crowd levels
      });
    }
    
    // Minimize walking
    if (optimizationParams.minimizeWalking) {
      // Sort by proximity to create a more compact trail
      filtered.sort((a, b) => {
        // This would calculate optimal route
        return 0; // Placeholder
      });
    }
    
    // Maximize variety
    if (optimizationParams.maximizeVariety) {
      const categories = new Set();
      filtered = filtered.filter(amenity => {
        const category = amenity.amenity_detail.category;
        if (categories.has(category)) return false;
        categories.add(category);
        return true;
      });
    }
    
    return filtered;
  }

  // Score amenities based on preferences and context
  private scoreAmenities(amenities: any[], preferences: UserPreferences, crowdData: any): any[] {
    return amenities.map(amenity => {
      let score = 0;
      const detail = amenity.amenity_detail;
      
      // Base score from priority
      score += amenity.priority * 10;
      
      // Interest matching score
      if (preferences.interests.length > 0) {
        const interestMatches = preferences.interests.filter(interest =>
          detail.vibe_tags?.some((tag: string) => 
            tag.toLowerCase().includes(interest.toLowerCase())
          )
        );
        score += interestMatches.length * 20;
      }
      
      // Crowd level score (lower crowds = higher score)
      const crowdLevel = crowdData[detail.id] || 3;
      score += (6 - crowdLevel) * 5; // Invert crowd level (1=5pts, 5=1pt)
      
      // Budget optimization score
      if (detail.price_level) {
        const priceLevel = this.parsePriceLevel(detail.price_level);
        const budgetMidpoint = (preferences.budget.min + preferences.budget.max) / 2;
        const distanceFromMidpoint = Math.abs(priceLevel - budgetMidpoint);
        score += Math.max(0, 10 - distanceFromMidpoint);
      }
      
      // Featured amenity bonus
      if (amenity.is_featured) {
        score += 15;
      }
      
      return { ...amenity, score };
    }).sort((a, b) => b.score - a.score);
  }

  // Select optimal stops based on constraints
  private selectOptimalStops(scoredAmenities: any[], preferences: UserPreferences): TrailStop[] {
    const maxDuration = preferences.duration * 60; // Convert to minutes
    const maxBudget = preferences.budget.max;
    
    let currentDuration = 0;
    let currentBudget = 0;
    const selectedStops: TrailStop[] = [];
    
    for (const amenity of scoredAmenities) {
      const detail = amenity.amenity_detail;
      const estimatedDuration = this.estimateVisitDuration(detail, preferences);
      const estimatedCost = this.estimateVisitCost(detail, preferences);
      
      // Check constraints
      if (currentDuration + estimatedDuration > maxDuration) continue;
      if (currentBudget + estimatedCost > maxBudget) continue;
      
      // Add stop
      selectedStops.push({
        amenityId: detail.id,
        name: detail.name,
        category: detail.category || 'Shopping',
        estimatedDuration,
        estimatedCost,
        priority: amenity.priority,
        location: {
          latitude: detail.latitude,
          longitude: detail.longitude,
          terminal: detail.terminal_code || 'Unknown'
        },
        vibeTags: detail.vibe_tags || [],
        openingHours: detail.opening_hours || {},
        crowdLevel: 3, // Default value
        specialFeatures: []
      });
      
      currentDuration += estimatedDuration;
      currentBudget += estimatedCost;
      
      // Add buffer time between stops
      if (selectedStops.length > 1) {
        const travelTime = this.estimateTravelTime(selectedStops[selectedStops.length - 2], selectedStops[selectedStops.length - 1]);
        currentDuration += travelTime;
      }
    }
    
    return selectedStops;
  }

  // Helper methods
  private parsePriceLevel(priceLevel: string): number {
    const priceMap: Record<string, number> = {
      'low': 10,
      'medium': 50,
      'high': 100,
      'luxury': 200
    };
    return priceMap[priceLevel.toLowerCase()] || 50;
  }

  private estimateVisitDuration(detail: any, preferences: UserPreferences): number {
    const baseDuration = 30; // Base 30 minutes
    const paceMultiplier = {
      'leisurely': 1.5,
      'moderate': 1.0,
      'fast': 0.7
    };
    
    return Math.round(baseDuration * paceMultiplier[preferences.pace]);
  }

  private estimateVisitCost(detail: any, preferences: UserPreferences): number {
    if (detail.price_level) {
      return this.parsePriceLevel(detail.price_level);
    }
    return 50; // Default estimate
  }

  private estimateTravelTime(from: TrailStop, to: TrailStop): number {
    // Simple distance-based estimation
    const distance = this.calculateDistance(
      from.location.latitude,
      from.location.longitude,
      to.location.latitude,
      to.location.longitude
    );
    
    // Assume 1.4 m/s walking speed (5 km/h)
    return Math.round(distance / 1.4 / 60); // Convert to minutes
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    return R * c;
  }

  private calculateTotalDuration(stops: TrailStop[]): number {
    if (stops.length === 0) return 0;
    
    let total = stops.reduce((sum, stop) => sum + stop.estimatedDuration, 0);
    
    // Add travel time between stops
    for (let i = 1; i < stops.length; i++) {
      total += this.estimateTravelTime(stops[i - 1], stops[i]);
    }
    
    return total;
  }

  private calculateTotalCost(stops: TrailStop[]): number {
    return stops.reduce((sum, stop) => sum + stop.estimatedCost, 0);
  }

  private calculateDifficulty(stops: TrailStop[], preferences: UserPreferences): 'easy' | 'moderate' | 'challenging' {
    const totalDuration = this.calculateTotalDuration(stops);
    const totalDistance = this.calculateTotalDistance(stops);
    
    if (totalDuration <= 120 && totalDistance <= 1000) return 'easy';
    if (totalDuration <= 240 && totalDistance <= 2000) return 'moderate';
    return 'challenging';
  }

  private calculateTotalDistance(stops: TrailStop[]): number {
    if (stops.length < 2) return 0;
    
    let total = 0;
    for (let i = 1; i < stops.length; i++) {
      total += this.calculateDistance(
        stops[i - 1].location.latitude,
        stops[i - 1].location.longitude,
        stops[i].location.latitude,
        stops[i].location.longitude
      );
    }
    
    return total;
  }

  private isWeatherDependent(stops: TrailStop[]): boolean {
    // Check if any stops are outdoor
    return stops.some(stop => 
      stop.vibeTags.some(tag => 
        tag.toLowerCase().includes('outdoor') || 
        tag.toLowerCase().includes('patio') ||
        tag.toLowerCase().includes('garden')
      )
    );
  }

  private generateTrailId(): string {
    return `trail_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateTrailName(preferences: UserPreferences): string {
    const interests = preferences.interests.join(' & ');
    const duration = preferences.duration;
    return `${interests} Adventure - ${duration}hr Trail`;
  }

  private generateTrailDescription(preferences: UserPreferences, stops: TrailStop[]): string {
    const stopCount = stops.length;
    const totalCost = this.calculateTotalCost(stops);
    const totalDuration = this.calculateTotalDuration(stops);
    
    return `A personalized ${preferences.pace} ${preferences.duration}-hour shopping trail featuring ${stopCount} carefully selected stops. Perfect for ${preferences.groupSize > 1 ? 'groups' : 'individuals'} interested in ${preferences.interests.join(', ')}. Estimated total cost: $${totalCost}, total time: ${Math.round(totalDuration / 60)} hours.`;
  }

  // Get real-time crowd data (placeholder)
  private async getRealTimeCrowdData(): Promise<any> {
    // This would integrate with your actual crowd data service
    return {};
  }

  // Queue trail creation for analytics
  private queueTrailCreation(trail: GeneratedTrail): void {
    smartQueue.enqueue({
      type: ActionType.ANALYTICS,
      priority: Priority.LOW,
      payload: {
        event: 'trail_generated',
        trailId: trail.id,
        userId: trail.userId,
        stopCount: trail.stops.length,
        totalDuration: trail.totalDuration,
        totalCost: trail.totalEstimatedCost
      },
      maxRetries: 3,
      metadata: {
        userId: trail.userId
      }
    });
  }
}

// Export singleton instance
export const aiTrailGenerator = AITrailGenerator.getInstance();

// Export convenience functions
export const {
  generateAITrail
} = aiTrailGenerator;
