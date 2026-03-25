// src/components/AppRoutes.tsx
// MVP Routes: Vibe Feed → Collection → Amenity (2-tap flow)

import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

const VibesFeedMVP = lazy(() => import('../pages/VibesFeedMVP'));
const VibePage = lazy(() => import('../pages/VibePage'));
const CollectionDetailPage = lazy(() => import('../pages/CollectionDetailPage'));
const AmenityDetailPage = lazy(() => import('../pages/AmenityDetailPage'));

// Simple loading fallback
const Loading = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-gray-600" />
  </div>
);

const AppRoutes: React.FC = () => {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        {/* Core MVP flow */}
        <Route path="/" element={<VibesFeedMVP />} />
        <Route path="/vibe/:vibeId" element={<VibePage />} />
        <Route path="/collection/:vibeSlug/:collectionId" element={<CollectionDetailPage />} />
        <Route path="/amenity/:terminalCode/:slug" element={<AmenityDetailPage />} />
        <Route path="/amenity/:slug" element={<AmenityDetailPage />} />

        {/* Quick airport redirect */}
        <Route path="/sin" element={<Navigate to="/" replace />} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
