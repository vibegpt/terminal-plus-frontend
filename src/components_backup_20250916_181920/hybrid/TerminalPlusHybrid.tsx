// src/components/hybrid/TerminalPlusHybrid.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, MapPin, Users, TrendingUp, AlertCircle, 
  Zap, Coffee, Utensils, Wifi, ChevronRight, 
  Play, Heart, MoreHorizontal, Timer, Activity,
  Navigation, UserCheck, Sparkles, Grid3x3, Layers
} from 'lucide-react';
import { useLocation } from '../../contexts/LocationContext';
import { useVoiceEmotion } from '../../hooks/useVoiceEmotion';
import analytics from '../../lib/analytics';
import { ViewToggle } from '../shared/ViewToggle';
import { UrgencyIndicator } from './UrgencyIndicator';
import { ContextHeader } from './ContextHeader';

interface Collection {
  id: number;
  title: string;
  emoji: string;
  subtitle: string;
  gradient: string;
  avgTime: number;
  spots: number;
  currentlyBusy: number;
  priority: number;
  amenities?: any[];
}

export const TerminalPlusHybrid: React.FC = () => {
  const location = useLocation();
  const { emotionResult, isListening } = useVoiceEmotion();
  const [activeView, setActiveView] = useState<'collections' | 'list' | 'map'>('collections');
  const [selectedVibe, setSelectedVibe] = useState<string | null>(null);

  // Build user context from real data
  const userContext = useMemo(() => ({
    atAirport: location.currentAirport !== null,
    timeToBoarding: location.timeToBoarding || 45,
    currentTerminal: location.currentTerminal || 'Unknown',
    currentGate: location.currentGate || 'Unknown',
    walkingPace: location.walkingPace,
    flightStatus: location.flightStatus || 'on-time',
    emotionalState: emotionResult?.emotion || 'neutral',
    emotionConfidence: emotionResult?.confidence || 0,
    timeConstraints: location.timeConstraints,
    crowdLevel: location.crowdLevel
  }), [location, emotionResult]);

  // Update analytics context when user context changes
  useEffect(() => {
    analytics.updateContext({
      emotionalState: userContext.emotionalState,
      emotionConfidence: userContext.emotionConfidence,
      timeConstraints: userContext.timeConstraints,
      airportCode: location.currentAirport || undefined,
      terminalCode: location.currentTerminal || undefined,
      gateCode: location.currentGate || undefined,
      crowdLevel: userContext.crowdLevel,
      viewType: 'hybrid'
    });
  }, [userContext, location]);

  // Collections with dynamic prioritization
  const collections: Collection[] = useMemo(() => {
    const baseCollections = [
      {
        id: 1,
        title: "Quick Dash Essentials",
        emoji: "⚡",
        subtitle: "Under 5 min from your gate",
        gradient: "from-yellow-400 to-orange-500",
        avgTime: 3,
        spots: 8,
        currentlyBusy: location.crowdLevel === 'high' ? 6 : 2,
        priority: 1
      },
      {
        id: 2,
        title: "Recharge & Refuel",
        emoji: "🔋",
        subtitle: "Power up body & devices",
        gradient: "from-green-400 to-emerald-500",
        avgTime: 15,
        spots: 12,
        currentlyBusy: location.crowdLevel === 'high' ? 8 : 5,
        priority: 2
      },
      {
        id: 3,
        title: "Hidden Quiet Zones",
        emoji: "🤫",
        subtitle: "Escape the crowds",
        gradient: "from-purple-400 to-indigo-500",
        avgTime: 8,
        spots: 6,
        currentlyBusy: 1,
        priority: 3
      },
      {
        id: 4,
        title: "Local Flavors",
        emoji: "🍜",
        subtitle: "Authentic cuisine",
        gradient: "from-red-400 to-pink-500",
        avgTime: 25,
        spots: 15,
        currentlyBusy: location.crowdLevel === 'high' ? 12 : 7,
        priority: 4
      }
    ];

    // Dynamic prioritization based on context
    return baseCollections.sort((a, b) => {
      // Urgent: prioritize quick options
      if (userContext.timeConstraints === 'urgent') {
        return a.avgTime - b.avgTime;
      }
      
      // Stressed: prioritize quiet zones
      if (userContext.emotionalState === 'stressed' && a.id === 3) {
        return -1;
      }
      
      // Tired: prioritize recharge options
      if (userContext.emotionalState === 'tired' && a.id === 2) {
        return -1;
      }
      
      // High crowd: prioritize less busy options
      if (userContext.crowdLevel === 'high') {
        return a.currentlyBusy - b.currentlyBusy;
      }
      
      return a.priority - b.priority;
    });
  }, [userContext, location.crowdLevel]);

  // Track collection interactions
  const handleCollectionClick = (collection: Collection) => {
    analytics.trackEvent('collection_clicked', {
      vibeSelected: collection.title,
      emotionalState: userContext.emotionalState,
      timeConstraints: userContext.timeConstraints,
      recommendationsVisible: collections.length
    });

    // Track emotional context differentiator
    analytics.trackEmotionalContext(
      userContext.emotionalState,
      userContext.emotionConfidence,
      collection
    );

    setSelectedVibe(collection.title);
  };

  // Track view changes
  const handleViewChange = (view: 'collections' | 'list' | 'map') => {
    setActiveView(view);
    analytics.trackEvent('view_changed', {
      viewType: 'hybrid',
      subView: view
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Context Header with Real Data */}
      <ContextHeader 
        terminal={userContext.currentTerminal}
        gate={userContext.currentGate}
        timeToBoarding={userContext.timeToBoarding}
        flightStatus={userContext.flightStatus}
        emotionalState={userContext.emotionalState}
        isListening={isListening}
      />

      {/* Urgency Indicator */}
      {userContext.timeConstraints === 'urgent' && (
        <UrgencyIndicator 
          timeToBoarding={userContext.timeToBoarding}
          gate={userContext.currentGate}
          onQuickAction={() => {
            analytics.trackTimeUrgency(
              'quick_action_clicked',
              userContext.timeToBoarding,
              'immediate_action'
            );
          }}
        />
      )}

      {/* View Selector */}
      <div className="px-4 py-3">
        <div className="flex gap-2 bg-white rounded-full p-1 shadow-sm">
          {(['collections', 'list', 'map'] as const).map((view) => (
            <button
              key={view}
              onClick={() => handleViewChange(view)}
              className={`flex-1 py-2 px-4 rounded-full text-sm font-medium transition-all ${
                activeView === view
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {view === 'collections' && <Grid3x3 className="inline w-4 h-4 mr-1" />}
              {view.charAt(0).toUpperCase() + view.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeView}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="px-4 pb-20"
        >
          {activeView === 'collections' && (
            <div className="space-y-3">
              {collections.map((collection, index) => (
                <CollectionCard
                  key={collection.id}
                  collection={collection}
                  delay={index * 0.05}
                  userContext={userContext}
                  onClick={() => handleCollectionClick(collection)}
                />
              ))}
            </div>
          )}

          {activeView === 'list' && (
            <ListView 
              amenities={location.nearbyAmenities}
              userContext={userContext}
            />
          )}

          {activeView === 'map' && (
            <MapView 
              userLocation={location.coordinates}
              amenities={location.nearbyAmenities}
              terminal={location.currentTerminal}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* View Toggle (for switching between Hybrid/Spotify/Netflix) */}
      <ViewToggle />

      {/* Social Proof Bar */}
      <SocialProofBar 
        activeUsers={Math.floor(Math.random() * 50) + 100}
        trending={collections[0]?.title}
        onInteraction={(type) => {
          analytics.trackSocialProof(type, 'live_users', 150);
        }}
      />
    </div>
  );
};

// Collection Card Component
const CollectionCard: React.FC<{
  collection: Collection;
  delay: number;
  userContext: any;
  onClick: () => void;
}> = ({ collection, delay, userContext, onClick }) => {
  const location = useLocation();
  const walkingTime = location.calculateWalkingTime(collection.avgTime * 60);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.3 }}
      onClick={onClick}
      className="relative bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden"
    >
      {/* Gradient Background */}
      <div className={`absolute inset-0 bg-gradient-to-r ${collection.gradient} opacity-5`} />
      
      <div className="relative z-10">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{collection.emoji}</span>
              <h3 className="font-semibold text-gray-900">{collection.title}</h3>
            </div>
            <p className="text-sm text-gray-600 mt-1">{collection.subtitle}</p>
            
            {/* Stats Row */}
            <div className="flex items-center gap-4 mt-3 text-xs">
              <div className="flex items-center gap-1 text-gray-500">
                <Clock className="w-3 h-3" />
                <span>{walkingTime} min walk</span>
              </div>
              <div className="flex items-center gap-1 text-gray-500">
                <MapPin className="w-3 h-3" />
                <span>{collection.spots} spots</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                <span className={`${
                  collection.currentlyBusy > collection.spots * 0.7 
                    ? 'text-red-500' 
                    : 'text-green-500'
                }`}>
                  {collection.currentlyBusy}/{collection.spots} busy
                </span>
              </div>
            </div>

            {/* Urgency Badge */}
            {userContext.timeConstraints === 'urgent' && walkingTime < 5 && (
              <div className="inline-flex items-center gap-1 mt-2 px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                <Zap className="w-3 h-3" />
                Quick option
              </div>
            )}
          </div>
          
          <ChevronRight className="w-5 h-5 text-gray-400 mt-1" />
        </div>
      </div>
    </motion.div>
  );
};

// Social Proof Bar Component
const SocialProofBar: React.FC<{
  activeUsers: number;
  trending: string;
  onInteraction: (type: string) => void;
}> = ({ activeUsers, trending, onInteraction }) => {
  return (
    <motion.div 
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 z-40"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm font-medium text-gray-900">{activeUsers}</span>
            <span className="text-sm text-gray-600">travelers online</span>
          </div>
        </div>
        
        <div className="flex items-center gap-1 text-sm">
          <TrendingUp className="w-3 h-3 text-orange-500" />
          <span className="text-gray-600">Trending:</span>
          <span 
            className="font-medium text-gray-900 cursor-pointer hover:text-purple-600"
            onClick={() => onInteraction('trending_clicked')}
          >
            {trending}
          </span>
        </div>
      </div>
    </motion.div>
  );
};

// Placeholder components for List and Map views
const ListView: React.FC<{ amenities: any[]; userContext: any }> = ({ amenities, userContext }) => (
  <div className="space-y-2">
    {amenities.map((amenity, i) => (
      <div key={i} className="p-3 bg-white rounded-lg shadow-sm">
        <div className="font-medium">{amenity.name}</div>
        <div className="text-sm text-gray-600">{amenity.walkingTime} min walk</div>
      </div>
    ))}
  </div>
);

const MapView: React.FC<{ userLocation: any; amenities: any[]; terminal: any }> = ({ userLocation, amenities, terminal }) => (
  <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
    <span className="text-gray-500">Map View - Terminal {terminal}</span>
  </div>
);
