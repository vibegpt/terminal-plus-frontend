import React from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronRight, 
  MapPin, 
  Clock, 
  Star,
  RefreshCw,
  Sparkles,
  TrendingUp,
  Zap,
  Crown,
  Flag,
  AlertCircle
} from 'lucide-react';
import { useSmart7Collections } from '../hooks/useSmart7Collections';

const CollectionDetailSmart7: React.FC = () => {
  const { collectionSlug } = useParams<{ collectionSlug: string }>();
  const collectionId = collectionSlug || 'default-collection';
  
  // Map collection slugs to display names
  const COLLECTION_NAMES: Record<string, string> = {
    'hawker-heaven': 'Hawker Heaven',
    'quick-bites': 'Quick Bites',
    'coffee-culture': 'Coffee Culture',
    'hidden-gems': 'Hidden Gems',
    // ... add more as needed
  };

  const collectionName = COLLECTION_NAMES[collectionId] || 'Collection';
  
  const {
    amenities,
    loading,
    error,
    showNextSet,
    hasMore,
    contextPills,
    mode,
    rotation,
    totalCount
  } = useSmart7Collections(collectionId);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-6">
            {/* Header skeleton */}
            <div className="h-16 bg-gray-200 dark:bg-gray-800 rounded-2xl" />
            
            {/* Context pills skeleton */}
            <div className="flex gap-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-8 w-24 bg-gray-200 dark:bg-gray-800 rounded-full" />
              ))}
            </div>
            
            {/* Hero amenity skeleton */}
            <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded-2xl" />
            
            {/* 2x3 grid skeleton */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-32 bg-gray-200 dark:bg-gray-800 rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-20">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Error Loading Collection
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              {error || 'Unable to load collection amenities.'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-medium"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Separate hero amenity from supporting six
  const heroAmenity = amenities[0];
  const supportingAmenities = amenities.slice(1, 7);

  // Get quick decision badges for hero amenity
  const getQuickDecisionBadges = (amenity: any) => {
    const badges = [];
    
    if (amenity.hero) {
      badges.push({ icon: '🏆', text: 'Must Try', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200' });
    }
    
    if (amenity.score.metadata.walkingTime <= 5) {
      badges.push({ icon: '⚡', text: 'Quick Service', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200' });
    }
    
    if (amenity.score.factors.popularity > 80) {
      badges.push({ icon: '🇸🇬', text: 'Local Favorite', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200' });
    }
    
    if (amenity.score.metadata.peakTime) {
      badges.push({ icon: '⏰', text: 'Peak Time', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200' });
    }
    
    return badges;
  };

  const handleBadgeClick = (badgeText: string, amenityId: string) => {
    console.log(`Badge clicked: ${badgeText} for amenity ID: ${amenityId}`);
    // Add analytics tracking here
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="max-w-6xl mx-auto p-4">
        {/* Header */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 mb-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {collectionName}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Discover amazing amenities • {totalCount} total amenities
              </p>
            </div>
            
            {/* Rotation Info */}
            <div className="text-right">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Set {rotation + 1} of {Math.ceil(totalCount / 7)}
              </div>
              <div className="text-xs text-gray-400 dark:text-gray-500">
                Smart 7 Algorithm
              </div>
            </div>
          </div>

          {/* Smart Context Pills */}
          <div className="flex flex-wrap gap-2">
            {contextPills.map((pill, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full text-sm font-medium"
              >
                {pill}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Mode Recommendations */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 mb-6 shadow-lg">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            💡 Smart Recommendations
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {mode.map((rec, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-gray-700 dark:text-gray-300 text-sm">{rec}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Smart 7 Layout: 1 + 6 Pattern */}
        <div className="space-y-6">
          {/* HERO AMENITY (Large Card) */}
          {heroAmenity && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border-2 border-yellow-400"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {heroAmenity.amenity_detail?.name || 'Hero Amenity'}
                    </h2>
                    <div className="px-2 py-1 bg-yellow-400 text-yellow-900 rounded-full text-xs font-bold">
                      🏆 HERO
                    </div>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 mb-3">
                    {heroAmenity.amenity_detail?.description || 'Top recommendation for your current context'}
                  </p>
                  
                  {/* Quick Decision Badges */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {getQuickDecisionBadges(heroAmenity).map((badge, index) => (
                      <span
                        key={index}
                        className={`px-3 py-1 rounded-full text-xs font-medium ${badge.color} cursor-pointer hover:opacity-80 transition-opacity`}
                        onClick={() => handleBadgeClick(badge.text, heroAmenity.id)}
                      >
                        {badge.icon} {badge.text}
                      </span>
                    ))}
                  </div>
                </div>
                
                {/* Hero Score */}
                <div className="text-right ml-4">
                  <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                    {Math.round(heroAmenity.score.totalScore)}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Smart Score</div>
                </div>
              </div>

              {/* Hero Score Breakdown */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                    {Math.round(heroAmenity.score.factors.proximity)}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Proximity</div>
                </div>
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="text-lg font-bold text-green-600 dark:text-green-400">
                    {Math.round(heroAmenity.score.factors.temporal)}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Temporal</div>
                </div>
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                    {Math.round(heroAmenity.score.factors.popularity)}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Popularity</div>
                </div>
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="text-lg font-bold text-orange-600 dark:text-orange-400">
                    {Math.round(heroAmenity.score.factors.availability)}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Availability</div>
                </div>
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="text-lg font-bold text-pink-600 dark:text-pink-400">
                    {Math.round(heroAmenity.score.factors.personalization)}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Personal</div>
                </div>
              </div>

              {/* Hero Metadata */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-600">
                <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {heroAmenity.score.metadata.walkingTime}m walk
                  </span>
                  <span className="flex items-center gap-1">
                    {heroAmenity.score.metadata.isOpen ? '🟢 Open' : '🔴 Closed'}
                  </span>
                </div>
                <button className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-lg font-medium hover:from-yellow-600 hover:to-orange-600 transition-all">
                  View Details →
                </button>
              </div>
            </motion.div>
          )}

          {/* SUPPORTING SIX (2×3 Grid) */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Supporting Options
              </h3>
              
              {/* Rotation Controls */}
              <div className="flex items-center gap-2">
                {hasMore && (
                  <button
                    onClick={showNextSet}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all font-medium"
                  >
                    Show Different 7
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* 2×3 Grid Layout */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <AnimatePresence mode="wait">
                {supportingAmenities.map((amenity, index) => (
                  <motion.div
                    key={amenity.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.1 }}
                    className="relative bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 transition-all hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-600"
                  >
                    {/* Amenity Content */}
                    <div className="p-4">
                      {/* Name and Description */}
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                        {amenity.amenity_detail?.name || `Option ${index + 2}`}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                        {amenity.amenity_detail?.description || 'Great alternative option'}
                      </p>

                      {/* Score Display */}
                      <div className="mb-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            Score
                          </span>
                          <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                            {Math.round(amenity.score.totalScore)}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${amenity.score.totalScore}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Quick Badges */}
                      <div className="flex flex-wrap gap-1 mb-3">
                        {getQuickDecisionBadges(amenity).slice(0, 2).map((badge, badgeIndex) => (
                          <span
                            key={badgeIndex}
                            className={`px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}
                          >
                            {badge.icon} {badge.text}
                          </span>
                        ))}
                      </div>

                      {/* Metadata Footer */}
                      <div className="pt-3 border-t border-gray-200 dark:border-gray-600">
                        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {amenity.score.metadata.walkingTime}m
                          </span>
                          <span className="flex items-center gap-1">
                            {amenity.score.metadata.isOpen ? '🟢' : '🔴'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Rotation Info */}
        {hasMore && (
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Want to see different recommendations? The Smart 7 algorithm has more options for you.
            </p>
            <button
              onClick={showNextSet}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium hover:from-purple-600 hover:to-pink-600 transition-all"
            >
              Show Next 7 Options
            </button>
          </div>
        )}

        {/* Collection Stats */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg mt-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            📊 Collection Insights
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {totalCount}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Amenities</div>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {Math.ceil(totalCount / 7)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Available Sets</div>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {rotation + 1}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Current Set</div>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {amenities.length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Showing Now</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollectionDetailSmart7;
