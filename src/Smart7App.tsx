import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Existing Pages (from your current routes.tsx)
import HomePage from './pages/home-page';
import ExperienceView from './pages/ExperienceView';
import AmenityDetail from './pages/amenity-detail';

// Smart7 Collection Pages
import { SingaporeAirportApp } from './pages/SingaporeAirportApp';
import { SingaporeCollectionsExplorer } from './pages/SingaporeCollectionsExplorer';
import { Smart7CollectionPage } from './pages/Smart7CollectionPage';
import { Smart7Dashboard } from './pages/Smart7Dashboard';
import { TestSmart7Collections } from './components/TestSmart7Collections';

// Components
import { CollectionBottomNav } from './components/CollectionBottomNav';

const Smart7App: React.FC = () => {
  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
        <Routes>
          {/* ===== EXISTING ROUTES ===== */}
          <Route path="/" element={<HomePage />} />
          <Route path="/experience" element={<ExperienceView />} />
          <Route path="/amenity/:slug" element={<AmenityDetail />} />
          
          {/* ===== SMART7 COLLECTION ROUTES ===== */}
          {/* Main Collections Hub */}
          <Route path="/collections" element={<SingaporeAirportApp />} />
          
          {/* Alternative Explorer View */}
          <Route path="/explore" element={<SingaporeCollectionsExplorer />} />
          
          {/* Individual Collection Views */}
          <Route path="/collection/:collectionSlug" element={<Smart7CollectionPage />} />
          <Route path="/collection/:collectionSlug/:terminal" element={<Smart7CollectionPage />} />
          
          {/* Analytics Dashboard */}
          <Route path="/dashboard" element={<Smart7Dashboard />} />
          
          {/* Test Route */}
          <Route path="/test" element={<TestSmart7Collections />} />
          
          {/* ===== REDIRECTS ===== */}
          <Route path="/smart7" element={<Navigate to="/collections" replace />} />
          <Route path="*" element={<Navigate to="/collections" replace />} />
        </Routes>
        
        {/* Global Bottom Navigation for Collection Pages */}
        <Routes>
          <Route path="/collection*" element={<CollectionBottomNav />} />
          <Route path="/collections" element={<CollectionBottomNav />} />
        </Routes>
      </div>
    </Router>
  );
};

export default Smart7App;
