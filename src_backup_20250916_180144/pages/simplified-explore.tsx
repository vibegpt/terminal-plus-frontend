import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Coffee, Map, Moon, ShoppingBag, Tv, Utensils, Wifi, Plane } from "lucide-react";
import { resolveTerminal } from "@/utils";
import { useAuth } from "@/hooks/useAuth";
import { useSimpleToast } from "@/hooks/useSimpleToast";
import SimpleToast from "@/components/ui/SimpleToast";
import supabase from "@/lib/supabase";
import amenitiesData from "@/data/amenities.json";
import { getBoardingStatus } from "@/utils";
import { VibeRecommendations } from "@/components/VibeRecommendations";

type JourneyData = {
  origin: string;
  selected_vibe: string;
  flight_number: string;
  destination: string;
  transit?: string;
  transitDetected?: boolean;
  selfTransferDetected?: boolean;
  terminal?: string;
  boarding_time?: string;
};

type TerminalAmenity = {
  name: string;
  location: string;
  type: string;
  icon: React.ReactNode;
  score: number;
};

export default function SimplifiedExplore() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast, showToast, clearToast } = useSimpleToast();
  const [journeyData, setJourneyData] = useState<JourneyData | null>(null);
  const [amenities, setAmenities] = useState<any[]>([]);
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
      
      // Filter amenities by airport, terminal, and vibe
      const filtered = (amenitiesData as any[]).filter(a => {
        // First check if this is a Sydney Airport amenity
        if (!a.terminal_code?.startsWith('SYD-')) {
          return false;
        }
        
        // Then check if it matches the specific terminal
        const terminalMatches = a.terminal_code === `SYD-${terminal}`;
        if (!terminalMatches) {
          return false;
        }
        
        // Finally check if the vibe tags match
        const vibeMatches = a.vibe_tags?.some((tag: string) => 
          tag.toLowerCase() === data.selected_vibe.toLowerCase()
        ) || false;

        return vibeMatches;
      });

      // Sort amenities by relevance to the selected vibe
      const sortedAmenities = filtered.sort((a, b) => {
        const aVibeScore = a.vibe_tags?.filter((tag: string) => 
          tag.toLowerCase() === data.selected_vibe.toLowerCase()
        ).length || 0;
        const bVibeScore = b.vibe_tags?.filter((tag: string) => 
          tag.toLowerCase() === data.selected_vibe.toLowerCase()
        ).length || 0;
        return bVibeScore - aVibeScore;
      });

      // Log the filtered amenities for debugging
      console.log('Filtered amenities:', {
        terminalCode: `SYD-${terminal}`,
        count: sortedAmenities.length,
        amenities: sortedAmenities.map(a => ({
          name: a.name,
          terminal_code: a.terminal_code,
          vibe_tags: a.vibe_tags
        }))
      });

      setAmenities(sortedAmenities);
    } else {
      // Redirect to input page if no data is available
      navigate("/simplified-journey-input");
    }
  }, [navigate]);
  
  const handleViewMap = () => {
    // In a real app, this would navigate to the experience view
    if (journeyData) {
      // Store amenities for the experience view
      sessionStorage.setItem("topAmenities", JSON.stringify(amenities.slice(0, 4)));
      navigate("/experience");
    }
  };
  
  const handleBack = () => {
    navigate("/simplified-journey-input");
  };
  
  const handleSaveJourney = async () => {
    setIsSaving(true);
    try {
      // Create a journey plan from the selected amenities
      const journeyPlan = amenities.slice(0, 4).map((amenity, index) => ({
        name: amenity.name,
        location: amenity.location_description,
        type: amenity.amenity_type,
        walkingTime: "5-10 min",
        stayDuration: "15-20 min",
        tags: amenity.vibe_tags || []
      }));

      // Save the journey plan to session storage
      sessionStorage.setItem("journeyPlan", JSON.stringify(journeyPlan));

      // Save the journey data
      const journeyDataStr = sessionStorage.getItem("tempJourneyData");
      if (!journeyDataStr) {
        throw new Error("No journey data found!");
      }

      const journeyData = JSON.parse(journeyDataStr);
      const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/saveJourney`;
      const payload = {
        flight_number: journeyData.flight_number || "Unknown",
        origin: journeyData.origin || "Unknown",
        destination: journeyData.destination || "Unknown",
        transit: journeyData.transit || undefined,
        selected_vibe: journeyData.selected_vibe || "Unknown",
        departure_time: new Date().toISOString(),
        anonymous_id: getAnonymousId(),
        journey_plan: journeyPlan,
      };

      const response = await fetch(functionUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      if (result.success) {
        showToast("Journey saved successfully!", "success");
        navigate("/my-journey");
      } else {
        throw new Error(result.error || "Failed to save journey");
      }
    } catch (error: any) {
      console.error("Error saving journey:", error);
      showToast(`Error saving journey: ${error.message || "Unknown error"}`, "error");
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
  
  // After journeyData is loaded
  const boardingTime = journeyData?.boarding_time ? new Date(journeyData.boarding_time).getTime() : undefined;
  const boardingStatus = getBoardingStatus(boardingTime);

  // Filter/prioritize amenities based on status
  let filteredAmenities = amenities;
  if (boardingStatus === 'imminent') {
    filteredAmenities = amenities.filter(a => (a.Tags && a.Tags.includes('Gate')) || (a.Tags && a.Tags.includes('Quick')) || (a.Type && a.Type.includes('Grab')));
  }
  
  // Vibe glow mapping
  const vibeGlow: Record<string, string> = {
    Relax: 'vibe-glow-relax',
    Explore: 'vibe-glow-explore',
    Comfort: 'vibe-glow-comfort',
    Work: 'vibe-glow-work',
    Quick: 'vibe-glow-quick'
  };
  const pageGlowClass = journeyData?.selected_vibe ? vibeGlow[journeyData.selected_vibe] : '';
  
  const vibeBgGlow: Record<string, string> = {
    Relax: 'bg-[#A8D0E6]',
    Explore: 'bg-[#F76C6C]',
    Comfort: 'bg-[#CBAACB]',
    Work: 'bg-[#D3B88C]',
    Quick: 'bg-[#FFDD57]'
  };
  const pageBgGlowClass = journeyData?.selected_vibe ? vibeBgGlow[journeyData.selected_vibe] : 'bg-slate-100';
  
  if (!journeyData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white dark:bg-slate-900">
        <div className="animate-spin h-8 w-8 border-4 border-primary-600 dark:border-primary-400 border-t-transparent rounded-full"></div>
      </div>
    );
  }
  
  return (
    <div className={`min-h-screen flex flex-col items-center justify-center ${pageBgGlowClass} ${pageGlowClass} bg-white dark:bg-slate-900`}>
      {toast && <SimpleToast message={toast.message} type={toast.type} />}
      <Button 
        variant="ghost" 
        className="mb-4 text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800" 
        onClick={handleBack}
      >
        <ArrowRight className="h-4 w-4 mr-2 rotate-180" />
        Back to journey input
      </Button>
      
      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-md mb-6">
        <h1 className="text-2xl font-bold mb-4 flex items-center text-slate-900 dark:text-white">
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
            <span className="text-xs text-slate-500 dark:text-slate-400 ml-2">(guessed based on flight number)</span>
          </p>
          <p className="mb-2">
            ✨ Vibe: <strong>{journeyData.selected_vibe}</strong>
          </p>
        </div>
      </div>
      
      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-md mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Top Amenities</h2>
          <span className="bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 text-xs px-2 py-1 rounded-full">
            {journeyData.selected_vibe} Vibe
          </span>
        </div>
        
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
        
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
          Based on your {journeyData.selected_vibe.toLowerCase()} preferences, we recommend these amenities:
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {filteredAmenities.slice(0, 4).map((amenity, index) => (
            <div key={index} className="bg-white dark:bg-slate-800 rounded-lg shadow p-6 flex flex-col gap-2 border border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">
                  {/* Emoji/icon based on amenity_type or category */}
                  {amenity.amenity_type?.includes("Lounge") ? "🛋️" :
                   amenity.amenity_type?.includes("Cafe") ? "☕" :
                   amenity.amenity_type?.includes("Food") ? "🍽️" :
                   amenity.amenity_type?.includes("Shopping") ? "🛍️" :
                   amenity.amenity_type?.includes("Entertainment") ? "🎬" :
                   amenity.amenity_type?.includes("Spa") ? "💆" :
                   amenity.amenity_type?.includes("Shower") ? "🚿" :
                   amenity.amenity_type?.includes("Sleep") ? "🛏️" :
                   "✨"}
                </span>
                <div>
                  <div className="font-semibold text-lg text-slate-900 dark:text-white">{amenity.name}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">{amenity.amenity_type}</div>
                </div>
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-300">{amenity.location_description}</div>
              <div className="flex flex-wrap gap-2 mt-2">
                {amenity.vibe_tags && amenity.vibe_tags.map((tag: string, i: number) => (
                  <span key={i} className="bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 text-xs px-2 py-1 rounded-full">{tag}</span>
                ))}
              </div>
              <div className="text-xs text-slate-400 dark:text-slate-500 mt-2">{Object.entries(amenity.opening_hours).map(([day, hours]) => `${day}: ${hours}`).join(", ")} • {amenity.price_tier}</div>
            </div>
          ))}
        </div>
        
        <div className="text-center mt-6 space-y-4">
          <Button 
            onClick={handleSaveJourney}
            className="w-full py-6 bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white dark:text-white font-semibold text-lg"
            disabled={isSaving}
          >
            <Plane className="h-5 w-5 mr-2" />
            {isSaving ? "Saving Journey..." : "Save Journey"}
          </Button>

          <Button onClick={handleViewMap} className="w-full bg-gradient-to-r from-primary-600 to-secondary-600 text-white dark:text-white">
            <Map className="h-4 w-4 mr-2" /> View Terminal Map
          </Button>
          
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">Need to rest and recharge?</p>
            <Button 
              onClick={() => navigate("/comfort-journey")} 
              variant="outline"
              className="border-purple-300 dark:border-purple-800 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950"
            >
              <Moon className="h-4 w-4 mr-2" /> Try Comfort Journey
            </Button>
          </div>
        </div>
      </div>
      
      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-md">
        <h2 className="text-xl font-semibold mb-4 text-slate-900 dark:text-white">{journeyData.selected_vibe} Vibe Tips</h2>
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
      
      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-md">
        <VibeRecommendations
          amenities={filteredAmenities}
          currentTerminal={terminalName}
          currentGate={"A1"}
          timeAvailableMinutes={60}
          initialVibe={journeyData?.selected_vibe}
        />
      </div>
    </div>
  );
}