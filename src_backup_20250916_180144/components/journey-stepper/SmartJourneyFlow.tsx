// Smart Journey Planning Flow with GPS Intelligence
// src/components/journey-stepper/SmartJourneyFlow.tsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Plane, Calendar, Clock, ArrowRight } from 'lucide-react';

// GPS Location Detection Hook
const useLocationDetection = () => {
  const [location, setLocation] = useState<{
    isAtAirport: boolean;
    airportCode?: string;
    terminalCode?: string;
    accuracy: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const detectAirportLocation = async () => {
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60000
          });
        });

        const { latitude, longitude, accuracy } = position.coords;
        
        // Check against known airport coordinates
        const airportLocation = checkAirportProximity(latitude, longitude, accuracy);
        
        setLocation(airportLocation);
      } catch (error) {
        console.log('Location detection failed:', error);
        setLocation({ isAtAirport: false, accuracy: 0 });
      } finally {
        setLoading(false);
      }
    };

    detectAirportLocation();
  }, []);

  return { location, loading };
};

// Airport proximity detection
const checkAirportProximity = (lat: number, lng: number, accuracy: number) => {
  const AIRPORT_LOCATIONS = {
    'SIN': { lat: 1.3644, lng: 103.9915, terminals: ['T1', 'T2', 'T3', 'T4'] },
    'SYD': { lat: -33.9399, lng: 151.1753, terminals: ['T1', 'T2', 'T3'] },
    'DXB': { lat: 25.2528, lng: 55.3644, terminals: ['T1', 'T2', 'T3'] },
    'LHR': { lat: 51.4700, lng: -0.4543, terminals: ['T2', 'T3', 'T4', 'T5'] },
    'LAX': { lat: 33.9425, lng: -118.4081, terminals: ['T1', 'T2', 'T3'] }
  };

  for (const [code, airport] of Object.entries(AIRPORT_LOCATIONS)) {
    const distance = calculateDistance(lat, lng, airport.lat, airport.lng);
    
    // Within 5km of airport (considering GPS accuracy)
    if (distance <= 5 + (accuracy / 1000)) {
      // Detect specific terminal if very close (within 500m)
      const terminalCode = distance <= 0.5 ? detectTerminal(lat, lng, code) : 'T1';
      
      return {
        isAtAirport: true,
        airportCode: code,
        terminalCode,
        accuracy: distance
      };
    }
  }

  return { isAtAirport: false, accuracy: 0 };
};

const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) + 
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
            Math.sin(dLng/2) * Math.sin(dLng/2);
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
};

// Parse flight route from flight number
const parseFlightRoute = (flightNumber: string) => {
  // Mock airline route database - in production this would be an API call
  const AIRLINE_ROUTES = {
    'QF1': { route: ['SYD', 'SIN', 'LHR'], airline: 'Qantas' },
    'QF2': { route: ['LHR', 'SIN', 'SYD'], airline: 'Qantas' },
    'SQ317': { route: ['SIN', 'SYD'], airline: 'Singapore Airlines' },
    'SQ318': { route: ['SYD', 'SIN'], airline: 'Singapore Airlines' },
    'EK404': { route: ['DXB', 'SYD'], airline: 'Emirates' },
    'EK405': { route: ['SYD', 'DXB'], airline: 'Emirates' },
    'BA12': { route: ['LHR', 'SIN'], airline: 'British Airways' },
    'UA870': { route: ['SYD', 'LAX'], airline: 'United Airlines' },
    // Future: Multi-airline examples
    'MULTI_SYD_SIN_BKK': { route: ['SYD', 'SIN', 'BKK'], airline: 'Multiple', isMultiAirline: true },
    'PER123': { route: ['PER', 'DPS'], airline: 'Jetstar' } // Direct flight example
  };

  const flightInfo = AIRLINE_ROUTES[flightNumber as keyof typeof AIRLINE_ROUTES];
  
  if (!flightInfo) {
    // If flight not found, try to parse from user input or return null
    return null;
  }

  const isDirect = flightInfo.route.length === 2;
  const hasTransit = flightInfo.route.length > 2;
  
  return {
    flightNumber,
    route: flightInfo.route,
    airline: flightInfo.airline,
    departure: flightInfo.route[0],
    arrival: flightInfo.route[flightInfo.route.length - 1],
    hasTransit,
    isDirect,
    transitPoints: flightInfo.route.slice(1, -1),
    isMultiAirline: flightInfo.isMultiAirline || false,
    segments: generateSegments(flightInfo.route)
  };
};

// Generate flight segments for complex routing
const generateSegments = (route: string[]) => {
  const segments = [];
  for (let i = 0; i < route.length - 1; i++) {
    segments.push({
      from: route[i],
      to: route[i + 1],
      type: i === 0 ? 'departure' : i === route.length - 2 ? 'arrival' : 'transit'
    });
  }
  return segments;
};

// Determine user's position in journey based on GPS and flight route
const determineJourneyContext = (flightInfo: any, detectedLocation: any) => {
  if (!flightInfo || !detectedLocation?.isAtAirport) {
    return { context: 'unknown', suggestedPhase: 'departure' };
  }

  const userAirport = detectedLocation.airportCode;
  const { departure, arrival, transitPoints } = flightInfo;

  if (userAirport === departure) {
    return { context: 'departure', suggestedPhase: 'departure' };
  } else if (transitPoints.includes(userAirport)) {
    return { context: 'transit', suggestedPhase: 'transit' };
  } else if (userAirport === arrival) {
    return { context: 'arrival', suggestedPhase: 'arrival' };
  }

  return { context: 'unknown', suggestedPhase: 'departure' };
};

const detectTerminal = (lat: number, lng: number, airportCode: string) => {
  // Terminal-specific detection logic would go here
  // For now, return default terminal
  const defaultTerminals = { 'SIN': 'T3', 'SYD': 'T1', 'DXB': 'T1' };
  return defaultTerminals[airportCode as keyof typeof defaultTerminals] || 'T1';
};

// Main Smart Journey Component
export const SmartJourneyFlow: React.FC = () => {
  const navigate = useNavigate();
  const { location, loading: locationLoading } = useLocationDetection();
  
  const [currentStep, setCurrentStep] = useState<'location' | 'flight' | 'journey-type' | 'phase' | 'vibe'>('location');
  const [journeyData, setJourneyData] = useState({
    flightNumber: '',
    flightDate: '',
    journeyType: '', // 'single-leg' or 'complete-trip'
    phase: '', // 'departure', 'transit', 'arrival'
    selectedVibe: '',
    detectedLocation: null as any
  });

  useEffect(() => {
    if (!locationLoading && location) {
      setJourneyData(prev => ({ ...prev, detectedLocation: location }));
      
      if (location.isAtAirport) {
        // Skip to flight number step
        setCurrentStep('flight');
      } else {
        // Need flight number + date
        setCurrentStep('flight');
      }
    }
  }, [location, locationLoading]);

  const handleFlightSubmit = (flightNumber: string, date?: string) => {
    const flightInfo = parseFlightRoute(flightNumber);
    const journeyContext = determineJourneyContext(flightInfo, location);
    
    setJourneyData(prev => ({ 
      ...prev, 
      flightNumber,
      flightDate: date || new Date().toISOString().split('T')[0],
      flightInfo,
      journeyContext
    }));
    
    setCurrentStep('journey-type');
  };

  const handleJourneyTypeSelect = (type: string) => {
    const { flightInfo, journeyContext } = journeyData;
    
    setJourneyData(prev => ({ ...prev, journeyType: type }));
    
    // Check if complete journey is selected
    if (type === 'complete-journey' || type === 'multi-airline-trip') {
      // Navigate to terminal selection page for complete journeys
      navigateToTerminalSelection();
    } else if (type === 'single-leg' || type === 'direct-experience') {
      // Single leg journey - check location
      if (location?.isAtAirport) {
        // User AT airport - goes to vibe selection
        setCurrentStep('vibe');
      } else {
        // User NOT at airport - goes to Best Of with toggle
        navigateToBestOfWithToggle();
      }
    }
  };
  
  const handleExploreTerminal = () => {
    if (location?.isAtAirport) {
      // Scenario C: At airport - personalized experience (vibe selection)
      setCurrentStep('vibe');
    } else {
      // Scenario C: Not at airport - browse collections (Best Of)
      navigateToBestOf({ context: 'explore' });
    }
  };

  const handlePhaseSelect = (phase: string) => {
    setJourneyData(prev => ({ ...prev, phase }));
    
    // This function is no longer used in the new flow
    // All routing is handled by the location-aware logic
  };

  const handleVibeSelect = (vibe: string) => {
    const finalJourneyData = { ...journeyData, selectedVibe: vibe };
    
    // Navigate to vibe-based personalized experience
    navigateToVibeExperience(vibe);
  };
  
  // ✅ Navigate to terminal selection for complete journeys
  const navigateToTerminalSelection = () => {
    const { flightInfo } = journeyData;
    
    navigate('/terminal-select', {
      state: {
        flightNumber: journeyData.flightNumber,
        route: flightInfo?.route || ['SYD', 'SIN', 'LHR'],
        flightDate: journeyData.flightDate,
        journeyType: journeyData.journeyType,
        detectedLocation: location
      }
    });
  };
  
  // ✅ Navigate to vibe-based personalized experience
  const navigateToVibeExperience = (vibe: string) => {
    const airport = location?.airportCode || journeyData.flightInfo?.departure;
    const terminal = `${airport}-T1`;
    
    const params = new URLSearchParams({
      context: 'vibe-experience',
      airport,
      terminal,
      flightNumber: journeyData.flightNumber,
      vibe,
      currentLocation: location?.airportCode || 'planning'
    });
    
    const journeyDataForSession = {
      flightNumber: journeyData.flightNumber,
      date: journeyData.flightDate,
      departure: journeyData.flightInfo?.departure,
      destination: journeyData.flightInfo?.arrival,
      layovers: journeyData.flightInfo?.transitPoints,
      selected_vibe: vibe,
      terminal: terminal,
      journeyType: journeyData.journeyType,
      currentLocation: location?.airportCode || null,
      detectedGPS: location?.isAtAirport || false
    };
    
    sessionStorage.setItem('tempJourneyData', JSON.stringify(journeyDataForSession));
    
    navigate(`/experience?${params.toString()}`);
  };

  // ✅ NEW: Navigate to Best Of collections with vibe toggle option
  const navigateToBestOfWithToggle = () => {
    const airport = location?.airportCode || journeyData.flightInfo?.departure;
    const terminal = `${airport}-T1`; // Default terminal logic
    
    const params = new URLSearchParams({
      context: 'best-of',
      airport,
      terminal,
      flightNumber: journeyData.flightNumber,
      showVibeToggle: 'true', // Enable vibe toggle
      currentLocation: location?.airportCode || 'planning'
    });
    
    // Save journey data for Best Of view
    const journeyDataForSession = {
      flightNumber: journeyData.flightNumber,
      date: journeyData.flightDate,
      departure: journeyData.flightInfo?.departure,
      destination: journeyData.flightInfo?.arrival,
      layovers: journeyData.flightInfo?.transitPoints,
      journeyType: journeyData.journeyType,
      currentLocation: location?.airportCode || null,
      detectedGPS: location?.isAtAirport || false,
      showVibeToggle: true
    };
    
    sessionStorage.setItem('tempJourneyData', JSON.stringify(journeyDataForSession));
    
    // Navigate to Best Of experience
    navigate(`/experience?${params.toString()}`);
  };
  
  // ✅ NEW: Navigate to Best Of collections (explore mode)
  const navigateToBestOf = (options: { context?: string } = {}) => {
    const airport = location?.airportCode || journeyData.flightInfo?.departure;
    const terminal = `${airport}-T1`;
    
    const params = new URLSearchParams({
      context: 'best-of',
      airport,
      terminal,
      flightNumber: journeyData.flightNumber,
      mode: options.context || 'browse',
      currentLocation: location?.airportCode || 'planning'
    });
    
    const journeyDataForSession = {
      flightNumber: journeyData.flightNumber,
      date: journeyData.flightDate,
      departure: journeyData.flightInfo?.departure,
      destination: journeyData.flightInfo?.arrival,
      layovers: journeyData.flightInfo?.transitPoints,
      journeyType: journeyData.journeyType,
      currentLocation: location?.airportCode || null,
      detectedGPS: location?.isAtAirport || false,
      exploreMode: true
    };
    
    sessionStorage.setItem('tempJourneyData', JSON.stringify(journeyDataForSession));
    
    navigate(`/experience?${params.toString()}`);
  };

  if (locationLoading) {
    return <LocationDetectionStep />;
  }

  switch (currentStep) {
    case 'flight':
      return <FlightInputStep 
        isAtAirport={location?.isAtAirport || false}
        airportCode={location?.airportCode}
        onSubmit={handleFlightSubmit}
      />;
    case 'journey-type':
      return <JourneyTypeStep 
        onSelect={handleJourneyTypeSelect} 
        flightInfo={journeyData.flightInfo}
        userLocation={location}
      />;
    case 'phase':
      return <PhaseSelectionStep onSelect={handlePhaseSelect} />;
    case 'vibe':
      return <VibeSelectionStep onSelect={handleVibeSelect} />;
    default:
      return <LocationDetectionStep />;
  }
};

// Step Components
const LocationDetectionStep: React.FC = () => (
  <div className="min-h-screen bg-gradient-to-br from-blue-900 to-purple-900 text-white flex items-center justify-center p-6">
    <div className="text-center">
      <div className="w-16 h-16 mx-auto mb-6 bg-blue-500/20 rounded-full flex items-center justify-center">
        <MapPin className="w-8 h-8 animate-pulse" />
      </div>
      <h2 className="text-2xl font-bold mb-4">Detecting your location...</h2>
      <p className="text-blue-200 mb-6">We'll personalize your experience based on where you are</p>
      <div className="w-32 h-1 bg-blue-800 rounded-full mx-auto overflow-hidden">
        <div className="h-full bg-blue-400 rounded-full animate-pulse"></div>
      </div>
    </div>
  </div>
);

const FlightInputStep: React.FC<{
  isAtAirport: boolean;
  airportCode?: string;
  onSubmit: (flightNumber: string, date?: string) => void;
}> = ({ isAtAirport, airportCode, onSubmit }) => {
  // Pre-fill QF1 for testing
  const [flightNumber, setFlightNumber] = useState('QF1');
  const [flightDate, setFlightDate] = useState(new Date().toISOString().split('T')[0]);
  const [flightInfo, setFlightInfo] = useState<any>(null);

  // Parse flight info as user types
  useEffect(() => {
    if (flightNumber.length >= 2) {
      const parsedFlight = parseFlightRoute(flightNumber);
      setFlightInfo(parsedFlight);
    } else {
      setFlightInfo(null);
    }
  }, [flightNumber]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-purple-900 text-white flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white/10 backdrop-blur-lg rounded-2xl p-8">
        {isAtAirport && (
          <div className="bg-green-500/20 border border-green-500/30 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-5 h-5 text-green-400" />
              <span className="font-medium">Location detected</span>
            </div>
            <p className="text-sm text-green-200">You're at {airportCode} - we'll personalize accordingly!</p>
          </div>
        )}
        
        <h2 className="text-2xl font-bold mb-6">Flight Details</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Flight Number</label>
            <input
              type="text"
              placeholder="e.g. QF1, SQ317, EK404"
              value={flightNumber}
              onChange={(e) => setFlightNumber(e.target.value.toUpperCase())}
              className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            
            {/* Flight route preview */}
            {flightInfo && (
              <div className="mt-3 p-3 bg-blue-500/20 border border-blue-500/30 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Plane className="w-4 h-4 text-blue-400" />
                  <span className="text-sm font-medium">{flightInfo.airline}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-mono">{flightInfo.route.join(' → ')}</span>
                  {flightInfo.hasTransit && (
                    <span className="text-xs bg-purple-500/30 px-2 py-1 rounded">
                      {flightInfo.transitPoints.length} stop{flightInfo.transitPoints.length > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
          
          {!isAtAirport && (
            <div>
              <label className="block text-sm font-medium mb-2">Flight Date</label>
              <input
                type="date"
                value={flightDate}
                onChange={(e) => setFlightDate(e.target.value)}
                className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
        </div>
        
        <button
          onClick={() => onSubmit(flightNumber, flightDate)}
          disabled={!flightNumber || (!isAtAirport && !flightDate)}
          className="w-full mt-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all"
        >
          Continue
        </button>
      </div>
    </div>
  );
};

const JourneyTypeStep: React.FC<{
  onSelect: (type: string) => void;
  flightInfo?: any;
  userLocation?: any;
}> = ({ onSelect, flightInfo, userLocation }) => {
  
  // Dynamic title based on flight API response
  const getDynamicTitle = () => {
    if (!flightInfo) return "Plan Your Experience";
    
    if (flightInfo.isDirect) {
      return "Plan Your Airport Experience";
    }
    
    if (flightInfo.isMultiAirline) {
      return "Plan Your Multi-City Trip";
    }
    
    return "Which flight is yours?";
  };
  
  // Dynamic subtitle based on context
  const getDynamicSubtitle = () => {
    if (!flightInfo) return "";
    
    if (flightInfo.isDirect) {
      return `${flightInfo.route[0]} → ${flightInfo.route[1]} direct flight`;
    }
    
    if (flightInfo.isMultiAirline) {
      return "Multiple airlines and stopovers detected";
    }
    
    return `${flightInfo.route.join(' → ')} with ${flightInfo.route.length - 2} stop(s)`;
  };
  
  // Get current segment based on user location
  const getCurrentSegment = () => {
    if (!flightInfo || !userLocation?.airportCode) return null;
    
    const route = flightInfo.route;
    const userIndex = route.indexOf(userLocation.airportCode);
    
    if (userIndex === -1) return null;
    
    if (userIndex === 0) {
      return { from: route[0], to: route[1], type: 'departure' };
    } else if (userIndex === route.length - 1) {
      return { from: route[userIndex - 1], to: route[userIndex], type: 'arrival' };
    } else {
      return { from: route[userIndex], to: route[userIndex + 1], type: 'transit' };
    }
  };
  
  const getSmartNote = (segment: any) => {
    if (userLocation?.airportCode === segment?.from) {
      return `✓ You're at ${segment.from} - perfect timing for this segment`;
    }
    return `Smart routing based on your ${segment?.type || 'current'} context`;
  };
  
  // Generate options based on flight API response
  const getAvailableOptions = () => {
    if (!flightInfo) return [];
    
    const options = [];
    
    if (flightInfo.isDirect) {
      // Direct flight - only one option
      const routeDisplay = `${flightInfo.route[0]} > ${flightInfo.route[1]}`;
      options.push({
        id: 'direct-experience',
        title: routeDisplay,
        description: 'Personalised recommendations for your time in the terminal',
        route: flightInfo.route.join(' → '),
        icon: '✈️',
        gradient: 'from-blue-500/20 to-cyan-500/20',
        hoverGradient: 'from-blue-500/30 to-cyan-500/30',
        border: 'border-blue-500/30'
      });
    } else {
      // Multi-segment flight - give choices
      
      // First leg option (always show the first segment)
      const firstSegment = `${flightInfo.route[0]} > ${flightInfo.route[1]}`;
      options.push({
        id: 'single-leg',
        title: firstSegment,
        description: 'Personalised recommendations for your time in the terminal',
        route: '', // Remove the route display
        icon: '🛫',
        gradient: 'from-orange-500/20 to-red-500/20',
        hoverGradient: 'from-orange-500/30 to-red-500/30',
        border: 'border-orange-500/30',
        airports: [flightInfo.route[0], flightInfo.route[1]] // Add airports array
      });
      
      // Complete journey option
      const completeRoute = flightInfo.route.join(' > ');
      options.push({
        id: 'complete-journey',
        title: completeRoute,
        description: 'Personalised recommendations for your time in the terminal, including a Transit terminal plan.',
        route: '', // Remove the route display
        icon: '🌍',
        gradient: 'from-purple-500/20 to-pink-500/20',
        hoverGradient: 'from-purple-500/30 to-pink-500/30',
        border: 'border-purple-500/30',
        airports: flightInfo.route
      });
      
      // If multi-airline, add special option
      if (flightInfo.isMultiAirline) {
        options.push({
          id: 'multi-airline-trip',
          title: 'Multi-Airline Trip Planning',
          description: 'Including stopovers between separate flights',
          route: flightInfo.route.join(' → '),
          icon: '🎯',
          gradient: 'from-green-500/20 to-emerald-500/20',
          hoverGradient: 'from-green-500/30 to-emerald-500/30',
          border: 'border-green-500/30',
          isSpecial: true
        });
      }
    }
    
    return options;
  };
  
  const options = getAvailableOptions();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-purple-900 text-white flex items-center justify-center p-6">
      <div className="max-w-lg w-full bg-white/10 backdrop-blur-lg rounded-2xl p-8">
        
        {/* Flight Info Header */}
        {flightInfo && (
          <div className="mb-6 p-4 bg-gray-800/50 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Plane className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-medium">
                {flightInfo.airline} {flightInfo.flightNumber}
              </span>
            </div>
            <div className="text-xs text-gray-300 mb-2">
              {getDynamicSubtitle()}
            </div>
            {userLocation?.airportCode && (
              <div className="flex items-center gap-2 text-xs text-green-300">
                <MapPin className="w-3 h-3" />
                <span>Current location: {userLocation.airportCode}</span>
              </div>
            )}
          </div>
        )}

        {/* Dynamic Title */}
        <h2 className="text-2xl font-bold mb-6 text-center">
          {getDynamicTitle()}
        </h2>
        
        {/* Dynamic Options */}
        <div className="space-y-4">
          {options.map((option) => (
            <button
              key={option.id}
              onClick={() => onSelect(option.id === 'current-segment' ? 'single-leg' : option.id === 'direct-experience' ? 'single-leg' : option.id)}
              className={`w-full p-6 bg-gradient-to-r ${option.gradient} hover:${option.hoverGradient} border ${option.border} rounded-xl transition-all text-left group`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{option.icon}</span>
                  <h3 className="font-semibold">{option.title}</h3>
                </div>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </div>
              
              <p className="text-sm text-white/70 mb-2">{option.description}</p>
              
              {option.route && (
                <div className="text-xs font-mono text-white/60 mb-2">
                  {option.route}
                </div>
              )}
              
              {option.smartNote && (
                <p className="text-xs text-green-300 italic">
                  {option.smartNote}
                </p>
              )}
              
              {option.airports && (
                <div className="flex items-center gap-1 mt-2">
                  <span className="text-xs text-purple-300">Airports:</span>
                  {option.airports.map((airport: string, index: number) => (
                    <span key={airport} className="text-xs bg-purple-500/30 px-2 py-1 rounded">
                      {airport}
                    </span>
                  ))}
                </div>
              )}
            </button>
          ))}
        </div>
        
        {/* Flight Type Info */}
        {flightInfo?.isDirect && (
          <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-4 h-4 text-blue-400">ℹ️</div>
              <span className="text-sm font-medium">Direct Flight</span>
            </div>
            <p className="text-xs text-blue-200">
              No stopovers - we'll focus on optimizing your airport experience
            </p>
          </div>
        )}
        
        {flightInfo?.isMultiAirline && (
          <div className="mt-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-4 h-4 text-amber-400">⚠️</div>
              <span className="text-sm font-medium">Multi-Airline Trip</span>
            </div>
            <p className="text-xs text-amber-200">
              We'll help plan your stopover time between separate flights
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

const PhaseSelectionStep: React.FC<{
  onSelect: (phase: string) => void;
}> = ({ onSelect }) => (
  <div className="min-h-screen bg-gradient-to-br from-blue-900 to-purple-900 text-white flex items-center justify-center p-6">
    <div className="max-w-md w-full bg-white/10 backdrop-blur-lg rounded-2xl p-8">
      <h2 className="text-2xl font-bold mb-6 text-center">Which part of your journey?</h2>
      
      <div className="space-y-4">
        <button
          onClick={() => onSelect('departure')}
          className="w-full p-6 bg-gradient-to-r from-orange-500/20 to-red-500/20 hover:from-orange-500/30 hover:to-red-500/30 border border-orange-500/30 rounded-xl transition-all text-left group"
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">🛫 Departure</h3>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </div>
          <p className="text-sm text-white/70">Before my flight leaves</p>
        </button>
        
        <button
          onClick={() => onSelect('transit')}
          className="w-full p-6 bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 border border-purple-500/30 rounded-xl transition-all text-left group"
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">🔄 Transit/Layover</h3>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </div>
          <p className="text-sm text-white/70">Between connecting flights</p>
        </button>
        
        <button
          onClick={() => onSelect('arrival')}
          className="w-full p-6 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 hover:from-blue-500/30 hover:to-cyan-500/30 border border-blue-500/30 rounded-xl transition-all text-left group"
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">🛬 Arrival</h3>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </div>
          <p className="text-sm text-white/70">After I land</p>
        </button>
      </div>
    </div>
  </div>
);

const VibeSelectionStep: React.FC<{
  onSelect: (vibe: string) => void;
}> = ({ onSelect }) => {
  const vibes = [
    { id: 'chill', emoji: '😌', name: 'Chill', description: 'Quiet spots to decompress' },
    { id: 'refuel', emoji: '🍔', name: 'Refuel', description: 'Food and drinks to recharge' },
    { id: 'comfort', emoji: '🛋️', name: 'Comfort', description: 'Cozy spaces to rest' },
    { id: 'quick', emoji: '⚡', name: 'Quick', description: 'Fast essentials only' },
    { id: 'work', emoji: '💼', name: 'Work', description: 'Focused productivity spaces' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-purple-900 text-white flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white/10 backdrop-blur-lg rounded-2xl p-8">
        <h2 className="text-2xl font-bold mb-2 text-center">What's your vibe?</h2>
        <p className="text-white/70 text-center mb-6">Choose what matches your departure mood</p>
        
        <div className="grid grid-cols-2 gap-3">
          {vibes.map(vibe => (
            <button
              key={vibe.id}
              onClick={() => onSelect(vibe.id)}
              className="p-4 bg-white/20 hover:bg-white/30 border border-white/30 rounded-xl transition-all text-center group"
            >
              <div className="text-2xl mb-2">{vibe.emoji}</div>
              <div className="font-semibold mb-1">{vibe.name}</div>
              <div className="text-xs text-white/70">{vibe.description}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SmartJourneyFlow;
