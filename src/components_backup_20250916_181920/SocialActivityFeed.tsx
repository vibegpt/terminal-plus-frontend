import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, Share2, MapPin, Trophy, Users, Star, Clock, Bug } from 'lucide-react';
import { useCrowdData } from '../hooks/useCrowdData';

interface UserProfile {
  display_name: string;
  username: string;
  avatar_url: string | null;
}

interface Activity {
  id: string;
  user_profiles: UserProfile;
  activity_type: string;
  title: string;
  description: string;
  created_at: string;
  metadata: Record<string, any>;
}

interface SocialActivityFeedProps {
  airportCode?: string;
  terminal?: string;
  maxActivities?: number;
}

const SocialActivityFeed: React.FC<SocialActivityFeedProps> = ({
  airportCode,
  terminal,
  maxActivities = 10
}) => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>('');
const crowdData = useCrowdData(terminal || 'SYD-T1');
console.log('🔗 SocialActivityFeed: WebSocket connected =', !crowdData.loading);
  // Fallback mock data for when backend is empty
  const mockActivities: Activity[] = [
    {
      id: 'mock-1',
      user_profiles: {
        display_name: 'Travel Explorer',
        username: 'explorer123',
        avatar_url: null
      },
      activity_type: 'terminal_visited',
      title: 'Visited Terminal 3',
      description: 'Just arrived at Singapore Changi T3 - amazing architecture!',
      created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      metadata: { terminal_id: 'SIN-T3', airport_id: 'SIN' }
    },
    {
      id: 'mock-2',
      user_profiles: {
        display_name: 'Airport Enthusiast',
        username: 'avgeek',
        avatar_url: null
      },
      activity_type: 'achievement_earned',
      title: 'Achievement unlocked!',
      description: 'Earned "Terminal Explorer" badge for visiting 5 terminals',
      created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
      metadata: { achievement_name: 'Terminal Explorer' }
    },
    {
      id: 'mock-3',
      user_profiles: {
        display_name: 'Frequent Flyer',
        username: 'miles_collector',
        avatar_url: null
      },
      activity_type: 'favorite_added',
      title: 'Added amenity to favorites',
      description: 'Bookmarked Airbrau restaurant at Munich T2 for next visit',
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      metadata: { entity_type: 'amenity', entity_id: 'MUC-T2-AIRBRAU' }
    }
  ];

  const testConnection = async () => {
    try {
      setDebugInfo('Testing connection...');
      const { terminalHubSocial } = await import('../lib/terminalhub-social');
      const result = await terminalHubSocial.testConnection();
      setDebugInfo(`Connection test: ${result.success ? '✅' : '❌'} ${result.message}`);
    } catch (error) {
      setDebugInfo(`Connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const createTestActivity = async () => {
    try {
      setDebugInfo('Creating test activity...');
      const { terminalHubSocial } = await import('../lib/terminalhub-social');
      await terminalHubSocial.createTestActivity();
      setDebugInfo('✅ Test activity created! Check console for details.');
    } catch (error) {
      setDebugInfo(`❌ Test activity failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  useEffect(() => {
    async function loadActivities() {
      try {
        setLoading(true);
        setError(null);
        
        // Try to load real data from Supabase
        const { terminalHubSocial } = await import('../lib/terminalhub-social');
        const realActivities = await terminalHubSocial.getActivityFeed(maxActivities);
        
        if (realActivities && realActivities.length > 0) {
          // Convert SocialActivity to Activity format
          const convertedActivities: Activity[] = realActivities.map(activity => ({
            id: activity.id,
            user_profiles: {
              display_name: activity.user_profiles?.display_name || `User ${activity.user_id.slice(-4)}`,
              username: activity.user_profiles?.username || activity.user_id,
              avatar_url: activity.user_profiles?.avatar_url || null
            },
            activity_type: activity.activity_type,
            title: activity.title || 'Activity',
            description: activity.description || activity.title || 'No description',
            created_at: activity.created_at,
            metadata: activity.metadata || {}
          }));
          
          setActivities(convertedActivities);
          console.log('✅ Loaded real activities from Supabase:', realActivities.length);
        } else {
          // Use mock data if no real activities exist yet
          setActivities(mockActivities);
          console.log('📝 Using mock activities (no real data yet)');
        }
        
      } catch (error) {
        console.error('❌ Error loading activities:', error);
        setError(error instanceof Error ? error.message : 'Unknown error');
        // Fallback to mock data on error
        setActivities(mockActivities);
      } finally {
        setLoading(false);
      }
    }

    loadActivities();
  }, [maxActivities]);

  // Get activity icon based on type
  const getActivityIcon = (activityType: string) => {
    switch (activityType) {
      case 'terminal_visited':
        return <MapPin className="h-5 w-5 text-green-500" />;
      case 'achievement_earned':
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 'user_followed':
        return <Users className="h-5 w-5 text-blue-500" />;
      case 'favorite_added':
        return <Star className="h-5 w-5 text-purple-500" />;
      case 'amenity_reviewed':
        return <MessageCircle className="h-5 w-5 text-orange-500" />;
      case 'trip_planned':
        return <Clock className="h-5 w-5 text-indigo-500" />;
      case 'discover':
        return <MapPin className="h-5 w-5 text-green-500" />;
      default:
        return <MapPin className="h-5 w-5 text-gray-500" />;
    }
  };

  // Format time ago
  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const activityDate = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - activityDate.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  // Get user avatar or initials
  const getUserAvatar = (user: UserProfile) => {
    if (user.avatar_url) {
      return (
        <img 
          src={user.avatar_url} 
          alt={user.display_name || user.username}
          className="w-10 h-10 rounded-full object-cover"
        />
      );
    }
    
    const name = user.display_name || user.username || 'User';
    const initials = name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
    
    return (
      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
        {initials}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <Users className="mr-2 h-5 w-5" />
          Terminal Plus Community
        </h2>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex space-x-3 animate-pulse">
              <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold flex items-center">
          <Users className="mr-2 h-5 w-5" />
          Terminal Plus Community
        </h2>
        <p className="text-gray-600 text-sm mt-1">
          See what fellow travelers are discovering
        </p>
        
        {/* Debug Section */}
        {import.meta.env.DEV && (
          <div className="mt-4 p-3 bg-gray-100 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <Bug className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Debug Tools</span>
            </div>
            <div className="flex space-x-2 mb-2">
              <button
                onClick={testConnection}
                className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
              >
                Test Connection
              </button>
              <button
                onClick={createTestActivity}
                className="px-3 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
              >
                Create Test Activity
              </button>
            </div>
            {debugInfo && (
              <p className="text-xs text-gray-600 bg-white p-2 rounded border">
                {debugInfo}
              </p>
            )}
          </div>
        )}
        
        {error && (
          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-800 text-sm">
              ⚠️ Using demo data - Backend connection: {error}
            </p>
          </div>
        )}
        
        {!error && activities.length > 0 && activities[0].id?.startsWith('mock') && (
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-800 text-sm">
              📝 Showing demo activities - Add real users to see live data!
            </p>
          </div>
        )}
      </div>

      <div className="max-h-96 overflow-y-auto">
        {activities.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>No activities yet</p>
            <p className="text-sm">Be the first to explore Terminal Plus!</p>
          </div>
        ) : (
          <div className="space-y-0">
            {activities.map((activity, index) => (
              <div 
                key={activity.id} 
                className={`p-4 hover:bg-gray-50 transition-colors ${
                  index !== activities.length - 1 ? 'border-b border-gray-100' : ''
                }`}
              >
                <div className="flex space-x-3">
                  {getUserAvatar(activity.user_profiles)}
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-medium text-gray-900 truncate">
                        {activity.user_profiles.display_name || activity.user_profiles.username || 'Anonymous'}
                      </span>
                      <span className="text-gray-500 text-sm">•</span>
                      <span className="text-gray-500 text-sm">
                        {getTimeAgo(activity.created_at)}
                      </span>
                    </div>
                    
                    <div className="flex items-start space-x-2">
                      {getActivityIcon(activity.activity_type)}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 text-sm mb-1">
                          {activity.title}
                        </h3>
                        
                        {activity.description && (
                          <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                            {activity.description}
                          </p>
                        )}
                        
                        <div className="flex items-center space-x-4 text-gray-500">
                          <button className="flex items-center space-x-1 hover:text-red-500 transition-colors">
                            <Heart className="h-4 w-4" />
                            <span className="text-xs">Like</span>
                          </button>
                          
                          <button className="flex items-center space-x-1 hover:text-blue-500 transition-colors">
                            <MessageCircle className="h-4 w-4" />
                            <span className="text-xs">Comment</span>
                          </button>
                          
                          <button className="flex items-center space-x-1 hover:text-green-500 transition-colors">
                            <Share2 className="h-4 w-4" />
                            <span className="text-xs">Share</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {activities.length > 0 && (
        <div className="p-4 border-t border-gray-200 text-center">
          <button className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors">
            View more activities
          </button>
        </div>
      )}
    </div>
  );
};

export default SocialActivityFeed; 
