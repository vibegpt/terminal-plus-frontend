// Flight types for Terminal+ multi-segment flight intelligence

export interface FlightSegment {
  segment: number;
  route: string;
  departure: {
    airport: string;
    terminal: string;
    time: string;
    gate?: string;
    scheduled?: string;
    estimated?: string;
  };
  arrival: {
    airport: string;
    terminal: string;
    time: string;
    gate?: string;
    scheduled?: string;
    estimated?: string;
  };
  duration: string;
  aircraft?: string;
}

export interface MultiSegmentFlight {
  flightNumber: string;
  operatingDate: string;
  segments: FlightSegment[];
  totalJourneyTime: string;
  isMultiSegment: boolean;
  status?: 'scheduled' | 'active' | 'landed' | 'cancelled' | 'incident' | 'diverted';
}

export interface GPSLocation {
  airport: string | null;
  isAtAirport: boolean;
  coordinates?: { lat: number; lng: number };
  accuracy?: number;
  timestamp?: Date;
}

export interface JourneyScope {
  type: 'current-segment' | 'full-journey';
  segments: FlightSegment[];
  currentSegment?: FlightSegment;
  layoverDetails?: LayoverDetails[];
}

export interface LayoverDetails {
  airport: string;
  terminal: string;
  duration: string;
  transitRequired: boolean;
}

export interface FlightStatus {
  status: 'scheduled' | 'active' | 'landed' | 'cancelled' | 'incident' | 'diverted';
  delay?: number;
  gate?: string;
  terminal?: string;
  estimatedTime?: string;
}

export interface TransitRequirements {
  transitRequired: boolean;
  terminalChanges: string[];
  visaRequirements: string[];
}

export interface AirportInfo {
  name: string;
  city: string;
  country: string;
  timezone: string;
  terminals: string[];
}

// Journey Context Types
export type UserMode = 'BASIC' | 'SMART' | 'FULL';

export interface TimeContext {
  timeUntilBoarding: number;
  timeUntilDeparture: number;
  boardingTime: Date | null;
  lastUpdated: Date | null;
}

export interface UserPreferences {
  selectedVibe?: string;
  layoverPreferences?: string[];
  accessibilityNeeds?: string[];
  notificationPreferences?: {
    gateChanges: boolean;
    boardingAlerts: boolean;
    delayUpdates: boolean;
  };
}

export interface SmartJourneyContext {
  flightData: MultiSegmentFlight;
  journeyScope: JourneyScope;
  gpsLocation: GPSLocation;
  userMode: UserMode;
  timeContext: TimeContext;
  preferences?: UserPreferences;
  timestamp: string;
}

export interface FlightServiceError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
} 