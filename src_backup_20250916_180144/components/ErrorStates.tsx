// src/components/ErrorStates.tsx - Error state components
import React from 'react';
import { AlertCircle, WifiOff, SearchX, RefreshCw, AlertTriangle, Home } from 'lucide-react';
import { motion } from 'framer-motion';

interface ErrorStateProps {
  onRetry?: () => void;
  onClearFilters?: () => void;
  onGoHome?: () => void;
  collection?: any;
  message?: string;
  showHomeButton?: boolean;
}

export const NetworkError: React.FC<ErrorStateProps> = ({ onRetry, showHomeButton = true, onGoHome }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex flex-col items-center justify-center p-8"
  >
    <WifiOff className="h-16 w-16 text-red-400 mb-4" />
    <h3 className="text-xl font-bold text-white mb-2">Connection Lost</h3>
    <p className="text-white/60 text-center mb-6">
      Please check your internet connection and try again.
    </p>
    <div className="space-y-3">
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-6 py-3 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg text-blue-400 font-medium transition-all flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Try Again
        </button>
      )}
      {showHomeButton && onGoHome && (
        <button
          onClick={onGoHome}
          className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-lg text-white font-medium transition-all flex items-center gap-2"
        >
          <Home className="h-4 w-4" />
          Go Home
        </button>
      )}
    </div>
  </motion.div>
);

export const NoAmenitiesError: React.FC<ErrorStateProps> = ({ collection, onClearFilters, onGoHome }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex flex-col items-center justify-center p-8"
  >
    <SearchX className="h-16 w-16 text-yellow-400 mb-4" />
    <h3 className="text-xl font-bold text-white mb-2">
      No Amenities Found
    </h3>
    <p className="text-white/60 text-center mb-6">
      We couldn't find any amenities in "{collection?.name || 'this collection'}" matching your filters.
    </p>
    <div className="space-y-3">
      {onClearFilters && (
        <button
          onClick={onClearFilters}
          className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-lg text-white font-medium transition-all"
        >
          Clear Filters
        </button>
      )}
      {onGoHome && (
        <button
          onClick={onGoHome}
          className="px-6 py-3 text-white/60 hover:text-white transition-all"
        >
          Go Back
        </button>
      )}
    </div>
  </motion.div>
);

export const LoadingError: React.FC<ErrorStateProps> = ({ message, onRetry, showHomeButton = true, onGoHome }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex flex-col items-center justify-center p-8"
  >
    <AlertCircle className="h-16 w-16 text-orange-400 mb-4" />
    <h3 className="text-xl font-bold text-white mb-2">Loading Error</h3>
    <p className="text-white/60 text-center mb-6">
      {message || 'Unable to load amenities. Please try again.'}
    </p>
    <div className="space-y-3">
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-6 py-3 bg-orange-500/20 hover:bg-orange-500/30 rounded-lg text-orange-400 font-medium transition-all flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Retry
        </button>
      )}
      {showHomeButton && onGoHome && (
        <button
          onClick={onGoHome}
          className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-lg text-white font-medium transition-all flex items-center gap-2"
        >
          <Home className="h-4 w-4" />
          Go Home
        </button>
      )}
    </div>
  </motion.div>
);

export const ValidationError: React.FC<ErrorStateProps> = ({ message, onRetry, onGoHome }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex flex-col items-center justify-center p-8"
  >
    <AlertTriangle className="h-16 w-16 text-yellow-400 mb-4" />
    <h3 className="text-xl font-bold text-white mb-2">Invalid Request</h3>
    <p className="text-white/60 text-center mb-6">
      {message || 'The request contains invalid data. Please check and try again.'}
    </p>
    <div className="space-y-3">
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-6 py-3 bg-yellow-500/20 hover:bg-yellow-500/30 rounded-lg text-yellow-400 font-medium transition-all flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Try Again
        </button>
      )}
      {onGoHome && (
        <button
          onClick={onGoHome}
          className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-lg text-white font-medium transition-all flex items-center gap-2"
        >
          <Home className="h-4 w-4" />
          Go Home
        </button>
      )}
    </div>
  </motion.div>
);

export const SessionError: React.FC<ErrorStateProps> = ({ message, onRetry, onGoHome }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex flex-col items-center justify-center p-8"
  >
    <AlertCircle className="h-16 w-16 text-red-400 mb-4" />
    <h3 className="text-xl font-bold text-white mb-2">Session Expired</h3>
    <p className="text-white/60 text-center mb-6">
      {message || 'Your session has expired. Please refresh the page to continue.'}
    </p>
    <div className="space-y-3">
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-6 py-3 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-red-400 font-medium transition-all flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh Page
        </button>
      )}
      {onGoHome && (
        <button
          onClick={onGoHome}
          className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-lg text-white font-medium transition-all flex items-center gap-2"
        >
          <Home className="h-4 w-4" />
          Go Home
        </button>
      )}
    </div>
  </motion.div>
);

export const GenericError: React.FC<ErrorStateProps> = ({ message, onRetry, onGoHome }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex flex-col items-center justify-center p-8"
  >
    <AlertTriangle className="h-16 w-16 text-gray-400 mb-4" />
    <h3 className="text-xl font-bold text-white mb-2">Something Went Wrong</h3>
    <p className="text-white/60 text-center mb-6">
      {message || 'An unexpected error occurred. Please try again.'}
    </p>
    <div className="space-y-3">
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-6 py-3 bg-gray-500/20 hover:bg-gray-500/30 rounded-lg text-gray-400 font-medium transition-all flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Try Again
        </button>
      )}
      {onGoHome && (
        <button
          onClick={onGoHome}
          className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-lg text-white font-medium transition-all flex items-center gap-2"
        >
          <Home className="h-4 w-4" />
          Go Home
        </button>
      )}
    </div>
  </motion.div>
);

// Error state selector based on error type
export const ErrorStateSelector: React.FC<{
  errorType: 'network' | 'no-amenities' | 'loading' | 'validation' | 'session' | 'generic';
  error: any;
  onRetry?: () => void;
  onClearFilters?: () => void;
  onGoHome?: () => void;
  collection?: any;
}> = ({ errorType, error, onRetry, onClearFilters, onGoHome, collection }) => {
  const props = { onRetry, onClearFilters, onGoHome, collection, message: error?.message };

  switch (errorType) {
    case 'network':
      return <NetworkError {...props} />;
    case 'no-amenities':
      return <NoAmenitiesError {...props} />;
    case 'loading':
      return <LoadingError {...props} />;
    case 'validation':
      return <ValidationError {...props} />;
    case 'session':
      return <SessionError {...props} />;
    case 'generic':
    default:
      return <GenericError {...props} />;
  }
};
