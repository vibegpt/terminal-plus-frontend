import React from 'react';
import { SimpleJourneyContextProvider } from '../hooks/useSimpleJourneyContext';

interface RouteWrapperProps {
  children: React.ReactNode;
}

/**
 * RouteWrapper provides SimpleJourneyContext to components that need it
 * This solves the context boundary issue when using createBrowserRouter
 */
const RouteWrapper: React.FC<RouteWrapperProps> = ({ children }) => {
  return (
    <SimpleJourneyContextProvider>
      {children}
    </SimpleJourneyContextProvider>
  );
};

export default RouteWrapper;
