import React, { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

type Stop = {
  name: string;
  type: string;
  location: string;
  description?: string;
  walkingTime?: string;
  stayDuration?: string;
};

export default function StartJourney() {
  const [_, setLocation] = useLocation();
  const [currentStop, setCurrentStop] = useState<Stop | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Retrieve journey plan from session storage
    const journeyPlanJson = sessionStorage.getItem("journeyPlan");
    
    if (!journeyPlanJson) {
      // No journey plan found, redirect to input
      setLocation("/simplified-journey-input");
      return;
    } 
    
    try {
      const journeyPlan = JSON.parse(journeyPlanJson);
      
      if (!journeyPlan || journeyPlan.length === 0) {
        // Empty journey plan, redirect to input
        setLocation("/simplified-journey-input");
      } else {
        // Set the first stop as the current stop
        setCurrentStop(journeyPlan[0]);
        setLoading(false);
      }
    } catch (error) {
      console.error("Error parsing journey plan:", error);
      setLocation("/simplified-journey-input");
    }
  }, [setLocation]);

  const handleViewFullJourney = () => {
    setLocation("/my-journey");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-6 min-h-screen bg-white dark:bg-slate-900">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-slate-700 dark:text-slate-300">Loading your starting point...</span>
      </div>
    );
  }

  if (!currentStop) {
    return (
      <div className="p-6 text-center max-w-md mx-auto bg-white dark:bg-slate-900">
        <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-md">
          <h1 className="text-2xl font-bold mb-4 text-slate-900 dark:text-white">Journey Error</h1>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Unable to load your journey information. Please try planning a new journey.
          </p>
          <Button
            onClick={() => setLocation("/simplified-journey-input")}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
          >
            Plan New Journey
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 flex flex-col items-center text-center max-w-md mx-auto bg-white dark:bg-slate-900">
      <h1 className="text-2xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-indigo-600 text-transparent bg-clip-text">
        🚶‍♂️ Let's Start Your Journey!
      </h1>

      <div className="bg-white dark:bg-slate-800 shadow-lg rounded-lg p-6 w-full mb-8">
        <h2 className="text-xl font-semibold mb-4 text-slate-900 dark:text-white">{currentStop.name}</h2>
        <p className="text-slate-600 dark:text-slate-400 mb-2">{currentStop.type}</p>
        <p className="text-slate-500 dark:text-slate-500 mb-4">{currentStop.location}</p>

        {currentStop.description && (
          <p className="text-slate-600 dark:text-slate-400 mb-4 italic">
            "{currentStop.description}"
          </p>
        )}

        {currentStop.walkingTime && (
          <div className="bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-lg p-2 mb-4 flex items-center">
            <span className="mr-2">🚶</span>
            <span>Walking Time: {currentStop.walkingTime}</span>
          </div>
        )}

        {currentStop.stayDuration && (
          <div className="bg-purple-50 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 rounded-lg p-2 mb-4 flex items-center">
            <span className="mr-2">⏱️</span>
            <span>Recommended Stay: {currentStop.stayDuration}</span>
          </div>
        )}
      </div>

      <Button
        onClick={handleViewFullJourney}
        className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 text-lg"
      >
        View Full Journey ➔
      </Button>
    </div>
  );
}