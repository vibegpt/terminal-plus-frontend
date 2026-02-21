import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, 
  Clock, 
  Database, 
  TrendingUp, 
  Zap,
  AlertCircle,
  CheckCircle,
  X
} from 'lucide-react';

interface PerformanceMetrics {
  essential_load_time?: number;
  detail_load_time?: number;
  media_load_time?: number;
  essential_data_size?: number;
  detail_data_size?: number;
  media_data_size?: number;
  cache_hit_essential?: number;
  cache_hit_detail?: number;
  cache_hit_media?: number;
  cache_hit_full?: number;
}

interface PerformanceMonitorProps {
  metrics: PerformanceMetrics;
  loadingState: string;
  progress: {
    essential: number;
    detail: number;
    media: number;
    total: number;
  };
  onClose?: () => void;
  showDetails?: boolean;
}

const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  metrics,
  loadingState,
  progress,
  onClose,
  showDetails = false
}) => {
  const [isExpanded, setIsExpanded] = useState(showDetails);
  const [isVisible, setIsVisible] = useState(true);

  // Auto-hide after 10 seconds if not expanded
  useEffect(() => {
    if (!isExpanded) {
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [isExpanded]);

  if (!isVisible) return null;

  // Calculate performance scores
  const getPerformanceScore = (): number => {
    let score = 0;
    
    // Essential load time score (target: < 300ms)
    if (metrics.essential_load_time) {
      if (metrics.essential_load_time < 300) score += 40;
      else if (metrics.essential_load_time < 500) score += 30;
      else if (metrics.essential_load_time < 1000) score += 20;
      else score += 10;
    }
    
    // Cache hit rate score (target: > 80%)
    const totalCacheHits = (metrics.cache_hit_essential || 0) + 
                          (metrics.cache_hit_detail || 0) + 
                          (metrics.cache_hit_media || 0);
    if (totalCacheHits > 0) score += 30;
    
    // Data size score (target: < 50KB)
    if (metrics.essential_data_size) {
      const sizeKB = metrics.essential_data_size / 1024;
      if (sizeKB < 50) score += 30;
      else if (sizeKB < 100) score += 20;
      else if (sizeKB < 200) score += 10;
    }
    
    return Math.min(100, score);
  };

  const getPerformanceColor = (score: number): string => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getPerformanceLabel = (score: number): string => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Poor';
  };

  const performanceScore = getPerformanceScore();
  const performanceColor = getPerformanceColor(performanceScore);
  const performanceLabel = getPerformanceLabel(performanceScore);

  // Format data size
  const formatDataSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };

  // Format time
  const formatTime = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="fixed bottom-4 right-4 z-50"
    >
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            <span className="font-semibold">Performance Monitor</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 hover:bg-white/20 rounded transition-colors"
            >
              {isExpanded ? <TrendingUp className="w-4 h-4" /> : <Database className="w-4 h-4" />}
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="p-1 hover:bg-white/20 rounded transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Performance Score */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Performance Score
            </span>
            <span className={`text-lg font-bold ${performanceColor}`}>
              {performanceScore}/100
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-500 ${
                  performanceScore >= 80 ? 'bg-green-500' :
                  performanceScore >= 60 ? 'bg-yellow-500' :
                  'bg-red-500'
                }`}
                style={{ width: `${performanceScore}%` }}
              />
            </div>
            <span className={`text-sm font-medium ${performanceColor}`}>
              {performanceLabel}
            </span>
          </div>
        </div>

        {/* Loading Progress */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-blue-500" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Loading Progress
            </span>
          </div>
          
          <div className="space-y-2">
            {/* Essential Data */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600 dark:text-gray-400">Essential</span>
              <div className="flex items-center gap-2">
                <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                  <div
                    className="bg-green-500 h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${(progress.essential / progress.total) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  {progress.essential}/{progress.total}
                </span>
              </div>
            </div>

            {/* Detail Data */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600 dark:text-gray-400">Detail</span>
              <div className="flex items-center gap-2">
                <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                  <div
                    className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${(progress.detail / progress.total) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  {progress.detail}/{progress.total}
                </span>
              </div>
            </div>

            {/* Media Data */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600 dark:text-gray-400">Media</span>
              <div className="flex items-center gap-2">
                <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                  <div
                    className="bg-purple-500 h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${(progress.media / progress.total) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  {progress.media}/{progress.total}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Current State */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-yellow-500" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Current State
            </span>
          </div>
          <div className="flex items-center gap-2">
            {loadingState === 'complete' ? (
              <CheckCircle className="w-4 h-4 text-green-500" />
            ) : (
              <AlertCircle className="w-4 h-4 text-yellow-500" />
            )}
            <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
              {loadingState}
            </span>
          </div>
        </div>

        {/* Detailed Metrics (Expandable) */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="border-t border-gray-200 dark:border-gray-700"
            >
              <div className="p-4 space-y-3">
                <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Performance Metrics
                </h4>
                
                {/* Load Times */}
                <div className="space-y-2">
                  <h5 className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Load Times
                  </h5>
                  {metrics.essential_load_time && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Essential:</span>
                      <span className={metrics.essential_load_time < 300 ? 'text-green-600' : 'text-red-600'}>
                        {formatTime(metrics.essential_load_time)}
                      </span>
                    </div>
                  )}
                  {metrics.detail_load_time && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Detail:</span>
                      <span className="text-gray-700 dark:text-gray-300">
                        {formatTime(metrics.detail_load_time)}
                      </span>
                    </div>
                  )}
                  {metrics.media_load_time && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Media:</span>
                      <span className="text-gray-700 dark:text-gray-300">
                        {formatTime(metrics.media_load_time)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Data Sizes */}
                <div className="space-y-2">
                  <h5 className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Data Sizes
                  </h5>
                  {metrics.essential_data_size && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Essential:</span>
                      <span className={metrics.essential_data_size < 51200 ? 'text-green-600' : 'text-red-600'}>
                        {formatDataSize(metrics.essential_data_size)}
                      </span>
                    </div>
                  )}
                  {metrics.detail_data_size && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Detail:</span>
                      <span className="text-gray-700 dark:text-gray-300">
                        {formatDataSize(metrics.detail_data_size)}
                      </span>
                    </div>
                  )}
                  {metrics.media_data_size && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Media:</span>
                      <span className="text-gray-700 dark:text-gray-300">
                        {formatDataSize(metrics.media_data_size)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Cache Performance */}
                <div className="space-y-2">
                  <h5 className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Cache Performance
                  </h5>
                  {metrics.cache_hit_essential && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Essential Cache:</span>
                      <span className="text-green-600">Hit</span>
                    </div>
                  )}
                  {metrics.cache_hit_detail && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Detail Cache:</span>
                      <span className="text-green-600">Hit</span>
                    </div>
                  )}
                  {metrics.cache_hit_media && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Media Cache:</span>
                      <span className="text-green-600">Hit</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default PerformanceMonitor;
