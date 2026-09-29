import React, { lazy, Suspense, useState, useCallback, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import ChatBubble from './components/ChatBubble';
import { FlightProvider } from './components/FlightStatusBar';
import { AppShell } from './components/AppShell';
import { JourneyProvider, useJourney, hasDeparted, type JourneyData } from './context/JourneyContext';
import { FlightContextCapture } from './pages/FlightContextCapture';
import { useFlightUpdates, setFlightToastHandler } from './hooks/useFlightUpdates';
import SimpleToast from './components/ui/SimpleToast';
import { init as initTelemetry } from './lib/telemetry';

// MVP routes — lazy loaded
const HomePage = lazy(() => import("@/pages/HomePage"));
const VibePage = lazy(() => import("@/pages/VibePage"));
const CollectionDetailPage = lazy(() => import("@/pages/CollectionDetailPage"));
const AmenityDetailPage = lazy(() => import("@/pages/AmenityDetailPage"));
const SearchPage = lazy(() => import("@/pages/SearchPage"));
const ProfilePage = lazy(() => import("@/pages/ProfilePage"));
const MapPage = lazy(() => import("@/pages/MapPage"));
const SavedPage = lazy(() => import("@/pages/SavedPage"));

const Loading = () => (
  <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0a0f' }}>
    <div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-700 border-t-purple-400" />
  </div>
);

function AppInner() {
  const { journey, resetJourney } = useJourney();

  // Background flight polling
  useFlightUpdates();

  // Telemetry: ensures anon/session identity and fires session_start
  // once per session_id (rotation after 30min idle is handled internally)
  useEffect(() => { initTelemetry(); }, []);

  // Toast for flight updates
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  useEffect(() => {
    setFlightToastHandler((info) => {
      setToast({
        message: info.message,
        type: info.type === 'cancelled' ? 'error' : 'success',
      });
    });
  }, []);

  // Read localStorage directly in the initializer — avoids context propagation
  // timing edge cases. This is the single source of truth for the gate.
  const [captureVisible, setCaptureVisible] = useState(() => {
    const stored = localStorage.getItem('tp_journey_context');

    if (stored) {
      // A stored journey whose onward flight has already departed is stale —
      // clear it and capture again rather than restoring yesterday's trip.
      try {
        const parsed = JSON.parse(stored) as JourneyData;
        if (!hasDeparted(parsed)) return false;
        localStorage.removeItem('tp_journey_context');
        sessionStorage.removeItem('tp_user_terminal');
        sessionStorage.removeItem('terminal_plus_flight');
        // A departed flight means a new trip, so an earlier skip in this
        // session must not suppress the fresh capture.
        sessionStorage.removeItem('tp_onboarded');
        return true;
      } catch {
        localStorage.removeItem('tp_journey_context');
        return true;
      }
    }

    // Skipped: there is no journey to restore, but the user already said no.
    // Re-showing the wall on every reload is what "skip" exists to prevent.
    // sessionStorage, so a genuinely new session still gets the offer.
    return sessionStorage.getItem('tp_onboarded') !== '1';
  });

  const [changingFlight, setChangingFlight] = useState(false);

  // useCallback so Step3's useEffect[onComplete] doesn't restart on every render
  const handleCaptureComplete = useCallback(() => {
    sessionStorage.setItem('tp_onboarded', '1');
    setChangingFlight(false);
    setCaptureVisible(false);
  }, []);

  const handleEditFlight = useCallback(() => {
    resetJourney();
    setCaptureVisible(true);
  }, [resetJourney]);

  // Change flight: reopen capture at the departing-flight step. The current journey stays
  // until a new flight is confirmed, so "Keep …" leaves everything as it was.
  const handleChangeFlight = useCallback(() => {
    setChangingFlight(true);
    setCaptureVisible(true);
  }, []);
  const handleCancelChange = useCallback(() => {
    setChangingFlight(false);
    setCaptureVisible(false);
  }, []);

  if (captureVisible) {
    return (
      <FlightContextCapture
        onComplete={handleCaptureComplete}
        initial={changingFlight ? journey : null}
        onCancel={changingFlight ? handleCancelChange : undefined}
      />
    );
  }

  return (
    <AppShell onEditFlight={handleEditFlight} onChangeFlight={handleChangeFlight}>
      <Suspense fallback={<Loading />}>
        <Routes>
          {/* Core MVP flow */}
          <Route path="/" element={<HomePage />} />
          <Route path="/vibe/:vibeId" element={<VibePage />} />
          <Route path="/collection/:vibeSlug/:collectionId" element={<CollectionDetailPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/saved" element={<SavedPage />} />
          <Route path="/amenity/:terminalCode/:slug" element={<AmenityDetailPage />} />
          <Route path="/amenity/:slug" element={<AmenityDetailPage />} />
          <Route path="/sin" element={<Navigate to="/" replace />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>

      <ChatBubble />
      {toast && (
        <SimpleToast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
          duration={5000}
        />
      )}
    </AppShell>
  );
}

export default function App() {
  return (
    <JourneyProvider>
      {/* FlightProvider reads the journey, so it sits inside JourneyProvider */}
      <FlightProvider>
        <AppInner />
      </FlightProvider>
    </JourneyProvider>
  );
}
