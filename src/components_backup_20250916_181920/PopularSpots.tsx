import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { 
  TrendingUp, 
  MapPin, 
  Star, 
  Users, 
  Activity,
  Eye,
  Clock,
  Zap,
  Heart,
  Coffee,
  ShoppingBag,
  Target,
  BarChart3,
  RefreshCw
} from 'lucide-react';
import { useAmenities } from '@/hooks/useAmenities';
import { useVibeColors } from '@/hooks/useVibeColors';
import { useTheme } from '@/hooks/useTheme';
import type { 
  PopularSpot, 
  LiveActivityIndicator, 
  PrivacyLevel,
  Vibe 
} from '@/types/social.types';

interface PopularSpotsProps {
  airportCode: string;
  terminal?: string;
  timeRange?: '1h' | '2h' | '6h' | '24h';
  maxSpots?: number;
  privacyLevel?: PrivacyLevel;
  onSpotClick?: (spot: PopularSpot) => void;
  className?: string;
}

export const PopularSpots: React.FC<PopularSpotsProps> = ({
  airportCode,
  terminal,
  timeRange = '2h',
  maxSpots = 6,
  privacyLevel = 'aggregated',
  onSpotClick,
  className = ''
}) => {
  const { theme } = useTheme();
  const { getVibeColor } = useVibeColors();
  const [popularSpots, setPopularSpots] = useState<PopularSpot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalActiveUsers, setTotalActiveUsers] = useState(0);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Mock data for demonstration - replace with real Supabase data
  const mockPopularSpots: PopularSpot[] = [
    {
      id: '1',
      name: 'Coffee Corner',
      location: 'Terminal 1, Level 2',
      terminal: 'T1',
      vibe: 'refuel',
      currentUsers: 15,
      totalVisits: 45,
      averageRating: 4.6,
      popularityScore: 92,
      liveActivity: {
        checkins: 8,
        reviews: 12,
        photos: 5,
        favorites: 20
      },
      amenities: ['Coffee', 'WiFi', 'Seating', 'Power Outlets'],
      distance: '2 min walk',
      lastActivity: new Date(Date.now() - 2 * 60 * 1000), // 2 minutes ago
      trend: 'increasing'
    },
    {
      id: '2',
      name: 'Quiet Lounge',
      location: 'Terminal 2, Level 1',
      terminal: 'T2',
      vibe: 'chill',
      currentUsers: 12,
      totalVisits: 38,
      averageRating: 4.8,
      popularityScore: 88,
      liveActivity: {
        checkins: 6,
        reviews: 8,
        photos: 3,
        favorites: 15
      },
      amenities: ['Quiet Space', 'Comfortable Seating', 'Power Outlets', 'Reading Material'],
      distance: '5 min walk',
      lastActivity: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
      trend: 'stable'
    },
    {
      id: '3',
      name: 'Duty Free Shop',
      location: 'Terminal 3, Level 2',
      terminal: 'T3',
      vibe: 'explore',
      currentUsers: 18,
      totalVisits: 52,
      averageRating: 4.7,
      popularityScore: 95,
      liveActivity: {
        checkins: 10,
        reviews: 15,
        photos: 8,
        favorites: 25
      },
      amenities: ['Shopping', 'Tax-Free', 'Gift Items', 'Luxury Brands'],
      distance: '3 min walk',
      lastActivity: new Date(Date.now() - 1 * 60 * 1000), // 1 minute ago
      trend: 'increasing'
    },
    {
      id: '4',
      name: 'Work Pod',
      location: 'Terminal 1, Level 3',
      terminal: 'T1',
      vibe: 'work',
      currentUsers: 8,
      totalVisits: 25,
      averageRating: 4.4,
      popularityScore: 75,
      liveActivity: {
        checkins: 4,
        reviews: 6,
        photos: 2,
        favorites: 12
      },
      amenities: ['Private Space', 'High-Speed WiFi', 'Power Outlets', 'Quiet Environment'],
      distance: '4 min walk',
      lastActivity: new Date(Date.now() - 8 * 60 * 1000), // 8 minutes ago
      trend: 'stable'
    },
    {
      id: '5',
      name: 'Quick Bite Station',
      location: 'Terminal 2, Level 2',
      terminal: 'T2',
      vibe: 'quick',
      currentUsers: 22,
      totalVisits: 67,
      averageRating: 4.2,
      popularityScore: 89,
      liveActivity: {
        checkins: 12,
        reviews: 18,
        photos: 6,
        favorites: 30
      },
      amenities: ['Fast Service', 'Grab & Go', 'Healthy Options', 'Quick Payment'],
      distance: '1 min walk',
      lastActivity: new Date(Date.now() - 30 * 1000), // 30 seconds ago
      trend: 'increasing'
    },
    {
      id: '6',
      name: 'Comfort Zone',
      location: 'Terminal 3, Level 1',
      terminal: 'T3',
      vibe: 'comfort',
      currentUsers: 14,
      totalVisits: 41,
      averageRating: 4.5,
      popularityScore: 82,
      liveActivity: {
        checkins: 7,
        reviews: 10,
        photos: 4,
        favorites: 18
      },
      amenities: ['Comfortable Seating', 'Climate Control', 'Rest Areas', 'Family Space'],
      distance: '6 min walk',
      lastActivity: new Date(Date.now() - 3 * 60 * 1000), // 3 minutes ago
      trend: 'stable'
    }
  ];

  useEffect(() => {
    const fetchPopularSpots = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Filter spots by terminal and apply privacy requirements
        const filteredSpots = mockPopularSpots.filter(spot => {
          if (terminal && spot.terminal !== terminal) return false;
          if (spot.currentUsers < 5) return false; // Privacy requirement
          return true;
        });

        // Sort by popularity score and current users
        const sortedSpots = filteredSpots
          .sort((a, b) => {
            // Primary sort by popularity score
            if (b.popularityScore !== a.popularityScore) {
              return b.popularityScore - a.popularityScore;
            }
            // Secondary sort by current users
            return b.currentUsers - a.currentUsers;
          })
          .slice(0, maxSpots);

        setPopularSpots(sortedSpots);
        setTotalActiveUsers(89);
        setLastUpdated(new Date());
      } catch (err) {
        setError('Failed to load popular spots');
        console.error('Popular spots error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPopularSpots();

    // Refresh every 2 minutes for live activity
    const interval = setInterval(fetchPopularSpots, 2 * 60 * 1000);

    return () => clearInterval(interval);
  }, [airportCode, terminal, timeRange, maxSpots]);

  const getTrendIcon = (trend: 'increasing' | 'stable' | 'decreasing') => {
    switch (trend) {
      case 'increasing':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'decreasing':
        return <TrendingUp className="w-4 h-4 text-red-500 transform rotate-180" />;
      default:
        return <BarChart3 className="w-4 h-4 text-gray-500" />;
    }
  };

  const getTrendColor = (trend: 'increasing' | 'stable' | 'decreasing') => {
    switch (trend) {
      case 'increasing':
        return 'text-green-600';
      case 'decreasing':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getVibeIcon = (vibe: Vibe) => {
    const icons: Record<Vibe, React.ReactNode> = {
      chill: <Heart className="w-4 h-4" />,
      refuel: <Coffee className="w-4 h-4" />,
      comfort: <Heart className="w-4 h-4" />,
      explore: <MapPin className="w-4 h-4" />,
      quick: <Zap className="w-4 h-4" />,
      work: <Target className="w-4 h-4" />
    };
    return icons[vibe] || <Activity className="w-4 h-4" />;
  };

  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - timestamp.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    
    const diffInHours = Math.floor(diffInSeconds / 3600);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  const handleSpotClick = (spot: PopularSpot) => {
    onSpotClick?.(spot);
    console.log('Popular spot clicked:', spot);
  };

  const filteredSpots = useMemo(() => {
    // Apply privacy filtering and sort by popularity
    return popularSpots
      .filter(spot => spot.currentUsers >= 5)
      .sort((a, b) => b.popularityScore - a.popularityScore);
  }, [popularSpots]);

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="text-center text-gray-500">
            <TrendingUp className="w-8 h-8 mx-auto mb-2" />
            <p className="text-sm">Unable to load popular spots</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => window.location.reload()}
              className="mt-2"
            >
              <RefreshCw className="w-4 h-4 mr-1" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5" />
              <span>Popular Spots</span>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                <Activity className="w-3 h-3 mr-1" />
                Live
              </Badge>
              <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
                <Eye className="w-3 h-3 mr-1" />
                Privacy Safe
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-600">
              Live activity from {totalActiveUsers} active users
            </p>
            <div className="text-xs text-gray-500">
              Updated {lastUpdated.toLocaleTimeString()}
            </div>
          </div>

          {/* Popular Spots Grid */}
          <div className="space-y-4">
            {filteredSpots.map((spot) => (
              <div
                key={spot.id}
                className="p-4 rounded-lg border bg-gray-50/50 hover:bg-gray-100/50 transition-colors cursor-pointer"
                onClick={() => handleSpotClick(spot)}
              >
                <div className="flex items-start space-x-3">
                  <div className="flex items-center space-x-2">
                    <div className="relative">
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                        <Users className="w-4 h-4 text-gray-600" />
                      </div>
                      {/* Live indicator */}
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                    </div>
                    <Badge variant="outline" className={getVibeColor(spot.vibe)}>
                      {getVibeIcon(spot.vibe)}
                      <span className="ml-1 capitalize">{spot.vibe}</span>
                    </Badge>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-sm text-gray-900">
                        {spot.name}
                      </h4>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-medium text-green-600">
                          {spot.popularityScore}% popular
                        </span>
                        {getTrendIcon(spot.trend)}
                      </div>
                    </div>

                    <p className="text-sm text-gray-600 mb-2">
                      {spot.location}
                    </p>

                    <div className="flex items-center space-x-4 mb-3">
                      <div className="flex items-center space-x-2">
                        <Users className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-500">
                          {spot.currentUsers} current
                        </span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <MapPin className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-500">
                          {spot.distance}
                        </span>
                      </div>

                      {spot.averageRating && (
                        <div className="flex items-center space-x-1">
                          <Star className="w-3 h-3 text-yellow-500" />
                          <span className="text-xs font-medium text-gray-700">
                            {spot.averageRating}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Live Activity Indicators */}
                    <div className="flex items-center space-x-4 mb-3">
                      <div className="flex items-center space-x-1">
                        <Activity className="w-3 h-3 text-green-500" />
                        <span className="text-xs text-gray-600">
                          {spot.liveActivity.checkins} check-ins
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Star className="w-3 h-3 text-yellow-500" />
                        <span className="text-xs text-gray-600">
                          {spot.liveActivity.reviews} reviews
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Eye className="w-3 h-3 text-blue-500" />
                        <span className="text-xs text-gray-600">
                          {spot.liveActivity.photos} photos
                        </span>
                      </div>
                    </div>

                    {/* Amenities */}
                    <div className="flex flex-wrap gap-1 mb-3">
                      {spot.amenities.slice(0, 3).map((amenity, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {amenity}
                        </Badge>
                      ))}
                      {spot.amenities.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{spot.amenities.length - 3} more
                        </Badge>
                      )}
                    </div>

                    {/* Popularity Progress */}
                    <div className="mt-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-500">Popularity</span>
                        <span className="text-xs font-medium text-gray-700">
                          {spot.popularityScore}%
                        </span>
                      </div>
                      <Progress value={spot.popularityScore} className="w-full h-1" />
                    </div>

                    {/* Last Activity */}
                    <div className="flex items-center space-x-2 mt-2">
                      <Clock className="w-3 h-3 text-gray-400" />
                      <span className="text-xs text-gray-500">
                        Last activity: {formatTimeAgo(spot.lastActivity)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredSpots.length === 0 && (
            <div className="text-center py-6 text-gray-500">
              <TrendingUp className="w-8 h-8 mx-auto mb-2" />
              <p className="text-sm">No popular spots available</p>
              <p className="text-xs">Popular spots will appear as users interact</p>
            </div>
          )}

          {/* Privacy Notice */}
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <div className="flex items-start space-x-2">
              <Eye className="w-4 h-4 text-blue-500 mt-0.5" />
              <div className="text-xs text-blue-700">
                <p className="font-medium">Privacy Protected Activity</p>
                <p>Live indicators show aggregated activity from 5+ users. No individual data is displayed.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 