// Enhanced ExperienceView.tsx with Emotional Pulse Rating
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Clock, MapPin, CheckCircle, Loader2, Users, Zap, Home } from 'lucide-react';
import { useJourneyContext } from '@/hooks/useJourneyContext';
import { loadAmenitiesByTerminal } from '@/hooks/useAmenities';
import { normalizeAmenity } from '@/utils/normalizeAmenity';

// Unified Terminal+ vibe system - consistent throughout the app
const TERMINAL_PLUS_VIBES = {
  'Chill': {
    color: 'blue',
    energy: 0.2,
    description: 'Calm and peaceful',
    pulse_speed: 0.3,
    border: 'border-blue-400',
    bg: 'bg-blue-400',
    text: 'text-blue-600',
    tagStyle: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
  },
  'Comfort': {
    color: 'purple',
    energy: 0.3,
    description: 'Cozy and relaxing',
    pulse_speed: 0.4,
    border: 'border-purple-400',
    bg: 'bg-purple-400',
    text: 'text-purple-600',
    tagStyle: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
  },
  'Refuel': {
    color: 'orange',
    energy: 0.7,
    description: 'Energizing and nourishing',
    pulse_speed: 0.8,
    border: 'border-orange-400',
    bg: 'bg-orange-400',
    text: 'text-orange-600',
    tagStyle: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300'
  },
  'Quick': {
    color: 'yellow',
    energy: 0.8,
    description: 'Fast and efficient',
    pulse_speed: 0.9,
    border: 'border-yellow-400',
    bg: 'bg-yellow-400',
    text: 'text-yellow-600',
    tagStyle: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
  },
  'Explore': {
    color: 'green',
    energy: 0.6,
    description: 'Curious and discovering',
    pulse_speed: 0.7,
    border: 'border-green-400',
    bg: 'bg-green-400',
    text: 'text-green-600',
    tagStyle: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
  },
  'Shop': {
    color: 'pink',
    energy: 0.5,
    description: 'Browsing and finding',
    pulse_speed: 0.6,
    border: 'border-pink-400',
    bg: 'bg-pink-400',
    text: 'text-pink-600',
    tagStyle: 'bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300'
  },
  'Work': {
    color: 'slate',
    energy: 0.4,
    description: 'Focused and productive',
    pulse_speed: 0.5,
    border: 'border-slate-400',
    bg: 'bg-slate-400',
    text: 'text-slate-600',
    tagStyle: 'bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-300'
  }
};

interface Amenity {
  id: string;
  name: string;
  category: string;
  walkTime?: string;
  rating?: number;
  description?: string;
  available_in_transit?: boolean;
  vibe_tags?: string[];
  // Optional satisfaction score (derived from ratings/reviews)
  satisfaction_score?: number;
}

// Unified Vibe Pulse Rating - uses Terminal+ vibe system
const VibePulseRating = ({ amenity }: { amenity: Amenity }) => {
  const [pulseAnimation, setPulseAnimation] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setPulseAnimation(prev => (prev + 1) % 100);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  // Use the primary vibe from amenity's vibe_tags
  const primaryVibe = amenity.vibe_tags?.[0] || 'Chill';
  const vibeConfig = TERMINAL_PLUS_VIBES[primaryVibe as keyof typeof TERMINAL_PLUS_VIBES] || TERMINAL_PLUS_VIBES.Chill;
  
  // Generate satisfaction score from rating or default range
  const satisfactionScore = amenity.satisfaction_score || 
    (amenity.rating ? amenity.rating * 20 : 80 + Math.random() * 15); // Convert 5-star to percentage or use 80-95%
  
  const pulseSpeed = vibeConfig.pulse_speed;
  const pulseIntensity = Math.min(satisfactionScore / 100, 1); // Ensure 0-1 range
  
  return (
    <div className="flex items-center gap-3">
      <div className="relative w-10 h-10 flex-shrink-0">
        {/* Animated pulse rings using unified vibe colors */}
        <div 
          className={`absolute inset-0 rounded-full border-2 ${vibeConfig.border} transition-all duration-200`}
          style={{
            transform: `scale(${1 + Math.sin(pulseAnimation * pulseSpeed * 0.3) * 0.2 * pulseIntensity})`,
            opacity: 0.6
          }}
        />
        <div 
          className={`absolute inset-0.5 rounded-full border ${vibeConfig.border} transition-all duration-200`}
          style={{
            transform: `scale(${1 + Math.sin(pulseAnimation * pulseSpeed * 0.4) * 0.15 * pulseIntensity})`,
            opacity: 0.4
          }}
        />
        <div 
          className={`absolute inset-2 rounded-full ${vibeConfig.bg} transition-all duration-200`}
          style={{
            transform: `scale(${1 + Math.sin(pulseAnimation * pulseSpeed * 0.2) * 0.1 * pulseIntensity})`,
          }}
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className={`font-medium text-sm ${vibeConfig.text}`}>
          {primaryVibe} Vibe
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400">
          {Math.round(satisfactionScore)}% traveler satisfaction
        </div>
      </div>
    </div>
  );
};

export default function ExperienceView() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { journeyData } = useJourneyContext();

  // Extract context parameters from URL
  const context = searchParams.get('context'); // 'departure', 'transit', 'arrival'
  const type = searchParams.get('type'); // 'complete-journey'
  const airport = searchParams.get('airport');
  const currentLocation = searchParams.get('currentLocation');
  const airports = searchParams.get('airports')?.split(',');
  const flightNumber = searchParams.get('flightNumber');
  const mode = searchParams.get('mode'); // 'planning' or null
  const vibe = searchParams.get('vibe') || 'Chill';
  
  // Legacy parameters for backward compatibility
  const returnTo = searchParams.get('returnTo');
  const segment = searchParams.get('segment');
  const terminal = searchParams.get('terminal');
  
  // State management
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [savedAmenities, setSavedAmenities] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Load amenities
  useEffect(() => {
    const loadAmenities = async () => {
      if (!airport || !terminal) {
        setError('Missing airport or terminal information');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        
        const terminalCode = `${airport}-${terminal}`;
        const rawAmenities = await loadAmenitiesByTerminal(terminalCode);
        
        if (!rawAmenities || rawAmenities.length === 0) {
          throw new Error(`No amenities found for ${terminalCode}`);
        }
        
        const normalized = rawAmenities.map(normalizeAmenity);
        setAmenities(normalized);
        
      } catch (err) {
        console.error('Error loading amenities:', err);
        setError(err instanceof Error ? err.message : 'Failed to load amenities');
        
        // Fallback to mock data
        const mockAmenities = [
          { 
            id: '1', 
            name: 'Premium Lounge', 
            category: 'Comfort', 
            walkTime: '5 min walk', 
            rating: 4.5, 
            description: 'Relax in comfort with complimentary refreshments',
            available_in_transit: true
          },
          { 
            id: '2', 
            name: 'Coffee Shop', 
            category: 'Food', 
            walkTime: '3 min walk', 
            rating: 4.2, 
            description: 'Fresh coffee and light snacks',
            available_in_transit: true
          }
        ];
        setAmenities(mockAmenities);
        
      } finally {
        setIsLoading(false);
      }
    };

    loadAmenities();
  }, [airport, terminal, context]);

  // Handle saving/unsaving amenities
  const handleToggleAmenity = (amenityId: string) => {
    setSavedAmenities(prev => 
      prev.includes(amenityId) 
        ? prev.filter(id => id !== amenityId)
        : [...prev, amenityId]
    );
  };

  // Handle completing the experience
  const handleCompleteExperience = () => {
    if (returnTo === 'multi-segment' && segment !== null) {
      sessionStorage.setItem('completedSegmentIndex', segment);
      sessionStorage.setItem('selectedVibe', vibe || 'mixed');
      sessionStorage.setItem('savedAmenities', JSON.stringify(savedAmenities));
      navigate('/multi-segment-planner');
    } else {
      navigate('/journey-summary');
    }
  };

  // Handle back navigation
  const handleBack = () => {
    if (returnTo === 'multi-segment') {
      navigate('/multi-segment-planner');
    } else {
      navigate(-1);
    }
  };

  // Get context-specific content
  const getContextContent = () => {
    const contextMap = {
      departure: {
        title: `${airport} Departure Experience`,
        subtitle: 'Quick options before your flight',
        buttonText: 'Complete Departure Planning',
        icon: '✈️'
      },
      transit: {
        title: `${airport} Transit Experience`, 
        subtitle: 'Make the most of your layover',
        buttonText: 'Complete Transit Planning',
        icon: '🔄'
      },
      arrival: {
        title: `${airport} Arrival Experience`,
        subtitle: 'Final stops on your journey',
        buttonText: 'Complete Arrival Planning', 
        icon: '🏁'
      }
    };
    
    return contextMap[context as keyof typeof contextMap] || contextMap.transit;
  };

  const contextContent = getContextContent();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900">
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-purple-600" />
            <h2 className="text-xl font-semibold text-white mb-2">
              Loading {airport} amenities...
            </h2>
            <p className="text-gray-400">
              Finding the best options for your {context}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900">
        <div className="p-6">
          <h2 className="text-xl font-bold text-white mb-4">Error Loading Experience</h2>
          <p className="text-gray-300">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 text-white">
      {/* Header with Navigation */}
      <div className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-sm border-b border-gray-700">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-white hover:text-gray-300 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="text-sm font-medium">Back</span>
          </button>
          
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-white hover:text-gray-300 transition-colors"
          >
            <Home className="h-5 w-5" />
            <span className="text-sm font-medium">Home</span>
          </button>
        </div>
        
        {/* Terminal Header */}
        <div className="px-4 py-2">
          <h1 className="text-xl font-bold text-white">
            {airport || 'Terminal'} Experience
          </h1>
          <p className="text-gray-400 text-sm">
            Terminal {terminal || 'T1'} • {context || 'departure'}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 space-y-6">
        {/* Error message if any */}
        {error && (
          <div className="bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
            <p className="text-orange-800 dark:text-orange-200 text-sm">
              ⚠️ {error} - Showing backup options to keep your flow going.
            </p>
          </div>
        )}

        {/* Current vibe indicator */}
        {vibe && (
          <div className="bg-slate-800 p-4 rounded-xl shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
              <span className="text-sm font-medium text-white">
                Current vibe: <span className="capitalize">{vibe}</span>
              </span>
            </div>
          </div>
        )}

        {/* Amenities Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {amenities.map((amenity) => {
            const isSaved = savedAmenities.includes(amenity.id);
            
            return (
              <div
                key={amenity.id}
                className={`bg-slate-800 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden border ${
                  isSaved 
                    ? 'border-purple-500 bg-purple-900/20' 
                    : 'border-slate-700 hover:border-purple-500'
                }`}
              >
                <div className="p-6">
                  {/* Emotional Pulse Rating */}
                  <div className="mb-4">
                    <VibePulseRating amenity={amenity} />
                  </div>
                  
                  {/* Amenity Header */}
                  <div className="mb-4">
                    <div className="flex items-start justify-between">
                      <h3 className="text-lg font-semibold text-white mb-1">
                        {amenity.name}
                      </h3>
                      <button
                        onClick={() => handleToggleAmenity(amenity.id)}
                        className={`p-2 rounded-full transition-all duration-200 ${
                          isSaved
                            ? 'bg-purple-600 text-white'
                            : 'bg-slate-700 text-slate-400 hover:bg-purple-600'
                        }`}
                      >
                        <CheckCircle className={`h-4 w-4 ${
                          isSaved ? 'fill-current' : ''
                        }`} />
                      </button>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-slate-400 mb-2">
                      <span className="px-2 py-1 bg-slate-700 rounded-full text-xs">
                        {amenity.category}
                      </span>
                      {amenity.walkTime && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span className="text-xs">{amenity.walkTime}</span>
                        </div>
                      )}
                      {amenity.rating && (
                        <div className="flex items-center gap-1">
                          <span className="text-xs">⭐ {amenity.rating}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Description */}
                  <p className="text-sm text-slate-400 mb-4">
                    {amenity.description || 'A great spot to visit during your airport experience.'}
                  </p>
                  
                  {/* Action Button */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-xs border-slate-600 text-slate-300"
                      onClick={() => navigate(`/amenity/${amenity.id}`)}
                    >
                      <MapPin className="h-3 w-3 mr-1" />
                      View Details
                    </Button>
                    <Button
                      variant={isSaved ? "default" : "outline"}
                      size="sm"
                      className="text-xs"
                      onClick={() => handleToggleAmenity(amenity.id)}
                    >
                      {isSaved ? 'Saved' : 'Save'}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* No amenities message */}
        {amenities.length === 0 && (
          <div className="text-center py-12">
            <h3 className="text-lg font-semibold text-white mb-2">
              No amenities available
            </h3>
            <p className="text-slate-400">
              We couldn't find any amenities for {airport} Terminal {terminal}.
            </p>
          </div>
        )}
      </div>

      {/* Enhanced Floating Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-slate-800 border-t border-slate-700 p-6">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse"></div>
                {savedAmenities.length > 0 && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-purple-600 text-white text-xs rounded-full flex items-center justify-center font-bold">
                    {savedAmenities.length}
                  </div>
                )}
              </div>
              
              <div>
                <h3 className="font-semibold text-white">
                  {savedAmenities.length > 0 
                    ? `${savedAmenities.length} ${savedAmenities.length === 1 ? 'amenity' : 'amenities'} saved!` 
                    : 'Ready to continue?'
                  }
                </h3>
                <p className="text-sm text-slate-400">
                  {savedAmenities.length > 0 
                    ? 'Your journey is taking shape.' 
                    : 'Save amenities or continue planning.'
                  }
                </p>
              </div>
            </div>
            
            <div className="flex gap-3">
              {savedAmenities.length > 0 && (
                <Button
                  variant="outline"
                  className="border-purple-600 text-purple-300 hover:bg-purple-900"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Preview
                </Button>
              )}
              
              <Button
                onClick={handleCompleteExperience}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
              >
                Complete
                <div className="h-4 w-4 ml-2 flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                </div>
              </Button>
            </div>
          </div>
          
          {savedAmenities.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-700">
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <Zap className="h-4 w-4 text-purple-500" />
                <span>Your {context || 'journey'} experience is ready</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Debug Info */}
      {import.meta.env.DEV && (
        <details className="fixed bottom-32 left-4 bg-black/80 text-white p-2 rounded text-xs max-w-xs">
          <summary className="cursor-pointer">Debug Info</summary>
          <pre className="mt-2 overflow-auto">
            {JSON.stringify({ 
              airport,
              terminal,
              context,
              amenitiesCount: amenities.length,
              savedCount: savedAmenities.length
            }, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
}
