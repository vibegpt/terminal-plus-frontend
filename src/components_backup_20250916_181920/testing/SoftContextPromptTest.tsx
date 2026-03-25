import React, { useState } from 'react';
import { SoftContextPrompt } from '../SoftContextPrompt';
import { SimpleJourneyContextProvider, useSimpleJourneyContext } from '../../hooks/useSimpleJourneyContext';

// Test component that shows the context prompt
const SoftContextPromptDemo: React.FC = () => {
  const { userState, location, phase, timeContext } = useSimpleJourneyContext();
  const [showPrompt, setShowPrompt] = useState(false);

  return (
    <div className="p-6 max-w-4xl mx-auto bg-white rounded-lg shadow-lg">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">
        Soft Context Prompt Test
      </h1>

      {/* Current Context Display */}
      <div className="mb-8 p-6 bg-blue-50 rounded-lg">
        <h2 className="text-xl font-semibold text-blue-900 mb-4">
          Current Context
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-4 rounded-lg border">
            <h3 className="font-semibold text-gray-800 mb-3">User State</h3>
            <div className="space-y-2 text-sm">
              <div><span className="font-medium">Energy:</span> {userState.energy}</div>
              <div><span className="font-medium">Time Available:</span> {userState.timeAvailable || 'Not set'}</div>
              <div><span className="font-medium">Has Asked:</span> {userState.hasAsked ? 'Yes' : 'No'}</div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border">
            <h3 className="font-semibold text-gray-800 mb-3">Journey Info</h3>
            <div className="space-y-2 text-sm">
              <div><span className="font-medium">Phase:</span> {phase}</div>
              <div><span className="font-medium">At Airport:</span> {location.isAtAirport ? 'Yes' : 'No'}</div>
              <div><span className="font-medium">Terminal:</span> {location.terminal || 'N/A'}</div>
              <div><span className="font-medium">Confidence:</span> {location.confidence}%</div>
            </div>
          </div>
        </div>

        <div className="mt-4 p-3 bg-gray-100 rounded-lg">
          <span className="font-medium">Greeting:</span> {timeContext.greeting}!
        </div>
      </div>

      {/* Test Controls */}
      <div className="mb-8 p-6 bg-green-50 rounded-lg">
        <h2 className="text-xl font-semibold text-green-900 mb-4">
          Test Controls
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-4 rounded-lg border">
            <h3 className="font-semibold text-gray-800 mb-3">Show Context Prompt</h3>
            <div className="space-y-3">
              <button
                onClick={() => setShowPrompt(true)}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Show Prompt
              </button>
              <p className="text-sm text-gray-600">
                This will show the context prompt if conditions are met
              </p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border">
            <h3 className="font-semibold text-gray-800 mb-3">Reset Context</h3>
            <div className="space-y-3">
              <button
                onClick={() => {
                  // Reset user state to trigger prompt again
                  window.location.reload();
                }}
                className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Reset & Reload
              </button>
              <p className="text-sm text-gray-600">
                Reloads the page to reset all context
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Context Prompt Conditions */}
      <div className="mb-8 p-6 bg-yellow-50 rounded-lg">
        <h2 className="text-xl font-semibold text-yellow-900 mb-4">
          When Context Prompt Shows
        </h2>
        
        <div className="bg-white p-4 rounded-lg border">
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span>User hasn't been asked yet (<code>!userState.hasAsked</code>)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              <span>AND either:</span>
            </div>
            <div className="ml-4 space-y-1">
              <div>• Low confidence location (<code>location.confidence &lt; 60</code>)</div>
              <div>• OR at airport needing context (<code>location.isAtAirport</code>)</div>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-gray-100 rounded text-sm">
            <span className="font-medium">Current Status:</span> 
            {!userState.hasAsked && (location.confidence < 60 || location.isAtAirport) 
              ? ' ✅ Prompt should show' 
              : ' ❌ Prompt will not show'}
          </div>
        </div>
      </div>

      {/* Context Options Preview */}
      <div className="p-6 bg-purple-50 rounded-lg">
        <h2 className="text-xl font-semibold text-purple-900 mb-4">
          Context Options Preview
        </h2>
        
        <div className="bg-white p-4 rounded-lg border">
          <p className="text-sm text-gray-600 mb-4">
            The prompt will show these options based on current time:
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3 bg-purple-50 rounded border">
              <div className="font-medium text-purple-800">Just landed (Long flight)</div>
              <div className="text-sm text-purple-600">Exhausted → Arrival phase</div>
            </div>
            <div className="p-3 bg-green-50 rounded border">
              <div className="font-medium text-green-800">Just arrived (Short flight)</div>
              <div className="text-sm text-green-600">Fresh → Arrival phase</div>
            </div>
            <div className="p-3 bg-yellow-50 rounded border">
              <div className="font-medium text-yellow-800">Departing soon</div>
              <div className="text-sm text-yellow-600">Active → Departure phase</div>
            </div>
            <div className="p-3 bg-blue-50 rounded border">
              <div className="font-medium text-blue-800">Long layover</div>
              <div className="text-sm text-blue-600">Active → Transit phase</div>
            </div>
            <div className="p-3 bg-gray-50 rounded border">
              <div className="font-medium text-gray-800">Planning ahead</div>
              <div className="text-sm text-gray-600">Fresh → Exploring phase</div>
            </div>
          </div>
        </div>
      </div>

      {/* Show the actual prompt if requested */}
      {showPrompt && (
        <SoftContextPrompt />
      )}
    </div>
  );
};

// Wrapper component that provides the context
export const SoftContextPromptTest: React.FC = () => {
  return (
    <SimpleJourneyContextProvider>
      <SoftContextPromptDemo />
    </SimpleJourneyContextProvider>
  );
};
