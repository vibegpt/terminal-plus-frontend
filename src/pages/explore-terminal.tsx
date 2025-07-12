import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import amenitiesData from "@/data/amenities.json";
import { Button } from "@/components/ui/button";

// Build airportMap from amenities data
const airportMap: Record<string, Set<string>> = {};
for (const amenity of amenitiesData) {
  const airport = amenity.airport_code;
  const terminal = amenity.terminal_code;
  if (airport && terminal) {
    if (!airportMap[airport]) airportMap[airport] = new Set();
    airportMap[airport].add(terminal);
  }
}

const VIBES = ["Chill", "Refuel", "Comfort", "Explore", "Quick", "Grind"];

const vibeBgGlow: Record<string, string> = {
  Chill: 'bg-gradient-to-br from-violet-100 via-white to-violet-200',
  Refuel: 'bg-gradient-to-br from-yellow-100 via-white to-yellow-200',
  Comfort: 'bg-gradient-to-br from-blue-100 via-white to-blue-200',
  Explore: 'bg-gradient-to-br from-green-100 via-white to-green-200',
  Quick: 'bg-gradient-to-br from-red-100 via-white to-red-200',
  Grind: 'bg-gradient-to-br from-orange-100 via-white to-orange-200',
};
const cardOutline: Record<string, string> = {
  Chill: 'border-violet-400',
  Refuel: 'border-yellow-400',
  Comfort: 'border-blue-400',
  Explore: 'border-green-400',
  Quick: 'border-red-400',
  Grind: 'border-orange-400',
};

export default function ExploreTerminal() {
  const navigate = useNavigate();
  const [airportCode, setAirportCode] = useState("");
  const [selectedTerminal, setSelectedTerminal] = useState("");
  const [selectedVibe, setSelectedVibe] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
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

  function handleVibeSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedVibe && !searchQuery.trim()) {
      setError("Please select a vibe or enter a search query.");
      return;
    }
    setError("");

    const exploreJourney = {
      airportCode,
      terminalCode: selectedTerminal,
      vibe: selectedVibe,
      search: searchQuery.trim(),
    };
    sessionStorage.setItem('explore-journey', JSON.stringify(exploreJourney));
    navigate(`/guide-view?airport=${airportCode}&terminal=${selectedTerminal}&vibe=${selectedVibe}&search=${searchQuery.trim()}`);
  }

  const pageBgGlowClass = selectedVibe ? vibeBgGlow[selectedVibe] : 'bg-gradient-to-br from-violet-100 via-white to-violet-200';
  const cardOutlineClass = selectedVibe ? cardOutline[selectedVibe] : 'border-violet-400';

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center ${pageBgGlowClass} dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 p-4`}>
      {/* Navigation Buttons */}
      <div className="flex gap-2 mb-4 w-full max-w-md">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          ← Back
        </Button>
        <Button variant="ghost" onClick={() => navigate("/")}>🏠 Home</Button>
      </div>
      <div className={`w-full max-w-md bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 border-2 ${cardOutlineClass}`}>
        <h1 className="text-2xl font-bold mb-4 text-center">Explore Terminal</h1>

        {step === 1 && (
          <form onSubmit={handleAirportCodeSubmit} className="space-y-4">
            <label className="block text-sm font-medium">Enter Airport Code</label>
            <input
              type="text"
              value={airportCode}
              onChange={e => setAirportCode(e.target.value.toUpperCase())}
              className="w-full px-4 py-2 rounded border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
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
              className="w-full px-4 py-2 rounded border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
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
                  className={`px-4 py-2 rounded-full border text-sm font-semibold transition-all ${
                    selectedVibe === vibe
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white border-slate-300'
                  }`}
                  onClick={() => setSelectedVibe(vibe)}
                >
                  {vibe}
                </button>
              ))}
            </div>

            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for a store, lounge or service..."
              className="w-full px-4 py-2 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500 text-black"
            />

            {error && <div className="text-red-500 text-sm">{error}</div>}
            <button type="submit" className="w-full py-2 rounded bg-blue-600 text-white font-semibold mt-2">See Recommendations</button>
          </form>
        )}
      </div>
    </div>
  );
}

