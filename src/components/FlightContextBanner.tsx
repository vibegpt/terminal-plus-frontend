// src/components/FlightContextBanner.tsx
// Three states: Collapsed prompt → Expanded input → Active flight

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, Plane } from 'lucide-react';
import { lookupFlight, type FlightContext } from '@/services/flightLookupService';
import { trackFlightEvent } from '@/utils/flightAnalytics';

const STORAGE_KEY = 'terminal_plus_flight';
const DISMISS_KEY = 'flight_banner_dismiss';

interface FlightContextBannerProps {
  onFlightContext: (context: FlightContext | null) => void;
  currentTerminal: string;
}

type BannerState = 'collapsed' | 'expanded' | 'active';

function formatTimeUntil(minutes: number): string {
  if (minutes <= 0) return '0m';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

const FlightContextBanner: React.FC<FlightContextBannerProps> = ({
  onFlightContext,
  currentTerminal,
}) => {
  const [state, setState] = useState<BannerState>('collapsed');
  const [flightInput, setFlightInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [context, setContext] = useState<FlightContext | null>(null);
  const [hidden, setHidden] = useState(false);
  const [manualTime, setManualTime] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Restore from sessionStorage on mount
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: FlightContext = JSON.parse(stored);
        setContext(parsed);
        setState('active');
        onFlightContext(parsed);
        return;
      }
    } catch { /* ignore */ }

    // Check dismiss count
    const dismissCount = parseInt(sessionStorage.getItem(DISMISS_KEY) || '0', 10);
    if (dismissCount >= 3) {
      setHidden(true);
    } else {
      trackFlightEvent('flight_banner_shown');
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async () => {
    const trimmed = flightInput.trim();
    if (!trimmed || loading) return;

    setLoading(true);
    setError('');
    trackFlightEvent('flight_number_submitted', { flightNumber: trimmed });

    try {
      const result = await lookupFlight(trimmed, currentTerminal);
      setContext(result);
      setState('active');
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(result));
      onFlightContext(result);
      trackFlightEvent('flight_lookup_success', {
        airline: result.airline,
        journeyPhase: result.journeyPhase,
        minutesUntilBoarding: result.minutesUntilBoarding,
      });
    } catch {
      setError("Couldn't find that flight — check the number");
      trackFlightEvent('flight_lookup_failed', { flightNumber: trimmed, error: 'not_found' });
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    if (state === 'expanded') {
      const count = parseInt(sessionStorage.getItem(DISMISS_KEY) || '0', 10) + 1;
      sessionStorage.setItem(DISMISS_KEY, String(count));
      trackFlightEvent('flight_banner_dismissed', { dismissCount: count });
      if (count >= 3) {
        setHidden(true);
      }
      setState('collapsed');
      setFlightInput('');
      setError('');
    }
  };

  const handleClear = () => {
    setContext(null);
    setState('collapsed');
    sessionStorage.removeItem(STORAGE_KEY);
    onFlightContext(null);
    setFlightInput('');
    setManualTime('');
    trackFlightEvent('flight_context_cleared');
  };

  const handleManualTime = (timeStr: string) => {
    setManualTime(timeStr);
    if (!context || !timeStr) return;

    const [hours, mins] = timeStr.split(':').map(Number);
    const now = new Date();
    const departure = new Date(now);
    departure.setHours(hours, mins, 0, 0);
    // If the time is in the past today, assume tomorrow
    if (departure.getTime() < now.getTime()) {
      departure.setDate(departure.getDate() + 1);
    }

    const boardingDate = new Date(departure.getTime() - 35 * 60 * 1000);
    const minutesUntilBoarding = Math.max(0, Math.floor((boardingDate.getTime() - now.getTime()) / 60000));

    const updated: FlightContext = {
      ...context,
      departureTime: departure.toISOString(),
      boardingTime: boardingDate.toISOString(),
      minutesUntilBoarding,
    };
    setContext(updated);
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    onFlightContext(updated);
  };

  if (hidden) return null;

  return (
    <AnimatePresence mode="wait">
      {/* State 1: Collapsed prompt */}
      {state === 'collapsed' && (
        <motion.div
          key="collapsed"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <button
            onClick={() => { setState('expanded'); trackFlightEvent('flight_banner_expanded'); setTimeout(() => inputRef.current?.focus(), 100); }}
            className="w-full p-3 mx-4 mb-4 rounded-2xl bg-slate-100 flex items-center justify-between"
            style={{ width: 'calc(100% - 2rem)' }}
          >
            <div className="flex items-center space-x-2 text-gray-600">
              <Plane className="h-4 w-4" />
              <span className="text-sm">Got a flight?</span>
              <span className="text-gray-400 text-sm">·</span>
              <span className="text-xs text-gray-400">Add it for personalized timing</span>
            </div>
            <ChevronRight className="h-4 w-4 text-gray-400" />
          </button>
        </motion.div>
      )}

      {/* State 2: Expanded input */}
      {state === 'expanded' && (
        <motion.div
          key="expanded"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="mx-4 mb-4"
        >
          <div className="p-4 rounded-2xl bg-slate-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Enter your flight number</span>
              <button onClick={handleDismiss} className="p-1 rounded-full hover:bg-slate-200">
                <X className="h-4 w-4 text-gray-400" />
              </button>
            </div>
            <div className="flex gap-2">
              <div className="flex-1 flex items-center bg-white rounded-xl px-3 py-2 border border-gray-200 focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-400">
                <Plane className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={flightInput}
                  onChange={e => { setFlightInput(e.target.value.toUpperCase()); setError(''); }}
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                  placeholder="SQ317"
                  className="flex-1 text-sm outline-none bg-transparent uppercase text-gray-900 placeholder:text-gray-400"
                  autoCapitalize="characters"
                />
              </div>
              <button
                onClick={handleSubmit}
                disabled={!flightInput.trim() || loading}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl disabled:opacity-40 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
              >
                {loading ? '...' : 'Go'}
              </button>
            </div>
            {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
            {!error && <p className="text-xs text-gray-400 mt-2">We'll show you what fits your schedule</p>}
          </div>
        </motion.div>
      )}

      {/* State 3: Active flight */}
      {state === 'active' && context && (
        <motion.div
          key="active"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="mx-4 mb-4"
        >
          <div className="p-3 rounded-2xl bg-blue-50 border border-blue-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Plane className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-semibold text-gray-900">
                  {context.flightNumber} → {context.destination}
                </span>
              </div>
              <button onClick={handleClear} className="p-1 rounded-full hover:bg-blue-100">
                <X className="h-4 w-4 text-gray-400" />
              </button>
            </div>

            {/* Timing info */}
            <div className="ml-6 mt-1">
              {context.minutesUntilBoarding > 0 && context.hasRealTimeData ? (
                <span className="text-xs text-gray-600">
                  {formatTimeUntil(context.minutesUntilBoarding)} to boarding
                  {context.gate ? ` · Gate ${context.gate}` : ''}
                </span>
              ) : context.minutesUntilBoarding > 0 && !context.hasRealTimeData && context.boardingTime ? (
                <span className="text-xs text-gray-600">
                  {formatTimeUntil(context.minutesUntilBoarding)} to boarding
                  {context.gate ? ` · Gate ${context.gate}` : ''}
                </span>
              ) : context.hasRealTimeData && context.minutesUntilBoarding === 0 ? (
                <span className="text-xs font-medium text-orange-600">Boarding now</span>
              ) : (
                /* No real-time data and no boarding time — show time picker */
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-xs text-gray-500">What time is your flight?</span>
                  <input
                    type="time"
                    value={manualTime}
                    onChange={e => handleManualTime(e.target.value)}
                    className="text-xs border border-gray-300 rounded-lg px-2 py-1 bg-white"
                  />
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FlightContextBanner;
