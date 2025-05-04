import React, { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft, 
  ArrowRight, 
  BedDouble, 
  Coffee, 
  Moon, 
  ShoppingBag, 
  Droplets,  // Using Droplets instead of Shower which isn't available
  Utensils
} from "lucide-react";

type JourneyData = {
  origin: string;
  selected_vibe: string;
  flight_number: string;
  destination: string;
  transit?: string;
  transitDetected?: boolean;
  selfTransferDetected?: boolean;
};

type ComfortStop = {
  name: string;
  location: string;
  type: string;
  description: string;
  icon: React.ReactNode;
  walkingTime: string;
  stayDuration: string;
};

export default function ComfortJourney() {
  const [_, setLocation] = useLocation();
  const [journeyData, setJourneyData] = useState<JourneyData | null>(null);
  const [comfortStops, setComfortStops] = useState<ComfortStop[]>([]);
  const [terminalName, setTerminalName] = useState("T1");

  useEffect(() => {
    // Get journey data from session storage
    const storedData = sessionStorage.getItem("tempJourneyData");
    if (storedData) {
      const data = JSON.parse(storedData);
      setJourneyData(data);
      
      // Generate terminal name
      const terminal = data.origin === "SIN" ? "T3" : 
                    data.origin === "LHR" ? "T5" : "T1";
      setTerminalName(terminal);
      
      // Generate comfort-focused journey
      generateComfortJourney(data.origin, terminal);
    } else {
      // Redirect to input page if no data
      setLocation("/simplified-journey-input");
    }
  }, [setLocation]);

  const generateComfortJourney = (airport: string, terminal: string) => {
    // Base comfort stops with walking times relative to a typical terminal layout
    const baseStops: ComfortStop[] = [
      {
        name: "Arrival & Orientation", 
        location: `${terminal} Main Concourse`,
        type: "Starting Point",
        description: "Check flight status and plan your layover time",
        icon: <ArrowRight className="h-5 w-5" />, 
        walkingTime: "0 min",
        stayDuration: "5 min"
      },
      {
        name: "Premium Lounge", 
        location: `${terminal} Upper Level, Gate D Concourse`,
        type: "Relaxation",
        description: "Quiet space with comfortable seating and power outlets",
        icon: <Moon className="h-5 w-5" />, 
        walkingTime: "5 min",
        stayDuration: "60 min"
      },
      {
        name: "Refreshment Station", 
        location: `${terminal} Near Gate B12`,
        type: "Food & Drink",
        description: "Coffee, light snacks, and refreshments",
        icon: <Coffee className="h-5 w-5" />, 
        walkingTime: "7 min",
        stayDuration: "15 min"
      },
      {
        name: "Shower Facilities", 
        location: `${terminal} Level 3, Near Gate F`,
        type: "Wellness",
        description: "Freshening up between flights",
        icon: <Droplets className="h-5 w-5" />, 
        walkingTime: "8 min",
        stayDuration: "20 min"
      },
      {
        name: "Rest Zone", 
        location: `${terminal} Level 2, Quiet Area`,
        type: "Sleep",
        description: "Reclining chairs or sleeping pods for naps",
        icon: <BedDouble className="h-5 w-5" />, 
        walkingTime: "6 min",
        stayDuration: "45 min"
      },
      {
        name: "Duty-Free Shopping", 
        location: `${terminal} Central Area, Near Gates A-C`,
        type: "Shopping",
        description: "Quick essentials and souvenirs",
        icon: <ShoppingBag className="h-5 w-5" />, 
        walkingTime: "9 min",
        stayDuration: "15 min"
      },
      {
        name: "Dining Options", 
        location: `${terminal} Food Court, Level 2`,
        type: "Meal",
        description: "Variety of dining options for a proper meal",
        icon: <Utensils className="h-5 w-5" />, 
        walkingTime: "10 min",
        stayDuration: "30 min"
      }
    ];
    
    // Customize for specific airports if needed
    let customizedStops = [...baseStops];
    
    if (airport === "SIN") {
      // Singapore Changi airport is known for its excellent facilities
      customizedStops.push({
        name: "Butterfly Garden", 
        location: "T3 Level 2, Transit Area",
        type: "Relaxation",
        description: "Tropical butterfly habitat with soothing waterfall",
        icon: <Moon className="h-5 w-5" />, 
        walkingTime: "12 min",
        stayDuration: "20 min"
      });
    } else if (airport === "LHR") {
      // London Heathrow specific
      customizedStops.push({
        name: "Spa Services", 
        location: "T5 Level 1, Wellness Zone",
        type: "Wellness",
        description: "Quick massage and spa treatments",
        icon: <Moon className="h-5 w-5" />, 
        walkingTime: "8 min",
        stayDuration: "30 min"
      });
    }
    
    // Limit to 5 stops for a comfortable journey
    setComfortStops(customizedStops.slice(0, 5));
  };
  
  const handleViewJourney = () => {
    // Save plan to session storage for the journey page
    sessionStorage.setItem("journeyPlan", JSON.stringify(comfortStops));
    setLocation("/my-journey");
  };
  
  const handleSaveJourney = async () => {
    try {
      // Save journey directly to database
      const response = await fetch("/api/saveTerminalJourneyPlan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          airport: journeyData?.origin || "Unknown",
          terminal: terminalName || "T1",
          journeyPlan: comfortStops,
        }),
      });

      const result = await response.json();
      if (result.success) {
        alert("Journey saved successfully!");
      } else {
        alert(`Failed to save journey: ${result.error || "Unknown error"}`);
      }
    } catch (error: any) {
      console.error("Error saving journey:", error);
      alert(`Error saving journey: ${error.message || "Unknown error"}`);
    }
  };
  
  const handleBack = () => {
    setLocation("/simplified-journey-input");
  };
  
  if (!journeyData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-purple-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }
  
  return (
    <div className="p-4 max-w-4xl mx-auto">
      <Button 
        variant="ghost" 
        className="mb-4" 
        onClick={handleBack}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to journey input
      </Button>
      
      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-md mb-6">
        <h1 className="text-2xl font-bold mb-4 flex items-center bg-gradient-to-r from-purple-600 to-indigo-600 text-transparent bg-clip-text">
          Comfort Journey: {journeyData.origin} {terminalName}
        </h1>
        
        {journeyData.selfTransferDetected && (
          <div className="bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-700 rounded-lg p-3 mb-4 text-purple-800 dark:text-purple-200">
            <p className="flex items-center">
              <span className="mr-2 text-lg">✈️</span>
              <span>
                <strong>Self-Transfer Detected!</strong> We've created a comfort-focused journey to help you rest and recharge between flights.
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
          <p className="mb-2 flex items-center">
            🏢 Terminal: <strong className="ml-1">{terminalName}</strong>
          </p>
          <p className="mb-2">
            🌙 Focus: <strong>Comfort & Rest</strong>
          </p>
        </div>
      </div>
      
      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-md mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Your Comfort Journey</h2>
          <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">
            Rest & Recharge
          </span>
        </div>
        
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
          We've designed a journey focused on rest, refreshment, and comfort to help you make the most of your time in the terminal.
        </p>
        
        <div className="space-y-4 mb-6">
          {comfortStops.map((stop, index) => (
            <div key={index} className="border border-purple-100 dark:border-purple-800 rounded-lg p-4 flex items-start hover:shadow-md transition">
              <div className="bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300 p-2 rounded-full mr-3 flex items-center justify-center min-w-[2rem]">
                {index + 1}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">{stop.name}</h3>
                  <span className="text-xs bg-purple-50 dark:bg-purple-900/50 text-purple-600 dark:text-purple-300 px-2 py-1 rounded">
                    {stop.type}
                  </span>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  {stop.description}
                </p>
                <div className="flex justify-between mt-2 text-xs text-slate-500 dark:text-slate-500">
                  <span>📍 {stop.location}</span>
                  <span className="flex space-x-3">
                    <span>🚶 {stop.walkingTime}</span>
                    <span>⏱️ {stop.stayDuration}</span>
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="text-center mt-6 space-y-4">
          <div className="flex justify-center gap-4">
            <Button 
              onClick={handleViewJourney} 
              className="bg-gradient-to-r from-purple-600 to-indigo-600 py-3 px-8"
            >
              View Complete Journey
            </Button>
            
            <Button
              onClick={handleSaveJourney}
              className="bg-gradient-to-r from-green-600 to-emerald-600 py-3 px-8"
            >
              Save Journey
            </Button>
          </div>
        </div>
      </div>
      
      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-md">
        <h2 className="text-xl font-semibold mb-4">Comfort Tips</h2>
        <div className="space-y-3 text-slate-700 dark:text-slate-300">
          <p>🧳 Store your hand luggage at a locker service to move freely</p>
          <p>💧 Stay hydrated by carrying a refillable water bottle</p>
          <p>🔋 Charge your devices at power stations between activities</p>
          <p>👟 Wear comfortable shoes as you'll be walking between stops</p>
          <p>⏰ Set alarms on your phone to keep track of time before your next flight</p>
        </div>
      </div>
    </div>
  );
}