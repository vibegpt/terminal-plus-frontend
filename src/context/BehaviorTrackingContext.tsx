import React, { createContext, useContext, useEffect, useRef } from 'react';
import { behavioralTrackingService } from '../services/behavioralTrackingService';

const BehaviorTrackingContext = createContext(behavioralTrackingService);

export function BehaviorTrackingProvider({ children }: { children: React.ReactNode }) {
  const trackingRef = useRef(behavioralTrackingService);
  
  useEffect(() => {
    // Initialize tracking
    trackingRef.current.init();
    
    // Cleanup on unmount
    return () => {
      trackingRef.current.cleanup();
    };
  }, []);
  
  return (
    <BehaviorTrackingContext.Provider value={trackingRef.current}>
      {children}
    </BehaviorTrackingContext.Provider>
  );
}

export const useBehaviorTracking = () => {
  const context = useContext(BehaviorTrackingContext);
  if (!context) {
    throw new Error('useBehaviorTracking must be used within a BehaviorTrackingProvider');
  }
  return context;
};