import React, { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Play } from "lucide-react";

type JourneyStop = {
  name: string;
  location: string;
  type: string;
  walkingTime?: string;
  stayDuration?: string;
};

export default function MyJourney() {
  const [location, setLocation] = useLocation();
  const [plan, setPlan] = useState<JourneyStop[]>([]);

  useEffect(() => {
    // Get journey plan from session storage
    const journeyPlanData = sessionStorage.getItem("journeyPlan");
    if (!journeyPlanData || journeyPlanData.length === 0) {
      // If no plan was passed, bounce back to home
      setLocation("/");
    } else {
      setPlan(JSON.parse(journeyPlanData));
    }
  }, [setLocation]);

  const handleStartJourney = () => {
    // Navigate to the start journey page
    setLocation("/start-journey");
  };
  
  const handleSaveJourney = async () => {
    try {
      // Get journey data from session storage
      const journeyDataStr = sessionStorage.getItem("tempJourneyData");
      if (!journeyDataStr) {
        alert("No journey data found!");
        return;
      }
      
      const journeyData = JSON.parse(journeyDataStr);
      
      const response = await fetch("/api/saveTerminalJourneyPlan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          airport: journeyData.origin || "Unknown",
          terminal: journeyData.terminal || "T1",
          journeyPlan: plan,
        }),
      });

      const result = await response.json();
      if (result.success) {
        alert("Journey saved successfully!");
      } else {
        alert(`Failed to save journey: ${result.error || "Unknown error"}`);
      }
    } catch (error: any) {
      console.error("Error saving journey:", error);
      alert(`Error saving journey: ${error.message || "Unknown error"}`);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Button 
        variant="ghost" 
        className="mb-4" 
        onClick={() => setLocation("/")}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to home
      </Button>

      <h1 className="text-2xl font-bold mb-4">Your Terminal+ Journey ✈️</h1>

      <p className="mb-6 text-slate-600 dark:text-slate-400">
        Follow this plan to make the most of your airport time!
      </p>

      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-md mb-6">
        <ul className="space-y-4">
          {plan.map((stop, index) => (
            <li key={index} className="border rounded-lg p-4 flex items-start hover:shadow-md transition">
              <div className="bg-primary-100 dark:bg-primary-900 p-2 rounded-full mr-3 flex items-center justify-center min-w-[2rem]">
                {index + 1}
              </div>
              <div>
                <h3 className="font-medium mb-1">{stop.name}</h3>
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  {stop.type} • {stop.location}
                </div>
                {stop.walkingTime && (
                  <div className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                    Walking time: {stop.walkingTime}
                  </div>
                )}
                {stop.stayDuration && (
                  <div className="text-sm text-purple-600 dark:text-purple-400 mt-1">
                    Recommended stay: {stop.stayDuration}
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="text-center mt-8 space-y-4">
        <div className="flex justify-center gap-4">
          <Button
            onClick={handleStartJourney}
            className="bg-gradient-to-r from-primary-600 to-secondary-600 py-3 px-6 text-lg"
          >
            <Play className="h-4 w-4 mr-2" /> Start Journey
          </Button>
          
          <Button
            onClick={handleSaveJourney}
            className="bg-gradient-to-r from-green-600 to-emerald-600 py-3 px-6 text-lg"
          >
            Save Journey
          </Button>
        </div>

        <div className="mt-4 flex justify-center space-x-4">
          <Button
            onClick={() => setLocation("/simplified-journey-input")}
            variant="link"
            className="text-primary-600"
          >
            Plan a New Journey
          </Button>
          
          <Button
            onClick={() => setLocation("/saved-journeys")}
            variant="link"
            className="text-primary-600"
          >
            View Saved Journeys
          </Button>
        </div>
      </div>
    </div>
  );
}