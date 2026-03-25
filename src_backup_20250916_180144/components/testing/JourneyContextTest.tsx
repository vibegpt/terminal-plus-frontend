import React, { useState } from 'react';
import { SimpleJourneyContextProvider, useSimpleJourneyContext } from '../../hooks/useSimpleJourneyContext';

// Test component that uses the journey context
const JourneyContextDemo: React.FC = () => {
  const {
    location,
    phase,
    userState,
    timeContext,
    vibeOrder,
    featuredCollections,
    setPhase,
    setUserEnergy,
    setTimeAvailable,
    refreshLocation,
    setManualTerminal
  } = useSimpleJourneyContext();

  return (
    <div className="p-6 max-w-6xl mx-auto bg-white rounded-lg shadow-lg">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">
        Journey Context Hook Test
      </h1>

      {/* Greeting Section */}
      <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">
          {timeContext.greeting}!
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
          <div><span className="font-medium">Current Time:</span> {timeContext.currentTime.toLocaleTimeString()}</div>
          <div><span className="font-medium">Time Slot:</span> {timeContext.timeSlot}</div>
          <div><span className="font-medium">Likely Origins:</span> {timeContext.likelyOrigins.join(', ')}</div>
        </div>
      </div>

      {/* Location Section */}
      <div className="mb-8 p-6 bg-green-50 rounded-lg">
        <h2 className="text-xl font-semibold text-green-900 mb-4">
          Current Location
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-4 rounded-lg border">
            <h3 className="font-semibold text-gray-800 mb-3">Location Details</h3>
            <div className="space-y-2 text-sm">
              <div><span className="font-medium">At Airport:</span> {location.isAtAirport ? 'Yes' : 'No'}</div>
              <div><span className="font-medium">Airport:</span> {location.airport || 'N/A'}</div>
              <div><span className="font-medium">Terminal:</span> {location.terminal || 'N/A'}</div>
              <div><span className="font-medium">Cluster:</span> {location.cluster || 'N/A'}</div>
              <div><span className="font-medium">Method:</span> {location.method}</div>
              <div><span className="font-medium">Confidence:</span> {location.confidence}%</div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border">
            <h3 className="font-semibold text-gray-800 mb-3">Manual Terminal Setting</h3>
            <div className="space-y-3">
              <select
                onChange={(e) => setManualTerminal(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">Select Terminal</option>
                <option value="T1">Terminal 1</option>
                <option value="T2">Terminal 2</option>
                <option value="T3">Terminal 3</option>
                <option value="T4">Terminal 4</option>
                <option value="JEWEL">Jewel</option>
              </select>
              <button
                onClick={refreshLocation}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Refresh Location
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Journey Phase Section */}
      <div className="mb-8 p-6 bg-yellow-50 rounded-lg">
        <h2 className="text-xl font-semibold text-yellow-900 mb-4">
          Journey Phase
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-4 rounded-lg border">
            <h3 className="font-semibold text-gray-800 mb-3">Current Phase</h3>
            <div className="mb-4">
              <span className="text-lg font-medium">Phase: </span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                phase === 'departure' ? 'bg-red-100 text-red-800' :
                phase === 'arrival' ? 'bg-green-100 text-green-800' :
                phase === 'transit' ? 'bg-blue-100 text-blue-800' :
                phase === 'exploring' ? 'bg-purple-100 text-purple-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {phase}
              </span>
            </div>
            
            <div className="space-y-2">
              <button
                onClick={() => setPhase('departure')}
                className="w-full px-3 py-2 bg-red-100 text-red-800 rounded hover:bg-red-200"
              >
                Set Departure
              </button>
              <button
                onClick={() => setPhase('arrival')}
                className="w-full px-3 py-2 bg-green-100 text-green-800 rounded hover:bg-green-200"
              >
                Set Arrival
              </button>
              <button
                onClick={() => setPhase('transit')}
                className="w-full px-3 py-2 bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
              >
                Set Transit
              </button>
              <button
                onClick={() => setPhase('exploring')}
                className="w-full px-3 py-2 bg-purple-100 text-purple-800 rounded hover:bg-purple-200"
              >
                Set Exploring
              </button>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border">
            <h3 className="font-semibold text-gray-800 mb-3">User State</h3>
            <div className="space-y-3">
              <div>
                <span className="font-medium">Energy: </span>
                <span className={`px-2 py-1 rounded text-sm ${
                  userState.energy === 'exhausted' ? 'bg-red-100 text-red-800' :
                  userState.energy === 'tired' ? 'bg-orange-100 text-orange-800' :
                  userState.energy === 'active' ? 'bg-green-100 text-green-800' :
                  userState.energy === 'fresh' ? 'bg-blue-100 text-blue-800' :
                  'bg-purple-100 text-purple-800'
                }`}>
                  {userState.energy}
                </span>
              </div>
              
              <div>
                <span className="font-medium">Time Available: </span>
                <span className="text-gray-600">{userState.timeAvailable || 'Not set'}</span>
              </div>
              
              <div>
                <span className="font-medium">Has Asked: </span>
                <span className="text-gray-600">{userState.hasAsked ? 'Yes' : 'No'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Energy & Time Section */}
      <div className="mb-8 p-6 bg-orange-50 rounded-lg">
        <h2 className="text-xl font-semibold text-orange-900 mb-4">
          Set Your Energy & Time
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-4 rounded-lg border">
            <h3 className="font-semibold text-gray-800 mb-3">Energy Level</h3>
            <div className="space-y-2">
              {(['exhausted', 'tired', 'active', 'fresh', 'jetlagged'] as const).map((energy) => (
                <button
                  key={energy}
                  onClick={() => setUserEnergy(energy)}
                  className={`w-full px-3 py-2 rounded text-left ${
                    userState.energy === energy
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                >
                  {energy.charAt(0).toUpperCase() + energy.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border">
            <h3 className="font-semibold text-gray-800 mb-3">Time Available</h3>
            <div className="space-y-2">
              {(['rushed', 'moderate', 'plenty'] as const).map((time) => (
                <button
                  key={time}
                  onClick={() => setTimeAvailable(time)}
                  className={`w-full px-3 py-2 rounded text-left ${
                    userState.timeAvailable === time
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                >
                  {time.charAt(0).toUpperCase() + time.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Vibe Recommendations Section */}
      <div className="mb-8 p-6 bg-purple-50 rounded-lg">
        <h2 className="text-xl font-semibold text-purple-900 mb-4">
          Intelligent Vibe Recommendations
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-4 rounded-lg border">
            <h3 className="font-semibold text-gray-800 mb-3">Vibe Order (Priority)</h3>
            <div className="space-y-2">
              {vibeOrder.map((vibe, index) => (
                <div
                  key={vibe}
                  className="flex items-center space-x-3 p-2 bg-gray-50 rounded"
                >
                  <span className="w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </span>
                  <span className="capitalize font-medium">{vibe}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border">
            <h3 className="font-semibold text-gray-800 mb-3">Featured Collections</h3>
            <div className="space-y-2">
              {featuredCollections.length > 0 ? (
                featuredCollections.map((collection, index) => (
                  <div
                    key={collection}
                    className="p-2 bg-blue-50 rounded text-sm"
                  >
                    <span className="font-medium">{index + 1}.</span> {collection}
                  </div>
                ))
              ) : (
                <div className="text-gray-500 text-sm">No featured collections available</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Context Summary */}
      <div className="p-6 bg-gray-50 rounded-lg">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Context Summary
        </h2>
        
        <div className="bg-white p-4 rounded-lg border">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Location Context:</span> {location.isAtAirport ? `At ${location.airport}${location.terminal ? ` Terminal ${location.terminal}` : ''}` : 'Planning mode'}
            </div>
            <div>
              <span className="font-medium">Journey Context:</span> {phase === 'unknown' ? 'Phase not determined' : `${phase} phase`}
            </div>
            <div>
              <span className="font-medium">User Context:</span> {userState.energy} energy, {userState.timeAvailable || 'time not set'}
            </div>
            <div>
              <span className="font-medium">Time Context:</span> {timeContext.timeSlot} ({timeContext.likelyOrigins.length} likely origins)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Wrapper component that provides the context
export const JourneyContextTest: React.FC = () => {
  return (
    <SimpleJourneyContextProvider>
      <JourneyContextDemo />
    </SimpleJourneyContextProvider>
  );
};
