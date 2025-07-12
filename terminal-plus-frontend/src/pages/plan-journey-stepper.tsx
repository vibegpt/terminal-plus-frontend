import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from 'framer-motion';
import SimpleToast from '@/components/ui/SimpleToast';
import { useSimpleToast } from '@/hooks/useSimpleToast';
import { useVibe } from '@/context/VibeContext';

const steps = [
  "Departure & Arrival",
  "Flight Details",
  "Vibe",
  "Review & Save"
];

const vibes = [
  { value: "Relax", label: "🛋️ Relax" },
  { value: "Refuel", label: "⛽ Refuel" },
  { value: "Comfort", label: "🛏️ Comfort" },
  { value: "Explore", label: "🛍️ Explore" },
  { value: "Quick", label: "⚡ Quick" },
  { value: "Work", label: "💼 Work" }
];

const GOFLIGHTLABS_API_KEY = "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiI0IiwianRpIjoiMWY2YTIzNmQ3ZjdjYTliNzY2ZDI5Yjc3N2IzNDZiMWU0NWEyNDdjZjY2MTllYzMwYzlmNjQ0MjM3MmM5NzBjMzVlZDQwNmFhYTE1ZmJhODEiLCJpYXQiOjE3NDQ3Mjk1NzksIm5iZiI6MTc0NDcyOTU3OSwiZXhwIjoxNzc2MjY1NTc5LCJzdWIiOiIyNDY5OSIsInNjb3BlcyI6W119.DAoiBcnUZEvdfh8_lLfGxgICoDCJr0YhiDAUBDqVgk4DlkPRuqzr3fcVfu_98OhUYmVSXJfzgKt0Pdnud7Q9uQ";

async function fetchTerminal(flightNumber: string, date: string) {
  try {
    const url = `https://app.goflightlabs.com/flights?flightIata=${encodeURIComponent(flightNumber)}&date=${encodeURIComponent(date)}&access_key=${GOFLIGHTLABS_API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();
    if (data && data.data && data.data.length > 0) {
      // Try to get terminal from departure info
      const terminal = data.data[0]?.departure?.terminal;
      return terminal || null;
    }
    return null;
  } catch (err) {
    console.error("Error fetching terminal from GoFlightLabs:", err);
    return null;
  }
}

const vibeGlow: Record<string, string> = {
  Relax: 'vibe-glow-relax',
  Explore: 'vibe-glow-explore',
  Comfort: 'vibe-glow-comfort',
  Work: 'vibe-glow-work',
  Quick: 'vibe-glow-quick'
};

// Add Gen Z vibe color palette and descriptions
const vibeColors = {
  Relax:    '#A8D0E6', // Cool Blue — trust, calm, downtime
  Explore:  '#F76C6C', // Coral — discovery, stimulation, curiosity
  Work:     '#D3B88C', // Warm Taupe — structure, focus, grounding
  Quick:    '#FFDD57', // Electric Yellow — urgency, motion, alert
  Refuel:   '#FF7F50', // Punchy Red-Orange — appetite, recharge
  Comfort:  '#CBAACB', // Lavender — safety, gentleness, rest
};
const vibeDescriptions = {
  Relax:    'Quiet lounges, chill cafes, and peaceful corners to decompress.',
  Explore:  'Wander, shop, and discover cool stuff you didn\'t expect.',
  Work:     'Find focused spots to plug in, tune out, and get things done.',
  Quick:    'Grab what you need, fast — snacks, essentials, no time wasted.',
  Refuel:   'Recharge with food, drinks, or a strong coffee fix.',
  Comfort:  'Stretch, nap, or just slow down — we\'ll find your cozy zone.',
};

export default function PlanJourneyStepper() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [journeyData, setJourneyData] = useState({
    departure: "",
    destination: "",
    flightNumber: "",
    flightDate: "",
    layovers: [] as string[],
    selected_vibe: "",
    terminal: ""
  });
  const { toast, showToast, clearToast } = useSimpleToast();
  const { setVibe } = useVibe();

  // Refs for auto-focus
  const departureRef = useRef<HTMLInputElement>(null);
  const destinationRef = useRef<HTMLInputElement>(null);
  const flightNumberRef = useRef<HTMLInputElement>(null);
  const flightDateRef = useRef<HTMLInputElement>(null);
  const layoversRef = useRef<HTMLInputElement>(null);

  // Dark mode detection (available everywhere in the component)
  const isDarkMode = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

  useEffect(() => {
    // Auto-focus logic for each step
    if (currentStep === 0 && departureRef.current) departureRef.current.focus();
    if (currentStep === 1 && flightNumberRef.current) flightNumberRef.current.focus();
    if (currentStep === 2 && destinationRef.current) destinationRef.current.focus();
    if (currentStep === 3 && flightDateRef.current) flightDateRef.current.focus();
    if (currentStep === 4 && layoversRef.current) layoversRef.current.focus();
  }, [currentStep]);

  // Clear previous journey data when starting a new journey
  useEffect(() => {
    sessionStorage.removeItem("tempJourneyData");
  }, []);

  const handleNext = async () => {
    if (currentStep === steps.length - 1) {
      if (!journeyData.selected_vibe) {
        alert("Please select a vibe before continuing.");
        return;
      }
      // Debug: log journeyData before saving
      console.log('Saving journeyData:', journeyData);
      let terminal = journeyData.terminal;
      // If terminal is not set, try to fetch it
      if (!terminal && journeyData.flightNumber && journeyData.flightDate) {
        terminal = await fetchTerminal(journeyData.flightNumber, journeyData.flightDate);
      }
      // Fallback: SYD always T1
      if (!terminal && journeyData.departure === "SYD") {
        terminal = "T1";
      }
      // If still not found, prompt for manual selection (not implemented here, could add a step)
      const journeyDataWithTerminal = { ...journeyData, terminal: terminal || "" };
      const dataString = JSON.stringify(journeyDataWithTerminal);
      sessionStorage.setItem("tempJourneyData", dataString);
      localStorage.setItem("lastJourneyData", dataString);
      // Show toast before redirecting
      showToast("Journey saved!", "success");
      setTimeout(() => {
        clearToast();
        navigate("/guide-view");
      }, 3000);
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep === 0) {
      navigate(-1);
    } else {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleHome = () => {
    navigate("/");
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-4">
            <div className="flex flex-row gap-4">
              <div className="flex-1">
                <h3 className="text-sm font-semibold mb-1 text-slate-700 dark:text-slate-300 text-center">Departure</h3>
                <Input
                  ref={departureRef}
                  type="text"
                  placeholder="e.g., SYD"
                  value={journeyData.departure}
                  onChange={(e) => setJourneyData({ ...journeyData, departure: e.target.value.toUpperCase() })}
                  onKeyDown={(e) => { if (e.key === 'Enter' && canProceed()) handleNext(); }}
                  className="w-full"
                />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold mb-1 text-slate-700 dark:text-slate-300 text-center">Arrival</h3>
                <Input
                  ref={destinationRef}
                  type="text"
                  placeholder="e.g., LHR"
                  value={journeyData.destination}
                  onChange={(e) => setJourneyData({ ...journeyData, destination: e.target.value.toUpperCase() })}
                  onKeyDown={(e) => { if (e.key === 'Enter' && canProceed()) handleNext(); }}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        );
      case 1:
        return (
          <div className="space-y-4">
            <div className="flex flex-row gap-4">
              <div className="flex-1">
                <h3 className="text-sm font-semibold mb-1 text-slate-700 dark:text-slate-300 text-center">Flight Number</h3>
                <Input
                  ref={flightNumberRef}
                  type="text"
                  placeholder="e.g., QF1"
                  value={journeyData.flightNumber}
                  onChange={(e) => setJourneyData({ ...journeyData, flightNumber: e.target.value.toUpperCase() })}
                  className="w-full"
                />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold mb-1 text-slate-700 dark:text-slate-300 text-center">Layover Airport</h3>
                <Input
                  type="text"
                  placeholder="e.g., SIN"
                  value={journeyData.layovers[0] || ""}
                  onChange={(e) => setJourneyData({
                    ...journeyData,
                    layovers: [e.target.value.toUpperCase(), ...(journeyData.layovers.slice(1))]
                  })}
                  className="w-full"
                />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold mb-1 text-slate-700 dark:text-slate-300 text-center">Flight Date</h3>
                <Input
                  ref={flightDateRef}
                  type="date"
                  value={journeyData.flightDate}
                  onChange={(e) => setJourneyData({ ...journeyData, flightDate: e.target.value })}
                  className="w-full"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <div className="mb-8 text-center">
              <h2 className="text-xl font-semibold mb-2">💫 What's your vibe?</h2>
              <p className="text-base text-slate-700 dark:text-slate-300">
                We don't just ask where you're going.<br/>
                We ask how you're doing - and shape your experience around it.
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {vibes.map((vibe) => {
                const isSelected = journeyData.selected_vibe === vibe.value;
                return (
                  <button
                    key={vibe.value}
                    type="button"
                    onClick={() => {
                      setJourneyData(prev => ({ ...prev, selected_vibe: vibe.value }));
                      setVibe(vibe.value as import('@/context/VibeContext').VibeType);
                    }}
                    className={`p-4 rounded-lg border-2 transition-all w-full flex flex-col items-center justify-center gap-1 relative
                      ${isSelected ? 'z-10' : ''}
                      ${isSelected ? '' : 'hover:scale-[1.03]'}
                    `}
                    style={isSelected ? {
                      boxShadow: `0 0 0 6px ${vibeColors[vibe.value as keyof typeof vibeColors]}44, 0 4px 24px 0 ${vibeColors[vibe.value as keyof typeof vibeColors]}33`,
                      borderColor: vibeColors[vibe.value as keyof typeof vibeColors],
                      background: `${vibeColors[vibe.value as keyof typeof vibeColors]}22`,
                      transform: 'scale(1.05)',
                    } : {
                      borderColor: 'rgba(120,120,120,0.12)',
                      background: 'transparent',
                    }}
                  >
                    <span className="text-3xl block w-full text-center">{vibe.label.split(' ')[0]}</span>
                    <span className="text-base font-semibold block w-full text-center">{vibe.label.split(' ').slice(1).join(' ')}</span>
                  </button>
                );
              })}
            </div>
            {/* Vibe description with fade/slide-up animation and improved contrast */}
            <div className="mt-4 min-h-[32px] flex justify-center">
              {journeyData.selected_vibe && (
                <motion.div
                  key={journeyData.selected_vibe}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                  className="px-4 py-2 rounded-full shadow-md font-semibold text-base md:text-lg border-2"
                  style={{
                    background:
                      'var(--vibe-desc-bg, rgba(0,0,0,0.06))', // fallback for light mode
                    color: 'var(--vibe-desc-color, #222)', // fallback for light mode
                    borderColor: vibeColors[journeyData.selected_vibe as keyof typeof vibeColors],
                    boxShadow: `0 0 0 4px ${vibeColors[journeyData.selected_vibe as keyof typeof vibeColors]}55, 0 2px 12px 0 rgba(0,0,0,0.08)`,
                    ...(typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
                      ? {
                          background: 'rgba(255,255,255,0.10)',
                          color: '#fff',
                        }
                      : {}),
                  }}
                >
                  {vibeDescriptions[journeyData.selected_vibe as keyof typeof vibeDescriptions]}
                </motion.div>
              )}
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <div className="flex flex-col items-center gap-2">
              <h2 className={`text-xl font-semibold mb-0 text-center ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Review & Save</h2>
              <p className={`text-base text-center ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>You're almost ready. Check everything's right.</p>
            </div>
            <div className="flex flex-col items-center">
              {journeyData.selected_vibe && (
                <button
                  type="button"
                  className={`p-2 rounded-lg border-2 transition-all w-32 flex flex-col items-center justify-center gap-1 z-10 text-base font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}
                  style={{
                    boxShadow: isDarkMode
                      ? `0 0 0 6px ${vibeColors[journeyData.selected_vibe as keyof typeof vibeColors]}AA, 0 2px 12px 0 ${vibeColors[journeyData.selected_vibe as keyof typeof vibeColors]}55`
                      : `0 0 0 4px ${vibeColors[journeyData.selected_vibe as keyof typeof vibeColors]}55, 0 2px 8px 0 ${vibeColors[journeyData.selected_vibe as keyof typeof vibeColors]}22`,
                    borderColor: vibeColors[journeyData.selected_vibe as keyof typeof vibeColors],
                    background: isDarkMode
                      ? `${vibeColors[journeyData.selected_vibe as keyof typeof vibeColors]}33`
                      : `${vibeColors[journeyData.selected_vibe as keyof typeof vibeColors]}22`,
                    transform: 'scale(1.0)',
                  }}
                  disabled
                >
                  <span className="text-2xl block w-full text-center">{vibes.find(v => v.value === journeyData.selected_vibe)?.label.split(' ')[0]}</span>
                  <span className="text-base font-semibold block w-full text-center">{vibes.find(v => v.value === journeyData.selected_vibe)?.label.split(' ').slice(1).join(' ')}</span>
                </button>
              )}
            </div>
            <div className={`p-4 rounded-lg space-y-2 mt-2 border shadow-md ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
              <p className={`font-bold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}><span className="font-normal">From:</span> {journeyData.departure}</p>
              <p className={`font-bold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}><span className="font-normal">To:</span> {journeyData.destination}</p>
              <p className={`font-bold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}><span className="font-normal">Flight:</span> {journeyData.flightNumber}</p>
              <p className={`font-bold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}><span className="font-normal">Date:</span> {new Date(journeyData.flightDate).toLocaleDateString()}</p>
              {journeyData.layovers.length > 0 && (
                <p className={`font-bold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}><span className="font-normal">Layovers:</span> {journeyData.layovers.join(" → ")}</p>
              )}
              <p className={`font-bold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}><span className="font-normal">Vibe:</span> {journeyData.selected_vibe}</p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        // Both codes must be 3 uppercase letters, no spaces
        return /^[A-Z]{3}$/.test(journeyData.departure) && /^[A-Z]{3}$/.test(journeyData.destination);
      case 1:
        // Flight number and flight date must be filled
        return journeyData.flightNumber.length > 0 && journeyData.flightDate.length > 0;
      case 2:
        // Vibe must be selected
        return !!journeyData.selected_vibe;
      case 3:
        return true; // Review step
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-slate-900 p-6">
      <div className="max-w-2xl w-full bg-white dark:bg-slate-800 rounded-lg shadow-lg p-8">
        <div className="flex justify-between items-center mb-4 gap-2">
          <Button
            variant="ghost"
            onClick={handleBack}
            className={isDarkMode ? 'text-slate-100 hover:text-white' : 'text-slate-700 hover:text-slate-900'}
          >
            ← Back
          </Button>
          <Button variant="ghost" onClick={handleHome}>
            🏠 Home
          </Button>
          <span className="text-sm text-slate-500">
            Step {currentStep + 1} of {steps.length}
          </span>
        </div>
        <div className="mb-8">
          <div className="h-2 bg-slate-200 rounded-full">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>
        {/* New header and supporting text, but custom for step 2 (Vibe) */}
        {currentStep === 3 ? (
          <></>
        ) : currentStep === 0 ? (
          <div className="mb-8 text-center">
            <h2 className="text-xl font-semibold mb-2">✈️ Airport time is weird.</h2>
            <p className="text-base text-slate-700 dark:text-slate-300">One minute you're rushing. The next you're just..... waiting.</p>
            <p className="text-base text-slate-700 dark:text-slate-300 mt-1">Let's fix that - where are you flying?</p>
          </div>
        ) : currentStep === 1 ? (
          <div className="mb-8 text-center">
            <h2 className="text-xl font-semibold mb-2">🧠 Want smarter suggestions?</h2>
            <p className="text-base text-slate-700 dark:text-slate-300 mt-1">Adding a few optional details helps us recommend places that are relevant, open, and worth your time.</p>
          </div>
        ) : null}
        <div className="mb-8">
          {renderStep()}
        </div>
        <div className="flex flex-row justify-between items-center gap-2">
          {currentStep === 3 ? (
            <Button
              variant="ghost"
              onClick={() => setCurrentStep(2)}
              className={`border ${isDarkMode ? 'border-slate-600 text-slate-100 hover:bg-slate-800' : 'border-slate-200 text-slate-700 hover:bg-slate-100'}`}
            >
              ✏️ Edit
            </Button>
          ) : <div />}
          <Button
            onClick={handleNext}
            className={`px-8 transition-all duration-200 ${canProceed() ? 'animate-bounceOnce shadow-[0_0_8px_2px_rgba(80,200,120,0.15)]' : 'opacity-60 cursor-not-allowed'}`}
            disabled={!canProceed()}
            style={currentStep === 2 && journeyData.selected_vibe ? { boxShadow: `0 0 0 4px ${vibeColors[journeyData.selected_vibe as keyof typeof vibeColors]}55` } : {}}
          >
            {currentStep === 3 ? "Next" : currentStep === steps.length - 1 ? "Save & Continue" : "Next"}
          </Button>
        </div>
      </div>
      {/* Toast notification for journey save */}
      {toast && (
        <SimpleToast
          message={toast.message}
          type={toast.type}
          subtitle={currentStep === steps.length - 1 ? "We're building your plan now..." : undefined}
          onClose={clearToast}
        />
      )}
    </div>
  );
} 