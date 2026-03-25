import React from 'react';
import { triggerTestError, createTestAppError, devErrorUtils } from '../utils/testErrors';
import { ErrorType } from '../services/errorService';
import { Bug, Zap, Wifi, WifiOff } from 'lucide-react';

// Development-only error testing component
export const DevErrorTester: React.FC = () => {
  if (!import.meta.env.DEV) {
    return null; // Only show in development
  }

  return (
    <div className="fixed bottom-4 left-4 bg-yellow-100 border border-yellow-300 rounded-lg p-3 shadow-lg z-50">
      <div className="flex items-center gap-2 mb-2">
        <Bug className="h-4 w-4 text-yellow-600" />
        <span className="text-sm font-medium text-yellow-800">Dev Error Tester</span>
      </div>
      
      <div className="flex gap-1">
        <button
          onClick={() => triggerTestError('crash')}
          className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200 transition-colors"
          title="Test Error Boundary"
        >
          Crash
        </button>
        
        <button
          onClick={() => triggerTestError('async')}
          className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs hover:bg-orange-200 transition-colors"
          title="Test Async Error"
        >
          Async
        </button>
        
        <button
          onClick={() => triggerTestError('network')}
          className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200 transition-colors"
          title="Test Network Error"
        >
          Network
        </button>
        
        <button
          onClick={() => devErrorUtils.simulateOffline()}
          className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs hover:bg-gray-200 transition-colors"
          title="Simulate Offline"
        >
          <WifiOff className="h-3 w-3" />
        </button>
        
        <button
          onClick={() => devErrorUtils.simulateOnline()}
          className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs hover:bg-gray-200 transition-colors"
          title="Simulate Online"
        >
          <Wifi className="h-3 w-3" />
        </button>
        
        <button
          onClick={() => devErrorUtils.clearErrors()}
          className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs hover:bg-gray-200 transition-colors"
          title="Clear Error Log"
        >
          <Zap className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
};

// Hook for easy error testing in components
export const useDevErrorTesting = () => {
  if (!import.meta.env.DEV) {
    return {
      triggerError: () => {},
      createError: () => null,
      simulateOffline: () => {},
      simulateOnline: () => {},
      clearErrors: () => {}
    };
  }

  return {
    triggerError: triggerTestError,
    createError: createTestAppError,
    simulateOffline: devErrorUtils.simulateOffline,
    simulateOnline: devErrorUtils.simulateOnline,
    clearErrors: devErrorUtils.clearErrors
  };
};

export default DevErrorTester;
