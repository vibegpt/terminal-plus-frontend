// Hook for managing boarding time and flight status across the app
import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { BoardingStatus, getBoardingStatus } from '../utils/getBoardingStatus';

export interface FlightInfo {
  flightNumber?: string;
  departureTime?: number; // timestamp
  boardingTime?: number; // timestamp
  gate?: string;
  terminal?: string;
  isDelayed?: boolean;
  delayMinutes?: number;
}

export interface BoardingContext {
  flightInfo: FlightInfo | null;
  boardingStatus: BoardingStatus;
  timeUntilBoarding: number | null; // in minutes
  setFlightInfo: (info: FlightInfo | null) => void;
  simulateBoardingTime: (minutesUntilBoarding: number) => void;
  clearFlightInfo: () => void;
}

// Create context
const BoardingContextInstance = createContext<BoardingContext | undefined>(undefined);

// Provider component
export function BoardingProvider({ children }: { children: React.ReactNode }) {
  const [flightInfo, setFlightInfo] = useState<FlightInfo | null>(null);
  const [boardingStatus, setBoardingStatus] = useState<BoardingStatus>('normal');
  const [timeUntilBoarding, setTimeUntilBoarding] = useState<number | null>(null);

  // Update boarding status when flight info changes
  useEffect(() => {
    const updateStatus = () => {
      if (flightInfo?.boardingTime) {
        const status = getBoardingStatus(flightInfo.boardingTime);
        setBoardingStatus(status);
        
        // Calculate time until boarding
        const now = Date.now();
        const timeInMinutes = Math.floor((flightInfo.boardingTime - now) / 60000);
        setTimeUntilBoarding(timeInMinutes > 0 ? timeInMinutes : 0);
      } else {
        setBoardingStatus('normal');
        setTimeUntilBoarding(null);
      }
    };

    updateStatus();
    const interval = setInterval(updateStatus, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [flightInfo]);

  // Simulate boarding time (for demo/testing)
  const simulateBoardingTime = useCallback((minutesUntilBoarding: number) => {
    const boardingTime = Date.now() + (minutesUntilBoarding * 60000);
    const departureTime = boardingTime + (30 * 60000); // Departure 30 mins after boarding
    
    setFlightInfo({
      flightNumber: 'DEMO123',
      boardingTime,
      departureTime,
      gate: 'A23',
      terminal: 'T3',
      isDelayed: minutesUntilBoarding > 180,
      delayMinutes: minutesUntilBoarding > 180 ? minutesUntilBoarding - 120 : 0
    });
  }, []);

  // Clear flight info
  const clearFlightInfo = useCallback(() => {
    setFlightInfo(null);
  }, []);

  const value: BoardingContext = {
    flightInfo,
    boardingStatus,
    timeUntilBoarding,
    setFlightInfo,
    simulateBoardingTime,
    clearFlightInfo
  };

  return (
    <BoardingContextInstance.Provider value={value}>
      {children}
    </BoardingContextInstance.Provider>
  );
}

// Hook to use boarding context
export function useBoardingContext() {
  const context = useContext(BoardingContextInstance);
  if (context === undefined) {
    throw new Error('useBoardingContext must be used within a BoardingProvider');
  }
  return context;
}

// Standalone hook for components that don't need full context
export function useBoardingStatus(boardingTime?: number): {
  status: BoardingStatus;
  timeUntilBoarding: number | null;
  message: string;
} {
  const [status, setStatus] = useState<BoardingStatus>('normal');
  const [timeUntilBoarding, setTimeUntilBoarding] = useState<number | null>(null);

  useEffect(() => {
    const updateStatus = () => {
      if (boardingTime) {
        const currentStatus = getBoardingStatus(boardingTime);
        setStatus(currentStatus);
        
        const now = Date.now();
        const timeInMinutes = Math.floor((boardingTime - now) / 60000);
        setTimeUntilBoarding(timeInMinutes > 0 ? timeInMinutes : 0);
      } else {
        setStatus('normal');
        setTimeUntilBoarding(null);
      }
    };

    updateStatus();
    const interval = setInterval(updateStatus, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [boardingTime]);

  // Get contextual message
  const getMessage = (): string => {
    if (!timeUntilBoarding) return '';
    
    switch (status) {
      case 'rush':
        return `⚡ Board in ${timeUntilBoarding} minutes!`;
      case 'imminent':
        return `🍔 ${timeUntilBoarding} minutes - grab something quick`;
      case 'soon':
        return `😌 ${timeUntilBoarding} minutes to relax`;
      case 'normal':
        return `💼 ${Math.floor(timeUntilBoarding / 60)}h ${timeUntilBoarding % 60}m until boarding`;
      case 'extended':
        return `🔍 ${Math.floor(timeUntilBoarding / 60)}+ hours to explore`;
      default:
        return '';
    }
  };

  return {
    status,
    timeUntilBoarding,
    message: getMessage()
  };
}