// Example of how to use error testing in your components

import React, { useState } from 'react';
import { useDevErrorTesting } from '../components/DevErrorTester';
import { ErrorType } from '../services/errorService';

export const ErrorTestingExample: React.FC = () => {
  const [count, setCount] = useState(0);
  const { triggerError, createError, simulateOffline, simulateOnline } = useDevErrorTesting();

  // Example: Test different error scenarios
  const handleTestError = (type: string) => {
    try {
      triggerError(type);
    } catch (error) {
      console.error('Error caught:', error);
    }
  };

  // Example: Test async errors
  const handleAsyncError = async () => {
    try {
      await triggerError('async');
    } catch (error) {
      console.error('Async error caught:', error);
    }
  };

  // Example: Test component crash
  const handleCrash = () => {
    // This will trigger the error boundary
    triggerError('crash');
  };

  // Example: Test network simulation
  const handleNetworkTest = () => {
    simulateOffline();
    setTimeout(() => simulateOnline(), 3000);
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Error Testing Example</h2>
      
      <div className="space-y-4">
        <div>
          <p>Count: {count}</p>
          <button 
            onClick={() => setCount(c => c + 1)}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Increment
          </button>
        </div>

        {/* Error Testing Buttons - Only in Development */}
        {import.meta.env.DEV && (
          <div className="space-y-2">
            <h3 className="font-semibold">Test Errors (Dev Only)</h3>
            
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => handleTestError('network')}
                className="px-3 py-1 bg-orange-100 text-orange-800 rounded text-sm hover:bg-orange-200"
              >
                Network Error
              </button>
              
              <button
                onClick={() => handleTestError('404')}
                className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded text-sm hover:bg-yellow-200"
              >
                Route 404
              </button>
              
              <button
                onClick={handleAsyncError}
                className="px-3 py-1 bg-red-100 text-red-800 rounded text-sm hover:bg-red-200"
              >
                Async Error
              </button>
              
              <button
                onClick={handleCrash}
                className="px-3 py-1 bg-red-100 text-red-800 rounded text-sm hover:bg-red-200"
              >
                Component Crash
              </button>
              
              <button
                onClick={handleNetworkTest}
                className="px-3 py-1 bg-blue-100 text-blue-800 rounded text-sm hover:bg-blue-200"
              >
                Network Simulation
              </button>
            </div>
          </div>
        )}

        {/* Example: Using error testing in a real scenario */}
        <div className="mt-6 p-4 bg-gray-50 rounded">
          <h4 className="font-medium mb-2">Real Usage Example</h4>
          <p className="text-sm text-gray-600 mb-2">
            In your components, you can use the error testing utilities to simulate different error conditions:
          </p>
          <pre className="text-xs bg-white p-2 rounded border overflow-x-auto">
{`// In any component
import { useDevErrorTesting } from '../components/DevErrorTester';

const MyComponent = () => {
  const { triggerError, simulateOffline } = useDevErrorTesting();
  
  const handleTest = () => {
    triggerError('network'); // Test network error
    simulateOffline(); // Test offline mode
  };
  
  return (
    <button onClick={handleTest}>
      Test Error (Dev Only)
    </button>
  );
};`}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default ErrorTestingExample;
