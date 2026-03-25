interface LocationResult {
  method: 'GPS' | 'WIFI' | 'MANUAL' | 'DEFAULT';
  isAtAirport: boolean;
  airport?: string;
  terminal?: string;
  confidence: number; // 0-100
  cluster?: string; // For grouped terminals
  walkingDistances?: {
    T1?: number;
    T2?: number;
    T3?: number;
    T4?: number;
    JEWEL?: number;
  };
}

interface ArrivalPattern {
  timeSlot: string;
  likely_origins: string[];
  examples: string[];
  user_state: 'exhausted' | 'fresh' | 'active' | 'jetlagged' | 'tired';
  vibe_priority: string[];
}

export class LocationDetectionService {
  // Changi Airport terminal coordinates
  private static readonly CHANGI_TERMINALS = {
    T1: { lat: 1.3644, lng: 103.9915, name: 'Terminal 1' },
    T2: { lat: 1.3590, lng: 103.9891, name: 'Terminal 2' },
    T3: { lat: 1.3564, lng: 103.9855, name: 'Terminal 3' },
    T4: { lat: 1.3375, lng: 103.9833, name: 'Terminal 4' },
    JEWEL: { lat: 1.3602, lng: 103.9897, name: 'Jewel' }
  };

  // WiFi SSID patterns for terminal detection
  private static readonly WIFI_PATTERNS = {
    'Changi_T1': 'T1',
    'Changi_T2': 'T2',
    'Changi_T3': 'T3',
    'Changi_T4': 'T4',
    'Changi_Jewel': 'JEWEL',
    '#WiFi@Changi': 'GENERIC', // Could be anywhere
    'SATS_Premier': 'LOUNGE'
  };

  // Arrival patterns based on time of day
  private static readonly ARRIVAL_PATTERNS: Record<string, ArrivalPattern> = {
    'early_morning': { // 00:00-07:00
      timeSlot: '00:00-07:00',
      likely_origins: ['Europe', 'Middle East', 'India'],
      examples: ['LHR', 'CDG', 'DXB', 'DOH', 'DEL', 'BOM'],
      user_state: 'exhausted',
      vibe_priority: ['comfort', 'quick', 'refuel']
    },
    'morning': { // 06:00-10:00
      timeSlot: '06:00-10:00',
      likely_origins: ['Australia', 'New Zealand'],
      examples: ['SYD', 'MEL', 'PER', 'AKL'],
      user_state: 'fresh',
      vibe_priority: ['explore', 'shop', 'refuel']
    },
    'midday': { // 10:00-15:00
      timeSlot: '10:00-15:00',
      likely_origins: ['East Asia', 'Southeast Asia'],
      examples: ['HKG', 'NRT', 'ICN', 'BKK', 'CGK'],
      user_state: 'active',
      vibe_priority: ['refuel', 'shop', 'explore']
    },
    'afternoon': { // 15:00-20:00
      timeSlot: '15:00-20:00',
      likely_origins: ['US West Coast', 'China'],
      examples: ['LAX', 'SFO', 'PEK', 'PVG'],
      user_state: 'jetlagged',
      vibe_priority: ['refuel', 'comfort', 'quick']
    },
    'evening': { // 20:00-00:00
      timeSlot: '20:00-00:00',
      likely_origins: ['India', 'Middle East', 'Europe'],
      examples: ['DEL', 'BOM', 'DXB', 'IST'],
      user_state: 'tired',
      vibe_priority: ['quick', 'comfort', 'chill']
    }
  };

  /**
   * Main detection method - tries all strategies in order
   */
  static async detectLocation(): Promise<LocationResult> {
    // Try GPS first
    const gpsResult = await this.tryGPSDetection();
    if (gpsResult.confidence > 80) {
      return gpsResult;
    }

    // Try WiFi detection
    const wifiResult = await this.tryWiFiDetection();
    if (wifiResult.confidence > 60) {
      return wifiResult;
    }

    // Fall back to smart default
    return this.getSmartDefault();
  }

  /**
   * GPS-based detection
   */
  private static async tryGPSDetection(): Promise<LocationResult> {
    try {
      const position = await this.getCurrentPosition();
      const { latitude, longitude } = position.coords;
      
      // Check if near any Changi terminal
      for (const [terminal, coords] of Object.entries(this.CHANGI_TERMINALS)) {
        const distance = this.calculateDistance(
          latitude, longitude,
          coords.lat, coords.lng
        );
        
        if (distance < 0.5) { // Within 500m
          return {
            method: 'GPS',
            isAtAirport: true,
            airport: 'SIN',
            terminal,
            confidence: 95,
            walkingDistances: this.calculateWalkingDistances(terminal)
          };
        }
      }
      
      // Near airport but not at specific terminal
      if (this.isNearAirport(latitude, longitude)) {
        return {
          method: 'GPS',
          isAtAirport: true,
          airport: 'SIN',
          confidence: 70,
          cluster: 'T1-T2-T3-JEWEL'
        };
      }
      
      return {
        method: 'GPS',
        isAtAirport: false,
        confidence: 50
      };
    } catch (error) {
      // GPS denied or failed
      return {
        method: 'GPS',
        isAtAirport: false,
        confidence: 0
      };
    }
  }

  /**
   * WiFi-based detection (experimental API)
   */
  private static async tryWiFiDetection(): Promise<LocationResult> {
    try {
      // Note: This requires experimental browser APIs
      // In production, might need native app bridge
      const networks = await this.getAvailableNetworks();
      
      for (const network of networks) {
        for (const [pattern, terminal] of Object.entries(this.WIFI_PATTERNS)) {
          if (network.ssid.includes(pattern)) {
            return {
              method: 'WIFI',
              isAtAirport: true,
              airport: 'SIN',
              terminal: terminal === 'GENERIC' ? undefined : terminal,
              confidence: terminal === 'GENERIC' ? 60 : 85,
              cluster: terminal === 'GENERIC' ? 'T1-T2-T3-JEWEL' : undefined
            };
          }
        }
      }
      
      return {
        method: 'WIFI',
        isAtAirport: false,
        confidence: 30
      };
    } catch (error) {
      return {
        method: 'WIFI',
        isAtAirport: false,
        confidence: 0
      };
    }
  }

  /**
   * Smart default based on user patterns
   */
  private static getSmartDefault(): LocationResult {
    const hour = new Date().getHours();
    const arrivalPattern = this.getArrivalPattern(hour);
    
    return {
      method: 'DEFAULT',
      isAtAirport: false, // Assume planning mode
      airport: 'SIN',
      cluster: 'T1-T2-T3-JEWEL', // Most common cluster
      confidence: 40,
      walkingDistances: {
        T1: 0,
        T2: 5,
        T3: 8,
        T4: 15, // Requires shuttle
        JEWEL: 5
      }
    };
  }

  /**
   * Get arrival pattern based on current time
   */
  static getArrivalPattern(hour?: number): ArrivalPattern {
    const currentHour = hour ?? new Date().getHours();
    
    if (currentHour >= 0 && currentHour < 7) {
      return this.ARRIVAL_PATTERNS.early_morning;
    } else if (currentHour >= 6 && currentHour < 10) {
      return this.ARRIVAL_PATTERNS.morning;
    } else if (currentHour >= 10 && currentHour < 15) {
      return this.ARRIVAL_PATTERNS.midday;
    } else if (currentHour >= 15 && currentHour < 20) {
      return this.ARRIVAL_PATTERNS.afternoon;
    } else {
      return this.ARRIVAL_PATTERNS.evening;
    }
  }

  /**
   * Calculate walking distances between terminals
   */
  private static calculateWalkingDistances(fromTerminal: string): Record<string, number> {
    const distances: Record<string, Record<string, number>> = {
      T1: { T1: 0, T2: 5, T3: 8, T4: 15, JEWEL: 5 },
      T2: { T1: 5, T2: 0, T3: 5, T4: 15, JEWEL: 3 },
      T3: { T1: 8, T2: 5, T3: 0, T4: 15, JEWEL: 5 },
      T4: { T1: 15, T2: 15, T3: 15, T4: 0, JEWEL: 15 },
      JEWEL: { T1: 5, T2: 3, T3: 5, T4: 15, JEWEL: 0 }
    };
    
    return distances[fromTerminal] || distances.T1;
  }

  /**
   * Helper: Get current position using Geolocation API
   */
  private static getCurrentPosition(): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
      }
      
      navigator.geolocation.getCurrentPosition(
        resolve,
        reject,
        { 
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0 
        }
      );
    });
  }

  /**
   * Helper: Calculate distance between two points (in km)
   */
  private static calculateDistance(
    lat1: number, lng1: number, 
    lat2: number, lng2: number
  ): number {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  /**
   * Check if coordinates are near Changi Airport
   */
  private static isNearAirport(lat: number, lng: number): boolean {
    const airportCenter = { lat: 1.3500, lng: 103.9900 };
    const distance = this.calculateDistance(
      lat, lng,
      airportCenter.lat, airportCenter.lng
    );
    return distance < 3; // Within 3km of airport
  }

  /**
   * Mock: Get available WiFi networks
   * In production, this would use native capabilities
   */
  private static async getAvailableNetworks(): Promise<Array<{ssid: string, signal: number}>> {
    // This would need native app bridge or experimental Web APIs
    // For now, return mock data for testing
    if (typeof window !== 'undefined' && 'development' === process.env.NODE_ENV) {
      // Simulate WiFi networks for testing
      return [
        { ssid: 'Changi_T3_Free', signal: -50 },
        { ssid: '#WiFi@Changi', signal: -60 },
        { ssid: 'Starbucks_WiFi', signal: -70 }
      ];
    }
    
    throw new Error('WiFi scanning not available');
  }

  /**
   * Get user-friendly location description
   */
  static getLocationDescription(result: LocationResult): string {
    if (result.isAtAirport) {
      if (result.terminal) {
        return `At ${this.CHANGI_TERMINALS[result.terminal]?.name || result.terminal}`;
      }
      if (result.cluster) {
        return 'At Changi Airport (Central Area)';
      }
      return 'At Changi Airport';
    }
    
    return 'Planning your journey';
  }
}
