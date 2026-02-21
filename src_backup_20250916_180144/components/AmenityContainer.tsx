// src/components/AmenityContainer.tsx - Amenity display container for collections
import React from 'react';
import { motion } from 'framer-motion';
import { Heart, MapPin, Clock, Users, TrendingUp, Star, DollarSign } from 'lucide-react';
import { GlassCard } from './AdaptiveLuxe';
import { EnrichedAmenity } from '../types/database.types';

interface AmenityContainerProps {
  amenities: EnrichedAmenity[];
  viewMode: 'cards' | 'spotlight' | 'flow';
  onAmenityClick: (amenity: EnrichedAmenity) => void;
}

const AmenityContainer: React.FC<AmenityContainerProps> = ({ 
  amenities, 
  viewMode, 
  onAmenityClick 
}) => {
  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'open': return 'text-green-400';
      case 'busy': return 'text-yellow-400';
      case 'closed': return 'text-red-400';
      default: return 'text-white/60';
    }
  };

  const getPriceSymbol = (priceLevel?: string) => {
    switch (priceLevel?.toLowerCase()) {
      case 'budget':
      case '$': return '$';
      case 'moderate':
      case '$$': return '$$';
      case 'premium':
      case '$$$': return '$$$';
      case 'luxury':
      case '$$$$': return '$$$$';
      default: return '$';
    }
  };

  // Cards View - 2 column grid
  if (viewMode === 'cards') {
    return (
      <div className="px-4 pb-6">
        <div className="grid grid-cols-2 gap-4">
          {amenities.map((amenity, index) => (
            <motion.div
              key={amenity.amenity_slug}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onAmenityClick(amenity)}
              className="cursor-pointer"
            >
              <GlassCard className="p-4 h-full">
                <div className="flex flex-col h-full">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-bold text-white text-sm flex-1 mr-2">
                      {amenity.name}
                    </h3>
                    {amenity.trending && (
                      <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-[10px] rounded-full flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        HOT
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex items-center gap-3 text-xs text-white/60 mb-3">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {amenity.isOpen ? 'Open' : 'Closed'}
                    </span>
                    {amenity.price_level && (
                      <>
                        <span>•</span>
                        <span>{getPriceSymbol(amenity.price_level)}</span>
                      </>
                    )}
                  </div>

                  {/* Features */}
                  {amenity.vibe_tags && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {amenity.vibe_tags.split(',').slice(0, 2).map((tag, i) => (
                        <span 
                          key={i}
                          className="px-2 py-0.5 text-[10px] bg-white/10 rounded-full text-white/70"
                        >
                          {tag.trim()}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Bottom */}
                  <div className="mt-auto pt-3 border-t border-white/10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-xs text-white/60">
                        <MapPin className="h-3 w-3" />
                        <span>{amenity.terminal_code || 'Terminal'}</span>
                      </div>
                      <Heart className="h-4 w-4 text-white/40" />
                    </div>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  // Spotlight View - Full width cards
  if (viewMode === 'spotlight') {
    return (
      <div className="px-4 pb-6 space-y-4">
        {amenities.map((amenity, index) => (
          <motion.div
            key={amenity.amenity_slug}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onAmenityClick(amenity)}
            className="cursor-pointer"
          >
            <GlassCard className="p-5">
              <div className="flex items-center gap-4">
                {/* Icon/Emoji */}
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center text-2xl">
                  ☕
                </div>

                {/* Content */}
                <div className="flex-1">
                  <h3 className="font-bold text-white text-lg mb-1">
                    {amenity.name}
                  </h3>
                  <p className="text-sm text-white/60 mb-2">
                    {amenity.description || 'Great spot for travelers'}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-white/60">
                    <span className={getStatusColor(amenity.isOpen ? 'open' : 'closed')}>
                      {amenity.isOpen ? 'Open Now' : 'Closed'}
                    </span>
                    <span>{getPriceSymbol(amenity.price_level)}</span>
                    <span>{amenity.terminal_code}</span>
                  </div>
                </div>

                {/* Action */}
                <div className="text-right">
                  {amenity.trending && (
                    <div className="bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full text-xs mb-2">
                      Trending
                    </div>
                  )}
                  <div className="text-white/40">
                    <MapPin className="h-5 w-5" />
                  </div>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>
    );
  }

  // Flow View - Horizontal scrolling
  return (
    <div className="px-4 pb-6">
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
        {amenities.map((amenity, index) => (
          <motion.div
            key={amenity.amenity_slug}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onAmenityClick(amenity)}
            className="cursor-pointer flex-shrink-0 w-[280px]"
          >
            <GlassCard className="p-5 h-full">
              <div className="space-y-3">
                <h3 className="font-bold text-white text-lg">
                  {amenity.name}
                </h3>
                <p className="text-sm text-white/70 line-clamp-2">
                  {amenity.description || 'Discover this amazing spot'}
                </p>
                <div className="flex items-center justify-between pt-3 border-t border-white/10">
                  <span className={`text-xs ${getStatusColor(amenity.isOpen ? 'open' : 'closed')}`}>
                    {amenity.isOpen ? 'Open' : 'Closed'}
                  </span>
                  <span className="text-xs text-white/60">
                    {getPriceSymbol(amenity.price_level)}
                  </span>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default AmenityContainer;
