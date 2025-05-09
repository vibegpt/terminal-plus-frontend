import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const steps = [
  "Departure Airport",
  "Destination Airport",
  "Flight Number (Optional)",
  "Layovers (Optional)",
  "Mood/Vibe",
  "Review & Save"
];

const vibes = [
  { value: "Relax", label: "🛋️ Relax" },
  { value: "Explore", label: "🛍️ Explore" },
  { value: "Work", label: "💼 Work" },
  { value: "Quick", label: "⚡ Quick" }
];

export default function PlanJourneyStepper() {
  const [step, setStep] = useState(0);
  const [_, setLocation] = useLocation();
  const [journey, setJourney] = useState({
    origin: "",
    destination: "",
    flight_number: "",
    layovers: [] as string[],
    vibe: "",
  });
  const [layoverInput, setLayoverInput] = useState("");

  // Autosave after each change
  useEffect(() => {
    sessionStorage.setItem("tempJourneyData", JSON.stringify(journey));
  }, [journey]);

  // Step content renderers
  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <div className="space-y-4">
            <Input
              value={journey.origin}
              onChange={e => setJourney({ ...journey, origin: e.target.value.toUpperCase() })}
              placeholder="Enter Departure Airport (e.g. SYD)"
              className="uppercase"
              maxLength={3}
            />
            <Button onClick={() => setStep(step + 1)} disabled={!journey.origin}>
              Next
            </Button>
          </div>
        );
      case 1:
        return (
          <div className="space-y-4">
            <Input
              value={journey.destination}
              onChange={e => setJourney({ ...journey, destination: e.target.value.toUpperCase() })}
              placeholder="Enter Destination Airport (e.g. LHR)"
              className="uppercase"
              maxLength={3}
            />
            <div className="flex gap-2">
              <Button onClick={() => setStep(step - 1)} variant="outline">Back</Button>
              <Button onClick={() => setStep(step + 1)} disabled={!journey.destination}>Next</Button>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <Input
              value={journey.flight_number}
              onChange={e => setJourney({ ...journey, flight_number: e.target.value.toUpperCase() })}
              placeholder="Enter Flight Number (Optional)"
            />
            <div className="flex gap-2">
              <Button onClick={() => setStep(step - 1)} variant="outline">Back</Button>
              <Button onClick={() => setStep(step + 1)}>Next</Button>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={layoverInput}
                onChange={e => setLayoverInput(e.target.value.toUpperCase())}
                placeholder="Add Layover Airport (e.g. SIN)"
                className="uppercase"
                maxLength={3}
              />
              <Button
                onClick={() => {
                  if (layoverInput && !journey.layovers.includes(layoverInput)) {
                    setJourney({ ...journey, layovers: [...journey.layovers, layoverInput] });
                    setLayoverInput("");
                  }
                }}
                disabled={!layoverInput}
              >
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {journey.layovers.map((lay, idx) => (
                <span key={idx} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full flex items-center">
                  {lay}
                  <button
                    className="ml-2 text-red-500"
                    onClick={() => setJourney({ ...journey, layovers: journey.layovers.filter(l => l !== lay) })}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setStep(step - 1)} variant="outline">Back</Button>
              <Button onClick={() => setStep(step + 1)}>Next</Button>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {vibes.map(v => (
                <Button
                  key={v.value}
                  variant={journey.vibe === v.value ? "default" : "outline"}
                  onClick={() => setJourney({ ...journey, vibe: v.value })}
                  className="h-16 text-lg"
                >
                  {v.label}
                </Button>
              ))}
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setStep(step - 1)} variant="outline">Back</Button>
              <Button onClick={() => setStep(step + 1)} disabled={!journey.vibe}>Next</Button>
            </div>
          </div>
        );
      case 5:
        return (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-md">
              <h3 className="text-xl font-bold mb-4">Review Your Journey</h3>
              <ul className="space-y-2">
                <li><strong>From:</strong> {journey.origin}</li>
                <li><strong>To:</strong> {journey.destination}</li>
                <li><strong>Flight:</strong> {journey.flight_number || <span className="text-slate-400">(not provided)</span>}</li>
                <li><strong>Layovers:</strong> {journey.layovers.length > 0 ? journey.layovers.join(", ") : <span className="text-slate-400">(none)</span>}</li>
                <li><strong>Vibe:</strong> {journey.vibe}</li>
              </ul>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setStep(step - 1)} variant="outline">Back</Button>
              <Button
                onClick={() => {
                  // Save journey locally (could also send to Supabase here)
                  const journeyToSave = {
                    ...journey,
                    saved_at: new Date().toISOString(),
                    anonymous_id: getAnonymousId(),
                  };
                  let journeys = JSON.parse(localStorage.getItem("savedJourneys") || "[]");
                  journeys.push(journeyToSave);
                  localStorage.setItem("savedJourneys", JSON.stringify(journeys));
                  sessionStorage.setItem("tempJourneyData", JSON.stringify(journeyToSave));
                  setLocation("/guide-view");
                }}
                className="bg-gradient-to-r from-primary-600 to-secondary-600 text-white"
              >
                Save & Show Guide
              </Button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  // Progress bar
  const progress = ((step + 1) / steps.length) * 100;

  // Anonymous ID helper
  function getAnonymousId() {
    let anonId = localStorage.getItem('anonymous_id');
    if (!anonId) {
      anonId = crypto.randomUUID();
      localStorage.setItem('anonymous_id', anonId);
    }
    return anonId;
  }

  return (
    <div className="max-w-xl mx-auto p-6">
      <div className="mb-6">
        <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
          <div
            className="bg-gradient-to-r from-primary-600 to-secondary-600 h-2.5 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <div className="text-center mt-2 text-sm text-slate-500">
          Step {step + 1} of {steps.length}: <span className="font-medium">{steps[step]}</span>
        </div>
      </div>
      {renderStep()}
    </div>
  );
} 