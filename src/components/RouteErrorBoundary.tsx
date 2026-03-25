import React from 'react';
import { useRouteError, isRouteErrorResponse } from 'react-router-dom';
import { AlertTriangle, Home, RefreshCw, WifiOff } from 'lucide-react';

export function RouteErrorBoundary() {
  const error = useRouteError();
  
  // Different error types
  if (isRouteErrorResponse(error)) {
    if (error.status === 404) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            <div className="text-6xl mb-4">🔍</div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">404 - Page Not Found</h1>
            <p className="text-gray-600 mb-6">This amenity or collection doesn't exist.</p>
            <button 
              onClick={() => window.location.href = '/'}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <Home className="h-4 w-4" />
              Back to Terminal
            </button>
          </div>
        </div>
      );
    }
    
    if (error.status === 503) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            <WifiOff className="h-16 w-16 text-orange-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Airport WiFi Issues</h1>
            <p className="text-gray-600 mb-6">Connection problems. Using offline mode.</p>
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <p className="text-sm text-orange-800">
                Some features may be limited while offline. Your data will sync when connection is restored.
              </p>
            </div>
          </div>
        </div>
      );
    }

    if (error.status >= 500) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Server Error</h1>
            <p className="text-gray-600 mb-6">Our systems are experiencing issues. Please try again later.</p>
            <button 
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </button>
          </div>
        </div>
      );
    }
  }
  
  // Generic error fallback
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <AlertTriangle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Something went wrong</h1>
        <p className="text-gray-600 mb-6">An unexpected error occurred. Please try again.</p>
        <div className="space-y-3">
          <button 
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors mr-3"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </button>
          <button 
            onClick={() => window.location.href = '/'}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            <Home className="h-4 w-4" />
            Back to Home
          </button>
        </div>
        
        {/* Debug info in development */}
        {import.meta.env.DEV && (
          <details className="mt-6 text-left">
            <summary className="text-gray-500 text-sm cursor-pointer">
              Error Details
            </summary>
            <pre className="mt-2 text-xs text-gray-400 overflow-auto bg-gray-100 p-2 rounded">
              {error instanceof Error ? error.toString() : JSON.stringify(error, null, 2)}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}

export default RouteErrorBoundary;
