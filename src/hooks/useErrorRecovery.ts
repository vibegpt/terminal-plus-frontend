// src/hooks/useErrorRecovery.ts - Error recovery hook
import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { handleError, ErrorRecovery } from '../utils/errorHandlers';

interface ErrorRecoveryOptions {
  maxRetries?: number;
  onRetry?: () => void;
  fallbackPath?: string;
  autoRetry?: boolean;
  retryDelay?: number;
}

interface ErrorState {
  hasError: boolean;
  error: Error | null;
  recovery: ErrorRecovery | null;
  retryCount: number;
  isRecovering: boolean;
}

export const useErrorRecovery = (options: ErrorRecoveryOptions = {}) => {
  const navigate = useNavigate();
  const {
    maxRetries = 3,
    onRetry = null,
    fallbackPath = '/collections',
    autoRetry = true,
    retryDelay = 2000
  } = options;

  const [errorState, setErrorState] = useState<ErrorState>({
    hasError: false,
    error: null,
    recovery: null,
    retryCount: 0,
    isRecovering: false
  });

  const handleError = useCallback((error: Error, context: any = {}) => {
    const recovery = handleError(error, context);
    
    setErrorState(prev => ({
      hasError: true,
      error,
      recovery,
      retryCount: prev.retryCount + 1,
      isRecovering: false
    }));
    
    // Auto-retry for network errors
    if (autoRetry && recovery.type === 'network' && errorState.retryCount < maxRetries) {
      const delay = retryDelay * Math.pow(2, errorState.retryCount); // Exponential backoff
      
      setTimeout(() => {
        setErrorState(prev => ({ ...prev, isRecovering: true }));
        if (onRetry) {
          onRetry();
        }
      }, delay);
    }
    
    // Auto-redirect for navigation errors
    if (recovery.type === 'navigation' && recovery.redirectTo) {
      setTimeout(() => {
        navigate(recovery.redirectTo || fallbackPath);
      }, 2000);
    }
    
    // Handle non-recoverable errors
    if (!recovery.recoverable) {
      console.error('Non-recoverable error:', error);
      // Could trigger global error state or user notification
    }
  }, [errorState.retryCount, maxRetries, autoRetry, retryDelay, onRetry, navigate, fallbackPath]);

  const clearError = useCallback(() => {
    setErrorState({
      hasError: false,
      error: null,
      recovery: null,
      retryCount: 0,
      isRecovering: false
    });
  }, []);

  const retry = useCallback((callback?: () => void) => {
    setErrorState(prev => ({ ...prev, isRecovering: true }));
    
    if (callback) {
      callback();
    } else if (onRetry) {
      onRetry();
    }
  }, [onRetry]);

  const resetRetryCount = useCallback(() => {
    setErrorState(prev => ({ ...prev, retryCount: 0 }));
  }, []);

  // Auto-clear error after successful recovery
  useEffect(() => {
    if (errorState.isRecovering && !errorState.hasError) {
      const timer = setTimeout(() => {
        clearError();
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [errorState.isRecovering, errorState.hasError, clearError]);

  // Network status monitoring
  useEffect(() => {
    const handleOnline = () => {
      if (errorState.recovery?.type === 'network') {
        // Auto-retry when network comes back online
        setTimeout(() => {
          retry();
        }, 1000);
      }
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [errorState.recovery, retry]);

  return {
    ...errorState,
    handleError,
    clearError,
    retry,
    resetRetryCount,
    
    // Convenience methods
    isNetworkError: errorState.recovery?.type === 'network',
    isNavigationError: errorState.recovery?.type === 'navigation',
    isDataError: errorState.recovery?.type === 'data',
    canRetry: errorState.recovery?.recoverable && errorState.retryCount < maxRetries,
    shouldRedirect: errorState.recovery?.action === 'redirect',
    redirectPath: errorState.recovery?.redirectTo || fallbackPath
  };
};

// Specialized error recovery hooks
export const useNetworkErrorRecovery = (options: ErrorRecoveryOptions = {}) => {
  return useErrorRecovery({
    ...options,
    autoRetry: true,
    retryDelay: 1000
  });
};

export const useNavigationErrorRecovery = (options: ErrorRecoveryOptions = {}) => {
  return useErrorRecovery({
    ...options,
    autoRetry: false,
    fallbackPath: '/collections'
  });
};

export const useDataErrorRecovery = (options: ErrorRecoveryOptions = {}) => {
  return useErrorRecovery({
    ...options,
    autoRetry: true,
    retryDelay: 3000
  });
};
