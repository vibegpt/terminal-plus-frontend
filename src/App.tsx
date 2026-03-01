import React, { lazy, Suspense, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import ChatBubble from './components/ChatBubble';
import { FlightProvider } from './components/FlightStatusBar';
import { AppShell } from './components/AppShell';
import { JourneyProvider, useJourney } from './context/JourneyContext';
import { FlightContextCapture } from './pages/FlightContextCapture';

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
  <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0a0f' }}>
    <div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-700 border-t-purple-400" />
  </div>
);

function AppInner() {
  const { isComplete, resetJourney } = useJourney();
  // captureVisible: true on first visit (no journey), or when user clicks "Change"
  const [captureVisible, setCaptureVisible] = useState(!isComplete);

  const handleCaptureComplete = () => {
    // Suppress the legacy OnboardingFlow (its sessionStorage gate)
    sessionStorage.setItem('tp_onboarded', '1');
    setCaptureVisible(false);
  };

  const handleEditFlight = () => {
    resetJourney();
    setCaptureVisible(true);
  };

  if (captureVisible) {
    return <FlightContextCapture onComplete={handleCaptureComplete} />;
  }

  return (
    <AppShell onEditFlight={handleEditFlight}>
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
    </AppShell>
  );
}

export default function App() {
  return (
    <FlightProvider>
      <JourneyProvider>
        <AppInner />
      </JourneyProvider>
    </FlightProvider>
  );
}
