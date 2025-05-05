import React, { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

type SavedJourney = {
  id: string;
  airport: string;
  terminal: string;
  plan: any[];
  created_at: string;
};

export default function SavedJourneys() {
  const [_, setLocation] = useLocation();
  const [savedJourneys, setSavedJourneys] = useState<SavedJourney[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.gtag?.("event", "saved_journeys_viewed");

    async function loadJourneys() {
      try {
        const response = await fetch("/api/loadTerminalJourneys");

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data && data.success && data.journeys) {
          setSavedJourneys(data.journeys);
        } else {
          console.error("No journeys returned or error in response:", data);
        }
      } catch (error) {
        console.error("Failed to load journeys:", error);
      } finally {
        setLoading(false);
      }
    }

    loadJourneys();
  }, []);

  const handleViewJourney = (journey: SavedJourney) => {
    window.gtag?.("event", "saved_journey_view_clicked", {
      journey_id: journey.id,
      airport: journey.airport,
      terminal: journey.terminal,
      num_stops: journey.plan?.length || 0,
    });

    sessionStorage.setItem("journeyPlan", JSON.stringify(journey.plan));
    setLocation("/my-journey");
  };

  const handlePlanNew = () => {
    window.gtag?.("event", "plan_new_journey_clicked", {
      source: "saved_journeys"
    });

    setLocation("/simplified-journey-input");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-6 min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading your saved journeys...</span>
      </div>
    );
  }

  if (savedJourneys.length === 0) {
    return (
      <div className="p-6 text-center max-w-md mx-auto">
        <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-md">
          <h1 className="text-2xl font-bold mb-4 text-center">Your Saved Journeys</h1>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            No saved journeys found. Plan your next airport adventure!
          </p>
          <Button
            onClick={handlePlanNew}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600"
          >
            Plan New Journey
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-md mb-6">
        <h1 className="text-2xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-indigo-600 text-transparent bg-clip-text">
          Your Saved Terminal+ Journeys ✈️
        </h1>

        <div className="space-y-4">
          {savedJourneys.map((journey) => (
            <div
              key={journey.id}
              className="border border-slate-200 dark:border-slate-700 p-4 rounded-lg hover:shadow-md transition"
            >
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="font-semibold">{journey.airport} {journey.terminal}</h3>
                  <div className="text-slate-500 dark:text-slate-400 text-sm">
                    {new Date(journey.created_at).toLocaleString()}
                  </div>
                </div>
                <div className="flex">
                  <Button
                    onClick={() => handleViewJourney(journey)}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 text-sm"
                    size="sm"
                  >
                    View Journey
                  </Button>
                </div>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {journey.plan && journey.plan.length} stops planned
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="text-center">
        <Button
          onClick={handlePlanNew}
          variant="outline"
          className="text-primary-600"
        >
          Plan a New Journey
        </Button>
      </div>
    </div>
  );
}