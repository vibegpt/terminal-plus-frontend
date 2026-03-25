// Enhanced Shopping Trail Service
// Provides comprehensive shopping trail functionality with error handling and caching

import { supabase } from '../lib/supabase';
import {
  CollectionDetails,
  VisitData,
  UserProgress,
  CompletionStats,
  TrailInsights,
  ShoppingTrailConfig,
  ValidationError,
  AuthenticationError,
  DatabaseError
} from '../types/shopping-trail.types';

// Configuration
const SHOPPING_TRAIL_CONFIG: ShoppingTrailConfig = {
  collectionSlug: 'singapore-shopping-trail',
  collectionUUID: 'd9884f9a-9e06-4946-b461-ade5696f2657',
  cacheDuration: 5 * 60 * 1000, // 5 minutes
  maxRating: 5,
  minRating: 1
};

// Cache for collection details
let cachedCollectionDetails: CollectionDetails | null = null;
let cacheTimestamp: number = 0;

export class ShoppingTrailService {
  private static instance: ShoppingTrailService;
  private config: ShoppingTrailConfig;

  private constructor(config: ShoppingTrailConfig) {
    this.config = config;
  }

  public static getInstance(config?: ShoppingTrailConfig): ShoppingTrailService {
    if (!ShoppingTrailService.instance) {
      ShoppingTrailService.instance = new ShoppingTrailService(
        config || SHOPPING_TRAIL_CONFIG
      );
    }
    return ShoppingTrailService.instance;
  }

  // Get collection UUID dynamically
  async getCollectionUUID(slug?: string): Promise<string> {
    try {
      const collectionSlug = slug || this.config.collectionSlug;
      
      const { data, error } = await supabase
        .rpc('get_collection_uuid', { collection_string: collectionSlug });
      
      if (error) {
        throw new DatabaseError('Failed to get collection UUID', error);
      }
      
      return data || this.config.collectionUUID;
    } catch (error) {
      console.error('Error getting collection UUID:', error);
      // Fallback to configured UUID
      return this.config.collectionUUID;
    }
  }

  // Track a single visit with validation
  async trackVisit(amenityId: string, rating: number, amount: number, userId?: string): Promise<any> {
    try {
      // Validation
      if (!userId) {
        throw new AuthenticationError('User ID is required');
      }
      
      if (rating < this.config.minRating || rating > this.config.maxRating) {
        throw new ValidationError(
          `Rating must be between ${this.config.minRating} and ${this.config.maxRating}`,
          { rating, min: this.config.minRating, max: this.config.maxRating }
        );
      }
      
      if (amount < 0) {
        throw new ValidationError('Amount cannot be negative', { amount });
      }

      const { data, error } = await supabase
        .rpc('track_visit', {
          p_user_id: userId,
          p_amenity_id: amenityId,
          p_collection_slug: this.config.collectionSlug,
          p_rating: rating,
          p_spent_amount: amount
        });
      
      if (error) {
        throw new DatabaseError('Failed to track visit', error);
      }
      
      // Clear cache to ensure fresh data
      this.clearCache();
      
      return data;
    } catch (error) {
      console.error('Error tracking visit:', error);
      throw error;
    }
  }

  // Track multiple visits at once
  async trackMultipleVisits(visits: VisitData[], userId?: string): Promise<any> {
    try {
      if (!userId) {
        throw new AuthenticationError('User ID is required');
      }

      // Validate all visits
      visits.forEach((visit, index) => {
        if (visit.rating < this.config.minRating || visit.rating > this.config.maxRating) {
          throw new ValidationError(
            `Visit ${index + 1}: Rating must be between ${this.config.minRating} and ${this.config.maxRating}`,
            { visit, index }
          );
        }
        
        if (visit.amount < 0) {
          throw new ValidationError(
            `Visit ${index + 1}: Amount cannot be negative`,
            { visit, index }
          );
        }
      });

      const { data, error } = await supabase
        .rpc('track_multiple_visits', {
          p_user_id: userId,
          p_visits: visits.map(v => ({
            amenity_id: v.amenityId,
            rating: v.rating,
            spent_amount: v.amount
          })),
          p_collection_slug: this.config.collectionSlug
        });
      
      if (error) {
        throw new DatabaseError('Failed to track multiple visits', error);
      }
      
      // Clear cache to ensure fresh data
      this.clearCache();
      
      return data;
    } catch (error) {
      console.error('Error tracking multiple visits:', error);
      throw error;
    }
  }

  // Get user progress with caching
  async getUserProgress(userId?: string): Promise<UserProgress | null> {
    try {
      if (!userId) {
        throw new AuthenticationError('User ID is required');
      }

      const { data, error } = await supabase
        .rpc('get_user_progress', {
          p_user_id: userId,
          p_collection_slug: this.config.collectionSlug
        });
      
      if (error) {
        throw new DatabaseError('Failed to get user progress', error);
      }
      
      return data?.[0] || null;
    } catch (error) {
      console.error('Error getting user progress:', error);
      throw error;
    }
  }

  // Get collection details with caching
  async getCollectionDetails(): Promise<CollectionDetails | null> {
    try {
      // Check cache first
      const now = Date.now();
      if (cachedCollectionDetails && (now - cacheTimestamp) < this.config.cacheDuration) {
        return cachedCollectionDetails;
      }

      const { data, error } = await supabase
        .from('collections')
        .select(`
          *,
          collection_amenities (
            priority,
            is_featured,
            amenity_detail (
              id,
              name,
              description,
              vibe_tags,
              price_level,
              opening_hours,
              latitude,
              longitude
            )
          )
        `)
        .eq('collection_id', this.config.collectionSlug)
        .single();
      
      if (error) {
        throw new DatabaseError('Failed to get collection details', error);
      }
      
      if (data) {
        // Sort amenities by priority
        data.collection_amenities.sort((a: any, b: any) => a.priority - b.priority);
        
        // Add computed fields
        data.total_amenities = data.collection_amenities.length;
        data.featured_count = data.collection_amenities.filter((a: any) => a.is_featured).length;
        
        // Update cache
        cachedCollectionDetails = data;
        cacheTimestamp = now;
      }
      
      return data;
    } catch (error) {
      console.error('Error getting collection details:', error);
      throw error;
    }
  }

  // Get completion statistics
  async getCompletionStats(userId?: string): Promise<CompletionStats | null> {
    try {
      const progress = await this.getUserProgress(userId);
      const collection = await this.getCollectionDetails();
      
      if (!progress || !collection) {
        return null;
      }
      
      const totalAmenities = collection.total_amenities;
      const visitedCount = progress.visited_amenities?.length || 0;
      const completionPercentage = totalAmenities > 0 ? (visitedCount / totalAmenities) * 100 : 0;
      
      return {
        visited: visitedCount,
        total: totalAmenities,
        percentage: Math.round(completionPercentage),
        remaining: totalAmenities - visitedCount,
        total_spent: progress.total_spent || 0,
        average_rating: progress.average_rating || 0
      };
    } catch (error) {
      console.error('Error getting completion stats:', error);
      throw error;
    }
  }

  // Get trail insights and analytics
  async getTrailInsights(): Promise<TrailInsights | null> {
    try {
      const { data, error } = await supabase
        .rpc('get_trail_insights', {
          p_collection_slug: this.config.collectionSlug
        });
      
      if (error) {
        throw new DatabaseError('Failed to get trail insights', error);
      }
      
      return data;
    } catch (error) {
      console.error('Error getting trail insights:', error);
      throw error;
    }
  }

  // Sync existing amenities to the collection system
  async syncAmenitiesToCollection(): Promise<any[]> {
    try {
      // Import existing amenities data
      const sinT1Amenities = await import('../data/sin_t1.json');
      const jewelAmenities = await import('../data/sin_jewel.json');
      
      // Filter for shopping-related amenities
      const shoppingAmenities = [
        ...sinT1Amenities.default.filter((a: any) => a.category === 'Shopping'),
        ...jewelAmenities.default.filter((a: any) => a.category === 'Shopping')
      ];
      
      // Create collection amenities with priorities
      const collectionAmenities = shoppingAmenities.map((amenity: any, index: number) => ({
        amenity_id: amenity.id || amenity.slug,
        priority: index + 1,
        is_featured: index < 10, // First 10 are featured
        collection_slug: this.config.collectionSlug,
        name: amenity.name,
        category: amenity.category,
        terminal_code: amenity.terminal_code
      }));
      
      return collectionAmenities;
    } catch (error) {
      console.error('Error syncing amenities to collection:', error);
      throw error;
    }
  }

  // Real-time progress subscription
  subscribeToProgress(userId: string, onUpdate: (payload: any) => void) {
    return supabase
      .channel(`progress-${userId}-${this.config.collectionSlug}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'user_progress',
        filter: `user_id=eq.${userId} AND collection_slug=eq.${this.config.collectionSlug}`
      }, onUpdate)
      .subscribe();
  }

  // Clear cache
  clearCache(): void {
    cachedCollectionDetails = null;
    cacheTimestamp = 0;
  }

  // Get cache status
  getCacheStatus(): { hasCache: boolean; age: number } {
    const now = Date.now();
    const hasCache = cachedCollectionDetails !== null;
    const age = hasCache ? now - cacheTimestamp : 0;
    
    return { hasCache, age };
  }
}

// Export singleton instance
export const shoppingTrailService = ShoppingTrailService.getInstance();

// Export convenience functions
export const {
  trackVisit,
  trackMultipleVisits,
  getUserProgress,
  getCollectionDetails,
  getCompletionStats,
  getTrailInsights,
  syncAmenitiesToCollection,
  subscribeToProgress
} = shoppingTrailService;
