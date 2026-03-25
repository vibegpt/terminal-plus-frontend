import React, { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";

interface Journey {
  departure: string;
  destination: string;
  flightNumber?: string;
  layovers: string[];
  vibe: string;
  saved_at: string;
}

export default function MyJourneys() {
  const [_, setLocation] = useLocation();
  const [journeys, setJourneys] = useState<Journey[]>([]);

  useEffect(() => {
    const savedJourneys = JSON.parse(localStorage.getItem("savedJourneys") || "[]");
    setJourneys(savedJourneys);
  }, []);

  const handleDeleteJourney = (index: number) => {
    const updatedJourneys = journeys.filter((_, i) => i !== index);
    setJourneys(updatedJourneys);
    localStorage.setItem("savedJourneys", JSON.stringify(updatedJourneys));
  };

  const handleViewJourney = (journey: Journey, airportCode?: string) => {
    let journeyData = { ...journey };
    if (airportCode) {
      journeyData.departure = airportCode;
    }
    sessionStorage.setItem("tempJourneyData", JSON.stringify(journeyData));
    setLocation("/guide-view");
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white dark:bg-slate-900 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My Journeys</h1>
        <Button onClick={() => setLocation("/plan-journey-stepper")} className="bg-primary-600 text-white dark:text-white">Plan New Journey</Button>
      </div>
      <div className="space-y-4">
        {journeys.length === 0 ? (
          <div className="text-slate-600 dark:text-slate-400">No journeys found. Start planning your next trip!</div>
        ) : (
          journeys.map((journey, idx) => (
            <div key={idx} className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 flex flex-col md:flex-row md:items-center md:justify-between border border-slate-100 dark:border-slate-700">
              <div>
                <div className="font-semibold text-lg text-slate-900 dark:text-white flex flex-wrap items-center gap-2">
                  <Button variant="link" className="px-1 text-blue-600 dark:text-blue-300" onClick={() => handleViewJourney(journey, journey.departure)}>{journey.departure}</Button>
                  {journey.layovers && journey.layovers.map((layover, i) => (
                    <span key={i}>
                      <span className="mx-1">→</span>
                      <Button variant="link" className="px-1 text-blue-600 dark:text-blue-300" onClick={() => handleViewJourney(journey, layover)}>{layover}</Button>
                    </span>
                  ))}
                  <span className="mx-1">→</span>
                  <Button variant="link" className="px-1 text-blue-600 dark:text-blue-300" onClick={() => handleViewJourney(journey, journey.destination)}>{journey.destination}</Button>
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Flight: {journey.flightNumber || "N/A"}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Vibe: {journey.vibe}</div>
                <div className="text-xs text-slate-400 dark:text-slate-500">Saved: {new Date(journey.saved_at).toLocaleString()}</div>
              </div>
              <div className="flex gap-2 mt-4 md:mt-0">
                <Button onClick={() => handleViewJourney(journey)} className="bg-blue-600 text-white dark:text-white">View</Button>
                <Button onClick={() => handleDeleteJourney(idx)} className="bg-red-600 text-white dark:text-white">Delete</Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
} 