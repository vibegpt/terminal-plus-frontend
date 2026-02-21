// services/flightService.ts - Real flight API integration with multi-segment support
import { FlightSegment, MultiSegmentFlight, FlightStatus, TransitRequirements, AirportInfo } from '../types/flight.types';

// Flight API configuration
const FLIGHT_API_CONFIG = {
  // Replace with your actual flight API endpoints
  baseUrl: import.meta.env.VITE_FLIGHT_API_BASE_URL || 'https://api.aviationstack.com/v1',
  apiKey: import.meta.env.VITE_FLIGHT_API_KEY || '',
  
  // Alternative APIs you can integrate:
  // FlightAware: https://aeroapi.flightaware.com/aeroapi
  // SITA: https://www.sita.aero/solutions/air-transport/operations/flight-information/
  // OAG: https://www.oag.com/flight-info-api
};

interface FlightAPIResponse {
  pagination: {
    limit: number;
    offset: number;
    count: number;
    total: number;
  };
  data: {
    flight_date: string;
    flight_status: string;
    departure: {
      airport: string;
      timezone: string;
      iata: string;
      icao: string;
      terminal: string;
      gate: string;
      scheduled: string;
      estimated: string;
      actual: string;
    };
    arrival: {
      airport: string;
      timezone: string;
      iata: string;
      icao: string;
      terminal: string;
      gate: string;
      scheduled: string;
      estimated: string;
      actual: string;
    };
    airline: {
      name: string;
      iata: string;
      icao: string;
    };
    flight: {
      number: string;
      iata: string;
      icao: string;
      codeshared?: {
        airline_name: string;
        airline_iata: string;
        flight_number: string;
        flight_iata: string;
      };
    };
    aircraft?: {
      registration: string;
      iata: string;
      icao: string;
      icao24: string;
    };
  }[];
}

// Multi-segment flight patterns for major routes
const KNOWN_MULTI_SEGMENT_ROUTES: Record<string, FlightSegment[]> = {
  'QF1': [
    {
      segment: 1,
      route: 'SYD → SIN',
      departure: {
        airport: 'SYD',
        terminal: 'T1',
        time: '22:35',
        gate: 'Gate 15'
      },
      arrival: {
        airport: 'SIN',
        terminal: 'T1', 
        time: '04:25+1'
      },
      duration: '8h 50m',
      aircraft: 'A380'
    },
    {
      segment: 2,
      route: 'SIN → LHR',
      departure: {
        airport: 'SIN',
        terminal: 'T1',
        time: '08:15'
      },
      arrival: {
        airport: 'LHR',
        terminal: 'T5',
        time: '14:35'
      },
      duration: '13h 20m',
      aircraft: 'A350'
    }
  ],
  'SQ25': [
    {
      segment: 1,
      route: 'SIN → SYD',
      departure: {
        airport: 'SIN',
        terminal: 'T3',
        time: '09:55'
      },
      arrival: {
        airport: 'SYD',
        terminal: 'T1',
        time: '19:50'
      },
      duration: '7h 55m',
      aircraft: 'A350'
    }
  ],
  'BA15': [
    {
      segment: 1,
      route: 'LHR → SIN',
      departure: {
        airport: 'LHR',
        terminal: 'T5',
        time: '21:45'
      },
      arrival: {
        airport: 'SIN',
        terminal: 'T1',
        time: '17:35+1'
      },
      duration: '12h 50m',
      aircraft: 'A380'
    },
    {
      segment: 2,
      route: 'SIN → SYD',
      departure: {
        airport: 'SIN',
        terminal: 'T1',
        time: '22:30'
      },
      arrival: {
        airport: 'SYD',
        terminal: 'T1',
        time: '09:25+1'
      },
      duration: '7h 55m',
      aircraft: 'A380'
    }
  ]
};

class FlightService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = FLIGHT_API_CONFIG.apiKey;
    this.baseUrl = FLIGHT_API_CONFIG.baseUrl;
  }

  // Main flight lookup with multi-segment intelligence
  async fetchFlightInfo(
    flightNumber: string,
    date: string,
    originHint?: string
  ): Promise<MultiSegmentFlight> {
    try {
      // First, check if this is a known multi-segment route
      const knownRoute = this.getKnownMultiSegmentRoute(flightNumber, originHint);
      if (knownRoute) {
        return this.buildMultiSegmentResponse(flightNumber, date, knownRoute);
      }

      // Fall back to API lookup
      const apiResponse = await this.callFlightAPI(flightNumber, date);
      return this.parseFlightAPIResponse(apiResponse, flightNumber, date);

    } catch (error) {
      console.error('Flight lookup failed:', error);
      throw new Error(`Flight ${flightNumber} not found for ${date}`);
    }
  }

  // Get known multi-segment route based on flight number and origin
  private getKnownMultiSegmentRoute(
    flightNumber: string,
    originHint?: string
  ): FlightSegment[] | null {
    const upperFlightNumber = flightNumber.toUpperCase();
    const knownSegments = KNOWN_MULTI_SEGMENT_ROUTES[upperFlightNumber];
    
    if (!knownSegments) return null;

    // If we have an origin hint, filter segments starting from that airport
    if (originHint) {
      const relevantSegments = knownSegments.filter(segment => 
        segment.departure.airport === originHint.toUpperCase()
      );
      
      if (relevantSegments.length > 0) {
        // Find the segment and return it plus any following segments
        const startIndex = knownSegments.findIndex(segment => 
          segment.departure.airport === originHint.toUpperCase()
        );
        
        if (startIndex !== -1) {
          return knownSegments.slice(startIndex);
        }
      }
    }

    return knownSegments;
  }

  // Build multi-segment response from known route data
  private buildMultiSegmentResponse(
    flightNumber: string,
    date: string,
    segments: FlightSegment[]
  ): MultiSegmentFlight {
    const totalDurationMinutes = segments.reduce((total, segment) => {
      return total + this.parseDuration(segment.duration);
    }, 0);

    return {
      flightNumber: flightNumber.toUpperCase(),
      operatingDate: date,
      isMultiSegment: segments.length > 1,
      totalJourneyTime: this.formatDuration(totalDurationMinutes),
      segments: segments.map(segment => ({
        ...segment,
        departure: {
          ...segment.departure,
          // Add current date context
          scheduled: `${date}T${segment.departure.time.replace('+1', '')}`
        },
        arrival: {
          ...segment.arrival,
          scheduled: `${date}T${segment.arrival.time.replace('+1', '')}`
        }
      }))
    };
  }

  // Call external flight API (Aviation Stack example)
  private async callFlightAPI(
    flightNumber: string,
    date: string
  ): Promise<FlightAPIResponse> {
    if (!this.apiKey) {
      throw new Error('Flight API key not configured');
    }

    const url = new URL(`${this.baseUrl}/flights`);
    url.searchParams.set('access_key', this.apiKey);
    url.searchParams.set('flight_iata', flightNumber.toUpperCase());
    url.searchParams.set('flight_date', date);

    const response = await fetch(url.toString());
    
    if (!response.ok) {
      throw new Error(`Flight API error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }

  // Parse external API response into our format
  private parseFlightAPIResponse(
    apiResponse: FlightAPIResponse,
    flightNumber: string,
    date: string
  ): MultiSegmentFlight {
    if (!apiResponse.data || apiResponse.data.length === 0) {
      throw new Error(`No flights found for ${flightNumber} on ${date}`);
    }

    const flightData = apiResponse.data[0];

    // Convert API response to our segment format
    const segment: FlightSegment = {
      segment: 1,
      route: `${flightData.departure.iata} → ${flightData.arrival.iata}`,
      departure: {
        airport: flightData.departure.iata,
        terminal: flightData.departure.terminal || 'TBD',
        time: new Date(flightData.departure.scheduled).toLocaleTimeString('en-GB', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit'
        }),
        gate: flightData.departure.gate
      },
      arrival: {
        airport: flightData.arrival.iata,
        terminal: flightData.arrival.terminal || 'TBD',
        time: new Date(flightData.arrival.scheduled).toLocaleTimeString('en-GB', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit'
        }),
        gate: flightData.arrival.gate
      },
      duration: this.calculateFlightDuration(
        flightData.departure.scheduled,
        flightData.arrival.scheduled
      ),
      aircraft: flightData.aircraft?.iata
    };

    return {
      flightNumber: flightNumber.toUpperCase(),
      operatingDate: date,
      isMultiSegment: false,
      totalJourneyTime: segment.duration,
      segments: [segment]
    };
  }

  // Calculate flight duration from timestamps
  private calculateFlightDuration(departureTime: string, arrivalTime: string): string {
    const departure = new Date(departureTime);
    const arrival = new Date(arrivalTime);
    const durationMs = arrival.getTime() - departure.getTime();
    const durationMinutes = Math.floor(durationMs / (1000 * 60));
    
    return this.formatDuration(durationMinutes);
  }

  // Parse duration string to minutes
  private parseDuration(duration: string): number {
    const match = duration.match(/(\d+)h\s*(\d+)m/);
    if (match) {
      return parseInt(match[1]) * 60 + parseInt(match[2]);
    }
    return 0;
  }

  // Format minutes to duration string
  private formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  }

  // Get real-time flight status updates
  async getFlightStatus(flightNumber: string, date: string): Promise<FlightStatus> {
    try {
      const apiResponse = await this.callFlightAPI(flightNumber, date);
      if (apiResponse.data.length === 0) {
        throw new Error('Flight not found');
      }

      const flight = apiResponse.data[0];
      return {
        status: flight.flight_status as any,
        gate: flight.departure.gate || flight.arrival.gate,
        terminal: flight.departure.terminal || flight.arrival.terminal,
        estimatedTime: flight.departure.estimated || flight.departure.scheduled
      };
    } catch (error) {
      console.error('Flight status lookup failed:', error);
      throw error;
    }
  }

  // Detect if flight requires transit visa or has terminal changes
  detectTransitRequirements(segments: FlightSegment[]): TransitRequirements {
    const terminalChanges: string[] = [];
    const visaRequirements: string[] = [];
    let transitRequired = false;

    for (let i = 0; i < segments.length - 1; i++) {
      const current = segments[i];
      const next = segments[i + 1];

      // Check for terminal changes
      if (current.arrival.terminal !== next.departure.terminal) {
        terminalChanges.push(
          `${current.arrival.airport}: ${current.arrival.terminal} → ${next.departure.terminal}`
        );
        transitRequired = true;
      }

      // Check for known visa requirements (simplified)
      const transitAirport = current.arrival.airport;
      if (this.requiresTransitVisa(transitAirport)) {
        visaRequirements.push(`${transitAirport} may require transit visa`);
      }
    }

    return { transitRequired, terminalChanges, visaRequirements };
  }

  // Check if airport requires transit visa (simplified logic)
  private requiresTransitVisa(airportCode: string): boolean {
    // This would be expanded with real visa requirement logic
    const transitVisaRequired = ['JFK', 'LAX', 'CDG']; // Example
    return transitVisaRequired.includes(airportCode);
  }

  // Get airport-specific information
  async getAirportInfo(airportCode: string): Promise<AirportInfo> {
    // This would integrate with airport information API
    const airportData: Record<string, AirportInfo> = {
      SYD: {
        name: 'Sydney Kingsford Smith Airport',
        city: 'Sydney',
        country: 'Australia',
        timezone: 'Australia/Sydney',
        terminals: ['T1', 'T2', 'T3']
      },
      SIN: {
        name: 'Singapore Changi Airport',
        city: 'Singapore',
        country: 'Singapore', 
        timezone: 'Asia/Singapore',
        terminals: ['T1', 'T2', 'T3', 'T4', 'Jewel']
      },
      LHR: {
        name: 'London Heathrow Airport',
        city: 'London',
        country: 'United Kingdom',
        timezone: 'Europe/London',
        terminals: ['T2', 'T3', 'T4', 'T5']
      }
    };

    return airportData[airportCode] || {
      name: `${airportCode} Airport`,
      city: 'Unknown',
      country: 'Unknown',
      timezone: 'UTC',
      terminals: ['T1']
    };
  }
}

// Export singleton instance
export const flightService = new FlightService();

// Export types for use in components
export type { MultiSegmentFlight, FlightSegment };

// Utility functions for components
export const flightUtils = {
  // Calculate time until boarding (with buffer)
  getTimeUntilBoarding: (departureTime: string, bufferMinutes: number = 45): number => {
    const departure = new Date(departureTime);
    const boardingTime = new Date(departure.getTime() - (bufferMinutes * 60 * 1000));
    const now = new Date();
    return Math.max(0, Math.floor((boardingTime.getTime() - now.getTime()) / (1000 * 60)));
  },

  // Determine user mode based on time until boarding
  getUserMode: (timeUntilBoarding: number): 'BASIC' | 'SMART' | 'FULL' => {
    if (timeUntilBoarding < 20) return 'BASIC';
    if (timeUntilBoarding > 60) return 'FULL';
    return 'SMART';
  },

  // Format time display
  formatTimeDisplay: (time: string): string => {
    try {
      return new Date(time).toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return time;
    }
  },

  // Calculate layover duration
  calculateLayoverDuration: (arrivalTime: string, departureTime: string): string => {
    try {
      const arrival = new Date(arrivalTime);
      const departure = new Date(departureTime);
      const durationMs = departure.getTime() - arrival.getTime();
      const hours = Math.floor(durationMs / (1000 * 60 * 60));
      const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
      return `${hours}h ${minutes}m`;
    } catch {
      return 'Unknown';
    }
  }
}; 