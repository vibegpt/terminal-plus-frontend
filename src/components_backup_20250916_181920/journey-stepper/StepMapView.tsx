import React from "react";
import { useJourneyContext } from "@/context/JourneyContext";
import { useVibe } from "@/context/VibeContext";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

// Import mapping components
import TikTokStyleMap from "@/components/maps/TikTokStyleMap";
import EnhancedTerminalMap from "@/components/maps/EnhancedTerminalMap";

interface Props {
  onBack: () => void;
}

const StepMapView: React.FC<Props> = ({ onBack }) => {
  const { state } = useJourneyContext();
  const journeyData = state.flightData || {};
  const { selectedVibe } = useVibe();
  const navigate = useNavigate();

  const selectedTerminal = journeyData.terminal || "T1"; // Default to T1 if not set
  const vibe = journeyData.selected_vibe || selectedVibe || "Refuel";
  const userGate = "A1"; // Default gate since it's not in JourneyData

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">Your Personalized Terminal Map</h2>
        <p className="text-sm text-slate-600">
          Explore {journeyData.departure || "your departure"} terminal with your {vibe} vibe
        </p>
      </div>

      {/* Vibe Summary Card */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-blue-900 dark:text-blue-100">
              {journeyData.departure || "Departure"} Terminal {selectedTerminal}
            </h3>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              {vibe} vibe • Personalized recommendations
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl">🎯</div>
          </div>
        </div>
      </div>

      {/* TikTok-Style Map */}
      <div className="relative w-full mt-6 rounded-2xl overflow-hidden border border-gray-200 shadow-xl"
           style={{ boxShadow: `0 0 15px 2px ${getVibeColor(vibe)}` }}>
        <TikTokStyleMap
          terminal={selectedTerminal}
          vibe={vibe}
          gate={userGate}
        />
      </div>

      {/* Enhanced Terminal Map */}
      <div className="relative w-full mt-4 rounded-xl overflow-hidden border border-gray-300">
        <EnhancedTerminalMap
          terminal={selectedTerminal}
          showPathToGate={true}
          gate={userGate}
          timeToGateDisplay={true}
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 justify-center pt-4">
        <Button 
          variant="outline" 
          onClick={onBack}
          className="px-6"
        >
          ← Back to Planning
        </Button>
        <Button 
          onClick={() => navigate("/guide-view")}
          className="px-6"
        >
          View Full Guide →
        </Button>
      </div>
    </div>
  );
};

// Helper function to get vibe color
function getVibeColor(vibe: string): string {
  const vibeColorMap: Record<string, string> = {
    Refuel: "#FF7F50",
    Comfort: "#CBAACB", 
    Quick: "#FFDD57",
    Explore: "#F76C6C",
    Work: "#D3B88C",
    Shop: "#FFD6E0",
    Chill: "#A8D0E6",
  };
  return vibeColorMap[vibe] || "#FF7F50";
}

export default StepMapView; 