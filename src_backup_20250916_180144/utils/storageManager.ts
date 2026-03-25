// src/utils/storageManager.ts

interface StorageCleanupOptions {
  clearSession?: boolean;
  clearLocal?: boolean;
  preserveKeys?: string[];
  logCleanup?: boolean;
}

interface TerminalContext {
  code: string;
  name: string;
  airport: string;
  lastUpdated: number;
}

interface CollectionContext {
  vibe: string;
  slug: string;
  name: string;
  terminal?: string;
  gradient?: string;
}

export class StorageManager {
  /**
   * Clear browser storage with options
   */
  static clearStorage(options: StorageCleanupOptions = {}) {
    const {
      clearSession = true,
      clearLocal = true,
      preserveKeys = [],
      logCleanup = true
    } = options;

    const clearedItems: { session: string[], local: string[] } = {
      session: [],
      local: []
    };

    // Clear sessionStorage
    if (clearSession) {
      const sessionKeys = Object.keys(sessionStorage);
      sessionKeys.forEach(key => {
        if (!preserveKeys.includes(key)) {
          sessionStorage.removeItem(key);
          clearedItems.session.push(key);
        }
      });
    }

    // Clear localStorage
    if (clearLocal) {
      const localKeys = Object.keys(localStorage);
      localKeys.forEach(key => {
        if (!preserveKeys.includes(key)) {
          localStorage.removeItem(key);
          clearedItems.local.push(key);
        }
      });
    }

    if (logCleanup) {
      console.group('🧹 Storage Cleanup Complete');
      console.log('SessionStorage cleared:', clearedItems.session);
      console.log('LocalStorage cleared:', clearedItems.local);
      console.log('Preserved keys:', preserveKeys);
      console.groupEnd();
    }

    return clearedItems;
  }

  /**
   * Clear collection-specific storage
   */
  static clearCollectionData() {
    const collectionKeys = [
      'selectedCollection',
      'collectionData',
      'amenityCache',
      'lastCollectionRoute'
    ];

    collectionKeys.forEach(key => {
      sessionStorage.removeItem(key);
      localStorage.removeItem(key);
    });

    console.log('✅ Collection data cleared from storage');
  }

  // Terminal context keys
  private static readonly TERMINAL_KEY = 'currentTerminal';
  private static readonly TERMINAL_HISTORY_KEY = 'terminalHistory';
  
  // Collection context keys
  private static readonly COLLECTION_KEY = 'selectedCollection';
  private static readonly VIBE_KEY = 'currentVibe';
  
  /**
   * Validate stored collection data matches current route
   * Now supports vibe-first pattern
   */
  static validateStoredCollection(vibe: string, slug: string): boolean {
    try {
      const stored = sessionStorage.getItem(this.COLLECTION_KEY);
      if (!stored) return false;

      const parsed = JSON.parse(stored);
      const isValid = parsed.vibe === vibe && parsed.slug === slug;

      if (!isValid) {
        console.warn(`⚠️ Stored collection mismatch:`, {
          stored: { vibe: parsed.vibe, slug: parsed.slug },
          current: { vibe, slug }
        });
        sessionStorage.removeItem(this.COLLECTION_KEY);
      }

      return isValid;
    } catch (error) {
      console.error('Error validating stored collection:', error);
      return false;
    }
  }

  /**
   * Store collection with vibe context
   */
  static setCollectionContext(collection: CollectionContext) {
    const terminal = this.getTerminalContext();
    const fullContext = {
      ...collection,
      terminal: terminal?.code || collection.terminal,
      timestamp: Date.now()
    };
    
    sessionStorage.setItem(this.COLLECTION_KEY, JSON.stringify(fullContext));
    sessionStorage.setItem(this.VIBE_KEY, collection.vibe);
    
    console.log('📦 Collection context set:', {
      vibe: collection.vibe,
      collection: collection.slug,
      terminal: fullContext.terminal
    });
    
    return fullContext;
  }

  /**
   * Get current collection context
   */
  static getCollectionContext(): CollectionContext | null {
    try {
      const stored = sessionStorage.getItem(this.COLLECTION_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  /**
   * Get current vibe
   */
  static getCurrentVibe(): string | null {
    return sessionStorage.getItem(this.VIBE_KEY);
  }

  /**
   * Set current terminal context
   */
  static setTerminalContext(terminal: TerminalContext) {
    const context = {
      ...terminal,
      lastUpdated: Date.now()
    };
    
    sessionStorage.setItem(this.TERMINAL_KEY, JSON.stringify(context));
    
    // Update terminal history
    const history = this.getTerminalHistory();
    history.unshift(terminal.code);
    // Keep only last 5 terminals
    const uniqueHistory = [...new Set(history)].slice(0, 5);
    localStorage.setItem(this.TERMINAL_HISTORY_KEY, JSON.stringify(uniqueHistory));
    
    console.log('📍 Terminal context set:', terminal.code);
    return context;
  }

  /**
   * Get current terminal context
   */
  static getTerminalContext(): TerminalContext | null {
    try {
      const stored = sessionStorage.getItem(this.TERMINAL_KEY);
      if (!stored) return null;
      
      const context = JSON.parse(stored);
      // Check if context is still fresh (within 2 hours)
      const twoHours = 2 * 60 * 60 * 1000;
      if (Date.now() - context.lastUpdated > twoHours) {
        console.warn('⚠️ Terminal context expired');
        return null;
      }
      
      return context;
    } catch (error) {
      console.error('Error getting terminal context:', error);
      return null;
    }
  }

  /**
   * Get terminal history
   */
  static getTerminalHistory(): string[] {
    try {
      const stored = localStorage.getItem(this.TERMINAL_HISTORY_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return [];
    }
  }

  /**
   * Get complete navigation context
   */
  static getNavigationContext() {
    return {
      terminal: this.getTerminalContext(),
      collection: this.getCollectionContext(),
      vibe: this.getCurrentVibe(),
      history: this.getTerminalHistory()
    };
  }

  /**
   * Get diagnostic info about current storage state
   */
  static getDiagnostics() {
    const navContext = this.getNavigationContext();
    
    return {
      navigation: navContext,
      sessionStorage: {
        keys: Object.keys(sessionStorage),
        size: new Blob([JSON.stringify(sessionStorage)]).size,
        collections: this.getCollectionItems('session')
      },
      localStorage: {
        keys: Object.keys(localStorage),
        size: new Blob([JSON.stringify(localStorage)]).size,
        collections: this.getCollectionItems('local')
      },
      routing: {
        currentPath: window.location.pathname,
        isCollectionPage: window.location.pathname.includes('/collection/'),
        pathSegments: window.location.pathname.split('/').filter(Boolean)
      }
    };
  }

  private static getCollectionItems(type: 'session' | 'local') {
    const storage = type === 'session' ? sessionStorage : localStorage;
    const collectionKeys = ['selectedCollection', 'collectionData', 'amenityCache'];
    const items: Record<string, any> = {};

    collectionKeys.forEach(key => {
      const value = storage.getItem(key);
      if (value) {
        try {
          items[key] = JSON.parse(value);
        } catch {
          items[key] = value;
        }
      }
    });

    return items;
  }
}

// Export convenience functions
export const clearAllStorage = () => StorageManager.clearStorage();
export const clearCollectionStorage = () => StorageManager.clearCollectionData();
export const validateCollection = (vibe: string, slug: string) => 
  StorageManager.validateStoredCollection(vibe, slug);
export const setTerminal = (terminal: TerminalContext) => 
  StorageManager.setTerminalContext(terminal);
export const getTerminal = () => StorageManager.getTerminalContext();
export const setCollection = (collection: CollectionContext) => 
  StorageManager.setCollectionContext(collection);
export const getNavContext = () => StorageManager.getNavigationContext();
