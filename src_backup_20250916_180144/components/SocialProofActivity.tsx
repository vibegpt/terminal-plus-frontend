import React, { useState, useEffect } from 'react';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { 
  Users, 
  MapPin, 
  Coffee, 
  ShoppingBag, 
  Plane, 
  Clock,
  TrendingUp,
  Heart
} from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import type { SocialActivity, ActivityType } from '@/types/social.types';

interface SocialProofActivityProps {
  airportCode: string;
  terminal?: string;
  maxActivities?: number;
  refreshInterval?: number;
  className?: string;
}

export const SocialProofActivity: React.FC<SocialProofActivityProps> = ({
  airportCode,
  terminal,
  maxActivities = 5,
  refreshInterval = 30000, // 30 seconds
  className = ''
}) => {
  const { theme } = useTheme();
  const [activities, setActivities] = useState<SocialActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Mock data for demonstration - replace with real API
  const mockActivities: SocialActivity[] = [
    {
      id: '1',
      userId: 'user_123',
      username: 'Sarah M.',
      userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
      activityType: 'checkin',
      location: 'Coffee Corner',
      terminal: 'T1',
      timestamp: new Date(Date.now() - 2 * 60 * 1000), // 2 minutes ago
      vibe: 'refuel',
      rating: 4.5,
      comment: 'Great coffee spot! ☕'
    },
    {
      id: '2',
      userId: 'user_456',
      username: 'Alex K.',
      userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
      activityType: 'review',
      location: 'Duty Free Shop',
      terminal: 'T2',
      timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
      vibe: 'explore',
      rating: 4.2,
      comment: 'Found some great deals! 🛍️'
    },
    {
      id: '3',
      userId: 'user_789',
      username: 'Mike R.',
      userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mike',
      activityType: 'favorite',
      location: 'Quiet Lounge',
      terminal: 'T1',
      timestamp: new Date(Date.now() - 8 * 60 * 1000), // 8 minutes ago
      vibe: 'chill',
      rating: 4.8,
      comment: 'Perfect for relaxing ✨'
    },
    {
      id: '4',
      userId: 'user_101',
      username: 'Emma L.',
      userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma',
      activityType: 'checkin',
      location: 'Work Pod',
      terminal: 'T3',
      timestamp: new Date(Date.now() - 12 * 60 * 1000), // 12 minutes ago
      vibe: 'work',
      rating: 4.3,
      comment: 'Productive workspace 💼'
    },
    {
      id: '5',
      userId: 'user_202',
      username: 'David P.',
      userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=David',
      activityType: 'review',
      location: 'Quick Bite Station',
      terminal: 'T2',
      timestamp: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
      vibe: 'quick',
      rating: 4.0,
      comment: 'Fast and tasty! 🍔'
    }
  ];

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Filter activities by airport and terminal if specified
        const filteredActivities = mockActivities.filter(activity => {
          if (terminal && activity.terminal !== terminal) return false;
          return true;
        });

        setActivities(filteredActivities.slice(0, maxActivities));
        setLastUpdated(new Date());
      } catch (err) {
        setError('Failed to load social activities');
        console.error('Social proof error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchActivities();

    // Set up refresh interval
    const interval = setInterval(fetchActivities, refreshInterval);

    return () => clearInterval(interval);
  }, [airportCode, terminal, maxActivities, refreshInterval]);

  const getActivityIcon = (activityType: ActivityType) => {
    switch (activityType) {
      case 'checkin':
        return <MapPin className="w-4 h-4 text-blue-500" />;
      case 'review':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'favorite':
        return <Heart className="w-4 h-4 text-red-500" />;
      case 'photo':
        return <Coffee className="w-4 h-4 text-orange-500" />;
      default:
        return <Users className="w-4 h-4 text-gray-500" />;
    }
  };

  const getVibeIcon = (vibe: string) => {
    switch (vibe) {
      case 'refuel':
        return <Coffee className="w-3 h-3" />;
      case 'explore':
        return <ShoppingBag className="w-3 h-3" />;
      case 'chill':
        return <Heart className="w-3 h-3" />;
      case 'work':
        return <Plane className="w-3 h-3" />;
      case 'quick':
        return <Clock className="w-3 h-3" />;
      default:
        return <MapPin className="w-3 h-3" />;
    }
  };

  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - timestamp.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  const getVibeColor = (vibe: string) => {
    const vibeColors: Record<string, string> = {
      chill: 'bg-violet-100 text-violet-800 border-violet-200',
      refuel: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      comfort: 'bg-blue-100 text-blue-800 border-blue-200',
      explore: 'bg-green-100 text-green-800 border-green-200',
      quick: 'bg-red-100 text-red-800 border-red-200',
      work: 'bg-orange-100 text-orange-800 border-orange-200'
    };
    return vibeColors[vibe] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  if (isLoading) {
    return (
      <Card className={`${className}`}>
        <CardContent className="p-4">
          <div className="flex items-center space-x-2 mb-3">
            <Users className="w-5 h-5 text-gray-500" />
            <h3 className="font-semibold text-gray-700">Live Activity</h3>
          </div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center space-x-3 animate-pulse">
                <div className="w-8 h-8 bg-gray-200 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-3/4" />
                  <div className="h-2 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={`${className}`}>
        <CardContent className="p-4">
          <div className="text-center text-gray-500">
            <Users className="w-8 h-8 mx-auto mb-2" />
            <p className="text-sm">Unable to load live activity</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`${className}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-gray-500" />
            <h3 className="font-semibold text-gray-700">Live Activity</h3>
            <Badge variant="secondary" className="text-xs">
              {activities.length} active
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.location.reload()}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            Updated {formatTimeAgo(lastUpdated)}
          </Button>
        </div>

        <div className="space-y-3">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50/50 hover:bg-gray-100/50 transition-colors"
            >
              <Avatar className="w-8 h-8">
                <AvatarImage src={activity.userAvatar} alt={activity.username} />
                <AvatarFallback className="text-xs">
                  {activity.username.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="font-medium text-sm text-gray-900 truncate">
                    {activity.username}
                  </span>
                  <span className="text-xs text-gray-500">
                    {formatTimeAgo(activity.timestamp)}
                  </span>
                </div>

                <div className="flex items-center space-x-2 mb-2">
                  {getActivityIcon(activity.activityType)}
                  <span className="text-sm text-gray-700">
                    {activity.activityType === 'checkin' && 'checked in at'}
                    {activity.activityType === 'review' && 'reviewed'}
                    {activity.activityType === 'favorite' && 'favorited'}
                    {activity.activityType === 'photo' && 'shared photo of'}
                  </span>
                  <span className="font-medium text-sm text-gray-900">
                    {activity.location}
                  </span>
                </div>

                {activity.comment && (
                  <p className="text-sm text-gray-600 mb-2">
                    "{activity.comment}"
                  </p>
                )}

                <div className="flex items-center space-x-2">
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${getVibeColor(activity.vibe)}`}
                  >
                    {getVibeIcon(activity.vibe)}
                    <span className="ml-1 capitalize">{activity.vibe}</span>
                  </Badge>
                  
                  {activity.rating && (
                    <div className="flex items-center space-x-1">
                      <span className="text-xs text-gray-500">★</span>
                      <span className="text-xs font-medium text-gray-700">
                        {activity.rating}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {activities.length === 0 && (
          <div className="text-center py-6 text-gray-500">
            <Users className="w-8 h-8 mx-auto mb-2" />
            <p className="text-sm">No recent activity</p>
            <p className="text-xs">Be the first to check in!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}; 