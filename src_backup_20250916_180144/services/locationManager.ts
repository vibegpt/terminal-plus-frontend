// Smart Location Manager
// Adapts tracking frequency based on user activity and proximity to shopping locations

import { shoppingTrailService } from './shoppingTrailService';

interface LocationConfig {
  highAccuracy: {
    interval: number;
    distanceThreshold: number;
    batteryThreshold: number;
  };
  balanced: {
    interval: number;
    distanceThreshold: number;
    batteryThreshold: number;
  };
  lowPower: {
    interval: number;
    distanceThreshold: number;
    batteryThreshold: number;
  };
}

interface LocationState {
  isTracking: boolean;
  currentMode: 'highAccuracy' | 'balanced' | 'lowPower';
  lastLocation: GeolocationPosition | null;
  nearbyAmenities: string[];
  batteryLevel: number | null;
}

class SmartLocationManager {
  private static instance: SmartLocationManager;
  private watchId: number | null = null;
  private state: LocationState;
  private config: LocationConfig;
  private onLocationUpdate: ((position: GeolocationPosition) => void) | null = null;
  private onModeChange: ((mode: string) => void) | null = null;

  private constructor() {
    this.state = {
      isTracking: false,
      currentMode: 'balanced',
      lastLocation: null,
      nearbyAmenities: [],
      batteryLevel: null
    };

    this.config = {
      highAccuracy: {
        interval: 5000, // 5 seconds
        distanceThreshold: 100, // 100 meters
        batteryThreshold: 0.3 // 30%
      },
      balanced: {
        interval: 30000, // 30 seconds
        distanceThreshold: 500, // 500 meters
        batteryThreshold: 0.2 // 20%
      },
      lowPower: {
        interval: 120000, // 2 minutes
        distanceThreshold: 1000, // 1 kilometer
        batteryThreshold: 0.1 // 10%
      }
    };

    this.initializeBatteryMonitoring();
  }

  public static getInstance(): SmartLocationManager {
    if (!SmartLocationManager.instance) {
      SmartLocationManager.instance = new SmartLocationManager();
    }
    return SmartLocationManager.instance;
  }

  // Initialize battery monitoring
  private async initializeBatteryMonitoring(): Promise<void> {
    try {
      if ('getBattery' in navigator) {
        const battery = await (navigator as any).getBattery();
        this.state.batteryLevel = battery.level;
        
        battery.addEventListener('levelchange', () => {
          this.state.batteryLevel = battery.level;
          this.adaptTrackingMode();
        });
      }
    } catch (error) {
      console.log('Battery API not available');
    }
  }

  // Start location tracking
  public startTracking(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      if (this.state.isTracking) {
        resolve();
        return;
      }

      const options: PositionOptions = {
        enableHighAccuracy: this.state.currentMode === 'highAccuracy',
        timeout: 10000,
        maximumAge: 60000
      };

      this.watchId = navigator.geolocation.watchPosition(
        this.handleLocationUpdate.bind(this),
        this.handleLocationError.bind(this),
        options
      );

      this.state.isTracking = true;
      this.adaptTrackingMode();
      resolve();
    });
  }

  // Stop location tracking
  public stopTracking(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
    this.state.isTracking = false;
  }

  // Handle location updates
  private async handleLocationUpdate(position: GeolocationPosition): Promise<void> {
    this.state.lastLocation = position;
    
    // Check for nearby amenities
    await this.checkNearbyAmenities(position);
    
    // Call callback if provided
    if (this.onLocationUpdate) {
      this.onLocationUpdate(position);
    }
    
    // Adapt tracking mode based on new location
    this.adaptTrackingMode();
  }

  // Handle location errors
  private handleLocationError(error: GeolocationPositionError): void {
    console.error('Location error:', error);
    
    // Fall back to lower accuracy mode
    if (this.state.currentMode !== 'lowPower') {
      this.switchMode('lowPower');
    }
  }

  // Check for nearby amenities
  private async checkNearbyAmenities(position: GeolocationPosition): Promise<void> {
    try {
      const collection = await shoppingTrailService.getCollectionDetails();
      if (!collection) return;

      const nearbyAmenities: string[] = [];
      
      collection.collection_amenities.forEach((item) => {
        const amenity = item.amenity_detail;
        if (amenity.latitude && amenity.longitude) {
          const distance = this.calculateDistance(
            position.coords.latitude,
            position.coords.longitude,
            amenity.latitude,
            amenity.longitude
          );
          
          const threshold = this.config[this.state.currentMode].distanceThreshold;
          if (distance <= threshold) {
            nearbyAmenities.push(amenity.id);
          }
        }
      });
      
      this.state.nearbyAmenities = nearbyAmenities;
    } catch (error) {
      console.error('Error checking nearby amenities:', error);
    }
  }

  // Calculate distance between two points (Haversine formula)
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    return R * c;
  }

  // Adapt tracking mode based on conditions
  private adaptTrackingMode(): void {
    const batteryLevel = this.state.batteryLevel || 1;
    const hasNearbyAmenities = this.state.nearbyAmenities.length > 0;
    
    let newMode: 'highAccuracy' | 'balanced' | 'lowPower' = 'balanced';
    
    // High accuracy when near amenities and battery is good
    if (hasNearbyAmenities && batteryLevel > this.config.highAccuracy.batteryThreshold) {
      newMode = 'highAccuracy';
    }
    // Low power when battery is critical
    else if (batteryLevel < this.config.lowPower.batteryThreshold) {
      newMode = 'lowPower';
    }
    // Balanced for normal conditions
    else {
      newMode = 'balanced';
    }
    
    if (newMode !== this.state.currentMode) {
      this.switchMode(newMode);
    }
  }

  // Switch tracking mode
  private switchMode(newMode: 'highAccuracy' | 'balanced' | 'lowPower'): void {
    if (this.state.currentMode === newMode) return;
    
    this.state.currentMode = newMode;
    
    // Restart tracking with new settings
    if (this.state.isTracking) {
      this.stopTracking();
      this.startTracking();
    }
    
    // Call callback if provided
    if (this.onModeChange) {
      this.onModeChange(newMode);
    }
    
    console.log(`Location tracking switched to ${newMode} mode`);
  }

  // Set location update callback
  public onLocationUpdate(callback: (position: GeolocationPosition) => void): void {
    this.onLocationUpdate = callback;
  }

  // Set mode change callback
  public onModeChange(callback: (mode: string) => void): void {
    this.onModeChange = callback;
  }

  // Get current state
  public getState(): LocationState {
    return { ...this.state };
  }

  // Get current mode config
  public getCurrentModeConfig() {
    return this.config[this.state.currentMode];
  }

  // Check if user is near any shopping amenities
  public isNearShoppingAmenities(): boolean {
    return this.state.nearbyAmenities.length > 0;
  }

  // Get nearby amenity IDs
  public getNearbyAmenities(): string[] {
    return [...this.state.nearbyAmenities];
  }

  // Manual mode override (for testing or user preference)
  public setMode(mode: 'highAccuracy' | 'balanced' | 'lowPower'): void {
    this.switchMode(mode);
  }
}

// Export singleton instance
export const locationManager = SmartLocationManager.getInstance();

// Export convenience functions
export const {
  startTracking,
  stopTracking,
  onLocationUpdate,
  onModeChange,
  getState,
  getCurrentModeConfig,
  isNearShoppingAmenities,
  getNearbyAmenities,
  setMode
} = locationManager;
