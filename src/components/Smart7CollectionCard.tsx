import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Smart7Badge } from './Smart7Badge';
import type { 
  Smart7Collection, 
  AmenityWithScore, 
  CollectionRecommendationContext 
} from '../types/collections';
import { COLLECTION_CATEGORIES } from '../types/collections';

interface Smart7CollectionCardProps {
  collection: Smart7Collection;
  onSelect: (collection: Smart7Collection) => void;
  userContext: CollectionRecommendationContext;
  showPriorityScores?: boolean;
  showVibeCategory?: boolean;
  showTerminalInfo?: boolean;
  className?: string;
}

export const Smart7CollectionCard: React.FC<Smart7CollectionCardProps> = ({
  collection,
  onSelect,
  userContext,
  showPriorityScores = true,
  showVibeCategory = true,
  showTerminalInfo = true,
  className = ''
}) => {
  // Calculate relevance score based on user context and collection
  const relevanceScore = useMemo(() => {
    return calculateCollectionRelevance(collection, userContext);
  }, [collection, userContext]);

  // Get vibe category info
  const vibeCategory = useMemo(() => {
    return COLLECTION_CATEGORIES[collection.vibe_category];
  }, [collection.vibe_category]);

  // Get top amenities for preview
  const topAmenities = useMemo(() => {
    return collection.amenities
      .sort((a, b) => b.priority_score - a.priority_score)
      .slice(0, 3);
  }, [collection.amenities]);

  // Handle card click
  const handleCardClick = () => {
    onSelect(collection);
  };

  // Handle keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleCardClick();
    }
  };

  return (
    <motion.div
      whileHover={{ y: -5 }}
      whileTap={{ scale: 0.98 }}
      className={`bg-white rounded-2xl shadow-lg overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-xl ${className}`}
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`View ${collection.name} collection with ${collection.total_amenities} amenities`}
    >
      {/* Collection Header with Vibe Category Background */}
      <div 
        className={`h-32 relative overflow-hidden`}
        style={{
          background: `linear-gradient(135deg, ${getVibeGradientColors(collection.vibe_category)})`
        }}
      >
        <div className="absolute inset-0 bg-black/20" />
        
        {/* Vibe Category Icon */}
        <div className="absolute top-3 right-3">
          <span className="text-2xl drop-shadow-lg">{vibeCategory?.icon || '📁'}</span>
        </div>
        
        {/* Amenities Count */}
        <div className="absolute bottom-3 left-3 text-white">
          <p className="text-3xl font-bold opacity-90 drop-shadow-lg">
            {collection.total_amenities}
          </p>
          <p className="text-xs opacity-75 drop-shadow-lg">amenities</p>
        </div>

        {/* Featured Badge */}
        {collection.featured_amenities > 0 && (
          <div className="absolute top-3 left-3">
            <div className="bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full text-xs font-bold shadow-lg">
              ⭐ {collection.featured_amenities} Featured
            </div>
          </div>
        )}
      </div>

      {/* Collection Content */}
      <div className="p-4">
        {/* Header with Name and Relevance Score */}
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-lg text-gray-900 line-clamp-1">
            {collection.name}
          </h3>
          <div className="flex items-center space-x-2">
            {/* Vibe Category Badge */}
            {showVibeCategory && vibeCategory && (
              <span 
                className="px-2 py-1 text-xs rounded-full font-medium text-white shadow-sm"
                style={{
                  background: `linear-gradient(135deg, ${getVibeGradientColors(collection.vibe_category)})`
                }}
              >
                {vibeCategory.name}
              </span>
            )}
            
            {/* Relevance Score */}
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
              {relevanceScore}% match
            </span>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {collection.description}
        </p>

        {/* Amenity Preview with Priority Scores */}
        {showPriorityScores && topAmenities.length > 0 && (
          <div className="space-y-2 mb-3">
            <p className="text-xs font-medium text-gray-700 mb-2">Top Amenities:</p>
            {topAmenities.map(amenity => (
              <div key={amenity.id} className="flex items-center justify-between text-xs">
                <span className="text-gray-700 line-clamp-1 flex-1 mr-2">
                  {amenity.name}
                </span>
                <div className="flex items-center space-x-2 flex-shrink-0">
                  {/* Featured Star */}
                  {amenity.is_featured && (
                    <span className="text-yellow-500 text-sm">⭐</span>
                  )}
                  
                  {/* Priority Score */}
                  <span 
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(amenity.priority_score)}`}
                  >
                    {amenity.priority_score}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Collection Stats */}
        <div className="pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between text-xs text-gray-500">
            {/* Terminal Coverage */}
            {showTerminalInfo && (
              <span className="flex items-center space-x-1">
                <span>✈️</span>
                <span>{collection.terminals_covered.join(', ')}</span>
              </span>
            )}
            
            {/* Average Priority Score */}
            <span className="flex items-center space-x-1">
              <span>📊</span>
              <span>Avg: {collection.avg_priority_score}</span>
            </span>
          </div>
        </div>

        {/* Smart7 Badge */}
        {collection.is_smart7_eligible && (
          <div className="absolute top-2 right-2">
            <Smart7Badge size="sm" variant="premium" />
          </div>
        )}
      </div>
    </motion.div>
  );
};

// Utility functions for styling and calculations

/**
 * Calculate collection relevance score based on user context
 */
function calculateCollectionRelevance(
  collection: Smart7Collection, 
  context: CollectionRecommendationContext
): number {
  let score = 0;
  
  // Base score from collection priority
  score += collection.avg_priority_score * 0.3;
  
  // Terminal matching
  if (context.userTerminal && collection.terminals_covered.includes(context.userTerminal)) {
    score += 25;
  }
  
  // Time of day matching
  const timeMatch = getTimeRelevance(collection.vibe_category, context.timeOfDay);
  score += timeMatch * 0.2;
  
  // Layover duration matching
  const layoverMatch = getLayoverRelevance(collection.vibe_category, context.layoverDuration);
  score += layoverMatch * 0.15;
  
  // Price preference matching
  const priceMatch = getPriceRelevance(collection, context.pricePreference);
  score += priceMatch * 0.1;
  
  return Math.min(100, Math.round(score));
}

/**
 * Get time relevance score for a vibe category
 */
function getTimeRelevance(vibeCategory: string, timeOfDay?: string): number {
  if (!timeOfDay) return 50;
  
  const timePreferences = {
    comfort: ['morning', 'night'],
    chill: ['afternoon', 'evening'],
    refuel: ['morning', 'lunch', 'dinner'],
    work: ['morning', 'afternoon'],
    quick: ['short-layover', 'rush'],
    exclusive: ['leisure', 'experience']
  };
  
  const relevantTimes = timePreferences[vibeCategory] || [];
  return relevantTimes.some(time => timeOfDay.includes(time)) ? 100 : 50;
}

/**
 * Get layover duration relevance score
 */
function getLayoverRelevance(vibeCategory: string, layoverDuration?: number): number {
  if (!layoverDuration) return 50;
  
  const layoverPreferences = {
    comfort: [120, 480], // 2-8 hours
    chill: [60, 240],    // 1-4 hours
    refuel: [30, 120],   // 30 min - 2 hours
    work: [60, 360],     // 1-6 hours
    quick: [15, 60],     // 15 min - 1 hour
    exclusive: [120, 720] // 2-12 hours
  };
  
  const [min, max] = layoverPreferences[vibeCategory] || [30, 120];
  return (layoverDuration >= min && layoverDuration <= max) ? 100 : 50;
}

/**
 * Get price relevance score
 */
function getPriceRelevance(collection: Smart7Collection, pricePreference?: string): number {
  if (!pricePreference || pricePreference === 'any') return 50;
  
  // This would need to be enhanced based on actual price data
  // For now, return a neutral score
  return 50;
}

/**
 * Get vibe gradient colors
 */
function getVibeGradientColors(vibeCategory: string): string {
  const colors = {
    comfort: '#60A5FA, #4F46E5',
    chill: '#34D399, #059669',
    refuel: '#FB923C, #DC2626',
    work: '#A78BFA, #EC4899',
    quick: '#FBBF24, #FB923C',
    exclusive: '#F472B6, #F43F5E'
  };
  
  return colors[vibeCategory] || '#9CA3AF, #4B5563';
}

/**
 * Get priority score color classes
 */
function getPriorityColor(score: number): string {
  if (score >= 95) return 'bg-green-100 text-green-700';
  if (score >= 85) return 'bg-blue-100 text-blue-700';
  if (score >= 75) return 'bg-yellow-100 text-yellow-700';
  if (score >= 70) return 'bg-orange-100 text-orange-700';
  return 'bg-gray-100 text-gray-700';
}

// Export utility functions for testing
export {
  calculateCollectionRelevance,
  getTimeRelevance,
  getLayoverRelevance,
  getPriceRelevance,
  getVibeGradientColors,
  getPriorityColor
};
