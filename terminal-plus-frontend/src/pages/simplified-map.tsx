import React, { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle, Map, MapPin } from "lucide-react";
import { getBoardingStatus } from "@/utils/getBoardingStatus";

type JourneyData = {
  origin: string;
  selected_vibe: string;
  flight_number: string;
  destination: string;
  transit?: string;
  boarding_time?: string;
};

type TerminalAmenity = {
  name: string;
  amenity_type: string;
  location_description: string;
  category: string;
  vibe_tags: string[];
  price_tier: string;
  opening_hours: Record<string, string>;
  image_url?: string;
  slug: string;
};

type JourneyStop = {
  stop: number;
  name: string;
  location: string;
  type: string;
  walkingTime: string;
  stayDuration: string;
};

export default function SimplifiedMap() {
  const [_, setLocation] = useLocation();
  const [journeyData, setJourneyData] = useState<JourneyData | null>(null);
  const [terminalName, setTerminalName] = useState("T1");
  const [selectedAmenities, setSelectedAmenities] = useState<TerminalAmenity[]>([]);
  const [recommendedAmenities, setRecommendedAmenities] = useState<TerminalAmenity[]>([]);
  const [generatedPlan, setGeneratedPlan] = useState<JourneyStop[] | null>(null);
  
  useEffect(() => {
    // Retrieve journey data from session storage
    const storedData = sessionStorage.getItem("tempJourneyData");
    const storedAmenities = sessionStorage.getItem("topAmenities");
    
    if (storedData) {
      const data = JSON.parse(storedData);
      setJourneyData(data);
      
      // Generate terminal name based on flight and airport
      const terminal = data.flight_number.startsWith("SQ") ? "T3" : 
                       data.flight_number.startsWith("QF") ? "T1" : 
                       data.flight_number.startsWith("BA") ? "T5" : "T1";
      setTerminalName(terminal);
    } else {
      // Redirect to input page if no data is available
      setLocation("/simplified-journey-input");
    }
    
    if (storedAmenities) {
      setRecommendedAmenities(JSON.parse(storedAmenities));
    }
  }, [setLocation]);
  
  const estimateWalkingTime = (location: string): string => {
    // Simple algorithm to estimate walking time based on terminal location text
    if (location.includes("Gate") || location.includes("Satellite")) {
      return "7-10 min";
    } else if (location.includes("Level") || location.includes("Upper")) {
      return "5-7 min";
    } else {
      return "2-4 min";
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
  
  const generateJourneyPlan = () => {
    // Simple time planning:
    // Assume each stop = ~15 minutes + walking time
    const plan = selectedAmenities.map((item, index) => ({
      stop: index + 1,
      name: item.name,
      location: item.location_description,
      type: item.amenity_type,
      walkingTime: estimateWalkingTime(item.location_description),
      stayDuration: "15-20 min"
    }));
    
    setGeneratedPlan(plan);
    
    // In a real app, we'd save this to the database
    // For now, just store in sessionStorage
    sessionStorage.setItem("generatedPlan", JSON.stringify(plan));
  };
  
  const handleBack = () => {
    setLocation("/simplified-explore");
  };
  
  const handleCompleteJourney = () => {
    // Here we'd normally save the plan to the database
    // For this simplified version, we'll just show a message
    alert("Journey plan saved successfully! In a complete implementation, this would be saved to your account.");
    setLocation("/simplified-journey-input");
  };
  
  // After journeyData is loaded
  const boardingTime = journeyData?.boarding_time ? new Date(journeyData.boarding_time).getTime() : undefined;
  const boardingStatus = getBoardingStatus(boardingTime);

  // Filter/prioritize recommended amenities based on status
  let filteredAmenities = recommendedAmenities;
  if (boardingStatus === 'imminent') {
    filteredAmenities = recommendedAmenities.filter(a => (a.vibe_tags && a.vibe_tags.includes('Gate')) || (a.vibe_tags && a.vibe_tags.includes('Quick')) || (a.amenity_type && a.amenity_type.includes('Grab')));
  }
  
  if (!journeyData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }
  
  return (
    <div className="p-4 max-w-4xl mx-auto bg-white dark:bg-slate-900 min-h-screen">
      <Button 
        variant="ghost" 
        className="mb-4 text-slate-900 dark:text-white" 
        onClick={handleBack}
      >
        <ArrowRight className="h-4 w-4 mr-2 rotate-180" />
        Back to Terminal Guide
      </Button>
      
      <h1 className="text-2xl font-bold mb-6 flex items-center text-slate-900 dark:text-white">
        <MapPin className="h-5 w-5 mr-2 text-primary-600" />
        Terminal Map - {journeyData.origin} {terminalName}
      </h1>
      
      <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-md mb-6">
        <div className="mb-2 text-slate-700 dark:text-slate-300">
          <p className="mb-2">
            ✈️ Flight: <strong>{journeyData.flight_number}</strong>
          </p>
          <p className="mb-2">
            🛫 Airport: <strong>{journeyData.origin}</strong>
          </p>
          {journeyData.transit && (
            <p className="mb-2">
              ✈️ Transit: <strong>{journeyData.transit}</strong>
            </p>
          )}
          <p className="mb-2">
            🛬 Destination: <strong>{journeyData.destination}</strong>
          </p>
          <p className="flex items-center gap-2 mb-2">
            🏢 Terminal: <strong>{terminalName}</strong> 
            <span className="text-xs text-slate-500 dark:text-slate-400">(guessed based on airline + airport)</span>
          </p>
        </div>
      </div>
      
      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-md mb-6">
        <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg">
          <Map className="h-16 w-16 text-slate-400 dark:text-slate-500 mb-4" />
          <p className="text-center text-slate-600 dark:text-slate-400">
            Terminal map for {journeyData.origin} {terminalName} is not available in this demo.
          </p>
          <p className="text-center text-sm text-slate-500 dark:text-slate-500 mt-2">
            In a full implementation, an interactive map would be displayed here.
          </p>
        </div>
      </div>
      
      <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-md mb-6">
        <h2 className="text-lg font-semibold mb-4 text-slate-900 dark:text-white">Terminal Facilities</h2>
        <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">Select amenities to create your personal journey plan</div>
        
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
        
        <ul className="space-y-3 text-slate-700 dark:text-slate-300">
          {filteredAmenities.map((amenity, index) => (
            <li key={index} className="border-b border-slate-100 dark:border-slate-700 pb-3">
              <div className="font-semibold flex items-center text-slate-900 dark:text-white">
                <span className="mr-2">
                  {amenity.amenity_type === "Lounge" ? "💺" : 
                   amenity.amenity_type === "Food & Dining" ? "🍽️" :
                   amenity.amenity_type === "Shopping" ? "🛍️" :
                   amenity.amenity_type === "Entertainment" ? "🎮" :
                   amenity.amenity_type === "Cafe" ? "☕" :
                   amenity.amenity_type === "Spa" ? "💆" :
                   amenity.amenity_type === "Business Services" ? "🔌" : "✨"}
                </span> {amenity.name}
              </div>
              <div className="text-sm text-slate-500 dark:text-slate-400 ml-6">{amenity.location_description}</div>
              <div className="text-xs ml-6 mb-2 text-slate-700 dark:text-slate-300">{amenity.amenity_type}</div>
              <button
                onClick={() => handleAddToJourney(amenity)}
                className="bg-green-600 text-white py-1 px-3 rounded hover:bg-green-700 transition text-sm ml-6"
              >
                ➕ Add to Journey
              </button>
            </li>
          ))}
          
          <li className="border-b border-slate-100 dark:border-slate-700 pb-3">
            <div className="font-semibold flex items-center text-slate-900 dark:text-white">
              <span className="mr-2">☕</span> Coffee Shop
            </div>
            <div className="text-sm text-slate-500 dark:text-slate-400 ml-6">Near Gate B12</div>
            <div className="text-xs ml-6 mb-2 text-slate-700 dark:text-slate-300">Cafe • {estimateWalkingTime("Near Gate B12")}</div>
            <button
              onClick={() => handleAddToJourney({
                name: "Coffee Shop",
                amenity_type: "Cafe",
                location_description: "Near Gate B12",
                category: "Food & Drink",
                vibe_tags: [],
                price_tier: "$$",
                opening_hours: {},
                slug: "coffee-shop"
              })}
              className="bg-green-600 text-white py-1 px-3 rounded hover:bg-green-700 transition text-sm ml-6"
            >
              ➕ Add to Journey
            </button>
          </li>
          
          <li className="pb-2">
            <div className="font-semibold flex items-center text-slate-900 dark:text-white">
              <span className="mr-2">🚿</span> Shower Facilities
            </div>
            <div className="text-sm text-slate-500 dark:text-slate-400 ml-6">Satellite Terminal, Gate E4</div>
            <div className="text-xs ml-6 mb-2 text-slate-700 dark:text-slate-300">Services • {estimateWalkingTime("Satellite Terminal, Gate E4")}</div>
            <button
              onClick={() => handleAddToJourney({
                name: "Shower Facilities",
                amenity_type: "Services",
                location_description: "Satellite Terminal, Gate E4",
                category: "Wellness",
                vibe_tags: [],
                price_tier: "$$",
                opening_hours: {},
                slug: "shower-facilities"
              })}
              className="bg-green-600 text-white py-1 px-3 rounded hover:bg-green-700 transition text-sm ml-6"
            >
              ➕ Add to Journey
            </button>
          </li>
        </ul>
        
        {selectedAmenities.length > 0 && !generatedPlan && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4 text-center text-slate-900 dark:text-white">Your Selected Stops</h2>
            <ul className="space-y-4">
              {selectedAmenities.map((item, index) => (
                <li key={index} className="border p-4 rounded flex items-center justify-between bg-white dark:bg-slate-700 shadow-sm">
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-white">{item.name}</div>
                    <div className="text-gray-500 dark:text-gray-300 text-sm">{item.amenity_type}</div>
                    <div className="text-gray-400 dark:text-gray-400 text-xs">{item.location_description} • {estimateWalkingTime(item.location_description)}</div>
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
              <Button
                onClick={generateJourneyPlan}
                className="bg-primary-600 text-white dark:text-white"
              >
                Generate Journey Plan
              </Button>
            </div>
          </div>
        )}
        
        {generatedPlan && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Your Journey Plan</h2>
              <span className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs py-1 px-2 rounded-full">
                <CheckCircle className="h-3 w-3 inline mr-1" /> Generated
              </span>
            </div>
            
            <div className="space-y-4">
              <ol className="relative border-l border-gray-200 dark:border-gray-700 ml-3">
                {generatedPlan.map((stop, index) => (
                  <li key={index} className="mb-6 ml-6">
                    <span className="absolute flex items-center justify-center w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full -left-3 ring-8 ring-white dark:ring-gray-900">
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
            </div>
            
            <div className="text-center mt-6 space-y-4">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Great plan! This journey will help you make the most of your time at the terminal.
              </p>
              
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Button
                  onClick={() => setGeneratedPlan(null)}
                  className="bg-slate-600 text-white dark:text-white py-2 px-4 rounded hover:bg-slate-700 transition"
                >
                  Edit Journey
                </Button>
                <Button
                  onClick={handleCompleteJourney}
                  className="bg-green-600 text-white dark:text-white py-2 px-4 rounded hover:bg-green-700 transition"
                >
                  Save Journey Plan
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="text-center text-xs text-slate-500 dark:text-slate-400 mt-8">
        This is a simplified demo of the terminal map feature. 
        In a full implementation, more features and real terminal maps would be available.
      </div>
    </div>
  );
}