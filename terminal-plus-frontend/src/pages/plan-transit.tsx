import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";

export default function PlanTransit() {
  const [_, setLocation] = useLocation();
  const [vibe, setVibe] = useState("");
  const [transitAirport, setTransitAirport] = useState<string | null>(null);
  const isDarkMode = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

  useEffect(() => {
    const transitData = localStorage.getItem("transitData");
    if (transitData) {
      try {
        const parsedData = JSON.parse(transitData);
        setTransitAirport(parsedData.transitAirport);
      } catch (e) {
        setLocation("/");
      }
    } else {
      setLocation("/");
    }
  }, [setLocation]);

  const handleSubmit = () => {
    if (!vibe) {
      alert("Please select a vibe to continue.");
      return;
    }

    // ✅ GA4 vibe selection tracking
    if (window.gtag) {
      window.gtag("event", "select_vibe", {
        event_category: "Transit",
        event_label: vibe,
        value: transitAirport,
      });
    }

    if (transitAirport) {
      localStorage.setItem(
        "transitData",
        JSON.stringify({
          transitAirport,
          vibe,
          transitMode: true,
        })
      );

      setLocation("/simplified-explore");
    }
  };

  const vibeBgGlow: Record<string, string> = {
    Relax: 'bg-gradient-to-br from-violet-100 via-white to-violet-200',
    Explore: 'bg-gradient-to-br from-green-100 via-white to-green-200',
    Comfort: 'bg-gradient-to-br from-blue-100 via-white to-blue-200',
    Work: 'bg-gradient-to-br from-orange-100 via-white to-orange-200',
    Quick: 'bg-gradient-to-br from-red-100 via-white to-red-200',
  };
  const pageBgGlowClass = vibe ? vibeBgGlow[vibe] : 'bg-slate-100';

  if (!transitAirport) {
    return (
      <div className={`flex justify-center items-center min-h-screen ${isDarkMode ? 'bg-slate-900' : 'bg-white'}`}>
        <div className={`animate-spin h-8 w-8 border-4 rounded-full border-t-transparent ${isDarkMode ? 'border-blue-400' : 'border-blue-500'}`}></div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center justify-center min-h-screen p-6 ${pageBgGlowClass}`}>
      <div className="text-center bg-white dark:bg-slate-800 rounded-lg shadow-lg p-8 w-full max-w-lg">
        <h1 className="text-3xl font-bold mb-6 text-slate-900 dark:text-white">✈️ Plan Your Transit at {transitAirport}</h1>

        <p className="text-gray-600 dark:text-gray-300 mb-8 text-lg">
          Choose how you want to feel during your layover.
        </p>

        <div className="flex flex-wrap justify-center gap-4 mb-8">
          {["Relax", "Explore", "Work", "Quick"].map((option) => (
            <button
              key={option}
              onClick={() => setVibe(option)}
              className={`px-6 py-3 rounded-lg border-2 transition-colors font-medium text-lg focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-600 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-800 ${
                vibe === option
                  ? "bg-blue-600 text-white border-blue-600 dark:bg-blue-500 dark:border-blue-500"
                  : "bg-white text-gray-800 border-gray-300 hover:border-blue-400 dark:bg-slate-700 dark:text-gray-100 dark:border-slate-600 dark:hover:border-blue-400"
              }`}
            >
              {option === "Relax" && "🛋️ Relax"}
              {option === "Explore" && "🛍️ Explore"}
              {option === "Work" && "🧑‍💻 Work"}
              {option === "Quick" && "⏩ Quick"}
            </button>
          ))}
        </div>

        <button
          onClick={handleSubmit}
          className="bg-green-600 dark:bg-green-500 text-white py-3 px-6 rounded-lg hover:bg-green-700 dark:hover:bg-green-600 transition text-lg font-semibold shadow focus:outline-none focus:ring-2 focus:ring-green-400 dark:focus:ring-green-600 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-800"
        >
          🚀 Show My Transit Plan
        </button>
      </div>
    </div>
  );
}