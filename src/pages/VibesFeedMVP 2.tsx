// src/pages/VibesFeedMVP.tsx
// Updated to use the complete VibeCollectionsService with all 31 collections

import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, MapPin, Clock, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { 
  getCollectionsForVibe, 
  getTimeSlot,
  getFeaturedCollections 
} from '@/services/VibeCollectionsService';
import { getOptimalVibeOrder, shouldHighlightVibe, getVibeBadge } from '@/utils/getOptimalVibeOrder';
import { getBoardingStatusLabel, getBoardingStatusColor } from '@/utils/getBoardingStatus';

// Vibe configuration with emojis and gradients
const VIBE_CONFIG = {
  comfort: {
    icon: '👑',
    name: 'Comfort',
    description: 'Premium lounges & rest',
    gradient: 'from-purple-500 to-indigo-500'
  },
  chill: {
    icon: '😌',
    name: 'Chill',
    description: 'Quiet, peaceful spaces',
    gradient: 'from-blue-400 to-cyan-400'
  },
  refuel: {
    icon: '🍔',
    name: 'Refuel',
    description: 'Food & drinks',
    gradient: 'from-orange-400 to-red-400'
  },
  work: {
    icon: '💼',
    name: 'Work',
    description: 'Productivity zones',
    gradient: 'from-gray-500 to-gray-700'
  },
  shop: {
    icon: '🛍️',
    name: 'Shop',
    description: 'Retail therapy',
    gradient: 'from-pink-400 to-purple-400'
  },
  quick: {
    icon: '⚡',
    name: 'Quick',
    description: 'Time-pressed options',
    gradient: 'from-yellow-400 to-amber-400'
  },
  discover: {
    icon: '🧭',
    name: 'Discover',
    description: 'Unique experiences',
    gradient: 'from-green-400 to-teal-400'
  }
};

interface Collection {
  id: string;
  collection_id: string;
  name: string;
  spots_total: number;
  spots_near_you: number;
  description?: string;
  is_dynamic?: boolean;
  amenity_count?: number;
}

interface VibeSection {
  vibe: string;
  collections: Collection[];
  order: number;
}

const VibesFeedMVP: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [vibeSections, setVibeSections] = useState<VibeSection[]>([]);
  const [terminal] = useState('SIN-T3');
  const [currentTimeSlot, setCurrentTimeSlot] = useState(getTimeSlot());
  const [featuredCollections, setFeaturedCollections] = useState<any[]>([]);
  const [boardingTime, setBoardingTime] = useState<number | undefined>();
  const [vibeOrderResult, setVibeOrderResult] = useState<ReturnType<typeof getOptimalVibeOrder> | null>(null);
  const [visibleVibes, setVisibleVibes] = useState<Set<string>>(new Set());
  const scrollContainerRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Get time-based configuration
  const getTimeBasedConfig = () => {
    const hour = new Date().getHours();
    
    if (hour >= 5 && hour < 11) {
      return {
        greeting: "Good morning! Starting your journey?",
        tone: 'Energetic',
        subtext: 'Collections optimized for morning travelers'
      };
    } else if (hour >= 11 && hour < 14) {
      return {
        greeting: "Peak hours at Changi. Navigate like a pro.",
        tone: 'Confident',
        subtext: 'Lunch spots and quick services highlighted'
      };
    } else if (hour >= 14 && hour < 17) {
      return {
        greeting: "Afternoon at Changi. Time to explore.",
        tone: 'Adventurous',
        subtext: 'Discover unique experiences'
      };
    } else if (hour >= 17 && hour < 23) {
      return {
        greeting: "Evening vibes. Make the most of it.",
        tone: 'Relaxed',
        subtext: 'Dinner and shopping options featured'
      };
    } else {
      return {
        greeting: "Late night crew - we've got you.",
        tone: 'Supportive',
        subtext: '24/7 services and comfort zones'
      };
    }
  };


  // Initial load - also reload when boarding time changes
  useEffect(() => {
    let mounted = true; // Add this flag
    
    const loadVibeCollections = async () => {
      if (mounted) {
        setLoading(true);
      }
      
      const sections: VibeSection[] = [];
      
      // Get vibes in dynamic order based on boarding time
      const orderResult = getOptimalVibeOrder(boardingTime);
      if (mounted) {
        setVibeOrderResult(orderResult);
      }
      const vibeOrder = orderResult.order;
      
      // Get featured collections
      const featured = getFeaturedCollections(3);
      if (mounted) {
        setFeaturedCollections(featured);
      }

      // Load data for each vibe
      for (let i = 0; i < vibeOrder.length; i++) {
        const vibeKey = vibeOrder[i];
        const vibeConfig = VIBE_CONFIG[vibeKey as keyof typeof VIBE_CONFIG];
        
        if (!vibeConfig) continue;

        // Get collections for this vibe (4+2 adaptive)
        const vibeCollectionMappings = getCollectionsForVibe(vibeKey, currentTimeSlot);
        
        // Fetch actual data from Supabase for these collections
        const { data: dbCollections, error: collectionsError } = await supabase
          .from('collections')
          .select('*')
          .in('collection_id', vibeCollectionMappings.map(m => m.collection_slug));
        
        if (collectionsError) {
          if (mounted) {
            console.error('Error fetching collections:', collectionsError);
          }
        }

        // Map database results to our collection format
        const collections: Collection[] = vibeCollectionMappings.map(mapping => {
          const dbCollection = dbCollections?.find(
            c => c.collection_id === mapping.collection_slug
          );
          
          return {
            id: dbCollection?.id || mapping.collection_slug,
            collection_id: mapping.collection_slug,
            name: dbCollection?.name || mapping.collection_name,
            spots_total: Math.floor(Math.random() * 15) + 5, // Mock count for now
            spots_near_you: Math.floor(Math.random() * 5) + 1, // Mock for now
            description: dbCollection?.description,
            is_dynamic: mapping.isDynamic
          };
        });

        sections.push({
          vibe: vibeKey,
          collections: collections,
          order: i
        });
      }

      if (mounted) { // Only update state if still mounted
        setVibeSections(sections);
        setLoading(false);
      }
    };
    
    loadVibeCollections();
    
    return () => {
      mounted = false; // Prevent state updates after unmount
    };
  }, [terminal, currentTimeSlot, boardingTime]);

  // Simulate boarding time for demo (remove in production)
  useEffect(() => {
    // Example: Set boarding time to 2 hours from now
    setBoardingTime(Date.now() + 2 * 60 * 60 * 1000);
    
    // You can also test different scenarios:
    // setBoardingTime(Date.now() + 10 * 60 * 1000); // Rush mode - 10 mins
    // setBoardingTime(Date.now() + 30 * 60 * 1000); // Imminent - 30 mins
    // setBoardingTime(Date.now() + 60 * 60 * 1000); // Soon - 60 mins
    // setBoardingTime(Date.now() + 4 * 60 * 60 * 1000); // Extended - 4 hours
  }, []);

  // Update time slot every minute
  useEffect(() => {
    const interval = setInterval(() => {
      const newSlot = getTimeSlot();
      if (newSlot !== currentTimeSlot) {
        setCurrentTimeSlot(newSlot);
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [currentTimeSlot]);

  // Use Intersection Observer to track which vibes are visible
  useEffect(() => {
    let mounted = true; // Add mounted flag for safety
    
    const observer = new IntersectionObserver(
      (entries) => {
        if (!mounted) return; // Check if component is still mounted
        
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const vibe = entry.target.getAttribute('data-vibe');
            if (vibe) {
              setVisibleVibes(prev => new Set(prev).add(vibe));
            }
          }
        });
      },
      { threshold: 0.1 }
    );

    // Observe each vibe section
    Object.keys(scrollContainerRefs.current).forEach(vibe => {
      const element = scrollContainerRefs.current[vibe];
      if (element) observer.observe(element);
    });

    return () => {
      mounted = false; // Prevent state updates after unmount
      observer.disconnect();
    };
  }, [vibeSections]); // Re-run when vibeSections change

  const timeConfig = getTimeBasedConfig();

  // Skeleton loader component for non-visible vibes
  const VibeSkeletonLoader = ({ vibe }: { vibe: string }) => {
    const vibeConfig = VIBE_CONFIG[vibe as keyof typeof VIBE_CONFIG];
    return (
      <div className="px-4 py-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">{vibeConfig?.icon || '📦'}</span>
            <h2 className="text-lg font-bold text-gray-900">
              {vibeConfig?.name || vibe}
            </h2>
          </div>
          <div className="h-6 w-16 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="flex gap-3 overflow-hidden">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex-shrink-0">
              <div className="h-32 w-36 bg-gray-200 rounded-2xl animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your airport experience...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Terminal+</h1>
              <p className="text-sm text-gray-500 mt-1">{timeConfig.greeting}</p>
            </div>
            <div className="flex items-center space-x-3">
              <button 
                className="flex items-center space-x-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm font-medium"
                onClick={() => {/* Terminal selector */}}
              >
                <MapPin className="h-4 w-4" />
                <span>{terminal}</span>
              </button>
            </div>
          </div>
          <p className="text-xs text-gray-500 flex items-center">
            <Sparkles className="h-3 w-3 mr-1" />
            {timeConfig.subtext}
          </p>
        </div>
      </div>

      {/* Boarding Status Banner */}
      {vibeOrderResult?.statusMessage && (
        <div 
          className="px-4 py-3 flex items-center justify-between"
          style={{ 
            backgroundColor: vibeOrderResult.boardingStatus ? 
              getBoardingStatusColor(vibeOrderResult.boardingStatus) + '20' : 
              '#f3f4f6'
          }}
        >
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4" style={{ 
              color: vibeOrderResult.boardingStatus ? 
                getBoardingStatusColor(vibeOrderResult.boardingStatus) : 
                '#6b7280'
            }} />
            <p className="text-sm font-medium" style={{ 
              color: vibeOrderResult.boardingStatus ? 
                getBoardingStatusColor(vibeOrderResult.boardingStatus) : 
                '#374151'
            }}>
              {vibeOrderResult.statusMessage}
            </p>
          </div>
          {vibeOrderResult.boardingStatus && (
            <span 
              className="text-xs font-bold px-2 py-1 rounded-full"
              style={{ 
                backgroundColor: getBoardingStatusColor(vibeOrderResult.boardingStatus),
                color: 'white'
              }}
            >
              {getBoardingStatusLabel(vibeOrderResult.boardingStatus)}
            </span>
          )}
        </div>
      )}

      {/* Featured Collections Banner */}
      {featuredCollections.length > 0 && (
        <div className="px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
          <p className="text-xs font-medium mb-2">✨ Featured Right Now</p>
          <div className="flex space-x-2 overflow-x-auto scrollbar-hide">
            {featuredCollections.map((col) => (
              <button
                key={col.collection_slug}
                onClick={() => navigate(`/collection/${col.vibe}/${col.collection_slug}`)}
                className="flex-shrink-0 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium hover:bg-white/30 transition-colors"
              >
                {col.collection_name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Vibe Sections */}
      <div className="px-4 py-4 space-y-6">
        {vibeSections.map((section) => {
          const vibeConfig = VIBE_CONFIG[section.vibe as keyof typeof VIBE_CONFIG];
          const vibeBadge = getVibeBadge(section.vibe, vibeOrderResult?.boardingStatus || null);
          const shouldHighlight = shouldHighlightVibe(section.vibe, vibeOrderResult?.boardingStatus || null);
          const isVisible = visibleVibes.has(section.vibe);
          
          return (
            <div 
              key={section.vibe} 
              data-vibe={section.vibe}
              ref={el => { scrollContainerRefs.current[section.vibe] = el; }}
              className={`relative ${
                shouldHighlight ? 'ring-2 ring-blue-400 ring-offset-2 rounded-lg p-3' : ''
              }`}
            >
              {/* Vibe Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <span className="text-3xl">{vibeConfig.icon}</span>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h2 className="text-lg font-bold text-gray-900">{vibeConfig.name}</h2>
                      {vibeBadge?.show && (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          vibeBadge.type === 'urgent' ? 'bg-red-100 text-red-700' :
                          vibeBadge.type === 'recommended' ? 'bg-blue-100 text-blue-700' :
                          'bg-purple-100 text-purple-700'
                        }`}>
                          {vibeBadge.text}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">{vibeConfig.description}</p>
                  </div>
                </div>
                <button 
                  onClick={() => navigate(`/vibe/${section.vibe}`)}
                  className="text-blue-600 text-sm font-medium flex items-center"
                >
                  See all
                  <ChevronRight className="h-4 w-4 ml-1" />
                </button>
              </div>

              {/* Collections Container with Scroll Indicator */}
              <div className="relative">
                {isVisible ? (
                  <>
                    {/* Collections Horizontal Scroll - 2.5 cards visible on mobile */}
                    <div 
                      className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 snap-x snap-mandatory scroll-smooth"
                      style={{
                        WebkitOverflowScrolling: 'touch', // Smooth iOS scrolling
                        scrollPaddingLeft: '0',
                        scrollPaddingRight: '1rem',
                        marginRight: '-1rem', // Allow cards to bleed to edge
                        paddingRight: '1rem'
                      }}
                    >
                    {/* Show max 7 collections, then "See All" */}
                    {section.collections.slice(0, 7).map((collection) => (
                  <button
                    key={collection.collection_id}
                    onClick={() => navigate(`/collection/${section.vibe}/${collection.collection_id}`)}
                    className="flex-shrink-0 snap-start relative group first:ml-0 last:mr-4"
                    style={{ 
                      width: 'calc((100vw - 48px) / 2.5)', // 2.5 cards visible
                      minWidth: '140px', // Minimum card width
                      maxWidth: '160px' // Maximum card width for better mobile fit
                    }}
                  >
                    <div className={`h-32 rounded-2xl bg-gradient-to-br ${vibeConfig.gradient} p-4 flex flex-col justify-between transform transition-all hover:scale-105 active:scale-95`}>
                      {/* Dynamic badge */}
                      {collection.is_dynamic && (
                        <span className="absolute -top-2 -right-2 bg-yellow-400 text-black text-xs px-2 py-0.5 rounded-full font-medium">
                          Featured
                        </span>
                      )}
                      
                      <div className="flex-1">
                        <h3 className="font-bold text-white text-sm leading-tight line-clamp-2">
                          {collection.name}
                        </h3>
                      </div>
                      
                      <div className="text-white/90">
                        <span className="text-xs">
                          {collection.spots_total || '10+'} spots
                        </span>
                      </div>
                    </div>
                    

                  </button>
                ))}

                {/* "See All" button as 8th item if more than 7 collections */}
                {section.collections.length > 7 && (
                  <button
                    onClick={() => navigate(`/vibe/${section.vibe}`)}
                    className="flex-shrink-0 snap-start"
                    style={{ 
                      width: 'calc((100vw - 48px) / 2.5)',
                      minWidth: '140px',
                      maxWidth: '180px'
                    }}
                  >
                    <div className="h-32 rounded-2xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center hover:border-blue-500 hover:bg-blue-50 transition-all">
                      <span className="text-2xl mb-1">+</span>
                      <span className="text-sm text-gray-600">See all</span>
                      <span className="text-xs text-gray-400 mt-1">{section.collections.length} total</span>
                    </div>
                  </button>
                )}
                    </div>
                    
                    {/* Scroll Gradient Indicator (right edge fade) */}
                    {section.collections.length > 3 && (
                      <div className="absolute right-0 top-0 bottom-2 w-12 bg-gradient-to-l from-slate-50 to-transparent pointer-events-none" />
                    )}
                  </>
                ) : (
                  <VibeSkeletonLoader vibe={section.vibe} />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom spacing */}
      <div className="h-20" />

      {/* Demo Controls (dev only) */}
      {import.meta.env.DEV && (
        <div className="fixed bottom-4 right-4 bg-black/90 text-white text-xs p-3 rounded-lg space-y-2 max-w-xs">
          <p className="font-bold mb-2">🎮 Demo Controls</p>
          <div className="space-y-1">
            <button
              onClick={() => setBoardingTime(Date.now() + 10 * 60 * 1000)}
              className="block w-full text-left px-2 py-1 bg-red-600 hover:bg-red-700 rounded transition-colors"
            >
              ⚡ Rush (10 min)
            </button>
            <button
              onClick={() => setBoardingTime(Date.now() + 30 * 60 * 1000)}
              className="block w-full text-left px-2 py-1 bg-amber-600 hover:bg-amber-700 rounded transition-colors"
            >
              🍔 Imminent (30 min)
            </button>
            <button
              onClick={() => setBoardingTime(Date.now() + 60 * 60 * 1000)}
              className="block w-full text-left px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded transition-colors"
            >
              😌 Soon (1 hour)
            </button>
            <button
              onClick={() => setBoardingTime(Date.now() + 2 * 60 * 60 * 1000)}
              className="block w-full text-left px-2 py-1 bg-emerald-600 hover:bg-emerald-700 rounded transition-colors"
            >
              💼 Normal (2 hours)
            </button>
            <button
              onClick={() => setBoardingTime(Date.now() + 4 * 60 * 60 * 1000)}
              className="block w-full text-left px-2 py-1 bg-violet-600 hover:bg-violet-700 rounded transition-colors"
            >
              🔍 Extended (4+ hours)
            </button>
            <button
              onClick={() => setBoardingTime(undefined)}
              className="block w-full text-left px-2 py-1 bg-gray-600 hover:bg-gray-700 rounded transition-colors"
            >
              ❌ No Boarding Time
            </button>
          </div>
          <div className="pt-2 mt-2 border-t border-gray-700">
            <p>Time: {currentTimeSlot}</p>
            <p>Status: {vibeOrderResult?.boardingStatus || 'None'}</p>
            <p>Collections: {vibeSections.reduce((acc, s) => acc + s.collections.length, 0)}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default VibesFeedMVP;