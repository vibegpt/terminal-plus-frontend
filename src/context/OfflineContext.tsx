import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface OfflineContextType {
  isOnline: boolean;
  isOfflineReady: boolean;
  lastOnlineTime: Date | null;
  offlineData: {
    amenities: any[];
    collections: any[];
    vibes: any[];
  };
  addOfflineData: (type: 'amenities' | 'collections' | 'vibes', data: any[]) => void;
  clearOfflineData: () => void;
  syncWhenOnline: () => Promise<void>;
}

const OfflineContext = createContext<OfflineContextType | undefined>(undefined);

export function OfflineProvider({ children }: { children: ReactNode }) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isOfflineReady, setIsOfflineReady] = useState(false);
  const [lastOnlineTime, setLastOnlineTime] = useState<Date | null>(null);
  const [offlineData, setOfflineData] = useState({
    amenities: [],
    collections: [],
    vibes: [],
  });

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setLastOnlineTime(new Date());
      setIsOfflineReady(true);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check if we're already online
    if (navigator.onLine) {
      setIsOfflineReady(true);
      setLastOnlineTime(new Date());
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load offline data from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('terminal-plus-offline-data');
      if (saved) {
        const parsed = JSON.parse(saved);
        setOfflineData(parsed);
      }
    } catch (error) {
      console.error('Failed to load offline data:', error);
    }
  }, []);

  // Save offline data to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('terminal-plus-offline-data', JSON.stringify(offlineData));
    } catch (error) {
      console.error('Failed to save offline data:', error);
    }
  }, [offlineData]);

  const addOfflineData = (type: 'amenities' | 'collections' | 'vibes', data: any[]) => {
    setOfflineData(prev => ({
      ...prev,
      [type]: [...prev[type], ...data],
    }));
  };

  const clearOfflineData = () => {
    setOfflineData({
      amenities: [],
      collections: [],
      vibes: [],
    });
  };

  const syncWhenOnline = async () => {
    if (!isOnline) return;

    try {
      // Sync offline data with server
      console.log('Syncing offline data...');
      
      // Here you would implement actual sync logic
      // For now, we'll just log the data
      console.log('Offline data to sync:', offlineData);
      
      // Clear offline data after successful sync
      clearOfflineData();
    } catch (error) {
      console.error('Failed to sync offline data:', error);
    }
  };

  return (
    <OfflineContext.Provider
      value={{
        isOnline,
        isOfflineReady,
        lastOnlineTime,
        offlineData,
        addOfflineData,
        clearOfflineData,
        syncWhenOnline,
      }}
    >
      {children}
    </OfflineContext.Provider>
  );
}

export function useOffline() {
  const context = useContext(OfflineContext);
  if (context === undefined) {
    throw new Error('useOffline must be used within an OfflineProvider');
  }
  return context;
}

export default OfflineContext;
