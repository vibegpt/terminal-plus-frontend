import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Import all your pages
import HomePage from '../pages/HomePage';
import CollectionPageMVP from '../pages/CollectionPageMVP';
import VibePage from '../pages/VibePage';
import { SingaporeAirportApp } from '../pages/SingaporeAirportApp';
import { Smart7CollectionPage } from '../pages/Smart7CollectionPage';
import AmenityDetailMVP from '../pages/AmenityDetailMVP';
import TerminalCollectionsAdaptiveLuxe from '../pages/TerminalCollectionsAdaptiveLuxe';
import VibesFeedMVP from '../pages/VibesFeedMVP';
import { Smart7Dashboard } from '../pages/Smart7Dashboard';

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Main Homepage - Dynamic Vibes Feed with All Vibes Visible */}
      <Route path="/" element={<VibesFeedMVP />} />
      
      {/* Welcome Page - Simple Landing Page */}
      <Route path="/welcome" element={<HomePage />} />
      
      {/* Collections */}
      <Route path="/collections" element={<Navigate to="/" replace />} />
      
      {/* Collection Detail - Shows amenities with consistent aesthetic */}
      <Route path="/collection/:vibe/:collectionSlug" element={<CollectionPageMVP />} />
      <Route path="/collection/:collectionSlug" element={<CollectionPageMVP />} />
      <Route path="/collection/:collectionSlug/:terminal" element={<CollectionPageMVP />} />
      
      {/* Vibe page showing all collections for that vibe */}
      <Route path="/vibe/:vibeId" element={<VibePage />} />
      
      {/* Amenity Detail - Consistent aesthetic with home page */}
      <Route path="/amenity/:slug" element={<AmenityDetailMVP />} />
      
      {/* Dashboard */}
      <Route path="/dashboard" element={<Smart7Dashboard />} />
      
      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
