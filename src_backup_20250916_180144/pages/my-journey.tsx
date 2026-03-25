import React, { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Play } from "lucide-react";
import { getBoardingStatus } from "@/utils";

type JourneyStop = {
  name: string;
  location: string;
  type: string;
  walkingTime?: string;
  stayDuration?: string;
  tags?: string[];
};

export default function MyJourney() {
  const [location, setLocation] = useLocation();
  const [plan, setPlan] = useState<JourneyStop[]>([]);
  const [journeyData, setJourneyData] = useState<any>(null);

  useEffect(() => {
    // Load journey plan from session storage
    const journeyPlanStr = sessionStorage.getItem("journeyPlan");
    if (journeyPlanStr) {
      try {
        const journeyPlan = JSON.parse(journeyPlanStr);
        setPlan(journeyPlan);
      } catch (error) {
        console.error("Error parsing journey plan:", error);
      }
    }

    // Load journey data from session storage
    const journeyDataStr = sessionStorage.getItem("tempJourneyData");
    if (journeyDataStr) {
      try {
        const journeyData = JSON.parse(journeyDataStr);
        setJourneyData(journeyData);
      } catch (error) {
        console.error("Error parsing journey data:", error);
      }
    }
  }, []);

  // Generate or retrieve an anonymous ID for the user
  function getAnonymousId() {
    let anonId = localStorage.getItem('anonymous_id');
    if (!anonId) {
      anonId = crypto.randomUUID();
      localStorage.setItem('anonymous_id', anonId);
    }
    return anonId;
  }

  const handleStartJourney = () => {
    if (!plan || plan.length === 0) {
      alert("No journey plan available. Please plan a journey first.");
      return;
    }
    setLocation("/simplified-explore");
  };

  const handleSaveJourney = () => {
    if (!plan || plan.length === 0) {
      alert("No journey plan available to save.");
      return;
    }
    setLocation("/simplified-explore");
  };

  const handlePlanNewJourney = () => {
    // Clear any existing journey data
    sessionStorage.removeItem("journeyPlan");
    sessionStorage.removeItem("tempJourneyData");
    setLocation("/plan-journey-stepper");
  };

  const handleViewSavedJourneys = () => {
    setLocation("/saved-journeys");
  };

  // After journeyData is loaded
  const boardingTime = journeyData?.boarding_time ? new Date(journeyData.boarding_time).getTime() : undefined;
  const boardingStatus = getBoardingStatus(boardingTime);

  // Filter/prioritize plan stops based on status
  let filteredPlan = plan;
  if (boardingStatus === 'imminent') {
    filteredPlan = plan.filter(stop => (stop.tags && stop.tags.includes('Gate')) || (stop.tags && stop.tags.includes('Quick')) || (stop.type && stop.type.includes('Grab')));
  }

  return (
    <div className="p-6 max-w-4xl mx-auto bg-white dark:bg-slate-900 min-h-screen">
      <Button 
        variant="ghost" 
        className="mb-4 text-slate-900 dark:text-white" 
        onClick={() => setLocation("/")}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to home
      </Button>

      <h1 className="text-2xl font-bold mb-4 text-slate-900 dark:text-white">Your Terminal+ Journey ✈️</h1>

      <p className="mb-6 text-slate-600 dark:text-slate-400">
        Follow this plan to make the most of your airport time!
      </p>

      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-md mb-6">
        {/* Boarding warning banners */}
        {boardingStatus === 'imminent' && (
          <div className="bg-yellow-100 dark:bg-yellow-900 border-l-4 border-yellow-400 dark:border-yellow-700 text-yellow-800 dark:text-yellow-200 p-3 rounded mb-4">
            <strong>Boarding soon!</strong> Only showing quick options near your gate.
          </div>
        )}
        {boardingStatus === 'soon' && (
          <div className="bg-yellow-50 dark:bg-yellow-950 border-l-4 border-yellow-300 dark:border-yellow-700 text-yellow-700 dark:text-yellow-200 p-3 rounded mb-4">
            <strong>Heads up:</strong> Boarding in about 35 minutes. Consider staying close to your gate.
          </div>
        )}
        <ul className="space-y-4">
          {filteredPlan.map((stop, index) => (
            <li key={index} className="border rounded-lg p-4 flex items-start hover:shadow-md transition bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700">
              <div className="bg-primary-100 dark:bg-primary-900 p-2 rounded-full mr-3 flex items-center justify-center min-w-[2rem] text-slate-900 dark:text-white">
                {index + 1}
              </div>
              <div>
                <h3 className="font-medium mb-1 text-slate-900 dark:text-white">{stop.name}</h3>
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
            className="bg-gradient-to-r from-primary-600 to-secondary-600 py-3 px-6 text-lg text-white dark:text-white"
          >
            <Play className="h-4 w-4 mr-2" /> Start Journey
          </Button>

          <Button
            onClick={handleSaveJourney}
            className="bg-gradient-to-r from-green-600 to-emerald-600 py-3 px-6 text-lg text-white dark:text-white"
          >
            Save Journey
          </Button>
        </div>

        <div className="mt-4 flex justify-center space-x-4">
          <Button
            onClick={handlePlanNewJourney}
            variant="link"
            className="text-primary-600 dark:text-primary-300"
          >
            Plan a New Journey
          </Button>

          <Button
            onClick={handleViewSavedJourneys}
            variant="link"
            className="text-primary-600 dark:text-primary-300"
          >
            View Saved Journeys
          </Button>
        </div>
      </div>
    </div>
  );
}