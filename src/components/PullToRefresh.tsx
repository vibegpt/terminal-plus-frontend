import React from 'react';
import { RefreshCw, CheckCircle } from 'lucide-react';
import { usePullToRefresh } from '../hooks/usePullToRefresh';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  enabled?: boolean;
  threshold?: number;
  children: React.ReactNode;
  className?: string;
}

export function PullToRefresh({ 
  onRefresh, 
  enabled = true, 
  threshold = 60,
  children,
  className = ''
}: PullToRefreshProps) {
  const { isPulling, pullDistance, isRefreshing } = usePullToRefresh({
    onRefresh,
    enabled,
    threshold
  });

  const progress = Math.min((pullDistance / threshold) * 100, 100);
  const shouldShowIndicator = isPulling || isRefreshing;

  return (
    <div className={`relative ${className}`}>
      {/* Pull to refresh indicator */}
      {shouldShowIndicator && (
        <div className={`
          pull-to-refresh
          ${isRefreshing ? 'opacity-100' : 'opacity-90'}
          ${isPulling ? 'translate-y-0' : '-translate-y-full'}
        `}>
          <div className="flex items-center gap-2">
            {isRefreshing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Refreshing...</span>
              </>
            ) : (
              <>
                <RefreshCw 
                  className="w-4 h-4 transition-transform duration-200"
                  style={{ 
                    transform: `rotate(${progress * 3.6}deg)`,
                    opacity: Math.min(progress / 50, 1)
                  }}
                />
                <span>
                  {pullDistance > threshold ? 'Release to refresh' : 'Pull to refresh'}
                </span>
              </>
            )}
          </div>
          
          {/* Progress bar */}
          <div className="w-full h-1 bg-white/20 rounded-full mt-2 overflow-hidden">
            <div 
              className="h-full bg-white rounded-full transition-all duration-200 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
      
      {/* Content */}
      <div className={shouldShowIndicator ? 'pt-16' : ''}>
        {children}
      </div>
    </div>
  );
}

// Alternative minimal pull to refresh
export function MinimalPullToRefresh({ 
  onRefresh, 
  enabled = true,
  children,
  className = ''
}: Omit<PullToRefreshProps, 'threshold'>) {
  const { isPulling, pullDistance, isRefreshing } = usePullToRefresh({
    onRefresh,
    enabled,
    threshold: 80
  });

  const shouldShowIndicator = isPulling && pullDistance > 40;

  return (
    <div className={`relative ${className}`}>
      {/* Minimal indicator */}
      {shouldShowIndicator && (
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 z-10">
          <div className="bg-gray-800 text-white px-3 py-1 rounded-full text-xs flex items-center gap-1">
            <RefreshCw className="w-3 h-3" />
            <span>Pull to refresh</span>
          </div>
        </div>
      )}
      
      {/* Loading overlay */}
      {isRefreshing && (
        <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-20 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-lg p-4 flex items-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
            <span className="text-sm font-medium">Refreshing...</span>
          </div>
        </div>
      )}
      
      {children}
    </div>
  );
}

export default PullToRefresh;
