import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";

export default function PlanTransit() {
  const [_, setLocation] = useLocation();
  const [vibe, setVibe] = useState("");
  const [transitAirport, setTransitAirport] = useState<string | null>(null);

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

  if (!transitAirport) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-6">✈️ Plan Your Transit at {transitAirport}</h1>

        <p className="text-gray-600 mb-8 text-lg">
          Choose how you want to feel during your layover.
        </p>

        <div className="flex flex-wrap justify-center gap-4 mb-8">
          {["Relax", "Explore", "Work", "Quick"].map((option) => (
            <button
              key={option}
              onClick={() => setVibe(option)}
              className={`px-6 py-3 rounded-lg border-2 transition-colors ${
                vibe === option
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-800 border-gray-300 hover:border-blue-400"
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
          className="bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 transition text-lg"
        >
          🚀 Show My Transit Plan
        </button>
      </div>
    </div>
  );
}