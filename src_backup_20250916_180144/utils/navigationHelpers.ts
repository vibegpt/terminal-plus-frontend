// src/utils/navigationHelpers.ts - Navigation helper utilities
import { getCollectionConfig } from '../lib/supabase/queries';

// Handle deep link parameters
export const handleDeepLink = async (params: {
  collectionSlug?: string;
  airport?: string;
  terminal?: string;
}) => {
  const { collectionSlug, airport, terminal } = params;
  
  // Check if we have the context needed
  if (!sessionStorage.getItem('selectedCollection') && collectionSlug) {
    // Fetch collection data for deep links
    const collection = getCollectionConfig(collectionSlug);
    if (collection) {
      const collectionData = {
        slug: collectionSlug,
        name: collection.collection_name || collectionSlug,
        icon: collection.icon,
        gradient: collection.gradient,
        vibes: collection.vibes,
        fromDeepLink: true
      };
      sessionStorage.setItem('selectedCollection', JSON.stringify(collectionData));
    }
  }
  
  // Set journey context if provided in URL
  if (airport || terminal) {
    const existingContext = JSON.parse(
      sessionStorage.getItem('journeyContext') || '{}'
    );
    
    const updatedContext = {
      ...existingContext,
      airportCode: airport || existingContext.airportCode,
      terminalCode: terminal || existingContext.terminalCode,
      fromDeepLink: true
    };
    
    sessionStorage.setItem('journeyContext', JSON.stringify(updatedContext));
  }
};

// Generate shareable links
export const generateShareableLink = (type: string, data: any) => {
  const baseUrl = window.location.origin;
  
  switch (type) {
    case 'collection':
      const collectionParams = new URLSearchParams();
      if (data.airportCode) collectionParams.set('airport', data.airportCode);
      if (data.terminalCode) collectionParams.set('terminal', data.terminalCode);
      return `${baseUrl}/collections/${data.slug}?${collectionParams}`;
    
    case 'amenity':
      const amenityParams = new URLSearchParams();
      if (data.airportCode) amenityParams.set('airport', data.airportCode);
      if (data.terminalCode) amenityParams.set('terminal', data.terminalCode);
      if (data.fromCollection) amenityParams.set('from', data.fromCollection);
      return `${baseUrl}/amenity/${data.slug}?${amenityParams}`;
    
    case 'journey':
      const journeyParams = new URLSearchParams();
      if (data.airports) journeyParams.set('airports', data.airports.join(','));
      if (data.flightNumber) journeyParams.set('flight', data.flightNumber);
      return `${baseUrl}/plan-journey?${journeyParams}`;
    
    case 'terminal':
      const terminalParams = new URLSearchParams();
      if (data.airportCode) terminalParams.set('airport', data.airportCode);
      return `${baseUrl}/terminal/${data.terminalCode}?${terminalParams}`;
    
    default:
      return baseUrl;
  }
};

// Parse URL parameters for deep linking
export const parseDeepLinkParams = (searchParams: URLSearchParams) => {
  const params: any = {};
  
  // Parse airport and terminal context
  if (searchParams.has('airport')) {
    params.airport = searchParams.get('airport');
  }
  if (searchParams.has('terminal')) {
    params.terminal = searchParams.get('terminal');
  }
  
  // Parse collection context
  if (searchParams.has('from')) {
    params.fromCollection = searchParams.get('from');
  }
  
  // Parse journey context
  if (searchParams.has('airports')) {
    params.airports = searchParams.get('airports')?.split(',');
  }
  if (searchParams.has('flight')) {
    params.flightNumber = searchParams.get('flight');
  }
  
  return params;
};

// Validate deep link parameters
export const validateDeepLinkParams = (params: any) => {
  const errors: string[] = [];
  
  // Validate airport codes (3-letter IATA format)
  if (params.airport && !/^[A-Z]{3}$/.test(params.airport)) {
    errors.push('Invalid airport code format');
  }
  
  // Validate terminal codes (format: AIRPORT-T#)
  if (params.terminal && !/^[A-Z]{3}-T\d+$/.test(params.terminal)) {
    errors.push('Invalid terminal code format');
  }
  
  // Validate collection slugs (alphanumeric with hyphens)
  if (params.collectionSlug && !/^[a-z0-9-]+$/.test(params.collectionSlug)) {
    errors.push('Invalid collection slug format');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Create canonical URLs for SEO
export const createCanonicalUrl = (path: string, params: any) => {
  const baseUrl = window.location.origin;
  const canonicalParams = new URLSearchParams();
  
  // Only include essential parameters for canonical URLs
  if (params.airport) canonicalParams.set('airport', params.airport);
  if (params.terminal) canonicalParams.set('terminal', params.terminal);
  
  const queryString = canonicalParams.toString();
  return `${baseUrl}${path}${queryString ? '?' + queryString : ''}`;
};

// Track navigation analytics
export const trackNavigationEvent = (eventType: string, metadata: any = {}) => {
  const event = {
    event: eventType,
    timestamp: new Date().toISOString(),
    path: window.location.pathname,
    search: window.location.search,
    ...metadata
  };
  
  // Send to analytics service if available
  if (window.gtag) {
    window.gtag('event', 'navigation', event);
  }
  
  // Store locally for debugging
  try {
    const navLog = JSON.parse(localStorage.getItem('nav_log') || '[]');
    navLog.push(event);
    localStorage.setItem('nav_log', JSON.stringify(navLog.slice(-50)));
  } catch (error) {
    console.warn('Failed to log navigation event:', error);
  }
};
