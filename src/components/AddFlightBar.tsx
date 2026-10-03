// src/components/AddFlightBar.tsx
// Slim "Add flight" bar for page routes (vibe, collection, amenity, …) when no
// journey exists. Pages render at once; this bar is the only flight ask there.
// ✕ hides it for the session (src/lib/capture.ts).

import { useState } from 'react';
import { Plane, X } from 'lucide-react';
import { dismissAddFlightBar, isAddFlightBarDismissed } from '@/lib/capture';

interface AddFlightBarProps {
  /** Single-line variant for the desktop top bar */
  compact?: boolean;
  onAddFlight: () => void;
  className?: string;
}

export function AddFlightBar({ compact = false, onAddFlight, className = '' }: AddFlightBarProps) {
  const [dismissed, setDismissed] = useState(isAddFlightBarDismissed);
  if (dismissed) return null;

  const dismiss = () => {
    dismissAddFlightBar();
    setDismissed(true);
  };

  return (
    <div
      role="region"
      aria-label="Add your flight"
      className={`tp-add-flight-bar ${className}`}
      style={{
        background: 'rgba(124,109,250,0.08)',
        border: '1px solid rgba(124,109,250,0.2)',
        borderRadius: compact ? 20 : 14,
        padding: compact ? '3px 4px 3px 12px' : '6px 6px 6px 12px',
        display: 'flex',
        alignItems: 'center',
        gap: compact ? 8 : 10,
      }}
    >
      <Plane size={14} aria-hidden style={{ color: '#7c6dfa', opacity: 0.8, flexShrink: 0 }} />
      <span style={{
        flex: 1,
        minWidth: 0,
        fontSize: compact ? 12 : 12.5,
        lineHeight: 1.3,
        color: 'rgba(240,240,248,0.8)',
        whiteSpace: compact ? 'nowrap' : 'normal',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}>
        Add your flight to keep boarding time in view
      </span>
      <button
        type="button"
        onClick={onAddFlight}
        style={{
          flexShrink: 0,
          background: '#7c6dfa',
          color: '#fff',
          border: 'none',
          borderRadius: 999,
          padding: compact ? '4px 10px' : '6px 12px',
          fontSize: 12,
          fontWeight: 600,
          fontFamily: 'inherit',
          cursor: 'pointer',
        }}
      >
        Add flight
      </button>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss"
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
