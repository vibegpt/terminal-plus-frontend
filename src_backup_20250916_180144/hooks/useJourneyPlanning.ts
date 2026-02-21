import { useState } from 'react';
import type { AmenityLocation } from '../types/amenity.types';

function getMinutesToBoarding(journey: any): number | null {
  if (!journey?.departure_time) return null;
  const now = new Date();
  const dep = new Date(journey.departure_time);
  return Math.round((dep.getTime() - now.getTime()) / 60000);
}

function isNearGate(amenity: AmenityLocation, gate: string): boolean {
  if (!gate || !amenity.location) return false;
  // Simple string match for gate number in location
  return amenity.location.toLowerCase().includes(gate.toLowerCase());
}

export function useJourneyPlanning(amenities: AmenityLocation[]) {
  // In a real app, currentJourney would come from context or props
  const [currentJourney, setCurrentJourney] = useState<any>(() => {
    let data = null;
    if (typeof window !== 'undefined') {
      data = sessionStorage.getItem('tempJourneyData') || localStorage.getItem('lastJourneyData');
      if (data) return JSON.parse(data);
    }
    return null;
  });
  const [isPlanning, setIsPlanning] = useState(false);

  const getRecommendations = (n: number) => {
    if (!currentJourney) return amenities.slice(0, n);
    const { terminal, selected_vibe, gate, departure_time } = currentJourney;
    let filtered = amenities;
    // 1. Filter by terminal
    if (terminal) {
      filtered = filtered.filter(a => a.terminal && a.terminal.toLowerCase() === terminal.toLowerCase());
    }
    // 2. Filter by vibe
    if (selected_vibe) {
      filtered = filtered.filter(a =>
        a.tags && a.tags.map((t: string) => t.toLowerCase()).includes(selected_vibe.toLowerCase())
      );
    }
    // 3. If 30 min or less to boarding, filter by proximity to gate
    const minsToBoarding = getMinutesToBoarding(currentJourney);
    if (minsToBoarding !== null && minsToBoarding <= 30 && gate) {
      filtered = filtered.filter(a => isNearGate(a, gate));
    }
    // Return top N
    return filtered.slice(0, n);
  };

  return {
    currentJourney,
    isPlanning,
    getRecommendations,
    setCurrentJourney,
    setIsPlanning,
  };
} 