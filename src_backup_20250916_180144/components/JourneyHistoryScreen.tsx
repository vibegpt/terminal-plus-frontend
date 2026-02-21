import React, { useEffect, useState } from "react";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import type { JourneyData } from "@/types/journey.types";
import type { Vibe } from "@/types/common.types";

// Local interface for API journey data
type ApiJourney = {
  id: string;
  flight_number: string;
  origin: string;
  destination: string;
  transit?: string;
  selected_vibe: Vibe;
  departure_time?: string;
  created_at: string;
};

export function JourneyHistoryScreen() {
  const [journeys, setJourneys] = useState<ApiJourney[]>([]);
  const [activeTab, setActiveTab] = useState<"all" | "upcoming" | "completed">("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchJourneys = async () => {
      setLoading(true);
      try {
        const res = await fetchWithAuth("/api/journeyHistory");
        const data = await res.json();
        setJourneys(data);
      } catch (err) {
        console.error("Error fetching journeys:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchJourneys();
  }, []);

  const now = new Date();

  const upcomingJourneys = journeys.filter(journey =>
    journey.departure_time && new Date(journey.departure_time) > now
  );

  const completedJourneys = journeys.filter(journey =>
    journey.departure_time && new Date(journey.departure_time) <= now
  );

  const journeysToDisplay =
    activeTab === "upcoming"
      ? upcomingJourneys
      : activeTab === "completed"
      ? completedJourneys
      : journeys;

  return (
    <div className="p-4 space-y-4 bg-white dark:bg-slate-900 min-h-screen">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Your Journeys 🧳</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Past and upcoming flights</p>
      </div>

      <div className="flex space-x-2 mb-4">
        <button 
          onClick={() => setActiveTab("all")} 
          className={`px-3 py-1 rounded-lg ${activeTab === "all" 
            ? "bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 font-semibold" 
            : "text-slate-600 dark:text-slate-400"}`}
        >
          All Journeys
        </button>
        <button 
          onClick={() => setActiveTab("upcoming")} 
          className={`px-3 py-1 rounded-lg ${activeTab === "upcoming" 
            ? "bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 font-semibold" 
            : "text-slate-600 dark:text-slate-400"}`}
        >
          Upcoming
        </button>
        <button 
          onClick={() => setActiveTab("completed")} 
          className={`px-3 py-1 rounded-lg ${activeTab === "completed" 
            ? "bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 font-semibold" 
            : "text-slate-600 dark:text-slate-400"}`}
        >
          Completed
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full"></div>
        </div>
      ) : journeysToDisplay.length === 0 ? (
        <div className="text-center py-12">
          <div className="flex flex-col items-center">
            <p className="text-slate-500 dark:text-slate-400">No journeys to display.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {journeysToDisplay.map((journey) => (
            <div key={journey.id} className="p-4 rounded-lg shadow-md bg-white dark:bg-slate-800">
              <p className="text-lg font-semibold text-slate-900 dark:text-white">{journey.flight_number}: {journey.origin} ➔ {journey.destination}</p>
              {journey.transit && <p className="text-sm text-slate-500 dark:text-slate-400">Transit via {journey.transit}</p>}
              <p className="text-sm text-slate-400 dark:text-slate-300">Vibe: {journey.selected_vibe}</p>
              <p className="text-xs text-slate-400 dark:text-slate-300">
                Departure: {journey.departure_time ? new Date(journey.departure_time).toLocaleString() : "Unknown"}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
