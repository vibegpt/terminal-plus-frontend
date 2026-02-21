import { supabase } from './supabaseClient';
import type { 
  UserSession, 
  AmenityInteraction, 
  CollectionPerformance 
} from '../types/tracking';

class SupabaseTrackingService {
  /**
   * Create or update a user session
   */
  async upsertSession(session: Partial<UserSession>): Promise<UserSession | null> {
    try {
      const { data, error } = await supabase
        .from('user_sessions')
        .upsert({
          ...session,
          last_active: new Date().toISOString()
        }, {
          onConflict: 'session_id'
        })
        .select()
        .single();

      if (error) {
        console.error('Failed to upsert session:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Failed to upsert session:', error);
      return null;
    }
  }

  /**
   * Batch insert amenity interactions
   */
  async batchInsertInteractions(interactions: AmenityInteraction[]): Promise<boolean> {
    if (interactions.length === 0) return true;

    try {
      const { error } = await supabase
        .from('amenity_interactions')
        .insert(interactions);

      if (error) {
        console.error('Failed to insert interactions:', error);
        return false;
      }

      // Update collection performance metrics
      await this.updateCollectionPerformance(interactions);

      return true;
    } catch (error) {
      console.error('Failed to batch insert interactions:', error);
      return false;
    }
  }

  /**
   * Insert a single interaction (for immediate tracking)
   */
  async insertInteraction(interaction: AmenityInteraction): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('amenity_interactions')
        .insert([interaction]);

      if (error) {
        console.error('Failed to insert interaction:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Failed to insert interaction:', error);
      return false;
    }
  }

  /**
   * Update collection performance metrics
   */
  private async updateCollectionPerformance(interactions: AmenityInteraction[]): Promise<void> {
    // Group interactions by collection and date
    const performanceMap = new Map<string, {
      collection_id: number;
      date: string;
      views: number;
      clicks: number;
      bookmarks: number;
      smart7_selections: number;
      total_time_spent: number;
      sessions: Set<string>;
    }>();

    interactions.forEach(interaction => {
      if (!interaction.collection_id) return;

      const date = interaction.interaction_timestamp.split('T')[0];
      const key = `${interaction.collection_id}_${date}`;

      if (!performanceMap.has(key)) {
        performanceMap.set(key, {
          collection_id: interaction.collection_id,
          date,
          views: 0,
          clicks: 0,
          bookmarks: 0,
          smart7_selections: 0,
          total_time_spent: 0,
          sessions: new Set()
        });
      }

      const perf = performanceMap.get(key)!;
      perf.sessions.add(interaction.session_id);

      switch (interaction.interaction_type) {
        case 'view':
          perf.views++;
          if (interaction.time_spent_seconds) {
            perf.total_time_spent += interaction.time_spent_seconds;
          }
          break;
        case 'click':
          perf.clicks++;
          break;
        case 'bookmark':
          perf.bookmarks++;
          break;
      }

      if (interaction.is_smart7_selection) {
        perf.smart7_selections++;
      }
    });

    // Update each collection's performance
    for (const perf of performanceMap.values()) {
      await this.upsertCollectionPerformance({
        collection_id: perf.collection_id,
        date: perf.date,
        views: perf.views,
        clicks: perf.clicks,
        bookmarks: perf.bookmarks,
        smart7_selections: perf.smart7_selections,
        unique_sessions: perf.sessions.size,
        ctr: perf.views > 0 ? (perf.clicks / perf.views) : 0,
        avg_time_spent: perf.views > 0 ? (perf.total_time_spent / perf.views) : 0
      });
    }
  }

  /**
   * Upsert collection performance metrics
   */
  private async upsertCollectionPerformance(performance: Partial<CollectionPerformance>): Promise<void> {
    try {
      // First, get existing performance data for the day
      const { data: existing } = await supabase
        .from('collection_performance')
        .select('*')
        .eq('collection_id', performance.collection_id)
        .eq('date', performance.date)
        .single();

      if (existing) {
        // Increment existing metrics
        const { error } = await supabase
          .from('collection_performance')
          .update({
            views: (existing.views || 0) + (performance.views || 0),
            clicks: (existing.clicks || 0) + (performance.clicks || 0),
            bookmarks: (existing.bookmarks || 0) + (performance.bookmarks || 0),
            smart7_selections: (existing.smart7_selections || 0) + (performance.smart7_selections || 0),
            unique_sessions: Math.max(existing.unique_sessions || 0, performance.unique_sessions || 0),
            // Recalculate CTR and avg time spent
            ctr: existing.views + (performance.views || 0) > 0 
              ? ((existing.clicks || 0) + (performance.clicks || 0)) / ((existing.views || 0) + (performance.views || 0))
              : 0,
            avg_time_spent: performance.avg_time_spent // This would need more complex calculation
          })
          .eq('id', existing.id);

        if (error) {
          console.error('Failed to update collection performance:', error);
        }
      } else {
        // Insert new performance record
        const { error } = await supabase
          .from('collection_performance')
          .insert([performance]);

        if (error) {
          console.error('Failed to insert collection performance:', error);
        }
      }
    } catch (error) {
      console.error('Failed to upsert collection performance:', error);
    }
  }

  /**
   * Get user interaction history
   */
  async getUserInteractionHistory(
    sessionId: string, 
    limit: number = 50
  ): Promise<AmenityInteraction[]> {
    try {
      const { data, error } = await supabase
        .from('amenity_interactions')
        .select('*')
        .eq('session_id', sessionId)
        .order('interaction_timestamp', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Failed to get interaction history:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Failed to get interaction history:', error);
      return [];
    }
  }

  /**
   * Get user preferences based on interactions
   */
  async getUserPreferences(sessionId: string): Promise<{
    topVibePreferences: string[];
    preferredPriceLevel: string[];
    frequentlyClickedAmenities: number[];
    engagementPattern: 'quick' | 'explorer' | 'focused';
  }> {
    try {
      // Get all interactions for this session
      const { data: interactions } = await supabase
        .from('amenity_interactions')
        .select(`
          *,
          amenity_detail!inner(
            id,
            vibe_tags,
            price_level
          )
        `)
        .eq('session_id', sessionId);

      if (!interactions || interactions.length === 0) {
        return {
          topVibePreferences: [],
          preferredPriceLevel: [],
          frequentlyClickedAmenities: [],
          engagementPattern: 'quick'
        };
      }

      // Analyze vibe preferences
      const vibeCount = new Map<string, number>();
      const priceCount = new Map<string, number>();
      const amenityClicks = new Map<number, number>();
      let totalTimeSpent = 0;
      let viewCount = 0;

      interactions.forEach((interaction: any) => {
        // Count vibe tags
        if (interaction.amenity_detail?.vibe_tags) {
          interaction.amenity_detail.vibe_tags.forEach((tag: string) => {
            vibeCount.set(tag, (vibeCount.get(tag) || 0) + 1);
          });
        }

        // Count price levels
        if (interaction.amenity_detail?.price_level) {
          const price = interaction.amenity_detail.price_level;
          priceCount.set(price, (priceCount.get(price) || 0) + 1);
        }

        // Count clicks
        if (interaction.interaction_type === 'click') {
          amenityClicks.set(
            interaction.amenity_id,
            (amenityClicks.get(interaction.amenity_id) || 0) + 1
          );
        }

        // Track time spent
        if (interaction.time_spent_seconds) {
          totalTimeSpent += interaction.time_spent_seconds;
          viewCount++;
        }
      });

      // Sort and get top preferences
      const topVibePreferences = Array.from(vibeCount.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([vibe]) => vibe);

      const preferredPriceLevel = Array.from(priceCount.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([price]) => price);

      const frequentlyClickedAmenities = Array.from(amenityClicks.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([id]) => id);

      // Determine engagement pattern
      const avgTimePerView = viewCount > 0 ? totalTimeSpent / viewCount : 0;
      let engagementPattern: 'quick' | 'explorer' | 'focused' = 'quick';
      
      if (avgTimePerView > 30) {
        engagementPattern = 'explorer';
      } else if (frequentlyClickedAmenities.length > 0 && amenityClicks.size < 5) {
        engagementPattern = 'focused';
      }

      return {
        topVibePreferences,
        preferredPriceLevel,
        frequentlyClickedAmenities,
        engagementPattern
      };
    } catch (error) {
      console.error('Failed to get user preferences:', error);
      return {
        topVibePreferences: [],
        preferredPriceLevel: [],
        frequentlyClickedAmenities: [],
        engagementPattern: 'quick'
      };
    }
  }

  /**
   * Get collection performance stats
   */
  async getCollectionPerformance(
    collectionId: number,
    dateRange?: { start: string; end: string }
  ): Promise<CollectionPerformance[]> {
    try {
      let query = supabase
        .from('collection_performance')
        .select('*')
        .eq('collection_id', collectionId)
        .order('date', { ascending: false });

      if (dateRange) {
        query = query
          .gte('date', dateRange.start)
          .lte('date', dateRange.end);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Failed to get collection performance:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Failed to get collection performance:', error);
      return [];
    }
  }
}

// Export singleton instance
export const supabaseTrackingService = new SupabaseTrackingService();
