// storageUtils.ts - Storage service and utilities
// Used in: Local storage, session storage, data persistence

// Storage service class for centralized storage management
export class StorageService {
  private prefix: string;

  constructor(prefix: string = 'terminal-plus') {
    this.prefix = prefix;
  }

  private getKey(key: string): string {
    return `${this.prefix}:${key}`;
  }

  // Local storage methods
  setLocal(key: string, value: any): void {
    try {
      const serializedValue = JSON.stringify(value);
      localStorage.setItem(this.getKey(key), serializedValue);
    } catch (error) {
      console.error('Failed to set local storage:', error);
    }
  }

  getLocal<T>(key: string, defaultValue?: T): T | null {
    try {
      const item = localStorage.getItem(this.getKey(key));
      return item ? JSON.parse(item) : defaultValue || null;
    } catch (error) {
      console.error('Failed to get local storage:', error);
      return defaultValue || null;
    }
  }

  removeLocal(key: string): void {
    try {
      localStorage.removeItem(this.getKey(key));
    } catch (error) {
      console.error('Failed to remove local storage:', error);
    }
  }

  // Session storage methods
  setSession(key: string, value: any): void {
    try {
      const serializedValue = JSON.stringify(value);
      sessionStorage.setItem(this.getKey(key), serializedValue);
    } catch (error) {
      console.error('Failed to set session storage:', error);
    }
  }

  getSession<T>(key: string, defaultValue?: T): T | null {
    try {
      const item = sessionStorage.getItem(this.getKey(key));
      return item ? JSON.parse(item) : defaultValue || null;
    } catch (error) {
      console.error('Failed to get session storage:', error);
      return defaultValue || null;
    }
  }

  removeSession(key: string): void {
    try {
      sessionStorage.removeItem(this.getKey(key));
    } catch (error) {
      console.error('Failed to remove session storage:', error);
    }
  }

  // Clear all storage
  clearAll(): void {
    try {
      // Clear local storage
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith(this.prefix)) {
          localStorage.removeItem(key);
        }
      });

      // Clear session storage
      Object.keys(sessionStorage).forEach(key => {
        if (key.startsWith(this.prefix)) {
          sessionStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error('Failed to clear storage:', error);
    }
  }

  // Migration helpers
  migrateData(oldKey: string, newKey: string): boolean {
    try {
      const oldData = this.getLocal(oldKey);
      if (oldData) {
        this.setLocal(newKey, oldData);
        this.removeLocal(oldKey);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to migrate data:', error);
      return false;
    }
  }

  // Debug helpers
  getAllKeys(): { local: string[], session: string[] } {
    const localKeys: string[] = [];
    const sessionKeys: string[] = [];

    try {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith(this.prefix)) {
          localKeys.push(key.replace(this.prefix + ':', ''));
        }
      });

      Object.keys(sessionStorage).forEach(key => {
        if (key.startsWith(this.prefix)) {
          sessionKeys.push(key.replace(this.prefix + ':', ''));
        }
      });
    } catch (error) {
      console.error('Failed to get storage keys:', error);
    }

    return { local: localKeys, session: sessionKeys };
  }

  getStorageSize(): { local: number, session: number } {
    let localSize = 0;
    let sessionSize = 0;

    try {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith(this.prefix)) {
          localSize += localStorage.getItem(key)?.length || 0;
        }
      });

      Object.keys(sessionStorage).forEach(key => {
        if (key.startsWith(this.prefix)) {
          sessionSize += sessionStorage.getItem(key)?.length || 0;
        }
      });
    } catch (error) {
      console.error('Failed to calculate storage size:', error);
    }

    return { local: localSize, session: sessionSize };
  }
}

// Default storage service instance
export const storageService = new StorageService();

// Utility functions for common storage operations
export const saveJourneyData = (journeyData: any): void => {
  storageService.setLocal('current-journey', journeyData);
};

export const getJourneyData = (): any => {
  return storageService.getLocal('current-journey');
};

export const saveUserPreferences = (preferences: any): void => {
  storageService.setLocal('user-preferences', preferences);
};

export const getUserPreferences = (): any => {
  return storageService.getLocal('user-preferences', {});
};

export const saveAmenityHistory = (history: any[]): void => {
  storageService.setLocal('amenity-history', history);
};

export const getAmenityHistory = (): any[] => {
  return storageService.getLocal('amenity-history', []) || [];
};

export const clearJourneyData = (): void => {
  storageService.removeLocal('current-journey');
};

export const clearAllData = (): void => {
  storageService.clearAll();
}; 