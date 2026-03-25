import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { 
  Users, 
  TrendingUp, 
  Coffee, 
  ShoppingBag, 
  Heart,
  Star,
  MapPin,
  Clock,
  Zap,
  Activity,
  Eye,
  BarChart3,
  Target,
  ThumbsUp
} from 'lucide-react';
import { useAmenities } from '@/hooks/useAmenities';
import { useVibeColors } from '@/hooks/useVibeColors';
import { useTheme } from '@/hooks/useTheme';
import type { 
  CrowdInsight, 
  InsightType, 
  VibePattern,
  PrivacyLevel 
} from '@/types/social.types';

interface CrowdInsightsProps {
  airportCode: string;
  terminal?: string;
  timeRange?: '2h' | '6h' | '24h';
  maxInsights?: number;
  privacyLevel?: PrivacyLevel;
  className?: string;
}

export const CrowdInsights: React.FC<CrowdInsightsProps> = ({
  airportCode,
  terminal,
  timeRange = '2h',
  maxInsights = 6,
  privacyLevel = 'aggregated',
  className = ''
}) => {
  const { getVibeColor } = useVibeColors();
  const [insights, setInsights] = useState<CrowdInsight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalUsers, setTotalUsers] = useState(0);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Mock data for demonstration - replace with real Supabase data
  const mockInsights: CrowdInsight[] = [
    {
      id: '1',
      type: 'helpful_spot',
      title: 'Coffee Corner',
      description: '12 users found this helpful today',
      location: 'Coffee Corner',
      terminal: 'T1',
      vibe: 'refuel',
      userCount: 12,
      percentage: 85,
      averageRating: 4.6,
      timeRange: 'last 2 hours',
      confidence: 0.92
    },
    {
      id: '2',
      type: 'helpful_spot',
      title: 'Quiet Lounge',
      description: '8 users found this helpful today',
      location: 'Quiet Lounge',
      terminal: 'T2',
      vibe: 'chill',
      userCount: 8,
      percentage: 67,
      averageRating: 4.8,
      timeRange: 'last 2 hours',
      confidence: 0.88
    },
    {
      id: '3',
      type: 'helpful_spot',
      title: 'Duty Free Shop',
      description: '15 users found this helpful today',
      location: 'Duty Free Shop',
      terminal: 'T3',
      vibe: 'explore',
      userCount: 15,
      percentage: 93,
      averageRating: 4.7,
      timeRange: 'last 2 hours',
      confidence: 0.95
    },
    {
      id: '4',
      type: 'helpful_spot',
      title: 'Quick Bite Station',
      description: '10 users found this helpful today',
      location: 'Quick Bite Station',
      terminal: 'T1',
      vibe: 'quick',
      userCount: 10,
      percentage: 75,
      averageRating: 4.2,
      timeRange: 'last 2 hours',
      confidence: 0.78
    },
    {
      id: '5',
      type: 'helpful_spot',
      title: 'Work Pod',
      description: '6 users found this helpful today',
      location: 'Work Pod',
      terminal: 'T2',
      vibe: 'work',
      userCount: 6,
      percentage: 60,
      averageRating: 4.4,
      timeRange: 'last 2 hours',
      confidence: 0.82
    },
    {
      id: '6',
      type: 'helpful_spot',
      title: 'Comfort Zone',
      description: '14 users found this helpful today',
      location: 'Comfort Zone',
      terminal: 'T3',
      vibe: 'comfort',
      userCount: 14,
      percentage: 80,
      averageRating: 4.3,
      timeRange: 'last 2 hours',
      confidence: 0.87
    }
  ];

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Filter insights by terminal if specified
        const filteredInsights = mockInsights.filter(insight => {
          if (terminal && insight.terminal !== terminal) return false;
          return insight.userCount >= 5; // Privacy requirement
        });

        setInsights(filteredInsights.slice(0, maxInsights));
        setTotalUsers(67);
        setLastUpdated(new Date());
      } catch (err) {
        setError('Failed to load crowd insights');
        console.error('Crowd insights error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInsights();

    // Refresh every 5 minutes
    const interval = setInterval(fetchInsights, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [airportCode, terminal, timeRange, maxInsights]);

  const getInsightIcon = (type: InsightType) => {
    switch (type) {
      case 'helpful_spot':
        return <ThumbsUp className="w-4 h-4 text-green-500" />;
      case 'popular_spot':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'vibe_pattern':
        return <Heart className="w-4 h-4 text-red-500" />;
      case 'rating_trend':
        return <Star className="w-4 h-4 text-yellow-500" />;
      case 'quick_service':
        return <Zap className="w-4 h-4 text-orange-500" />;
      case 'work_space':
        return <Target className="w-4 h-4 text-blue-500" />;
      case 'comfort_zone':
        return <Heart className="w-4 h-4 text-purple-500" />;
      default:
        return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const getInsightColor = (type: InsightType) => {
    const colors = {
      'helpful_spot': 'bg-green-100 text-green-800 border-green-200',
      'popular_spot': 'bg-green-100 text-green-800 border-green-200',
      'vibe_pattern': 'bg-red-100 text-red-800 border-red-200',
      'rating_trend': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'quick_service': 'bg-orange-100 text-orange-800 border-orange-200',
      'work_space': 'bg-blue-100 text-blue-800 border-blue-200',
      'comfort_zone': 'bg-purple-100 text-purple-800 border-purple-200'
    };
    return colors[type] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'text-green-600';
    if (confidence >= 0.8) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatTimeRange = (range: string) => {
    return range.replace('last ', '').replace(' hours', 'h').replace(' hour', 'h');
  };

  const filteredInsights = useMemo(() => {
    // Apply privacy filtering and sort by user count
    return insights
      .filter(insight => insight.userCount >= 5)
      .sort((a, b) => b.userCount - a.userCount);
  }, [insights]);

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
            <BarChart3 className="w-8 h-8 mx-auto mb-2" />
            <p className="text-sm">Unable to load crowd insights</p>
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
              <span>Crowd Insights</span>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
                <Eye className="w-3 h-3 mr-1" />
                Privacy Safe
              </Badge>
              <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                <TrendingUp className="w-3 h-3 mr-1" />
                {totalUsers} users
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-600">
              Helpful spots from {formatTimeRange(timeRange)}
            </p>
            <div className="text-xs text-gray-500">
              Updated {lastUpdated.toLocaleTimeString()}
            </div>
          </div>

          {/* Insights Grid */}
          <div className="space-y-4">
            {filteredInsights.map((insight) => (
              <div
                key={insight.id}
                className="p-4 rounded-lg border bg-gray-50/50 hover:bg-gray-100/50 transition-colors"
              >
                <div className="flex items-start space-x-3">
                  <div className="flex items-center space-x-2">
                    {getInsightIcon(insight.type)}
                    <Badge variant="outline" className={getInsightColor(insight.type)}>
                      {insight.type.replace('_', ' ')}
                    </Badge>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-sm text-gray-900">
                        {insight.title}
                      </h4>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500">
                          {insight.userCount} users
                        </span>
                        <span className={`text-xs font-medium ${getConfidenceColor(insight.confidence)}`}>
                          {Math.round(insight.confidence * 100)}% confidence
                        </span>
                      </div>
                    </div>

                    <p className="text-sm text-gray-600 mb-3">
                      {insight.description}
                    </p>

                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-500">
                          {insight.location}
                        </span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Badge 
                          variant="outline" 
                          className={getVibeColor(insight.vibe)}
                        >
                          {insight.vibe}
                        </Badge>
                      </div>

                      {insight.averageRating && (
                        <div className="flex items-center space-x-1">
                          <Star className="w-3 h-3 text-yellow-500" />
                          <span className="text-xs font-medium text-gray-700">
                            {insight.averageRating}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-500">Helpfulness</span>
                        <span className="text-xs font-medium text-gray-700">
                          {insight.percentage}%
                        </span>
                      </div>
                      <Progress value={insight.percentage} className="w-full h-1" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredInsights.length === 0 && (
            <div className="text-center py-6 text-gray-500">
              <Users className="w-8 h-8 mx-auto mb-2" />
              <p className="text-sm">No crowd insights available</p>
              <p className="text-xs">Insights will appear as more users interact</p>
            </div>
          )}

          {/* Privacy Notice */}
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <div className="flex items-start space-x-2">
              <Eye className="w-4 h-4 text-blue-500 mt-0.5" />
              <div className="text-xs text-blue-700">
                <p className="font-medium">Privacy Protected Insights</p>
                <p>All data is aggregated from 5+ users. No individual behavior is tracked.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 