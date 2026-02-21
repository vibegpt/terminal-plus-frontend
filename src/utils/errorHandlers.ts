// src/utils/errorHandlers.ts - Error handling utilities
export class NavigationError extends Error {
  code: string;
  context: any;

  constructor(message: string, code: string, context: any) {
    super(message);
    this.name = 'NavigationError';
    this.code = code;
    this.context = context;
  }
}

export class DataFetchError extends Error {
  code: string;
  context: any;

  constructor(message: string, code: string, context: any) {
    super(message);
    this.name = 'DataFetchError';
    this.code = code;
    this.context = context;
  }
}

export const ErrorCodes = {
  // Navigation errors
  INVALID_COLLECTION: 'NAV_001',
  MISSING_CONTEXT: 'NAV_002',
  DEEP_LINK_FAILED: 'NAV_003',
  
  // Data errors
  SUPABASE_CONNECTION: 'DATA_001',
  NO_AMENITIES: 'DATA_002',
  INVALID_AIRPORT: 'DATA_003',
  
  // User errors
  NETWORK_OFFLINE: 'USER_001',
  SESSION_EXPIRED: 'USER_002'
};

export interface ErrorRecovery {
  type: 'network' | 'navigation' | 'data' | 'user' | 'unknown';
  message: string;
  recoverable: boolean;
  action: 'retry' | 'redirect' | 'show_empty' | 'fallback';
  redirectTo?: string;
  fallbackData?: any;
}

export const handleError = (error: Error, context: any = {}): ErrorRecovery => {
  console.error(`Error in ${context.component || 'unknown'}:`, error);
  
  // Determine error type and recovery strategy
  if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
    return {
      type: 'network',
      message: 'Connection issue. Please check your internet.',
      recoverable: true,
      action: 'retry'
    };
  }
  
  if (error instanceof NavigationError) {
    switch (error.code) {
      case ErrorCodes.INVALID_COLLECTION:
        return {
          type: 'navigation',
          message: 'Collection not found.',
          recoverable: true,
          action: 'redirect',
          redirectTo: '/collections'
        };
      
      case ErrorCodes.MISSING_CONTEXT:
        return {
          type: 'navigation',
          message: 'Missing context. Redirecting to collections.',
          recoverable: true,
          action: 'redirect',
          redirectTo: '/collections'
        };
      
      case ErrorCodes.DEEP_LINK_FAILED:
        return {
          type: 'navigation',
          message: 'Deep link failed. Please try navigating manually.',
          recoverable: true,
          action: 'fallback'
        };
      
      default:
        return {
          type: 'navigation',
          message: 'Navigation error occurred.',
          recoverable: true,
          action: 'redirect',
          redirectTo: '/collections'
        };
    }
  }
  
  if (error instanceof DataFetchError) {
    switch (error.code) {
      case ErrorCodes.SUPABASE_CONNECTION:
        return {
          type: 'data',
          message: 'Database connection issue. Please try again.',
          recoverable: true,
          action: 'retry'
        };
      
      case ErrorCodes.NO_AMENITIES:
        return {
          type: 'data',
          message: 'No amenities available for this collection.',
          recoverable: false,
          action: 'show_empty'
        };
      
      case ErrorCodes.INVALID_AIRPORT:
        return {
          type: 'data',
          message: 'Invalid airport code. Please check the URL.',
          recoverable: false,
          action: 'redirect',
          redirectTo: '/collections'
        };
      
      default:
        return {
          type: 'data',
          message: 'Data loading error. Please try again.',
          recoverable: true,
          action: 'retry'
        };
    }
  }
  
  // Check for specific error patterns
  if (error.message.includes('offline') || !navigator.onLine) {
    return {
      type: 'user',
      message: 'You appear to be offline. Please check your connection.',
      recoverable: true,
      action: 'retry'
    };
  }
  
  if (error.message.includes('session') || error.message.includes('expired')) {
    return {
      type: 'user',
      message: 'Session expired. Please refresh the page.',
      recoverable: true,
      action: 'retry'
    };
  }
  
  // Default error
  return {
    type: 'unknown',
    message: 'Something went wrong. Please try again.',
    recoverable: true,
    action: 'retry'
  };
};

// Error reporting utilities
export const reportError = (error: Error, context: any = {}) => {
  const errorReport = {
    message: error.message,
    name: error.name,
    stack: error.stack,
    timestamp: new Date().toISOString(),
    url: window.location.href,
    userAgent: navigator.userAgent,
    context
  };
  
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.group('Error Report');
    console.error('Error:', error);
    console.error('Context:', context);
    console.error('Report:', errorReport);
    console.groupEnd();
  }
  
  // Store in sessionStorage for debugging
  try {
    const errorReports = JSON.parse(sessionStorage.getItem('errorReports') || '[]');
    errorReports.push(errorReport);
    sessionStorage.setItem('errorReports', JSON.stringify(errorReports.slice(-10)));
  } catch (storageError) {
    console.warn('Failed to save error report:', storageError);
  }
  
  // Send to error reporting service if available
  if (window.gtag) {
    window.gtag('event', 'exception', {
      description: error.message,
      fatal: false,
      custom_map: {
        error_name: error.name,
        error_stack: error.stack?.slice(0, 500),
        context: JSON.stringify(context)
      }
    });
  }
};

// Network status monitoring
export const monitorNetworkStatus = () => {
  const updateNetworkStatus = () => {
    const isOnline = navigator.onLine;
    document.body.setAttribute('data-online', isOnline.toString());
    
    if (!isOnline) {
      console.warn('Network is offline');
      // Could trigger offline mode UI
    }
  };
  
  window.addEventListener('online', updateNetworkStatus);
  window.addEventListener('offline', updateNetworkStatus);
  
  // Initial check
  updateNetworkStatus();
  
  // Return cleanup function
  return () => {
    window.removeEventListener('online', updateNetworkStatus);
    window.removeEventListener('offline', updateNetworkStatus);
  };
};
