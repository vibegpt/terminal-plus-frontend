// src/components/AppShell.tsx
// Responsive layout wrapper:
//   Desktop (≥1024px): Sidebar vibe nav + main feed + right detail panel
//   Tablet (768–1023px): Sidebar collapsed to icon rail + main feed
//   Mobile (<768px): Full-width stack with bottom nav + sticky flight bar
//
// Drop this in as the root wrapper in App.tsx, replacing whatever wraps the
// existing TerminalCollectionsAdaptiveLuxe / CollectionDetail / AmenityDetail.
// All routing stays exactly as-is — this is purely a layout shell.

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin, Heart, Settings, Plane, Search, Bell,
  Menu, X, ChevronRight
} from 'lucide-react';
import { FlightStatusBar, useFlightContext } from './FlightStatusBar';
import type { CaptureEntry } from '@/lib/capture';

// ─── VIBE CONFIG ──────────────────────────────────────────────────────────────

const VIBES = [
  { key: 'chill',   emoji: '😌', label: 'Chill',   color: '#6366f1', count: 8  },
  { key: 'refuel',  emoji: '🍜', label: 'Refuel',  color: '#f97316', count: 12 },
  { key: 'explore', emoji: '🗺️', label: 'Explore', color: '#8b5cf6', count: 10 },
  { key: 'comfort', emoji: '🛋️', label: 'Comfort', color: '#ec4899', count: 6  },
  { key: 'work',    emoji: '💻', label: 'Work',    color: '#0ea5e9', count: 7  },
  { key: 'shop',    emoji: '🛍️', label: 'Shop',    color: '#eab308', count: 9  },
  { key: 'quick',   emoji: '⚡', label: 'Quick',   color: '#22c55e', count: 5  },
];

const BOTTOM_NAV = [
  { key: 'vibes', emoji: '🎭', label: 'Vibes',   path: '/' },
  { key: 'map',   emoji: '🗺️', label: 'Map',     path: '/map' },
  { key: 'saved', emoji: '❤️', label: 'Saved',   path: '/saved' },
  { key: 'me',    emoji: '👤', label: 'Profile', path: '/profile' },
];

// ─── HOOKS ────────────────────────────────────────────────────────────────────

function useBreakpoint() {
  const [bp, setBp] = useState<'mobile' | 'tablet' | 'desktop'>('mobile');
  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      setBp(w >= 1024 ? 'desktop' : w >= 768 ? 'tablet' : 'mobile');
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);
  return bp;
}

function useActiveVibe() {
  const location = useLocation();
  // Infer active vibe from URL or default to 'chill'
  const match = location.pathname.match(/\/(chill|refuel|explore|comfort|work|shop|quick)/);
  return match ? match[1] : 'chill';
}

// ─── SIDEBAR (Desktop / Tablet) ───────────────────────────────────────────────

interface SidebarProps {
  collapsed?: boolean;
  activeVibe: string;
  onVibeSelect: (key: string) => void;
  onEditFlight: (entry: CaptureEntry) => void;
  onChangeFlight?: () => void;
}

function Sidebar({ collapsed = false, activeVibe, onVibeSelect, onEditFlight, onChangeFlight }: SidebarProps) {
  const { flight } = useFlightContext();

  return (
    <nav style={{
      width: collapsed ? 64 : 260,
      background: 'rgba(10,10,15,0.98)',
      borderRight: '1px solid rgba(255,255,255,0.06)',
      display: 'flex',
      flexDirection: 'column',
      padding: collapsed ? '12px 8px' : '12px 8px',
      gap: 2,
      flexShrink: 0,
      transition: 'width 0.25s ease',
      overflowY: 'auto',
      overflowX: 'hidden',
    }}>
      {/* Logo */}
      {!collapsed && (
        <div style={{
          padding: '8px 10px 16px',
          fontFamily: '"DM Serif Display", Georgia, serif',
          fontSize: 22,
          background: 'linear-gradient(135deg, #7c6dfa, #a855f7)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          Terminal+
        </div>
      )}

      {/* Section: Vibes */}
      {!collapsed && (
        <div style={{
          fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
          textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)',
          padding: '8px 10px 4px',
        }}>
          Your Vibes
        </div>
      )}

      {VIBES.map(v => {
        const active = activeVibe === v.key;
        return (
          <button
            key={v.key}
            onClick={() => onVibeSelect(v.key)}
            title={collapsed ? v.label : undefined}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: collapsed ? 0 : 10,
              padding: collapsed ? '10px' : '9px 10px',
              borderRadius: 10,
              cursor: 'pointer',
              background: active ? 'rgba(255,255,255,0.06)' : 'none',
              border: active ? '1px solid rgba(255,255,255,0.1)' : '1px solid transparent',
              fontFamily: 'inherit',
              position: 'relative',
              justifyContent: collapsed ? 'center' : 'flex-start',
              transition: 'all 0.15s',
            }}
          >
            {/* Active indicator */}
            {active && (
              <span style={{
                position: 'absolute',
                left: 0, top: 6, bottom: 6,
                width: 3,
                borderRadius: '0 3px 3px 0',
                background: v.color,
              }} />
            )}
            <span style={{ fontSize: collapsed ? 20 : 18 }}>{v.emoji}</span>
            {!collapsed && (
              <>
                <span style={{ fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.75)', flex: 1, textAlign: 'left' }}>
                  {v.label}
                </span>
                <span style={{
                  fontSize: 10, color: 'rgba(255,255,255,0.25)',
                  background: 'rgba(255,255,255,0.05)',
                  padding: '2px 6px', borderRadius: 10,
                }}>
                  {v.count}
                </span>
              </>
            )}
          </button>
        );
      })}

      {/* Section: Navigate */}
      {!collapsed && (
        <div style={{
          fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
          textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)',
          padding: '16px 10px 4px',
        }}>
          Navigate
        </div>
      )}

      <button style={{
        display: 'flex', alignItems: 'center', gap: collapsed ? 0 : 10,
        padding: collapsed ? 10 : '9px 10px',
        borderRadius: 10, cursor: 'pointer',
        background: 'none', border: '1px solid transparent',
        fontFamily: 'inherit', justifyContent: collapsed ? 'center' : 'flex-start',
      }}>
        <span style={{ fontSize: collapsed ? 20 : 18 }}>🗺️</span>
        {!collapsed && <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>Terminal Map</span>}
      </button>

      <button style={{
        display: 'flex', alignItems: 'center', gap: collapsed ? 0 : 10,
        padding: collapsed ? 10 : '9px 10px',
        borderRadius: 10, cursor: 'pointer',
        background: 'none', border: '1px solid transparent',
        fontFamily: 'inherit', justifyContent: collapsed ? 'center' : 'flex-start',
      }}>
        <span style={{ fontSize: collapsed ? 20 : 18 }}>❤️</span>
        {!collapsed && <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>Saved</span>}
      </button>

      {/* Footer */}
      <div style={{ marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 8 }}>
        <button
          onClick={flight && onChangeFlight ? onChangeFlight : () => onEditFlight('prompt')}
          style={{
            display: 'flex', alignItems: 'center', gap: collapsed ? 0 : 10,
            padding: collapsed ? 10 : '8px 10px', width: '100%',
            borderRadius: 10, cursor: 'pointer',
            background: 'none', border: '1px solid transparent',
            fontFamily: 'inherit', justifyContent: collapsed ? 'center' : 'flex-start',
          }}
        >
          <Plane size={16} style={{ color: 'rgba(255,255,255,0.3)' }} />
          {!collapsed && <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>
            {flight ? `${flight.flightNumber}` : 'Add Flight'}
          </span>}
        </button>

        <button style={{
          display: 'flex', alignItems: 'center', gap: collapsed ? 0 : 10,
          padding: collapsed ? 10 : '8px 10px', width: '100%',
          borderRadius: 10, cursor: 'pointer',
          background: 'none', border: '1px solid transparent',
          fontFamily: 'inherit', justifyContent: collapsed ? 'center' : 'flex-start',
        }}>
          <Settings size={16} style={{ color: 'rgba(255,255,255,0.3)' }} />
          {!collapsed && <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>Settings</span>}
        </button>
      </div>
    </nav>
  );
}

// ─── DESKTOP TOPBAR ───────────────────────────────────────────────────────────

interface TopBarProps {
  onEditFlight: (entry: CaptureEntry) => void;
}

function TopBar({ onEditFlight }: TopBarProps) {
  return (
    <header style={{
      height: 52,
      background: 'rgba(10,10,15,0.98)',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 20px',
      gap: 16,
      flexShrink: 0,
      position: 'sticky',
      top: 0,
      zIndex: 100,
      backdropFilter: 'blur(20px)',
    }}>
      {/* Logo */}
      <div style={{
        fontFamily: '"DM Serif Display", Georgia, serif',
        fontSize: 20,
        background: 'linear-gradient(135deg, #7c6dfa, #a855f7)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        marginRight: 8,
        flexShrink: 0,
      }}>
        Terminal+
      </div>

      {/* Flight bar (compact) */}
      <div style={{ flex: 1, maxWidth: 500 }}>
        <FlightStatusBar
          compact
          onAddFlight={onEditFlight}
          onCTAPress={() => {/* navigate to gate */}}
        />
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
        <button style={{
          width: 32, height: 32, borderRadius: '50%',
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.08)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: 'rgba(255,255,255,0.5)',
        }}>
          <Search size={14} />
        </button>
        <button style={{
          width: 32, height: 32, borderRadius: '50%',
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.08)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: 'rgba(255,255,255,0.5)',
        }}>
          <Bell size={14} />
        </button>
        <button style={{
          width: 32, height: 32, borderRadius: '50%',
          background: 'linear-gradient(135deg, #7c6dfa, #a855f7)',
          border: 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: 'white', fontSize: 14,
        }}>
          👤
        </button>
      </div>
    </header>
  );
}

// ─── MOBILE HEADER ────────────────────────────────────────────────────────────

interface MobileHeaderProps {
  onEditFlight: (entry: CaptureEntry) => void;
  onChangeFlight?: () => void;
  banner?: React.ReactNode;
}

function MobileHeader({ onEditFlight, onChangeFlight, banner }: MobileHeaderProps) {
  return (
    <div style={{
      padding: '10px 14px 6px',
      background: 'rgba(10,10,15,0.98)',
      borderBottom: '1px solid rgba(255,255,255,0.04)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{
          fontFamily: '"DM Serif Display", Georgia, serif',
          fontSize: 20,
          background: 'linear-gradient(135deg, #7c6dfa, #a855f7)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          Terminal+
        </div>
        <button style={{
          background: 'none', border: 'none',
          color: 'rgba(255,255,255,0.4)', cursor: 'pointer',
        }}>
          <Search size={18} />
        </button>
      </div>
      <FlightStatusBar
        onAddFlight={onEditFlight}
        onChangeFlight={onChangeFlight}
        onCTAPress={(urgency) => {
          if (urgency === 'urgent' || urgency === 'boarding') {
            // Navigate to map / gate
          }
        }}
      />
      {banner}
    </div>
  );
}

// ─── MOBILE BOTTOM NAV ────────────────────────────────────────────────────────

function MobileBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const active = location.pathname === '/' ? 'vibes'
    : location.pathname.includes('map') ? 'map'
    : location.pathname.includes('saved') ? 'saved'
    : location.pathname.includes('profile') ? 'me'
    : 'vibes';

  return (
    <nav style={{
      height: 60,
      background: 'rgba(10,10,15,0.98)',
      borderTop: '1px solid rgba(255,255,255,0.06)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-around',
      padding: '0 8px',
      flexShrink: 0,
      position: 'sticky',
      bottom: 0,
      zIndex: 50,
    }}>
      {BOTTOM_NAV.map(item => {
        const isActive = item.key === active;
        return (
          <button
            key={item.key}
            onClick={() => navigate(item.path)}
            style={{
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: 3, padding: '6px 14px',
              borderRadius: 10, cursor: 'pointer',
              background: isActive ? 'rgba(124,109,250,0.1)' : 'none',
              border: 'none', fontFamily: 'inherit',
            }}
          >
            <span style={{
              fontSize: 20,
              filter: isActive ? 'drop-shadow(0 0 8px #7c6dfa)' : 'none',
            }}>{item.emoji}</span>
            <span style={{
              fontSize: 10, fontWeight: 500,
              color: isActive ? '#7c6dfa' : 'rgba(255,255,255,0.3)',
            }}>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

// ─── MAIN APP SHELL ───────────────────────────────────────────────────────────

interface AppShellProps {
  children: React.ReactNode;
  /** Called when user needs to edit/add flight (open onboarding step 2) */
  onEditFlight: (entry: CaptureEntry) => void;
  /** Called when a user with a flight wants to change it (capture opens at the flight step) */
  onChangeFlight?: () => void;
  /** Inline strip under the flight bar, in the sticky header (e.g. the outcome prompt). Renders nothing when empty. */
  banner?: React.ReactNode;
}

export function AppShell({ children, onEditFlight, onChangeFlight, banner }: AppShellProps) {
  const bp = useBreakpoint();
  const activeVibe = useActiveVibe();
  const navigate = useNavigate();

  const onVibeSelect = (key: string) => {
    // Scroll to vibe section on home, or navigate to home with vibe param
    navigate(`/?vibe=${key}`);
  };

  // ── DESKTOP ────────────────────────────────────────────────────────────────
  if (bp === 'desktop') {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        background: '#0a0a0f',
        color: '#f0f0f8',
        fontFamily: '"DM Sans", system-ui, sans-serif',
        overflow: 'hidden',
      }}>
        <TopBar onEditFlight={onEditFlight} />
        {banner && <div style={{ flexShrink: 0, padding: '0 20px' }}>{banner}</div>}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          <Sidebar
            activeVibe={activeVibe}
            onVibeSelect={onVibeSelect}
            onEditFlight={onEditFlight}
            onChangeFlight={onChangeFlight}
          />
          <main style={{
            flex: 1,
            overflowY: 'auto',
            background: '#0a0a0f',
          }}>
            {children}
          </main>
        </div>
      </div>
    );
  }

  // ── TABLET ─────────────────────────────────────────────────────────────────
  if (bp === 'tablet') {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        background: '#0a0a0f',
        color: '#f0f0f8',
        fontFamily: '"DM Sans", system-ui, sans-serif',
        overflow: 'hidden',
      }}>
        <TopBar onEditFlight={onEditFlight} />
        {banner && <div style={{ flexShrink: 0, padding: '0 20px' }}>{banner}</div>}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          <Sidebar
            collapsed
            activeVibe={activeVibe}
            onVibeSelect={onVibeSelect}
            onEditFlight={onEditFlight}
            onChangeFlight={onChangeFlight}
          />
          <main style={{ flex: 1, overflowY: 'auto', background: '#0a0a0f' }}>
            {children}
          </main>
        </div>
      </div>
    );
  }

  // ── MOBILE ─────────────────────────────────────────────────────────────────
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      background: '#0a0a0f',
      color: '#f0f0f8',
      fontFamily: '"DM Sans", system-ui, sans-serif',
      overflow: 'hidden',
    }}>
      <MobileHeader onEditFlight={onEditFlight} onChangeFlight={onChangeFlight} banner={banner} />
      <main style={{ flex: 1, overflowY: 'auto', background: '#0a0a0f' }}>
        {children}
      </main>
      <MobileBottomNav />
    </div>
  );
}

export default AppShell;
