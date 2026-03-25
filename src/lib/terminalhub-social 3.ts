import { supabase } from './supabase'
import type { Database } from './supabase'

type SocialActivity = Database['public']['Tables']['social_activities']['Row']
type UserProfile = Database['public']['Tables']['user_profiles']['Row']
type UserSocialStats = Database['public']['Tables']['user_social_stats']['Row']
type UserFollow = Database['public']['Tables']['user_follows']['Row']
type UserFavorite = Database['public']['Tables']['user_favorites']['Row']
type Achievement = Database['public']['Tables']['achievements']['Row']
type UserAchievement = Database['public']['Tables']['user_achievements']['Row']

import type { Vibe } from '@/types/common.types';

export interface AnonymizedActivity {
  id: string
  activityType: 'terminal_visited' | 'amenity_reviewed' | 'trip_planned' | 'achievement_earned' | 'user_followed' | 'favorite_added' | 'photo_shared'
  location: string
  terminal: string
  vibe: Vibe
  userCount: number
  averageRating?: number
  timestamp: Date
  timeRange: string
  anonymizedId: string
  description: string
}

export interface SocialFeedItem {
  id: string
  type: 'activity' | 'achievement' | 'follow'
  content: string
  timestamp: Date
  user: {
    id: string
    name: string
    avatar?: string
  }
  metadata?: Record<string, any>
}

export interface SocialProofConfig {
  enabled: boolean
  privacyLevel: 'aggregated' | 'anonymous' | 'minimal' | 'public'
  maxActivities: number
  refreshInterval: number
  showUserCounts: boolean
}

export const terminalHubSocial = {
  // Enhanced getActivityFeed with better error handling and debugging
  async getActivityFeed(limit: number = 10): Promise<SocialActivity[]> {
    try {
      console.log('🔍 getActivityFeed: Starting simplified request for', limit, 'activities');
      
      // Import supabase client
      const { supabase } = await import('./supabase');
      console.log('✅ getActivityFeed: Supabase client imported');

      // Skip table check - go directly to the data query
      console.log('🔍 getActivityFeed: Attempting direct query...');

      // Try the simplest possible query first
      const { data: simpleData, error: simpleError } = await supabase
        .from('social_activities')
        .select('*')
        .limit(limit);

      if (simpleError) {
        console.error('❌ getActivityFeed: Simple query failed:', simpleError);
        throw new Error(`Query failed: ${simpleError.message || 'Unknown error'}`);
      }

      console.log('✅ getActivityFeed: Simple query successful!');
      console.log('📊 Found', simpleData?.length || 0, 'activities');

      if (!simpleData || simpleData.length === 0) {
        console.log('📝 getActivityFeed: No activities found, returning empty array');
        return [];
      }

      // Try to get user profiles separately
      const userIds = [...new Set(simpleData.map(activity => activity.user_id))];
      console.log('🔍 Getting user profiles for', userIds.length, 'users');

      const { data: profiles, error: profileError } = await supabase
        .from('user_profiles')
        .select('id, username, display_name, avatar_url')
        .in('id', userIds);

      if (profileError) {
        console.log('⚠️ Could not fetch user profiles:', profileError.message);
      }

      // Combine activities with profiles
      const activitiesWithProfiles = simpleData.map(activity => {
        const userProfile = profiles?.find(p => p.id === activity.user_id) || {
          id: activity.user_id,
          username: 'demo_user',
          display_name: 'Demo User',
          avatar_url: null
        };

        return {
          ...activity,
          user_profiles: {
            username: userProfile.username,
            display_name: userProfile.display_name,
            avatar_url: userProfile.avatar_url
          }
        };
      });

      console.log('✅ getActivityFeed: Successfully returning', activitiesWithProfiles.length, 'activities with profiles');
      return activitiesWithProfiles;

    } catch (error) {
      console.error('❌ getActivityFeed: Unexpected error:', error);
      throw error;
    }
  },

  // Add a simple test function to verify connection
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const { supabase } = await import('./supabase');
      
      // Test basic connection
      const { data, error } = await supabase
        .from('user_profiles')
        .select('count(*)', { count: 'exact', head: true });

      if (error) {
        return { success: false, message: `Connection failed: ${error.message}` };
      }

      return { success: true, message: 'Connection successful' };
    } catch (error) {
      return { success: false, message: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
  },

  // Function to create a test activity (for debugging)
  async createTestActivity(): Promise<void> {
    try {
      console.log('🧪 Creating test activity...');
      
      const { supabase } = await import('./supabase');
      
      // First, we need a user profile - let's create one if it doesn't exist
      // For testing, we'll use a fixed UUID
      const testUserId = '00000000-0000-0000-0000-000000000001';
      
      // Try to create a test user profile
      const { error: profileError } = await supabase
        .from('user_profiles')
        .upsert({
          id: testUserId,
          username: 'test_traveler',
          display_name: 'Test Traveler',
          avatar_url: null
        });

      if (profileError) {
        console.log('⚠️ Could not create test user (might need auth):', profileError.message);
      }

      // Create test activity (this might fail due to RLS policies)
      const { data, error } = await supabase
        .from('social_activities')
        .insert({
          user_id: testUserId,
          activity_type: 'terminal_visited',
          title: 'Visited Sydney Terminal 1',
          description: 'Just arrived at SYD T1 - great coffee at Campos!',
          metadata: { terminal_id: 'SYD-T1', airport_id: 'SYD' }
        })
        .select();

      if (error) {
        console.log('⚠️ Could not create test activity (RLS policy):', error.message);
        throw error;
      }

      console.log('✅ Test activity created:', data);
    } catch (error) {
      console.error('❌ createTestActivity failed:', error);
      throw error;
    }
  },

  // Create new activity
  async createActivity(activity: {
    user_id: string
    activity_type: SocialActivity['activity_type']
    title: string
    description?: string
    metadata?: any
    is_public?: boolean
    terminal_id?: string
    amenity_id?: string
    airport_id?: string
  }): Promise<SocialActivity | null> {
    try {
      const { data, error } = await supabase
        .from('social_activities')
        .insert({
          ...activity,
          is_public: activity.is_public ?? true
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating activity:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error creating activity:', error)
      return null
    }
  },

  // User Profile Management
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error fetching user profile:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error fetching user profile:', error)
      return null
    }
  },

  async updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single()

      if (error) {
        console.error('Error updating user profile:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error updating user profile:', error)
      return null
    }
  },

  // User Social Stats
  async getUserSocialStats(userId: string): Promise<UserSocialStats | null> {
    try {
      const { data, error } = await supabase
        .from('user_social_stats')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error) {
        console.error('Error fetching user social stats:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error fetching user social stats:', error)
      return null
    }
  },

  async updateUserSocialStats(userId: string, updates: Partial<UserSocialStats>): Promise<UserSocialStats | null> {
    try {
      const { data, error } = await supabase
        .from('user_social_stats')
        .upsert({
          user_id: userId,
          ...updates
        })
        .select()
        .single()

      if (error) {
        console.error('Error updating user social stats:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error updating user social stats:', error)
      return null
    }
  },

  // Achievements
  async getUserAchievements(userId: string): Promise<UserAchievement[]> {
    try {
      const { data, error } = await supabase
        .from('user_achievements')
        .select(`
          *,
          achievements (*)
        `)
        .eq('user_id', userId)

      if (error) {
        console.error('Error fetching user achievements:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error fetching user achievements:', error)
      return []
    }
  },

  async awardAchievement(userId: string, achievementId: string): Promise<UserAchievement | null> {
    try {
      const { data, error } = await supabase
        .from('user_achievements')
        .upsert({
          user_id: userId,
          achievement_id: achievementId,
          earned_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) {
        console.error('Error awarding achievement:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error awarding achievement:', error)
      return null
    }
  },

  // User Follows
  async followUser(followerId: string, followingId: string): Promise<UserFollow | null> {
    try {
      const { data, error } = await supabase
        .from('user_follows')
        .insert({
          follower_id: followerId,
          following_id: followingId
        })
        .select()
        .single()

      if (error) {
        console.error('Error following user:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error following user:', error)
      return null
    }
  },

  async unfollowUser(followerId: string, followingId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_follows')
        .delete()
        .eq('follower_id', followerId)
        .eq('following_id', followingId)

      if (error) {
        console.error('Error unfollowing user:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error unfollowing user:', error)
      return false
    }
  },

  // User Favorites
  async addToFavorites(userId: string, entityType: string, entityId: string, notes?: string): Promise<UserFavorite | null> {
    try {
      const { data, error } = await supabase
        .from('user_favorites')
        .insert({
          user_id: userId,
          entity_type: entityType,
          entity_id: entityId,
          notes
        })
        .select()
        .single()

      if (error) {
        console.error('Error adding to favorites:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error adding to favorites:', error)
      return null
    }
  },

  async removeFromFavorites(userId: string, entityType: string, entityId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_favorites')
        .delete()
        .eq('user_id', userId)
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)

      if (error) {
        console.error('Error removing from favorites:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error removing from favorites:', error)
      return false
    }
  },

  // Utility Methods
  getVibeFromActivity(activity: SocialActivity): Vibe {
    // Extract vibe from activity metadata or title
    const vibeKeywords: Vibe[] = ['refuel', 'chill', 'work', 'comfort', 'explore', 'quick', 'social', 'shop']
    const title = activity.title.toLowerCase()
    
    for (const vibe of vibeKeywords) {
      if (title.includes(vibe)) {
        return vibe
      }
    }
    
    return 'explore' // Default vibe
  },

  // Real-time subscriptions
  subscribeToActivityFeed(callback: (activity: AnonymizedActivity) => void) {
    return supabase
      .channel('social_activities')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'social_activities'
        },
        (payload) => {
          const activity = payload.new as SocialActivity
          // Transform to anonymized format
          const anonymized: AnonymizedActivity = {
            id: activity.id,
            activityType: activity.activity_type,
            location: activity.metadata?.location || 'Unknown',
            terminal: activity.metadata?.terminal || 'Unknown',
            vibe: this.getVibeFromActivity(activity),
            userCount: 1,
            timestamp: new Date(activity.created_at),
            timeRange: 'recent',
            anonymizedId: `user_${activity.user_id.slice(-6)}`,
            description: activity.description || activity.title
          }
          callback(anonymized)
        }
      )
      .subscribe()
  },

  // Configuration
  getDefaultConfig(): SocialProofConfig {
    return {
      enabled: true,
      privacyLevel: 'aggregated',
      maxActivities: 10,
      refreshInterval: 30000, // 30 seconds
      showUserCounts: true
    }
  }
}

export default terminalHubSocial 