import React, { useEffect, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Map, ArrowRight } from "lucide-react";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import amenitiesData from "@/data/airport_terminal_amenities.json";
import { guessTerminal } from "@/utils/terminalGuesses";

export default function ExploreTerminalPage() {
  const [_, setLocation] = useLocation();
  const [match, params] = useRoute("/explore-terminal/:id");
  const [journey, setJourney] = useState(null);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState(null);
  const [activeFilter, setActiveFilter] = useState(null);

  useEffect(() => {
    window.fathom?.trackPageview();

    const loadJourney = async () => {
      if (!params?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await fetchWithAuth(`/api/getJourneyById?id=${params.id}`);
        if (!response.ok) throw new Error("Failed to load journey");
        const data = await response.json();
        setJourney(data.journey);
      } catch (err) {
        console.error("Failed to load journey:", err);
      } finally {
        setLoading(false);
      }
    };

    loadJourney();
  }, [params?.id]);

  const handleBackToJourney = () => {
    window.fathom?.trackEvent("back_to_journey_clicked");
    if (journey) setLocation(`/journey/${journey.id}`);
    else setLocation("/your-journeys");
  };

  const handleShowTerminalMap = () => {
    window.fathom?.trackEvent("terminal_map_opened");
    if (journey) setLocation(`/terminal-map/${journey.id}`);
  };

  const handleFilterByCategory = (category) => {
    window.fathom?.trackEvent("filter_category_clicked", { category });
    if (activeFilter === category) {
      setActiveFilter(null);
      setCategoryFilter(null);
    } else {
      setActiveFilter(category);
      setCategoryFilter(category);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!journey) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-screen">
        <h2 className="text-xl font-bold text-red-600 dark:text-red-400">
          Journey not found
        </h2>
        <Button onClick={() => setLocation("/your-journeys")} className="mt-4">
          <ArrowRight className="h-4 w-4 mr-2 rotate-180" />
          Back to Your Journeys
        </Button>
      </div>
    );
  }

  const journeyVibe = journey.selected_vibe || "Relax";
  const guessedTerminal = guessTerminal(journey.origin, journey.flight_number);
  const vibeRecommendations = [];

  return (
    <div className="p-4 max-w-lg mx-auto">
      <Button variant="ghost" className="mb-4" onClick={handleBackToJourney}>
        <ArrowRight className="h-4 w-4 mr-2 rotate-180" />
        Back to journey
      </Button>

      <h1 className="text-2xl font-bold mb-4 flex items-center">
        <Map className="h-5 w-5 mr-2 text-primary-600" /> Terminal Guide
      </h1>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-3">
          {activeFilter ? `${activeFilter} Recommendations` : `Top Picks for ${journeyVibe} Vibe`}
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">(Amenity recommendations would display here)</p>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-3">Quick Explore</h2>
        <div className="flex flex-wrap gap-3 mb-4">
          {["Food", "Lounges", "Shops", "Relax"].map((cat) => (
            <button
              key={cat}
              onClick={() => handleFilterByCategory(cat)}
              className={`px-3 py-2 rounded-full ${
                activeFilter === cat ? "bg-blue-600 text-white" : "bg-blue-100 text-blue-800"
              }`}
            >
              {cat}
            </button>
          ))}
          {activeFilter && (
            <button
              onClick={() => {
                setActiveFilter(null);
                setCategoryFilter(null);
              }}
              className="px-3 py-2 rounded-full bg-gray-300 text-gray-800"
            >
              ❌ Clear Filter
            </button>
          )}
        </div>
      </div>

      <Button
        onClick={handleShowTerminalMap}
        className="w-full bg-gradient-to-r from-primary-600 to-secondary-600 text-white"
      >
        <Map className="h-4 w-4 mr-2" />
        View Terminal Map
      </Button>
    </div>
  );
}
