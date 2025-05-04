import React, { useEffect, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Map, ArrowRight, MapPin } from "lucide-react";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
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

// Rough walking time estimator based on location description
const estimateWalkingTime = (locationDesc: string) => {
  if (!locationDesc) return "5 min walk";

  const desc = locationDesc.toLowerCase();

  if (desc.includes("gate a") || desc.includes("gate b") || desc.includes("gate c")) {
    return "2-4 min walk";
  }
  if (desc.includes("main concourse") || desc.includes("central area")) {
    return "5-7 min walk";
  }
  if (desc.includes("upper level") || desc.includes("satellite gate") || 
      desc.includes("gate d") || desc.includes("gate e")) {
    return "7-10 min walk";
  }

  return "5 min walk"; // Default
};

// Type for a terminal amenity
type TerminalAmenity = {
  name: string;
  location: string;
  type: string;
};

// Type for a journey stop in the plan
type JourneyStop = {
  stop: number;
  name: string;
  location: string;
  type: string;
  walkingTime: string;
  stayDuration: string;
};

export default function TerminalMapPage() {
  const [_, setLocation] = useLocation();
  const [match, params] = useRoute("/terminal-map/:id");
  const [journey, setJourney] = useState<Journey | null>(null);
  const [loading, setLoading] = useState(true);
  const [terminalName, setTerminalName] = useState("");
  const [showTerminalPicker, setShowTerminalPicker] = useState(false);
  const [selectedAmenities, setSelectedAmenities] = useState<TerminalAmenity[]>([]);
  const [generatedPlan, setGeneratedPlan] = useState<JourneyStop[] | null>(null);

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
        
        // Set terminal name after journey is loaded
        if (data.journey) {
          const terminal = guessTerminal(data.journey.origin, data.journey.flight_number);
          setTerminalName(terminal);
        }
      } catch (err) {
        console.error("Failed to load journey:", err);
      } finally {
        setLoading(false);
      }
    };

    loadJourney();
  }, [params?.id]);

  const generateJourneyPlan = async () => {
    // Simple time planning:
    // Assume each stop = ~15 minutes + walking time
    const plan = selectedAmenities.map((item, index) => ({
      stop: index + 1,
      name: item.name,
      location: item.location,
      type: item.type,
      walkingTime: estimateWalkingTime(item.location),
      stayDuration: "15-20 min"
    }));

    setGeneratedPlan(plan);

    // Save to Supabase
    if (journey?.id) {
      try {
        const response = await fetchWithAuth("/api/saveTerminalJourneyPlan", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            journey_id: journey.id,
            plan: plan
          }),
        });

        if (response.ok) {
          const result = await response.json();
          console.log("Journey Plan Saved:", result);
        } else {
          console.error("Error saving terminal journey plan:", await response.text());
        }
      } catch (error) {
        console.error("Error saving terminal journey plan:", error);
      }
    }
  };

  const handleAddToJourney = (amenity: TerminalAmenity) => {
    // Prevent adding duplicates
    if (!selectedAmenities.some((item) => item.name === amenity.name)) {
      setSelectedAmenities([...selectedAmenities, amenity]);
    }
  };
  
  const moveStop = (index: number, direction: "up" | "down") => {
    const newSelection = [...selectedAmenities];
    const targetIndex = direction === "up" ? index - 1 : index + 1;

    // Swap elements
    const temp = newSelection[index];
    newSelection[index] = newSelection[targetIndex];
    newSelection[targetIndex] = temp;

    setSelectedAmenities(newSelection);
  };

  const handleBack = () => {
    if (journey) {
      setLocation(`/explore-terminal/${journey.id}`);
    } else {
      setLocation("/your-journeys");
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

  // Mapping of Airport + Terminal to image paths
  // In a production app, these would be real terminal maps
  const terminalImages: Record<string, string> = {
    "SYD_T1": "/terminal-maps/SYD_T1_placeholder.jpg",
    "SIN_T3": "/terminal-maps/SIN_T3_placeholder.jpg",
    "LHR_T5": "/terminal-maps/LHR_T5_placeholder.jpg",
    // Add more terminal maps as needed
  };

  const mapKey = `${journey.origin}_${terminalName}`;
  
  return (
    <div className="p-4 max-w-4xl mx-auto">
      <Button 
        variant="ghost" 
        className="mb-4" 
        onClick={handleBack}
      >
        <ArrowRight className="h-4 w-4 mr-2 rotate-180" />
        Back to Terminal Guide
      </Button>

      <h1 className="text-2xl font-bold mb-6 flex items-center">
        <MapPin className="h-5 w-5 mr-2 text-primary-600" />
        Terminal Map - {journey.origin} {terminalName}
      </h1>

      <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-md mb-6">
        <div className="mb-2 text-slate-700 dark:text-slate-300">
          <p className="mb-2">
            ✈️ Flight: <strong>{journey.flight_number}</strong>
          </p>
          <p className="mb-2">
            🛫 Airport: <strong>{journey.origin}</strong>
          </p>
          <p className="flex items-center gap-2 mb-2">
            🏢 Terminal: <strong>{terminalName}</strong> 
            <span className="text-xs text-slate-500">(guessed based on airline + airport)</span>
            <button
              onClick={() => setShowTerminalPicker(true)}
              className="text-blue-600 underline text-sm ml-1"
            >
              (Change)
            </button>
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-md mb-6">
        {terminalImages[mapKey] ? (
          <div className="flex flex-col items-center">
            <img 
              src={terminalImages[mapKey]} 
              alt={`Terminal map for ${journey.origin} ${terminalName}`} 
              className="max-w-full rounded-lg shadow-sm"
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg">
            <Map className="h-16 w-16 text-slate-400 mb-4" />
            <p className="text-center text-slate-600 dark:text-slate-400">
              Terminal map for {journey.origin} {terminalName} is not available yet.
            </p>
            <p className="text-center text-sm text-slate-500 dark:text-slate-500 mt-2">
              We're working on adding more terminal maps soon.
            </p>
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-md mb-6">
        <h2 className="text-lg font-semibold mb-4">Terminal Facilities</h2>
        <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">Select amenities to create your personal journey plan</div>
        <ul className="space-y-3 text-slate-700 dark:text-slate-300">
          <li className="border-b border-slate-100 dark:border-slate-700 pb-3">
            <div className="font-semibold flex items-center">
              <span className="mr-2">🍽️</span> Food Court
            </div>
            <div className="text-sm text-slate-500 dark:text-slate-400 ml-6">Main Concourse, Level 2</div>
            <div className="text-xs ml-6 mb-2">Food • {estimateWalkingTime("Main Concourse")}</div>
            <button
              onClick={() => handleAddToJourney({
                name: "Food Court",
                location: "Main Concourse, Level 2",
                type: "Food"
              })}
              className="bg-green-600 text-white py-1 px-3 rounded hover:bg-green-700 transition text-sm ml-6"
            >
              ➕ Add to Journey
            </button>
          </li>
          <li className="border-b border-slate-100 dark:border-slate-700 pb-3">
            <div className="font-semibold flex items-center">
              <span className="mr-2">🛍️</span> Duty-Free Shopping
            </div>
            <div className="text-sm text-slate-500 dark:text-slate-400 ml-6">Central Area, Near Gates A-C</div>
            <div className="text-xs ml-6 mb-2">Shopping • {estimateWalkingTime("Central Area, Near Gates A-C")}</div>
            <button
              onClick={() => handleAddToJourney({
                name: "Duty-Free Shopping",
                location: "Central Area, Near Gates A-C",
                type: "Shopping"
              })}
              className="bg-green-600 text-white py-1 px-3 rounded hover:bg-green-700 transition text-sm ml-6"
            >
              ➕ Add to Journey
            </button>
          </li>
          <li className="border-b border-slate-100 dark:border-slate-700 pb-3">
            <div className="font-semibold flex items-center">
              <span className="mr-2">💺</span> Business Lounge
            </div>
            <div className="text-sm text-slate-500 dark:text-slate-400 ml-6">Upper Level, Gate D Concourse</div>
            <div className="text-xs ml-6 mb-2">Lounge • {estimateWalkingTime("Upper Level, Gate D Concourse")}</div>
            <button
              onClick={() => handleAddToJourney({
                name: "Business Lounge",
                location: "Upper Level, Gate D Concourse",
                type: "Lounge"
              })}
              className="bg-green-600 text-white py-1 px-3 rounded hover:bg-green-700 transition text-sm ml-6"
            >
              ➕ Add to Journey
            </button>
          </li>
          <li className="border-b border-slate-100 dark:border-slate-700 pb-3">
            <div className="font-semibold flex items-center">
              <span className="mr-2">☕</span> Coffee Shop
            </div>
            <div className="text-sm text-slate-500 dark:text-slate-400 ml-6">Near Gate B12</div>
            <div className="text-xs ml-6 mb-2">Cafe • {estimateWalkingTime("Near Gate B12")}</div>
            <button
              onClick={() => handleAddToJourney({
                name: "Coffee Shop",
                location: "Near Gate B12",
                type: "Cafe"
              })}
              className="bg-green-600 text-white py-1 px-3 rounded hover:bg-green-700 transition text-sm ml-6"
            >
              ➕ Add to Journey
            </button>
          </li>
          <li className="pb-2">
            <div className="font-semibold flex items-center">
              <span className="mr-2">🚿</span> Shower Facilities
            </div>
            <div className="text-sm text-slate-500 dark:text-slate-400 ml-6">Satellite Terminal, Gate E4</div>
            <div className="text-xs ml-6 mb-2">Services • {estimateWalkingTime("Satellite Terminal, Gate E4")}</div>
            <button
              onClick={() => handleAddToJourney({
                name: "Shower Facilities",
                location: "Satellite Terminal, Gate E4",
                type: "Services"
              })}
              className="bg-green-600 text-white py-1 px-3 rounded hover:bg-green-700 transition text-sm ml-6"
            >
              ➕ Add to Journey
            </button>
          </li>
        </ul>
        
        {selectedAmenities.length > 0 && !generatedPlan && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4 text-center">Your Selected Stops</h2>
            <ul className="space-y-4">
              {selectedAmenities.map((item, index) => (
                <li key={index} className="border p-4 rounded flex items-center justify-between bg-white dark:bg-slate-700 shadow-sm">
                  <div>
                    <div className="font-semibold">{item.name}</div>
                    <div className="text-gray-500 dark:text-gray-300 text-sm">{item.type}</div>
                    <div className="text-gray-400 dark:text-gray-400 text-xs">{item.location} • {estimateWalkingTime(item.location)}</div>
                  </div>
                  <div className="flex gap-2">
                    {index > 0 && (
                      <button
                        onClick={() => moveStop(index, "up")}
                        className="bg-gray-200 dark:bg-slate-600 px-2 py-1 rounded hover:bg-gray-300 dark:hover:bg-slate-500"
                      >
                        ⬆️
                      </button>
                    )}
                    {index < selectedAmenities.length - 1 && (
                      <button
                        onClick={() => moveStop(index, "down")}
                        className="bg-gray-200 dark:bg-slate-600 px-2 py-1 rounded hover:bg-gray-300 dark:hover:bg-slate-500"
                      >
                        ⬇️
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>

            <div className="text-center mt-6">
              <button
                onClick={generateJourneyPlan}
                className="bg-purple-600 text-white py-3 px-6 rounded-lg hover:bg-purple-700 transition text-lg"
              >
                ✨ Generate My Journey Plan
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Journey Plan Display */}
      {generatedPlan && (
        <div className="mt-12 bg-white dark:bg-slate-800 rounded-lg p-6 shadow-md mb-6">
          <h2 className="text-2xl font-bold mb-4">Your Terminal Journey ✈️</h2>
          <ol className="space-y-4 list-decimal list-inside">
            {generatedPlan.map((stop) => (
              <li key={stop.stop} className="border p-4 rounded shadow bg-white dark:bg-slate-700">
                <div className="font-semibold text-lg">{stop.name}</div>
                <div className="text-gray-600 dark:text-gray-300">{stop.location}</div>
                <div className="text-sm">{stop.type} • {stop.walkingTime}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Stay about: {stop.stayDuration}</div>
              </li>
            ))}
          </ol>
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Terminal Journey Tips</h3>
            <ul className="text-sm text-slate-600 dark:text-slate-300 space-y-2">
              <li>• Always allow extra time for security and unexpected delays</li>
              <li>• Check flight information displays regularly for gate changes</li>
              <li>• Keep your boarding pass and ID easily accessible</li>
              <li>• Stay hydrated during your terminal journey</li>
            </ul>
          </div>
          <div className="mt-6 text-center">
            <button 
              onClick={() => setGeneratedPlan(null)} 
              className="bg-slate-600 text-white py-2 px-4 rounded hover:bg-slate-700 transition mr-4"
            >
              Edit Journey
            </button>
            <button 
              onClick={async () => {
                if (!generatedPlan) return;
                
                try {
                  const response = await fetchWithAuth("/api/saveTerminalJourneyPlan", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                      journey_id: journey.id,
                      plan: generatedPlan
                    }),
                  });

                  if (response.ok) {
                    alert("Journey plan saved successfully!");
                  } else {
                    console.error("Error saving plan:", await response.text());
                    alert("Failed to save journey plan. Please try again.");
                  }
                } catch (error) {
                  console.error("Error saving terminal journey plan:", error);
                  alert("An error occurred while saving your journey plan.");
                }
              }} 
              className="bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 transition"
            >
              Save Journey Plan
            </button>
          </div>
        </div>
      )}

      <div className="text-center text-xs text-slate-500 dark:text-slate-400 mt-8">
        This is a preview of the terminal map feature that's currently in development. 
        Full functionality and accurate maps coming soon!
      </div>
      
      {/* Terminal Picker Modal */}
      {showTerminalPicker && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg max-w-sm w-full">
            <h2 className="text-xl font-bold mb-4 dark:text-white">Select Your Terminal</h2>
            <select
              onChange={(e) => setTerminalName(e.target.value)}
              value={terminalName}
              className="w-full p-2 border rounded mb-4 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
            >
              <option value="T1">Terminal 1</option>
              <option value="T2">Terminal 2</option>
              <option value="T3">Terminal 3</option>
              <option value="T4">Terminal 4</option>
              <option value="T5">Terminal 5</option>
            </select>

            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowTerminalPicker(false)}
                className="text-gray-600 dark:text-gray-400 underline"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowTerminalPicker(false)}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}