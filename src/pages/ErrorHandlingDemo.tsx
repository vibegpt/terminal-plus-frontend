import React, { useState } from 'react';
import { ErrorAlert } from '../components/ErrorAlert';
import { ErrorService, ErrorType, AppError } from '../services/errorService';
import { useVibeAmenities } from '../hooks/useVibeAmenities';
import { triggerTestError, createTestAppError, testErrorScenarios, devErrorUtils } from '../utils/testErrors';
import { AlertTriangle, WifiOff, Clock, Shield, RefreshCw, Bug, Zap, Wifi, WifiOff as WifiOffIcon } from 'lucide-react';

export const ErrorHandlingDemo: React.FC = () => {
  const [demoError, setDemoError] = useState<AppError | null>(null);
  const [showErrorAlert, setShowErrorAlert] = useState(false);

  // Use the enhanced hook to demonstrate error handling
  const {
    vibesWithAmenities,
    loading,
    error,
    errorMessage,
    refetch,
    isRetrying,
    isOffline,
    hasCachedData
  } = useVibeAmenities({
    terminalCode: 'T3',
    airportCode: 'SIN',
    limitPerVibe: 5
  });

  const triggerError = (errorType: ErrorType) => {
    const error = new AppError(
      errorType,
      `Demo ${errorType} error`,
      { demo: true },
      500,
      true
    );
    setDemoError(error);
    setShowErrorAlert(true);
  };

  const dismissError = () => {
    setDemoError(null);
    setShowErrorAlert(false);
  };

  const retryError = () => {
    console.log('Retrying...');
    setShowErrorAlert(false);
    setTimeout(() => {
      setDemoError(null);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Error Handling System Demo
          </h1>
          <p className="text-gray-600">
            Comprehensive error handling with user-friendly messages, retry logic, and offline support
          </p>
        </div>

        {/* Error Alert Demo */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Error Alert Components</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <button
              onClick={() => triggerError(ErrorType.NETWORK)}
              className="flex items-center gap-2 px-4 py-2 bg-orange-100 text-orange-800 rounded-lg hover:bg-orange-200 transition-colors"
            >
              <WifiOff className="h-4 w-4" />
              Network Error
            </button>
            <button
              onClick={() => triggerError(ErrorType.TIMEOUT)}
              className="flex items-center gap-2 px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg hover:bg-yellow-200 transition-colors"
            >
              <Clock className="h-4 w-4" />
              Timeout Error
            </button>
            <button
              onClick={() => triggerError(ErrorType.AUTHENTICATION)}
              className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-800 rounded-lg hover:bg-red-200 transition-colors"
            >
              <Shield className="h-4 w-4" />
              Auth Error
            </button>
            <button
              onClick={() => triggerError(ErrorType.SERVER)}
              className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-800 rounded-lg hover:bg-red-200 transition-colors"
            >
              <AlertTriangle className="h-4 w-4" />
              Server Error
            </button>
          </div>
        </div>

        {/* Dev Test Errors */}
        {import.meta.env.DEV && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Bug className="h-5 w-5 text-yellow-600" />
              Development Error Testing
            </h2>
            
            {/* Component Crash Tests */}
            <div className="mb-4">
              <h3 className="font-medium mb-2">Component Crash Tests</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <button
                  onClick={() => triggerTestError('crash')}
                  className="px-3 py-2 bg-red-100 text-red-800 rounded text-sm hover:bg-red-200 transition-colors"
                >
                  Component Crash
                </button>
                <button
                  onClick={() => triggerTestError('async')}
                  className="px-3 py-2 bg-orange-100 text-orange-800 rounded text-sm hover:bg-orange-200 transition-colors"
                >
                  Async Error
                </button>
                <button
                  onClick={() => triggerTestError('404')}
                  className="px-3 py-2 bg-yellow-100 text-yellow-800 rounded text-sm hover:bg-yellow-200 transition-colors"
                >
                  Route 404
                </button>
                <button
                  onClick={() => triggerTestError('network')}
                  className="px-3 py-2 bg-blue-100 text-blue-800 rounded text-sm hover:bg-blue-200 transition-colors"
                >
                  Network Error
                </button>
              </div>
            </div>

            {/* Error Type Tests */}
            <div className="mb-4">
              <h3 className="font-medium mb-2">All Error Types</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {Object.values(ErrorType).map(type => (
                  <button
                    key={type}
                    onClick={() => {
                      const error = createTestAppError(type);
                      setDemoError(error);
                      setShowErrorAlert(true);
                    }}
                    className="px-3 py-2 bg-gray-100 text-gray-800 rounded text-sm hover:bg-gray-200 transition-colors"
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Network Simulation */}
            <div className="mb-4">
              <h3 className="font-medium mb-2">Network Simulation</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => devErrorUtils.simulateOffline()}
                  className="flex items-center gap-1 px-3 py-2 bg-orange-100 text-orange-800 rounded text-sm hover:bg-orange-200 transition-colors"
                >
                  <WifiOffIcon className="h-3 w-3" />
                  Go Offline
                </button>
                <button
                  onClick={() => devErrorUtils.simulateOnline()}
                  className="flex items-center gap-1 px-3 py-2 bg-green-100 text-green-800 rounded text-sm hover:bg-green-200 transition-colors"
                >
                  <Wifi className="h-3 w-3" />
                  Go Online
                </button>
                <button
                  onClick={() => devErrorUtils.clearErrors()}
                  className="flex items-center gap-1 px-3 py-2 bg-gray-100 text-gray-800 rounded text-sm hover:bg-gray-200 transition-colors"
                >
                  <Zap className="h-3 w-3" />
                  Clear Errors
                </button>
              </div>
            </div>

            {/* Error Log */}
            <div>
              <h3 className="font-medium mb-2">Error Log</h3>
              <div className="bg-gray-100 rounded p-3 text-xs font-mono max-h-32 overflow-y-auto">
                {devErrorUtils.getErrorLog().length > 0 ? (
                  <pre>{JSON.stringify(devErrorUtils.getErrorLog(), null, 2)}</pre>
                ) : (
                  <span className="text-gray-500">No errors logged yet</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Real Data with Error Handling */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Real Data with Enhanced Error Handling</h2>
          
          {/* Status Indicators */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {isOffline ? '📱' : '🌐'}
              </div>
              <div className="text-sm text-blue-800">
                {isOffline ? 'Offline' : 'Online'}
              </div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {hasCachedData ? '💾' : '🔄'}
              </div>
              <div className="text-sm text-green-800">
                {hasCachedData ? 'Cached' : 'Fresh'}
              </div>
            </div>
            <div className="text-center p-3 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                {isRetrying ? '🔄' : '✅'}
              </div>
              <div className="text-sm text-yellow-800">
                {isRetrying ? 'Retrying' : 'Ready'}
              </div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {vibesWithAmenities.size}
              </div>
              <div className="text-sm text-purple-800">Vibes</div>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-medium text-red-800">Error Occurred</h3>
                  <p className="text-sm text-red-700 mt-1">{errorMessage}</p>
                  <div className="mt-2 text-xs text-red-600">
                    Type: {error.type} | Status: {error.statusCode || 'N/A'} | 
                    Retryable: {error.retryable ? 'Yes' : 'No'}
                  </div>
                </div>
                <button
                  onClick={refetch}
                  className="flex items-center gap-1 px-3 py-1 bg-red-100 text-red-800 rounded text-sm hover:bg-red-200 transition-colors"
                >
                  <RefreshCw className="h-3 w-3" />
                  Retry
                </button>
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-blue-500" />
              <span className="ml-2 text-gray-600">
                {isRetrying ? 'Retrying...' : 'Loading amenities...'}
              </span>
            </div>
          )}

          {/* Data Display */}
          {!loading && vibesWithAmenities.size > 0 && (
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">Loaded Vibes:</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {Array.from(vibesWithAmenities.entries()).map(([vibe, amenities]) => (
                  <div key={vibe} className="p-3 bg-gray-50 rounded-lg">
                    <div className="font-medium text-gray-900 capitalize">{vibe}</div>
                    <div className="text-sm text-gray-600">{amenities.length} amenities</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No Data State */}
          {!loading && vibesWithAmenities.size === 0 && !error && (
            <div className="text-center py-8 text-gray-500">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>No amenities loaded</p>
            </div>
          )}
        </div>

        {/* Error Service Demo */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold mb-4">Error Service Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium mb-2">Error Types Handled</h3>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• Network errors (connection issues)</li>
                <li>• Timeout errors (slow responses)</li>
                <li>• Authentication errors (login required)</li>
                <li>• Permission errors (access denied)</li>
                <li>• Server errors (5xx responses)</li>
                <li>• Validation errors (bad input)</li>
                <li>• Not found errors (404s)</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium mb-2">Features</h3>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• Automatic retry with exponential backoff</li>
                <li>• User-friendly error messages</li>
                <li>• Offline cache support</li>
                <li>• Error logging and tracking</li>
                <li>• Graceful degradation</li>
                <li>• Sentry integration</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Error Alert Component */}
      {showErrorAlert && demoError && (
        <ErrorAlert
          error={demoError}
          onDismiss={dismissError}
          onRetry={retryError}
          autoDismiss={true}
          dismissDelay={3000}
        />
      )}
    </div>
  );
};

export default ErrorHandlingDemo;
