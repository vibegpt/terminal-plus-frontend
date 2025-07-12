import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import airportAmenities from "@/data/airport_terminal_amenities.json";
import sinAmenities from "@/data/sin_new_amenities.json";
import lhrAmenities from "@/data/lhr_amenities.json";

const VIBES = ["Relax", "Explore", "Comfort", "Work", "Quick"];

const combinedAmenities = [...airportAmenities, ...sinAmenities, ...lhrAmenities];

// Extract airport codes and terminals from amenities data
const airportMap: Record<string, Set<string>> = {};
for (const amenity of combinedAmenities) {
  const code = amenity.terminal_code?.split("-")[0];
  const terminal = amenity.terminal_code;
  if (code && terminal) {
    if (!airportMap[code]) airportMap[code] = new Set();
    airportMap[code].add(terminal);
  }
}
const airportCodes = Object.keys(airportMap);

// Vibe background and outline color mapping
const vibeBgGlow: Record<string, string> = {
  Relax: 'bg-gradient-to-br from-violet-100 via-white to-violet-200',
  Explore: 'bg-gradient-to-br from-green-100 via-white to-green-200',
  Comfort: 'bg-gradient-to-br from-blue-100 via-white to-blue-200',
  Work: 'bg-gradient-to-br from-orange-100 via-white to-orange-200',
  Quick: 'bg-gradient-to-br from-red-100 via-white to-red-200',
};
const cardOutline: Record<string, string> = {
  Relax: 'border-violet-400',
  Explore: 'border-green-400',
  Comfort: 'border-blue-400',
  Work: 'border-orange-400',
  Quick: 'border-red-400',
};

export default function ExploreTerminal() {
  const navigate = useNavigate();
  const [airportCode, setAirportCode] = useState("");
  const [selectedTerminal, setSelectedTerminal] = useState("");
  const [selectedVibe, setSelectedVibe] = useState("");
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [error, setError] = useState("");

  // Step 1: Enter airport code
  function handleAirportCodeSubmit(e: React.FormEvent) {
    e.preventDefault();
    const code = airportCode.trim().toUpperCase();
    if (!airportMap[code]) {
      setError("No terminals found for this airport code.");
      return;
    }
    setError("");
    setAirportCode(code);
    setStep(2);
  }

  // Step 2: Select terminal
  function handleTerminalSelect(e: React.ChangeEvent<HTMLSelectElement>) {
    setSelectedTerminal(e.target.value);
  }
  function handleTerminalSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedTerminal) {
      setError("Please select a terminal.");
      return;
    }
    setError("");
    setStep(3);
  }

  // Step 3: Select vibe
  function handleVibeSelect(vibe: string) {
    setSelectedVibe(vibe);
  }
  function handleVibeSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedVibe) {
      setError("Please select a vibe.");
      return;
    }
    setError("");
    // Navigate to guide view with selected terminal and vibe
    navigate(`/guide-view?terminal=${selectedTerminal}&vibe=${selectedVibe}`, { state: { from: '/explore-terminal' } });
  }

  const pageBgGlowClass = selectedVibe ? vibeBgGlow[selectedVibe] : 'bg-gradient-to-br from-violet-100 via-white to-violet-200';
  const cardOutlineClass = selectedVibe ? cardOutline[selectedVibe] : 'border-violet-400';

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center ${pageBgGlowClass} dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 p-4`}>
      <div className={`w-full max-w-md bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 border-2 ${cardOutlineClass}`}>
        <h1 className="text-2xl font-bold mb-4 text-center">Explore Terminal</h1>
        {step === 1 && (
          <form onSubmit={handleAirportCodeSubmit} className="space-y-4">
            <label className="block text-sm font-medium">Enter Airport Code</label>
            <input
              type="text"
              value={airportCode}
              onChange={e => setAirportCode(e.target.value.toUpperCase())}
              className="w-full px-4 py-2 rounded border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. SIN, SYD"
              maxLength={4}
              autoFocus
            />
            {error && <div className="text-red-500 text-sm">{error}</div>}
            <button type="submit" className="w-full py-2 rounded bg-blue-600 text-white font-semibold mt-2">Next</button>
          </form>
        )}
        {step === 2 && (
          <form onSubmit={handleTerminalSubmit} className="space-y-4">
            <label className="block text-sm font-medium mb-1">Select Terminal</label>
            <select
              value={selectedTerminal}
              onChange={handleTerminalSelect}
              className="w-full px-4 py-2 rounded border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Choose Terminal --</option>
              {[...(airportMap[airportCode] || [])].map(terminal => (
                <option key={terminal} value={terminal}>{terminal}</option>
              ))}
            </select>
            {error && <div className="text-red-500 text-sm">{error}</div>}
            <button type="submit" className="w-full py-2 rounded bg-blue-600 text-white font-semibold mt-2">Next</button>
          </form>
        )}
        {step === 3 && (
          <form onSubmit={handleVibeSubmit} className="space-y-4">
            <label className="block text-sm font-medium mb-1">Select Vibe</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {VIBES.map(vibe => (
                <button
                  type="button"
                  key={vibe}
                  className={`px-4 py-2 rounded-full border text-sm font-semibold transition-all ${selectedVibe === vibe ? 'bg-blue-600 text-white border-blue-600' : 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white border-slate-300'}`}
                  onClick={() => handleVibeSelect(vibe)}
                >
                  {vibe}
                </button>
              ))}
            </div>
            {error && <div className="text-red-500 text-sm">{error}</div>}
            <button type="submit" className="w-full py-2 rounded bg-blue-600 text-white font-semibold mt-2">See Recommendations</button>
          </form>
        )}
      </div>
    </div>
  );
}
