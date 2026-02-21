import React from "react";
import { useJourneyContext } from "@/context/JourneyContext";
import { useVibeColors } from "@/hooks/useVibeColors";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const JourneyDataDisplay: React.FC = () => {
  const { state } = useJourneyContext();
  const journeyData = state.flightData || {};
  const { getVibeColor } = useVibeColors();

  // Don't render if no journey data is set
  if (!journeyData.departure && !journeyData.destination && !journeyData.selected_vibe) {
    return null;
  }

  const vibeColor = getVibeColor(journeyData.selected_vibe);

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          ✈️ Current Journey
          {journeyData.selected_vibe && (
            <Badge 
              style={{ backgroundColor: vibeColor }}
              className="text-white"
            >
              {journeyData.selected_vibe}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {journeyData.departure && (
          <div className="flex justify-between">
            <span className="font-medium">From:</span>
            <span className="text-slate-600 dark:text-slate-400">{journeyData.departure}</span>
          </div>
        )}
        {journeyData.destination && (
          <div className="flex justify-between">
            <span className="font-medium">To:</span>
            <span className="text-slate-600 dark:text-slate-400">{journeyData.destination}</span>
          </div>
        )}
        {journeyData.flightNumber && (
          <div className="flex justify-between">
            <span className="font-medium">Flight:</span>
            <span className="text-slate-600 dark:text-slate-400">{journeyData.flightNumber}</span>
          </div>
        )}
        {journeyData.flightDate && (
          <div className="flex justify-between">
            <span className="font-medium">Date:</span>
            <span className="text-slate-600 dark:text-slate-400">{journeyData.flightDate}</span>
          </div>
        )}
        {journeyData.layovers && journeyData.layovers.length > 0 && (
          <div className="flex justify-between">
            <span className="font-medium">Transit:</span>
            <span className="text-slate-600 dark:text-slate-400">{journeyData.layovers.join(", ")}</span>
          </div>
        )}
        {journeyData.terminal && (
          <div className="flex justify-between">
            <span className="font-medium">Terminal:</span>
            <span className="text-slate-600 dark:text-slate-400">{journeyData.terminal}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default JourneyDataDisplay; 