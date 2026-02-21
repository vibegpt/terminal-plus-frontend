import React from "react";
import { Button } from "@/components/ui/button";
import { useVibeColors } from "@/hooks/useVibeColors";
import { useAnalytics } from "@/context/AnalyticsContext";
import { vibeColorMap } from "@/constants/vibeColorsGenZ";
import { useJourneyContext } from "@/hooks/useJourneyContext";

const vibes = [
  { value: "Chill", label: "🛋️ CHILL" },
  { value: "Refuel", label: "⛽ REFUEL" },
  { value: "Comfort", label: "🛏️ COMFORT" },
  { value: "Explore", label: "🗽 EXPLORE" },
  { value: "Quick", label: "⚡ QUICK" },
  { value: "Work", label: "💼 WORK" },
  { value: "Shop", label: "🛒 SHOP" }
];

const StepVibeSelection: React.FC = () => {
  const { getVibeColor } = useVibeColors();
  const { journeyData, setJourneyData } = useJourneyContext();
  const { trackVibeChange, updateTravelContext } = useAnalytics();

  const getVibeGlowStyle = (vibe: string, isSelected: boolean) => {
    if (!isSelected) return {};
    
    const vibeColor = vibeColorMap[vibe] || '#CCCCCC';
    return {
      backgroundColor: '#1a1a1a', // Dark background for maximum contrast
      border: `3px solid ${vibeColor}`,
      boxShadow: `0 0 30px ${vibeColor}60, 0 0 15px ${vibeColor}40, inset 0 0 20px ${vibeColor}15`,
      color: '#ffffff', // White text for maximum contrast
      fontWeight: '900', // Maximum bold text
      // Add a subtle background pattern with the vibe color
      backgroundImage: `linear-gradient(45deg, ${vibeColor}30 25%, transparent 25%, transparent 75%, ${vibeColor}30 75%)`,
      // Add text outline for maximum visibility
      WebkitTextStroke: '1px black',
      textStroke: '1px black',
      // Ensure all letters are clearly visible
      letterSpacing: '0.5px',
      textTransform: 'uppercase'
    };
  };

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Choose Your Journey Vibe
        </h3>
      </div>
      
      <div className="flex flex-wrap gap-4 justify-center">
        {vibes.map(vibe => (
          <Button
            key={vibe.value}
            variant="outline"
            onClick={() => {
              setJourneyData({ ...journeyData, selected_vibe: vibe.value });
              trackVibeChange(vibe.value);
              updateTravelContext({ vibeSelected: vibe.value });
            }}
            className={`min-w-[120px] transition-all duration-300 hover:scale-105 ${
              journeyData.selected_vibe === vibe.value 
                ? 'border-2 shadow-lg font-bold' 
                : 'border border-gray-300 hover:border-gray-400'
            }`}
            style={{
              ...getVibeGlowStyle(vibe.value, journeyData.selected_vibe === vibe.value),
              // Ensure text is always visible with proper contrast
              color: journeyData.selected_vibe === vibe.value ? '#ffffff' : '#374151',
              backgroundColor: journeyData.selected_vibe === vibe.value ? '#1a1a1a' : '#ffffff',
              // Additional fallback for better text visibility
              filter: journeyData.selected_vibe === vibe.value ? 'contrast(1.5)' : 'none',
              // Extra text shadow for selected state to ensure all letters are visible
              textShadow: journeyData.selected_vibe === vibe.value ? 
                '0 2px 4px rgba(0,0,0,1), 0 1px 2px rgba(0,0,0,1), 0 0 8px rgba(0,0,0,0.8)' : 'none'
            }}
          >
            {vibe.label}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default StepVibeSelection; 