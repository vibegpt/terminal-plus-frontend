import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getBoardingStatus, BoardingStatus } from '../utils/getBoardingStatus';

interface Flight {
  number: string;
  departure: {
    airport: string;
    terminal: string;
    gate?: string;
    time: Date;
    status: 'on-time' | 'delayed' | 'cancelled';
  };
  arrival: {
    airport: string;
    time: Date;
  };
  boardingTime?: Date;
  delay?: number; // in minutes
}

interface FlightContextType {
  flight: Flight | null;
  setFlight: (flight: Flight | null) => void;
  boardingStatus: BoardingStatus | null;
  timeToBoarding: number | null; // in minutes
  isDelayed: boolean;
  delayMinutes: number;
  statusMessage: string;
  clearFlight: () => void;
}

const FlightContext = createContext<FlightContextType | undefined>(undefined);

export const useFlightContext = () => {
  const context = useContext(FlightContext);
  if (!context) {
    throw new Error('useFlightContext must be used within FlightProvider');
  }
  return context;
};

interface FlightProviderProps {
  children: ReactNode;
}

export const FlightProvider: React.FC<FlightProviderProps> = ({ children }) => {
  const [flight, setFlight] = useState<Flight | null>(() => {
    // Try to load from localStorage
    const saved = localStorage.getItem('terminal-plus-flight');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Convert date strings back to Date objects
        if (parsed.departure?.time) {
          parsed.departure.time = new Date(parsed.departure.time);
        }
        if (parsed.arrival?.time) {
          parsed.arrival.time = new Date(parsed.arrival.time);
        }
        if (parsed.boardingTime) {
          parsed.boardingTime = new Date(parsed.boardingTime);
        }
        return parsed;
      } catch (e) {
        console.error('Error parsing saved flight:', e);
      }
    }
    return null;
  });
  
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute
    
    return () => clearInterval(timer);
  }, []);
  
  // Save flight to localStorage whenever it changes
  useEffect(() => {
    if (flight) {
      localStorage.setItem('terminal-plus-flight', JSON.stringify(flight));
    } else {
      localStorage.removeItem('terminal-plus-flight');
    }
  }, [flight]);
  
  // Calculate derived values
  const calculateDerivedValues = (): {
    boardingStatus: BoardingStatus | null;
    timeToBoarding: number | null;
    isDelayed: boolean;
    delayMinutes: number;
    statusMessage: string;
  } => {
    if (!flight) {
      return {
        boardingStatus: null,
        timeToBoarding: null,
        isDelayed: false,
        delayMinutes: 0,
        statusMessage: ''
      };
    }
    
    const boardingTime = flight.boardingTime || 
                        new Date(flight.departure.time.getTime() - 30 * 60000); // Default: 30 min before departure
    
    const now = currentTime.getTime();
    const boardingMs = boardingTime.getTime();
    const timeToBoarding = Math.floor((boardingMs - now) / 60000); // in minutes
    
    const boardingStatus = getBoardingStatus(boardingMs);
    const isDelayed = flight.departure.status === 'delayed';
    const delayMinutes = flight.delay || 0;
    
    let statusMessage = '';
    if (isDelayed) {
      statusMessage = `✈️ ${delayMinutes} min delay`;
    } else if (timeToBoarding > 0 && timeToBoarding <= 20) {
      statusMessage = '⚡ Boarding soon!';
    } else if (timeToBoarding > 20 && timeToBoarding <= 45) {
      statusMessage = '🕐 Head to gate soon';
    }
    
    return {
      boardingStatus,
      timeToBoarding,
      isDelayed,
      delayMinutes,
      statusMessage
    };
  };
  
  const clearFlight = () => {
    setFlight(null);
    localStorage.removeItem('terminal-plus-flight');
  };
  
  const derived = calculateDerivedValues();
  
  return (
    <FlightContext.Provider 
      value={{
        flight,
        setFlight,
        clearFlight,
        ...derived
      }}
    >
      {children}
    </FlightContext.Provider>
  );
};

/**
 * Hook to simulate flight status for testing
 */
export const useSimulatedFlight = (enabled: boolean = false) => {
  const { setFlight } = useFlightContext();
  
  useEffect(() => {
    if (enabled) {
      // Simulate a flight with various scenarios
      const scenarios = [
        { // Rush scenario
          boardingOffset: 10, // 10 minutes to boarding
          status: 'on-time' as const,
          delay: 0
        },
        { // Imminent scenario
          boardingOffset: 30, // 30 minutes to boarding
          status: 'on-time' as const,
          delay: 0
        },
        { // Soon scenario
          boardingOffset: 60, // 60 minutes to boarding
          status: 'on-time' as const,
          delay: 0
        },
        { // Normal scenario
          boardingOffset: 120, // 2 hours to boarding
          status: 'on-time' as const,
          delay: 0
        },
        { // Extended delay scenario
          boardingOffset: 240, // 4 hours due to delay
          status: 'delayed' as const,
          delay: 180
        }
      ];
      
      // Pick a random scenario or cycle through them
      const scenario = scenarios[Math.floor(Date.now() / 60000) % scenarios.length];
      
      const now = new Date();
      const boardingTime = new Date(now.getTime() + scenario.boardingOffset * 60000);
      const departureTime = new Date(boardingTime.getTime() + 30 * 60000); // 30 min after boarding
      
      setFlight({
        number: 'SQ123',
        departure: {
          airport: 'SIN',
          terminal: 'T3',
          gate: 'A12',
          time: departureTime,
          status: scenario.status
        },
        arrival: {
          airport: 'LHR',
          time: new Date(departureTime.getTime() + 13 * 60 * 60000) // 13 hour flight
        },
        boardingTime,
        delay: scenario.delay
      });
    }
  }, [enabled, setFlight]);
};