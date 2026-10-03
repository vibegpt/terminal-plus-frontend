import React, { lazy, Suspense, useState, useCallback, useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import ChatBubble from './components/ChatBubble';
import { FlightProvider } from './components/FlightStatusBar';
import { AppShell } from './components/AppShell';
import { JourneyProvider, useJourney, hasDeparted, type JourneyData } from './context/JourneyContext';
import { FlightContextCapture } from './pages/FlightContextCapture';
import { useFlightUpdates, setFlightToastHandler } from './hooks/useFlightUpdates';
import SimpleToast from './components/ui/SimpleToast';
import { init as initTelemetry, track } from './lib/telemetry';
import { HOME_PATH, PAGE_PATHS, isPagePath } from './lib/routes';
import { dismissAddFlightBar, type CaptureEntry } from './lib/capture';

// MVP routes — lazy loaded
const HomePage = lazy(() => import("@/pages/HomePage"));
const VibePage = lazy(() => import("@/pages/VibePage"));
const CollectionDetailPage = lazy(() => import("@/pages/CollectionDetailPage"));
const AmenityDetailPage = lazy(() => import("@/pages/AmenityDetailPage"));
const SearchPage = lazy(() => import("@/pages/SearchPage"));
const ProfilePage = lazy(() => import("@/pages/ProfilePage"));
const MapPage = lazy(() => import("@/pages/MapPage"));
const SavedPage = lazy(() => import("@/pages/SavedPage"));

// Whether this tab session started on a page (deep link) or on Home. Decided
// once, on the first render, and kept for the session: a visitor who arrives on
// /vibe/refuel and later taps Home never meets the full-screen gate.
const ENTRY_KIND_KEY = 'tp_entry_kind';

function sessionEntryKind(pathname: string): 'home' | 'page' {
  const kind = isPagePath(pathname) ? 'page' : 'home';
  try {
    const stored = sessionStorage.getItem(ENTRY_KIND_KEY);
    if (stored === 'home' || stored === 'page') return stored;
    sessionStorage.setItem(ENTRY_KIND_KEY, kind);
  } catch { /* storage blocked: decide from this path alone */ }
  return kind;
}

// True when a stored journey is still live. A departed one is stale: clear it
// (and the session's skip) so the next capture starts a new trip.
function hasLiveJourney(): boolean {
  const stored = localStorage.getItem('tp_journey_context');
  if (!stored) return false;
  try {
    const parsed = JSON.parse(stored) as JourneyData;
    if (!hasDeparted(parsed)) return true;
    localStorage.removeItem('tp_journey_context');
    sessionStorage.removeItem('tp_user_terminal');
    sessionStorage.removeItem('terminal_plus_flight');
    // A departed flight means a new trip, so an earlier skip in this
    // session must not suppress the fresh capture.
    sessionStorage.removeItem('tp_onboarded');
    return false;
  } catch {
    localStorage.removeItem('tp_journey_context');
    return false;
  }
}

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

  const { pathname } = useLocation();

  // Which capture is open, if any. Page routes (vibe, collection, amenity, …)
  // always render at once, for every visitor; the flight ask there is the slim
  // bar in FlightStatusBar. The full-screen gate is only for a session that
  // landed on Home (/, /sin, unknown paths) with no live journey and no skip yet.
  // Read storage directly in the initializer: avoids context propagation timing.
  const [captureEntry, setCaptureEntry] = useState<CaptureEntry | null>(() => {
    const entryKind = sessionEntryKind(pathname);
    if (hasLiveJourney()) return null;
    // Skipped: there is no journey to restore, but the user already said no.
    // Re-showing the wall on every reload is what "skip" exists to prevent.
    // sessionStorage, so a genuinely new session still gets the offer.
    if (sessionStorage.getItem('tp_onboarded') === '1') return null;
    return entryKind === 'home' && !isPagePath(pathname) ? 'gate' : null;
  });

  // One capture_opened per opening, so capture rate compares by entry point.
  // Declared after the init effect, so it follows session_start.
  useEffect(() => {
    if (captureEntry) track('capture_opened', { payload: { entry: captureEntry } });
  }, [captureEntry]);

  const changingFlight = captureEntry === 'change_flight';

  // useCallback so Step3's useEffect[onComplete] doesn't restart on every render.
  // Capture closes onto the same URL it opened from (it never navigates).
  const handleCaptureComplete = useCallback(() => {
    sessionStorage.setItem('tp_onboarded', '1');
    // Opened from the bar and closed without a journey (skip): don't re-nag
    // this session. With a journey the bar is hidden anyway.
    if (captureEntry === 'bar') dismissAddFlightBar();
    setCaptureEntry(null);
  }, [captureEntry]);

  const handleEditFlight = useCallback((entry: CaptureEntry) => {
    resetJourney();
    setCaptureEntry(entry);
  }, [resetJourney]);

  // Change flight: reopen capture at the departing-flight step. The current journey stays
  // until a new flight is confirmed, so "Keep …" leaves everything as it was.
  const handleChangeFlight = useCallback(() => {
    setCaptureEntry('change_flight');
  }, []);
  const handleCancelChange = useCallback(() => {
    setCaptureEntry(null);
  }, []);

  if (captureEntry) {
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
          <Route path={HOME_PATH} element={<HomePage />} />
          <Route path={PAGE_PATHS.vibe} element={<VibePage />} />
          <Route path={PAGE_PATHS.collection} element={<CollectionDetailPage />} />
          <Route path={PAGE_PATHS.search} element={<SearchPage />} />
          <Route path={PAGE_PATHS.profile} element={<ProfilePage />} />
          <Route path={PAGE_PATHS.map} element={<MapPage />} />
          <Route path={PAGE_PATHS.saved} element={<SavedPage />} />
          <Route path={PAGE_PATHS.amenityInTerminal} element={<AmenityDetailPage />} />
          <Route path={PAGE_PATHS.amenity} element={<AmenityDetailPage />} />
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
