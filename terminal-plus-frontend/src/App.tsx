import React from "react";
import { Routes, Route } from "react-router-dom";
import HomePage from "@/pages/home-page";
import PlanJourneyStepper from "@/pages/plan-journey-stepper";
import GuideView from "@/pages/guide-view";
import MyJourneys from "@/pages/my-journeys";
import NotFound from "@/pages/not-found";
import AmenityDetail from "@/pages/amenity-detail";
import SimplifiedExplore from "@/pages/simplified-explore";
import TransitGuide from "@/pages/transit-guide/[airport]";
import ExploreTerminal from '@/pages/explore-terminal';
import { VibeProvider } from '@/context/VibeContext';

// Placeholder for transit guide
function TransitGuidePlaceholder() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-slate-900">
      <h1 className="text-2xl font-bold mb-4 text-slate-900 dark:text-white">Transit Guide Coming Soon</h1>
      <p className="text-lg text-slate-600 dark:text-slate-300 mb-8">This page will show amenities for your transit airport.</p>
    </div>
  );
}

export default function App() {
  return (
    <VibeProvider>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/plan-journey-stepper" element={<PlanJourneyStepper />} />
        <Route path="/guide-view" element={<GuideView />} />
        <Route path="/my-journeys" element={<MyJourneys />} />
        <Route path="/amenity/:slug" element={<AmenityDetail />} />
        <Route path="/simplified-explore" element={<SimplifiedExplore />} />
        <Route path="/transit-guide/:airport" element={<TransitGuide />} />
        <Route path="/explore-terminal" element={<ExploreTerminal />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </VibeProvider>
  );
}