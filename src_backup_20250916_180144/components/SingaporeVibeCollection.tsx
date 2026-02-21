import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCollectionSmart7 } from '../hooks/useCollectionSmart7';
import { Smart7Badge } from './Smart7Badge';
import { RefreshButton } from './RefreshButton';
import type { CollectionRecommendationContext } from '../types/collections';

interface SingaporeVibeCollectionProps {
  collectionSlug: string;
  terminal: string;
  userContext?: CollectionRecommendationContext;
  showPerformance?: boolean;
  enableAnimations?: boolean;
  className?: string;
}

export const SingaporeVibeCollection: React.FC<SingaporeVibeCollectionProps> = ({ 
  collectionSlug, 
  terminal,
  userContext,
  showPerformance = true,
  enableAnimations = true,
  className = ''
}) => {
  const [selectedAmenity, setSelectedAmenity] = useState<number | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  
  const { 
    smart7Selection, 
    collectionInfo, 
    loading, 
    error,
    refresh,
    performance
  } = useCollectionSmart7({
    collectionSlug,
    airport: 'SIN',
    terminal,
    userContext: userContext || {
      timeOfDay: new Date().getHours().toString(),
      pricePreference: 'any',
      vibePreferences: []
    },
    enableCaching: true,
    maxAmenities: 50
  });

  // Memoized values for performance
  const terminalDisplay = useMemo(() => {
    return terminal.replace('SIN-', '').replace('T', 'Terminal ');
  }, [terminal]);

  const vibeCategory = useMemo(() => {
    return collectionInfo?.vibe_category || 'general';
  }, [collectionInfo]);

  const getVibeGradient = (category: string): string => {
    const gradients: Record<string, string> = {
      comfort: 'from-blue-500 to-indigo-600',
      chill: 'from-green-500 to-emerald-600',
      refuel: 'from-orange-500 to-red-600',
      work: 'from-purple-500 to-pink-600',
      quick: 'from-yellow-500 to-orange-600',
      exclusive: 'from-pink-500 to-rose-600',
      general: 'from-gray-500 to-gray-600'
    };
    
    return gradients[category] || gradients.general;
  };

  const getVibeBadgeColor = (category: string): string => {
    const colors: Record<string, string> = {
      comfort: 'bg-blue-100 text-blue-700',
      chill: 'bg-green-100 text-green-700',
      refuel: 'bg-orange-100 text-orange-700',
      work: 'bg-purple-100 text-purple-700',
      quick: 'bg-yellow-100 text-yellow-700',
      exclusive: 'bg-pink-100 text-pink-700',
      general: 'bg-gray-100 text-gray-700'
    };
    
    return colors[category] || colors.general;
  };

  const getPriorityColor = (score: number): string => {
    if (score >= 95) return 'bg-green-100 text-green-700';
    if (score >= 85) return 'bg-blue-100 text-blue-700';
    if (score >= 75) return 'bg-yellow-100 text-yellow-700';
    if (score >= 70) return 'bg-orange-100 text-orange-700';
    return 'bg-gray-100 text-gray-700';
  };

  const handleAmenityClick = (amenityId: number) => {
    setSelectedAmenity(amenityId);
    setShowDetails(true);
  };

  const handleCloseDetails = () => {
    setShowDetails(false);
    setSelectedAmenity(null);
  };

  if (loading) {
    return (
      <div className={`min-h-[400px] bg-white rounded-2xl shadow-lg ${className}`}>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="relative w-24 h-24 mx-auto mb-4">
              <motion.div
                className="absolute inset-0 border-4 border-blue-500 rounded-full border-t-transparent"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
              <motion.div
                className="absolute inset-3 border-4 border-purple-500 rounded-full border-b-transparent"
                animate={{ rotate: -360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              />
            </div>
            <p className="text-gray-600">Loading {collectionInfo?.name || 'collection'}...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-[400px] bg-red-50 border border-red-200 rounded-2xl p-6 ${className}`}>
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-red-600 mb-2">Failed to Load Collection</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={refresh}
            className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!collectionInfo || smart7Selection.length === 0) {
    return (
      <div className={`min-h-[400px] bg-gray-50 border border-gray-200 rounded-2xl p-6 ${className}`}>
        <div className="text-center">
          <div className="text-6xl mb-4">😕</div>
          <h2 className="text-2xl font-bold text-gray-600 mb-2">No Amenities Found</h2>
          <p className="text-gray-600">This collection doesn't have any amenities available.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Collection Header */}
      <div 
        className={`bg-gradient-to-br ${getVibeGradient(vibeCategory)} p-6 rounded-t-2xl relative overflow-hidden`}
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(255,255,255,0.1)_0%,transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.1)_0%,transparent_50%)]" />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center justify-between text-white">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-3">
                <span className="text-5xl">{collectionInfo.icon}</span>
                <div>
                  <h2 className="text-3xl font-bold">{collectionInfo.name}</h2>
                  <p className="text-white/80 mt-1">{collectionInfo.description}</p>
                </div>
              </div>
              
              {/* Collection Stats */}
              <div className="flex items-center space-x-4 text-sm text-white/90">
                <span className="px-3 py-1 bg-white/20 backdrop-blur rounded-full flex items-center">
                  <span className="mr-2">✈️</span>
                  {terminalDisplay}
                </span>
                <span className="px-3 py-1 bg-white/20 backdrop-blur rounded-full flex items-center">
                  <span className="mr-2">🎯</span>
                  {smart7Selection.length} curated spots
                </span>
                <span className="px-3 py-1 bg-white/20 backdrop-blur rounded-full flex items-center">
                  <span className="mr-2">⭐</span>
                  {collectionInfo.featured_count} featured
                </span>
              </div>
            </div>
            
            {/* Vibe Category Badge */}
            <div className="text-right">
              <span className={`px-4 py-2 rounded-full text-sm font-medium ${getVibeBadgeColor(vibeCategory)}`}>
                {vibeCategory.charAt(0).toUpperCase() + vibeCategory.slice(1)}
              </span>
            </div>
          </div>
        </div>
        
        {/* Smart7 Badge */}
        <div className="absolute top-4 right-4">
          <Smart7Badge size="md" variant="premium" />
        </div>
      </div>

      {/* Performance Bar */}
      {showPerformance && (
        <div className="bg-gray-900 text-white text-xs py-2 px-4">
          <div className="flex items-center justify-between">
            <span>Load Time: {performance.load_time}ms</span>
            <span>Cache: {performance.cache_hit ? '✓ Hit' : '✗ Miss'}</span>
            <span>Algorithm: v{performance.algorithm_version}</span>
            <span>Terminal: {terminal}</span>
          </div>
        </div>
      )}

      {/* Smart7 Grid */}
      <div className="bg-white rounded-b-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900">Smart7 Selections</h3>
          <RefreshButton
            onClick={refresh}
            isRefreshing={loading}
            loadTime={performance.load_time}
            variant="minimal"
            size="sm"
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {smart7Selection.map((amenity, index) => (
            <motion.div
              key={amenity.id}
              initial={enableAnimations ? { opacity: 0, y: 20 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={enableAnimations ? { delay: index * 0.05 } : {}}
              whileHover={enableAnimations ? { y: -5, scale: 1.02 } : {}}
              className="relative bg-gradient-to-br from-gray-50 to-white rounded-xl p-4 hover:shadow-lg transition-all cursor-pointer border border-gray-200 hover:border-blue-300"
              onClick={() => handleAmenityClick(amenity.id)}
            >
              {/* Featured badge */}
              {amenity.is_featured && (
                <motion.div
                  initial={enableAnimations ? { scale: 0 } : false}
                  animate={{ scale: 1 }}
                  transition={{ delay: index * 0.1 + 0.5 }}
                  className="absolute -top-2 -right-2 bg-yellow-400 text-xs font-bold px-2 py-1 rounded-full shadow-lg"
                >
                  ⭐ TOP
                </motion.div>
              )}
              
              {/* Position indicator */}
              <div className="absolute top-2 left-2 w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">
                {index + 1}
              </div>
              
              {/* Content */}
              <div className="pt-8">
                <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                  {amenity.name}
                </h3>
                
                <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                  <span className="flex items-center">
                    <span className="mr-1">✈️</span>
                    {amenity.terminal_code.replace('SIN-', '').replace('T', 'T')}
                  </span>
                  <span className="flex items-center">
                    <span className="mr-1">💰</span>
                    {amenity.price_level || 'N/A'}
                  </span>
                </div>
                
                {/* Vibe tags */}
                {amenity.vibe_tags && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {amenity.vibe_tags.split(',').slice(0, 2).map((tag: string, tagIndex: number) => (
                      <span 
                        key={tagIndex} 
                        className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full"
                      >
                        {tag.trim()}
                      </span>
                    ))}
                  </div>
                )}
                
                {/* Smart7 Score indicator */}
                <div className="pt-3 border-t border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-500">Match Score</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(amenity.smart7_score || amenity.priority_score)}`}>
                      {amenity.smart7_score || amenity.priority_score}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-600"
                      initial={enableAnimations ? { width: 0 } : false}
                      animate={{ width: `${amenity.smart7_score || amenity.priority_score}%` }}
                      transition={{ delay: index * 0.1 + 0.3, duration: 0.5 }}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        
        {/* Empty State */}
        {smart7Selection.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">😕</div>
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No Amenities Selected</h3>
            <p className="text-gray-500">Try adjusting your preferences or check back later.</p>
          </div>
        )}
      </div>

      {/* Amenity Details Modal */}
      <AnimatePresence>
        {showDetails && selectedAmenity && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={handleCloseDetails}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {(() => {
                const amenity = smart7Selection.find(a => a.id === selectedAmenity);
                if (!amenity) return null;
                
                return (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-semibold">{amenity.name}</h3>
                      <button
                        onClick={handleCloseDetails}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Terminal:</span>
                        <span className="font-medium">{amenity.terminal_code}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Price Level:</span>
                        <span className="font-medium">{amenity.price_level || 'N/A'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Priority Score:</span>
                        <span className={`px-2 py-1 rounded-full text-sm ${getPriorityColor(amenity.priority_score)}`}>
                          {amenity.priority_score}
                        </span>
                      </div>
                      {amenity.smart7_score && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Smart7 Score:</span>
                          <span className={`px-2 py-1 rounded-full text-sm ${getPriorityColor(amenity.smart7_score)}`}>
                            {amenity.smart7_score}
                          </span>
                        </div>
                      )}
                      {amenity.rating && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Rating:</span>
                          <span className="font-medium">⭐ {amenity.rating}/5 ({amenity.review_count} reviews)</span>
                        </div>
                      )}
                      {amenity.vibe_tags && (
                        <div>
                          <span className="text-gray-600 block mb-2">Vibe Tags:</span>
                          <div className="flex flex-wrap gap-2">
                            {amenity.vibe_tags.split(',').map((tag: string, index: number) => (
                              <span 
                                key={index} 
                                className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                              >
                                {tag.trim()}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-6 pt-4 border-t border-gray-200">
                      <button
                        onClick={handleCloseDetails}
                        className="w-full py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                );
              })()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
