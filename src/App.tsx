import React, { lazy, Suspense, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import ChatBubble from './components/ChatBubble';
import { FlightProvider } from './components/FlightStatusBar';
import { AppShell } from './components/AppShell';
import { OnboardingFlow, useOnboarding } from './components/OnboardingFlow';

// MVP routes — lazy loaded
const HomePage = lazy(() => import("@/pages/HomePage"));
const VibePage = lazy(() => import("@/pages/VibePage"));
const CollectionDetailPage = lazy(() => import("@/pages/CollectionDetailPage"));
const AmenityDetailPage = lazy(() => import("@/pages/AmenityDetailPage"));

// Legacy routes — gated behind DEV
const ExploreTerminal = lazy(() => import("@/pages/explore-terminal"));
const PlanJourneyStepper = lazy(() => import("@/pages/plan-journey-stepper"));
const GuideView = lazy(() => import("@/pages/guide-view"));
const MyJourneys = lazy(() => import("@/pages/my-journeys"));

const Loading = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-gray-600" />
  </div>
);

function AppInner() {
  const { showOnboarding } = useOnboarding();
  const [onboardingDone, setOnboardingDone] = useState(!showOnboarding);
  const [showFlightEdit, setShowFlightEdit] = useState(false);

  if (!onboardingDone) {
    return (
      <OnboardingFlow
        onComplete={() => setOnboardingDone(true)}
      />
    );
  }

  return (
    <AppShell onEditFlight={() => setShowFlightEdit(true)}>
      <Suspense fallback={<Loading />}>
        <Routes>
          {/* Core MVP flow */}
          <Route path="/" element={<HomePage />} />
          <Route path="/vibe/:vibeId" element={<VibePage />} />
          <Route path="/collection/:vibeSlug/:collectionId" element={<CollectionDetailPage />} />
          <Route path="/amenity/:terminalCode/:slug" element={<AmenityDetailPage />} />
          <Route path="/amenity/:slug" element={<AmenityDetailPage />} />
          <Route path="/sin" element={<Navigate to="/" replace />} />

          {import.meta.env.DEV && (
            <>
              <Route path="/explore-terminal" element={<ExploreTerminal />} />
              <Route path="/plan-journey-stepper" element={<PlanJourneyStepper />} />
              <Route path="/guide-view" element={<GuideView />} />
              <Route path="/my-journeys" element={<MyJourneys />} />
            </>
          )}

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>

      <ChatBubble />

      {showFlightEdit && (
        <OnboardingFlow
          onComplete={() => setShowFlightEdit(false)}
        />
      )}
    </AppShell>
  );
}

export default function App() {
  return (
    <FlightProvider>
      <AppInner />
    </FlightProvider>
  );
}
