import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

// Components
import { CollectionGrid } from '../components/CollectionGrid';
import { ContextControls } from '../components/ContextControls';
import { RefreshButton } from '../components/RefreshButton';
import { Smart7Badge } from '../components/Smart7Badge';

// Hooks
import { useTracking } from '../hooks/useTracking';
import { useSmart7Selection } from '../hooks/useSmart7Selection';
import { useOptimizedSmart7 } from '../hooks/useOptimizedSmart7';
import { useSupabaseData } from '../hooks/useSupabaseData';

// Types
import type { Smart7Context } from '../types/tracking';
import type { Collection } from '../types/supabase';

interface Smart7IntegrationPageProps {
  defaultTerminal?: string;
  enableAnalytics?: boolean;
  enableOfflineMode?: boolean;
  enableABTesting?: boolean;
}

export const Smart7IntegrationPage: React.FC<Smart7IntegrationPageProps> = ({
  defaultTerminal = 'T1',
  enableAnalytics = true,
  enableOfflineMode = true,
  enableABTesting = false
}) => {
  const { collectionId } = useParams<{ collectionId: string }>();
  const navigate = useNavigate();
  
  // State management
  const [userContext, setUserContext] = useState<Smart7Context>({
    userTerminal: defaultTerminal,
    pricePreference: 'any',
    timeOfDay: 'auto',
    walkingSpeed: 'normal'
  });
  
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showTutorial, setShowTutorial] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Get collection data
  const { collections, loading: collectionsLoading } = useSupabaseData();
  
  // Smart7 selection with optimization
  const {
    selections,
    loading: selectionsLoading,
    refresh: refreshSelections,
    updateContext: updateSmart7Context,
    error: selectionError
  } = useSmart7Selection({
    collectionId: parseInt(collectionId || '0'),
    initialContext: {
      currentTime: new Date(),
      userTerminal: userContext.userTerminal,
      userPriceLevel: userContext.pricePreference,
      userLayoverDuration: 60
    }
  });

  // Performance optimization hook
  const {
    fromCache,
    loadTime,
    cacheSize,
    optimizations
  } = useOptimizedSmart7({
    collectionId: parseInt(collectionId || '0'),
    enableOptimizations: true,
    enableOfflineMode,
    reducedDataMode: false
  });

  // Tracking setup
  const {
    trackView,
    trackClick,
    trackShare,
    trackBookmark,
    sessionId,
    interactionCount
  } = useTracking({
    collectionId: parseInt(collectionId || '0'),
    enableAnalytics
  });

  // Load collection data on mount
  useEffect(() => {
    if (collectionId && collections.length > 0) {
      const collection = collections.find(c => c.id === parseInt(collectionId));
      if (collection) {
        setSelectedCollection(collection);
        setIsLoading(false);
        
        // Track collection view
        trackView();
        
        // Check if first visit for tutorial
        const hasSeenTutorial = sessionStorage.getItem('smart7_tutorial_seen');
        if (!hasSeenTutorial) {
          setShowTutorial(true);
          sessionStorage.setItem('smart7_tutorial_seen', 'true');
        }
      } else {
        // Collection not found
        setIsLoading(false);
      }
    }
  }, [collectionId, collections, trackView]);

  // Update Smart7 context when user preferences change
  useEffect(() => {
    if (updateSmart7Context) {
      updateSmart7Context({
        userTerminal: userContext.userTerminal,
        userPriceLevel: userContext.pricePreference,
        userLayoverDuration: 60
      });
    }
  }, [userContext, updateSmart7Context]);

  // Handle context changes from controls
  const handleContextChange = useCallback((newContext: Smart7Context) => {
    setUserContext(newContext);
    
    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  }, []);

  // Handle amenity click
  const handleAmenityClick = useCallback((amenityId: number) => {
    trackClick(amenityId);
    
    // Could navigate to amenity detail page
    // navigate(`/amenity/${amenityId}`);
  }, [trackClick]);

  // Handle share
  const handleShare = useCallback(async () => {
    if (navigator.share && selectedCollection) {
      try {
        await navigator.share({
          title: `Smart7: ${selectedCollection.name}`,
          text: `Check out these AI-selected amenities at ${userContext.userTerminal}`,
          url: window.location.href
        });
        trackShare();
      } catch (err) {
        console.log('Share cancelled');
      }
    }
  }, [selectedCollection, userContext.userTerminal, trackShare]);

  // Handle refresh with animation
  const handleRefresh = useCallback(async () => {
    const startTime = Date.now();
    await refreshSelections();
    const endTime = Date.now();
    
    // Log performance
    if (enableAnalytics) {
      console.log(`Refresh took ${endTime - startTime}ms`);
    }
  }, [refreshSelections, enableAnalytics]);

  // Loading state
  if (isLoading || collectionsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <Smart7Badge size="lg" pulse variant="premium" />
          <p className="mt-4 text-gray-600">Initializing Smart7 AI...</p>
        </motion.div>
      </div>
    );
  }

  // Error state
  if (!selectedCollection) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😕</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Collection Not Found</h2>
          <p className="text-gray-600 mb-4">Collection #{collectionId} doesn't exist</p>
          <button
            onClick={() => navigate('/collections')}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Browse Collections
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header Bar */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left: Back button and title */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{selectedCollection.name}</h1>
                <p className="text-xs text-gray-500">
                  {selections.length} amenities • {interactionCount} interactions this session
                </p>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center space-x-2">
              {/* Share button */}
              <button
                onClick={handleShare}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m9.032 4.026a9.001 9 0 01-7.522 3.756 9 9 0 01-7.522-3.756M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>

              {/* View mode toggle */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-1 rounded-md text-sm transition-all ${
                    viewMode === 'grid' 
                      ? 'bg-white shadow-sm text-gray-900' 
                      : 'text-gray-600'
                  }`}
                >
                  Grid
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-1 rounded-md text-sm transition-all ${
                    viewMode === 'list' 
                      ? 'bg-white shadow-sm text-gray-900' 
                      : 'text-gray-600'
                  }`}
                >
                  List
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Performance Metrics Bar (dev mode) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-gray-900 text-white text-xs py-2 px-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <span>Session: {sessionId?.slice(0, 8) || 'N/A'}</span>
            <span>Cache: {fromCache ? `✓ ${loadTime}ms` : '✗'}</span>
            <span>Size: {cacheSize ? `${(cacheSize / 1024).toFixed(1)}KB` : 'N/A'}</span>
            <span>Mode: {optimizations?.offlineMode ? 'Offline' : 'Online'}</span>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Context Controls */}
        <div className="mb-8">
          <ContextControls
            onContextChange={handleContextChange}
            currentContext={userContext}
            availableTerminals={['T1', 'T2', 'T3', 'T4']}
            compact={false}
            showAdvanced={true}
            enableAutoContext={true}
          />
        </div>

        {/* Selection Error */}
        {selectionError && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg"
          >
            <p className="text-red-600 text-sm">
              {selectionError.message || 'Failed to load Smart7 selections'}
            </p>
            <button
              onClick={handleRefresh}
              className="mt-2 text-red-600 underline text-sm"
            >
              Try again
            </button>
          </motion.div>
        )}

        {/* Collection Grid */}
        <CollectionGrid
          collectionId={selectedCollection.id}
          collectionName={selectedCollection.name}
          userTerminal={userContext.userTerminal}
          onAmenityClick={handleAmenityClick}
          showReasons={true}
          enableSwipeGestures={true}
          amenities={selections}
          isLoading={selectionsLoading}
        />
      </main>

      {/* Floating Refresh Button */}
      <RefreshButton
        onClick={handleRefresh}
        isRefreshing={selectionsLoading}
        loadTime={loadTime || 0}
        variant="floating"
        position="fixed"
        showLoadTime={false}
      />

      {/* Tutorial Overlay */}
      <AnimatePresence>
        {showTutorial && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowTutorial(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <Smart7Badge size="lg" variant="premium" className="mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-center mb-4">Welcome to Smart7</h2>
              <div className="space-y-4 text-sm text-gray-600">
                <div className="flex items-start space-x-3">
                  <span className="text-2xl">🤖</span>
                  <p>AI selects the best 7 amenities based on your preferences and context</p>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="text-2xl">👆</span>
                  <p>Swipe up or tap refresh to get new selections</p>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="text-2xl">⚙️</span>
                  <p>Adjust your terminal and preferences to personalize results</p>
                </div>
              </div>
              <button
                onClick={() => setShowTutorial(false)}
                className="w-full mt-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
              >
                Got it!
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
