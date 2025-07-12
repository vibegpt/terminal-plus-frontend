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
  "Lounge": { label: "Lounge", color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200" },
  "Spa": { label: "Spa", color: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200" },
  "Cafe": { label: "Cafe", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" },
  "Coffee Shop": { label: "Cafe", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" },
  "Restaurant": { label: "Restaurant", color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200" },
  "Quiet Zone": { label: "Quiet", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
  "Sleep Pod": { label: "Sleep", color: "bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-200" },
  "Shower": { label: "Shower", color: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200" },
  "Workspace": { label: "Work", color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200" },
  "Business Lounge": { label: "Business", color: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200" },
  "Attraction": { label: "Attraction", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
  "Shop": { label: "Shop", color: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200" },
  "Duty-Free": { label: "Duty-Free", color: "bg-pink-50 text-pink-700 dark:bg-pink-900 dark:text-pink-200" },
  "Entertainment": { label: "Entertainment", color: "bg-purple-50 text-purple-700 dark:bg-purple-900 dark:text-purple-200" },
  "Food Court": { label: "Food", color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200" },
  "Quick Bite": { label: "Food", color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200" },
  "Convenience Store": { label: "Shop", color: "bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-200" },
  "Retail": { label: "Retail", color: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200" },
  "Service": { label: "Service", color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200" },
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
      <div className="p-6 text-center bg-white dark:bg-slate-900 rounded-lg shadow-md">
        <p className="text-slate-900 dark:text-white">No multi-airport trip planned yet.</p>
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
    <div className="p-6 bg-white dark:bg-slate-900 rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6 text-center text-slate-900 dark:text-white">🌍 Your Multi-Airport Journey</h1>
      
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
          <div key={index} className="border p-4 rounded shadow bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <div className="font-semibold text-lg mb-2 text-slate-900 dark:text-white">
              {segment.airport} {segment.terminal} ({segment.type})
            </div>

            <div className="text-sm text-gray-600 dark:text-gray-300 mb-2">
              Vibe: {segment.vibe}
            </div>

            <ul className="list-disc space-y-1 pl-4 text-gray-700 dark:text-gray-200">
              {getDisplayedPlan(segment.plan).map((stop, idx) => (
                <li key={idx} className="text-sm flex items-start flex-wrap">
                  <span className="mr-2">
                    {iconMap[stop.Type] || "📍"}
                  </span>
                  <span className="font-medium text-slate-900 dark:text-white">{stop.Name}</span>
                  <span
                    className={`ml-2 inline-block px-2 py-0.5 text-xs font-medium rounded-full ${
                      tagMap[stop.Type]?.color || "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-200"
                    }`}
                  >
                    {tagMap[stop.Type]?.label || stop.Type}
                  </span>
                  <span className="ml-1 text-gray-500 dark:text-gray-400 text-xs">({stop.LocationDescription})</span>
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
                className="text-blue-600 dark:text-blue-400 underline text-sm"
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