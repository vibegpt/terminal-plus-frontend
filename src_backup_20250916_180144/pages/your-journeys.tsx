import React, { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { Button } from "@/components/ui/button";
import { Plane, ArrowRight, Calendar, Info } from "lucide-react";
import { getVibeEmoji } from "@/lib/utils";

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

export default function YourJourneysPage() {
  const [_, setLocation] = useLocation();
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [activeTab, setActiveTab] = useState<"all" | "upcoming" | "completed">("all");
  const [loading, setLoading] = useState(true);
  const [selectedJourney, setSelectedJourney] = useState<Journey | null>(null);

  useEffect(() => {
    const fetchJourneys = async () => {
      setLoading(true);
      try {
        const res = await fetchWithAuth("/api/journeyHistory");
        const data = await res.json();
        setJourneys(data);
      } catch (err) {
        console.error("Error fetching journeys:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchJourneys();
  }, []);

  const handleNewJourney = () => {
    setLocation("/plan-journey");
  };
  
  const handleViewJourney = (journey: Journey) => {
    // We now have two options:
    // 1. Show the journey detail inline (current implementation)
    // 2. Navigate to the detail page (new implementation)
    
    // Option 1: Show inline
    // setSelectedJourney(journey);
    
    // Option 2: Navigate to detail page
    setLocation(`/journey/${journey.id}`);
  };
  
  const handleBackToList = () => {
    setSelectedJourney(null);
  };

  const now = new Date();

  const upcomingJourneys = journeys.filter(journey =>
    journey.departure_time && new Date(journey.departure_time) > now
  );

  const completedJourneys = journeys.filter(journey =>
    journey.departure_time && new Date(journey.departure_time) <= now
  );

  const journeysToDisplay =
    activeTab === "upcoming"
      ? upcomingJourneys
      : activeTab === "completed"
      ? completedJourneys
      : journeys;
  
  // Vibe glow mapping
  const vibeGlow: Record<string, string> = {
    Relax: 'vibe-glow-relax',
    Explore: 'vibe-glow-explore',
    Comfort: 'vibe-glow-comfort',
    Work: 'vibe-glow-work',
    Quick: 'vibe-glow-quick'
  };
  const pageGlowClass = selectedJourney?.selected_vibe ? vibeGlow[selectedJourney.selected_vibe] : '';

  // Vibe background glow mapping
  const vibeBgGlow: Record<string, string> = {
    Relax: 'bg-[#A8D0E6]',
    Explore: 'bg-[#F76C6C]',
    Comfort: 'bg-[#CBAACB]',
    Work: 'bg-[#D3B88C]',
    Quick: 'bg-[#FFDD57]'
  };
  const pageBgGlowClass = selectedJourney?.selected_vibe ? vibeBgGlow[selectedJourney.selected_vibe] : 'bg-slate-100';

  // Journey detail view
  if (selectedJourney) {
    return (
      <div className={`p-4 space-y-4 min-h-screen ${pageBgGlowClass}`}>
        <Button 
          variant="ghost" 
          className="mb-4 text-slate-900 dark:text-white" 
          onClick={handleBackToList}
        >
          <ArrowRight className="h-4 w-4 mr-2 rotate-180" />
          Back to journeys
        </Button>
        
        <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-md">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{selectedJourney.flight_number}</h2>
            <div className="flex items-center space-x-2">
              <span className="text-2xl">{getVibeEmoji(selectedJourney.selected_vibe)}</span>
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">{selectedJourney.selected_vibe} Vibe</span>
            </div>
          </div>
          
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-slate-500 dark:text-slate-400">Origin</div>
              <div className="text-sm text-slate-500 dark:text-slate-400">Destination</div>
            </div>
            <div className="flex items-center justify-between mt-1">
              <div className="text-xl font-bold text-slate-900 dark:text-white">{selectedJourney.origin}</div>
              <ArrowRight className="h-5 w-5 text-slate-400" />
              <div className="text-xl font-bold text-slate-900 dark:text-white">{selectedJourney.destination}</div>
            </div>
            {selectedJourney.transit && (
              <div className="text-sm text-center mt-1 text-slate-500 dark:text-slate-400">
                Via {selectedJourney.transit}
              </div>
            )}
          </div>
          
          <div className="border-t border-slate-200 dark:border-slate-700 pt-4 mt-4">
            <div className="flex items-start space-x-3">
              <Calendar className="h-5 w-5 text-slate-400 mt-0.5" />
              <div>
                <div className="font-medium text-slate-900 dark:text-white">Departure Time</div>
                <div className="text-slate-600 dark:text-slate-300">
                  {selectedJourney.departure_time 
                    ? new Date(selectedJourney.departure_time).toLocaleString(undefined, {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                    : "No departure time set"}
                </div>
              </div>
            </div>
          </div>
          
          <div className="border-t border-slate-200 dark:border-slate-700 pt-4 mt-4">
            <div className="flex items-start space-x-3">
              <Info className="h-5 w-5 text-slate-400 mt-0.5" />
              <div>
                <div className="font-medium text-slate-900 dark:text-white">Journey Created</div>
                <div className="text-slate-600 dark:text-slate-300">
                  {new Date(selectedJourney.created_at).toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="p-4 bg-primary-50 dark:bg-slate-900 rounded-lg mt-4">
          <h3 className="font-medium mb-2 text-slate-900 dark:text-white">Terminal Tips ({selectedJourney.selected_vibe})</h3>
          {selectedJourney.selected_vibe === 'Relax' && (
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Look for premium lounges or quiet areas in the terminal. Consider arriving early to enjoy spa services if available.
            </p>
          )}
          {selectedJourney.selected_vibe === 'Explore' && (
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Check out duty-free shopping, local cuisine restaurants, and airport exhibits. Many airports offer guided tours or cultural experiences.
            </p>
          )}
          {selectedJourney.selected_vibe === 'Work' && (
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Find business lounges with reliable WiFi, power outlets, and quiet work spaces. Consider calling ahead to check meeting room availability.
            </p>
          )}
          {selectedJourney.selected_vibe === 'Quick' && (
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Use express security lanes where available. Look for grab-and-go food options and stay near your departure gate.
            </p>
          )}
        </div>
      </div>
    );
  }

  // Journey list view
  return (
    <div className="p-4 space-y-4 bg-white dark:bg-slate-900 min-h-screen">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Your Journeys 🧳</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Past and upcoming flights</p>
        </div>
        <Button 
          onClick={handleNewJourney}
          className="bg-gradient-to-r from-primary-600 to-secondary-600 text-white dark:text-white"
        >
          <Plane className="h-4 w-4 mr-2" />
          New Journey
        </Button>
      </div>

      <div className="flex space-x-2 mb-4">
        <button 
          onClick={() => setActiveTab("all")} 
          className={`px-3 py-1 rounded-lg ${activeTab === "all" 
            ? "bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 font-semibold" 
            : "text-slate-600 dark:text-slate-400"}`}
        >
          All Journeys
        </button>
        <button 
          onClick={() => setActiveTab("upcoming")} 
          className={`px-3 py-1 rounded-lg ${activeTab === "upcoming" 
            ? "bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 font-semibold" 
            : "text-slate-600 dark:text-slate-400"}`}
        >
          Upcoming
        </button>
        <button 
          onClick={() => setActiveTab("completed")} 
          className={`px-3 py-1 rounded-lg ${activeTab === "completed" 
            ? "bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 font-semibold" 
            : "text-slate-600 dark:text-slate-400"}`}
        >
          Completed
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full"></div>
        </div>
      ) : journeysToDisplay.length === 0 ? (
        <div className="text-center py-12">
          <div className="flex flex-col items-center">
            <Plane className="text-slate-300 dark:text-slate-600 h-14 w-14 mb-4" />
            <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-300">No journeys to display</h3>
            <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-xs">
              {activeTab === "all" 
                ? "Start by adding your first journey."
                : activeTab === "upcoming"
                ? "You don't have any upcoming journeys."
                : "You don't have any completed journeys."}
            </p>
            {activeTab !== "all" && (
              <Button 
                onClick={() => setActiveTab("all")}
                variant="link" 
                className="mt-2 text-primary-600 dark:text-primary-400"
              >
                View all journeys
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {journeysToDisplay.map((journey) => (
            <div 
              key={journey.id} 
              className="p-4 rounded-lg shadow-md bg-white dark:bg-slate-800 cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => handleViewJourney(journey)}
            >
              <div className="flex justify-between">
                <p className="text-lg font-semibold text-slate-900 dark:text-white">
                  {journey.flight_number}
                </p>
                <span className="text-lg" title={journey.selected_vibe}>
                  {getVibeEmoji(journey.selected_vibe)}
                </span>
              </div>
              
              <div className="flex items-center mt-1 mb-2">
                <span className="font-medium text-slate-900 dark:text-white">{journey.origin}</span>
                <ArrowRight className="h-4 w-4 mx-2 text-slate-400" />
                <span className="font-medium text-slate-900 dark:text-white">{journey.destination}</span>
                {journey.transit && (
                  <span className="text-xs text-slate-500 dark:text-slate-400 ml-2">
                    via {journey.transit}
                  </span>
                )}
              </div>
              
              <div className="flex justify-between items-end mt-2">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 text-slate-400 mr-1" />
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    {journey.departure_time 
                      ? new Date(journey.departure_time).toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                      : "No departure time"}
                  </p>
                </div>
                <Button variant="ghost" size="sm" className="text-xs text-primary-600 dark:text-primary-400">
                  View Details
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}