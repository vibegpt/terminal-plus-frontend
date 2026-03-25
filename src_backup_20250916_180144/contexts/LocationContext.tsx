// src/contexts/LocationContext.tsx
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

// Types
interface LocationData {
  currentAirport: string | null;
  currentTerminal: string | null;
  currentGate: string | null;
  nearbyAmenities: AmenityData[];
  timeToBoarding: number | null; // in minutes
  flightStatus: 'on-time' | 'delayed' | 'boarding' | 'departed' | null;
  localTime: Date;
  walkingPace: 'slow' | 'normal' | 'fast';
  timeConstraints: 'urgent' | 'moderate' | 'relaxed';
  crowdLevel: 'low' | 'medium' | 'high';
  coordinates: { lat: number; lng: number } | null;
}

interface AmenityData {
  id: string;
  name: string;
  type: string;
  distance: number; // in meters
  walkingTime: number; // in minutes
  crowdLevel: number; // 1-10
}

interface LocationContextType extends LocationData {
  updateLocation: (location: Partial<LocationData>) => void;
  calculateWalkingTime: (distance: number) => number;
  detectAirport: () => Promise<void>;
  syncFlightData: (flightNumber?: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

// Create context
const LocationContext = createContext<LocationContextType | null>(null);

// Provider component
export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locationData, setLocationData] = useState<LocationData>({
    currentAirport: null,
    currentTerminal: null,
    currentGate: null,
    nearbyAmenities: [],
    timeToBoarding: null,
    flightStatus: null,
    localTime: new Date(),
    walkingPace: 'normal',
    timeConstraints: 'moderate',
    crowdLevel: 'medium',
    coordinates: null
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update location data
  const updateLocation = useCallback((update: Partial<LocationData>) => {
    setLocationData(prev => ({ ...prev, ...update }));
  }, []);

  // Calculate walking time based on distance and pace
  const calculateWalkingTime = useCallback((distance: number): number => {
    const baseSpeed = 80; // meters per minute (average walking speed)
    const paceMultiplier = {
      slow: 0.7,
      normal: 1.0,
      fast: 1.3
    };
    
    const speed = baseSpeed * paceMultiplier[locationData.walkingPace];
    return Math.ceil(distance / speed);
  }, [locationData.walkingPace]);

  // Detect airport based on GPS coordinates
  const detectAirport = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (!('geolocation' in navigator)) {
        throw new Error('Geolocation not supported');
      }

      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 30000
        });
      });

      const { latitude, longitude } = position.coords;
      updateLocation({ coordinates: { lat: latitude, lng: longitude } });

      // For now, mock the airport detection
      // In production, this would call your API
      console.log('Detected location:', latitude, longitude);
      
      // Mock data for testing
      updateLocation({
        currentAirport: 'SIN',
        currentTerminal: 'T3',
        nearbyAmenities: []
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to detect airport');
      console.error('Airport detection error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [updateLocation]);

  // Sync flight data
  const syncFlightData = useCallback(async (flightNumber?: string) => {
    // Mock implementation for now
    console.log('Syncing flight data for:', flightNumber);
    
    // Set mock data for testing
    updateLocation({
      currentGate: 'G23',
      timeToBoarding: 45,
      flightStatus: 'on-time',
      timeConstraints: 'moderate'
    });
  }, [updateLocation]);

  // Helper function to determine time constraints
  const getTimeConstraints = (minutes: number | null): 'urgent' | 'moderate' | 'relaxed' => {
    if (!minutes) return 'moderate';
    if (minutes < 20) return 'urgent';
    if (minutes < 45) return 'moderate';
    return 'relaxed';
  };

  // Watch position changes
  useEffect(() => {
    if ('geolocation' in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          updateLocation({
            coordinates: {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            }
          });
        },
        (error) => {
          console.error('Location watch error:', error);
        },
        {
          enableHighAccuracy: true,
          maximumAge: 30000,
          timeout: 27000
        }
      );

      return () => {
        navigator.geolocation.clearWatch(watchId);
      };
    }
  }, [updateLocation]);

  // Update local time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      updateLocation({ localTime: new Date() });
      
      // Update time to boarding if set
      if (locationData.timeToBoarding !== null && locationData.timeToBoarding > 0) {
        const newTime = locationData.timeToBoarding - 1;
        updateLocation({
          timeToBoarding: newTime,
          timeConstraints: getTimeConstraints(newTime)
        });
      }
    }, 60000); // Every minute

    return () => clearInterval(timer);
  }, [locationData.timeToBoarding, updateLocation]);

  // Auto-detect airport on mount
  useEffect(() => {
    detectAirport();
    syncFlightData();
  }, []);

  const contextValue: LocationContextType = {
    ...locationData,
    updateLocation,
    calculateWalkingTime,
    detectAirport,
    syncFlightData,
    isLoading,
    error
  };

  return (
    <LocationContext.Provider value={contextValue}>
      {children}
    </LocationContext.Provider>
  );
};

// Custom hook to use location context
export function useLocation() {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within LocationProvider');
  }
  return context;
}

// Export types
export type { LocationData, AmenityData, LocationContextType };
