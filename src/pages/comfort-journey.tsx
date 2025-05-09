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

// 🔍 Simple event tracker (replace with analytics SDK as needed)
const trackEvent = (event: string, payload: Record<string, any> = {}) => {
  console.log("Tracking event:", event, payload);
};

// --- Types

// Journey type
...

// --- Component

export default function ComfortJourney() {
  const [_, setLocation] = useLocation();
  const [journeyData, setJourneyData] = useState<JourneyData | null>(null);
  const [comfortStops, setComfortStops] = useState<ComfortStop[]>([]);
  const [terminalName, setTerminalName] = useState("T1");

  useEffect(() => {
    const storedData = sessionStorage.getItem("tempJourneyData");
    if (storedData) {
      const data = JSON.parse(storedData);
      setJourneyData(data);
      const terminal = data.origin === "SIN" ? "T3" : data.origin === "LHR" ? "T5" : "T1";
      setTerminalName(terminal);
      generateComfortJourney(data.origin, terminal);
      trackEvent("view_comfort_journey", { origin: data.origin, terminal });
    } else {
      setLocation("/simplified-journey-input");
    }
  }, [setLocation]);

  const handleViewJourney = () => {
    sessionStorage.setItem("journeyPlan", JSON.stringify(comfortStops));
    trackEvent("view_complete_journey_clicked", {
      stops: comfortStops.length,
      origin: journeyData?.origin
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
      const functionUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/saveJourney`;
      const payload = {
        flight_number: journeyData?.flight_number || "Comfort",
        origin: journeyData?.origin || "Unknown",
        destination: journeyData?.destination || "Unknown",
        transit: journeyData?.transit || undefined,
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
          origin: journeyData?.origin,
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
      from: journeyData?.origin
    });
    setLocation("/simplified-journey-input");
  };

  console.log("Loaded journey data:", sessionStorage.getItem("tempJourneyData"));

  sessionStorage.removeItem("tempJourneyData");

  if (!journeyData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-purple-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <Button variant="ghost" className="mb-4" onClick={handleBack}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to journey input
      </Button>

      {/* Rest of your JSX unchanged... */}
    </div>
  );
}
