import type { Journey, UserPreferences } from '../types/amenity.types';

export class StorageService {
  private readonly JOURNEY_KEY = 'airport_app_current_journey';
  private readonly PREFERENCES_KEY = 'airport_app_user_preferences';

  // Journey storage
  saveJourney(journey: Journey): void {
    try {
      localStorage.setItem(this.JOURNEY_KEY, JSON.stringify(journey));
    } catch (error) {
      console.warn('Failed to save journey to localStorage:', error);
    }
  }

  loadJourney(): Journey | null {
    try {
      const stored = localStorage.getItem(this.JOURNEY_KEY);
      if (!stored) return null;

      const parsed = JSON.parse(stored);
      return isJourney(parsed) ? parsed : null;
    } catch (error) {
      console.warn('Failed to load journey from localStorage:', error);
      return null;
    }
  }

  clearJourney(): void {
    try {
      localStorage.removeItem(this.JOURNEY_KEY);
    } catch (error) {
      console.warn('Failed to clear journey from localStorage:', error);
    }
  }

  // Preferences storage
  savePreferences(preferences: UserPreferences): void {
    try {
      localStorage.setItem(this.PREFERENCES_KEY, JSON.stringify(preferences));
    } catch (error) {
      console.warn('Failed to save preferences to localStorage:', error);
    }
  }

  loadPreferences(): UserPreferences | null {
    try {
      const stored = localStorage.getItem(this.PREFERENCES_KEY);
      if (!stored) return null;

      return JSON.parse(stored) as UserPreferences;
    } catch (error) {
      console.warn('Failed to load preferences from localStorage:', error);
      return null;
    }
  }
}

// Type guard for Journey
export function isJourney(obj: any): obj is Journey {
  return obj && typeof obj === 'object' && 'id' in obj && 'userId' in obj && Array.isArray(obj.stops);
} 