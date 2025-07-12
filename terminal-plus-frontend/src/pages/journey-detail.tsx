import React, { useEffect, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { Button } from "@/components/ui/button";
import { ArrowRight, Calendar, Clock, Plane, Info, Map, CheckCircle } from "lucide-react";
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

type TerminalJourneyPlanStop = {
  stop: number;
  name: string;
  location: string;
  type: string;
  walkingTime: string;
  stayDuration: string;
};

type TerminalJourneyPlan = {
  id: string;
  user_id: string;
  journey_id: string;
  plan: TerminalJourneyPlanStop[];
  created_at: string;
  updated_at: string;
};

export default function JourneyDetailPage() {
  const [_, setLocation] = useLocation();
  const [match, params] = useRoute("/journey/:id");
  const [journey, setJourney] = useState<Journey | null>(null);
  const [terminalPlan, setTerminalPlan] = useState<TerminalJourneyPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadJourneyData = async () => {
      if (!params?.id) {
        setError("No journey ID provided");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Fetch journey details
        const journeyResponse = await fetchWithAuth(`/api/getJourneyById?id=${params.id}`);
        
        if (!journeyResponse.ok) {
          const errorText = await journeyResponse.text();
          throw new Error(`Failed to load journey: ${errorText}`);
        }
        
        const journeyData = await journeyResponse.json();
        setJourney(journeyData.journey);
        
        // Fetch terminal journey plan if it exists
        try {
          const planResponse = await fetchWithAuth(`/api/getTerminalJourneyPlan?journey_id=${params.id}`);
          
          if (planResponse.ok) {
            const planData = await planResponse.json();
            if (planData.success && planData.plan) {
              setTerminalPlan(planData.plan);
            }
          }
        } catch (planErr) {
          // We don't want to set an error if the terminal plan doesn't exist
          console.log("No terminal journey plan found or error fetching:", planErr);
        }
      } catch (err) {
        console.error("Failed to load journey:", err);
        setError((err as Error).message || "Failed to load journey details");
      } finally {
        setLoading(false);
      }
    };

    loadJourneyData();
  }, [params?.id]);

  const handleBackToJourneys = () => {
    setLocation("/your-journeys");
  };
  
  const handleExploreTerminal = () => {
    if (journey) {
      setLocation(`/explore-terminal/${journey.id}`);
    }
  };

  // Vibe glow mapping
  const vibeGlow: Record<string, string> = {
    Relax: 'vibe-glow-relax',
    Explore: 'vibe-glow-explore',
    Comfort: 'vibe-glow-comfort',
    Work: 'vibe-glow-work',
    Quick: 'vibe-glow-quick'
  };
  const pageGlowClass = journey?.selected_vibe ? vibeGlow[journey.selected_vibe] : '';

  // Vibe background glow mapping
  const vibeBgGlow: Record<string, string> = {
    Relax: 'bg-[#A8D0E6]',
    Explore: 'bg-[#F76C6C]',
    Comfort: 'bg-[#CBAACB]',
    Work: 'bg-[#D3B88C]',
    Quick: 'bg-[#FFDD57]'
  };
  const pageBgGlowClass = journey?.selected_vibe ? vibeBgGlow[journey.selected_vibe] : 'bg-slate-100';

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (error || !journey) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <h2 className="text-xl font-bold text-red-600 dark:text-red-400">
            {error || "Journey not found"}
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            We couldn't find the journey you're looking for.
          </p>
          <Button
            onClick={handleBackToJourneys}
            className="mt-4"
          >
            <ArrowRight className="h-4 w-4 mr-2 rotate-180" />
            Back to Your Journeys
          </Button>
        </div>
      </div>
    );
  }

  const handleViewTerminalMap = () => {
    if (journey) {
      setLocation(`/terminal-map/${journey.id}`);
    }
  };

  return (
    <div className={`min-h-screen ${pageBgGlowClass}`}>
      <div className="max-w-3xl mx-auto bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-4 text-slate-900 dark:text-white">Journey Details</h1>
        <Button 
          variant="ghost" 
          className="mb-4" 
          onClick={handleBackToJourneys}
        >
          <ArrowRight className="h-4 w-4 mr-2 rotate-180" />
          Back to journeys
        </Button>
        
        <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-md">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">{journey.flight_number}</h2>
            <div className="flex items-center space-x-2">
              <span className="text-2xl">{getVibeEmoji(journey.selected_vibe)}</span>
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">{journey.selected_vibe} Vibe</span>
            </div>
          </div>
          
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-slate-500 dark:text-slate-400">Origin</div>
              <div className="text-sm text-slate-500 dark:text-slate-400">Destination</div>
            </div>
            <div className="flex items-center justify-between mt-1">
              <div className="text-xl font-bold">{journey.origin}</div>
              <ArrowRight className="h-5 w-5 text-slate-400" />
              <div className="text-xl font-bold">{journey.destination}</div>
            </div>
            {journey.transit && (
              <div className="text-sm text-center mt-1 text-slate-500 dark:text-slate-400">
                Via {journey.transit}
              </div>
            )}
          </div>
          
          <div className="border-t border-slate-200 dark:border-slate-700 pt-4 mt-4">
            <div className="flex items-start space-x-3">
              <span className="font-medium text-slate-900 dark:text-white">Departure Time</span>
              <span className="text-slate-600 dark:text-slate-300">{journey.departure_time ? new Date(journey.departure_time).toLocaleString() : "No departure time set"}</span>
            </div>
          </div>
          
          <div className="border-t border-slate-200 dark:border-slate-700 pt-4 mt-4">
            <div className="flex items-start space-x-3">
              <Info className="h-5 w-5 text-slate-400 mt-0.5" />
              <div>
                <div className="font-medium">Journey Created</div>
                <div className="text-slate-600 dark:text-slate-300">
                  {new Date(journey.created_at).toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Terminal Journey Plan Section */}
        {terminalPlan && terminalPlan.plan && terminalPlan.plan.length > 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-md mt-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold flex items-center">
                <Map className="h-5 w-5 mr-2 text-green-600" />
                Your Terminal Journey Plan
              </h3>
              <span className="text-xs bg-green-100 text-green-800 py-1 px-2 rounded-full">
                Saved
              </span>
            </div>
            
            <div className="space-y-4 mt-4">
              <ol className="relative border-l border-gray-200 dark:border-gray-700 ml-3">
                {terminalPlan.plan.map((stop, index) => (
                  <li key={index} className="mb-6 ml-6">
                    <span className="absolute flex items-center justify-center w-6 h-6 bg-blue-100 rounded-full -left-3 ring-8 ring-white dark:ring-gray-900 dark:bg-blue-900">
                      <span className="text-xs font-medium text-blue-800 dark:text-blue-300">{stop.stop}</span>
                    </span>
                    <h3 className="flex items-center mb-1 text-md font-semibold text-gray-900 dark:text-white">
                      {stop.name}
                    </h3>
                    <p className="mb-1 text-sm text-slate-600 dark:text-slate-300 flex items-center">
                      {stop.type} • {stop.location}
                    </p>
                    <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                      <span>Walking: {stop.walkingTime}</span>
                      <span>Stay: {stop.stayDuration}</span>
                    </div>
                  </li>
                ))}
              </ol>
              
              <div className="text-center mt-6">
                <Button
                  onClick={handleViewTerminalMap}
                  className="mt-2 text-sm"
                  variant="outline"
                >
                  <Map className="h-4 w-4 mr-2" />
                  View & Edit Terminal Map
                </Button>
              </div>
            </div>
          </div>
        )}
        
        <div className="p-4 bg-primary-50 dark:bg-slate-900 rounded-lg mt-4">
          <h3 className="font-medium mb-2">Terminal Tips ({journey.selected_vibe})</h3>
          {journey.selected_vibe === 'Relax' && (
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Look for premium lounges or quiet areas in the terminal. Consider arriving early to enjoy spa services if available.
            </p>
          )}
          {journey.selected_vibe === 'Explore' && (
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Check out duty-free shopping, local cuisine restaurants, and airport exhibits. Many airports offer guided tours or cultural experiences.
            </p>
          )}
          {journey.selected_vibe === 'Work' && (
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Find business lounges with reliable WiFi, power outlets, and quiet work spaces. Consider calling ahead to check meeting room availability.
            </p>
          )}
          {journey.selected_vibe === 'Quick' && (
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Use express security lanes where available. Look for grab-and-go food options and stay near your departure gate.
            </p>
          )}
          
          <Button
            onClick={handleExploreTerminal}
            className="w-full mt-4 bg-gradient-to-r from-primary-600 to-secondary-600 text-white"
          >
            {terminalPlan ? "Update Terminal Experience" : "Explore Terminal Experience"}
          </Button>
        </div>
      </div>
    </div>
  );
}