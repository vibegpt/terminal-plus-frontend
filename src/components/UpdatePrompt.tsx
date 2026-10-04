// src/components/UpdatePrompt.tsx
// Registers the service worker (registerType 'prompt', vite.config.ts). When a
// new build is installed and waiting, offers it: "A new version is ready ·
// Refresh". Nothing reloads unless the user taps Refresh. Until then this tab
// keeps running its own build from the old precache, and the new build takes
// over by itself once every tab is closed.
//
// Placement: bottom, above the mobile nav and left of the chat bubble, so it
// never covers the header (flight bar, Add-flight bar, CC-13's outcome strip).
// Hidden while the capture flow is open, so it can't cover its buttons.

import { useState } from 'react';
import { X } from 'lucide-react';
import { useRegisterSW } from 'virtual:pwa-register/react';

// An open SPA tab makes no navigations, so the browser never re-checks sw.js
// on its own. Ask hourly.
const UPDATE_CHECK_MS = 60 * 60 * 1000;

export function UpdatePrompt({ hidden = false }: { hidden?: boolean }) {
  const [dismissed, setDismissed] = useState(false);
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    immediate: true,
    onRegisteredSW(_swUrl, registration) {
      if (!registration) return;
      setInterval(() => {
        registration.update().catch(() => { /* offline: try next hour */ });
      }, UPDATE_CHECK_MS);
    },
  });

  if (!needRefresh || dismissed || hidden) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed z-[60] left-4 right-[88px] bottom-[72px] md:left-1/2 md:right-auto md:-translate-x-1/2 md:bottom-6"
      style={{
        background: '#13131a',
        border: '1px solid rgba(124,109,250,0.35)',
        borderRadius: 14,
        boxShadow: '0 8px 24px rgba(0,0,0,0.45)',
        padding: '6px 6px 6px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        color: '#f0f0f8',
      }}
    >
      <span style={{ flex: 1, minWidth: 0, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        A new version is ready
      </span>
      <button
        type="button"
        // Tells the waiting service worker to take over; the register then reloads.
        onClick={() => { void updateServiceWorker(true); }}
        style={{
          flexShrink: 0,
          background: '#7c6dfa',
          color: '#fff',
          border: 'none',
          borderRadius: 999,
          padding: '6px 12px',
          fontSize: 12,
          fontWeight: 600,
          fontFamily: 'inherit',
          cursor: 'pointer',
        }}
      >
        Refresh
      </button>
      <button
        type="button"
        aria-label="Dismiss"
        onClick={() => setDismissed(true)}
        style={{
          flexShrink: 0,
          width: 28,
          height: 28,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'none',
          border: 'none',
          color: 'rgba(255,255,255,0.45)',
          cursor: 'pointer',
          padding: 0,
        }}
      >
        <X size={14} aria-hidden />
      </button>
    </div>
  );
}
