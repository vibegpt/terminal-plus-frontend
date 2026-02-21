import React from 'react';
import { useOffline } from '../context/OfflineContext';
import { WifiOff } from 'lucide-react';

export const OfflineBanner: React.FC = () => {
  const { isOnline } = useOffline();

  if (isOnline) {
    return null;
  }

  return (
    <div 
      data-testid="offline-banner"
      className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-white px-4 py-2 text-center text-sm font-medium shadow-lg"
    >
      <div className="flex items-center justify-center gap-2">
        <WifiOff className="w-4 h-4" />
        <span>You're offline - using cached data</span>
      </div>
    </div>
  );
};
