import React from 'react';
import { createBrowserRouter } from 'react-router-dom';
import VibesFeedMVP from './pages/VibesFeedMVP';
import CollectionDetailAdaptiveLuxe from './pages/CollectionDetailAdaptiveLuxe';
import AmenityDetailAdaptiveLuxe from './pages/AmenityDetailAdaptiveLuxe';
import AmenityDetailMultiAccess from './pages/amenity-detail-multi-access';
import { ShoppingTrailDashboard } from './components/ShoppingTrailDashboard';
import ShoppingTrailDemo from './pages/shopping-trail-demo';
import { CollectionsScreen } from './components/CollectionsScreen';
import VibeNavigationDemo from './pages/vibe-navigation-demo';

// Simplified MVP routing for zero-friction user entry
export const router = createBrowserRouter([
  {
    path: '/',
    element: <VibesFeedMVP />, // Zero-friction entry into vibe feed
  },
  
  // Collections Screen - when user clicks "See all" on a vibe
  {
    path: '/vibe/:vibeSlug',
    element: <CollectionsScreen />,
  },
  
  // Collection Detail with Adaptive Luxe design
  {
    path: '/collection/:terminalCode/:collectionId',
    element: <CollectionDetailAdaptiveLuxe />,
  },
  
  // Amenity Detail with Adaptive Luxe design
  {
    path: '/amenity/:terminalCode/:amenitySlug',
    element: <AmenityDetailAdaptiveLuxe />,
  },
  
  // Amenity routes (legacy)
  {
    path: '/amenity/:amenitySlug',
    element: <AmenityDetailMultiAccess />,
  },
  
  // Terminal-specific routes
  {
    path: '/:terminalCode',
    element: <VibesFeedMVP />, // Terminal-specific vibe feed
  },
  
  // Quick redirects for common airports
  {
    path: '/sin',
    element: <VibesFeedMVP />,
  },
  {
    path: '/syd',
    element: <VibesFeedMVP />,
  },
  {
    path: '/lhr',
    element: <VibesFeedMVP />,
  },
  
  // Shopping Trail Routes
  {
    path: '/shopping-trail',
    element: <ShoppingTrailDashboard />,
  },
  {
    path: '/shopping-trail-demo',
    element: <ShoppingTrailDemo />,
  },
  
  // Vibe Navigation Demo
  {
    path: '/vibe-navigation-demo',
    element: <VibeNavigationDemo />,
  },
  
  // Development routes (only in dev mode)
  ...(import.meta.env.DEV ? [
    {
      path: '/dev/collections',
      element: <VibesFeedMVP />,
    },
    {
      path: '/dev/vibes',
      element: <VibesFeedMVP />,
    },
    {
      path: '/dev/test-navigation',
      element: React.lazy(() => import('./components/TestVibeNavigation')),
    },
    {
      path: '/test',
      element: React.lazy(() => import('./pages/NavigationTest')),
    },
  ] : []),
]);

export default router;
