import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Clock, MapPin, Star, Coffee, ShoppingBag, Wifi, Plane, Car, ArrowRight } from 'lucide-react';
import { useJourneyContext } from '@/context/JourneyContext';
import { useRecommendations } from '@/hooks/useRecommendations';
import { useVibeColors } from '@/hooks/useVibeColors';
import type { 
  JourneyRecommendationsProps,
  RecommendationItem
} from '@/types/ui.types';
import { toSlug } from '@/utils/normalizeAmenity';
import { vibeColorMap } from '@/constants/vibeColorsGenZ';

const getRecommendationsForContext = (
  context: 'departure' | 'transit' | 'arrival',
  journeyData: any
): RecommendationItem[] => {
  // All available recommendations
  const allRecommendations: RecommendationItem[] = [
    // Refuel recommendations
    {
      id: '1',
      title: 'Coffee & Breakfast',
      description: 'Start your journey with a fresh coffee and light breakfast',
      category: 'Food & Beverage',
      estimatedTime: 15,
      distance: '2 min walk',
      rating: 4.5,
      vibe: 'Refuel',
      icon: <Coffee className="w-4 h-4" />,
      priority: 'high',
      slug: 'coffee-breakfast'
    },
    {
      id: '2',
      title: 'Quick Bite Station',
      description: 'Grab a sandwich, salad, or healthy snack',
      category: 'Food & Beverage',
      estimatedTime: 10,
      distance: '1 min walk',
      rating: 4.3,
      vibe: 'Refuel',
      icon: <Coffee className="w-4 h-4" />,
      priority: 'high',
      slug: 'quick-bite-station'
    },
    {
      id: '3',
      title: 'Juice Bar',
      description: 'Fresh juices, smoothies, and healthy drinks',
      category: 'Food & Beverage',
      estimatedTime: 8,
      distance: '3 min walk',
      rating: 4.4,
      vibe: 'Refuel',
      icon: <Coffee className="w-4 h-4" />,
      priority: 'medium',
      slug: 'juice-bar'
    },
    {
      id: '4',
      title: 'Burger Express',
      description: 'Quick burgers, fries, and fast food favorites',
      category: 'Fast Food',
      estimatedTime: 12,
      distance: '2 min walk',
      rating: 4.1,
      vibe: 'Refuel',
      icon: <Coffee className="w-4 h-4" />,
      priority: 'high',
      slug: 'burger-express'
    },
    {
      id: '5',
      title: 'Pizza Corner',
      description: 'Fresh pizza slices and Italian fast food',
      category: 'Fast Food',
      estimatedTime: 15,
      distance: '3 min walk',
      rating: 4.2,
      vibe: 'Refuel',
      icon: <Coffee className="w-4 h-4" />,
      priority: 'medium',
      slug: 'pizza-corner'
    },
    // Explore recommendations
    {
      id: '6',
      title: 'Duty Free Shopping',
      description: 'Browse international brands and local souvenirs',
      category: 'Shopping',
      estimatedTime: 25,
      distance: '5 min walk',
      rating: 4.2,
      vibe: 'Explore',
      icon: <ShoppingBag className="w-4 h-4" />,
      priority: 'medium',
      slug: 'duty-free-shopping'
    },
    {
      id: '7',
      title: 'Local Market',
      description: 'Discover local products and artisan goods',
      category: 'Shopping',
      estimatedTime: 20,
      distance: '4 min walk',
      rating: 4.0,
      vibe: 'Explore',
      icon: <ShoppingBag className="w-4 h-4" />,
      priority: 'medium',
      slug: 'local-market'
    },
    {
      id: '8',
      title: 'Art Gallery',
      description: 'View local and international art exhibitions',
      category: 'Culture',
      estimatedTime: 30,
      distance: '6 min walk',
      rating: 4.3,
      vibe: 'Explore',
      icon: <ShoppingBag className="w-4 h-4" />,
      priority: 'low',
      slug: 'art-gallery'
    },
    // Comfort recommendations
    {
      id: '9',
      title: 'Airline Lounge',
      description: 'Relax in comfort with premium amenities',
      category: 'Lounge',
      estimatedTime: 45,
      distance: '8 min walk',
      rating: 4.6,
      vibe: 'Comfort',
      icon: <Plane className="w-4 h-4" />,
      priority: 'high',
      slug: 'airline-lounge'
    },
    {
      id: '10',
      title: 'Rest Area',
      description: 'Quiet space to relax and recharge',
      category: 'Comfort',
      estimatedTime: 20,
      distance: '3 min walk',
      rating: 4.1,
      vibe: 'Comfort',
      icon: <Wifi className="w-4 h-4" />,
      priority: 'medium'
    },
    {
      id: '11',
      title: 'Spa & Wellness',
      description: 'Treat yourself to a relaxing massage or treatment',
      category: 'Wellness',
      estimatedTime: 60,
      distance: '10 min walk',
      rating: 4.7,
      vibe: 'Comfort',
      icon: <Wifi className="w-4 h-4" />,
      priority: 'low'
    },
    // Work recommendations
    {
      id: '12',
      title: 'Work Pod',
      description: 'Private workspace with charging and WiFi',
      category: 'Work',
      estimatedTime: 30,
      distance: '5 min walk',
      rating: 4.2,
      vibe: 'Work',
      icon: <Wifi className="w-4 h-4" />,
      priority: 'high'
    },
    {
      id: '13',
      title: 'Business Center',
      description: 'Professional workspace with meeting rooms',
      category: 'Work',
      estimatedTime: 45,
      distance: '7 min walk',
      rating: 4.4,
      vibe: 'Work',
      icon: <Wifi className="w-4 h-4" />,
      priority: 'medium'
    },
    // Quick recommendations
    {
      id: '14',
      title: 'Express Food Court',
      description: 'Quick meals from various cuisines',
      category: 'Food & Beverage',
      estimatedTime: 15,
      distance: '2 min walk',
      rating: 4.0,
      vibe: 'Quick',
      icon: <Coffee className="w-4 h-4" />,
      priority: 'high'
    },
    {
      id: '15',
      title: 'Convenience Store',
      description: 'Grab snacks, drinks, and essentials',
      category: 'Convenience',
      estimatedTime: 5,
      distance: '1 min walk',
      rating: 3.8,
      vibe: 'Quick',
      icon: <ShoppingBag className="w-4 h-4" />,
      priority: 'high'
    },
    // Chill recommendations
    {
      id: '16',
      title: 'Quiet Zone',
      description: 'Peaceful area for meditation and relaxation',
      category: 'Wellness',
      estimatedTime: 25,
      distance: '4 min walk',
      rating: 4.3,
      vibe: 'Chill',
      icon: <Wifi className="w-4 h-4" />,
      priority: 'medium'
    },
    {
      id: '17',
      title: 'Garden View Lounge',
      description: 'Relax with views of the airport gardens',
      category: 'Lounge',
      estimatedTime: 30,
      distance: '6 min walk',
      rating: 4.2,
      vibe: 'Chill',
      icon: <Wifi className="w-4 h-4" />,
      priority: 'medium'
    },
    {
      id: '18',
      title: 'Reading Corner',
      description: 'Cozy space with books and magazines',
      category: 'Culture',
      estimatedTime: 20,
      distance: '3 min walk',
      rating: 4.1,
      vibe: 'Chill',
      icon: <Wifi className="w-4 h-4" />,
      priority: 'low'
    },
    // Shop recommendations
    {
      id: '19',
      title: 'Fashion Boutique',
      description: 'Trendy clothing and accessories',
      category: 'Shopping',
      estimatedTime: 35,
      distance: '5 min walk',
      rating: 4.1,
      vibe: 'Shop',
      icon: <ShoppingBag className="w-4 h-4" />,
      priority: 'medium'
    },
    {
      id: '20',
      title: 'Tech Store',
      description: 'Latest gadgets and electronics',
      category: 'Shopping',
      estimatedTime: 25,
      distance: '4 min walk',
      rating: 4.0,
      vibe: 'Shop',
      icon: <ShoppingBag className="w-4 h-4" />,
      priority: 'medium'
    }
  ];

  // Filter by context if needed
  if (context === 'departure') {
    return allRecommendations.filter(rec => rec.vibe === 'Refuel' || rec.vibe === 'Quick');
  } else if (context === 'transit') {
    return allRecommendations.filter(rec => rec.vibe === 'Explore' || rec.vibe === 'Comfort');
  } else if (context === 'arrival') {
    return allRecommendations.filter(rec => rec.vibe === 'Chill' || rec.vibe === 'Work');
  }

  return allRecommendations;
};

const getPriorityColor = (priority: string) => {
  const colors: Record<string, string> = {
    high: 'text-red-600 bg-red-50 border-red-200',
    medium: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    low: 'text-green-600 bg-green-50 border-green-200'
  };
  return colors[priority] || colors.medium;
};

const getVibeColorClass = (vibe: string) => {
  // Use the new Gen Z color palette
  const vibeColorClasses: Record<string, string> = {
    'Chill': 'bg-blue-100 text-blue-800 border-blue-200',
    'Refuel': 'bg-orange-100 text-orange-800 border-orange-200', // Updated to orange
    'Comfort': 'bg-purple-100 text-purple-800 border-purple-200',
    'Explore': 'bg-teal-100 text-teal-800 border-teal-200', // Updated to teal
    'Quick': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'Work': 'bg-gray-100 text-gray-800 border-gray-200',
    'Shop': 'bg-pink-100 text-pink-800 border-pink-200'
  };
  return vibeColorClasses[vibe] || 'bg-gray-100 text-gray-800 border-gray-200';
};

export const JourneyRecommendations: React.FC<JourneyRecommendationsProps> = ({
  context,
  journeyData,
  onBack
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = useJourneyContext();
  const contextJourneyData = state.flightData || {};
  
  // Use context data if available, otherwise fall back to props
  const effectiveJourneyData = contextJourneyData || journeyData || {
    departure: 'SYD',
    destination: 'LHR',
    selected_vibe: 'refuel',
    layovers: ['SIN']
  };
  
  // 🔁 Toggle state: ON by default for transit/arrival, OFF for departure
  const [mixItUp, setMixItUp] = React.useState(context !== 'departure');
  const [showVibeSelector, setShowVibeSelector] = React.useState(false);
  const [selectedVibe, setSelectedVibe] = React.useState(
    effectiveJourneyData.selected_vibe?.toLowerCase?.() || 'refuel'
  );

  // 🎯 Context-aware vibe logic
  const getEffectiveVibe = () => {
    if (context === 'departure') return selectedVibe;
    if (mixItUp) return undefined; // Mixed vibes
    return selectedVibe;
  };

  // Handle Mix It Up toggle
  const handleMixItUpToggle = (newValue: boolean) => {
    setMixItUp(newValue);
    if (!newValue) {
      // When turning off Mix It Up, show vibe selector
      setShowVibeSelector(true);
    } else {
      // When turning on Mix It Up, hide vibe selector
      setShowVibeSelector(false);
    }
  };

  // Use the new unified recommendations hook
  const { 
    recommendations: scoredRecommendations, 
    isLoading, 
    error,
    effectiveVibe 
  } = useRecommendations({
    journeyContext: context,
    vibe: getEffectiveVibe(),
    gate: 'A1', // Default gate
    timeLeft: 60, // Default time available
    journeyData: effectiveJourneyData
  });

  // Debug hook to track when no amenities are loaded
  React.useEffect(() => {
    if (scoredRecommendations?.length === 0 && !isLoading) {
      console.warn("🚫 No amenities loaded in recommendations!");
    }
  }, [scoredRecommendations, isLoading]);

  // Convert to the expected format
  const recommendations = React.useMemo(() => {
    // Only use hardcoded fallback if there's an actual error or no data
    if (error || (scoredRecommendations.length === 0 && !isLoading)) {
      console.log('🔄 Using hardcoded fallback recommendations due to:', { error, scoredRecommendationsCount: scoredRecommendations.length, isLoading });
      return getRecommendationsForContext(context, effectiveJourneyData);
    }

    // Use real scored recommendations
    if (scoredRecommendations.length > 0) {
      console.log('✅ Using real scored recommendations:', scoredRecommendations.length);
      
      const mappedRecommendations = scoredRecommendations.slice(0, 6).map((amenity, index) => ({
        id: amenity.id || `rec-${index}`,
        title: amenity.name,
        description: amenity.description || amenity.location_description || '',
        category: amenity.category,
        estimatedTime: 30, // Default time
        distance: '2 min walk', // Default distance
        rating: 4.5, // Default rating
        vibe: amenity.vibes?.[0] || 'Comfort',
        icon: <Coffee className="w-4 h-4" />, // Default icon
        priority: amenity.score > 8 ? 'high' : amenity.score > 5 ? 'medium' : 'low',
        score: amenity.score,
        slug: amenity.slug || toSlug(amenity.name)
      }));
      
      if (mappedRecommendations.length === 0) {
        console.warn("No recommendations generated", { 
          vibe: getEffectiveVibe(), 
          emotion: undefined, 
          gate: 'A1', 
          timeLeft: 60,
          scoredRecommendationsCount: scoredRecommendations.length
        });
      } else {
        console.log("🎯 Top scoring recommendations:", mappedRecommendations.slice(0, 3).map(r => ({
          name: r.title,
          score: r.score,
          vibe: r.vibe,
          category: r.category
        })));
      }
      
      return mappedRecommendations;
    }

    // Show loading state
    return [];
  }, [scoredRecommendations, isLoading, error, context, effectiveJourneyData]);

  // Debug logging
  console.log('🔍 JourneyRecommendations Debug:', {
    context,
    effectiveJourneyData,
    scoredRecommendationsCount: scoredRecommendations.length,
    isLoading,
    error: error?.message,
    effectiveVibe,
    mixItUp,
    getEffectiveVibe: getEffectiveVibe(),
    sampleRecommendations: scoredRecommendations.slice(0, 2).map(r => ({
      name: r.name,
      vibes: r.vibes,
      vibe_tags: r.vibe_tags,
      score: r.score,
      airport: r.airport_code
    }))
  });

  // Helper function to get score color
  const getScoreColor = (score: number) => {
    if (score >= 0.8) return '#10B981'; // Green for high scores
    if (score >= 0.6) return '#F59E0B'; // Yellow for medium scores
    return '#EF4444'; // Red for low scores
  };
  
  const getContextTitle = () => {
    switch (context) {
      case 'departure': return `${effectiveJourneyData.departure} Departure`;
      case 'transit': return `${effectiveJourneyData.layovers?.[0] || 'Transit'} Transit`;
      case 'arrival': return `${effectiveJourneyData.destination} Arrival`;
      default: return 'Recommendations';
    }
  };

  const getContextDescription = () => {
    switch (context) {
      case 'departure': return `Personalized recommendations for your ${effectiveJourneyData.selected_vibe} vibe at ${effectiveJourneyData.departure}`;
      case 'transit': return `Make the most of your layover at ${effectiveJourneyData.layovers?.[0] || 'Transit'}`;
      case 'arrival': return `Essential services and options at ${effectiveJourneyData.destination}`;
      default: return 'Recommendations for your journey';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            {getContextTitle()} Recommendations
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            {getContextDescription()}
          </p>
        </div>
        <div className="flex items-center gap-4">
          {/* Mix It Up Toggle - always available for all contexts */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Mix It Up
            </label>
            <button
              onClick={() => handleMixItUpToggle(!mixItUp)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                mixItUp ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  mixItUp ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className="text-xs text-slate-500">
              {mixItUp ? 'Mixed vibes' : `Vibe: ${selectedVibe}`}
            </span>
          </div>
          <Button onClick={onBack} variant="outline">
            ← Back to Plan
          </Button>
        </div>
      </div>

      {/* Vibe Selector - shown when Mix It Up is off for any context */}
      {showVibeSelector && (
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
          <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-3">
            Select a vibe for {context} recommendations:
          </h3>
          <div className="flex flex-wrap gap-2">
            {['Refuel', 'Comfort', 'Quick', 'Work', 'Explore', 'Shop', 'Chill'].map((vibe) => (
              <button
                key={vibe}
                onClick={() => {
                  setSelectedVibe(vibe.toLowerCase());
                  setShowVibeSelector(false);
                }}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  selectedVibe === vibe.toLowerCase()
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                }`}
              >
                {vibe}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-4">
        {recommendations.map((recommendation: any) => {
          // Map amenity data to the expected recommendation format
          const mappedRecommendation = {
            id: recommendation.id || recommendation.name,
            title: recommendation.title || recommendation.name,
            description: recommendation.description || recommendation.description || `${recommendation.amenity_type} at ${recommendation.location_description}`,
            category: recommendation.category || recommendation.amenity_type,
            estimatedTime: recommendation.estimatedTime || 15, // Default time
            distance: recommendation.distance || '5 min walk', // Default distance
            rating: recommendation.rating || 4.0, // Default rating
            vibe: recommendation.vibe || (recommendation.vibe_tags && recommendation.vibe_tags[0]) || 'Refuel',
            icon: recommendation.icon || <Coffee className="w-4 h-4" />,
            priority: recommendation.priority || 'medium',
            score: recommendation.score,
            slug: recommendation.slug || toSlug(recommendation.name)
          };

          return (
            <Card 
              key={mappedRecommendation.id} 
              className="hover:shadow-md transition-shadow cursor-pointer group"
              style={{
                borderLeft: mappedRecommendation.score ? `4px solid ${getScoreColor(mappedRecommendation.score)}` : undefined
              }}
              onClick={(e) => {
                console.log('=== CARD CLICK DETECTED ===');
                console.log(`Recommendation: ${mappedRecommendation.title}`);
                console.log(`Card ID: ${mappedRecommendation.id}`);
                console.log(`Card Slug: ${mappedRecommendation.slug}`);
                console.log(`Full mapped recommendation:`, mappedRecommendation);
                
                // Prevent event bubbling if clicking on interactive elements
                if (e.target !== e.currentTarget && 
                    (e.target as HTMLElement).closest('button') || 
                    (e.target as HTMLElement).closest('a')) {
                  console.log('Click blocked - interactive element detected');
                  return;
                }
                
                console.log(`Navigating to amenity: ${mappedRecommendation.title} -> ${mappedRecommendation.slug}`);
                
                navigate(`/amenity/${mappedRecommendation.slug}`, {
                  state: {
                    from: location.pathname,
                    recommendation: mappedRecommendation
                  }
                });
              }}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700">
                      {mappedRecommendation.icon}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{mappedRecommendation.title}</CardTitle>
                      <p className="text-slate-600 dark:text-slate-400 text-sm">
                        {mappedRecommendation.description}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {mappedRecommendation.estimatedTime} min
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {mappedRecommendation.distance}
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500" />
                      {mappedRecommendation.rating}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="outline" className={getVibeColorClass(mappedRecommendation.vibe)}>
                      {mappedRecommendation.vibe}
                    </Badge>
                    <Badge variant="outline">
                      {mappedRecommendation.category}
                    </Badge>
                    {mappedRecommendation.score && (
                      <Badge 
                        variant="outline"
                        style={{ 
                          backgroundColor: getScoreColor(mappedRecommendation.score) + '20',
                          borderColor: getScoreColor(mappedRecommendation.score),
                          color: getScoreColor(mappedRecommendation.score)
                        }}
                      >
                        {Math.round(mappedRecommendation.score * 100)}%
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="flex justify-center pt-4">
        <Button className="px-8">
          Save This Plan
        </Button>
      </div>
    </div>
  );
};