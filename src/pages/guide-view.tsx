import React, { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";

const recommendations = {
  Relax: [
    { title: "Premium Lounge", desc: "Quiet, comfy seating and free snacks." },
    { title: "Relaxation Zone", desc: "Recliners and soft lighting." },
    { title: "Spa Express", desc: "Quick chair massage before your flight." }
  ],
  Explore: [
    { title: "Duty-Free Shopping", desc: "Exclusive deals on local brands." },
    { title: "Art Walk", desc: "Terminal's best public art and exhibits." },
    { title: "Local Eats", desc: "Try the best regional cuisine." }
  ],
  Work: [
    { title: "Business Lounge", desc: "WiFi, outlets, and quiet workspaces." },
    { title: "Coffee Bar", desc: "Great coffee and fast WiFi." },
    { title: "Print & Go", desc: "Last-minute printing and office supplies." }
  ],
  Quick: [
    { title: "Express Security", desc: "Fast-track lane for quick boarding." },
    { title: "Grab & Go Food", desc: "Healthy snacks in under 5 minutes." },
    { title: "Gate Proximity", desc: "Stay close to your gate for fast boarding." }
  ]
};

export default function GuideView() {
  const [_, setLocation] = useLocation();
  const [journey, setJourney] = useState<any>(null);

  useEffect(() => {
    const data = sessionStorage.getItem("tempJourneyData");
    if (data) {
      setJourney(JSON.parse(data));
    } else {
      setLocation("/plan-journey-stepper");
    }
  }, [setLocation]);

  if (!journey) {
    return null;
  }

  const vibeRecs = recommendations[journey.vibe as keyof typeof recommendations] || [];

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Your Terminal+ Guide</h2>
        <div className="text-slate-600 dark:text-slate-400 mb-2">
          <span className="font-medium">From:</span> {journey.origin} &nbsp;|
          <span className="font-medium ml-2">To:</span> {journey.destination} &nbsp;|
          <span className="font-medium ml-2">Vibe:</span> {journey.vibe}
        </div>
        {journey.layovers && journey.layovers.length > 0 && (
          <div className="text-slate-500 text-sm mb-2">
            <span className="font-medium">Layovers:</span> {journey.layovers.join(", ")}
          </div>
        )}
        <div className="bg-yellow-100 border-l-4 border-yellow-400 text-yellow-800 p-3 rounded mb-4">
          <strong>Queue times coming soon!</strong> We know security and boarding lines are a pain. We're working to bring you live queue data in a future update.
        </div>
      </div>

      <div className="mb-8">
        <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-md mb-6">
          <h3 className="text-xl font-semibold mb-4">Mood-based Recommendations</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {vibeRecs.map((rec, idx) => (
              <div key={idx} className="border rounded-lg p-4 flex flex-col hover:shadow-md transition">
                <div className="font-bold mb-1">{rec.title}</div>
                <div className="text-slate-600 dark:text-slate-400 text-sm">{rec.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mb-8">
        <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-6 shadow-md flex flex-col items-center">
          <div className="mb-2 text-lg font-semibold">Terminal Map (Preview)</div>
          <svg width="320" height="120" viewBox="0 0 320 120" className="mb-2">
            <rect x="20" y="40" width="280" height="40" rx="20" fill="#e0e7ef" />
            <circle cx="60" cy="60" r="12" fill="#a5b4fc" />
            <circle cx="160" cy="60" r="12" fill="#fbbf24" />
            <circle cx="260" cy="60" r="12" fill="#34d399" />
            <text x="60" y="60" textAnchor="middle" dy=".3em" fontSize="12">A</text>
            <text x="160" y="60" textAnchor="middle" dy=".3em" fontSize="12">B</text>
            <text x="260" y="60" textAnchor="middle" dy=".3em" fontSize="12">C</text>
          </svg>
          <div className="text-slate-500 text-sm">Personalized maps coming soon!</div>
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setLocation("/plan-journey-stepper")}>Plan Another Journey</Button>
        <Button variant="outline" onClick={() => setLocation("/my-journeys")}>View My Journeys</Button>
      </div>
    </div>
  );
} 