import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Avatar, AvatarFallback } from './ui/avatar';
import { 
  Users, 
  Heart, 
  Star, 
  MapPin, 
  Coffee, 
  ShoppingBag,
  Target,
  TrendingUp,
  Eye,
  Activity,
  Zap,
  Clock,
  CheckCircle,
  ThumbsUp
} from 'lucide-react';
import { useAmenities } from '@/hooks/useAmenities';
import { useVibeColors } from '@/hooks/useVibeColors';
import { useTheme } from '@/hooks/useTheme';
import type { 
  SimilarUserRecommendation, 
  VibePattern, 
  PrivacyLevel,
  Vibe 
} from '@/types/social.types';

interface SimilarUsersPanelProps {
  currentVibe: Vibe;
  userPreferences?: string[];
  airportCode: string;
  terminal?: string;
  maxRecommendations?: number;
  privacyLevel?: PrivacyLevel;
  onRecommendationClick?: (recommendation: SimilarUserRecommendation) => void;
  className?: string;
}

export const SimilarUsersPanel: React.FC<SimilarUsersPanelProps> = ({
  currentVibe,
  userPreferences = [],
  airportCode,
  terminal,
  maxRecommendations = 4,
  privacyLevel = 'aggregated',
  onRecommendationClick,
  className = ''
}) => {
  const { getVibeColor } = useVibeColors();
  const [recommendations, setRecommendations] = useState<SimilarUserRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [similarUserCount, setSimilarUserCount] = useState(0);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Mock data for demonstration - replace with real Supabase data
  const mockRecommendations: SimilarUserRecommendation[] = [
    {
      id: '1',
      title: 'Coffee Corner',
      description: 'Others with similar vibes also enjoyed this spot',
      location: 'Coffee Corner',
      terminal: 'T1',
      vibe: 'refuel',
      similarUserCount: 12,
      matchPercentage: 89,
      averageRating: 4.6,
      reason: 'Based on your refuel vibe preference',
      timeRange: 'last 2 hours',
      confidence: 0.92,
      amenities: ['Coffee', 'WiFi', 'Seating'],
      distance: '2 min walk'
    },
    {
      id: '2',
      title: 'Quiet Lounge',
      description: 'Others with similar vibes also enjoyed this spot',
      location: 'Quiet Lounge',
      terminal: 'T2',
      vibe: 'chill',
      similarUserCount: 8,
      matchPercentage: 76,
      averageRating: 4.8,
      reason: 'Similar to your comfort preferences',
      timeRange: 'last 2 hours',
      confidence: 0.85,
      amenities: ['Quiet Space', 'Comfortable Seating', 'Power Outlets'],
      distance: '5 min walk'
    },
    {
      id: '3',
      title: 'Work Pod',
      description: 'Others with similar vibes also enjoyed this spot',
      location: 'Work Pod',
      terminal: 'T3',
      vibe: 'work',
      similarUserCount: 6,
      matchPercentage: 82,
      averageRating: 4.4,
      reason: 'Matches your productivity needs',
      timeRange: 'last 2 hours',
      confidence: 0.78,
      amenities: ['Private Space', 'High-Speed WiFi', 'Power Outlets'],
      distance: '3 min walk'
    },
    {
      id: '4',
      title: 'Quick Bite Station',
      description: 'Others with similar vibes also enjoyed this spot',
      location: 'Quick Bite Station',
      terminal: 'T1',
      vibe: 'quick',
      similarUserCount: 10,
      matchPercentage: 71,
      averageRating: 4.2,
      reason: 'Based on your quick service preference',
      timeRange: 'last 2 hours',
      confidence: 0.88,
      amenities: ['Fast Service', 'Grab & Go', 'Healthy Options'],
      distance: '1 min walk'
    }
  ];

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Filter recommendations by terminal and vibe
        const filteredRecommendations = mockRecommendations.filter(rec => {
          if (terminal && rec.terminal !== terminal) return false;
          if (rec.similarUserCount < 5) return false; // Privacy requirement
          return true;
        });

        // Sort by match percentage and user count
        const sortedRecommendations = filteredRecommendations
          .sort((a, b) => {
            // Primary sort by match percentage
            if (b.matchPercentage !== a.matchPercentage) {
              return b.matchPercentage - a.matchPercentage;
            }
            // Secondary sort by user count
            return b.similarUserCount - a.similarUserCount;
          })
          .slice(0, maxRecommendations);

        setRecommendations(sortedRecommendations);
        setSimilarUserCount(36);
        setLastUpdated(new Date());
      } catch (err) {
        setError('Failed to load similar user recommendations');
        console.error('Similar users error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecommendations();

    // Refresh every 10 minutes
    const interval = setInterval(fetchRecommendations, 10 * 60 * 1000);

    return () => clearInterval(interval);
  }, [currentVibe, airportCode, terminal, maxRecommendations]);

  const getMatchColor = (percentage: number) => {
    if (percentage >= 85) return 'text-green-600';
    if (percentage >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'text-green-600';
    if (confidence >= 0.8) return 'text-yellow-600';
    return 'text-red-600';
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

  const handleRecommendationClick = (recommendation: SimilarUserRecommendation) => {
    onRecommendationClick?.(recommendation);
    console.log('Similar user recommendation clicked:', recommendation);
  };

  const filteredRecommendations = useMemo(() => {
    // Apply privacy filtering and sort by relevance
    return recommendations
      .filter(rec => rec.similarUserCount >= 5)
      .sort((a, b) => b.matchPercentage - a.matchPercentage);
  }, [recommendations]);

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
            <Users className="w-8 h-8 mx-auto mb-2" />
            <p className="text-sm">Unable to load recommendations</p>
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
              <Users className="w-5 h-5" />
              <span>Similar Users</span>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className={getVibeColor(currentVibe)}>
                {getVibeIcon(currentVibe)}
                <span className="ml-1 capitalize">{currentVibe}</span>
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
              Based on {similarUserCount} users with similar preferences
            </p>
            <div className="text-xs text-gray-500">
              Updated {lastUpdated.toLocaleTimeString()}
            </div>
          </div>

          {/* Recommendations Grid */}
          <div className="space-y-4">
            {filteredRecommendations.map((recommendation) => (
              <div
                key={recommendation.id}
                className="p-4 rounded-lg border bg-gray-50/50 hover:bg-gray-100/50 transition-colors cursor-pointer"
                onClick={() => handleRecommendationClick(recommendation)}
              >
                <div className="flex items-start space-x-3">
                  <div className="flex items-center space-x-2">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="text-xs bg-gray-200">
                        {recommendation.similarUserCount}
                      </AvatarFallback>
                    </Avatar>
                    <Badge variant="outline" className={getVibeColor(recommendation.vibe)}>
                      {getVibeIcon(recommendation.vibe)}
                      <span className="ml-1 capitalize">{recommendation.vibe}</span>
                    </Badge>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-sm text-gray-900">
                        {recommendation.title}
                      </h4>
                      <div className="flex items-center space-x-2">
                        <span className={`text-xs font-medium ${getMatchColor(recommendation.matchPercentage)}`}>
                          {recommendation.matchPercentage}% match
                        </span>
                        <span className={`text-xs font-medium ${getConfidenceColor(recommendation.confidence)}`}>
                          {Math.round(recommendation.confidence * 100)}% confidence
                        </span>
                      </div>
                    </div>

                    <p className="text-sm text-gray-600 mb-2">
                      {recommendation.description}
                    </p>

                    <div className="flex items-center space-x-4 mb-3">
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-500">
                          {recommendation.location}
                        </span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Clock className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-500">
                          {recommendation.distance}
                        </span>
                      </div>

                      {recommendation.averageRating && (
                        <div className="flex items-center space-x-1">
                          <Star className="w-3 h-3 text-yellow-500" />
                          <span className="text-xs font-medium text-gray-700">
                            {recommendation.averageRating}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Amenities */}
                    <div className="flex flex-wrap gap-1 mb-3">
                      {recommendation.amenities.map((amenity, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {amenity}
                        </Badge>
                      ))}
                    </div>

                    {/* Match Reason */}
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-3 h-3 text-green-500" />
                      <span className="text-xs text-gray-600">
                        {recommendation.reason}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredRecommendations.length === 0 && (
            <div className="text-center py-6 text-gray-500">
              <Users className="w-8 h-8 mx-auto mb-2" />
              <p className="text-sm">No similar user recommendations</p>
              <p className="text-xs">Recommendations will appear as more users interact</p>
            </div>
          )}

          {/* Privacy Notice */}
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <div className="flex items-start space-x-2">
              <Eye className="w-4 h-4 text-blue-500 mt-0.5" />
              <div className="text-xs text-blue-700">
                <p className="font-medium">Privacy Protected Recommendations</p>
                <p>Based on aggregated patterns from 5+ users with similar preferences. No individual data is used.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 