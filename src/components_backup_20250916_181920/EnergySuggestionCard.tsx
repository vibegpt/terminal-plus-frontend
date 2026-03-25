import React from "react";

type EnergyLevel = 'low' | 'medium' | 'high' | 'energetic' | 'normal';

type SuggestionData = {
  id: string;
  label: string;
  icon: string;
  description: string;
};

type Props = {
  suggestion: {
    suggestion: SuggestionData;
    message: string;
    showOverride: boolean;
  };
  onOverride: (energyLevel: EnergyLevel) => void;
};

const EnergySuggestionCard: React.FC<Props> = ({ suggestion, onOverride }) => {
  if (!suggestion?.suggestion) return null;

  const { icon, label, description } = suggestion.suggestion;

  const handleOverride = (level: EnergyLevel) => {
    onOverride(level);
  };

  return (
    <div className="p-4 bg-yellow-50 border border-yellow-300 rounded-xl shadow-md mb-4 animate-fadeIn">
      <div className="flex items-center space-x-3">
        <div className="text-3xl">{icon}</div>
        <div className="flex-1">
          <p className="text-sm font-medium text-yellow-900">
            {suggestion.message}
          </p>
          <p className="text-xs text-yellow-700 mt-1">{description}</p>
        </div>
      </div>

      {suggestion.showOverride && (
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <button
            onClick={() => handleOverride(label.toLowerCase() as EnergyLevel)}
            className="px-3 py-1 bg-yellow-200 text-yellow-900 rounded-full hover:bg-yellow-300 transition-colors"
          >
            That's right
          </button>
          <button
            onClick={() => handleOverride("energetic")}
            className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full hover:bg-yellow-200 transition-colors"
          >
            Actually, I feel great
          </button>
          <button
            onClick={() => handleOverride("normal")}
            className="px-3 py-1 underline text-yellow-600 hover:text-yellow-800 transition-colors"
          >
            Show all options
          </button>
        </div>
      )}
    </div>
  );
};

export default EnergySuggestionCard; 