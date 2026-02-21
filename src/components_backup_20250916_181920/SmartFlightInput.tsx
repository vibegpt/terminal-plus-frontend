// SmartFlightInput.tsx - GPS-based flight input with multi-segment intelligence
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  MapPin, 
  Plane, 
  Clock, 
  ArrowRight, 
  Settings, 
  Globe,
  Loader2,
  AlertCircle 
} from "lucide-react";
import { useJourneyContext, useFlightSearch, useGPSLocation, useUserMode } from "@/context/JourneyContext";
import { 
  FlightSegment, 
  MultiSegmentFlight, 
  GPSLocation, 
  JourneyScope, 
  LayoverDetails 
} from "@/types/flight.types";

// Airport geofencing boundaries
const AIRPORT_BOUNDARIES = {
  SYD: { 
    center: { lat: -33.9399, lng: 151.1753 },
    radius: 3000,
    name: "Sydney Airport"
  },
  SIN: {
    center: { lat: 1.3644, lng: 103.9915 },
    radius: 2000,
    name: "Singapore Changi Airport"
  },
  LHR: {
    center: { lat: 51.4700, lng: -0.4543 },
    radius: 3500,
    name: "London Heathrow"
  }
};

export default function SmartFlightInput() {
  // Core state
  const [flightNumber, setFlightNumber] = useState("");
  const [flightDate, setFlightDate] = useState("");
  const [showLayoverDetails, setShowLayoverDetails] = useState(false);

  // Journey context hooks
  const { state, actions } = useJourneyContext();
  const { search, isLoading: isSearchingFlight, results: flightData, error } = useFlightSearch();
  const { location: gpsLocation, isLoading: isDetectingLocation, detect: detectLocation } = useGPSLocation();
  const { mode: userMode, timeContext, features } = useUserMode();

  // GPS Detection on component mount
  useEffect(() => {
    if (!gpsLocation) {
      detectLocation();
    }
  }, [gpsLocation]); // Remove detectLocation from dependencies to prevent infinite loop

  // Auto-set date based on location
  useEffect(() => {
    if (gpsLocation?.isAtAirport && !flightDate) {
      setFlightDate(new Date().toISOString().split('T')[0]);
    }
  }, [gpsLocation?.isAtAirport]);

  // Handle flight lookup using journey context
  const handleFlightLookup = async () => {
    if (!flightNumber.trim()) return;

    const lookupDate = flightDate || (gpsLocation?.isAtAirport ? 
      new Date().toISOString().split('T')[0] : '');

    if (!lookupDate && !gpsLocation?.isAtAirport) {
      // Show error for missing date
      return;
    }

    await search(flightNumber.trim().toUpperCase(), lookupDate);
  };

  // Handle journey scope selection for multi-segment flights
  const handleJourneyScopeSelection = (scopeType: 'current-segment' | 'full-journey') => {
    if (!flightData) return;

    const currentSegment = gpsLocation?.airport 
      ? flightData.segments.find(s => s.departure.airport === gpsLocation.airport)
      : flightData.segments[0];

    const scope: JourneyScope = {
      type: scopeType,
      segments: scopeType === 'full-journey' ? flightData.segments : [currentSegment!],
      currentSegment,
      layoverDetails: scopeType === 'full-journey' ? calculateLayoverDetails(flightData.segments) : undefined
    };

    actions.setJourneyScope(scope);
  };

  // Calculate layover details between segments
  const calculateLayoverDetails = (segments: FlightSegment[]): LayoverDetails[] => {
    const layovers: LayoverDetails[] = [];
    
    for (let i = 0; i < segments.length - 1; i++) {
      const current = segments[i];
      const next = segments[i + 1];
      
      // Calculate layover duration (simplified)
      const arrivalTime = new Date(`2025-01-01 ${current.arrival.time.replace('+1', '')}`);
      const departureTime = new Date(`2025-01-01 ${next.departure.time}`);
      const duration = Math.floor((departureTime.getTime() - arrivalTime.getTime()) / (1000 * 60));
      
      layovers.push({
        airport: current.arrival.airport,
        terminal: current.arrival.terminal,
        duration: `${Math.floor(duration / 60)}h ${duration % 60}m`,
        transitRequired: current.arrival.terminal !== next.departure.terminal
      });
    }
    
    return layovers;
  };

  // Continue to recommendations with journey context
  const handleContinue = () => {
    if (!state.journeyScope || !flightData) return;

    // Save journey context for next screens
    const journeyContext = {
      flightData,
      journeyScope: state.journeyScope,
      gpsLocation,
      userMode,
      timeContext,
      timestamp: new Date().toISOString()
    };

    sessionStorage.setItem('smartJourneyContext', JSON.stringify(journeyContext));
    
    // Navigate to appropriate next screen based on scope
    if (state.journeyScope.type === 'current-segment') {
      // Single segment experience
      console.log('Navigate to single segment experience');
    } else {
      // Multi-segment planning experience  
      console.log('Navigate to multi-segment planner');
    }
  };

  // Render location status
  const renderLocationStatus = () => {
    if (isDetectingLocation) {
      return (
        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          Detecting your location...
        </div>
      );
    }

    if (!gpsLocation) {
      return (
        <Alert className="border-orange-200 bg-orange-50 dark:bg-orange-950 dark:border-orange-800">
          <AlertCircle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800 dark:text-orange-200">
            Location access denied. Please select your airport manually or enable location permissions for a better experience.
          </AlertDescription>
          <div className="mt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => detectLocation()}
              className="text-orange-700 border-orange-300 hover:bg-orange-100"
            >
              Try Again
            </Button>
          </div>
        </Alert>
      );
    }

    if (gpsLocation.isAtAirport) {
      return (
        <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
          <MapPin className="h-5 w-5 text-green-600" />
          <div>
            <p className="text-sm font-medium text-green-800 dark:text-green-200">
              📍 You're at {AIRPORT_BOUNDARIES[gpsLocation.airport as keyof typeof AIRPORT_BOUNDARIES]?.name}
            </p>
            <p className="text-xs text-green-600 dark:text-green-400">
              We'll use today's date automatically
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
        <Globe className="h-5 w-5 text-blue-600" />
        <div>
          <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
            Planning your journey
          </p>
          <p className="text-xs text-blue-600 dark:text-blue-400">
            Please select your travel date
          </p>
        </div>
      </div>
    );
  };

  // Render flight input section
  const renderFlightInput = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-900 dark:text-white">
          Flight Number
        </label>
        <div className="relative">
          <Plane className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <Input
            value={flightNumber}
            onChange={(e) => setFlightNumber(e.target.value.toUpperCase())}
            placeholder="e.g., QF1, SQ25, BA15"
            className="pl-10 text-lg font-mono"
            onKeyPress={(e) => e.key === 'Enter' && handleFlightLookup()}
          />
        </div>
      </div>

      {!gpsLocation?.isAtAirport && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-900 dark:text-white">
            Travel Date
          </label>
          <Input
            type="date"
            value={flightDate}
            onChange={(e) => setFlightDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            className="text-lg"
          />
        </div>
      )}

      <Button
        onClick={handleFlightLookup}
        disabled={!flightNumber.trim() || isSearchingFlight || (!gpsLocation?.isAtAirport && !flightDate)}
        className="w-full py-6 text-lg"
      >
        {isSearchingFlight ? (
          <>
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            Finding your flight...
          </>
        ) : (
          <>
            <Plane className="h-5 w-5 mr-2" />
            Find My Flight
          </>
        )}
      </Button>

      {error && (
        <Alert className="border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800 dark:text-red-200">
            {error}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );

  // Render multi-segment journey scope selection
  const renderJourneyScopeSelection = () => {
    if (!flightData?.isMultiSegment) return null;

    const currentSegment = gpsLocation?.airport 
      ? flightData.segments.find(s => s.departure.airport === gpsLocation.airport)
      : flightData.segments[0];

    const routeDisplay = flightData.segments.map(s => s.route).join(' → ');

    return (
      <div className="space-y-4">
        <div className="text-center p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
            ✅ Found {flightData.flightNumber} - Multi-segment flight
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            🛣️ Your Journey: {routeDisplay}
          </p>
        </div>

        <div className="space-y-3">
          <h4 className="font-medium text-slate-900 dark:text-white">
            📍 You're at: {currentSegment?.departure.airport} ({currentSegment?.departure.terminal})
          </h4>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            🎯 What would you like to plan?
          </p>

          {/* Current segment option */}
          <Button
            variant="outline"
            onClick={() => handleJourneyScopeSelection('current-segment')}
            className="w-full p-6 h-auto flex flex-col items-start space-y-2 border-2 hover:border-primary-500"
          >
            <div className="flex items-center gap-2">
              <Plane className="h-5 w-5 text-blue-600" />
              <span className="font-semibold">Just this segment</span>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {currentSegment?.route} ({currentSegment?.duration})
            </p>
            <p className="text-xs text-slate-500">
              Plan {currentSegment?.departure.airport} departure only
            </p>
          </Button>

          {/* Full journey option */}
          <Button
            variant="outline"
            onClick={() => handleJourneyScopeSelection('full-journey')}
            className="w-full p-6 h-auto flex flex-col items-start space-y-2 border-2 hover:border-green-500"
          >
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-green-600" />
              <span className="font-semibold">Complete journey</span>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {routeDisplay} ({flightData.totalJourneyTime})
            </p>
            <p className="text-xs text-slate-500">
              Plan departure + layovers + arrival
            </p>
          </Button>
        </div>
      </div>
    );
  };

  // Render journey summary and continue
  const renderJourneySummary = () => {
    if (!state.journeyScope || !flightData) return null;

    return (
      <div className="space-y-4">
        <div className="p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
          <h3 className="font-semibold text-green-800 dark:text-green-200 mb-2">
            🎯 Journey Plan Ready
          </h3>
          
          {state.journeyScope.type === 'current-segment' ? (
            <div className="space-y-2">
              <p className="text-sm text-green-700 dark:text-green-300">
                📍 Planning: {state.journeyScope.currentSegment?.route}
              </p>
              <p className="text-xs text-green-600 dark:text-green-400">
                Departure: {state.journeyScope.currentSegment?.departure.time} from {state.journeyScope.currentSegment?.departure.terminal}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-green-700 dark:text-green-300">
                🌍 Complete journey: {flightData.segments.map(s => s.route).join(' → ')}
              </p>
              {state.journeyScope.layoverDetails && (
                <div className="text-xs text-green-600 dark:text-green-400">
                  {state.journeyScope.layoverDetails.map((layover, i) => (
                    <div key={i}>
                      • {layover.airport} layover: {layover.duration}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* User mode indicator */}
        <div className="p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            🎯 Mode: <span className="font-semibold">{userMode}</span>
            {timeContext.timeUntilBoarding > 0 && (
              <span className="ml-2">
                • Boarding in {Math.floor(timeContext.timeUntilBoarding / 60)}h {timeContext.timeUntilBoarding % 60}m
              </span>
            )}
          </p>
        </div>

        {/* Optional layover enhancement */}
        {state.journeyScope.type === 'full-journey' && (
          <Button
            variant="ghost"
            onClick={() => setShowLayoverDetails(!showLayoverDetails)}
            className="w-full flex items-center justify-center gap-2"
          >
            <Settings className="h-4 w-4" />
            {showLayoverDetails ? 'Hide' : 'Enhance'} layover details
          </Button>
        )}

        <Button
          onClick={handleContinue}
          className="w-full py-6 text-lg bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
        >
          Continue to Recommendations
          <ArrowRight className="h-5 w-5 ml-2" />
        </Button>
      </div>
    );
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Terminal+
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Your personalized airport experience starts here
        </p>
      </div>

      {/* Location Status */}
      {renderLocationStatus()}

      {/* Flight Input */}
      {!flightData && renderFlightInput()}

      {/* Journey Scope Selection for Multi-Segment */}
      {flightData && !state.journeyScope && renderJourneyScopeSelection()}

      {/* Journey Summary and Continue */}
      {state.journeyScope && renderJourneySummary()}
    </div>
  );
} 