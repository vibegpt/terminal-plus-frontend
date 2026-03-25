import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

// Hooks
import { useSupabaseData } from '../hooks/useSupabaseData';
import { useTracking } from '../hooks/useTracking';

// Components
import { Smart7Badge } from '../components/Smart7Badge';

// Types
import type { Collection } from '../types/supabase';

interface CollectionWithStats extends Collection {
  amenityCount?: number;
  popularityScore?: number;
  lastInteraction?: Date;
  isRecommended?: boolean;
  isTrending?: boolean;
}

interface Smart7CollectionListProps {
  enableSearch?: boolean;
  enableFilters?: boolean;
  enableRecommendations?: boolean;
  defaultViewMode?: 'cards' | 'compact';
  maxCollections?: number;
  className?: string;
}

export const Smart7CollectionList: React.FC<Smart7CollectionListProps> = ({
  enableSearch = true,
  enableFilters = true,
  enableRecommendations = true,
  defaultViewMode = 'cards',
  maxCollections = 50,
  className = ''
}) => {
  const navigate = useNavigate();
  
  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'popular' | 'recent' | 'alphabetical'>('popular');
  const [viewMode, setViewMode] = useState<'cards' | 'compact'>(defaultViewMode);
  const [showOnlyRecommended, setShowOnlyRecommended] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Data fetching
  const { 
    collections, 
    loading, 
    error,
    collectionStats 
  } = useSupabaseData();

  // Tracking
  const { trackView, sessionId } = useTracking({
    pageType: 'collection_list'
  });

  // Track page view on mount
  useEffect(() => {
    trackView();
  }, [trackView]);

  // Get user's previous interactions from session
  const userHistory = useMemo(() => {
    if (!sessionId) return { viewedCollections: [], preferences: {} };
    
    try {
      const stored = sessionStorage.getItem(`smart7_history_${sessionId}`);
      return stored ? JSON.parse(stored) : { viewedCollections: [], preferences: {} };
    } catch (error) {
      console.warn('Failed to parse user history:', error);
      return { viewedCollections: [], preferences: {} };
    }
  }, [sessionId]);

  // Process collections with stats and recommendations
  const processedCollections = useMemo((): CollectionWithStats[] => {
    return collections.map(collection => {
      const stats = collectionStats?.find(s => s.collection_id === collection.id);
      
      // Calculate if recommended based on user history
      const isRecommended = enableRecommendations && (
        userHistory.viewedCollections.includes(collection.id) ||
        (collection.vibe_tags && userHistory.preferences[collection.vibe_tags])
      );
      
      // Check if trending (high recent activity)
      const isTrending = stats?.interaction_count_24h > 100;
      
      return {
        ...collection,
        amenityCount: stats?.amenity_count || 0,
        popularityScore: stats?.total_interactions || 0,
        lastInteraction: stats?.last_interaction ? new Date(stats.last_interaction) : undefined,
        isRecommended,
        isTrending
      };
    });
  }, [collections, collectionStats, userHistory, enableRecommendations]);

  // Filter and sort collections
  const filteredCollections = useMemo(() => {
    let filtered = processedCollections;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(c => 
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.vibe_tags?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(c => c.category === selectedCategory);
    }

    // Recommended filter
    if (showOnlyRecommended && enableRecommendations) {
      filtered = filtered.filter(c => c.isRecommended);
    }

    // Sort
    switch (sortBy) {
      case 'popular':
        filtered.sort((a, b) => (b.popularityScore || 0) - (a.popularityScore || 0));
        break;
      case 'recent':
        filtered.sort((a, b) => {
          const dateA = a.lastInteraction?.getTime() || 0;
          const dateB = b.lastInteraction?.getTime() || 0;
          return dateB - dateA;
        });
        break;
      case 'alphabetical':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }

    // Limit results
    return filtered.slice(0, maxCollections);
  }, [processedCollections, searchQuery, selectedCategory, sortBy, showOnlyRecommended, enableRecommendations, maxCollections]);

  // Get unique categories
  const categories = useMemo(() => {
    const cats = new Set(collections.map(c => c.category).filter(Boolean));
    return ['all', ...Array.from(cats)];
  }, [collections]);

  // Handle collection click
  const handleCollectionClick = useCallback((collectionId: number) => {
    if (!sessionId) return;
    
    try {
      // Save to history
      const history = JSON.parse(sessionStorage.getItem(`smart7_history_${sessionId}`) || '{}');
      history.viewedCollections = [...(history.viewedCollections || []), collectionId];
      sessionStorage.setItem(`smart7_history_${sessionId}`, JSON.stringify(history));
    } catch (error) {
      console.warn('Failed to save collection to history:', error);
    }
    
    // Navigate
    navigate(`/smart7/${collectionId}`);
  }, [navigate, sessionId]);

  // Handle load more
  const handleLoadMore = useCallback(async () => {
    setIsLoadingMore(true);
    // Simulate loading delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsLoadingMore(false);
  }, []);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
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
          <p className="text-gray-600">Loading collections...</p>
        </motion.div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-red-600 mb-2">Unable to Load Collections</h2>
          <p className="text-gray-600">{error.message}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 ${className}`}>
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4">
            {/* Top row */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <Smart7Badge size="lg" variant="default" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Smart7 Collections</h1>
                  <p className="text-sm text-gray-500">{collections.length} AI-curated collections</p>
                </div>
              </div>
              
              {/* View mode toggle */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setViewMode('cards')}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === 'cards' ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:bg-gray-100'
                  }`}
                  aria-label="Grid view"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode('compact')}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === 'compact' ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:bg-gray-100'
                  }`}
                  aria-label="List view"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Search bar */}
            {enableSearch && (
              <div className="relative mb-4">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search collections..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  aria-label="Search collections"
                />
                <svg className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                    aria-label="Clear search"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            )}

            {/* Filters */}
            {enableFilters && (
              <div className="flex items-center justify-between gap-4 overflow-x-auto pb-2">
                {/* Categories */}
                <div className="flex space-x-2 flex-shrink-0">
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                        selectedCategory === cat
                          ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                      aria-label={`Filter by ${cat === 'all' ? 'all categories' : cat}`}
                    >
                      {cat === 'all' ? 'All' : cat}
                    </button>
                  ))}
                </div>

                {/* Sort and filters */}
                <div className="flex items-center space-x-2 flex-shrink-0">
                  {/* Recommended toggle */}
                  {enableRecommendations && (
                    <button
                      onClick={() => setShowOnlyRecommended(!showOnlyRecommended)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all flex items-center space-x-1 ${
                        showOnlyRecommended
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                      aria-label={showOnlyRecommended ? 'Show all collections' : 'Show only recommended collections'}
                    >
                      <span>⭐</span>
                      <span>For You</span>
                    </button>
                  )}

                  {/* Sort dropdown */}
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-label="Sort collections"
                  >
                    <option value="popular">Most Popular</option>
                    <option value="recent">Recently Active</option>
                    <option value="alphabetical">A-Z</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Results count */}
        {searchQuery && (
          <p className="text-sm text-gray-600 mb-4">
            Found {filteredCollections.length} collection{filteredCollections.length !== 1 ? 's' : ''}
            {searchQuery && ` matching "${searchQuery}"`}
          </p>
        )}

        {/* Collections Grid/List */}
        <AnimatePresence mode="popLayout">
          {viewMode === 'cards' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCollections.map((collection, index) => (
                <motion.div
                  key={collection.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ 
                    opacity: 1, 
                    y: 0,
                    transition: { delay: index * 0.05 }
                  }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  whileHover={{ y: -5 }}
                  onClick={() => handleCollectionClick(collection.id)}
                  className="bg-white rounded-2xl shadow-lg overflow-hidden cursor-pointer hover:shadow-xl transition-all relative"
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleCollectionClick(collection.id);
                    }
                  }}
                  aria-label={`View ${collection.name} collection`}
                >
                  {/* Badges */}
                  <div className="absolute top-3 left-3 z-10 flex flex-wrap gap-2">
                    {collection.isRecommended && (
                      <span className="px-2 py-1 bg-green-500 text-white text-xs rounded-full font-medium">
                        For You
                      </span>
                    )}
                    {collection.isTrending && (
                      <span className="px-2 py-1 bg-orange-500 text-white text-xs rounded-full font-medium flex items-center space-x-1">
                        <span>🔥</span>
                        <span>Trending</span>
                      </span>
                    )}
                  </div>

                  {/* Cover image placeholder */}
                  <div className="h-40 bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 relative">
                    <div className="absolute inset-0 bg-black/20" />
                    <div className="absolute bottom-3 left-3 text-white">
                      <p className="text-3xl font-bold opacity-90">{collection.amenityCount || 0}</p>
                      <p className="text-xs opacity-75">amenities</p>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <h3 className="font-semibold text-lg mb-1 line-clamp-1">{collection.name}</h3>
                    {collection.description && (
                      <p className="text-sm text-gray-600 line-clamp-2 mb-3">{collection.description}</p>
                    )}
                    
                    {/* Tags */}
                    {collection.vibe_tags && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {collection.vibe_tags.split(',').slice(0, 3).map((tag, i) => (
                          <span 
                            key={i}
                            className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full"
                          >
                            {tag.trim()}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Stats */}
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center space-x-3">
                        <span className="flex items-center space-x-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          <span>{collection.popularityScore || 0}</span>
                        </span>
                        {collection.category && (
                          <span className="text-gray-400">{collection.category}</span>
                        )}
                      </div>
                      <Smart7Badge size="sm" variant="default" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredCollections.map((collection, index) => (
                <motion.div
                  key={collection.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ 
                    opacity: 1, 
                    x: 0,
                    transition: { delay: index * 0.02 }
                  }}
                  exit={{ opacity: 0, x: -20 }}
                  onClick={() => handleCollectionClick(collection.id)}
                  className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all p-4 cursor-pointer flex items-center justify-between"
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleCollectionClick(collection.id);
                    }
                  }}
                  aria-label={`View ${collection.name} collection`}
                >
                  <div className="flex items-center space-x-4 flex-1">
                    {/* Mini preview */}
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg flex items-center justify-center text-white font-bold">
                      {collection.amenityCount || 0}
                    </div>
                    
                    {/* Info */}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium">{collection.name}</h3>
                        {collection.isRecommended && <span className="text-green-500 text-sm">⭐</span>}
                        {collection.isTrending && <span className="text-orange-500 text-sm">🔥</span>}
                      </div>
                      {collection.description && (
                        <p className="text-sm text-gray-600 line-clamp-1">{collection.description}</p>
                      )}
                    </div>
                  </div>

                  {/* Right side */}
                  <div className="flex items-center space-x-3">
                    <div className="text-right text-sm text-gray-500">
                      <p>{collection.popularityScore || 0} views</p>
                      {collection.category && (
                        <p className="text-xs">{collection.category}</p>
                      )}
                    </div>
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>

        {/* Load more button */}
        {filteredCollections.length >= maxCollections && (
          <div className="text-center mt-8">
            <button
              onClick={handleLoadMore}
              disabled={isLoadingMore}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {isLoadingMore ? 'Loading...' : 'Load More Collections'}
            </button>
          </div>
        )}

        {/* Empty state */}
        {filteredCollections.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="text-6xl mb-4">🔍</div>
            <p className="text-gray-600 mb-4">
              {searchQuery 
                ? `No collections found for "${searchQuery}"`
                : 'No collections available'}
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Clear Search
              </button>
            )}
          </motion.div>
        )}
      </main>
    </div>
  );
};
