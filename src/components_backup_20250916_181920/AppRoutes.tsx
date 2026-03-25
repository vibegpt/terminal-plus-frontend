import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import HomePage from "../pages/HomePage";
import VibePage from "../pages/VibePage";
import CollectionDetailPage from "../pages/CollectionDetailPage";
import AmenityDetailPage from "../pages/AmenityDetailPage";
import Smart7CollectionPage from "../pages/Smart7CollectionPage";
import JourneySummaryPage from "../pages/JourneySummaryPage";
import SettingsPage from "../pages/SettingsPage";

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/vibe/:vibeId" element={<VibePage />} />
      <Route path="/collection/:id" element={<CollectionDetailPage />} />
      <Route path="/collection/smart7/:id" element={<Smart7CollectionPage />} />
      <Route path="/amenity/:slug" element={<AmenityDetailPage />} />
      <Route path="/journey" element={<JourneySummaryPage />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;