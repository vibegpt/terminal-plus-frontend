/**
 * Main feed component showing all vibes vertically with horizontal scrolling collections
 * Layout:
 * - Vibes are listed vertically in intelligent order
 * - Each vibe shows 6 collections horizontally (4 core + 2 dynamic)
 * - Collections scroll horizontally with smooth overflow
 * - No expand/collapse - everything visible for quick scanning
 * - Data fetched from Supabase in real-time
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronRight, 
  MapPin, 
  Clock, 
  Sparkles,
  Navigation,
  AlertCircle,
  Settings,
  RefreshCw
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useSimpleJourneyContext } from '../hooks/useSimpleJourneyContext';
// import { useAllVibesWithCollections } from '../hooks/useSupabaseCollections';
import { SoftContextPrompt } from '../components/SoftContextPrompt';
import { LocationDetectionService } from '../services/LocationDetectionService';

// Enhanced vibe configuration with all collections
const VIBE_CONFIG = {
  comfort: {
    icon: '🛏️',
    name: 'Comfort',
    description: 'Rest & recovery',
    collections: [
      'lounge-life',
      'sleep-pods', 
      'post-red-eye-recovery',
      'spa-wellness',
      'shower-and-refresh',
      'quiet-zones'
    ],
    gradient: 'from-purple-500 to-indigo-500'
  },
  chill: {
    icon: '😌',
    name: 'Chill',
    description: 'Peaceful spaces',
    collections: [
      'hidden-quiet-spots',
      'gardens-at-dawn',
      'peaceful-corners',
      'meditation-spaces'
    ],
    gradient: 'from-blue-400 to-cyan-400'
  },
  refuel: {
    icon: '🍜',
    name: 'Refuel',
    description: 'Food & drinks',
    collections: [
      'hawker-heaven',
      'local-food-real-prices',
      'coffee-worth-walk',
      'quick-bites',
      'healthy-choices',
      'breakfast-champions',
      'dinner-delights'
    ],
    gradient: 'from-orange-400 to-red-400'
  },
  work: {
    icon: '💼',
    name: 'Work',
    description: 'Productivity zones',
    collections: [
      'work-spots-real-wifi',
      'meeting-ready-spaces',
      'stay-connected',
      'business-centers',
      'charging-stations'
    ],
    gradient: 'from-gray-500 to-gray-700'
  },
  shop: {
    icon: '🛍️',
    name: 'Shop',
    description: 'Retail therapy',
    collections: [
      'duty-free-deals',
      'singapore-exclusives',
      'last-minute-gifts',
      'luxury-brands',
      'local-treasures',
      'support-local-champions'
    ],
    gradient: 'from-pink-400 to-purple-400'
  },
  quick: {
    icon: '⚡',
    name: 'Quick',
    description: 'Time-pressed',
    collections: [
      '24-7-heroes',
      'gate-essentials',
      '2-minute-stops',
      'grab-and-go',
      'last-minute-essentials',
      'express-services'
    ],
    gradient: 'from-yellow-400 to-amber-400'
  },
  explore: {
    icon: '🔍',
    name: 'Explore',
    description: 'Unique experiences',
    collections: [
      'jewel-discovery',
      'hidden-gems',
      'only-at-changi',
      'instagram-worthy',
      'nature-escapes',
      'entertainment-hub'
    ],
    gradient: 'from-green-400 to-teal-400'
  }
} as const;

type VibeKey = keyof typeof VIBE_CONFIG;

interface Collection {
  id: string;
  collection_id: string;
  name: string;
  description: string;
  icon: string;
  gradient: string;
  amenity_count: number;
  is_dynamic?: boolean;
  walking_time?: number;
  terminal_specific?: boolean;
}

const VibesFeedMVPUpdated: React.FC = () => {
  const navigate = useNavigate();
  // TODO: Fix context integration - temporarily using mock data due to TypeScript resolution conflict
  // The component should use: const { location, phase, userState, timeContext, vibeOrder, featuredCollections, refreshLocation } = useJourneyContext();
  
  // Mock context data for now
  const [location, setLocation] = useState({
    isAtAirport: true,
    airport: 'SIN',
    terminal: 'T3',
    cluster: 'Central',
    method: 'DEFAULT' as const,
    confidence: 85
  });
  
  const [phase, setPhase] = useState<'departure' | 'transit' | 'arrival' | 'exploring' | 'unknown'>('departure');
  const [userState, setUserState] = useState({
    energy: 'active' as const,
    timeAvailable: 'moderate' as const,
    hasAsked: true
  });
  
  const [timeContext, setTimeContext] = useState({
    greeting: 'Good afternoon from Terminal 3',
    timeSlot: 'afternoon' as const
  });
  
  const [vibeOrder] = useState(['comfort', 'refuel', 'quick', 'shop', 'chill', 'work', 'explore']);
  const [featuredCollections] = useState(['hawker-heaven', 'lounge-life', 'jewel-discovery']);
  
  const refreshLocation = async () => {
    // Mock refresh - just update confidence
    setLocation(prev => ({ ...prev, confidence: Math.min(100, prev.confidence + 10) }));
  };
  
  // Mock data since useAllVibesWithCollections was removed
  const vibesData: Record<string, any[]> = {
    comfort: [],
    chill: [],
    refuel: [],
    work: [],
    shop: [],
    quick: [],
    explore: []
  };
  const loading = false;
  const error = null;
  const refetch = () => {};
  const [showLocationInfo, setShowLocationInfo] = useState(true);
  
  // Handle collection click
  const handleCollectionClick = (vibe: string, collection: Collection) => {
    // Store collection data for detail page
    sessionStorage.setItem('selectedCollection', JSON.stringify({
      vibe,
      ...collection
    }));
    
    // Navigate to collection detail with vibe context
    navigate(`/collection/${vibe}/${collection.collection_id}`);
  };
  
  // Get location display info
  const getLocationDisplay = () => {
    if (!location.isAtAirport) {
      return {
        text: 'Planning Mode',
        subtext: 'Showing all options',
        icon: <MapPin className="w-4 h-4" />,
        color: 'bg-gray-100 dark:bg-gray-800'
      };
    }
    
    if (location.terminal) {
      return {
        text: `Terminal ${location.terminal.replace('T', '')}`,
        subtext: 'Showing nearby options',
        icon: <Navigation className="w-4 h-4" />,
        color: 'bg-green-100 dark:bg-green-900/30'
      };
    }
    
    return {
      text: 'Changi Airport',
      subtext: location.cluster || 'Central area',
      icon: <MapPin className="w-4 h-4" />,
      color: 'bg-blue-100 dark:bg-blue-900/30'
    };
  };
  
  // Get energy indicator
  const getEnergyIndicator = () => {
    const indicators: Record<string, { emoji: string; text: string }> = {
      exhausted: { emoji: '😴', text: 'Low energy' },
      tired: { emoji: '😮‍💨', text: 'Tired' },
      active: { emoji: '😊', text: 'Active' },
      fresh: { emoji: '✨', text: 'Energized' },
      jetlagged: { emoji: '🥱', text: 'Jet lagged' }
    };
    return indicators[userState.energy] || indicators.active;
  };
  
  return (
    <>
      {/* Add CSS for hiding scrollbars */}
      <style>{`
        .scrollbar-hide {
          -ms-overflow-style: none;  /* IE and Edge */
          scrollbar-width: none;  /* Firefox */
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;  /* Chrome, Safari and Opera */
        }
      `}</style>
      
      {/* Soft Context Prompt */}
      <SoftContextPrompt />
      
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800">
          <div className="px-4 py-4">
            {/* Time Greeting */}
            <div className="flex items-center justify-between mb-3">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {timeContext.greeting}
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {phase === 'unknown' 
                    ? 'Discover what Changi has to offer'
                    : phase === 'arrival' 
                    ? 'Welcome to Singapore' 
                    : phase === 'departure'
                    ? 'Before your flight'
                    : phase === 'transit'
                    ? 'Making the most of your layover'
                    : 'Explore the airport'}
                </p>
              </div>
              <button
                onClick={() => navigate('/settings')}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
              >
                <Settings className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
            
            {/* Context Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {/* Location Pill */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm whitespace-nowrap ${getLocationDisplay().color}`}
              >
                {getLocationDisplay().icon}
                <div>
                  <div className="font-medium">{getLocationDisplay().text}</div>
                  {location.confidence < 60 && (
                    <div className="text-xs opacity-75">{getLocationDisplay().subtext}</div>
                  )}
                </div>
                {location.method === 'DEFAULT' && (
                  <button
                    onClick={refreshLocation}
                    className="ml-1 hover:rotate-180 transition-transform"
                  >
                    <RefreshCw className="w-3 h-3" />
                  </button>
                )}
              </motion.div>
              
              {/* Energy Pill */}
              {userState.hasAsked && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className="flex items-center gap-2 px-3 py-1.5 bg-purple-100 dark:bg-purple-900/30 rounded-full text-sm"
                >
                  <span>{getEnergyIndicator().emoji}</span>
                  <span className="font-medium">{getEnergyIndicator().text}</span>
                </motion.div>
              )}
              
              {/* Time Available Pill */}
              {userState.timeAvailable && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="flex items-center gap-2 px-3 py-1.5 bg-yellow-100 dark:bg-yellow-900/30 rounded-full text-sm"
                >
                  <Clock className="w-3 h-3" />
                  <span className="font-medium capitalize">{userState.timeAvailable} time</span>
                </motion.div>
              )}
            </div>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="px-4 py-6 space-y-4">
          {loading ? (
            // Loading skeletons
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse">
                  <div className="h-12 bg-gray-200 dark:bg-gray-800 rounded-xl mb-3" />
                  <div className="grid grid-cols-2 gap-3">
                    <div className="h-32 bg-gray-200 dark:bg-gray-800 rounded-xl" />
                    <div className="h-32 bg-gray-200 dark:bg-gray-800 rounded-xl" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            // Error state
            <div className="flex flex-col items-center justify-center py-20">
              <div className="text-6xl mb-4">⚠️</div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Connection Issue
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 text-center px-8">
                {error || 'Unable to load collections. Please check your connection.'}
              </p>
              <button
                onClick={refetch}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-medium"
              >
                Try Again
              </button>
            </div>
          ) : (
            // Vibe Sections - All visible with horizontal scrolling collections
            <div className="space-y-6">
              {vibeOrder.map((vibeKey, sectionIndex) => {
                const vibeConfig = VIBE_CONFIG[vibeKey as VibeKey];
                const collections = vibesData[vibeKey] || [];
                const isFirst = sectionIndex === 0;
                
                // Skip if no collections for this vibe
                if (!vibeConfig || collections.length === 0) return null;
                
                return (
                  <motion.div
                    key={vibeKey}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: sectionIndex * 0.08 }}
                    className="relative"
                  >
                    {/* Vibe Header - Simpler, always visible */}
                    <div className="flex items-center justify-between mb-3 px-1">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{vibeConfig.icon}</span>
                        <div>
                          <h2 className="font-bold text-lg text-gray-900 dark:text-white">
                            {vibeConfig.name}
                            {isFirst && (
                              <span className="ml-2 text-xs px-2 py-0.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full">
                                For you
                              </span>
                            )}
                          </h2>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {vibeConfig.description} • {collections.length} collections
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => navigate(`/vibe/${vibeKey}`)}
                        className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                      >
                        All {collections.length}
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                    
                    {/* Collections - Horizontal Scroll (2x3 grid visible at once) */}
                    <div className="relative">
                      {/* Left fade for scroll indication */}
                      <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-slate-50 dark:from-slate-950 to-transparent z-10 pointer-events-none" />
                      
                      {/* Right fade for scroll indication */}
                      <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-slate-50 dark:from-slate-950 to-transparent z-10 pointer-events-none" />
                      
                      {/* Scrollable container */}
                      <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
                        <div className="flex gap-3" style={{ width: 'max-content' }}>
                          {collections.map((collection, index) => (
                            <motion.button
                              key={collection.id}
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: index * 0.05 }}
                              onClick={() => handleCollectionClick(vibeKey, collection)}
                              className="relative bg-white dark:bg-slate-800 rounded-xl hover:shadow-lg transition-all text-left group"
                              style={{ width: '160px', minWidth: '160px' }}
                            >
                              {/* Card Content */}
                              <div className="p-4">
                                {/* Featured Badge */}
                                {collection.is_dynamic && (
                                  <div className="absolute -top-2 -right-2 z-20">
                                    <span className="flex items-center gap-0.5 px-1.5 py-0.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[10px] font-bold rounded-full">
                                      <Sparkles className="w-2.5 h-2.5" />
                                      NOW
                                    </span>
                                  </div>
                                )}
                                
                                {/* Collection Icon/Gradient */}
                                <div className={`h-20 rounded-lg bg-gradient-to-br ${collection.gradient || vibeConfig.gradient} mb-3 flex items-center justify-center`}>
                                  <span className="text-3xl opacity-80">
                                    {collection.icon || vibeConfig.icon}
                                  </span>
                                </div>
                                
                                {/* Collection Info */}
                                <h3 className="font-bold text-sm text-gray-900 dark:text-white mb-1 line-clamp-2">
                                  {collection.name}
                                </h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                                  {collection.description || `${collection.amenity_count} amazing spots`}
                                </p>
                                
                                {/* Stats */}
                                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                                  <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                                    {collection.amenity_count} spots
                                  </span>
                                  {location.terminal && (
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                      {/* TODO: Calculate walking time when real context is integrated */}
                                      ~5m
                                    </span>
                                  )}
                                </div>
                              </div>
                            </motion.button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
          
          {/* Help Card */}
          {!loading && !userState.hasAsked && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-200 dark:border-blue-800"
            >
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5" />
                <div>
                  <h3 className="font-medium text-blue-900 dark:text-blue-100">
                    Personalize your experience
                  </h3>
                  <p className="text-sm text-blue-700 dark:text-blue-200 mt-1">
                    Tell us about your journey for better recommendations
                  </p>
                  <button
                    onClick={() => window.location.reload()} // Trigger prompt
                    className="mt-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Get started →
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </>
  );
};

export default VibesFeedMVPUpdated;
