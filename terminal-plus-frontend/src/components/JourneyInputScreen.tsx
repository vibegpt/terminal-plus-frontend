import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn, vibeOptions } from "@/lib/utils";
import { Plane, ArrowRight, MoreHorizontal } from "lucide-react";
import SimpleToast from "@/components/ui/SimpleToast";
import { useSimpleToast } from "@/hooks/useSimpleToast";
import supabase from "@/lib/supabase";

interface JourneyInputScreenProps {
  onJourneySaved: () => void;
}

export function JourneyInputScreen({ onJourneySaved }: JourneyInputScreenProps) {
  const { toast, showToast, clearToast } = useSimpleToast();
  const [flightNumber, setFlightNumber] = useState('');
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [transit, setTransit] = useState('');
  const [departureTime, setDepartureTime] = useState('');
  const [selectedVibe, setSelectedVibe] = useState<'Relax' | 'Explore' | 'Work' | 'Quick'>('Relax');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    showToast("Saving your journey...", "loading");

    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !sessionData?.session) {
        showToast("Please log in before saving a journey.", "error");
        return;
      }

      const accessToken = sessionData.session.access_token;

      const journeyData = {
        flight_number: flightNumber,
        origin,
        destination,
        transit: transit || null,
        selected_vibe: selectedVibe,
        departure_time: departureTime,
      };

      const response = await fetch('/functions/v1/saveJourney', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(journeyData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server responded with ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log("Journey saved:", result);

      clearToast();
      showToast("Journey saved successfully!", "success");
      onJourneySaved();
    } catch (error: any) {
      console.error("Save journey error:", error);
      showToast(`Error: ${error.message || "Unexpected error"}`, "error");
    }
  };

  return (
    <div className="p-5 space-y-6 flex-1 overflow-y-auto hide-scrollbar bg-white dark:bg-slate-900 min-h-screen">
      {toast && <SimpleToast message={toast.message} type={toast.type} />}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Plan Your Journey ✈️</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Enter your flight details to get started</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <Label htmlFor="flightNumber">Flight Number</Label>
          <div className="relative">
            <Plane className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <Input
              id="flightNumber"
              placeholder="e.g., QF1"
              value={flightNumber}
              onChange={(e) => setFlightNumber(e.target.value)}
              className="pl-10 py-6 bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-slate-200 dark:border-slate-700"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label htmlFor="origin">Origin</Label>
            <Input
              id="origin"
              placeholder="e.g., SYD"
              value={origin}
              onChange={(e) => setOrigin(e.target.value.toUpperCase())}
              className="uppercase py-6 bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-slate-200 dark:border-slate-700"
              maxLength={3}
              required
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="destination">Destination</Label>
            <Input
              id="destination"
              placeholder="e.g., LHR"
              value={destination}
              onChange={(e) => setDestination(e.target.value.toUpperCase())}
              className="uppercase py-6 bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-slate-200 dark:border-slate-700"
              maxLength={3}
              required
            />
          </div>
        </div>

        <div className="space-y-1">
          <Label htmlFor="transit">Transit Airport (Optional)</Label>
          <div className="relative">
            <MoreHorizontal className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <Input
              id="transit"
              placeholder="e.g., SIN"
              value={transit}
              onChange={(e) => setTransit(e.target.value.toUpperCase())}
              className="pl-10 uppercase py-6 bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-slate-200 dark:border-slate-700"
              maxLength={3}
            />
          </div>
        </div>

        <div className="flex flex-col space-y-2">
          <label className="text-slate-600 dark:text-slate-300">Departure Date & Time</label>
          <input
            type="datetime-local"
            name="departure_time"
            value={departureTime}
            onChange={(e) => setDepartureTime(e.target.value)}
            className="border border-gray-300 dark:border-slate-700 rounded-lg p-2 bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
            required
          />
        </div>

        <div className="space-y-2">
          <Label className="text-slate-900 dark:text-white">Journey Vibe</Label>
          <div className="grid grid-cols-2 gap-3">
            {vibeOptions.map((vibe) => (
              <button
                key={vibe.value}
                type="button"
                className={cn(
                  "flex flex-col items-center justify-center p-4 border-2 rounded-lg transition-colors",
                  selectedVibe === vibe.value
                    ? "border-primary-200 bg-primary-50 dark:bg-slate-800 dark:border-primary-900"
                    : "border-slate-200 bg-white dark:bg-slate-800 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
                )}
                onClick={() => setSelectedVibe(vibe.value as 'Relax' | 'Explore' | 'Work' | 'Quick')}
              >
                <span className="text-xl mb-1">{vibe.emoji}</span>
                <span className="font-medium text-slate-900 dark:text-white">{vibe.label}</span>
              </button>
            ))}
          </div>
        </div>

        <Button
          type="submit"
          className="w-full py-6 mt-6 bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white font-semibold"
        >
          <Plane className="h-5 w-5 mr-2" />
          Save Journey
        </Button>
      </form>
    </div>
  );
}
