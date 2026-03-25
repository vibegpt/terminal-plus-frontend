import React, { useCallback } from "react";
import { useOfflineAmenities, useOfflineJourney } from "../hooks/useOfflineCache";
import type { Amenity } from "../types/amenity.types";
import type { JourneyData } from "../types/journey.types";

// Example fetch function for amenities
const fetchAmenities = async (): Promise<Amenity[]> => {
  // Simulate API call
  const response = await fetch('/api/amenities');
  if (!response.ok) {
    throw new Error('Failed to fetch amenities');
  }
  return response.json();
};

const OfflineExample: React.FC = () => {
  // Use the offline amenities hook
  const { data: amenities, isOffline: amenitiesOffline, isLoading: amenitiesLoading } = 
    useOfflineAmenities(fetchAmenities);

  // Use the offline journey hook
  const { journey, saveJourney, clearJourney } = useOfflineJourney();

  // Example journey data
  const exampleJourney: JourneyData = {
    from: "SYD",
    to: "SIN",
    selected_vibe: "comfort",
    flightNumber: "SQ123",
    date: "2024-01-15",
    layovers: [],
  };

  const handleSaveJourney = useCallback(() => {
    saveJourney(exampleJourney);
  }, [saveJourney]);

  const handleClearJourney = useCallback(() => {
    clearJourney();
  }, [clearJourney]);

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Offline Cache Example</h2>

      {/* Amenities Section */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4">Amenities Cache</h3>
        <div className="space-y-2">
          <p className="text-sm">
            <span className="font-medium">Status:</span>{" "}
            {amenitiesLoading ? "Loading..." : amenitiesOffline ? "Offline (using cache)" : "Online"}
          </p>
          <p className="text-sm">
            <span className="font-medium">Count:</span> {amenities?.length || 0} amenities
          </p>
          {amenitiesOffline && (
            <p className="text-sm text-yellow-600">
              ⚠️ Using cached data - you're offline or data is stale
            </p>
          )}
        </div>
      </div>

      {/* Journey Section */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4">Journey Cache</h3>
        <div className="space-y-4">
          <div className="flex space-x-2">
            <button
              onClick={handleSaveJourney}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Save Example Journey
            </button>
            <button
              onClick={handleClearJourney}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Clear Journey
            </button>
          </div>
          
          {journey && (
            <div className="p-4 bg-gray-100 rounded">
              <h4 className="font-medium mb-2">Cached Journey:</h4>
              <pre className="text-xs overflow-auto">
                {JSON.stringify(journey, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>

      {/* Network Status */}
      <div className="text-sm text-gray-600">
        <p>Network: {navigator.onLine ? "🟢 Online" : "🔴 Offline"}</p>
        <p>Cache TTL: 2 hours</p>
      </div>
    </div>
  );
};

export default OfflineExample; 