import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Zap, 
  Clock, 
  Database, 
  TrendingUp,
  Terminal,
  Plane,
  Coffee,
  ShoppingBag,
  Utensils,
  Wifi,
  AlertCircle
} from 'lucide-react';
import { useProgressiveLoading } from '../hooks/useProgressiveLoading';
import PerformanceMonitor from '../components/PerformanceMonitor';

const ProgressiveLoadingDemo: React.FC = () => {
  const [selectedTerminal, setSelectedTerminal] = useState('SIN-T3');
  const [showPerformanceMonitor, setShowPerformanceMonitor] = useState(true);

  const {
    amenities,
    loadingState,
    loadingPriorities,
    preloadStrategies,
    performanceMetrics,
    error,
    progress,
    loadDetailData,
    loadMediaData,
    refreshData,
    preloadAdjacentTerminals
  } = useProgressiveLoading({
    terminal: selectedTerminal,
    enablePreloading: true,
    enableBackgroundLoading: true
  });

  const terminals = [
    { code: 'SIN-T1', name: 'Singapore Terminal 1', amenities: 150 },
    { code: 'SIN-T2', name: 'Singapore Terminal 2', amenities: 180 },
    { code: 'SIN-T3', name: 'Singapore Terminal 3', amenities: 200 },
    { code: 'SIN-T4', name: 'Singapore Terminal 4', amenities: 120 },
    { code: 'SIN-JW', name: 'Singapore Jewel', amenities: 33 }
  ];

  const getLoadingStateColor = (state: string) => {
    switch (state) {
      case 'complete': return 'text-green-500';
      case 'media': return 'text-purple-500';
      case 'detail': return 'text-blue-500';
      case 'essential': return 'text-yellow-500';
      default: return 'text-gray-500';
    }
  };

  const getLoadingStateIcon = (state: string) => {
    switch (state) {
      case 'complete': return <Database className="w-4 h-4" />;
      case 'media': return <TrendingUp className="w-4 h-4" />;
      case 'detail': return <Clock className="w-4 h-4" />;
      case 'essential': return <Zap className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getVibeIcon = (vibe: string) => {
    if (vibe.includes('coffee') || vibe.includes('food')) return <Coffee className="w-4 h-4" />;
    if (vibe.includes('shop')) return <ShoppingBag className="w-4 h-4" />;
    if (vibe.includes('dine')) return <Utensils className="w-4 h-4" />;
    if (vibe.includes('work')) return <Wifi className="w-4 h-4" />;
    return <Plane className="w-4 h-4" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Progressive Loading Demo
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Optimal loading strategy for airport amenity app
              </p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowPerformanceMonitor(!showPerformanceMonitor)}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                {showPerformanceMonitor ? 'Hide' : 'Show'} Performance Monitor
              </button>
              <button
                onClick={refreshData}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                Refresh Data
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Terminal Selection & Loading Strategy */}
          <div className="space-y-6">
            {/* Terminal Selection */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Terminal Selection
              </h2>
              <div className="space-y-3">
                {terminals.map((terminal) => (
                  <button
                    key={terminal.code}
                    onClick={() => setSelectedTerminal(terminal.code)}
                    className={`w-full p-4 rounded-xl border-2 transition-all ${
                      selectedTerminal === terminal.code
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-left">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {terminal.name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          ~{terminal.amenities} amenities
                        </div>
                      </div>
                      <Terminal className="w-5 h-5 text-gray-400" />
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Loading Strategy */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Loading Strategy
              </h2>
              <div className="space-y-4">
                {loadingPriorities.map((priority) => (
                  <div key={priority.priority} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                        {priority.priority}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {priority.description}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {priority.estimatedAmenities} amenities
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        {priority.loadStrategy}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Preload Strategies */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Time-Based Preloading
              </h2>
              <div className="space-y-3">
                {preloadStrategies.map((strategy, index) => (
                  <div key={index} className="p-3 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-purple-900 dark:text-purple-100 capitalize">
                        {strategy.timeOfDay}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        strategy.priority === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200' :
                        strategy.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200' :
                        'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200'
                      }`}>
                        {strategy.priority} priority
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {strategy.vibeCategories.map((vibe) => (
                        <span key={vibe} className="text-xs bg-white dark:bg-slate-700 px-2 py-1 rounded-full text-purple-700 dark:text-purple-300">
                          {vibe}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Center Column - Amenities Display */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                    Amenities in {selectedTerminal}
                  </h2>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-2">
                      {getLoadingStateIcon(loadingState)}
                      <span className={`font-medium ${getLoadingStateColor(loadingState)} capitalize`}>
                        {loadingState}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {amenities.length} amenities loaded
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => loadDetailData(amenities.slice(0, 5).map(a => a.essential.amenity_slug))}
                    disabled={loadingState === 'initial'}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Load Details
                  </button>
                  <button
                    onClick={() => loadMediaData(amenities.slice(0, 3).map(a => a.essential.amenity_slug))}
                    disabled={loadingState === 'initial'}
                    className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Load Media
                  </button>
                </div>
              </div>

              {/* Loading Progress */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Loading Progress
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {progress.essential + progress.detail + progress.media} / {progress.total}
                  </span>
                </div>
                <div className="flex gap-1 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-green-500 transition-all duration-500"
                    style={{ width: `${(progress.essential / progress.total) * 100}%` }}
                  />
                  <div
                    className="bg-blue-500 transition-all duration-500"
                    style={{ width: `${(progress.detail / progress.total) * 100}%` }}
                  />
                  <div
                    className="bg-purple-500 transition-all duration-500"
                    style={{ width: `${(progress.media / progress.total) * 100}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <span>Essential: {progress.essential}</span>
                  <span>Detail: {progress.detail}</span>
                  <span>Media: {progress.media}</span>
                </div>
              </div>

              {/* Amenities Grid */}
              {error ? (
                <div className="text-center py-8 text-red-500">
                  <AlertCircle className="w-12 h-12 mx-auto mb-4" />
                  <p className="text-lg font-medium">Error loading amenities</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{error}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {amenities.map((amenity, index) => (
                    <motion.div
                      key={amenity.essential.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getVibeIcon(amenity.essential.vibe_tags)}
                          <span className="font-medium text-gray-900 dark:text-white">
                            {amenity.essential.amenity_slug}
                          </span>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          amenity.essential.price_level === 'budget' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200' :
                          amenity.essential.price_level === 'premium' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-200' :
                          'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200'
                        }`}>
                          {amenity.essential.price_level}
                        </span>
                      </div>
                      
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        Terminal: {amenity.essential.terminal_code}
                      </div>
                      
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                        Vibe: {amenity.essential.vibe_tags}
                      </div>

                      {/* Loading State Indicators */}
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          amenity.loadingState === 'essential' ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                        }`} />
                        <div className={`w-2 h-2 rounded-full ${
                          amenity.loadingState === 'detail' ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                        }`} />
                        <div className={`w-2 h-2 rounded-full ${
                          amenity.loadingState === 'media' ? 'bg-purple-500' : 'bg-gray-300 dark:bg-gray-600'
                        }`} />
                        <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                          {amenity.loadingState}
                        </span>
                      </div>

                      {/* Detail Data (if loaded) */}
                      {amenity.detail && (
                        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                          <div className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                            {amenity.detail.name}
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">
                            {amenity.detail.description}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Hours: {amenity.detail.opening_hours}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Performance Monitor */}
      {showPerformanceMonitor && (
        <PerformanceMonitor
          metrics={performanceMetrics}
          loadingState={loadingState}
          progress={progress}
          onClose={() => setShowPerformanceMonitor(false)}
          showDetails={true}
        />
      )}
    </div>
  );
};

export default ProgressiveLoadingDemo;
