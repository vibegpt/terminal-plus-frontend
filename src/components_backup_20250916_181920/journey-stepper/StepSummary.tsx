import React, { useState } from "react";
import { useVibeColors } from "@/hooks/useVibeColors";
import { useJourneyContext } from "@/hooks/useJourneyContext";

interface Props {
  onSelectContext: (context: 'departure' | 'transit' | 'arrival') => void;
}

const StepSummary: React.FC<Props> = ({ onSelectContext }) => {
  const { getVibeColor } = useVibeColors();
  const { journeyData } = useJourneyContext();
  const selectedColor = getVibeColor(journeyData.selected_vibe);
  const [selectedContext, setSelectedContext] = useState<'departure' | 'transit' | 'arrival' | null>(null);

  // Debug logging
  console.log("🔍 StepSummary loaded with:", {
    journeyData,
    selectedVibe: journeyData.selected_vibe,
    selectedColor
  });

  // STABLE VERSION - Always show three cards
  // These colors are fixed and won't change
  const transitColor = '#6B7280'; // Gray - never changes
  const arrivalColor = '#8B5CF6'; // Purple - never changes

  const handleContextSelect = (context: 'departure' | 'transit' | 'arrival') => {
    console.log("🔍 Context selected:", context);
    setSelectedContext(context);
    onSelectContext(context);
  };

  return (
    <div className="space-y-6">
      {/* Header - Always visible */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Choose Your Journey Context</h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">Click on a card to select your journey context</p>
      </div>
      
      {/* Three Cards - Always visible, never conditional */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Departure - Always shows */}
        <div
          className={`flex flex-col items-center justify-start rounded-lg p-6 shadow-lg hover:shadow-xl transition-all duration-200 min-h-[200px] cursor-pointer transform hover:scale-105 ${
            selectedContext === 'departure' ? 'ring-4 ring-blue-500 ring-offset-2 scale-105' : ''
          }`}
          style={{ 
            background: selectedColor, 
            border: `3px solid ${selectedColor}`,
            boxShadow: selectedContext === 'departure' 
              ? `0 8px 25px ${selectedColor}60` 
              : `0 4px 12px ${selectedColor}40`
          }}
          onClick={() => handleContextSelect('departure')}
        >
          <h3 className="text-lg font-bold text-blue-900 dark:text-blue-100 mb-3">
            {journeyData.departure || 'Departure'} Departure
          </h3>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border-2 font-semibold mb-3 bg-white/80 dark:bg-slate-900/80 border-blue-400 dark:border-blue-700 text-blue-800 dark:text-blue-200">
            {journeyData.selected_vibe || 'Refuel'} Vibe
          </div>
          <div className="text-slate-700 dark:text-slate-200 text-sm text-center">
            Personalized recommendations for your vibe at {journeyData.departure || 'Departure'}.
          </div>
          {selectedContext === 'departure' && (
            <div className="mt-3 text-blue-600 dark:text-blue-400 font-semibold">
              ✓ Selected
            </div>
          )}
        </div>

        {/* Card 2: Transit - Always shows */}
        <div
          className={`flex flex-col items-center justify-start rounded-lg p-6 shadow-lg hover:shadow-xl transition-all duration-200 min-h-[200px] cursor-pointer transform hover:scale-105 ${
            selectedContext === 'transit' ? 'ring-4 ring-gray-500 ring-offset-2 scale-105' : ''
          }`}
          style={{ 
            background: transitColor, 
            border: `3px solid ${transitColor}`,
            boxShadow: selectedContext === 'transit' 
              ? `0 8px 25px ${transitColor}60` 
              : `0 4px 12px ${transitColor}40`
          }}
          onClick={() => handleContextSelect('transit')}
        >
          <h3 className="text-lg font-bold text-white mb-3">
            {journeyData.layovers?.[0] || 'Transit'} Transit
          </h3>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border-2 font-semibold mb-3 bg-white border-gray-300 text-gray-800 shadow-sm">
            Mixed Picks
          </div>
          <div className="text-white/90 text-sm text-center">
            Curated mix of amenities for your layover at {journeyData.layovers?.[0] || 'Transit'}.
          </div>
          {selectedContext === 'transit' && (
            <div className="mt-3 text-white font-semibold">
              ✓ Selected
            </div>
          )}
        </div>

        {/* Card 3: Arrival - Always shows */}
        <div
          className={`flex flex-col items-center justify-start rounded-lg p-6 shadow-lg hover:shadow-xl transition-all duration-200 min-h-[200px] cursor-pointer transform hover:scale-105 ${
            selectedContext === 'arrival' ? 'ring-4 ring-purple-500 ring-offset-2 scale-105' : ''
          }`}
          style={{ 
            background: arrivalColor, 
            border: `3px solid ${arrivalColor}`,
            boxShadow: selectedContext === 'arrival' 
              ? `0 8px 25px ${arrivalColor}60` 
              : `0 4px 12px ${arrivalColor}40`
          }}
          onClick={() => handleContextSelect('arrival')}
        >
          <h3 className="text-lg font-bold text-white mb-3">
            {journeyData.destination || 'Arrival'} Arrival
          </h3>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border-2 font-semibold mb-3 bg-white border-gray-300 text-gray-800 shadow-sm">
            Mixed Picks
          </div>
          <div className="text-white/90 text-sm text-center">
            Curated mix of amenities for your arrival at {journeyData.destination || 'Arrival'}.
          </div>
          {selectedContext === 'arrival' && (
            <div className="mt-3 text-white font-semibold">
              ✓ Selected
            </div>
          )}
        </div>
      </div>
      
      {/* Status indicator - Always visible */}
      <div className="text-center">
        {selectedContext ? (
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-xs">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            {selectedContext.charAt(0).toUpperCase() + selectedContext.slice(1)} context selected
          </div>
        ) : (
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs">
            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
            Click a card to select your journey context
          </div>
        )}
      </div>
    </div>
  );
};

export default StepSummary; 