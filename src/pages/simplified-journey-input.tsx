import React, { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { checkTransitOrSelfTransfer } from "@/utils/terminalGuesses";

export default function SimplifiedJourneyInput() {
  const [airport, setAirport] = useState("");
  const [vibe, setVibe] = useState<"Relax" | "Explore" | "Work" | "Quick" | "">("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showTransitPopup, setShowTransitPopup] = useState(false);
  const [flightNumber, setFlightNumber] = useState("");
  const [destinationCity, setDestinationCity] = useState("");
  const [transitAirport, setTransitAirport] = useState("");
  const [transitDetected, setTransitDetected] = useState(false);
  const [selfTransferDetected, setSelfTransferDetected] = useState(false);

  const [_, setLocation] = useLocation();

  const handleSubmit = async () => {
    if (!airport || !vibe) {
      alert("Please select an airport and vibe to continue!");
      return;
    }
    
    // Check for transit or self-transfer if flight number is provided
    if (flightNumber) {
      const transitType = await checkTransitOrSelfTransfer(flightNumber);
      if (transitType === "transit") {
        setTransitDetected(true);
        if (!transitAirport) {
          setShowTransitPopup(true);
          return; // Wait for transit info before proceeding
        }
      } else if (transitType === "self-transfer") {
        setSelfTransferDetected(true);
      }
    }
    
    // In a real implementation, we'd save this to the database first
    // For now, we'll just simulate by storing in sessionStorage and redirecting
    const journeyData = {
      origin: airport,
      selected_vibe: vibe,
      flight_number: flightNumber || `${airport}123`, // Default flight number if not provided
      destination: destinationCity || "Destination",
      transit: transitAirport || undefined,
      transitDetected: transitDetected,
      selfTransferDetected: selfTransferDetected
    };
    
    sessionStorage.setItem("tempJourneyData", JSON.stringify(journeyData));
    
    // For self-transfer flights, automatically recommend a comfort journey
    if (selfTransferDetected) {
      setLocation("/comfort-journey");
      return;
    }
    
    setLocation("/simplified-explore");
  };

  const handleAirportClick = (code: string) => {
    setAirport(code);
    // Show transit popup after selecting an airport
    setShowTransitPopup(true);
  };

  const handleVibeClick = (selectedVibe: "Relax" | "Explore" | "Work" | "Quick") => {
    setVibe(selectedVibe);
  };

  return (
    <div className="flex flex-col min-h-screen p-6 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-center bg-gradient-to-r from-primary-600 to-secondary-600 text-transparent bg-clip-text">
        Start Your Terminal Journey
      </h1>

      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-md mb-8">
        <h2 className="text-xl font-medium mb-4">Where are you flying from?</h2>
        <div className="grid grid-cols-3 gap-3 mb-4">
          <Button
            variant={airport === "SYD" ? "default" : "outline"}
            onClick={() => handleAirportClick("SYD")}
            className="h-16"
          >
            Sydney (SYD)
          </Button>
          <Button
            variant={airport === "SIN" ? "default" : "outline"}
            onClick={() => handleAirportClick("SIN")}
            className="h-16"
          >
            Singapore (SIN)
          </Button>
          <Button
            variant={airport === "LHR" ? "default" : "outline"}
            onClick={() => handleAirportClick("LHR")}
            className="h-16"
          >
            London (LHR)
          </Button>
        </div>
        <div className="flex items-center gap-2 mt-4">
          <span className="text-sm text-slate-600 dark:text-slate-400">Other Airport:</span>
          <Input 
            value={airport} 
            onChange={(e) => setAirport(e.target.value.toUpperCase())} 
            placeholder="Enter Airport Code" 
            className="max-w-[200px]"
          />
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-md mb-8">
        <h2 className="text-xl font-medium mb-4">What's your vibe?</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Button
            variant={vibe === "Relax" ? "default" : "outline"}
            onClick={() => handleVibeClick("Relax")}
            className="h-16"
          >
            🛋️ Relax
          </Button>
          <Button
            variant={vibe === "Explore" ? "default" : "outline"}
            onClick={() => handleVibeClick("Explore")}
            className="h-16"
          >
            🛍️ Explore
          </Button>
          <Button
            variant={vibe === "Work" ? "default" : "outline"}
            onClick={() => handleVibeClick("Work")}
            className="h-16"
          >
            🧑‍💻 Work
          </Button>
          <Button
            variant={vibe === "Quick" ? "default" : "outline"}
            onClick={() => handleVibeClick("Quick")}
            className="h-16"
          >
            ⏩ Quick
          </Button>
        </div>
      </div>

      <div className="text-center mb-8">
        <Button 
          onClick={handleSubmit} 
          className="w-full md:w-auto px-8 py-6 text-lg bg-gradient-to-r from-primary-600 to-secondary-600"
        >
          ✨ Show My Terminal Journey
        </Button>
      </div>

      <div className="text-center">
        <Button 
          variant="link" 
          onClick={() => setShowAdvanced(true)} 
          className="text-primary-600"
        >
          ✈️ Want better accuracy? Enter flight or destination
        </Button>
      </div>

      <Dialog open={showAdvanced} onOpenChange={setShowAdvanced}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Optional Flight Details</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label htmlFor="flightNumber" className="text-sm font-medium">
                Flight Number
              </label>
              <Input
                id="flightNumber"
                value={flightNumber}
                onChange={(e) => setFlightNumber(e.target.value.toUpperCase())}
                placeholder="e.g. SQ321"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="destination" className="text-sm font-medium">
                Destination City
              </label>
              <Input
                id="destination"
                value={destinationCity}
                onChange={(e) => setDestinationCity(e.target.value)}
                placeholder="e.g. London"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button type="button" onClick={() => setShowAdvanced(false)}>
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Transit Popup */}
      <Dialog open={showTransitPopup} onOpenChange={setShowTransitPopup}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Have a Transit Stop?</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-slate-600 dark:text-slate-400">
              Enter your flight number to unlock real-time transit routing and personalized layover recommendations.
              (Skip if departing directly from this airport.)
            </p>
            <div className="space-y-2">
              <label htmlFor="transitFlightNumber" className="text-sm font-medium">
                Flight Number
              </label>
              <Input
                id="transitFlightNumber"
                value={flightNumber}
                onChange={(e) => setFlightNumber(e.target.value.toUpperCase())}
                placeholder="e.g. SQ321"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="transitAirport" className="text-sm font-medium">
                Transit Airport (if known)
              </label>
              <Input
                id="transitAirport"
                value={transitAirport}
                onChange={(e) => setTransitAirport(e.target.value.toUpperCase())}
                placeholder="e.g. SIN"
              />
            </div>
          </div>
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setShowTransitPopup(false)}>
              Skip
            </Button>
            <Button onClick={() => setShowTransitPopup(false)}>
              Continue
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}