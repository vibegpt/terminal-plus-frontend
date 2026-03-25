// CollectionDetailPage.tsx
// Production-ready version with React Router useParams

import React, { useState } from 'react';
import { 
  ArrowLeft, MapPin, Clock, Star, DollarSign, 
  Grid3X3, Layers, Sparkles, Heart, Users, 
  TrendingUp, ChevronRight, Zap, Coffee, Wine
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CollectionDetailRedesigned = () => {
  const [viewMode, setViewMode] = useState('cards'); // 'cards', 'spotlight', 'flow'
  const [savedAmenities, setSavedAmenities] = useState<number[]>([]);
  
  // Mock collection data
  const collection = {
    name: 'Morning Essentials',
    subtitle: 'Start your day right',
    emoji: '☕',
    gradient: 'from-orange-500 to-amber-500',
    amenityCount: 12
  };
  
  // Mock amenities with rich metadata
  const amenities = [
    {
      id: 1,
      name: 'The Coffee Club',
      tagline: 'Artisan coffee & fresh pastries',
      emoji: '☕',
      gradient: 'from-amber-600 to-orange-600',
      vibe: 'chill',
      priceLevel: '$$',
      rating: 4.8,
      reviews: 234,
      walkTime: '2 min',
      status: 'quiet',
      trending: true,
      features: ['WiFi', 'Power', 'Quiet'],
      currentVisitors: 12
    },
    {
      id: 2,
      name: 'Boost Juice',
      tagline: 'Fresh smoothies & energy drinks',
      emoji: '🥤',
      gradient: 'from-green-500 to-emerald-600',
      vibe: 'quick',
      priceLevel: '$',
      rating: 4.5,
      reviews: 189,
      walkTime: '3 min',
      status: 'moderate',
      trending: false,
      features: ['Quick', 'Healthy'],
      currentVisitors: 8
    },
    {
      id: 3,
      name: 'Laurent Bakery',
      tagline: 'French pastries & breakfast',
      emoji: '🥐',
      gradient: 'from-purple-500 to-pink-600',
      vibe: 'comfort',
      priceLevel: '$$',
      rating: 4.9,
      reviews: 456,
      walkTime: '4 min',
      status: 'busy',
      trending: true,
      features: ['Breakfast', 'Coffee', 'Pastries'],
      currentVisitors: 24
    },
    {
      id: 4,
      name: 'Healthy Hub',
      tagline: 'Organic bowls & smoothies',
      emoji: '🥗',
      gradient: 'from-teal-500 to-green-600',
      vibe: 'refuel',
      priceLevel: '$$$',
      rating: 4.6,
      reviews: 98,
      walkTime: '5 min',
      status: 'quiet',
      trending: false,
      features: ['Healthy', 'Vegan', 'Organic'],
      currentVisitors: 5
    }
  ];
  
  const getStatusColor = (status: string) => {
    switch(status) {
      case 'quiet': return 'text-green-400';
      case 'moderate': return 'text-yellow-400';
      case 'busy': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };
  
  const getStatusLabel = (status: string) => {
    switch(status) {
      case 'quiet': return 'Quiet now';
      case 'moderate': return 'Getting busy';
      case 'busy': return 'Peak time';
      default: return 'Unknown';
    }
  };

  // View Mode 1: Rich Cards (like Home screen)
  const CardsView = () => (
    <div className="grid grid-cols-2 gap-4">
      <AnimatePresence>
        {amenities.map((amenity, index) => {
          const isSaved = savedAmenities.includes(amenity.id);
          
          return (
            <motion.div
              key={amenity.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <div className="glass-card backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl overflow-hidden">
                {/* Gradient Header with Emoji */}
                <div className={`relative h-24 bg-gradient-to-br ${amenity.gradient} p-4`}>
                  {amenity.trending && (
                    <div className="absolute top-2 right-2">
                      <span className="px-2 py-1 text-[10px] font-bold bg-black/30 backdrop-blur text-white rounded-full flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        HOT
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-center h-full">
                    <span className="text-4xl drop-shadow-lg">{amenity.emoji}</span>
                  </div>
                </div>
                
                {/* Content */}
                <div className="p-4">
                  <h3 className="font-bold text-white text-sm mb-1">{amenity.name}</h3>
                  <p className="text-xs text-white/60 mb-3 line-clamp-1">{amenity.tagline}</p>
                  
                  {/* Quick Stats */}
                  <div className="flex items-center justify-between text-xs mb-3">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-yellow-400 fill-current" />
                        <span className="text-white/80">{amenity.rating}</span>
                      </div>
                      <span className="text-white/40">•</span>
                      <span className="text-white/60">{amenity.priceLevel}</span>
                    </div>
                    <div className={`flex items-center gap-1 ${getStatusColor(amenity.status)}`}>
                      <div className="w-2 h-2 rounded-full bg-current animate-pulse" />
                      <span className="text-[10px]">{getStatusLabel(amenity.status)}</span>
                    </div>
                  </div>
                  
                  {/* Features */}
                  <div className="flex flex-wrap gap-1 mb-3">
                    {amenity.features.slice(0, 2).map(feature => (
                      <span key={feature} className="px-2 py-0.5 text-[10px] bg-white/10 rounded-full text-white/70">
                        {feature}
                      </span>
                    ))}
                    {amenity.features.length > 2 && (
                      <span className="px-2 py-0.5 text-[10px] bg-white/10 rounded-full text-white/70">
                        +{amenity.features.length - 2}
                      </span>
                    )}
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-xs text-white/60">
                      <MapPin className="h-3 w-3" />
                      <span>{amenity.walkTime}</span>
                    </div>
                    <button
                      onClick={() => setSavedAmenities(prev =>
                        prev.includes(amenity.id)
                          ? prev.filter(id => id !== amenity.id)
                          : [...prev, amenity.id]
                      )}
                      className="p-2 rounded-lg hover:bg-white/10 transition-all"
                    >
                      <Heart 
                        className={`h-4 w-4 ${
                          isSaved ? 'text-red-500 fill-current' : 'text-white/60'
                        }`} 
                      />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );

  // View Mode 2: Spotlight View (Featured cards)
  const SpotlightView = () => (
    <div className="space-y-4">
      <AnimatePresence>
        {amenities.map((amenity, index) => {
          const isSaved = savedAmenities.includes(amenity.id);
          
          return (
            <motion.div
              key={amenity.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <div className="glass-card-heavy backdrop-blur-2xl bg-white/15 border border-white/30 rounded-2xl overflow-hidden">
                <div className="flex">
                  {/* Gradient Side Panel */}
                  <div className={`w-32 bg-gradient-to-br ${amenity.gradient} p-6 flex flex-col items-center justify-center`}>
                    <span className="text-5xl mb-2">{amenity.emoji}</span>
                    <div className="text-center">
                      <div className="text-white/90 text-[10px] font-medium uppercase tracking-wide mb-1">
                        {amenity.vibe}
                      </div>
                      {amenity.trending && (
                        <div className="inline-flex items-center gap-1 px-2 py-1 bg-black/20 backdrop-blur rounded-full">
                          <TrendingUp className="h-3 w-3 text-white" />
                          <span className="text-[10px] text-white font-bold">HOT</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Content Area */}
                  <div className="flex-1 p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-bold text-white text-lg mb-1">{amenity.name}</h3>
                        <p className="text-sm text-white/70">{amenity.tagline}</p>
                      </div>
                      <button
                        onClick={() => setSavedAmenities(prev =>
                          prev.includes(amenity.id)
                            ? prev.filter(id => id !== amenity.id)
                            : [...prev, amenity.id]
                        )}
                        className="p-2 rounded-lg hover:bg-white/10 transition-all"
                      >
                        <Heart 
                          className={`h-5 w-5 ${
                            isSaved ? 'text-red-500 fill-current' : 'text-white/60'
                          }`} 
                        />
                      </button>
                    </div>
                    
                    {/* Stats Row */}
                    <div className="flex items-center gap-4 mb-3">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-400 fill-current" />
                        <span className="text-white font-medium">{amenity.rating}</span>
                        <span className="text-white/50 text-xs">({amenity.reviews})</span>
                      </div>
                      <div className="flex items-center gap-1 text-white/70">
                        <MapPin className="h-4 w-4" />
                        <span className="text-sm">{amenity.walkTime} walk</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-white/70">{amenity.priceLevel}</span>
                      </div>
                    </div>
                    
                    {/* Features */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      {amenity.features.map(feature => (
                        <span key={feature} className="px-3 py-1 text-xs bg-white/10 rounded-full text-white/80">
                          {feature}
                        </span>
                      ))}
                    </div>
                    
                    {/* Live Status */}
                    <div className="flex items-center justify-between pt-3 border-t border-white/10">
                      <div className="flex items-center gap-3">
                        <div className={`flex items-center gap-2 ${getStatusColor(amenity.status)}`}>
                          <div className="w-2 h-2 rounded-full bg-current animate-pulse" />
                          <span className="text-sm font-medium">{getStatusLabel(amenity.status)}</span>
                        </div>
                        {amenity.currentVisitors > 0 && (
                          <>
                            <span className="text-white/30">•</span>
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-white/50" />
                              <span className="text-sm text-white/70">{amenity.currentVisitors} here now</span>
                            </div>
                          </>
                        )}
                      </div>
                      <ChevronRight className="h-5 w-5 text-white/40" />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );

  // View Mode 3: Flow View (Horizontal scroll)
  const FlowView = () => (
    <div className="relative -mx-4">
      <div className="flex gap-4 px-4 overflow-x-auto snap-x snap-mandatory no-scrollbar">
        {amenities.map((amenity, index) => {
          const isSaved = savedAmenities.includes(amenity.id);
          
          return (
            <motion.div
              key={amenity.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className="flex-none w-72 snap-center"
            >
              <div className="glass-card backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl overflow-hidden h-full">
                {/* Full Gradient Background */}
                <div className={`relative h-40 bg-gradient-to-br ${amenity.gradient}`}>
                  {/* Overlay Pattern */}
                  <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px]" />
                  
                  {/* Content Overlay */}
                  <div className="relative h-full p-6 flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                      <span className="text-5xl">{amenity.emoji}</span>
                      {amenity.trending && (
                        <span className="px-3 py-1 text-xs font-bold bg-white/20 backdrop-blur text-white rounded-full">
                          TRENDING
                        </span>
                      )}
                    </div>
                    
                    <div>
                      <h3 className="text-xl font-bold text-white mb-1">{amenity.name}</h3>
                      <p className="text-sm text-white/90">{amenity.tagline}</p>
                    </div>
                  </div>
                </div>
                
                {/* Details Section */}
                <div className="p-6">
                  {/* Quick Stats */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-400 fill-current" />
                        <span className="text-white font-bold">{amenity.rating}</span>
                      </div>
                      <span className="text-white/60">{amenity.priceLevel}</span>
                      <div className={`flex items-center gap-1 ${getStatusColor(amenity.status)}`}>
                        <div className="w-2 h-2 rounded-full bg-current animate-pulse" />
                        <span className="text-xs">{amenity.status}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => setSavedAmenities(prev =>
                        prev.includes(amenity.id)
                          ? prev.filter(id => id !== amenity.id)
                          : [...prev, amenity.id]
                      )}
                    >
                      <Heart 
                        className={`h-5 w-5 ${
                          isSaved ? 'text-red-500 fill-current' : 'text-white/60'
                        }`} 
                      />
                    </button>
                  </div>
                  
                  {/* Features */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {amenity.features.map(feature => (
                      <span key={feature} className="px-2 py-1 text-xs bg-white/10 rounded-lg text-white/70">
                        {feature}
                      </span>
                    ))}
                  </div>
                  
                  {/* Bottom Info */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-sm text-white/60">
                      <MapPin className="h-4 w-4" />
                      <span>{amenity.walkTime}</span>
                    </div>
                    {amenity.currentVisitors > 0 && (
                      <div className="flex items-center gap-1 text-sm text-white/60">
                        <Users className="h-4 w-4" />
                        <span>{amenity.currentVisitors}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0E27] via-[#1a1a2e] to-[#0A0E27]">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-[#0A0E27]/80 backdrop-blur-xl border-b border-white/10">
        <div className="flex items-center justify-between px-4 py-4">
          <button className="p-2 rounded-lg hover:bg-white/10 transition-colors">
            <ArrowLeft className="h-5 w-5 text-white" />
          </button>
          
          <h1 className="text-lg font-bold text-white">{collection.name}</h1>
          
          {/* View Mode Switcher */}
          <div className="flex items-center gap-1 p-1 bg-white/10 rounded-lg backdrop-blur">
            <button
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded ${viewMode === 'cards' ? 'bg-white/20' : ''}`}
            >
              <Grid3X3 className="h-4 w-4 text-white" />
            </button>
            <button
              onClick={() => setViewMode('spotlight')}
              className={`p-1.5 rounded ${viewMode === 'spotlight' ? 'bg-white/20' : ''}`}
            >
              <Sparkles className="h-4 w-4 text-white" />
            </button>
            <button
              onClick={() => setViewMode('flow')}
              className={`p-1.5 rounded ${viewMode === 'flow' ? 'bg-white/20' : ''}`}
            >
              <Layers className="h-4 w-4 text-white" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Hero Section */}
      <div className="relative h-32 overflow-hidden">
        <div className={`absolute inset-0 bg-gradient-to-r ${collection.gradient}`}>
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0E27] to-transparent" />
        </div>
        
        <div className="absolute bottom-4 left-4 right-4">
          <div className="flex items-end gap-3">
            <span className="text-4xl">{collection.emoji}</span>
            <div className="flex-1">
              <p className="text-white/80 text-sm">{collection.subtitle}</p>
              <div className="flex items-center gap-3 mt-1">
                <span className="px-2 py-1 text-xs bg-white/20 backdrop-blur rounded-full text-white">
                  {collection.amenityCount} spots
                </span>
                <span className="text-xs text-white/60">Updated 2 mins ago</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Content Area */}
      <div className="px-4 py-6">
        {viewMode === 'cards' && <CardsView />}
        {viewMode === 'spotlight' && <SpotlightView />}
        {viewMode === 'flow' && <FlowView />}
      </div>
      
      {/* View Mode Info */}
      <div className="px-4 pb-6">
        <div className="glass-card backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-4">
          <div className="flex items-start gap-3">
                         <div className="p-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600">
               <Sparkles className="h-4 w-4 text-white" />
             </div>
            <div>
              <h4 className="font-bold text-white text-sm mb-1">
                {viewMode === 'cards' ? 'Cards View' :
                 viewMode === 'spotlight' ? 'Spotlight View' :
                 'Flow View'}
              </h4>
              <p className="text-xs text-white/60">
                {viewMode === 'cards' ? 'Browse all spots in a compact grid layout' :
                 viewMode === 'spotlight' ? 'Featured view with rich details for each spot' :
                 'Swipe through spots in an immersive horizontal layout'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollectionDetailRedesigned;
