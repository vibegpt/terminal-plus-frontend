import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { 
  Users, 
  TrendingUp, 
  Eye, 
  Activity,
  MapPin,
  Star,
  Heart,
  Coffee,
  Target,
  Zap,
  ShoppingBag
} from 'lucide-react';
import { SocialActivityFeed } from './SocialActivityFeed';
import { CrowdInsights } from './CrowdInsights';
import { SimilarUsersPanel } from './SimilarUsersPanel';
import { PopularSpots } from './PopularSpots';
import { useAmenities } from '@/hooks/useAmenities';
import { useVibeColors } from '@/hooks/useVibeColors';
import { useTheme } from '@/hooks/useTheme';
import type { 
  SimilarUserRecommendation, 
  PopularSpot, 
  PrivacyLevel
} from '@/types/social.types';
import type { Vibe } from '@/types/common.types';

interface SocialProofIntegrationProps {
  airportCode: string;
  terminal?: string;
  currentVibe: Vibe;
  userPreferences?: string[];
  className?: string;
}

export const SocialProofIntegration: React.FC<SocialProofIntegrationProps> = ({
  airportCode,
  terminal,
  currentVibe,
  userPreferences = [],
  className = ''
}) => {
  const { getVibeColor } = useVibeColors();
  const [activeTab, setActiveTab] = useState('activity');
  const [privacyLevel, setPrivacyLevel] = useState<PrivacyLevel>('aggregated');
  const [lastInteraction, setLastInteraction] = useState<Date>(new Date());

  // Handle recommendation clicks
  const handleRecommendationClick = (recommendation: SimilarUserRecommendation) => {
    console.log('Similar user recommendation clicked:', recommendation);
    // Navigate to amenity detail or add to journey
    setLastInteraction(new Date());
  };

  // Handle popular spot clicks
  const handleSpotClick = (spot: PopularSpot) => {
    console.log('Popular spot clicked:', spot);
    // Navigate to amenity detail or add to journey
    setLastInteraction(new Date());
  };

  // Get vibe icon for display
  const getVibeIcon = (vibe: Vibe) => {
    const icons: Record<Vibe, React.ReactNode> = {
      chill: <Heart className="w-4 h-4" />,
      refuel: <Coffee className="w-4 h-4" />,
      comfort: <Heart className="w-4 h-4" />,
      explore: <MapPin className="w-4 h-4" />,
      quick: <Zap className="w-4 h-4" />,
      work: <Target className="w-4 h-4" />,
      social: <Users className="w-4 h-4" />,
      shop: <ShoppingBag className="w-4 h-4" />
    };
    return icons[vibe] || <Activity className="w-4 h-4" />;
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with Privacy Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Users className="w-6 h-6" />
              <div>
                <h2 className="text-lg font-semibold">Social Insights</h2>
                <p className="text-sm text-gray-600">
                  Real-time activity and recommendations
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className={getVibeColor(currentVibe)}>
                {getVibeIcon(currentVibe)}
                <span className="ml-1 capitalize">{currentVibe}</span>
              </Badge>
              <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
                <Eye className="w-3 h-3 mr-1" />
                {privacyLevel}
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-600">
              Privacy-protected insights from {airportCode} {terminal ? `Terminal ${terminal}` : ''}
            </p>
            <div className="text-xs text-gray-500">
              Last interaction: {lastInteraction.toLocaleTimeString()}
            </div>
          </div>

          {/* Privacy Notice */}
          <div className="p-3 bg-blue-50 rounded-lg mb-4">
            <div className="flex items-start space-x-2">
              <Eye className="w-4 h-4 text-blue-500 mt-0.5" />
              <div className="text-xs text-blue-700">
                <p className="font-medium">Privacy Protected</p>
                <p>All data is anonymized and aggregated from 5+ users. No personal information is displayed.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Social Proof Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="activity" className="flex items-center space-x-1">
            <Activity className="w-3 h-3" />
            <span className="hidden sm:inline">Discoveries</span>
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center space-x-1">
            <TrendingUp className="w-3 h-3" />
            <span className="hidden sm:inline">Helpful</span>
          </TabsTrigger>
          <TabsTrigger value="similar" className="flex items-center space-x-1">
            <Users className="w-3 h-3" />
            <span className="hidden sm:inline">Similar</span>
          </TabsTrigger>
          <TabsTrigger value="popular" className="flex items-center space-x-1">
            <Star className="w-3 h-3" />
            <span className="hidden sm:inline">Popular</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="activity" className="mt-4">
          <SocialActivityFeed
            airportCode={airportCode}
            terminal={terminal}
            maxActivities={6}
            refreshInterval={30000}
            privacyLevel={privacyLevel}
            showUserCount={true}
          />
        </TabsContent>

        <TabsContent value="insights" className="mt-4">
          <CrowdInsights
            airportCode={airportCode}
            terminal={terminal}
            timeRange="2h"
            maxInsights={6}
            privacyLevel={privacyLevel}
          />
        </TabsContent>

        <TabsContent value="similar" className="mt-4">
          <SimilarUsersPanel
            currentVibe={currentVibe}
            userPreferences={userPreferences}
            airportCode={airportCode}
            terminal={terminal}
            maxRecommendations={4}
            privacyLevel={privacyLevel}
            onRecommendationClick={handleRecommendationClick}
          />
        </TabsContent>

        <TabsContent value="popular" className="mt-4">
          <PopularSpots
            airportCode={airportCode}
            terminal={terminal}
            timeRange="2h"
            maxSpots={6}
            privacyLevel={privacyLevel}
            onSpotClick={handleSpotClick}
          />
        </TabsContent>
      </Tabs>

      {/* Integration with Existing Components */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MapPin className="w-5 h-5" />
            <span>Integration Example</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-sm mb-2">How to integrate with ExperienceView:</h4>
              <div className="text-xs text-gray-600 space-y-1">
                <p>1. Import the social proof components</p>
                <p>2. Add them to your existing layout</p>
                <p>3. Connect to your existing hooks and state</p>
                <p>4. Handle user interactions and navigation</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 bg-green-50 rounded-lg">
                <h5 className="font-medium text-sm text-green-800 mb-1">✅ Privacy Compliant</h5>
                <p className="text-xs text-green-700">
                  All data is anonymized and aggregated from 5+ users
                </p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <h5 className="font-medium text-sm text-blue-800 mb-1">🔄 Real-time Updates</h5>
                <p className="text-xs text-blue-700">
                  Live activity feeds with automatic refresh intervals
                </p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <h5 className="font-medium text-sm text-purple-800 mb-1">🎯 Vibe Integration</h5>
                <p className="text-xs text-purple-700">
                  Seamlessly integrates with existing vibe system
                </p>
              </div>
              <div className="p-3 bg-orange-50 rounded-lg">
                <h5 className="font-medium text-sm text-orange-800 mb-1">📱 Mobile Optimized</h5>
                <p className="text-xs text-orange-700">
                  Touch-friendly interactions and responsive design
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Example usage in ExperienceView component
export const SocialProofExample: React.FC = () => {
  const [currentVibe, setCurrentVibe] = useState<Vibe>('refuel');
  const [airportCode] = useState('SIN');
  const [terminal] = useState('T1');

  return (
    <div className="container mx-auto px-4 py-6">
      <SocialProofIntegration
        airportCode={airportCode}
        terminal={terminal}
        currentVibe={currentVibe}
        userPreferences={['coffee', 'wifi', 'quiet']}
      />
    </div>
  );
}; 