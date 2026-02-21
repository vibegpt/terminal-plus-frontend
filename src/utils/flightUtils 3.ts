// flightUtils.ts - Flight-related utilities and status checks
// Used in: Flight tracking, boarding status, duration calculations

import type { JourneyData } from '@/types/journey.types';

// Boarding status and urgency logic
export const getBoardingStatus = (boardingTime: string | null | undefined): {
  status: 'boarding' | 'soon' | 'waiting' | 'delayed' | 'unknown';
  urgency: 'high' | 'medium' | 'low';
  minutesUntilBoarding: number;
} => {
  if (!boardingTime) {
    return {
      status: 'unknown',
      urgency: 'low',
      minutesUntilBoarding: 0
    };
  }

  const now = new Date();
  const boarding = new Date(boardingTime);
  const minutesUntilBoarding = Math.round((boarding.getTime() - now.getTime()) / (1000 * 60));

  if (minutesUntilBoarding < 0) {
    return {
      status: 'delayed',
      urgency: 'high',
      minutesUntilBoarding: Math.abs(minutesUntilBoarding)
    };
  }

  if (minutesUntilBoarding <= 10) {
    return {
      status: 'boarding',
      urgency: 'high',
      minutesUntilBoarding
    };
  }

  if (minutesUntilBoarding <= 30) {
    return {
      status: 'soon',
      urgency: 'medium',
      minutesUntilBoarding
    };
  }

  return {
    status: 'waiting',
    urgency: 'low',
    minutesUntilBoarding
  };
};

// Flight duration calculations
export const getFlightDuration = async (
  flightNumber: string,
  date?: string
): Promise<number> => {
  try {
    // Mock API call - replace with actual flight API
    const response = await fetch(`/api/flights/${flightNumber}?date=${date || new Date().toISOString()}`);
    const data = await response.json();
    return data.duration || 120; // Default 2 hours
  } catch (error) {
    console.warn('Failed to fetch flight duration, using default:', error);
    return 120; // Default fallback
  }
};

export const calculateFlightDuration = (
  departureTime: string,
  arrivalTime: string
): number => {
  const departure = new Date(departureTime);
  const arrival = new Date(arrivalTime);
  return Math.round((arrival.getTime() - departure.getTime()) / (1000 * 60));
};

// Flight status checks
export const isFlightDelayed = (scheduledTime: string, actualTime?: string): boolean => {
  if (!actualTime) return false;
  const scheduled = new Date(scheduledTime);
  const actual = new Date(actualTime);
  return actual > scheduled;
};

export const getFlightStatus = (journeyData: JourneyData): {
  status: 'scheduled' | 'boarding' | 'departed' | 'arrived' | 'delayed' | 'cancelled';
  isOnTime: boolean;
  delayMinutes?: number;
} => {
  const now = new Date();
  const departureTime = journeyData.departure_time ? new Date(journeyData.departure_time) : null;
  
  if (!departureTime) {
    return {
      status: 'scheduled',
      isOnTime: true
    };
  }

  const minutesUntilDeparture = Math.round((departureTime.getTime() - now.getTime()) / (1000 * 60));

  if (minutesUntilDeparture < -30) {
    return {
      status: 'departed',
      isOnTime: true
    };
  }

  if (minutesUntilDeparture < 0) {
    return {
      status: 'boarding',
      isOnTime: false,
      delayMinutes: Math.abs(minutesUntilDeparture)
    };
  }

  if (minutesUntilDeparture <= 30) {
    return {
      status: 'boarding',
      isOnTime: true
    };
  }

  return {
    status: 'scheduled',
    isOnTime: true
  };
};

// Time zone and scheduling helpers
export const adjustForTimezone = (time: string, timezoneOffset: number): Date => {
  const date = new Date(time);
  return new Date(date.getTime() + timezoneOffset * 60 * 1000);
};

export const formatFlightTime = (time: string): string => {
  return new Date(time).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

export const getTimeUntilFlight = (departureTime: string): {
  hours: number;
  minutes: number;
  totalMinutes: number;
} => {
  const now = new Date();
  const departure = new Date(departureTime);
  const totalMinutes = Math.round((departure.getTime() - now.getTime()) / (1000 * 60));
  
  return {
    hours: Math.floor(totalMinutes / 60),
    minutes: totalMinutes % 60,
    totalMinutes
  };
}; 