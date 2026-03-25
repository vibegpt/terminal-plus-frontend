import { TerminalAmenity } from '../types/amenity';

interface CrowdDataPoint {
  amenity_slug: string;
  timestamp: string;
  crowd_level: 'low' | 'medium' | 'high';
  queue_time_minutes: number;
  capacity_percentage: number;
}

interface CrowdDataResponse {
  current_data: CrowdDataPoint;
  historical_averages: {
    weekday: {
      morning: number;
      afternoon: number;
      evening: number;
    };
    weekend: {
      morning: number;
      afternoon: number;
      evening: number;
    };
  };
}

// Mock data patterns for different amenity types
const AMENITY_PATTERNS: Record<string, {
  baseQueueTime: number;
  baseCapacity: number;
  peakHours: number[];
  weekendMultiplier: number;
}> = {
  'Restaurant': {
    baseQueueTime: 20,
    baseCapacity: 70,
    peakHours: [12, 13, 18, 19],
    weekendMultiplier: 1.3
  },
  'Cafe': {
    baseQueueTime: 10,
    baseCapacity: 60,
    peakHours: [8, 9, 15, 16],
    weekendMultiplier: 1.2
  },
  'Lounge': {
    baseQueueTime: 5,
    baseCapacity: 80,
    peakHours: [10, 11, 14, 15],
    weekendMultiplier: 1.4
  },
  'Shop': {
    baseQueueTime: 8,
    baseCapacity: 50,
    peakHours: [11, 12, 16, 17],
    weekendMultiplier: 1.5
  },
  'default': {
    baseQueueTime: 15,
    baseCapacity: 65,
    peakHours: [12, 13, 17, 18],
    weekendMultiplier: 1.2
  }
};

// Generate realistic mock data
const generateMockData = (amenitySlug: string, amenityType: string): CrowdDataPoint => {
  const now = new Date();
  const currentHour = now.getHours();
  const isWeekend = now.getDay() === 0 || now.getDay() === 6;
  
  // Get pattern for this amenity type
  const pattern = AMENITY_PATTERNS[amenityType] || AMENITY_PATTERNS.default;
  
  // Calculate base values
  let queueTime = pattern.baseQueueTime;
  let capacity = pattern.baseCapacity;
  
  // Adjust for peak hours
  if (pattern.peakHours.includes(currentHour)) {
    queueTime *= 1.5;
    capacity *= 1.2;
  }
  
  // Adjust for weekends
  if (isWeekend) {
    queueTime *= pattern.weekendMultiplier;
    capacity *= pattern.weekendMultiplier;
  }
  
  // Add some random variation (±20%)
  const variation = 0.8 + Math.random() * 0.4;
  queueTime = Math.round(queueTime * variation);
  capacity = Math.min(100, Math.round(capacity * variation));
  
  // Determine crowd level based on capacity
  const crowdLevel = capacity < 40 ? 'low' :
                    capacity < 75 ? 'medium' : 'high';
  
  return {
    amenity_slug: amenitySlug,
    timestamp: now.toISOString(),
    crowd_level: crowdLevel,
    queue_time_minutes: queueTime,
    capacity_percentage: capacity
  };
};

// Generate historical averages
const generateHistoricalAverages = (amenityType: string) => {
  const pattern = AMENITY_PATTERNS[amenityType] || AMENITY_PATTERNS.default;
  
  return {
    weekday: {
      morning: 0.4 + (Math.random() * 0.2),
      afternoon: 0.6 + (Math.random() * 0.2),
      evening: 0.5 + (Math.random() * 0.2)
    },
    weekend: {
      morning: 0.5 + (Math.random() * 0.2),
      afternoon: 0.7 + (Math.random() * 0.2),
      evening: 0.6 + (Math.random() * 0.2)
    }
  };
};

// Store mock data
const MOCK_CROWD_DATA: Record<string, CrowdDataResponse> = {};

export const crowdService = {
  async getCurrentCrowdData(amenitySlug: string, amenityType: string): Promise<CrowdDataPoint> {
    // Generate new mock data each time
    return generateMockData(amenitySlug, amenityType);
  },

  async getHistoricalAverages(amenitySlug: string, amenityType: string): Promise<CrowdDataResponse['historical_averages']> {
    // Generate new historical averages
    return generateHistoricalAverages(amenityType);
  },

  async updateCrowdData(amenitySlug: string, amenityType: string, data: CrowdDataPoint): Promise<void> {
    MOCK_CROWD_DATA[amenitySlug] = {
      current_data: data,
      historical_averages: await this.getHistoricalAverages(amenitySlug, amenityType)
    };
  },

  async getBulkCrowdData(amenities: TerminalAmenity[]): Promise<Record<string, CrowdDataResponse>> {
    const results: Record<string, CrowdDataResponse> = {};
    
    for (const amenity of amenities) {
      results[amenity.slug] = {
        current_data: await this.getCurrentCrowdData(amenity.slug, amenity.amenity_type),
        historical_averages: await this.getHistoricalAverages(amenity.slug, amenity.amenity_type)
      };
    }
    
    return results;
  }
};

// Example of how to integrate with actual data sources:
/*
1. IoT Sensors:
   - People counters
   - Queue length sensors
   - Space utilization sensors

2. Manual Updates:
   - Staff input
   - User reports
   - Security camera analysis

3. External APIs:
   - Airport management system
   - Retail analytics
   - Queue management systems

4. Real-time Updates:
   - WebSocket connections
   - Push notifications
   - Periodic polling
*/

// Example implementation with a real API:
/*
export const crowdService = {
  async getCurrentCrowdData(amenitySlug: string): Promise<CrowdDataPoint> {
    const response = await fetch(`${API_BASE_URL}/crowd-data/${amenitySlug}`);
    if (!response.ok) {
      throw new Error('Failed to fetch crowd data');
    }
    return response.json();
  },

  async getHistoricalAverages(amenitySlug: string): Promise<CrowdDataResponse['historical_averages']> {
    const response = await fetch(`${API_BASE_URL}/crowd-history/${amenitySlug}`);
    if (!response.ok) {
      throw new Error('Failed to fetch historical data');
    }
    return response.json();
  },

  // ... other methods
};
*/ 