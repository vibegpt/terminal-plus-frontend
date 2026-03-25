import React from "react";

interface VibeRecommendationCardProps {
  name: string;
  rating: number;
  location: string;
  hours: string;
  vibe: string;
  onDetailsClick: () => void;
}

const VIBE_COLORS: Record<string, string> = {
  Chill: "#A8D0E6",
  Explore: "#F76C6C",
  Work: "#D3B88C",
  Quick: "#FFDD57",
  Refuel: "#FF7F50",
  Comfort: "#CBAACB",
  Shop: "#FFD6E0",
};

export function VibeRecommendationCard({
  name,
  rating,
  location,
  hours,
  vibe,
  onDetailsClick
}: VibeRecommendationCardProps) {
  const vibeColor = VIBE_COLORS[vibe] || "#FFFFFF";

  return (
    <div
      className="p-4 rounded-xl shadow-xl border"
      style={{
        borderColor: vibeColor,
        boxShadow: `0 0 8px ${vibeColor}`,
        backgroundColor: "#0B0E1E",
        color: "#F4F4F4",
      }}
    >
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-bold">{name}</h3>
        <span className="text-xs py-1 px-2 rounded-full bg-white text-black">
          {vibe.toUpperCase()}
        </span>
      </div>
      <div className="text-sm text-gray-300">⭐ {rating.toFixed(1)}</div>
      <div className="text-sm text-gray-300">- {location}</div>
      <div className="text-sm text-gray-300">{hours}</div>
      <button
        onClick={onDetailsClick}
        className="mt-4 w-full py-2 rounded-xl font-semibold"
        style={{ backgroundColor: "#D946EF", color: "white" }}
      >
        View Details
      </button>
    </div>
  );
} 