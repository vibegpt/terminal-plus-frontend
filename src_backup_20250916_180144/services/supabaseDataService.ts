import { supabase } from './supabaseClient';
import type { 
  AmenityForSelection, 
  SelectionResult,
  PreferenceSignals 
} from '../types/smart7';
import { performanceOptimizer } from '../utils/smart7PerformanceOptimizer';
import { sessionTracker } from '../utils/sessionTracking';

interface CollectionWithStats {
  id: number;
  name: string;
  description: string;
  theme: string;
  icon?: string;
  amenity_count: number;
  terminals: string[];
  price_range: string[];
  top_vibes: string[];
  avg_rating?: number;
  popularity_score?: number;
  is_smart7_eligible: boolean;
  last_updated?: string;
}

interface AmenityWithAccessibility extends AmenityForSelection {
  accessible_terminals: string[];
  multi_terminal: boolean;
  access_notes?: string;
}

interface CollectionInsights {
  peak_usage_hours: number[];
  avg_interaction_time: number;
  top_clicked_amenities: number[];
  user_retention_rate: number;
  recommendation_score: number;
  trending: boolean;
  trend_direction: 'up' | 'down' | 'stable';
}

class SupabaseDataService {
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly BATCH_SIZE = 50; // For batch operations

  /**
   * Get all Smart7 eligible collections with enhanced stats
   */
  async getSmart7CollectionsWithStats(
    options?: {
      includePopularity?: boolean;
      includeInsights?: boolean;
      sortBy?: 'name' | 'popularity' | 'amenity_count' | 'updated';
      limit?: number;
    }
  ): Promise<CollectionWithStats[]> {
    const cacheKey = `smart7_collections_${JSON.stringify(options)}`;
    
    // Try cache first
    const cached = await performanceOptimizer.getCached<CollectionWithStats[]>(
      cacheKey,
      async () => {
        try {
          // Base query for collections
          let query = supabase
            .from('collections')
            .select(`
              id,
              name,
              description,
              theme,
              icon,
              created_at,
              updated_at,
              collection_amenities!inner(
                amenity_detail!inner(
                  terminal_code,
                  price_level,
                  vibe_tags
                )
              )
            `);

          const { data, error } = await query;
          if (error) throw error;

          // Process collections
          const collectionsWithStats: CollectionWithStats[] = await Promise.all(
            (data || []).map(async (collection) => {
              const amenityDetails = collection.collection_amenities || [];
              const amenityCount = amenityDetails.length;

              // Extract unique values
              const terminals = [...new Set(
                amenityDetails
                  .map(ca => ca.amenity_detail?.terminal_code)
                  .filter(Boolean)
              )];

              const priceRange = [...new Set(
                amenityDetails
                  .map(ca => ca.amenity_detail?.price_level)
                  .filter(Boolean)
              )];

              // Calculate top vibes
              const vibeFrequency = new Map<string, number>();
              amenityDetails.forEach(ca => {
                ca.amenity_detail?.vibe_tags?.forEach((vibe: string) => {
                  vibeFrequency.set(vibe, (vibeFrequency.get(vibe) || 0) + 1);
                });
              });

              const topVibes = Array.from(vibeFrequency.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([vibe]) => vibe);

              // Get popularity if requested
              let popularityScore = 0;
              if (options?.includePopularity) {
                popularityScore = await this.getCollectionPopularityScore(collection.id);
              }

              return {
                id: collection.id,
                name: collection.name,
                description: collection.description,
                theme: collection.theme,
                icon: collection.icon,
                amenity_count: amenityCount,
                terminals,
                price_range: priceRange,
                top_vibes: topVibes,
                popularity_score: popularityScore,
                is_smart7_eligible: amenityCount >= 7 && amenityCount <= 21,
                last_updated: collection.updated_at
              };
            })
          );

          // Filter only Smart7 eligible
          let eligible = collectionsWithStats.filter(c => c.is_smart7_eligible);

          // Sort if requested
          if (options?.sortBy) {
            eligible.sort((a, b) => {
              switch (options.sortBy) {
                case 'popularity':
                  return (b.popularity_score || 0) - (a.popularity_score || 0);
                case 'amenity_count':
                  return b.amenity_count - a.amenity_count;
                case 'updated':
                  return new Date(b.last_updated || 0).getTime() - 
                         new Date(a.last_updated || 0).getTime();
                default:
                  return a.name.localeCompare(b.name);
              }
            });
          }

          // Apply limit if specified
          if (options?.limit) {
            eligible = eligible.slice(0, options.limit);
          }

          return eligible;
        } catch (error) {
          console.error('Failed to fetch Smart7 collections:', error);
          return [];
        }
      },
      { ttl: this.CACHE_TTL }
    );

    return cached || [];
  }

  /**
   * Get collection details by ID
   */
  async getCollectionDetails(collectionId: number): Promise<any> {
    const cacheKey = `collection_details_${collectionId}`;
    
    return await performanceOptimizer.getCached<any>(
      cacheKey,
      async () => {
        try {
          const { data, error } = await supabase
            .from('collections')
            .select('*')
            .eq('id', collectionId)
            .single();

          if (error) throw error;
          return data;
        } catch (error) {
          console.error('Failed to fetch collection details:', error);
          return null;
        }
      },
      { ttl: this.CACHE_TTL }
    );
  }

  /**
   * Get collection popularity score based on interactions
   */
  private async getCollectionPopularityScore(collectionId: number): Promise<number> {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data, error } = await supabase
        .from('amenity_interactions')
        .select('interaction_type')
        .eq('collection_id', collectionId)
        .gte('interaction_timestamp', thirtyDaysAgo.toISOString())
        .limit(1000);

      if (error) throw error;

      // Calculate weighted score
      let score = 0;
      (data || []).forEach(interaction => {
        switch (interaction.interaction_type) {
          case 'click': score += 3; break;
          case 'bookmark': score += 5; break;
          case 'navigate': score += 4; break;
          case 'view': score += 1; break;
          case 'share': score += 2; break;
        }
      });

      // Normalize to 0-100 scale
      return Math.min(100, Math.round(score / 10));
    } catch (error) {
      console.error('Failed to calculate popularity:', error);
      return 0;
    }
  }

  /**
   * Get amenities with multi-terminal access information
   */
  async getAmenitiesWithTerminalAccess(
    collectionId: number
  ): Promise<AmenityWithAccessibility[]> {
    try {
      // First get all amenities in collection
      const { data: collectionAmenities, error: collectionError } = await supabase
        .from('collection_amenities')
        .select(`
          amenity_detail!inner(
            id,
            name,
            description,
            terminal_code,
            price_level,
            vibe_tags,
            opening_hours,
            zone,
            gate_location,
            walking_time_minutes,
            category,
            is_24_hours,
            peak_hours,
            meal_times
          )
        `)
        .eq('collection_id', collectionId);

      if (collectionError) throw collectionError;

      // Get multi-terminal access data
      const amenityIds = collectionAmenities?.map(ca => ca.amenity_detail.id) || [];
      
      const { data: accessData, error: accessError } = await supabase
        .from('amenity_terminal_access')
        .select('*')
        .in('amenity_detail_id', amenityIds);

      if (accessError) throw accessError;

      // Create map of amenity to accessible terminals
      const accessMap = new Map<number, string[]>();
      (accessData || []).forEach(access => {
        if (!accessMap.has(access.amenity_detail_id)) {
          accessMap.set(access.amenity_detail_id, []);
        }
        accessMap.get(access.amenity_detail_id)?.push(access.terminal_code);
      });

      // Combine data
      const amenitiesWithAccess: AmenityWithAccessibility[] = (collectionAmenities || []).map(ca => {
        const amenity = ca.amenity_detail;
        const additionalTerminals = accessMap.get(amenity.id) || [];
        const allTerminals = [amenity.terminal_code, ...additionalTerminals].filter(Boolean);
        const uniqueTerminals = [...new Set(allTerminals)];

        return {
          ...amenity,
          accessible_terminals: uniqueTerminals,
          multi_terminal: uniqueTerminals.length > 1,
          access_notes: uniqueTerminals.length > 1 
            ? `Accessible from terminals: ${uniqueTerminals.join(', ')}`
            : undefined
        };
      });

      return amenitiesWithAccess;
    } catch (error) {
      console.error('Failed to fetch amenities with terminal access:', error);
      return [];
    }
  }

  /**
   * Get personalized collection recommendations
   */
  async getPersonalizedCollections(
    sessionId: string,
    options?: {
      limit?: number;
      excludeViewed?: boolean;
      timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
    }
  ): Promise<CollectionWithStats[]> {
    try {
      // Get user preferences
      const { supabaseTrackingService } = await import('./supabaseTrackingService');
      const preferences = await supabaseTrackingService.getUserPreferences(sessionId);

      // Get viewed collections if excluding
      let viewedCollectionIds: number[] = [];
      if (options?.excludeViewed) {
        const { data: viewedData } = await supabase
          .from('amenity_interactions')
          .select('collection_id')
          .eq('session_id', sessionId)
          .not('collection_id', 'is', null);

        viewedCollectionIds = [...new Set(
          (viewedData || []).map(d => d.collection_id).filter(Boolean)
        )] as number[];
      }

      // Get all eligible collections
      let collections = await this.getSmart7CollectionsWithStats({
        includePopularity: true,
        sortBy: 'popularity'
      });

      // Filter out viewed if requested
      if (options?.excludeViewed) {
        collections = collections.filter(c => !viewedCollectionIds.includes(c.id));
      }

      // Score collections based on preferences
      const scoredCollections = collections.map(collection => {
        let score = collection.popularity_score || 0;

        // Vibe matching
        if (preferences.topVibePreferences.length > 0) {
          const matchingVibes = collection.top_vibes.filter(vibe =>
            preferences.topVibePreferences.includes(vibe)
          );
          score += matchingVibes.length * 20;
        }

        // Price level matching
        if (preferences.preferredPriceLevel.length > 0) {
          const matchingPrices = collection.price_range.filter(price =>
            preferences.preferredPriceLevel.includes(price)
          );
          score += matchingPrices.length * 15;
        }

        // Time-based scoring
        if (options?.timeOfDay) {
          const timeThemes: Record<string, string[]> = {
            morning: ['breakfast', 'coffee', 'quick'],
            afternoon: ['lunch', 'shopping', 'leisure'],
            evening: ['dinner', 'bar', 'entertainment'],
            night: ['lounge', 'relaxation', 'quiet']
          };

          const relevantThemes = timeThemes[options.timeOfDay] || [];
          if (relevantThemes.some(theme => 
            collection.name.toLowerCase().includes(theme) ||
            collection.description.toLowerCase().includes(theme)
          )) {
            score += 25;
          }
        }

        return { ...collection, recommendation_score: score };
      });

      // Sort by recommendation score
      scoredCollections.sort((a, b) => 
        (b.recommendation_score || 0) - (a.recommendation_score || 0)
      );

      // Apply limit
      const limit = options?.limit || 5;
      return scoredCollections.slice(0, limit);
    } catch (error) {
      console.error('Failed to get personalized collections:', error);
      return [];
    }
  }

  /**
   * Get popular amenities for fallback
   */
  async getPopularAmenities(collectionId: number, limit: number = 7): Promise<AmenityForSelection[]> {
    try {
      const { data, error } = await supabase
        .from('collection_amenities')
        .select(`
          amenity_detail!inner(*)
        `)
        .eq('collection_id', collectionId)
        .limit(limit);

      if (error) throw error;

      return (data || []).map(item => 
        item.amenity_detail as unknown as AmenityForSelection
      );
    } catch (error) {
      console.error('Failed to fetch popular amenities:', error);
      return [];
    }
  }

  /**
   * Get recommended collections based on user preferences
   */
  async getRecommendedCollections(sessionId: string, limit: number = 3): Promise<any[]> {
    try {
      return await this.getPersonalizedCollections(sessionId, { limit });
    } catch (error) {
      console.error('Failed to get recommended collections:', error);
      return [];
    }
  }

  /**
   * Batch fetch amenities for multiple collections (performance optimization)
   */
  async batchFetchCollectionAmenities(
    collectionIds: number[]
  ): Promise<Map<number, AmenityForSelection[]>> {
    try {
      const result = new Map<number, AmenityForSelection[]>();

      // Batch fetch in chunks to avoid query size limits
      for (let i = 0; i < collectionIds.length; i += this.BATCH_SIZE) {
        const batch = collectionIds.slice(i, i + this.BATCH_SIZE);

        const { data, error } = await supabase
          .from('collection_amenities')
          .select(`
            collection_id,
            amenity_detail!inner(*)
          `)
          .in('collection_id', batch);

        if (error) throw error;

        // Group by collection
        (data || []).forEach(item => {
          if (!result.has(item.collection_id)) {
            result.set(item.collection_id, []);
          }
          result.get(item.collection_id)?.push(
            item.amenity_detail as unknown as AmenityForSelection
          );
        });
      }

      return result;
    } catch (error) {
      console.error('Failed to batch fetch amenities:', error);
      return new Map();
    }
  }

  /**
   * Get collection performance insights
   */
  async getCollectionInsights(
    collectionId: number,
    dateRange?: { start: Date; end: Date }
  ): Promise<CollectionInsights | null> {
    try {
      const startDate = dateRange?.start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = dateRange?.end || new Date();

      // Get interaction data
      const { data: interactions, error: interactionError } = await supabase
        .from('amenity_interactions')
        .select('*')
        .eq('collection_id', collectionId)
        .gte('interaction_timestamp', startDate.toISOString())
        .lte('interaction_timestamp', endDate.toISOString());

      if (interactionError) throw interactionError;

      // Get performance data
      const { data: performance, error: perfError } = await supabase
        .from('collection_performance')
        .select('*')
        .eq('collection_id', collectionId)
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', endDate.toISOString().split('T')[0]);

      if (perfError) throw perfError;

      // Calculate insights
      const hourlyInteractions = new Map<number, number>();
      let totalTimeSpent = 0;
      let viewCount = 0;
      const clickedAmenities = new Map<number, number>();
      const uniqueSessions = new Set<string>();

      (interactions || []).forEach(interaction => {
        const hour = new Date(interaction.interaction_timestamp).getHours();
        hourlyInteractions.set(hour, (hourlyInteractions.get(hour) || 0) + 1);

        if (interaction.time_spent_seconds) {
          totalTimeSpent += interaction.time_spent_seconds;
          viewCount++;
        }

        if (interaction.interaction_type === 'click') {
          clickedAmenities.set(
            interaction.amenity_id,
            (clickedAmenities.get(interaction.amenity_id) || 0) + 1
          );
        }

        uniqueSessions.add(interaction.session_id);
      });

      // Find peak hours
      const peakHours = Array.from(hourlyInteractions.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([hour]) => hour)
        .sort((a, b) => a - b);

      // Get top clicked amenities
      const topClicked = Array.from(clickedAmenities.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([amenityId]) => amenityId);

      // Calculate retention (simplified: sessions with multiple interactions)
      const retainedSessions = Array.from(uniqueSessions).filter(sessionId => {
        const sessionInteractions = (interactions || []).filter(i => i.session_id === sessionId);
        return sessionInteractions.length > 1;
      }).length;

      const retentionRate = uniqueSessions.size > 0
        ? retainedSessions / uniqueSessions.size
        : 0;

      // Calculate trend
      const recentPerf = (performance || []).slice(-7);
      const olderPerf = (performance || []).slice(-14, -7);
      const recentClicks = recentPerf.reduce((sum, p) => sum + (p.clicks || 0), 0);
      const olderClicks = olderPerf.reduce((sum, p) => sum + (p.clicks || 0), 0);
      
      let trendDirection: 'up' | 'down' | 'stable' = 'stable';
      if (recentClicks > olderClicks * 1.1) trendDirection = 'up';
      else if (recentClicks < olderClicks * 0.9) trendDirection = 'down';

      return {
        peak_usage_hours: peakHours,
        avg_interaction_time: viewCount > 0 ? totalTimeSpent / viewCount : 0,
        top_clicked_amenities: topClicked,
        user_retention_rate: retentionRate,
        recommendation_score: Math.min(100, Math.round(retentionRate * 100 + (performance || []).length)),
        trending: trendDirection === 'up',
        trend_direction: trendDirection
      };
    } catch (error) {
      console.error('Failed to get collection insights:', error);
      return null;
    }
  }

  /**
   * Get similar collections based on amenity overlap
   */
  async getSimilarCollections(
    collectionId: number,
    limit: number = 5
  ): Promise<CollectionWithStats[]> {
    try {
      // Get amenities in the source collection
      const { data: sourceAmenities, error: sourceError } = await supabase
        .from('collection_amenities')
        .select('amenity_detail_id')
        .eq('collection_id', collectionId);

      if (sourceError) throw sourceError;

      const sourceAmenityIds = (sourceAmenities || []).map(a => a.amenity_detail_id);

      // Find collections with overlapping amenities
      const { data: overlapping, error: overlapError } = await supabase
        .from('collection_amenities')
        .select('collection_id')
        .in('amenity_detail_id', sourceAmenityIds)
        .neq('collection_id', collectionId);

      if (overlapError) throw overlapError;

      // Count overlaps per collection
      const overlapCount = new Map<number, number>();
      (overlapping || []).forEach(item => {
        overlapCount.set(
          item.collection_id,
          (overlapCount.get(item.collection_id) || 0) + 1
        );
      });

      // Sort by overlap count and get top collections
      const topOverlapping = Array.from(overlapCount.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit * 2) // Get extra to filter for Smart7 eligible
        .map(([id]) => id);

      // Get full collection data
      const collections = await this.getSmart7CollectionsWithStats({
        includePopularity: true
      });

      // Filter and sort
      return collections
        .filter(c => topOverlapping.includes(c.id))
        .slice(0, limit);
    } catch (error) {
      console.error('Failed to get similar collections:', error);
      return [];
    }
  }

  /**
   * Track Smart7 selection performance
   */
  async trackSmart7Performance(
    sessionId: string,
    collectionId: number,
    metrics: {
      loadTime: number;
      fromCache: boolean;
      cacheAge?: number;
      selectionsCount: number;
      algorithmTime: number;
      totalAmenities: number;
      deviceType?: string;
      networkType?: string;
      isOffline?: boolean;
      error?: string;
    }
  ): Promise<void> {
    try {
      await supabase.rpc('track_smart7_performance', {
        p_session_id: sessionId,
        p_collection_id: collectionId,
        p_load_time_ms: metrics.loadTime,
        p_from_cache: metrics.fromCache,
        p_cache_age_ms: metrics.cacheAge || null,
        p_selections_count: metrics.selectionsCount,
        p_algorithm_time_ms: metrics.algorithmTime,
        p_total_amenities: metrics.totalAmenities,
        p_device_type: metrics.deviceType || 'unknown',
        p_network_type: metrics.networkType || 'unknown',
        p_is_offline: metrics.isOffline || false,
        p_error_occurred: !!metrics.error,
        p_error_message: metrics.error || null
      });
    } catch (error) {
      console.error('Failed to track Smart7 performance:', error);
    }
  }

  /**
   * Get trending amenities across all collections
   */
  async getTrendingAmenities(
    options?: {
      limit?: number;
      timeWindow?: 'day' | 'week' | 'month';
      terminal?: string;
    }
  ): Promise<AmenityForSelection[]> {
    try {
      const timeWindows = {
        day: 1,
        week: 7,
        month: 30
      };

      const daysAgo = timeWindows[options?.timeWindow || 'week'];
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysAgo);

      // Get trending amenities based on recent interactions
      let query = supabase
        .from('amenity_interactions')
        .select(`
          amenity_id,
          amenity_detail!inner(*)
        `)
        .gte('interaction_timestamp', startDate.toISOString())
        .eq('interaction_type', 'click');

      if (options?.terminal) {
        query = query.eq('amenity_detail.terminal_code', options.terminal);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Count interactions per amenity
      const amenityCount = new Map<number, { count: number; details: any }>();
      (data || []).forEach(item => {
        const id = item.amenity_id;
        if (!amenityCount.has(id)) {
          amenityCount.set(id, { count: 0, details: item.amenity_detail });
        }
        const current = amenityCount.get(id)!;
        current.count++;
      });

      // Sort by count and return top amenities
      const trending = Array.from(amenityCount.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, options?.limit || 10)
        .map(item => item.details as AmenityForSelection);

      return trending;
    } catch (error) {
      console.error('Failed to get trending amenities:', error);
      return [];
    }
  }
}

// Export singleton instance
export const supabaseDataService = new SupabaseDataService();
