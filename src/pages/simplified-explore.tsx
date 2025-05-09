import React, { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, Coffee, Map, Moon, ShoppingBag, Tv, Utensils, Wifi, Plane } from "lucide-react";
import { resolveTerminal } from "@/utils/terminalGuesses";
import { useAuth } from "@/hooks/useAuth";
import { useSimpleToast } from "@/hooks/useSimpleToast";
import SimpleToast from "@/components/ui/SimpleToast";
import supabase from "@/lib/supabase";

type JourneyData = {
  origin: string;
  selected_vibe: string;
  flight_number: string;
  destination: string;
  transit?: string;
  transitDetected?: boolean;
  selfTransferDetected?: boolean;
};

type TerminalAmenity = {
  name: string;
  location: string;
  type: string;
  icon: React.ReactNode;
  score: number;
};

export default function SimplifiedExplore() {
  const [_, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast, showToast, clearToast } = useSimpleToast();
  const [journeyData, setJourneyData] = useState<JourneyData | null>(null);
  const [amenities, setAmenities] = useState<TerminalAmenity[]>([]);
  const [terminalName, setTerminalName] = useState("T1");
  const [isSaving, setIsSaving] = useState(false);
  
  useEffect(() => {
    // Debug log for loaded journey data
    console.log("Loaded journey data (explore):", sessionStorage.getItem("tempJourneyData"));
    // Retrieve journey data from session storage
    const storedData = sessionStorage.getItem("tempJourneyData");
    if (storedData) {
      const data = JSON.parse(storedData);
      setJourneyData(data);
      
      // Generate terminal name based on flight and airport using imported function
      const terminal = resolveTerminal({ 
        airport: data.origin,
        flightNumber: data.flight_number
      });
      setTerminalName(terminal);
      
      // Generate amenities list based on vibe
      generateAmenities(data.selected_vibe);
    } else {
      // Redirect to input page if no data is available
      setLocation("/simplified-journey-input");
    }
  }, [setLocation]);
  
  const generateAmenities = (vibe: string) => {
    // Score factors based on vibe
    const scoreFactors: Record<string, Record<string, number>> = {
      "Relax": { "Lounge": 10, "Spa": 9, "Food": 7, "Shopping": 4 },
      "Explore": { "Shopping": 10, "Food": 8, "Entertainment": 7, "Services": 4 },
      "Work": { "Lounge": 10, "Cafe": 8, "Services": 7, "Food": 5 },
      "Quick": { "Food": 8, "Services": 7, "Cafe": 6, "Lounge": 3 }
    };
    
    // Base amenities
    const baseAmenities: TerminalAmenity[] = [
      { name: "Premium Lounge", location: "Upper Level, Gate D Concourse", type: "Lounge", icon: <Wifi className="h-5 w-5" />, score: 6 },
      { name: "Coffee Shop", location: "Near Gate B12", type: "Cafe", icon: <Coffee className="h-5 w-5" />, score: 6 },
      { name: "Food Court", location: "Main Concourse, Level 2", type: "Food", icon: <Utensils className="h-5 w-5" />, score: 6 },
      { name: "Duty-Free Shopping", location: "Central Area, Near Gates A-C", type: "Shopping", icon: <ShoppingBag className="h-5 w-5" />, score: 6 },
      { name: "Business Center", location: "Level 3, Near Gate F", type: "Services", icon: <Wifi className="h-5 w-5" />, score: 6 },
      { name: "Entertainment Zone", location: "Terminal 2, Center Area", type: "Entertainment", icon: <Tv className="h-5 w-5" />, score: 6 },
      { name: "Express Dining", location: "Near Gate A4", type: "Food", icon: <Utensils className="h-5 w-5" />, score: 6 },
      { name: "Relaxation Area", location: "Level 2, Near Gate D7", type: "Spa", icon: <Coffee className="h-5 w-5" />, score: 6 }
    ];
    
    // Score and sort amenities based on vibe preference
    const scoredAmenities = baseAmenities.map(amenity => {
      const vibeScores = scoreFactors[vibe] || scoreFactors["Explore"];
      const vibeScore = vibeScores[amenity.type] || 5;
      return {
        ...amenity,
        score: amenity.score * (vibeScore / 5)
      };
    });
    
    // Sort by score
    scoredAmenities.sort((a, b) => b.score - a.score);
    setAmenities(scoredAmenities);
  };
  
  const handleViewMap = () => {
    // In a real app, this would navigate to the map view
    if (journeyData) {
      // Store amenities for the map view
      sessionStorage.setItem("topAmenities", JSON.stringify(amenities.slice(0, 4)));
      setLocation("/simplified-map");
    }
  };
  
  const handleBack = () => {
    setLocation("/simplified-journey-input");
  };
  
  const handleSaveJourney = async () => {
    if (!journeyData) {
      showToast("No journey data available to save.", "error");
      return;
    }
    try {
      setIsSaving(true);
      showToast("Saving your journey...", "loading");
      const journeyDataToSave = {
        flight_number: journeyData.flight_number,
        origin: journeyData.origin,
        destination: journeyData.destination,
        transit: journeyData.transit || undefined,
        selected_vibe: journeyData.selected_vibe,
        departure_time: new Date().toISOString(),
        anonymous_id: getAnonymousId(),
      };
      const functionUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/saveJourney`;
      console.log("Saving journey:", journeyDataToSave);
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(journeyDataToSave)
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error saving journey:", {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        throw new Error(`Failed to save journey: ${errorText}`);
      }
      const data = await response.json();
      console.log("Journey saved successfully:", data);
      clearToast();
      showToast("Journey saved successfully!", "success");
      setLocation("/journey-success");
    } catch (error) {
      console.error("Error saving journey:", error);
      showToast(`Failed to save journey: ${(error as Error).message || 'Unknown error'}`, "error");
    } finally {
      setIsSaving(false);
    }
  };
  
  // Generate or retrieve an anonymous ID for the user
  function getAnonymousId() {
    let anonId = localStorage.getItem('anonymous_id');
    if (!anonId) {
      anonId = crypto.randomUUID();
      localStorage.setItem('anonymous_id', anonId);
    }
    return anonId;
  }
  
  if (!journeyData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }
  
  return (
    <div className="p-4 max-w-4xl mx-auto">
      {toast && <SimpleToast message={toast.message} type={toast.type} />}
      <Button 
        variant="ghost" 
        className="mb-4" 
        onClick={handleBack}
      >
        <ArrowRight className="h-4 w-4 mr-2 rotate-180" />
        Back to journey input
      </Button>
      
      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-md mb-6">
        <h1 className="text-2xl font-bold mb-4 flex items-center">
          Terminal Guide: {journeyData.origin} {terminalName}
        </h1>
        
        {journeyData.transitDetected && (
          <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-lg p-3 mb-4 text-amber-800 dark:text-amber-200">
            <p className="flex items-center">
              <span className="mr-2 text-lg">✈️</span>
              <span>
                <strong>Transit Flight Detected!</strong> We've optimized your recommendations for a layover at {journeyData.origin}.
              </span>
            </p>
          </div>
        )}
        
        <div className="mb-4 text-slate-700 dark:text-slate-300">
          <p className="mb-2">
            ✈️ Flight: <strong>{journeyData.flight_number}</strong>
          </p>
          <p className="mb-2">
            🛫 From: <strong>{journeyData.origin}</strong>
          </p>
          <p className="mb-2">
            🛬 To: <strong>{journeyData.destination}</strong>
          </p>
          {journeyData.transit && (
            <p className="mb-2">
              ✈️ Transit: <strong>{journeyData.transit}</strong>
            </p>
          )}
          <p className="mb-2 flex items-center">
            🏢 Terminal: <strong className="ml-1">{terminalName}</strong> 
            <span className="text-xs text-slate-500 ml-2">(guessed based on flight number)</span>
          </p>
          <p className="mb-2">
            ✨ Vibe: <strong>{journeyData.selected_vibe}</strong>
          </p>
        </div>
      </div>
      
      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-md mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Top Recommendations</h2>
          <span className="bg-primary-100 text-primary-800 text-xs px-2 py-1 rounded-full">
            {journeyData.selected_vibe} Vibe
          </span>
        </div>
        
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
          Based on your {journeyData.selected_vibe.toLowerCase()} preferences, we recommend these amenities:
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {amenities.slice(0, 4).map((amenity, index) => (
            <div key={index} className="border rounded-lg p-4 flex items-start hover:shadow-md transition">
              <div className="bg-primary-100 dark:bg-primary-900 p-2 rounded-full mr-3">
                {amenity.icon}
              </div>
              <div>
                <h3 className="font-medium mb-1">{amenity.name}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">{amenity.type}</p>
                <p className="text-xs text-slate-500 dark:text-slate-500">{amenity.location}</p>
              </div>
            </div>
          ))}
        </div>
        
        <div className="text-center mt-6 space-y-4">
          <Button 
            onClick={handleSaveJourney}
            className="w-full py-6 bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white font-semibold text-lg"
            disabled={isSaving}
          >
            <Plane className="h-5 w-5 mr-2" />
            {isSaving ? "Saving Journey..." : "Save Journey"}
          </Button>

          <Button onClick={handleViewMap} className="w-full bg-gradient-to-r from-primary-600 to-secondary-600">
            <Map className="h-4 w-4 mr-2" /> View Terminal Map
          </Button>
          
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">Need to rest and recharge?</p>
            <Button 
              onClick={() => setLocation("/comfort-journey")} 
              variant="outline"
              className="border-purple-300 text-purple-700 hover:bg-purple-50 dark:border-purple-800 dark:text-purple-300 dark:hover:bg-purple-950"
            >
              <Moon className="h-4 w-4 mr-2" /> Try Comfort Journey
            </Button>
          </div>
        </div>
      </div>
      
      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-md">
        <h2 className="text-xl font-semibold mb-4">{journeyData.selected_vibe} Vibe Tips</h2>
        {journeyData.selected_vibe === "Relax" && (
          <div className="space-y-3 text-slate-700 dark:text-slate-300">
            <p>🛌 Visit the Premium Lounge for a quiet place to relax</p>
            <p>🧘‍♀️ Check out the Relaxation Area for comfortable seating</p>
            <p>🍹 Enjoy a premium dining experience at one of our restaurants</p>
            <p>⏰ Arrive at least 3 hours early to make the most of relaxation time</p>
          </div>
        )}
        {journeyData.selected_vibe === "Explore" && (
          <div className="space-y-3 text-slate-700 dark:text-slate-300">
            <p>🛍️ Don't miss our Duty-Free Shopping area with exclusive deals</p>
            <p>🍽️ Try local cuisine at our Food Court with international options</p>
            <p>🎮 Visit the Entertainment Zone for interactive experiences</p>
            <p>📱 Download our airport map from the information desk</p>
          </div>
        )}
        {journeyData.selected_vibe === "Work" && (
          <div className="space-y-3 text-slate-700 dark:text-slate-300">
            <p>💻 The Business Center offers private workspaces and printing</p>
            <p>🔌 Power outlets available at the Premium Lounge</p>
            <p>☕ Find high-speed WiFi and coffee at our Coffee Shop</p>
            <p>🤝 Meeting rooms can be reserved on short notice</p>
          </div>
        )}
        {journeyData.selected_vibe === "Quick" && (
          <div className="space-y-3 text-slate-700 dark:text-slate-300">
            <p>⏩ Fast Track security available at the main entrance</p>
            <p>🍔 Express Dining offers meals ready in under 10 minutes</p>
            <p>🚶‍♂️ Follow the Quick Path signs to your gate</p>
            <p>📱 Mobile ordering available at most food outlets</p>
          </div>
        )}
      </div>
    </div>
  );
}