import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  RefreshCw, 
  ChevronLeft, 
  ChevronRight, 
  Star, 
  Clock, 
  MapPin,
  TrendingUp,
  Zap
} from 'lucide-react';
import { useSmart7Collections } from '../../hooks/useSmart7Collections';

const Smart7Test: React.FC = () => {
  const [selectedCollection, setSelectedCollection] = useState('hawker-heaven');
  
  // Test collections
  const testCollections = [
    'hawker-heaven',
    'lounge-life',
    'coffee-worth-walk',
    'hidden-gems',
    'duty-free-deals'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            🧠 Smart 7 Algorithm Test
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Intelligent amenity recommendations based on context, time, and user preferences
          </p>
        </div>

        {/* Collection Selector */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 mb-6 shadow-lg">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Select Collection to Test
          </h2>
          <div className="flex flex-wrap gap-2">
            {testCollections.map((collection) => (
              <button
                key={collection}
                onClick={() => setSelectedCollection(collection)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedCollection === collection
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {collection.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </button>
            ))}
          </div>
        </div>

        {/* Smart 7 Results */}
        <Smart7Results collectionId={selectedCollection} />
      </div>
    </div>
  );
};

const Smart7Results: React.FC<{ collectionId: string }> = ({ collectionId }) => {
  const {
    amenities,
    loading,
    error,
    rotation,
    showNextSet,
    resetRotation,
    totalCount,
    mode,
    contextPills,
    hasMore,
    userContext
  } = useSmart7Collections(collectionId);

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg">
        <div className="text-center text-red-600 dark:text-red-400">
          <p>Error loading collection: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Context Information */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          🎯 Smart Context
        </h2>
        
        {/* Context Pills */}
        <div className="flex flex-wrap gap-2 mb-4">
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

        {/* User Context Details */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="font-medium text-gray-900 dark:text-white">Terminal</div>
            <div className="text-gray-600 dark:text-gray-400">{userContext.currentTerminal}</div>
          </div>
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="font-medium text-gray-900 dark:text-white">Layover</div>
            <div className="text-gray-600 dark:text-gray-400">{userContext.layoverMinutes}m</div>
          </div>
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="font-medium text-gray-900 dark:text-white">Mode</div>
            <div className="text-gray-600 dark:text-gray-400">{userContext.isRushing ? 'Rush' : 'Leisure'}</div>
          </div>
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="font-medium text-gray-900 dark:text-white">Total</div>
            <div className="text-gray-600 dark:text-gray-400">{totalCount} amenities</div>
          </div>
        </div>
      </div>

      {/* Mode Recommendations */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          💡 Smart Recommendations
        </h2>
        <div className="space-y-2">
          {mode.map((rec, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
            >
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-gray-700 dark:text-gray-300">{rec}</span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Smart 7 Amenities */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            🏆 Smart 7 Results (Rotation {rotation + 1})
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={resetRotation}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              title="Reset rotation"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            {hasMore && (
              <button
                onClick={showNextSet}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                title="Show next set"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {amenities.map((amenity, index) => (
            <motion.div
              key={amenity.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`relative p-4 rounded-xl border-2 transition-all ${
                amenity.hero
                  ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20'
                  : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800'
              }`}
            >
              {/* Hero Badge */}
              {amenity.hero && (
                <div className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full text-xs font-bold">
                  🏆 HERO
                </div>
              )}

              {/* Amenity Name */}
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                {amenity.amenity_detail?.name || `Amenity ${index + 1}`}
              </h3>

              {/* Score Display */}
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Total Score
                  </span>
                  <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                    {Math.round(amenity.score.totalScore)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${amenity.score.totalScore}%` }}
                  ></div>
                </div>
              </div>

              {/* Factor Scores */}
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    Proximity
                  </span>
                  <span className="font-medium">{Math.round(amenity.score.factors.proximity)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Temporal
                  </span>
                  <span className="font-medium">{Math.round(amenity.score.factors.temporal)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    Popularity
                  </span>
                  <span className="font-medium">{Math.round(amenity.score.factors.popularity)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    Availability
                  </span>
                  <span className="font-medium">{Math.round(amenity.score.factors.availability)}</span>
                </div>
              </div>

              {/* Metadata */}
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>Walking: {amenity.score.metadata.walkingTime}m</span>
                  <span>{amenity.score.metadata.isOpen ? '🟢 Open' : '🔴 Closed'}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Rotation Info */}
        {hasMore && (
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Showing set {rotation + 1} of {Math.ceil(totalCount / 7)}
            </p>
            <button
              onClick={showNextSet}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Show Next 7
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Smart7Test;
