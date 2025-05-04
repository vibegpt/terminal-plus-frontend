import React, { useState } from "react";
import { useLocation } from "wouter";

type TripStop = {
  Name: string;
  Type: string;
  LocationDescription: string;
};

// Icon mapping for different types of amenities
const iconMap: Record<string, string> = {
  "Lounge": "🛋️",
  "Spa": "💆",
  "Coffee Shop": "☕",
  "Cafe": "☕",
  "Restaurant": "🍽️",
  "Quiet Zone": "🤫",
  "Sleep Pod": "🛏️",
  "Shower": "🚿",
  "Workspace": "💻",
  "Business Lounge": "📈",
  "Attraction": "🎡",
  "Shop": "🛍️",
  "Duty-Free": "🛒",
  "Entertainment": "🎬",
  "Food Court": "🍔",
  "Quick Bite": "🍕",
  "Convenience Store": "🏪",
  "Retail": "🛍️",
  "Service": "🔧",
};

// Tag styling for different types of amenities
const tagMap: Record<string, { label: string, color: string }> = {
  "Lounge": { label: "Lounge", color: "bg-purple-100 text-purple-800" },
  "Spa": { label: "Spa", color: "bg-pink-100 text-pink-800" },
  "Cafe": { label: "Cafe", color: "bg-yellow-100 text-yellow-800" },
  "Coffee Shop": { label: "Cafe", color: "bg-yellow-100 text-yellow-800" },
  "Restaurant": { label: "Restaurant", color: "bg-orange-100 text-orange-800" },
  "Quiet Zone": { label: "Quiet", color: "bg-blue-100 text-blue-800" },
  "Sleep Pod": { label: "Sleep", color: "bg-blue-50 text-blue-700" },
  "Shower": { label: "Shower", color: "bg-cyan-100 text-cyan-800" },
  "Workspace": { label: "Work", color: "bg-gray-100 text-gray-700" },
  "Business Lounge": { label: "Business", color: "bg-indigo-100 text-indigo-800" },
  "Attraction": { label: "Attraction", color: "bg-green-100 text-green-800" },
  "Shop": { label: "Shop", color: "bg-pink-100 text-pink-800" },
  "Duty-Free": { label: "Duty-Free", color: "bg-pink-50 text-pink-700" },
  "Entertainment": { label: "Entertainment", color: "bg-purple-50 text-purple-700" },
  "Food Court": { label: "Food", color: "bg-orange-100 text-orange-800" },
  "Quick Bite": { label: "Food", color: "bg-orange-100 text-orange-800" },
  "Convenience Store": { label: "Shop", color: "bg-gray-50 text-gray-600" },
  "Retail": { label: "Retail", color: "bg-pink-100 text-pink-800" },
  "Service": { label: "Service", color: "bg-gray-100 text-gray-800" },
};

type TripSegment = {
  airport: string;
  terminal: string;
  type: "Departure" | "Transit" | "Arrival/Final";
  vibe: "Relax" | "Explore" | "Work" | "Quick";
  plan: TripStop[];
};

interface MultiAirportTripProps {
  tripData: TripSegment[];
}

export default function MultiAirportTrip({ tripData }: MultiAirportTripProps) {
  const [_, setLocation] = useLocation();
  const [groupByType, setGroupByType] = useState(false);

  // Function to get the displayed plan based on grouping preference
  const getDisplayedPlan = (plan: TripStop[]): TripStop[] => {
    if (!groupByType) return plan;

    // Group by Type
    const grouped: Record<string, TripStop[]> = {};
    plan.forEach((stop) => {
      if (!grouped[stop.Type]) {
        grouped[stop.Type] = [];
      }
      grouped[stop.Type].push(stop);
    });

    // Flatten grouped list
    return Object.keys(grouped).flatMap((type) => grouped[type]);
  };

  if (!tripData || tripData.length === 0) {
    return (
      <div className="p-6 text-center">
        <p>No multi-airport trip planned yet.</p>
        <button
          onClick={() => setLocation("/")}
          className="mt-4 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition"
        >
          Plan New Journey
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6 text-center">🌍 Your Multi-Airport Journey</h1>
      
      <div className="text-center mb-6">
        <button
          onClick={() => setGroupByType(!groupByType)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition text-sm"
        >
          {groupByType ? "🧭 Show Original Order" : "🗂️ Group by Type"}
        </button>
      </div>

      <div className="flex flex-col gap-6">
        {tripData.map((segment, index) => (
          <div key={index} className="border p-4 rounded shadow">
            <div className="font-semibold text-lg mb-2">
              {segment.airport} {segment.terminal} ({segment.type})
            </div>

            <div className="text-sm text-gray-600 mb-2">
              Vibe: {segment.vibe}
            </div>

            <ul className="list-disc space-y-1 pl-4">
              {getDisplayedPlan(segment.plan).map((stop, idx) => (
                <li key={idx} className="text-sm flex items-start flex-wrap">
                  <span className="mr-2">
                    {iconMap[stop.Type] || "📍"}
                  </span>
                  <span className="font-medium">{stop.Name}</span>
                  <span
                    className={`ml-2 inline-block px-2 py-0.5 text-xs font-medium rounded-full ${
                      tagMap[stop.Type]?.color || "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {tagMap[stop.Type]?.label || stop.Type}
                  </span>
                  <span className="ml-1 text-gray-500 text-xs">({stop.LocationDescription})</span>
                </li>
              ))}
            </ul>

            <div className="text-right mt-4">
              <button
                onClick={() => {
                  // Store journey plan in localStorage before navigating
                  localStorage.setItem("currentJourneyPlan", JSON.stringify(segment.plan));
                  setLocation("/my-journey");
                }}
                className="text-blue-600 underline text-sm"
              >
                View Full {segment.airport} Plan ➔
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}