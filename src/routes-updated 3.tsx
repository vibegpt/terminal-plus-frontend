// src/routes.tsx - Updated with Amenity Detail Multi-Access
import React from 'react';
import { createBrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Main User Flows
import HomePage from './pages/home-page';
import PlanJourneyStepper from './pages/plan-journey-stepper';
import ExploreTerminal from './pages/explore-terminal';
import TerminalBestOfPage from './pages/terminal-best-of-inline-styles';
import TerminalSelectionPage from './pages/terminal-selection';
import GoogleMapsTerminalPage from './pages/google-maps-terminal';
import TerminalMapView from './components/TerminalMapView';
import SimpleGoogleMapsTest from './pages/simple-google-maps-test';
import ExperienceView from './pages/ExperienceView';
import TerminalPlusDebug from './components/TerminalPlusDebug';
import EmotionDemo from './pages/emotion-demo';

// Smart Journey Components
import SmartJourneyFlow from './components/journey-stepper/SmartJourneyFlow';
import IntelligentJourneySelector from './components/journey-stepper/IntelligentJourneySelector';
import UniversalCardDemo from './components/UniversalCardDemo';

// Amenity Detail - Updated to Multi-Access version
import AmenityDetailMultiAccess from './pages/amenity-detail-multi-access';
import AmenityDetail from './pages/amenity-detail'; // Fallback
import CollectionDetailPage from './pages/collection-detail';

// Debug/Development Routes (DEV only)
import DebugNavigation from './pages/debug-navigation';

// Error Pages
import NotFound from './pages/not-found';

// Development routes
const devRoutes = import.meta.env.DEV ? [
  {
    path: "/debug-navigation",
    element: <DebugNavigation />,
  },
  {
    path: "/debug",
    element: <TerminalPlusDebug />,
  },
  {
    path: "/emotion-demo",
    element: <EmotionDemo />,
  },
  {
    path: "/card-demo",
    element: <UniversalCardDemo />,
  },
  {
    path: "/experience-test",
    element: <ExperienceView />,
  },
] : [];

// Create the router
export const router = createBrowserRouter([
  {
    path: "/",
    element: <HomePage />,
  },
  {
    path: "/plan-journey",
    element: <SmartJourneyFlow />,
  },
  {
    path: "/smart-journey",
    element: <SmartJourneyFlow />,
  },
  {
    path: "/intelligent-journey",
    element: <IntelligentJourneySelector />,
  },
  
  // Terminal Selection for Complete Journey
  {
    path: "/terminal-select",
    element: <TerminalSelectionPage />,
  },
  
  // Terminal Collections - Primary Experience Interface
  {
    path: "/best-of/:terminalCode",
    element: <TerminalBestOfPage />,
  },
  {
    path: "/terminal/:terminalCode",
    element: <TerminalBestOfPage />,
  },
  {
    path: "/collections/:terminalCode",
    element: <TerminalBestOfPage />,
  },
  
  // Collection Detail Page - Netflix-style view
  {
    path: "/collection/:terminalCode/:collectionId",
    element: <CollectionDetailPage />,
  },
  
  // AMENITY DETAIL ROUTES - Now with Multi-Access Support
  {
    path: "/amenity/:terminalCode/:amenitySlug",
    element: <AmenityDetailMultiAccess />,
  },
  {
    path: "/amenity/:amenitySlug",
    element: <AmenityDetailMultiAccess />,
  },
  {
    path: "/amenity-detail/:amenitySlug",
    element: <AmenityDetailMultiAccess />,
  },
  
  // Legacy Experience View - Keep for A/B testing and fallback
  {
    path: "/experience",
    element: <ExperienceView />,
  },
  {
    path: "/experience-classic",
    element: <ExperienceView />,
  },
  
  // Auto-route exploration to appropriate terminals
  {
    path: "/explore/SIN",
    element: <Navigate to="/best-of/SIN-T3" replace />,
  },
  {
    path: "/explore/SYD",
    element: <Navigate to="/best-of/SYD-T1" replace />,
  },
  {
    path: "/explore/DXB",
    element: <Navigate to="/best-of/DXB-T1" replace />,
  },
  {
    path: "/explore/:airportCode",
    element: <Navigate to="/best-of/SIN-T3" replace />,
  },
  
  // Legacy redirects - All point to Best Of interface
  {
    path: "/map",
    element: <Navigate to="/best-of/SIN-T3" replace />,
  },
  {
    path: "/google-maps-terminal",
    element: <Navigate to="/best-of/SIN-T3" replace />,
  },
  {
    path: "/terminal-map",
    element: <Navigate to="/best-of/SIN-T3" replace />,
  },
  {
    path: "/explore-terminal",
    element: <Navigate to="/best-of/SIN-T3" replace />,
  },
  
  // Development routes
  ...devRoutes,
  
  // 404 - Not Found
  {
    path: "*",
    element: <NotFound />,
  },
]);