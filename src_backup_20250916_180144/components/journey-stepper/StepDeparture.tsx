import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { ChevronDown } from "lucide-react";
import { useJourneyContext } from "@/hooks/useJourneyContext";

interface Props {
  onLevelUpToggle?: (isExpanded: boolean) => void;
}

const StepDeparture: React.FC<Props> = ({ onLevelUpToggle }) => {
  const { journeyData, setJourneyData } = useJourneyContext();
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Notify parent when Level Up section is toggled
  useEffect(() => {
    onLevelUpToggle?.(showAdvanced);
  }, [showAdvanced, onLevelUpToggle]);

  return (
    <div className="space-y-4">
      {/* Required Fields Section */}
      <div className="space-y-2">
        <p className="text-sm text-slate-200 text-center">
          <span className="text-red-500">*</span> Required fields
        </p>
        <div className="flex flex-row gap-4">
          <div className="flex-1">
            <h3 className="text-sm font-semibold mb-1 text-slate-100 text-center">
              Departure <span className="text-red-500">*</span>
            </h3>
            <Input
              type="text"
              placeholder="e.g., SYD"
              value={journeyData.departure}
              onChange={(e) => setJourneyData({ ...journeyData, departure: e.target.value.toUpperCase() })}
              className="w-full"
            />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold mb-1 text-slate-100 text-center">
              Arrival <span className="text-red-500">*</span>
            </h3>
            <Input
              type="text"
              placeholder="e.g., LHR"
              value={journeyData.destination}
              onChange={(e) => setJourneyData({ ...journeyData, destination: e.target.value.toUpperCase() })}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* Level Up Section */}
      <div className="space-y-3">
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 text-white hover:bg-fuchsia-500 transition-colors text-sm font-medium px-4 py-2 rounded-lg shadow"
            style={{ backgroundColor: "#D946EF" }}
          >
            <ChevronDown className={`h-4 w-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
            <span>Level up with flight + layover details</span>
          </button>
        </div>

        {showAdvanced && (
          <div className="space-y-2">
            <p className="text-sm text-slate-200 text-center">
              <span className="text-orange-500">⚡</span> Additional fields for smarter recommendations
            </p>
            <div className="flex flex-row gap-4">
              <div className="flex-1">
                <h3 className="text-sm font-semibold mb-1 text-slate-100 text-center">
                  Flight Number
                </h3>
                <Input
                  type="text"
                  placeholder="e.g., QF1"
                  value={journeyData.flightNumber || ""}
                  onChange={(e) => setJourneyData({ ...journeyData, flightNumber: e.target.value.toUpperCase() })}
                  className="w-full"
                />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold mb-1 text-slate-100 text-center">
                  Flight Date
                </h3>
                <Input
                  type="date"
                  value={journeyData.flightDate || ""}
                  onChange={(e) => setJourneyData({ ...journeyData, flightDate: e.target.value })}
                  className="w-full"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold mb-1 text-slate-100 text-center">
                  Transit Airport
                </h3>
                <Input
                  type="text"
                  placeholder="e.g., SIN"
                  value={journeyData.layovers?.[0] || ""}
                  onChange={(e) => setJourneyData({
                    ...journeyData,
                    layovers: [e.target.value.toUpperCase(), ...(journeyData.layovers?.slice(1) || [])]
                  })}
                  className="w-full"
                  maxLength={3}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StepDeparture; 