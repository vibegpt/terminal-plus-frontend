import React, { useState } from "react";
import EnergySuggestionCard from "./EnergySuggestionCard";

type EnergyLevel = 'low' | 'medium' | 'high' | 'energetic' | 'normal';

const EnergySuggestionExample: React.FC = () => {
  const [selectedEnergy, setSelectedEnergy] = useState<EnergyLevel | null>(null);
  const [showOverride, setShowOverride] = useState(true);

  // Example suggestion data
  const exampleSuggestion = {
    suggestion: {
      id: "energy_suggestion_1",
      label: "Low",
      icon: "😴",
      description: "Based on your late evening flight and chill vibe preference"
    },
    message: "You seem like you might be feeling tired. Should we suggest some relaxing options?",
    showOverride
  };

  const handleOverride = (energyLevel: EnergyLevel) => {
    setSelectedEnergy(energyLevel);
    setShowOverride(false);
    console.log("User selected energy level:", energyLevel);
  };

  const resetSuggestion = () => {
    setSelectedEnergy(null);
    setShowOverride(true);
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Energy Suggestion Example</h2>

      {/* Energy Suggestion Card */}
      <EnergySuggestionCard
        suggestion={exampleSuggestion}
        onOverride={handleOverride}
      />

      {/* User Selection Display */}
      {selectedEnergy && (
        <div className="mt-6 p-4 bg-green-50 border border-green-300 rounded-xl">
          <h3 className="text-lg font-semibold text-green-900 mb-2">
            Energy Level Selected
          </h3>
          <p className="text-green-700">
            You selected: <strong>{selectedEnergy}</strong>
          </p>
          <button
            onClick={resetSuggestion}
            className="mt-3 px-4 py-2 bg-green-200 text-green-900 rounded hover:bg-green-300 transition-colors"
          >
            Reset Suggestion
          </button>
        </div>
      )}

      {/* Toggle Override Controls */}
      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-3">Controls</h3>
        <div className="flex space-x-4">
          <button
            onClick={() => setShowOverride(!showOverride)}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            {showOverride ? "Hide" : "Show"} Override Options
          </button>
        </div>
      </div>

      {/* Different Suggestion Examples */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-4">Different Suggestion Types</h3>
        
        <div className="space-y-4">
          {/* High Energy Suggestion */}
          <EnergySuggestionCard
            suggestion={{
              suggestion: {
                id: "energy_suggestion_2",
                label: "High",
                icon: "⚡",
                description: "Based on your morning flight and explore vibe"
              },
              message: "You seem energized! Ready to explore some exciting options?",
              showOverride: true
            }}
            onOverride={handleOverride}
          />

          {/* Medium Energy Suggestion */}
          <EnergySuggestionCard
            suggestion={{
              suggestion: {
                id: "energy_suggestion_3",
                label: "Medium",
                icon: "😌",
                description: "Based on your afternoon transit and comfort preference"
              },
              message: "You seem balanced. Let's find some comfortable middle-ground options.",
              showOverride: true
            }}
            onOverride={handleOverride}
          />
        </div>
      </div>
    </div>
  );
};

export default EnergySuggestionExample; 