import { JourneyData } from '@/context/JourneyContext';

// Utility functions for journey data management

/**
 * Migrate data from sessionStorage to localStorage
 * Useful for transitioning from old to new storage system
 */
export const migrateJourneyData = (): JourneyData | null => {
  try {
    const sessionData = sessionStorage.getItem('tempJourneyData');
    if (sessionData) {
      const parsed = JSON.parse(sessionData);
      if (parsed && typeof parsed === 'object') {
        // Save to localStorage
        localStorage.setItem('journeyData', sessionData);
        console.log('Migrated journey data from sessionStorage to localStorage');
        return parsed;
      }
    }
  } catch (error) {
    console.warn('Failed to migrate journey data:', error);
  }
  return null;
};

/**
 * Validate journey data structure
 */
export const validateJourneyData = (data: any): data is JourneyData => {
  return (
    data &&
    typeof data === 'object' &&
    typeof data.selected_vibe === 'string' &&
    (typeof data.from === 'string' || typeof data.departure === 'string')
  );
};

/**
 * Get journey data from any available source
 * Priority: localStorage > sessionStorage > default
 */
export const getJourneyDataFromStorage = (): JourneyData | null => {
  try {
    // Try localStorage first
    const localData = localStorage.getItem('journeyData');
    if (localData) {
      const parsed = JSON.parse(localData);
      if (validateJourneyData(parsed)) {
        return parsed;
      }
    }

    // Fallback to sessionStorage
    const sessionData = sessionStorage.getItem('tempJourneyData');
    if (sessionData) {
      const parsed = JSON.parse(sessionData);
      if (validateJourneyData(parsed)) {
        return parsed;
      }
    }
  } catch (error) {
    console.warn('Failed to get journey data from storage:', error);
  }
  return null;
};

/**
 * Debug function to log current journey data state
 */
export const debugJourneyData = () => {
  console.group('Journey Data Debug');
  
  try {
    const localData = localStorage.getItem('journeyData');
    console.log('localStorage:', localData ? JSON.parse(localData) : 'null');
  } catch (error) {
    console.log('localStorage: error reading');
  }

  try {
    const sessionData = sessionStorage.getItem('tempJourneyData');
    console.log('sessionStorage:', sessionData ? JSON.parse(sessionData) : 'null');
  } catch (error) {
    console.log('sessionStorage: error reading');
  }

  console.groupEnd();
};

/**
 * Clear all journey data from storage
 */
export const clearAllJourneyData = () => {
  try {
    localStorage.removeItem('journeyData');
    sessionStorage.removeItem('tempJourneyData');
    console.log('Cleared all journey data from storage');
  } catch (error) {
    console.warn('Failed to clear journey data:', error);
  }
}; 