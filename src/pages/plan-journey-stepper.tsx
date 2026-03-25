import React, { useState, useEffect, useRef, ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from "react";
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from "react-router-dom";
import TransitTimeline from '@/components/TransitTimeline';
import { TimelineBlock } from '@/components/TransitTimeline';
import { generateTransitPlan } from '@/utils/generateTransitPlan_withAmenities_T1';
import { fetchFlightInfo } from '@/services/flightData';
import { getFlightDuration } from '@/utils/getFlightDuration';

const steps = [
  "Flight Info",
  "Vibe Check",
  "Let's Go!"
];

const vibes = [
  { value: "Relax", label: "🛋️ Chill", desc: "Quiet lounges, chill cafes, peaceful corners to decompress" },
  { value: "Refuel", label: "⛽ Refuel", desc: "Recharge with food, drinks, or a strong coffee fix" },
  { value: "Comfort", label: "🛏️ Comfort", desc: "Stretch, nap, or just slow down — cozy zone vibes" },
  { value: "Explore", label: "🛍️ Explore", desc: "Wander, shop, discover cool stuff you didn't expect" },
  { value: "Quick", label: "⚡ Quick", desc: "Grab what you need, fast — no time wasted" },
  { value: "Work", label: "💼 Grind", desc: "Find focused spots to plug in, tune out, get things done" }
];

const vibeColors = {
  Relax: '#A8D0E6',
  Explore: '#F76C6C', 
  Work: '#D3B88C',
  Quick: '#FFDD57',
  Refuel: '#FF7F50',
  Comfort: '#CBAACB',
};

// Mock Button and Input components for demonstration
type ButtonProps = {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: string;
  className?: string;
  style?: React.CSSProperties;
};

const Button: React.FC<ButtonProps> = ({ children, onClick, disabled, variant, className, style }) => (
  <button 
    onClick={onClick} 
    disabled={disabled} 
    className={`px-4 py-2 rounded-lg font-medium transition-all ${variant === 'ghost' ? 'bg-transparent hover:bg-gray-100' : 'bg-blue-600 text-white hover:bg-blue-700'} ${className}`}
    style={style}
  >
    {children}
  </button>
);

type InputProps = {
  type: string;
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
  maxLength?: number;
  min?: string;
  style?: React.CSSProperties;
};

const Input: React.FC<InputProps> = ({ type, placeholder, value, onChange, className, maxLength, min, style }) => (
  <input
    type={type}
    placeholder={placeholder}
    value={value}
    onChange={onChange}
    maxLength={maxLength}
    min={min}
    className={`border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
    style={style}
  />
);

// Add SIN transit vibe rules
const SIN_TRANSIT_RULES = {
  under_60_minutes: {
    vibe_focus: ["Quick", "Refuel"],
    description: "Focus on essentials like water refill, snacks, and finding your gate."
  },
  sixty_to_120_minutes: {
    vibe_focus: ["Quick", "Refuel", "Chill"],
    description: "Enough time to grab food, relax briefly, and visit an iconic spot like ST3PS or a garden."
  },
  one20_to_240_minutes: {
    vibe_focus: ["Quick", "Refuel", "Chill", "Explore"],
    description: "You can build a full vibe-based mini-journey — explore the terminal, chill, or catch a film."
  },
  over_240_minutes: {
    vibe_focus: ["Quick", "Refuel", "Chill", "Explore", "Comfort"],
    description: "Extended layover: You have time to rest, nap, or use on-site accommodation like Aerotel."
  }
};

function getSinVibeRule(layoverMinutes: number) {
  if (layoverMinutes < 60) return SIN_TRANSIT_RULES.under_60_minutes;
  if (layoverMinutes < 120) return SIN_TRANSIT_RULES.sixty_to_120_minutes;
  if (layoverMinutes < 240) return SIN_TRANSIT_RULES.one20_to_240_minutes;
  return SIN_TRANSIT_RULES.over_240_minutes;
}

export default function OptimizedJourneyStepper() {
  const [currentStep, setCurrentStep] = useState(0);
  const [journeyData, setJourneyData] = useState<{
    departure: string;
    destination: string;
    flightNumber: string;
    flightDate: string;
    layover: string;
    selected_vibe: string;
    terminal: string;
    layoverDuration: string;
    departureTime: string;
    transitPlan: {
      SIN: {
        layover_minutes: number;
        plan: TimelineBlock[];
      }
    }
  }>({
    departure: "",
    destination: "",
    flightNumber: "",
    flightDate: "",
    layover: "",
    selected_vibe: "",
    terminal: "",
    layoverDuration: "",
    departureTime: "",
    transitPlan: {
      SIN: {
        layover_minutes: 0,
        plan: []
      }
    }
  });
  
  const [showSuccess, setShowSuccess] = useState(false);
  const isDarkMode = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const navigate = useNavigate();

  const handleNext = async () => {
    // Add SIN transit plan for SYD-LHR using dynamic layover calculation
    if (
      journeyData.departure === "SYD" &&
      journeyData.destination === "LHR"
    ) {
      let layoverMinutes: number | null = null;
      try {
        if (journeyData.flightNumber && journeyData.flightDate) {
          // Fetch flight info from AviationStack
          const flightData = await fetchFlightInfo({
            flightNumber: journeyData.flightNumber,
            dep: journeyData.departure,
            arr: "SIN",
            date: journeyData.flightDate
          });
          // Find the matching flight (if multiple returned)
          const flight = flightData.data?.find((f: any) =>
            f.flight.iata === journeyData.flightNumber &&
            f.departure.iata === journeyData.departure &&
            f.arrival.iata === "SIN"
          );
          if (flight) {
            // Use scheduled or actual times
            const arrivalTime = new Date(flight.arrival.actual || flight.arrival.scheduled);
            const departureTime = new Date(flight.departure.actual || flight.departure.scheduled);
            // Next leg: SIN to LHR
            const nextLeg = flightData.data?.find((f: any) =>
              f.departure.iata === "SIN" &&
              f.arrival.iata === "LHR"
            );
            if (nextLeg) {
              const nextDeparture = new Date(nextLeg.departure.actual || nextLeg.departure.scheduled);
              layoverMinutes = Math.round((nextDeparture.getTime() - arrivalTime.getTime()) / 60000);
            }
          }
        }
      } catch (e) {
        console.warn('Flight API failed, falling back to static logic', e);
      }
      if (!layoverMinutes) {
        // Fallback: use static logic
        const SYD_departure_utc = new Date(`${journeyData.flightDate}T21:00:00Z`); // 9pm SYD time
        const SIN_arrival_utc = new Date(SYD_departure_utc.getTime() + 8.5 * 60 * 60000); // QF1 example: 8.5 hrs to SIN
        const SIN_departure_utc = new Date(SIN_arrival_utc.getTime() + 2.5 * 60 * 60000); // 2.5hr layover
        layoverMinutes = Math.round((SIN_departure_utc.getTime() - SIN_arrival_utc.getTime()) / 60000);
      }
      const timeline = generateTransitPlan('SIN', layoverMinutes);
      journeyData.transitPlan = {
        SIN: {
          layover_minutes: layoverMinutes,
          plan: timeline
        }
      };
    }
    if (currentStep === steps.length - 1) {
      // Save journey data and navigate to guide-view
      const dataString = JSON.stringify(journeyData);
      sessionStorage.setItem("tempJourneyData", dataString);
      localStorage.setItem("lastJourneyData", dataString);
      setShowSuccess(true);
      setTimeout(() => {
        navigate("/guide-view");
      }, 1500);
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep === 0) {
      console.log("Navigate back");
    } else {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return /^[A-Z]{3}$/.test(journeyData.departure) && /^[A-Z]{3}$/.test(journeyData.destination);
      case 1:
        return !!journeyData.selected_vibe;
      case 2:
        return true;
      default:
        return false;
    }
  };

  // Helper for layover minutes
  function getLayoverMinutes() {
    if (!journeyData.layover) return null;
    const match = journeyData.layover.match(/(\d+):(\d+)/);
    if (match) {
      const hours = parseInt(match[1], 10);
      const mins = parseInt(match[2], 10);
      return hours * 60 + mins;
    }
    const mins = parseInt(journeyData.layover, 10);
    return isNaN(mins) ? null : mins;
  }

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-3 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                ✈️ Airport time hits different
              </h2>
              <p className="text-slate-600 dark:text-slate-300 text-lg">
                One minute you're rushing, next you're just... waiting.<br/>
                <span className="font-semibold">Let's fix that.</span>
              </p>
            </div>

            {/* Airports in a more visual layout */}
            <div className="grid grid-cols-2 gap-4">
              <div className="relative">
                <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">
                  ✈️ Flying from
                </label>
                <Input
                  type="text"
                  placeholder="SYD"
                  value={journeyData.departure}
                  onChange={(e) => setJourneyData({ ...journeyData, departure: e.target.value.toUpperCase() })}
                  className="text-center text-xl font-bold tracking-wider h-14 text-blue-600 dark:text-blue-400"
                  maxLength={3}
                />
              </div>
              <div className="relative">
                <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">
                  🛬 Flying to
                </label>
                <Input
                  type="text"
                  placeholder="LHR"
                  value={journeyData.destination}
                  onChange={(e) => setJourneyData({ ...journeyData, destination: e.target.value.toUpperCase() })}
                  className="text-center text-xl font-bold tracking-wider h-14 text-purple-600 dark:text-purple-400"
                  maxLength={3}
                />
              </div>
            </div>

            {/* Optional details in an expandable section */}
            <details className="group">
            <summary className="cursor-pointer text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2 justify-center">
     <span>Level up with flight + layover details</span>
     <span className="ml-1 text-lg">↓</span>
   </summary>
              <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium mb-1 text-slate-600 dark:text-slate-400">Flight</label>
                    <Input
                      type="text"
                      placeholder="QF1"
                      value={journeyData.flightNumber}
                      onChange={(e) => setJourneyData({ ...journeyData, flightNumber: e.target.value.toUpperCase() })}
                      className="h-10"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1 text-slate-600 dark:text-slate-400">Date</label>
                    <Input
                      type="date"
                      value={journeyData.flightDate}
                      onChange={(e) => setJourneyData({ ...journeyData, flightDate: e.target.value })}
                      className="h-10"
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1 text-slate-600 dark:text-slate-400">Layover</label>
                    <Input
                      type="text"
                      placeholder="SIN"
                      value={journeyData.layover}
                      onChange={(e) => setJourneyData({ ...journeyData, layover: e.target.value.toUpperCase() })}
                      className="h-10"
                      maxLength={3}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1 text-slate-600 dark:text-slate-400">Departure Time (SYD local)</label>
                  <Input
                    type="time"
                    value={journeyData.departureTime}
                    onChange={(e) => setJourneyData({ ...journeyData, departureTime: e.target.value })}
                    className="h-10"
                  />
                </div>
              </div>
            </details>
          </motion.div>
        );

      case 1:
        // Determine if SIN transit rules apply
        const isSinTransit =
          journeyData.departure === "SIN" || journeyData.destination === "SIN";
        const layoverMinutes = getLayoverMinutes();
        let sinVibeRule = null;
        if (isSinTransit && layoverMinutes !== null) {
          sinVibeRule = getSinVibeRule(layoverMinutes);
        }
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-3 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                ✨ Pick your vibe
              </h2>
              <p className="text-slate-600 dark:text-slate-300 text-lg">
                What do you want from your time in the terminal?
              </p>
              {sinVibeRule && (
                <div className="mt-4 p-3 rounded-lg bg-yellow-50 border border-yellow-300 text-yellow-900 text-sm">
                  <strong>SIN Transit Tip:</strong> {sinVibeRule.description}
                </div>
              )}
            </div>

            {/* SIN Layover Duration Input */}
            {isSinTransit && (
              <div className="mt-6">
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">
                  🕒 How long is your SIN layover (in minutes)?
                </label>
                <Input
                  type="number"
                  placeholder="e.g. 120"
                  value={journeyData.layoverDuration || ""}
                  onChange={(e) => setJourneyData({ ...journeyData, layoverDuration: e.target.value })}
                  className="w-full"
                />
              </div>
            )}

            {/* Timeline preview for SIN */}
            {isSinTransit && journeyData.layoverDuration && !isNaN(Number(journeyData.layoverDuration)) && (
              <div className="mt-8">
                <h3 className="text-lg font-semibold text-slate-700 mb-2">Your SIN Transit Plan:</h3>
                <TransitTimeline
                  layoverMinutes={parseInt(journeyData.layoverDuration, 10)}
                  departureTimeUTC={22}           // Optional: later calculate based on real flight
                  flightDurationMins={540}        // Optional: make dynamic
                  energyLevel="default"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              {vibes.map((vibe) => {
                const isRecommended = sinVibeRule && sinVibeRule.vibe_focus.includes(vibe.value);
                return (
                  <Button
                    key={vibe.value}
                    onClick={() => setJourneyData({ ...journeyData, selected_vibe: vibe.value })}
                    variant={journeyData.selected_vibe === vibe.value ? 'solid' : isRecommended ? 'ghost' : 'ghost'}
                    className={`w-full flex flex-col items-center py-6 ${isRecommended ? 'border-2 border-yellow-400 shadow-md' : ''}`}
                    style={{ background: journeyData.selected_vibe === vibe.value ? (vibeColors as Record<string, string>)[vibe.value] : undefined }}
                  >
                    <span className="text-2xl mb-2">{vibe.label}</span>
                    <span className="text-xs text-slate-500 dark:text-slate-300">{vibe.desc}</span>
                    {isRecommended && <span className="mt-2 text-xs text-yellow-700 font-semibold">Recommended</span>}
                  </Button>
                );
              })}
            </div>
          </motion.div>
        );

      case 2:
        return (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 text-center"
          >
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-3">
                🎯 You're all set!
              </h2>
              <p className="text-slate-600 dark:text-slate-300 text-lg">
                Ready to turn your layover into the best part of your trip?
              </p>
            </div>

            {/* Journey summary with selected vibe highlighted */}
            <div className="max-w-md mx-auto">
              <div className="flex items-center justify-center gap-4 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{journeyData.departure}</div>
                  <div className="text-xs text-slate-500">from</div>
                </div>
                <div className="text-2xl">✈️</div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{journeyData.destination}</div>
                  <div className="text-xs text-slate-500">to</div>
                </div>
              </div>

              {journeyData.selected_vibe && (
                <div 
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full border-2 font-semibold"
                  style={{
                    background: `linear-gradient(135deg, ${vibeColors[journeyData.selected_vibe as keyof typeof vibeColors]}25, ${vibeColors[journeyData.selected_vibe as keyof typeof vibeColors]}15)`,
                    borderColor: vibeColors[journeyData.selected_vibe as keyof typeof vibeColors],
                    boxShadow: `0 0 0 3px ${vibeColors[journeyData.selected_vibe as keyof typeof vibeColors]}30`,
                  }}
                >
                  <span className="text-xl">{vibes.find(v => v.value === journeyData.selected_vibe)?.label.split(' ')[0]}</span>
                  <span>{vibes.find(v => v.value === journeyData.selected_vibe)?.label.split(' ').slice(1).join(' ')} vibes</span>
                </div>
              )}
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  if (showSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 dark:from-slate-900 dark:to-slate-800 p-6">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="text-6xl mb-4"
          >
            ✨
          </motion.div>
          <h2 className="text-2xl font-bold mb-2">Building your perfect plan...</h2>
          <p className="text-slate-600 dark:text-slate-300">Get ready for an amazing experience!</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 dark:from-slate-900 dark:to-slate-800 p-6">
      <div className="max-w-2xl w-full bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <Button
            variant="ghost"
            onClick={handleBack}
            className="text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
          >
            ← Back
          </Button>
          <div className="text-center">
            <div className="text-sm font-semibold text-slate-500 mb-1">
              Step {currentStep + 1} of {steps.length}
            </div>
            <div className="text-xs text-slate-400">{steps[currentStep]}</div>
          </div>
          <Button variant="ghost" onClick={() => console.log("Navigate home")}> 
            🏠
          </Button>
        </div>

        {/* Progress bar */}
        <div className="mb-8">
          <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
              initial={{ width: "0%" }}
              animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* Step content */}
        <div className="mb-8 min-h-[400px] flex flex-col justify-center">
          {renderStep()}
        </div>

        {/* Navigation */}
        <div className="flex justify-end">
          <Button
            onClick={handleNext}
            disabled={!canProceed()}
            className={`px-8 py-3 text-lg font-semibold transition-all duration-300 ${
              canProceed() 
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:scale-105' 
                : 'opacity-50 cursor-not-allowed'
            }`}
            style={currentStep === 1 && journeyData.selected_vibe ? {
              boxShadow: `0 0 0 3px ${vibeColors[journeyData.selected_vibe as keyof typeof vibeColors]}40, 0 8px 25px -5px rgba(0,0,0,0.1)`
            } : {}}
          >
            {currentStep === steps.length - 1 ? "Let's Go! 🚀" : "Next"}
          </Button>
        </div>
      </div>
    </div>
  );
} 