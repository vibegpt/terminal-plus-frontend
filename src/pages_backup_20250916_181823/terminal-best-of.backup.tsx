import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  ArrowLeft, Play, Heart, MoreHorizontal, Clock, MapPin, 
  Sparkles, Award, Users, CheckCircle, Share, Download,
  Coffee, ShoppingBag, Wifi, Zap, ChevronRight, ChevronLeft,
  Timer, Activity, Star, UserCheck, Baby, Gem, Brain, Signal,
  MapPinIcon, RefreshCw
} from 'lucide-react';
import { VIBE_DEFINITIONS } from '../constants/vibes';
import { 
  getTerminalCollections, 
  getCollectionsWithStats,
  getTerminalCollectionsDirect 
} from '../lib/services/collections';

interface Collection {
  id: string;
  title: string;
  subtitle: string;
  emoji: string;
  icon?: React.ReactNode;
  color: string;
  gradient: string;
  vibeAlignment: string | null;
  plays?: number;
  items: number;
  priority?: 'urgent' | 'normal';
  timeRestricted?: boolean;
  logic?: string;
  amenityMix?: string[];
  isMLGenerated?: boolean;
  mlConfidence?: number;
  liveActivity?: {
    currentUsers: number;
    trend: 'up' | 'down';
    lastUpdated: string;
  };
}

interface TerminalData {
  code: string;
  airport: string;
  fullName: string;
  type: string;
  stats: {
    totalExperiences: number;
    curatedSpots: number;
    avgRating: number;
  };
}

const TerminalBestOfPage: React.FC = () => {
  const { terminalCode } = useParams<{ terminalCode: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [savedItems, setSavedItems] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'collections' | 'vibes'>('collections');
  const [supabaseCollections, setSupabaseCollections] = useState<any[]>([]);
  const [loadingCollections, setLoadingCollections] = useState(true);
  const carouselRef = useRef<HTMLDivElement>(null);
  
  // Parse terminal code (e.g., "SYD-T1" -> airport: "SYD", terminal: "T1")
  const [airportCode, terminalNumber] = terminalCode?.split('-') || ['SYD', 'T1'];
  
  // Get context from navigation state
  const { context, flightNumber, route } = location.state || {
    context: 'departure',
    flightNumber: 'QF1',
    route: ['SYD', 'SIN', 'LHR']
  };

  // Mock data for development
  const [detecting, setDetecting] = useState(false);
  const [isAtAirport, setIsAtAirport] = useState<boolean | null>(null);
  const [detectedAirport, setDetectedAirport] = useState<string>('');
  const [timeToBoarding, setTimeToBoarding] = useState(120);
  const [liveData] = useState({
    totalActiveUsers: 247,
    trendingSpots: [
      { name: 'Sky Garden', currentUsers: 23 },
      { name: 'Butterfly Garden', currentUsers: 18 },
      { name: 'Movie Theater', currentUsers: 15 }
    ],
    lastUpdated: new Date().toLocaleTimeString()
  });

  // Mock ML collections service
  const MLCollectionService = {
    applyTimeDecay: (time: number) => ({
      title: time <= 30 ? 'Emergency Options' : 'Quick Picks',
      maxDuration: time <= 30 ? 15 : 45,
      maxDistance: time <= 30 ? 200 : 500,
      focus: time <= 30 ? ['Grab & Go', 'Express Services'] : ['Quick Bites', 'Fast Shopping']
    })
  };

  // Mock ML collections
  const [mlCollections] = useState<Collection[]>([
    {
      id: 'ml-personalized',
      title: 'For Your Journey',
      subtitle: 'AI-curated based on your preferences',
      emoji: '🤖',
      icon: <Brain className="h-8 w-8" />,
      color: 'from-blue-500 to-purple-500',
      gradient: 'from-blue-500 to-purple-500',
      vibeAlignment: null,
      items: 8,
      isMLGenerated: true,
      mlConfidence: 0.92,
      amenityMix: ['Personalized picks', 'Based on history', 'Similar travelers']
    }
  ]);

  // Mock collaborative collection
  const [collaborativeCollection] = useState<Collection>({
    id: 'collaborative',
    title: 'Travelers Like You',
    subtitle: 'Based on similar journey patterns',
    emoji: '👥',
    icon: <Users className="h-8 w-8" />,
    color: 'from-green-500 to-teal-500',
    gradient: 'from-green-500 to-teal-500',
    vibeAlignment: null,
    items: 6,
    amenityMix: ['Popular with QF1 travelers', 'Frequent flyer picks', 'Route favorites']
  });

  // Mock pull-to-refresh
  const [pullToRefresh] = useState({
    isPulling: false,
    pullDistance: 0,
    isRefreshing: false,
    handlers: {}
  });

  // Mock useSwipeGesture hook
  const useSwipeGesture = (onSwipeLeft: () => void, onSwipeRight: () => void) => ({
    onTouchStart: () => {},
    onTouchMove: () => {},
    onTouchEnd: () => {}
  });

  // Mock AnalyticsService
  const AnalyticsService = {
    trackCollectionEngagement: (data: any) => console.log('Analytics:', data),
    trackMLCollectionPerformance: (data: any) => console.log('ML Analytics:', data),
    startViewTracking: (id: string) => console.log('Start tracking:', id)
  };

  // Terminal data
  const terminalData: TerminalData = {
    code: terminalCode || 'SYD-T1',
    airport: airportCode === 'SYD' ? 'Sydney' : 
             airportCode === 'SIN' ? 'Singapore' : 
             airportCode === 'LHR' ? 'London Heathrow' : airportCode,
    fullName: airportCode === 'SYD' ? 'Sydney Kingsford Smith' :
              airportCode === 'SIN' ? 'Singapore Changi' :
              airportCode === 'LHR' ? 'London Heathrow' : airportCode,
    type: context || 'departure',
    stats: {
      totalExperiences: 37702,
      curatedSpots: 18,
      avgRating: 4.7
    }
  };

  // Vibe-based collections (shown in vibe mode)
  const vibeCollections: Collection[] = Object.values(VIBE_DEFINITIONS).map(vibe => ({
    id: vibe.id,
    title: vibe.name, // Just the vibe name, no 'Spots'
    subtitle: vibe.description,
    emoji: vibe.emoji,
    color: vibe.gradient,
    gradient: vibe.gradient,
    vibeAlignment: vibe.id,
    items: Math.floor(Math.random() * 10) + 5,
    amenityMix: vibe.examples
  }));

  // Situation-based collections (not vibe duplicates)
  const collections: Collection[] = [
    {
      id: 'must-see',
      title: 'Must-See Highlights',
      subtitle: 'Award-winning spots you can\'t miss',
      emoji: '⭐',
      icon: <Star className="h-8 w-8" />,
      color: 'from-yellow-500 to-orange-500',
      gradient: 'from-yellow-500 to-orange-500',
      vibeAlignment: null,
      plays: 45892,
      items: 8,
      amenityMix: ['Award winners', 'Unique to terminal', 'Instagram-worthy']
    },
    {
      id: 'quiet-havens',
      title: 'Quiet Havens',
      subtitle: 'Peaceful spaces for tranquility',
      emoji: '😌',
      icon: <Sparkles className="h-8 w-8" />,
      color: VIBE_DEFINITIONS.chill.gradient,
      gradient: VIBE_DEFINITIONS.chill.gradient,
      vibeAlignment: 'chill',
      plays: 23456,
      items: 5,
      amenityMix: ['Meditation rooms', 'Quiet lounges', 'Libraries', 'Reading areas']
    },
    {
      id: 'recharge-stations',
      title: 'Recharge Stations',
      subtitle: 'Rest, relax, and rejuvenate',
      emoji: '🛋️',
      icon: <Coffee className="h-8 w-8" />,
      color: VIBE_DEFINITIONS.comfort.gradient,
      gradient: VIBE_DEFINITIONS.comfort.gradient,
      vibeAlignment: 'comfort',
      plays: 28743,
      items: 6,
      amenityMix: ['Sleep pods', 'Spas', 'Massage chairs', 'Day hotels']
    },
    {
      id: 'discovery-trail',
      title: 'Discovery Trail',
      subtitle: 'Attractions and experiences to explore',
      emoji: '🧭',
      icon: <MapPin className="h-8 w-8" />,
      color: VIBE_DEFINITIONS.explore.gradient,
      gradient: VIBE_DEFINITIONS.explore.gradient,
      vibeAlignment: 'explore',
      plays: 31234,
      items: 10,
      amenityMix: ['Gardens', 'Art installations', 'Observation decks', 'Cinemas']
    },
    {
      id: 'foodie-paradise',
      title: 'Foodie Paradise',
      subtitle: 'Dining experiences worth the wait',
      emoji: '🍔',
      icon: <Coffee className="h-8 w-8" />,
      color: VIBE_DEFINITIONS.refuel.gradient,
      gradient: VIBE_DEFINITIONS.refuel.gradient,
      vibeAlignment: 'refuel',
      plays: 34567,
      items: 14,
      amenityMix: ['Restaurants', 'Cafes', 'Bars', 'Food courts']
    },
    {
      id: 'express-lane',
      title: 'Express Lane',
      subtitle: 'Everything under 10 minutes',
      emoji: '⚡',
      icon: <Zap className="h-8 w-8" />,
      color: VIBE_DEFINITIONS.quick.gradient,
      gradient: VIBE_DEFINITIONS.quick.gradient,
      vibeAlignment: 'quick',
      plays: 32156,
      items: 12,
      amenityMix: ['Grab-and-go food', 'Convenience stores', 'Express services']
    },
    {
      id: 'productivity-hubs',
      title: 'Productivity Hubs',
      subtitle: 'Get work done between flights',
      emoji: '💼',
      icon: <Wifi className="h-8 w-8" />,
      color: VIBE_DEFINITIONS.work.gradient,
      gradient: VIBE_DEFINITIONS.work.gradient,
      vibeAlignment: 'work',
      plays: 19234,
      items: 9,
      amenityMix: ['Business lounges', 'Work pods', 'Meeting rooms', 'Quiet workspaces']
    },
    {
      id: 'retail-therapy',
      title: 'Retail Therapy',
      subtitle: 'Shopping, duty-free, and boutiques',
      emoji: '🛍️',
      icon: <ShoppingBag className="h-8 w-8" />,
      color: VIBE_DEFINITIONS.shop.gradient,
      gradient: VIBE_DEFINITIONS.shop.gradient,
      vibeAlignment: 'shop',
      plays: 41567,
      items: 15,
      amenityMix: ['Duty-free shops', 'Boutiques', 'Souvenir stores', 'Fashion outlets']
    },
    {
      id: 'hidden-gems',
      title: 'Hidden Gems',
      subtitle: 'Secret spots locals love',
      emoji: '💎',
      icon: <Gem className="h-8 w-8" />,
      color: 'from-indigo-500 to-purple-500',
      gradient: 'from-indigo-500 to-purple-500',
      vibeAlignment: null,
      plays: 12890,
      items: 7,
      amenityMix: ['Off-path lounges', 'Local favorites', 'Quiet escapes', 'Secret gardens']
    }
  ];



  // Get active collections based on view mode and time
  const getActiveCollections = (): Collection[] => {
    if (viewMode === 'vibes') {
      return vibeCollections;
    }
    
    // Use Supabase collections if available, otherwise fall back to mock data
    if (supabaseCollections.length > 0) {
      return supabaseCollections;
    }
    
    // Use the curated collections array for collections mode
    return collections;
  };

  const activeCollections = getActiveCollections();

  const getTerminalGradient = () => {
    switch(context) {
      case 'departure': return 'from-blue-600 to-cyan-600';
      case 'transit': return 'from-purple-600 to-pink-600';
      case 'arrival': return 'from-green-600 to-emerald-600';
      default: return 'from-gray-600 to-gray-700';
    }
  };

  const handleCollectionClick = (collection: Collection, index: number) => {
    // Track analytics
    AnalyticsService.trackCollectionEngagement({
      collection_viewed: collection.id,
      view_mode: viewMode,
      time_to_boarding: timeToBoarding,
      collection_position: index,
      interaction_type: 'click',
      is_ml_generated: collection.isMLGenerated,
      is_time_urgent: collection.priority === 'urgent',
      user_location: isAtAirport ? 'at_airport' : 'remote',
      live_users_count: collection.liveActivity?.currentUsers
    });
    
    // Track ML performance if applicable
    if (collection.isMLGenerated) {
      AnalyticsService.trackMLCollectionPerformance({
        collection_id: collection.id,
        ml_confidence: collection.mlConfidence || 0,
        user_interacted: true,
        context_match_score: 0.8
      });
    }
    
    // Navigate to collection detail view
    navigate(`/collection/${terminalCode}/${collection.id}`, {
      state: { collection, terminalData }
    });
  };

  const handleSaveCollection = (collectionId: string, index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Track save analytics
    AnalyticsService.trackCollectionEngagement({
      collection_viewed: collectionId,
      view_mode: viewMode,
      time_to_boarding: timeToBoarding,
      collection_position: index,
      interaction_type: 'save',
      user_location: isAtAirport ? 'at_airport' : 'remote'
    });
    
    setSavedItems(prev => 
      prev.includes(collectionId) 
        ? prev.filter(id => id !== collectionId)
        : [...prev, collectionId]
    );
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handleVibeSelect = () => {
    navigate('/vibe-select', {
      state: { 
        terminalCode,
        context,
        returnTo: `/best-of/${terminalCode}`
      }
    });
  };

  // Carousel scroll handlers
  const scrollCarousel = (direction: 'left' | 'right') => {
    if (carouselRef.current) {
      const scrollAmount = 320;
      const currentScroll = carouselRef.current.scrollLeft;
      const targetScroll = direction === 'left' 
        ? currentScroll - scrollAmount 
        : currentScroll + scrollAmount;
      
      carouselRef.current.scrollTo({
        left: targetScroll,
        behavior: 'smooth'
      });
    }
  };

  // Swipe gesture handlers for mobile
  const swipeHandlers = useSwipeGesture(
    () => scrollCarousel('right'),
    () => scrollCarousel('left')
  );

  // Track collection view starts for dwell time
  useEffect(() => {
    activeCollections.forEach(collection => {
      AnalyticsService.startViewTracking(collection.id);
    });
  }, [activeCollections]);

  // Fetch real collections from Supabase
  useEffect(() => {
    const fetchSupabaseCollections = async () => {
      setLoadingCollections(true);
      try {
        console.log('Fetching collections for:', airportCode, terminalNumber);
        
        // Try direct query first (bypasses RPC function issues)
        let terminalCollections = await getTerminalCollectionsDirect(
          airportCode,
          terminalNumber,
          10
        );
        
        // If direct query is not available, fall back to RPC
        if (!terminalCollections) {
          terminalCollections = await getTerminalCollections(
            airportCode,
            terminalNumber,
            10
          );
        }
        
        console.log('Raw Supabase response:', terminalCollections);
        
        // Check if we got data
        if (!terminalCollections || terminalCollections.length === 0) {
          console.log('No collections returned from Supabase, using mock data');
          setLoadingCollections(false);
          return;
        }
        
        // Map Supabase data to match component interface
        const mappedCollections = terminalCollections.map((col: any) => ({
          id: col.collection_slug || col.collection_id,
          title: col.collection_name,
          subtitle: `${col.spots_near_you || 0} spots near you • ${col.spots_total || 0} total`,
          emoji: col.collection_icon || '📍',
          color: col.collection_gradient || 'from-blue-500 to-purple-500',
          gradient: col.collection_gradient || 'from-blue-500 to-purple-500',
          vibeAlignment: null,
          items: col.spots_total || 0,
          priority: col.is_featured ? 'urgent' : 'normal',
          amenityMix: [`${col.spots_near_you || 0} in Terminal ${terminalNumber}`],
          isFromSupabase: true
        }));
        
        setSupabaseCollections(mappedCollections);
        console.log('Successfully loaded', mappedCollections.length, 'Supabase collections');
      } catch (error) {
        console.error('Error loading Supabase collections:', error);
        console.log('Falling back to mock data');
      } finally {
        setLoadingCollections(false);
      }
    };

    if (airportCode && terminalNumber) {
      fetchSupabaseCollections();
    }
  }, [airportCode, terminalNumber]);

  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white relative"
      {...pullToRefresh.handlers}
    >
      {/* Pull-to-refresh indicator */}
      {pullToRefresh.isPulling && (
        <div 
          className="absolute top-0 left-0 right-0 z-50 flex justify-center items-center transition-all"
          style={{ 
            height: `${pullToRefresh.pullDistance}px`,
            opacity: Math.min(pullToRefresh.pullDistance / 100, 1)
          }}
        >
          <div className={`${pullToRefresh.isRefreshing ? 'animate-spin' : ''}`}>
            <RefreshCw className="h-8 w-8 text-white" />
          </div>
        </div>
      )}
      
      {/* Main content with pull offset */}
      <div 
        style={{ 
          transform: pullToRefresh.isPulling ? `translateY(${pullToRefresh.pullDistance}px)` : 'translateY(0)',
          transition: pullToRefresh.isPulling ? 'none' : 'transform 0.3s ease-out'
        }}
      >
        {/* Header Section with Terminal Hero */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent" />
          
          <div className="relative px-6 pt-16 pb-8">
            {/* Navigation */}
            <div className="flex items-center justify-between mb-8">
              <button 
                onClick={handleBack}
                className="p-2 rounded-full bg-black/20 backdrop-blur-sm hover:bg-black/30 transition-all"
              >
                <ArrowLeft className="h-6 w-6" />
              </button>
              
              {/* GPS Status Indicator */}
              <div className="flex items-center gap-2">
                {detecting ? (
                  <div className="flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-xs">
                    <Signal className="h-3 w-3 animate-pulse" />
                    <span>Detecting location...</span>
                  </div>
                ) : isAtAirport ? (
                  <div className="flex items-center gap-2 px-3 py-1 bg-green-500/20 rounded-full text-xs text-green-300">
                    <MapPinIcon className="h-3 w-3" />
                    <span>At {detectedAirport}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-3 py-1 bg-blue-500/20 rounded-full text-xs text-blue-300">
                    <MapPinIcon className="h-3 w-3" />
                    <span>Browsing mode</span>
                  </div>
                )}
              </div>
              
              <div className="flex gap-2">
                <button className="p-2 rounded-full bg-black/20 backdrop-blur-sm hover:bg-black/30 transition-all">
                  <Share className="h-6 w-6" />
                </button>
                <button className="p-2 rounded-full bg-black/20 backdrop-blur-sm hover:bg-black/30 transition-all">
                  <MoreHorizontal className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Hero Section */}
            <div className="flex items-end gap-6 mb-8">
              <div className={`w-56 h-56 bg-gradient-to-br ${getTerminalGradient()} rounded-2xl shadow-2xl flex items-center justify-center relative overflow-hidden`}>
                <div className="absolute inset-0 bg-black/20" />
                <div className="text-center relative z-10">
                  <Sparkles className="h-16 w-16 mx-auto mb-4" />
                  <div className="font-bold text-xl mb-1">BEST OF</div>
                  <div className="text-2xl font-bold opacity-90">{terminalCode}</div>
                </div>
                
                <button className="absolute -bottom-4 -right-4 w-16 h-16 bg-green-500 rounded-full flex items-center justify-center hover:bg-green-400 hover:scale-105 transition-all shadow-xl">
                  <Play className="h-8 w-8 ml-1" fill="currentColor" />
                </button>
              </div>

              <div className="flex-1">
                <div className="text-sm uppercase tracking-wider opacity-70 mb-2 flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${getTerminalGradient()}`} />
                  Terminal Collection
                </div>
                <h1 className="text-4xl md:text-6xl font-bold mb-4">
                  {terminalData.fullName}
                </h1>
                <p className="text-xl opacity-90 mb-6">
                  Your curated guide to Terminal {terminalNumber}
                </p>
                
                <div className="flex items-center flex-wrap gap-4 text-sm opacity-80">
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4" />
                    <span>World's Best Airport 2024</span>
                  </div>
                  <span>•</span>
                  <span>{terminalData.stats.totalExperiences.toLocaleString()} experiences</span>
                  <span>•</span>
                  <span>{terminalData.stats.curatedSpots} curated spots</span>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <span className="text-yellow-400">★</span>
                    <span>{terminalData.stats.avgRating}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="px-6 mb-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-1 inline-flex">
            <button
              onClick={() => setViewMode('collections')}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                viewMode === 'collections' 
                  ? 'bg-white text-black' 
                  : 'text-white hover:bg-white/10'
              }`}
            >
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4" />
                Best Of Collections
              </div>
            </button>
            <button
              onClick={() => setViewMode('vibes')}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                viewMode === 'vibes' 
                  ? 'bg-white text-black' 
                  : 'text-white hover:bg-white/10'
              }`}
            >
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Browse by Vibe
              </div>
            </button>
          </div>
          
          {/* Context-aware description */}
          <p className="text-sm text-gray-400 mt-2">
            {viewMode === 'collections' 
              ? 'Curated collections for every situation'
              : 'Find spots that match your mood'}
          </p>
        </div>

        {/* Horizontal Carousel of Collections */}
        <div className="relative px-6 pb-12">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            {viewMode === 'collections' ? 'Smart Collections' : 'Vibe Categories'}
          </h2>
          
          {/* Carousel Container */}
          <div className="relative">
            {/* Desktop scroll buttons */}
            <button
              onClick={() => scrollCarousel('left')}
              className="hidden md:flex absolute -left-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-black/50 backdrop-blur-sm rounded-full items-center justify-center hover:bg-black/70 transition-all"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            
            <button
              onClick={() => scrollCarousel('right')}
              className="hidden md:flex absolute -right-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-black/50 backdrop-blur-sm rounded-full items-center justify-center hover:bg-black/70 transition-all"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
            
            {/* Carousel with touch gestures */}
            <div 
              ref={carouselRef}
              className="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory touch-pan-x"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
              {...swipeHandlers}
            >
              {loadingCollections ? (
                // Loading skeleton
                [...Array(3)].map((_, index) => (
                  <div key={`skeleton-${index}`} className="flex-none w-80 snap-start">
                    <div className="h-full bg-white/5 rounded-2xl p-6 animate-pulse">
                      <div className="flex justify-center mb-4">
                        <div className="w-20 h-20 bg-white/10 rounded-xl" />
                      </div>
                      <div className="h-6 bg-white/10 rounded mb-2" />
                      <div className="h-4 bg-white/10 rounded mb-4" />
                      <div className="flex justify-between">
                        <div className="h-8 w-20 bg-white/10 rounded" />
                        <div className="h-8 w-20 bg-white/10 rounded" />
                      </div>
                    </div>
                  </div>
                ))
              ) : activeCollections.map((collection, index) => {
                const isSaved = savedItems.includes(collection.id);
                
                return (
                  <div 
                    key={collection.id}
                    onClick={() => handleCollectionClick(collection, index)}
                    className="flex-none w-80 snap-start"
                  >
                    <div className="h-full bg-white/5 hover:bg-white/10 rounded-2xl p-6 transition-all cursor-pointer hover:scale-[1.02] backdrop-blur-sm group">
                      {/* Collection Header */}
                      <div className="mb-4">
                        {/* Icon/Emoji Container - Centered */}
                        <div className="flex justify-center mb-4">
                          <div className={`w-20 h-20 bg-gradient-to-r ${collection.gradient || collection.color} rounded-xl flex items-center justify-center text-3xl shadow-lg group-hover:shadow-xl transition-all relative`}>
                            {collection.icon || collection.emoji}
                            {collection.isFromSupabase && (
                              <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-semibold">
                                LIVE
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Title and subtitle - Centered */}
                        <h3 className="font-bold text-lg mb-1 group-hover:text-green-400 transition-colors text-center">
                          {collection.title}
                        </h3>
                        <p className="text-sm text-gray-400 mb-3 text-center">
                          {collection.subtitle}
                        </p>
                      </div>
                      
                      {/* Collection Stats */}
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                        <span>{collection.items} spots</span>
                        {collection.plays && (
                          <span>{collection.plays.toLocaleString()} plays</span>
                        )}
                      </div>
                      
                      {/* Amenity Preview Tags */}
                      {collection.amenityMix && (
                        <div className="flex flex-wrap gap-1 mb-4">
                          {collection.amenityMix.slice(0, 3).map((amenity, idx) => (
                            <span key={idx} className="text-xs bg-white/10 px-2 py-1 rounded-full">
                              {amenity}
                            </span>
                          ))}
                          {collection.amenityMix.length > 3 && (
                            <span className="text-xs bg-white/10 px-2 py-1 rounded-full">
                              +{collection.amenityMix.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                      
                      {/* Action Buttons */}
                      <div className="flex items-center justify-between">
                        <button 
                          onClick={(e) => handleSaveCollection(collection.id, index, e)}
                          className={`p-2 rounded-full transition-all ${
                            isSaved 
                              ? 'text-green-500 bg-green-500/20' 
                              : 'text-gray-400 hover:text-white hover:bg-white/10'
                          }`}
                        >
                          {isSaved ? <CheckCircle className="h-5 w-5" /> : <Heart className="h-5 w-5" />}
                        </button>
                        <button className="px-4 py-2 bg-green-500 text-black rounded-full flex items-center gap-2 opacity-0 group-hover:opacity-100 hover:scale-110 transition-all font-semibold text-sm">
                          Explore
                          <Play className="h-4 w-4" fill="currentColor" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Mobile swipe indicator */}
          <div className="md:hidden flex justify-center mt-4 gap-1">
            <div className="text-xs text-gray-400 flex items-center gap-2">
              <ChevronLeft className="h-3 w-3" />
              Swipe to browse
              <ChevronRight className="h-3 w-3" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TerminalBestOfPage;
