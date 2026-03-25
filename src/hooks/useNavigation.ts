// src/hooks/useNavigation.ts - Centralized navigation management
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useEffect } from 'react';

export const useNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // Track navigation history
  useEffect(() => {
    const navigationHistory = JSON.parse(
      sessionStorage.getItem('navigationHistory') || '[]'
    );
    
    const newEntry = {
      path: location.pathname,
      search: location.search,
      timestamp: new Date().toISOString(),
      title: document.title
    };
    
    // Keep last 10 navigation entries
    const updated = [...navigationHistory, newEntry].slice(-10);
    sessionStorage.setItem('navigationHistory', JSON.stringify(updated));
  }, [location]);

  // Navigation methods
  const navigateToCollection = (collection: any) => {
    // Store collection data for deep linking
    const collectionData = {
      slug: collection.collection_slug || collection.slug,
      name: collection.collection_name || collection.name,
      icon: collection.icon,
      gradient: collection.gradient,
      vibes: collection.vibes,
      from: location.pathname // Track where user came from
    };
    
    sessionStorage.setItem('selectedCollection', JSON.stringify(collectionData));
    
    // Include context in URL for sharing
    const params = new URLSearchParams();
    const context = sessionStorage.getItem('journeyContext');
    if (context) {
      try {
        const { airportCode, terminalCode } = JSON.parse(context);
        if (airportCode) params.set('airport', airportCode);
        if (terminalCode) params.set('terminal', terminalCode);
      } catch (error) {
        console.warn('Failed to parse journey context:', error);
      }
    }
    
    const url = `/collections/${collectionData.slug}${
      params.toString() ? '?' + params.toString() : ''
    }`;
    
    navigate(url);
  };

  const navigateToAmenity = (amenity: any, fromCollection: string | null = null) => {
    // Store context for back navigation
    const amenityContext = {
      slug: amenity.amenity_slug || amenity.slug,
      name: amenity.name,
      fromCollection,
      fromPath: location.pathname + location.search,
      timestamp: new Date().toISOString()
    };
    
    sessionStorage.setItem('amenityContext', JSON.stringify(amenityContext));
    
    // Build URL with context
    const params = new URLSearchParams();
    if (fromCollection) params.set('from', fromCollection);
    
    const context = sessionStorage.getItem('journeyContext');
    if (context) {
      try {
        const { airportCode, terminalCode } = JSON.parse(context);
        if (airportCode) params.set('airport', airportCode);
        if (terminalCode) params.set('terminal', terminalCode);
      } catch (error) {
        console.warn('Failed to parse journey context:', error);
      }
    }
    
    const url = `/amenity/${amenityContext.slug}${
      params.toString() ? '?' + params.toString() : ''
    }`;
    
    navigate(url);
  };

  const navigateBack = () => {
    const history = JSON.parse(
      sessionStorage.getItem('navigationHistory') || '[]'
    );
    
    if (history.length > 1) {
      // Get the previous entry (not current)
      const previousEntry = history[history.length - 2];
      navigate(previousEntry.path + previousEntry.search);
    } else {
      // Fallback to collections
      navigate('/collections');
    }
  };

  const navigateHome = () => {
    // Clear temporary context but keep journey context
    sessionStorage.removeItem('selectedCollection');
    sessionStorage.removeItem('amenityContext');
    navigate('/');
  };

  const navigateToTerminal = (terminalCode: string) => {
    // Store terminal context
    const terminalContext = {
      terminalCode,
      timestamp: new Date().toISOString()
    };
    
    sessionStorage.setItem('terminalContext', JSON.stringify(terminalContext));
    navigate(`/terminal/${terminalCode}`);
  };

  const navigateToVibe = (vibeSlug: string) => {
    // Store vibe context
    const vibeContext = {
      vibeSlug,
      timestamp: new Date().toISOString()
    };
    
    sessionStorage.setItem('vibeContext', JSON.stringify(vibeContext));
    navigate(`/vibe/${vibeSlug}`);
  };

  return {
    navigateToCollection,
    navigateToAmenity,
    navigateBack,
    navigateHome,
    navigateToTerminal,
    navigateToVibe,
    currentPath: location.pathname,
    searchParams,
    isDeepLink: searchParams.has('airport') || searchParams.has('terminal')
  };
};
