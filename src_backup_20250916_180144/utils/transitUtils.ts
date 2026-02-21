// transitUtils.ts - Transit journey planning and timeline logic
// Used in: Transit planning, multi-airport journeys

import type { JourneyData, JourneyStep, TripSegment } from '@/types/journey.types';
import type { Amenity } from '@/types/amenity.types';

// Transit plan generation
export const generateTransitPlan = async (
  journeyData: JourneyData,
  amenities: Amenity[],
  maxStops: number = 5
): Promise<{
  stops: Amenity[];
  timeline: JourneyStep[];
  totalDuration: number;
}> => {
  // Simplified transit plan generation
  const stops = amenities.slice(0, maxStops);
  const timeline: JourneyStep[] = [];
  
  let currentTime = new Date();
  let totalDuration = 0;
  
  stops.forEach((amenity, index) => {
    const duration = 30; // Default 30 minutes per stop
    const step: JourneyStep = {
      id: `step-${index}`,
      airport: journeyData.layover || '',
      terminal: journeyData.terminal,
      arrivalTime: currentTime.toISOString(),
      departureTime: new Date(currentTime.getTime() + duration * 60000).toISOString(),
      duration,
      type: 'transit',
      amenities: [amenity]
    };
    
    timeline.push(step);
    currentTime = new Date(currentTime.getTime() + duration * 60000);
    totalDuration += duration;
  });
  
  return {
    stops,
    timeline,
    totalDuration
  };
};

// Timeline utilities
export const createTimelineFromSteps = (steps: JourneyStep[]): JourneyStep[] => {
  return steps.map((step, index) => ({
    ...step,
    id: `timeline-${index}`,
    type: index === 0 ? 'departure' : index === steps.length - 1 ? 'arrival' : 'transit'
  }));
};

export const calculateTotalJourneyTime = (segments: TripSegment[]): number => {
  return segments.reduce((total, segment) => total + segment.duration, 0);
};

export const getNextDepartureTime = (currentStep: JourneyStep): Date | null => {
  if (!currentStep.departureTime) return null;
  return new Date(currentStep.departureTime);
};

export const isTransitRequired = (journeyData: JourneyData): boolean => {
  return !!journeyData.layover && journeyData.layover !== journeyData.from;
};

export const getTransitDuration = (arrivalTime: string, departureTime: string): number => {
  const arrival = new Date(arrivalTime);
  const departure = new Date(departureTime);
  return Math.round((departure.getTime() - arrival.getTime()) / (1000 * 60));
};

// Multi-airport journey helpers
export const createMultiAirportTimeline = (segments: TripSegment[]): JourneyStep[] => {
  return segments.map((segment, index) => ({
    id: `segment-${index}`,
    airport: segment.from,
    terminal: segment.terminal,
    arrivalTime: segment.arrivalTime,
    departureTime: segment.departureTime,
    duration: segment.duration,
    type: index === 0 ? 'departure' : index === segments.length - 1 ? 'arrival' : 'transit'
  }));
};

export const validateTransitPlan = (plan: {
  stops: Amenity[];
  timeline: JourneyStep[];
  totalDuration: number;
}): boolean => {
  return plan.stops.length > 0 && 
         plan.timeline.length > 0 && 
         plan.totalDuration > 0;
}; 