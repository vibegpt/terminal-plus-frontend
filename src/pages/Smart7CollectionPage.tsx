import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams } from 'react-router-dom';
import { useSmart7WithCollections } from '../hooks/useSmart7WithCollections';

interface Smart7Amenity {
  id: number;
  name: string;
  amenity_slug: string;
  terminal_code: string;
  price_level: string;
  vibe_tags: string;
  description: string;
  smart7_score?: number;
  is_featured?: boolean;
}

const Smart7CollectionPage: React.FC = () => {
  const { collectionSlug, terminal = 'T3' } = useParams();
  const [refreshing, setRefreshing] = useState(false);
  
  const { 
    collection, 
    smart7Items, 
    loading, 
    error,
    refreshSelection,
    trackClick 
  } = useSmart7WithCollections({
    collectionSlug: collectionSlug || 'singapore-exclusives',
    terminal,
    enableCache: true
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshSelection();
    setTimeout(() => setRefreshing(false), 500);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto mb-4" />
          <p className="text-gray-600">Loading Smart7 selection...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold mb-2">Error Loading Collection</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={handleRefresh}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 pb-20">
      {/* Header */}
      <div className={`bg-gradient-to-br ${collection?.gradient || 'from-blue-500 to-purple-600'} text-white`}>
        <div className="px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="text-4xl">{collection?.icon}</span>
              <div>
                <h1 className="text-2xl font-bold">{collection?.name}</h1>
                <p className="text-white/80">{collection?.description}</p>
              </div>
            </div>
            
            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-3 bg-white/20 backdrop-blur rounded-full hover:bg-white/30 transition-all"
            >
              <motion.svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                animate={refreshing ? { rotate: 360 } : {}}
                transition={{ duration: 0.5 }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </motion.svg>
            </button>
          </div>
          
          {/* Stats Bar */}
          <div className="flex items-center gap-4 text-sm">
            <div className="bg-white/20 backdrop-blur px-3 py-1 rounded-full">
              Terminal {terminal}
            </div>
            <div className="bg-white/20 backdrop-blur px-3 py-1 rounded-full">
              {smart7Items.length} of 7 selected
            </div>
            <div className="bg-white/20 backdrop-blur px-3 py-1 rounded-full flex items-center gap-1">
              <span className="text-yellow-300">✨</span>
              AI Curated
            </div>
          </div>
        </div>
      </div>

      {/* Smart7 Grid */}
      <div className="px-4 mt-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={refreshing ? 'refreshing' : 'stable'}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          >
            {smart7Items.map((amenity, index) => (
              <motion.div
                key={amenity.id}
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ 
                  delay: index * 0.05,
                  type: 'spring',
                  stiffness: 300
                }}
                onClick={() => trackClick(amenity.id)}
                className="relative bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all cursor-pointer overflow-hidden group"
              >
                {/* Rank Badge */}
                <div className="absolute top-3 left-3 z-10 w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                  {index + 1}
                </div>

                {/* Featured Star */}
                {amenity.is_featured && (
                  <div className="absolute top-3 right-3 z-10 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                    ⭐ TOP
                  </div>
                )}

                {/* Content */}
                <div className="p-6 pt-16">
                  <h3 className="font-bold text-lg text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                    {amenity.name}
                  </h3>
                  
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {amenity.description}
                  </p>

                  {/* Meta Info */}
                  <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                    <span>{amenity.terminal_code}</span>
                    <span>•</span>
                    <span>{amenity.price_level}</span>
                  </div>

                  {/* Vibe Tags */}
                  <div className="flex flex-wrap gap-1 mb-3">
                    {amenity.vibe_tags?.split(',').slice(0, 3).map((tag: string) => (
                      <span
                        key={tag}
                        className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded-full"
                      >
                        {tag.trim()}
                      </span>
                    ))}
                  </div>

                  {/* Smart7 Score & Reason */}
                  <div className="pt-3 border-t border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-500">Smart7 Score</span>
                      <span className="text-xs font-medium text-gray-700">
                        {amenity.smart7_score}%
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-600"
                        initial={{ width: 0 }}
                        animate={{ width: `${amenity.smart7_score}%` }}
                        transition={{ delay: index * 0.05 + 0.3 }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-2 italic">
                      AI-curated selection
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Smart7CollectionPage;