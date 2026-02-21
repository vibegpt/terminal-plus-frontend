// src/lib/analytics.ts
import ReactGA4 from 'react-ga4';

// Configuration
const analyticsConfig = {
  ga4Id: import.meta.env.VITE_GA4_MEASUREMENT_ID || 'G-F136HW3V8Q',
  hotjarId: import.meta.env.VITE_HOTJAR_ID ? parseInt(import.meta.env.VITE_HOTJAR_ID) : 6486356,
  debugMode: import.meta.env.MODE === 'development',
  isSecureContext: typeof window !== 'undefined' && (
    window.location.protocol === 'https:' || 
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1'
  )
};

// Types
export interface TravelEventData {
  emotionalState?: string;
  emotionConfidence?: number;
  journeyPhase?: 'departure' | 'transit' | 'arrival';
  vibeSelected?: string;
  airportCode?: string;
  terminalCode?: string;
  gateCode?: string;
  crowdLevel?: 'low' | 'medium' | 'high';
  flightNumber?: string;
  userCohort?: 'business' | 'leisure' | 'transit';
  travelCompanions?: 'solo' | 'couple' | 'family' | 'group';
  timeConstraints?: 'urgent' | 'moderate' | 'relaxed';
  socialProofPresent?: boolean;
  value?: number;
  viewType?: 'hybrid' | 'spotify' | 'netflix';
}

// Function declarations
export function initializeGA4(): void {
  if (!analyticsConfig.ga4Id) {
    console.warn('GA4 Measurement ID not set');
    return;
  }

  ReactGA4.initialize(analyticsConfig.ga4Id);

  if (analyticsConfig.debugMode) {
    console.log('GA4 initialized for Terminal+');
  }
}

export function initializeHotjar(): void {
  if (import.meta.env.MODE === 'development') {
    console.log('Hotjar skipped in development mode');
    return;
  }

  if (!analyticsConfig.isSecureContext) {
    console.warn('Hotjar requires HTTPS in production. Skipping initialization.');
    return;
  }

  if (!analyticsConfig.hotjarId) {
    console.warn('Hotjar ID not set');
    return;
  }

  (function(h: any, o: any, t: any, j: any, a?: any, r?: any) {
    h.hj = h.hj || function() {
      (h.hj.q = h.hj.q || []).push(arguments);
    };
    h._hjSettings = { hjid: analyticsConfig.hotjarId, hjsv: 6 };
    a = o.getElementsByTagName('head')[0];
    r = o.createElement('script');
    r.async = 1;
    r.src = t + h._hjSettings.hjid + j + h._hjSettings.hjsv;
    a.appendChild(r);
  })(window, document, 'https://static.hotjar.com/c/hotjar-', '.js?sv=');

  console.log('Hotjar initialized for Terminal+ (HTTPS)');
}

export function trackTravelEvent(eventName: string, eventData: TravelEventData = {}): void {
  ReactGA4.event(eventName, {
    custom_parameter_1: eventData.emotionalState,
    custom_parameter_2: eventData.journeyPhase,
    custom_parameter_3: eventData.vibeSelected,
    custom_parameter_4: eventData.airportCode,
    custom_parameter_5: eventData.terminalCode,
    ...eventData
  });

  if (typeof window !== 'undefined' && (window as any).hj && analyticsConfig.isSecureContext) {
    (window as any).hj('event', eventName, eventData);
  }

  if (analyticsConfig.debugMode) {
    console.log(`🎯 Travel Event: ${eventName}`, eventData);
  }
}

export function trackPageView(pageName: string): void {
  ReactGA4.send({ hitType: "pageview", page: pageName });
}

export function updateHotjarTravelContext(context: TravelEventData): void {
  if (typeof window !== 'undefined' && (window as any).hj && analyticsConfig.isSecureContext) {
    (window as any).hj('event', 'context_updated', context);
  }
}

export function initializeAnalytics(): void {
  initializeGA4();
  initializeHotjar();
  
  if (analyticsConfig.debugMode) {
    console.log('All analytics initialized for Terminal+', {
      ga4: !!analyticsConfig.ga4Id,
      hotjar: analyticsConfig.isSecureContext && !!analyticsConfig.hotjarId,
      environment: import.meta.env.MODE
    });
  }
}

// Analytics object - NOW all functions are defined
const analytics = {
  init: initializeAnalytics,
  trackEvent: trackTravelEvent,
  trackPageView: trackPageView,
  updateContext: updateHotjarTravelContext,
  trackEmotionalContext: (emotion: string, confidence: number, recommendation: any) => {
    trackTravelEvent('emotion_context', {
      emotionalState: emotion,
      emotionConfidence: confidence,
      vibeSelected: recommendation.title
    });
  },
  trackTimeUrgency: (action: string, timeToBoarding: number, response: string) => {
    trackTravelEvent('time_urgency', {
      timeConstraints: timeToBoarding < 20 ? 'urgent' : timeToBoarding < 45 ? 'moderate' : 'relaxed',
      value: timeToBoarding
    });
  },
  trackSocialProof: (interaction: string, type: string, count: number) => {
    trackTravelEvent('social_proof', {
      socialProofPresent: true,
      value: count
    });
  }
};

// Default export
export default analytics;

// Global type definitions
declare global {
  interface Window {
    hj?: (...args: any[]) => void;
  }
}
