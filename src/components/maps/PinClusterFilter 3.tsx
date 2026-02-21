import React from 'react';

interface PinClusterFilterProps {
  terminal: string;
  activeFilters: string[];
  onFilterChange: (updated: string[]) => void;
  journeyContext: 'departure' | 'transit' | 'arrival';
  selectedVibe?: string;
}

const TAGS = ["Chill", "Explore", "Work", "Quick", "Refuel", "Comfort", "Shop"];

const vibeColorMap: Record<string, string> = {
  Chill: "#A8D0E6",
  Explore: "#F76C6C",
  Work: "#D3B88C",
  Quick: "#FFDD57",
  Refuel: "#FF7F50",
  Comfort: "#CBAACB",
  Shop: "#FFD6E0"
};

const journeyContextColorMap: Record<'departure' | 'transit' | 'arrival', string> = {
  departure: "#FFE680", // Soft Yellow
  transit: "#DCC6FF",   // Soft Purple
  arrival: "#A8E6FF"     // Soft Blue
};

const PinClusterFilter: React.FC<PinClusterFilterProps> = ({ terminal, activeFilters, onFilterChange, journeyContext, selectedVibe }) => {
  const toggleFilter = (tag: string) => {
    if (activeFilters.includes(tag)) {
      onFilterChange(activeFilters.filter(t => t !== tag));
    } else {
      onFilterChange([...activeFilters, tag]);
    }
  };

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 px-2">
      {TAGS.map(tag => {
        const isActive = activeFilters.includes(tag);
        const baseColor = selectedVibe ? vibeColorMap[selectedVibe] : journeyContextColorMap[journeyContext];

        return (
          <button
            key={tag}
            onClick={() => toggleFilter(tag)}
            style={{
              backgroundColor: isActive ? baseColor : "#f3f4f6",
              color: isActive ? "#000" : "#374151",
              border: `1px solid ${isActive ? baseColor : "#d1d5db"}`
            }}
            className="px-4 py-1 rounded-full text-sm whitespace-nowrap transition-colors duration-200 font-medium shadow-sm"
          >
            {tag}
          </button>
        );
      })}
    </div>
  );
};

export default PinClusterFilter; 