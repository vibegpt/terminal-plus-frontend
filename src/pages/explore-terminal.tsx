import React, { useEffect, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Plane, Map, ArrowRight, Clock, Coffee, ShoppingBag, Utensils, Home } from "lucide-react";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import amenitiesData from "@/data/airport_terminal_amenities.json";
import { guessTerminal } from "@/utils/terminalGuesses";

type Journey = {
  id: string;
  flight_number: string;
  origin: string;
  destination: string;
  transit?: string;
  selected_vibe: "Relax" | "Explore" | "Work" | "Quick";
  departure_time?: string;
  created_at: string;
};

type Amenity = {
  id: number;
  terminal_id: number;
  name: string;
  type: string;
  description: string;
  location: string;
  opening_hours: string;
  main_category: string;
  sub_category: string;
  terminal_name: string;
  airport_name: string;
  airport_code: string;
};

// Mapping vibes to preferred amenity categories
const vibePreferences = {
  Relax: {
    mainCategories: ["Lounges", "Facilities", "Hotels"],
    subCategories: ["Relaxation", "Sleep Pods", "Airline Lounge"]
  },
  Explore: {
    mainCategories: ["Experiences", "Food & Beverage", "Shopping"],
    subCategories: ["Cultural", "Attraction", "Bakery & Desserts", "International"]
  },
  Work: {
    mainCategories: ["Lounges", "Facilities", "Food & Beverage"],
    subCategories: ["Business Center", "Coffee & Snacks", "Wi-Fi", "Workspace"]
  },
  Quick: {
    mainCategories: ["Food & Beverage", "Facilities", "Services"],
    subCategories: ["Fast Food", "Coffee & Snacks", "Express"]
  }
};

export default function ExploreTerminalPage() {
  const [_, setLocation] = useLocation();
  const [match, params] = useRoute("/explore-terminal/:id");
  const [journey, setJourney] = useState<Journey | null>(null);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string | null>(null); // Track active filter for UI

  useEffect(() => {
    const loadJourney = async () => {
      if (!params?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await fetchWithAuth(`/api/getJourneyById?id=${params.id}`);
        
        if (!response.ok) {
          throw new Error("Failed to load journey");
        }
        
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
    if (journey) {
      setLocation(`/journey/${journey.id}`);
    } else {
      setLocation("/your-journeys");
    }
  };

  const handleShowTerminalMap = () => {
    if (journey) {
      setLocation(`/terminal-map/${journey.id}`);
    }
  };
  
  const handleFilterByCategory = (category: string) => {
    if (activeFilter === category) {
      // If clicking the same category, clear the filter
      setActiveFilter(null);
      setCategoryFilter(null);
    } else {
      // Set new filter
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
        <div className="text-center space-y-4">
          <h2 className="text-xl font-bold text-red-600 dark:text-red-400">
            Journey not found
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            We couldn't find the journey you're looking for.
          </p>
          <Button
            onClick={() => setLocation("/your-journeys")}
            className="mt-4"
          >
            <ArrowRight className="h-4 w-4 mr-2 rotate-180" />
            Back to Your Journeys
          </Button>
        </div>
      </div>
    );
  }

  // Get recommendations for the selected vibe
  const journeyVibe = journey.selected_vibe || "Relax";
  
  // Use our terminal guessing utility to determine the likely terminal
  const guessedTerminal = guessTerminal(journey.origin, journey.flight_number);
  
  // 1. Get all amenities and filter by airport and terminal
  // First, try to match by exact airport and terminal
  let matchedAmenities = (amenitiesData as Amenity[]).filter(amenity => 
    amenity.airport_code === journey.origin && 
    amenity.terminal_name === guessedTerminal
  );
  
  // If no exact matches, fall back to just matching the airport
  if (matchedAmenities.length === 0) {
    matchedAmenities = (amenitiesData as Amenity[]).filter(amenity => 
      amenity.airport_code === journey.origin
    );
  }
  
  // If still no matches, use all amenities as fallback to avoid empty results
  const allAmenities = matchedAmenities.length > 0 ? 
    matchedAmenities : 
    (amenitiesData as Amenity[]);
  
  // 2. Enhanced vibe priority scoring system
  const vibePriority = {
    Relax: {
      primary: ["Lounge", "Relax Zone", "Spa", "Quiet Area", "Rest Zone"],
      secondary: ["Coffee Shop", "Quiet Zone", "Rest Area", "Garden"],
    },
    Explore: {
      primary: ["Shop", "Attraction", "Duty-Free", "Specialty Store", "Museum"],
      secondary: ["Food Court", "Art Exhibit", "Cultural", "Local Experience"],
    },
    Work: {
      primary: ["Business Lounge", "Workspace", "Wi-Fi Hub", "Meeting Room"],
      secondary: ["Cafe", "Normal Lounge", "Charging Station", "Office"],
    },
    Quick: {
      primary: ["Convenience Store", "Quick Bite", "Express Shop", "Fast Food"],
      secondary: ["Food Court", "Small Gift Shop", "Grab & Go", "Automated Service"],
    },
  };
  
  // Get vibe match preferences
  const vibeMatch = vibePriority[journeyVibe as keyof typeof vibePriority] || { primary: [], secondary: [] };
  
  // Score-based filtering function that prioritizes amenities matching the vibe
  const getMatchingAmenities = (items: Amenity[], filterCategory?: string | null) => {
    // If specific category filter is active, use category-based filtering
    if (filterCategory && filterMap[filterCategory as keyof typeof filterMap]) {
      const filter = filterMap[filterCategory as keyof typeof filterMap];
      return items.filter(item => 
        filter.main.includes(item.main_category) || 
        filter.sub.some(cat => item.sub_category.toLowerCase().includes(cat.toLowerCase()))
      );
    }
    
    // Otherwise, use vibe scoring system
    const scoredAmenities = items.map(item => {
      let score = 0;
      
      // Check primary matches in main category and subcategory
      if (vibeMatch.primary.some(cat => 
        item.main_category.toLowerCase().includes(cat.toLowerCase()) ||
        item.sub_category.toLowerCase().includes(cat.toLowerCase())
      )) {
        score += 2;
      }
      
      // Check secondary matches in main category and subcategory
      if (vibeMatch.secondary.some(cat => 
        item.main_category.toLowerCase().includes(cat.toLowerCase()) ||
        item.sub_category.toLowerCase().includes(cat.toLowerCase())
      )) {
        score += 1;
      }
      
      return { ...item, score };
    });
    
    // Sort by score (descending) and filter out zero-score items
    return scoredAmenities
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score);
  };
  
  // 3. Define filter categories
  const filterMap = {
    "Food": {
      main: ["Food & Beverage"],
      sub: ["Restaurant", "Cafe", "Food Court", "Fast Food", "Bakery"]
    },
    "Lounges": {
      main: ["Lounges"],
      sub: ["Lounge", "Business Lounge", "Airline Lounge"]
    },
    "Shops": {
      main: ["Shopping"],
      sub: ["Shop", "Duty-Free", "Retail"]
    },
    "Relax": {
      main: ["Facilities"],
      sub: ["Relaxation", "Rest", "Spa", "Sleep", "Quiet"]
    }
  };
  
  let filteredAmenities: Amenity[] = [];
  
  // 4. Apply active filter if present or use vibe priority scoring
  filteredAmenities = getMatchingAmenities(allAmenities, activeFilter);
  
  // 5. Take the top 5 items for display
  const vibeRecommendations = filteredAmenities.slice(0, 5);

  return (
    <div className="p-4 max-w-lg mx-auto">
      <Button 
        variant="ghost" 
        className="mb-4" 
        onClick={handleBackToJourney}
      >
        <ArrowRight className="h-4 w-4 mr-2 rotate-180" />
        Back to journey
      </Button>

      <h1 className="text-2xl font-bold mb-4 flex items-center">
        <Map className="h-5 w-5 mr-2 text-primary-600" />
        Terminal Guide
      </h1>

      <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-md mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">Journey Details</h3>
          <div className="bg-primary-100 dark:bg-primary-900 px-3 py-1 rounded-full text-primary-700 dark:text-primary-300 text-sm">
            {journeyVibe} Vibe
          </div>
        </div>
        
        <div className="mb-2 text-slate-700 dark:text-slate-300">
          <p className="mb-2">
            ✈️ Flight: <strong>{journey.flight_number}</strong>
          </p>
          <p className="mb-2 flex items-start">
            <span className="mr-1">🛫</span> Route: <strong className="mx-1">{journey.origin}</strong>
            <ArrowRight className="h-3 w-3 mx-1 mt-1" />
            <strong>{journey.destination}</strong>
            {journey.transit && <span> via <strong>{journey.transit}</strong></span>}
          </p>
          <p className="mb-2">
            🏢 Terminal: <strong>{guessedTerminal}</strong> <span className="text-xs text-slate-500">(based on airline + airport)</span>
          </p>
          {journey.departure_time && (
            <p>
              🕒 Departure: <strong>
                {new Date(journey.departure_time).toLocaleString(undefined, {
                  weekday: 'short',
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </strong>
            </p>
          )}
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-3">
          {activeFilter ? `${activeFilter} Recommendations` : `Top Picks for ${journeyVibe} Vibe`}
        </h2>
        {vibeRecommendations.length > 0 ? (
          <ul className="space-y-3">
            {vibeRecommendations.map((amenity: any, index: number) => (
              <li
                key={index}
                className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow hover:shadow-md transition cursor-pointer"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-semibold flex items-center">
                      {amenity.name}
                      {amenity.score && (
                        <span className="ml-2 text-xs bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 px-2 py-0.5 rounded-full">
                          {amenity.score === 2 ? '🌟 Perfect Match' : '✓ Good Match'}
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">{amenity.location}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{amenity.opening_hours}</div>
                  </div>
                  <div className="bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-xs">
                    {amenity.sub_category}
                  </div>
                </div>
                
                {journeyVibe === 'Relax' && !activeFilter && (
                  <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-700 text-xs text-slate-500">
                    {amenity.score === 2 ? 
                      <span>💯 Highly recommended for relaxation</span> : 
                      <span>👍 Good option for your Relax vibe</span>}
                  </div>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-slate-600 dark:text-slate-400 text-center py-4">
            No recommendations available for this category.
          </p>
        )}
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-3">Quick Explore</h2>
        <div className="flex flex-wrap gap-3 mb-4">
          <button
            onClick={() => handleFilterByCategory("Food")}
            className={`px-3 py-2 rounded-full ${
              activeFilter === "Food" ? "bg-blue-600 text-white" : "bg-blue-100 text-blue-800"
            }`}
          >
            🍔 Food
          </button>
          <button
            onClick={() => handleFilterByCategory("Lounges")}
            className={`px-3 py-2 rounded-full ${
              activeFilter === "Lounges" ? "bg-blue-600 text-white" : "bg-blue-100 text-blue-800"
            }`}
          >
            🛋️ Lounges
          </button>
          <button
            onClick={() => handleFilterByCategory("Shops")}
            className={`px-3 py-2 rounded-full ${
              activeFilter === "Shops" ? "bg-blue-600 text-white" : "bg-blue-100 text-blue-800"
            }`}
          >
            🛍️ Shops
          </button>
          <button
            onClick={() => handleFilterByCategory("Relax")}
            className={`px-3 py-2 rounded-full ${
              activeFilter === "Relax" ? "bg-blue-600 text-white" : "bg-blue-100 text-blue-800"
            }`}
          >
            🧘 Relax
          </button>

          {/* Clear Filter button */}
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

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-3">Security Checkpoint</h2>
        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow">
          <p className="text-slate-800 dark:text-slate-200">
            Estimated Wait Time: <span className="font-semibold">18 minutes</span> 
            <span className="text-xs text-slate-500 ml-2">(live data coming soon)</span>
          </p>
        </div>
      </div>

      <Button
        onClick={handleShowTerminalMap}
        className="w-full bg-gradient-to-r from-primary-600 to-secondary-600 text-white"
      >
        <Map className="h-4 w-4 mr-2" />
        View Terminal Map
      </Button>

      <div className="text-center text-xs text-slate-500 dark:text-slate-400 mt-8">
        This is a preview of the terminal experience feature that's currently in development. 
        Full functionality coming soon!
      </div>
    </div>
  );
}