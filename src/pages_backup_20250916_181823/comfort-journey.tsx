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
  Droplets,
  Utensils
} from "lucide-react";
import { useJourneyContext } from "@/hooks/useJourneyContext";

// 🔍 Simple event tracker (replace with analytics SDK as needed)
const trackEvent = (event: string, payload: Record<string, any> = {}) => {
  console.log("Tracking event:", event, payload);
};

// --- Types

// Comfort stop type for journey planning
interface ComfortStop {
  id: string;
  name: string;
  category: string;
  location: string;
  description?: string;
  estimatedTime: number; // in minutes
  icon?: React.ReactNode;
}

// --- Component

export default function ComfortJourney() {
  const [_, setLocation] = useLocation();
  const { journeyData, setJourneyData } = useJourneyContext();
  const [comfortStops, setComfortStops] = useState<ComfortStop[]>([]);
  const [terminalName, setTerminalName] = useState("T1");

  // Generate comfort journey stops based on airport and terminal
  const generateComfortJourney = (origin: string, terminal: string) => {
    const stops: ComfortStop[] = [];
    
    // Add comfort stops based on airport and terminal
    if (origin === "SIN") {
      if (terminal === "T3") {
        stops.push(
          {
            id: "1",
            name: "Changi Airport Lounge",
            category: "Lounge",
            location: "T3, Level 3",
            description: "Premium lounge with comfortable seating and refreshments",
            estimatedTime: 45
          },
          {
            id: "2", 
            name: "Starbucks Coffee",
            category: "Food & Beverage",
            location: "T3, Level 2",
            description: "Fresh coffee and light snacks",
            estimatedTime: 20
          },
          {
            id: "3",
            name: "Butterfly Garden",
            category: "Relaxation",
            location: "T3, Level 2",
            description: "Peaceful garden with butterflies",
            estimatedTime: 30
          }
        );
      }
    } else if (origin === "LHR") {
      if (terminal === "T5") {
        stops.push(
          {
            id: "1",
            name: "Aspire Lounge",
            category: "Lounge", 
            location: "T5, Level 3",
            description: "Premium lounge with dining and relaxation areas",
            estimatedTime: 60
          },
          {
            id: "2",
            name: "Costa Coffee",
            category: "Food & Beverage",
            location: "T5, Level 2",
            description: "British coffee chain with pastries",
            estimatedTime: 25
          }
        );
      }
    } else {
      // Default stops for other airports
      stops.push(
        {
          id: "1",
          name: "Airport Lounge",
          category: "Lounge",
          location: `${terminal}, Level 3`,
          description: "Comfortable lounge with refreshments",
          estimatedTime: 45
        },
        {
          id: "2",
          name: "Coffee Shop",
          category: "Food & Beverage", 
          location: `${terminal}, Level 2`,
          description: "Coffee and light refreshments",
          estimatedTime: 20
        }
      );
    }
    
    setComfortStops(stops);
  };

  useEffect(() => {
    const storedData = sessionStorage.getItem("tempJourneyData");
    if (storedData) {
      const data = JSON.parse(storedData);
      setJourneyData(data);
      const terminal = data.from === "SIN" ? "T3" : data.from === "LHR" ? "T5" : "T1";
      setTerminalName(terminal);
      generateComfortJourney(data.from, terminal);
      trackEvent("view_comfort_journey", { origin: data.from, terminal });
    } else {
      setLocation("/simplified-journey-input");
    }
  }, [setLocation]);

  const handleViewJourney = () => {
    sessionStorage.setItem("journeyPlan", JSON.stringify(comfortStops));
    trackEvent("view_complete_journey_clicked", {
      stops: comfortStops.length,
      origin: journeyData?.from
    });
    setLocation("/my-journey");
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

  const handleSaveJourney = async () => {
    try {
      const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/saveJourney`;
      const payload = {
        flight_number: journeyData?.flightNumber || "Comfort",
        origin: journeyData?.from || "Unknown",
        destination: journeyData?.to || "Unknown",
        transit: journeyData?.layover || undefined,
        selected_vibe: journeyData?.selected_vibe || "Comfort",
        departure_time: new Date().toISOString(),
        anonymous_id: getAnonymousId(),
        comfort_stops: comfortStops, // Only if you want to store this and your DB supports it
      };
      console.log("Journey data being saved:", payload);
      const response = await fetch(functionUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (result.success) {
        alert("Journey saved successfully!");
        trackEvent("journey_saved", {
          origin: journeyData?.from,
          terminal: terminalName
        });
      } else {
        alert(`Failed to save journey: ${result.error || "Unknown error"}`);
      }
    } catch (error: any) {
      console.error("Error saving journey:", error);
      alert(`Error saving journey: ${error.message || "Unknown error"}`);
    }
  };

  const handleBack = () => {
    trackEvent("comfort_journey_back_clicked", {
      from: journeyData?.from
    });
    setLocation("/simplified-journey-input");
  };

  console.log("Loaded journey data:", sessionStorage.getItem("tempJourneyData"));

  sessionStorage.removeItem("tempJourneyData");

  if (!journeyData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white dark:bg-slate-900">
        <div className="animate-spin h-8 w-8 border-4 border-purple-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto bg-white dark:bg-slate-900 min-h-screen">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-8 mb-8">
        <h1 className="text-2xl font-bold mb-4 text-slate-900 dark:text-white">Comfort Journey</h1>
        <div className="mb-4 text-slate-700 dark:text-slate-300">
          <p className="mb-2">✈️ Flight: <strong>{journeyData.flightNumber}</strong></p>
          <p className="mb-2">🛫 From: <strong>{journeyData.from}</strong></p>
          <p className="mb-2">🛬 To: <strong>{journeyData.to}</strong></p>
          {journeyData.layover && <p className="mb-2">✈️ Transit: <strong>{journeyData.layover}</strong></p>}
          <p className="mb-2">🏢 Terminal: <strong>{terminalName}</strong></p>
          <p className="mb-2">✨ Vibe: <strong>{journeyData.selected_vibe}</strong></p>
        </div>
      </div>
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-8 mb-8">
        <h2 className="text-xl font-semibold mb-4 text-slate-900 dark:text-white">Your Comfort Stops</h2>
        <ul className="space-y-4">
          {comfortStops.map((stop, idx) => (
            <li key={idx} className="border rounded-lg p-4 flex flex-col bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700">
              <div className="font-semibold mb-1 text-slate-900 dark:text-white">{stop.name}</div>
              <div className="text-slate-600 dark:text-slate-400 text-sm">{stop.description}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{stop.location}</div>
            </li>
          ))}
        </ul>
      </div>
      <div className="flex justify-between">
        <Button variant="outline" className="border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white" onClick={handleBack}>Back</Button>
        <Button className="bg-primary-600 text-white dark:text-white" onClick={handleViewJourney}>View Journey Plan</Button>
      </div>
    </div>
  );
}
