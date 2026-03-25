import React, { useState, useEffect } from 'react';
import { MapPin, Plane, Clock, ArrowRight, Info } from 'lucide-react';

// Flight route database - MVP routes only
const AIRLINE_ROUTES = {
  'QF1': { route: ['SYD', 'SIN', 'LHR'], airline: 'Qantas' },
  'QF2': { route: ['LHR', 'SIN', 'SYD'], airline: 'Qantas' },
};

// Mock GPS detection
const mockGPSDetection = (userAtAirport: string | null) => ({
  isAtAirport: !!userAtAirport,
  airportCode: userAtAirport,
  terminalCode: userAtAirport ? 'T1' : null,
  accuracy: 95
});

// Parse flight route info
const parseFlightRoute = (flightNumber: string) => {
  const flightInfo = AIRLINE_ROUTES[flightNumber as keyof typeof AIRLINE_ROUTES];
  
  if (!flightInfo) return null;
  
  return {
    flightNumber,
    route: flightInfo.route,
    airline: flightInfo.airline,
    departure: flightInfo.route[0],
    arrival: flightInfo.route[flightInfo.route.length - 1],
    hasTransit: flightInfo.route.length > 2,
    transitPoints: flightInfo.route.slice(1, -1)
  };
};

// Determine journey context based on GPS and flight
const determineJourneyContext = (flightInfo: any, gpsLocation: any) => {
  if (!flightInfo || !gpsLocation?.isAtAirport) {
    return { 
      context: 'planning', 
      currentAirport: null,
      suggestedFlow: 'complete-journey',
      confidence: 'low'
    };
  }

  const userAirport = gpsLocation.airportCode;
  const { departure, arrival, transitPoints } = flightInfo;

  if (userAirport === departure) {
    return { 
      context: 'at-departure', 
      currentAirport: userAirport,
      suggestedFlow: 'single-leg',
      confidence: 'high'
    };
  } else if (transitPoints.includes(userAirport)) {
    return { 
      context: 'at-transit', 
      currentAirport: userAirport,
      suggestedFlow: 'single-leg',
      confidence: 'high'
    };
  } else if (userAirport === arrival) {
    return { 
      context: 'at-arrival', 
      currentAirport: userAirport,
      suggestedFlow: 'single-leg',
      confidence: 'high'
    };
  }

  return { 
    context: 'unknown-airport', 
    currentAirport: userAirport,
    suggestedFlow: 'complete-journey',
    confidence: 'medium'
  };
};

const IntelligentJourneySelector = () => {
  // Demo state - in real app this comes from previous steps
  const [flightNumber, setFlightNumber] = useState('QF1');
  const [userGPS, setUserGPS] = useState<string | null>('SYD'); // Mock GPS - SYD, SIN, LHR, or null
  const [selectedOption, setSelectedOption] = useState<string>('');
  
  // Parse flight and determine context
  const flightInfo = parseFlightRoute(flightNumber);
  const gpsLocation = mockGPSDetection(userGPS);
  const journeyContext = determineJourneyContext(flightInfo, gpsLocation);
  
  // Determine available legs based on user position
  const getAvailableLegs = () => {
    if (!flightInfo) return [];
    
    const { route } = flightInfo;
    const legs = [];
    
    for (let i = 0; i < route.length - 1; i++) {
      legs.push({
        id: `${route[i]}-${route[i + 1]}`,
        departure: route[i],
        arrival: route[i + 1],
        isUserCurrent: gpsLocation.airportCode === route[i],
        segmentType: i === 0 ? 'departure' : i === route.length - 2 ? 'arrival' : 'transit'
      });
    }
    
    return legs;
  };

  const availableLegs = getAvailableLegs();
  const currentLeg = availableLegs.find(leg => leg.isUserCurrent);

  // Smart option rendering
  const renderJourneyOptions = () => {
    if (!flightInfo) return null;

    const { hasTransit } = flightInfo;
    
    if (!hasTransit) {
      // Direct flight - only show single option
      return (
        <div className="space-y-4">
          <div className="bg-blue-500/20 border border-blue-500/30 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Info className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-medium">Direct Flight Detected</span>
            </div>
            <p className="text-xs text-blue-200">This is a non-stop flight from {flightInfo.departure} to {flightInfo.arrival}</p>
          </div>
          
          <button
            onClick={() => setSelectedOption('direct-flight')}
            className="w-full p-6 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 hover:from-blue-500/30 hover:to-cyan-500/30 border border-blue-500/30 rounded-xl transition-all text-left group"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">Plan My Journey</h3>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </div>
            <p className="text-sm text-white/70">{flightInfo.departure} → {flightInfo.arrival}</p>
            {gpsLocation.isAtAirport && (
              <p className="text-xs text-green-300 mt-1">✓ You're at {gpsLocation.airportCode} - showing departure experience</p>
            )}
          </button>
        </div>
      );
    }

    // Multi-leg flight - show intelligent options
    return (
      <div className="space-y-4">
        {/* Current leg option */}
        {currentLeg && (
          <button
            onClick={() => setSelectedOption('current-leg')}
            className="w-full p-6 bg-gradient-to-r from-green-500/20 to-emerald-500/20 hover:from-green-500/30 hover:to-emerald-500/30 border border-green-500/30 rounded-xl transition-all text-left group"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-green-400" />
                <h3 className="font-semibold">Just This Leg</h3>
              </div>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </div>
            <p className="text-sm text-white/70 mb-2">{currentLeg.departure} → {currentLeg.arrival}</p>
            <p className="text-xs text-green-300">
              ✓ You're at {gpsLocation.airportCode} - showing {currentLeg.segmentType} experience
            </p>
            {journeyContext.context === 'at-departure' && (
              <p className="text-xs text-green-200 mt-1">You'll see vibe selection + departure recommendations</p>
            )}
            {journeyContext.context === 'at-transit' && (
              <p className="text-xs text-green-200 mt-1">You'll see transit + layover recommendations</p>
            )}
          </button>
        )}
        
        {/* Complete journey option */}
        <button
          onClick={() => setSelectedOption('complete-journey')}
          className="w-full p-6 bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 border border-purple-500/30 rounded-xl transition-all text-left group"
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">Complete Journey</h3>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </div>
          <p className="text-sm text-white/70 mb-2">{flightInfo.route.join(' → ')}</p>
          <p className="text-xs text-purple-200">
            Plan across all airports: departure, transit & arrival
          </p>
          {gpsLocation.isAtAirport && (
            <p className="text-xs text-purple-300 mt-1">
              ✓ Current location ({gpsLocation.airportCode}) gets vibe selection, others get Best Of collections
            </p>
          )}
        </button>
        
        {/* Show non-current legs if user wants to plan ahead */}
        {!currentLeg && gpsLocation.isAtAirport && (
          <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Info className="w-4 h-4 text-yellow-400" />
              <span className="text-sm font-medium">Planning Ahead</span>
            </div>
            <p className="text-xs text-yellow-200">
              You're at {gpsLocation.airportCode}, which isn't part of this {flightInfo.flightNumber} route. 
              You'll see Best Of collections for all airports.
            </p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-purple-900 text-white flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white/10 backdrop-blur-lg rounded-2xl p-8">
        {/* Flight info header */}
        {flightInfo && (
          <div className="mb-6 p-4 bg-gray-800/50 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Plane className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-medium">{flightInfo.airline} {flightInfo.flightNumber}</span>
            </div>
            <div className="text-xs text-gray-300 mb-2">
              Route: {flightInfo.route.join(' → ')}
            </div>
            {gpsLocation.isAtAirport && (
              <div className="flex items-center gap-2 text-xs text-green-300">
                <MapPin className="w-3 h-3" />
                <span>Current location: {gpsLocation.airportCode}</span>
              </div>
            )}
          </div>
        )}

        <h2 className="text-2xl font-bold mb-6 text-center">What are you planning?</h2>
        
        {renderJourneyOptions()}
        
        {/* Demo controls */}
        <div className="mt-8 pt-6 border-t border-white/20">
          <h4 className="text-sm font-medium mb-3 text-gray-300">Demo Controls</h4>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Flight Number</label>
              <select 
                value={flightNumber} 
                onChange={(e) => setFlightNumber(e.target.value)}
                className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white text-sm"
              >
                <option value="QF1">QF1 (SYD→SIN→LHR)</option>
                <option value="QF2">QF2 (LHR→SIN→SYD)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Mock GPS Location</label>
              <select 
                value={userGPS || ''} 
                onChange={(e) => setUserGPS(e.target.value || null)}
                className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white text-sm"
              >
                <option value="">No GPS / Planning from home</option>
                <option value="SYD">At Sydney (SYD)</option>
                <option value="SIN">At Singapore (SIN)</option>
                <option value="LHR">At London (LHR)</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IntelligentJourneySelector;
