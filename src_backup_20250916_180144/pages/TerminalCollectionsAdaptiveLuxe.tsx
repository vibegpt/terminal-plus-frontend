// src/pages/TerminalCollectionsAdaptiveLuxe.tsx
// Updated with 4+2 Adaptive Collection System
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// Removed context import - using hardcoded values temporarily
import { 
  ArrowLeft, MapPin, Sparkles, Coffee, ShoppingBag, 
  Utensils, Armchair, Zap, Search, Filter, 
  TrendingUp, Clock, Users, Heart, Briefcase, Plane, Baby, Sun, Moon, CloudRain
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  GlassCard, 
  GlassCardHeavy, 
  LiveBadge, 
  LiveDot,
  MiniMap,
  Chip,
  GradientText,
  Skeleton,
  PageTransition
} from '../components/AdaptiveLuxe';
import { supabase } from '@/lib/supabase';
import { 
  getAdaptiveCollections, 
  getCurrentTimeSlot,
  trackCollectionInteraction,
  TimeSlot,
  TravelerType,
  Collection,
  VibeSlug
} from '@/constants/adaptiveCollections';
import '../styles/adaptive-luxe.css';

// Get time-based theme
const getTimeTheme = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 20) return 'day';
  return 'night';
};

// Get contextual greeting
const getTimeGreeting = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'Good morning';
  if (hour >= 12 && hour < 17) return 'Good afternoon';
  if (hour >= 17 && hour < 22) return 'Good evening';
  return 'Good night';
};

// Vibe icons mapping
const vibeIcons: Record<string, React.ReactNode> = {
  explore: <Sparkles className="h-5 w-5" />,
  discover: <Sparkles className="h-5 w-5" />,
  refuel: <Utensils className="h-5 w-5" />,
  shop: <ShoppingBag className="h-5 w-5" />,
  chill: <Coffee className="h-5 w-5" />,
  comfort: <Armchair className="h-5 w-5" />,
  quick: <Zap className="h-5 w-5" />,
  work: <Briefcase className="h-5 w-5" />
};

// Vibe data
const VIBES = [
  {
    slug: 'discover',
    name: 'Discover',
    subtitle: 'Unique experiences',
    emoji: '🔍',
    gradient: 'from-purple-500 to-pink-500'
  },
  {
    slug: 'chill',
    name: 'Chill',
    subtitle: 'Easy-going vibes',
    emoji: '😌',
    gradient: 'from-blue-400 to-cyan-400'
  },
  {
    slug: 'comfort',
    name: 'Comfort',
    subtitle: 'Premium rest',
    emoji: '🛏️',
    gradient: 'from-indigo-500 to-purple-500'
  },
  {
    slug: 'shop',
    name: 'Shop',
    subtitle: 'Retail therapy',
    emoji: '🛍️',
    gradient: 'from-blue-500 to-cyan-500'
  },
  {
    slug: 'refuel',
    name: 'Refuel',
    subtitle: 'Food & drinks',
    emoji: '🍜',
    gradient: 'from-orange-500 to-red-500'
  },
  {
    slug: 'work',
    name: 'Work',
    subtitle: 'Stay productive',
    emoji: '💼',
    gradient: 'from-gray-600 to-gray-800'
  },
  {
    slug: 'quick',
    name: 'Quick',
    subtitle: 'Time-pressed',
    emoji: '⚡',
    gradient: 'from-yellow-400 to-amber-400'
  }
];

interface UserContext {
  timeSlot: TimeSlot;
  travelerType: TravelerType | undefined;
  flightTimeRemaining: number | undefined;
  previousVisits: string[];
  weather: 'sunny' | 'rainy' | 'cloudy';
}

const TerminalCollectionsAdaptiveLuxe: React.FC = () => {
  // Temporary hardcoded fix to bypass context issues
const terminal = 'SIN-T3';
const setTerminal = (t: string) => console.log('Terminal change:', t);
const airport = 'SIN';
const setAirport = (a: string) => console.log('Airport change:', a);
const terminalCode = terminal;
  const navigate = useNavigate();
  // Removed selectedVibe - now showing all vibes
  const [vibeCollections, setVibeCollections] = useState<any>({});
  const [collections, setCollections] = useState<Collection[]>([]); // Keep for backward compatibility
  const [loading, setLoading] = useState(false);
  const [savedCollections, setSavedCollections] = useState<string[]>([]);
  const [theme, setTheme] = useState(getTimeTheme());
  const [timeSlot, setTimeSlot] = useState(getCurrentTimeSlot());
  const [showTimeContext, setShowTimeContext] = useState(true);
  
  // User context for personalization
  const [userContext, setUserContext] = useState<UserContext>({
    timeSlot: getCurrentTimeSlot(),
    travelerType: undefined,
    flightTimeRemaining: undefined,
    previousVisits: [],
    weather: 'sunny'
  });

  // Update theme and time slot
  useEffect(() => {
    const updateTimeContext = () => {
      setTheme(getTimeTheme());
      setTimeSlot(getCurrentTimeSlot());
      setUserContext(prev => ({
        ...prev,
        timeSlot: getCurrentTimeSlot()
      }));
    };

    updateTimeContext();
    const interval = setInterval(updateTimeContext, 60000); // Check every minute
    
    document.body.setAttribute('data-theme', theme);
    document.body.style.background = theme === 'night' 
      ? 'linear-gradient(180deg, #0A0E27 0%, #1a1a2e 100%)'
      : theme === 'morning'
      ? 'linear-gradient(180deg, #FFE5E5 0%, #E5D4FF 100%)'
      : 'linear-gradient(180deg, #FFFFFF 0%, #F0F0F0 100%)';
    
    return () => clearInterval(interval);
  }, [theme]);

  // Load collections for ALL vibes
  useEffect(() => {
    const loadAllVibes = async () => {
      setLoading(true);
      
      // Load collections for ALL vibes
      const vibes = ['comfort', 'quick', 'chill', 'refuel', 'work', 'shop', 'discover'];
      const collectionsData: any = {};
      
      for (const vibe of vibes) {
        const collections = await getAdaptiveCollections(vibe as VibeSlug, {
          timeSlot: getCurrentTimeSlot(),
          travelerType: userContext.travelerType,
          previousVisits: userContext.previousVisits,
          flightTimeRemaining: userContext.flightTimeRemaining
        });
        collectionsData[vibe] = collections.slice(0, 4); // Show 4 collections per vibe
      }
      
      setVibeCollections(collectionsData);
      setLoading(false);
    };
    
    loadAllVibes();
  }, [terminal]);

  // Handle collection click
  const handleCollectionClick = (collection: Collection) => {
    // Track interaction (pass 1 as the value for click count)
    trackCollectionInteraction(collection.slug, 'click', 1);
    
    // Import collection verification to get the correct vibe
    import('../utils/collectionVerifier').then(({ getVibeForCollection }) => {
      // Find the actual vibe for this collection
      const actualVibe = getVibeForCollection(collection.slug);
      const vibeSlug = actualVibe || 'discover'; // Use actual vibe or fallback
      
      // Store collection metadata with correct vibe context
      const collectionData = {
        vibe: vibeSlug,
        slug: collection.slug,
        name: collection.name,
        icon: collection.emoji,
        gradient: collection.gradient,
        description: collection.subtitle,
        terminal: terminalCode || undefined // Include terminal context
      };
      
      console.log('Storing collection data:', collectionData);
      console.log('Navigating to:', `/collection/${vibeSlug}/${collection.slug}`);
      
      // Use StorageManager to set collection context
      import('../utils/storageManager').then(({ setCollection }) => {
        setCollection(collectionData);
        
        // Navigate with vibe-first route: /collection/:vibe/:collectionSlug
        navigate(`/collection/${vibeSlug}/${collection.slug}`);
      });
    });
  };

  // Handle traveler type selection (for better personalization)
  const handleTravelerType = (type: TravelerType) => {
    setUserContext(prev => ({
      ...prev,
      travelerType: type
    }));
  };

  // Time context badges
  const getTimeContextBadges = () => {
    const badges = [];
    
    // Time of day
    badges.push({
      icon: timeSlot === 'early-morning' || timeSlot === 'morning' ? <Sun className="h-3 w-3" /> :
            timeSlot === 'late-night' ? <Moon className="h-3 w-3" /> :
            <Sun className="h-3 w-3" />,
      label: timeSlot.replace('-', ' '),
      color: 'text-yellow-400'
    });
    
    // Traveler type if selected
    if (userContext.travelerType) {
      badges.push({
        icon: userContext.travelerType === 'business' ? <Briefcase className="h-3 w-3" /> :
              userContext.travelerType === 'family' ? <Baby className="h-3 w-3" /> :
              <Plane className="h-3 w-3" />,
        label: userContext.travelerType,
        color: 'text-blue-400'
      });
    }
    
    return badges;
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-dark">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-[#0A0E27]/80 backdrop-blur-xl border-b border-white/10">
          <div className="flex items-center justify-between px-4 py-4">
            <button 
              onClick={() => navigate(-1)}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-white" />
            </button>
            
            <div className="text-center">
              <h1 className="text-lg font-bold text-white">
                {terminalCode || 'Terminal'}
              </h1>
              <p className="text-xs text-white/60">
                {getTimeGreeting()}, traveler
              </p>
            </div>
            
            <button
              onClick={() => navigate('/search')}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <Search className="h-5 w-5 text-white" />
            </button>
          </div>
        </div>

        {/* Context Bar - Shows current personalization */}
        {showTimeContext && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border-b border-white/10"
          >
            <div className="px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xs text-white/60">Showing for:</span>
                {getTimeContextBadges().map((badge, index) => (
                  <span 
                    key={index}
                    className={`flex items-center gap-1 text-xs ${badge.color}`}
                  >
                    {badge.icon}
                    {badge.label}
                  </span>
                ))}
              </div>
              <button
                onClick={() => setShowTimeContext(false)}
                className="text-xs text-white/40 hover:text-white/60"
              >
                Hide
              </button>
            </div>
          </motion.div>
        )}

        {/* Quick Traveler Type Selection */}
        {!userContext.travelerType && (
          <div className="px-4 py-4 border-b border-white/10">
            <p className="text-sm text-white/60 mb-3">I'm traveling for:</p>
            <div className="flex gap-2">
              {(['business', 'leisure', 'family', 'transit'] as TravelerType[]).map(type => (
                <button
                  key={type}
                  onClick={() => handleTravelerType(type)}
                  className="px-4 py-2 rounded-full glass-card text-white/80 text-sm hover:bg-white/20 transition-all capitalize"
                >
                  {type === 'business' && '💼'} 
                  {type === 'leisure' && '✈️'} 
                  {type === 'family' && '👨‍👩‍👧‍👦'} 
                  {type === 'transit' && '🔄'} 
                  {type}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Vibe Selection - Removed since we're showing all vibes now */}

        {/* Vertical Vibe Sections */}
        <div className="space-y-8 pb-20">

          {loading ? (
            <div className="space-y-6">
              {[1, 2, 3, 4, 5, 6, 7].map(i => (
                <div key={i} className="space-y-3">
                  <Skeleton className="h-6 w-24" />
                  <div className="flex gap-3 overflow-x-auto">
                    {[1, 2, 3, 4].map(j => (
                      <Skeleton key={j} className="h-32 w-40 flex-shrink-0" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            Object.entries(vibeCollections).map(([vibe, collections]) => (
              <section key={vibe} className="py-6">
                {/* Vibe Header */}
                <div className="px-4 pb-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{VIBES.find(v => v.slug === vibe)?.emoji}</span>
                    <div>
                      <h2 className="text-2xl font-bold text-white">{VIBES.find(v => v.slug === vibe)?.name}</h2>
                      <p className="text-sm text-white/60">{VIBES.find(v => v.slug === vibe)?.subtitle}</p>
                    </div>
                  </div>
                  <button className="text-blue-400 text-sm font-medium hover:text-blue-300 transition-colors">
                    See all →
                  </button>
                </div>
                
                {/* Horizontal scrolling collections */}
                <div className="overflow-x-auto">
                  <div className="flex gap-4 px-4" style={{ width: 'max-content' }}>
                    {(collections as any[]).map((collection) => (
                      <GlassCard
                        key={collection.slug}
                        onClick={() => handleCollectionClick(collection)}
                        className="w-44 h-36"
                      >
                        <div className="p-4 text-center">
                          <span className="text-2xl">{collection.emoji}</span>
                          <h3 className="font-semibold mt-2 text-white">{collection.name}</h3>
                          <p className="text-xs text-white/60">{collection.amenities?.length || 0} spots</p>
                        </div>
                      </GlassCard>
                    ))}
                  </div>
                </div>
              </section>
            ))
          )}
        </div>

        {/* Context Info Card */}
        <div className="px-4 pb-6">
          <GlassCardHeavy className="p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-white mb-1">Smart Collections</h4>
                <p className="text-xs text-white/60">
                  Collections adapt based on time of day. You're seeing {timeSlot === 'morning' ? 'breakfast and coffee options' : 
                  timeSlot === 'evening' ? 'dinner and bar selections' : 
                  timeSlot === 'late-night' ? '24/7 and rest options' : 
                  'popular daytime choices'} right now.
                </p>
              </div>
            </div>
          </GlassCardHeavy>
        </div>

        {/* Floating Search Button */}
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileTap={{ scale: 0.9 }}
          className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-primary rounded-full shadow-2xl flex items-center justify-center z-20"
          onClick={() => navigate('/search')}
        >
          <Search className="h-6 w-6 text-white" />
        </motion.button>
      </div>
    </PageTransition>
  );
};

export default TerminalCollectionsAdaptiveLuxe;