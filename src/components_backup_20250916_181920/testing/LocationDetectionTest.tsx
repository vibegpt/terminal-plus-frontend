import React, { useState, useEffect } from 'react';
import { LocationDetectionService } from '../../services/LocationDetectionService';

interface LocationResult {
  method: 'GPS' | 'WIFI' | 'MANUAL' | 'DEFAULT';
  isAtAirport: boolean;
  airport?: string;
  terminal?: string;
  confidence: number;
  cluster?: string;
  walkingDistances?: {
    T1?: number;
    T2?: number;
    T3?: number;
    T4?: number;
    JEWEL?: number;
  };
}

interface ArrivalPattern {
  timeSlot: string;
  likely_origins: string[];
  examples: string[];
  user_state: 'exhausted' | 'fresh' | 'active' | 'jetlagged' | 'tired';
  vibe_priority: string[];
}

export const LocationDetectionTest: React.FC = () => {
  const [location, setLocation] = useState<LocationResult | null>(null);
  const [arrivalPattern, setArrivalPattern] = useState<ArrivalPattern | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manualTerminal, setManualTerminal] = useState<string>('T1');

  // Auto-detect location on component mount
  useEffect(() => {
    detectLocation();
    getArrivalPattern();
  }, []);

  const detectLocation = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await LocationDetectionService.detectLocation();
      setLocation(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Location detection failed');
    } finally {
      setLoading(false);
    }
  };

  const getArrivalPattern = () => {
    try {
      const pattern = LocationDetectionService.getArrivalPattern();
      setArrivalPattern(pattern);
    } catch (err) {
      console.error('Failed to get arrival pattern:', err);
    }
  };

  const setManualLocation = (terminal: string) => {
    const manualResult: LocationResult = {
      method: 'MANUAL',
      isAtAirport: true,
      airport: 'SIN',
      terminal,
      confidence: 100,
      walkingDistances: {
        T1: terminal === 'T1' ? 0 : 5,
        T2: terminal === 'T2' ? 0 : 5,
        T3: terminal === 'T3' ? 0 : 8,
        T4: terminal === 'T4' ? 0 : 15,
        JEWEL: terminal === 'JEWEL' ? 0 : 5
      }
    };
    setLocation(manualResult);
  };

  const getLocationDescription = () => {
    if (!location) return 'No location detected';
    return LocationDetectionService.getLocationDescription(location);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto bg-white rounded-lg shadow-lg">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">
        Location Detection Service Test
      </h1>

      {/* Location Detection Section */}
      <div className="mb-8 p-6 bg-blue-50 rounded-lg">
        <h2 className="text-xl font-semibold text-blue-900 mb-4">
          Current Location
        </h2>
        
        <div className="flex gap-4 mb-4">
          <button
            onClick={detectLocation}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Detecting...' : 'Detect Location'}
          </button>
          
          <select
            value={manualTerminal}
            onChange={(e) => setManualTerminal(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="T1">Terminal 1</option>
            <option value="T2">Terminal 2</option>
            <option value="T3">Terminal 3</option>
            <option value="T4">Terminal 4</option>
            <option value="JEWEL">Jewel</option>
          </select>
          
          <button
            onClick={() => setManualLocation(manualTerminal)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Set Manual Location
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-100 text-red-700 rounded-lg mb-4">
            Error: {error}
          </div>
        )}

        {location && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-4 rounded-lg border">
              <h3 className="font-semibold text-gray-800 mb-3">Location Details</h3>
              <div className="space-y-2 text-sm">
                <div><span className="font-medium">Method:</span> {location.method}</div>
                <div><span className="font-medium">At Airport:</span> {location.isAtAirport ? 'Yes' : 'No'}</div>
                <div><span className="font-medium">Airport:</span> {location.airport || 'N/A'}</div>
                <div><span className="font-medium">Terminal:</span> {location.terminal || 'N/A'}</div>
                <div><span className="font-medium">Cluster:</span> {location.cluster || 'N/A'}</div>
                <div><span className="font-medium">Confidence:</span> {location.confidence}%</div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg border">
              <h3 className="font-semibold text-gray-800 mb-3">Walking Distances</h3>
              {location.walkingDistances ? (
                <div className="space-y-2 text-sm">
                  {Object.entries(location.walkingDistances).map(([terminal, distance]) => (
                    <div key={terminal}>
                      <span className="font-medium">{terminal}:</span> {distance} min
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-gray-500">No distance data available</div>
              )}
            </div>
          </div>
        )}

        <div className="mt-4 p-3 bg-gray-100 rounded-lg">
          <span className="font-medium">Description:</span> {getLocationDescription()}
        </div>
      </div>

      {/* Arrival Pattern Section */}
      {arrivalPattern && (
        <div className="mb-8 p-6 bg-green-50 rounded-lg">
          <h2 className="text-xl font-semibold text-green-900 mb-4">
            Arrival Pattern Analysis
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-4 rounded-lg border">
              <h3 className="font-semibold text-gray-800 mb-3">Time & Origins</h3>
              <div className="space-y-2 text-sm">
                <div><span className="font-medium">Time Slot:</span> {arrivalPattern.timeSlot}</div>
                <div><span className="font-medium">Likely Origins:</span></div>
                <ul className="list-disc list-inside ml-4">
                  {arrivalPattern.likely_origins.map((origin, index) => (
                    <li key={index}>{origin}</li>
                  ))}
                </ul>
                <div><span className="font-medium">Example Airports:</span></div>
                <ul className="list-disc list-inside ml-4">
                  {arrivalPattern.examples.map((airport, index) => (
                    <li key={index}>{airport}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg border">
              <h3 className="font-semibold text-gray-800 mb-3">User State & Vibes</h3>
              <div className="space-y-2 text-sm">
                <div><span className="font-medium">User State:</span> {arrivalPattern.user_state}</div>
                <div><span className="font-medium">Vibe Priorities:</span></div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {arrivalPattern.vibe_priority.map((vibe, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                    >
                      {vibe}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Integration Example */}
      <div className="p-6 bg-purple-50 rounded-lg">
        <h2 className="text-xl font-semibold text-purple-900 mb-4">
          Integration Example
        </h2>
        
        <div className="bg-white p-4 rounded-lg border">
          <p className="text-gray-700 mb-3">
            This service can be integrated with other services to provide context-aware recommendations:
          </p>
          
          <div className="space-y-2 text-sm text-gray-600">
            <div>• <strong>Recommendation Engine:</strong> Use location + arrival pattern for personalized suggestions</div>
            <div>• <strong>Navigation:</strong> Provide walking directions between terminals</div>
            <div>• <strong>Vibe Selection:</strong> Suggest vibes based on user state and time</div>
            <div>• <strong>Collection Filtering:</strong> Show amenities relevant to current terminal</div>
          </div>
        </div>
      </div>
    </div>
  );
};
