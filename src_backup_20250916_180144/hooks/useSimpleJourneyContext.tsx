import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { LocationDetectionService } from '../services/LocationDetectionService';

// Interface for the expected journey context structure
interface JourneyContext {
  location: {
    isAtAirport: boolean;
    airport: string;
    terminal: string;
    cluster: string;
    method: 'GPS' | 'WIFI' | 'DEFAULT';
    confidence: number;
  };
  phase: 'departure' | 'transit' | 'arrival' | 'exploring' | 'unknown';
  userState: {
    energy: 'exhausted' | 'tired' | 'neutral' | 'active' | 'energetic';
    timeAvailable: 'rushed' | 'moderate' | 'leisurely';
    hasAsked: boolean;
  };
  timeContext: {
    greeting: string;
    timeSlot: 'early_morning' | 'morning' | 'midday' | 'afternoon' | 'evening' | 'late_night';
  };
  vibeOrder: string[];
  featuredCollections: string[];
  setPhase: (phase: JourneyContext['phase']) => void;
  setUserEnergy: (energy: JourneyContext['userState']['energy']) => void;
  setTimeAvailable: (time: JourneyContext['userState']['timeAvailable']) => void;
  refreshLocation: () => Promise<void>;
  setManualTerminal: (terminal: string) => void;
}

// Create context with undefined as initial value
const SimpleJourneyContext = createContext<JourneyContext | undefined>(undefined);

// Hook to use journey context
export const useSimpleJourneyContext = () => {
  const context = useContext(SimpleJourneyContext);
  if (!context) {
    throw new Error('useSimpleJourneyContext must be used within SimpleJourneyContextProvider');
  }
  return context;
};

// Provider component
export const SimpleJourneyContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // State management
  const [location, setLocation] = useState<JourneyContext['location']>({
    isAtAirport: true,
    airport: 'SIN',
    terminal: 'T3',
    cluster: 'Central',
    method: 'DEFAULT',
    confidence: 85
  });

  const [phase, setPhase] = useState<JourneyContext['phase']>('departure');
  const [userState, setUserState] = useState<JourneyContext['userState']>({
    energy: 'active',
    timeAvailable: 'moderate',
    hasAsked: false
  });

  const [timeContext, setTimeContext] = useState<JourneyContext['timeContext']>({
    greeting: 'Welcome to Changi Airport',
    timeSlot: 'midday'
  });

  // Vibe ordering and featured collections
  const [vibeOrder] = useState<string[]>([
    'comfort', 'refuel', 'quick', 'shop', 'chill', 'work', 'explore'
  ]);

  const [featuredCollections] = useState<string[]>([
    'hawker-heaven', 'lounge-life', 'jewel-discovery'
  ]);

  // Update time context based on current time
  useEffect(() => {
    const updateTimeContext = () => {
      const hour = new Date().getHours();
      let timeSlot: JourneyContext['timeContext']['timeSlot'];
      let greeting: string;

      if (hour >= 5 && hour < 9) {
        timeSlot = 'early_morning';
        greeting = `Good morning from ${location.terminal}`;
      } else if (hour >= 9 && hour < 12) {
        timeSlot = 'morning';
        greeting = `Good morning from ${location.terminal}`;
      } else if (hour >= 12 && hour < 15) {
        timeSlot = 'midday';
        greeting = `Good afternoon from ${location.terminal}`;
      } else if (hour >= 15 && hour < 18) {
        timeSlot = 'afternoon';
        greeting = `Good afternoon from ${location.terminal}`;
      } else if (hour >= 18 && hour < 22) {
        timeSlot = 'evening';
        greeting = `Good evening from ${location.terminal}`;
      } else {
        timeSlot = 'late_night';
        greeting = `Good night from ${location.terminal}`;
      }

      setTimeContext({ greeting, timeSlot });
    };

    updateTimeContext();
    const interval = setInterval(updateTimeContext, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [location.terminal]);

  // Refresh location using LocationDetectionService
  const refreshLocation = useCallback(async () => {
    try {
      const result = await LocationDetectionService.detectLocation();
      setLocation({
        isAtAirport: result.isAtAirport,
        airport: result.airport || 'SIN',
        terminal: result.terminal || 'T3',
        cluster: result.cluster || 'Central',
        method: result.method || 'DEFAULT',
        confidence: result.confidence || 85
      });
    } catch (error) {
      console.error('Failed to refresh location:', error);
      // Keep current location on error
    }
  }, []);

  // Set manual terminal
  const setManualTerminal = useCallback((terminal: string) => {
    setLocation(prev => ({
      ...prev,
      terminal,
      method: 'DEFAULT',
      confidence: 100
    }));
  }, []);

  // Context value
  const contextValue: JourneyContext = {
    location,
    phase,
    userState,
    timeContext,
    vibeOrder,
    featuredCollections,
    setPhase,
    setUserEnergy: (energy) => setUserState(prev => ({ ...prev, energy })),
    setTimeAvailable: (timeAvailable) => setUserState(prev => ({ ...prev, timeAvailable })),
    refreshLocation,
    setManualTerminal
  };

  return (
    <SimpleJourneyContext.Provider value={contextValue}>
      {children}
    </SimpleJourneyContext.Provider>
  );
};
