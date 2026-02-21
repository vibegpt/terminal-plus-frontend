import React, { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";
import MultiAirportTimeline from "@/components/MultiAirportTimeline";

type TripStop = {
  Name: string;
  Type: string;
  LocationDescription: string;
};

type TripSegment = {
  airport: string;
  terminal: string;
  type: "Departure" | "Transit" | "Arrival/Final";
  vibe: "Relax" | "Explore" | "Work" | "Quick";
  plan: TripStop[];
};

type TripData = {
  id: string;
  title: string;
  journeys: TripSegment[];
  created_at: string;
};

export default function PublicTripPage() {
  const [tripData, setTripData] = useState<TripSegment[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [location] = useLocation();
  
  useEffect(() => {
    async function loadTrip() {
      try {
        // With wouter, extract the query parameters from the location
        // Parse the query params from the URL directly
        const searchParams = location.split('?')[1] || '';
        const urlParams = new URLSearchParams(searchParams);
        const tripId = urlParams.get("id");
        
        if (!tripId) {
          setError("No trip ID provided");
          setLoading(false);
          return;
        }
        
        const response = await fetch(`/api/loadSingleTrip?id=${tripId}`);
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || "Failed to load trip");
        }
        
        if (data && data.trip) {
          setTripData(data.trip.journeys);
        } else {
          setError("Trip not found");
        }
      } catch (err) {
        console.error("Error loading trip:", err);
        setError(err instanceof Error ? err.message : "An error occurred while loading the trip");
      } finally {
        setLoading(false);
      }
    }

    loadTrip();
  }, [location]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white dark:bg-slate-900">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500 dark:text-blue-400" />
        <p className="ml-2 text-lg text-slate-700 dark:text-slate-300">Loading shared trip plan...</p>
      </div>
    );
  }

  if (error || !tripData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center bg-white dark:bg-slate-900">
        <h1 className="text-2xl font-bold text-red-500 dark:text-red-400 mb-2">Error</h1>
        <p className="text-gray-700 dark:text-gray-300">{error || "Trip not found or invalid link"}</p>
        <a 
          href="/"
          className="mt-4 px-4 py-2 bg-blue-500 dark:bg-blue-700 text-white rounded hover:bg-blue-600 dark:hover:bg-blue-800 transition"
        >
          Go Home
        </a>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white dark:bg-slate-900 min-h-screen">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold text-center mb-6 text-slate-900 dark:text-white">Shared Trip Plan</h1>
        <p className="text-center mb-8 text-gray-600 dark:text-gray-300">
          This is a shared multi-airport journey plan. You can view the itinerary below.
        </p>
        
        <MultiAirportTimeline tripData={tripData} />
        
        <div className="text-center mt-8">
          <button
            onClick={() => window.print()}
            className="bg-blue-600 dark:bg-blue-700 text-white py-2 px-6 rounded hover:bg-blue-700 dark:hover:bg-blue-800 transition text-sm"
          >
            🖨️ Print / Save as PDF
          </button>
        </div>
      </div>
    </div>
  );
}