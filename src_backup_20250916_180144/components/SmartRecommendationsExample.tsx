import React, { useState, useMemo } from "react";
import { useSmartRecommendations } from "../hooks/useSmartRecommendations";
import type { Amenity } from "../types/amenity.types";
import type { JourneyData } from "../types/journey.types";
import type { UserContext } from "../types/recommendation.types";

// Example amenity data
const exampleAmenities: Amenity[] = [
  {
    id: "1",
    name: "Coffee Shop",
    category: "Food & Dining",
    location: "Terminal 1",
    terminal_code: "SIN-T1",
    vibe_tags: ["refuel", "quick"],
    price_tier: "$$",
    accessibility: true,
    opening_hours: { "Monday-Sunday": "06:00-22:00" }
  },
  {
    id: "2",
    name: "Luxury Lounge",
    category: "Lounge",
    location: "Terminal 1",
    terminal_code: "SIN-T1",
    vibe_tags: ["comfort", "chill"],
    price_tier: "$$$",
    accessibility: true,
    opening_hours: { "Monday-Sunday": "24/7" }
  },
  {
    id: "3",
    name: "Shopping Center",
    category: "Shopping",
    location: "Terminal 1",
    terminal_code: "SIN-T1",
    vibe_tags: ["shop", "explore"],
    price_tier: "$$",
    accessibility: true,
    opening_hours: { "Monday-Sunday": "08:00-22:00" }
  }
];

const SmartRecommendationsExample: React.FC = () => {
  const [query, setQuery] = useState("");
  const [energyLevel, setEnergyLevel] = useState<'low' | 'medium' | 'high'>('medium');

  // Create example user context
  const userContext: UserContext = useMemo(() => ({
    journeyData: {
      from: "SYD",
      to: "SIN",
      selected_vibe: "comfort",
      flightNumber: "SQ123",
      date: "2024-01-15",
      layovers: []
    },
    currentTime: new Date(),
    timeOfDay: "afternoon" as const,
    energyLevel,
    preferences: {
      vibes: ["comfort", "chill"],
      priceRange: "$$",
      accessibility: true,
      maxWaitTime: 30,
      preferredCategories: ["Food & Dining", "Lounge"]
    },
    constraints: {
      timeAvailable: 120, // 2 hours
      budget: 100,
      mobility: "high"
    },
    location: {
      terminal: "SIN-T1",
      gate: "A1",
      coordinates: { lat: 1.3644, lng: 103.9915 }
    }
  }), [energyLevel]);

  // Use the smart recommendations hook
  const {
    recommendations,
    journeyContext,
    fallbacks,
    explanation,
    energySuggestion,
    selectedEnergyLevel,
    setSelectedEnergyLevel,
    energyOverridden,
    setEnergyOverridden
  } = useSmartRecommendations(exampleAmenities, userContext, query);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Smart Recommendations Example</h2>

      {/* Energy Level Controls */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">Energy Level</h3>
        <div className="flex space-x-4">
          {(['low', 'medium', 'high'] as const).map(level => (
            <button
              key={level}
              onClick={() => setEnergyLevel(level)}
              className={`px-4 py-2 rounded ${
                energyLevel === level 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              {level.charAt(0).toUpperCase() + level.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Search Query */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">Search</h3>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search amenities..."
          className="w-full px-4 py-2 border rounded"
        />
      </div>

      {/* Energy Suggestion */}
      {energySuggestion && (
        <div className="mb-6 p-4 bg-blue-50 rounded">
          <h3 className="text-lg font-semibold mb-2">Energy Suggestion</h3>
          <p className="text-sm mb-2">
            Suggested: <strong>{energySuggestion.suggestion.level}</strong> 
            (Confidence: {Math.round(energySuggestion.suggestion.confidence * 100)}%)
          </p>
          <div className="text-xs text-gray-600">
            <p><strong>Reasoning:</strong></p>
            <ul className="list-disc list-inside">
              {energySuggestion.suggestion.reasoning.map((reason, index) => (
                <li key={index}>{reason}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Recommendations */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">
          Recommendations ({recommendations.length})
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recommendations.map((amenity) => (
            <div key={amenity.id} className="p-4 border rounded shadow-sm">
              <h4 className="font-semibold">{amenity.name}</h4>
              <p className="text-sm text-gray-600">{amenity.category}</p>
              <p className="text-xs text-gray-500">{amenity.location}</p>
              <div className="mt-2">
                {amenity.vibe_tags?.map(vibe => (
                  <span key={vibe} className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded mr-1 mb-1">
                    {vibe}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Explanation */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">Explanation</h3>
        <div className="p-4 bg-gray-50 rounded">
          <p className="text-sm mb-2">
            <strong>Energy Level:</strong> {explanation.energyLevel}
          </p>
          <p className="text-sm mb-2">
            <strong>Reasoning:</strong> {explanation.reasoning.join(', ')}
          </p>
          <p className="text-sm">
            <strong>Factors:</strong> {explanation.factors.join(', ')}
          </p>
        </div>
      </div>

      {/* Journey Context */}
      <div className="text-sm text-gray-600">
        <p>Journey Context: {journeyContext}</p>
        <p>Fallbacks Available: {fallbacks.length}</p>
      </div>
    </div>
  );
};

export default SmartRecommendationsExample; 