// pages/VibeSelectionPage.tsx - Vibe selection for journey planning
import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useJourneyContext } from '@/hooks/useJourneyContext';
import { useMultiSegmentReturn } from '@/hooks/useMultiSegmentReturn';

const vibes = [
  { id: 'Chill', emoji: '😌', color: 'bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:hover:bg-blue-800' },
  { id: 'Explore', emoji: '🔍', color: 'bg-coral-100 hover:bg-coral-200 dark:bg-coral-900 dark:hover:bg-coral-800' },
  { id: 'Comfort', emoji: '🛋️', color: 'bg-purple-100 hover:bg-purple-200 dark:bg-purple-900 dark:hover:bg-purple-800' },
  { id: 'Refuel', emoji: '🍔', color: 'bg-orange-100 hover:bg-orange-200 dark:bg-orange-900 dark:hover:bg-orange-800' },
  { id: 'Work', emoji: '💼', color: 'bg-amber-100 hover:bg-amber-200 dark:bg-amber-900 dark:hover:bg-amber-800' },
  { id: 'Quick', emoji: '⚡', color: 'bg-yellow-100 hover:bg-yellow-200 dark:bg-yellow-900 dark:hover:bg-yellow-800' },
  { id: 'Shop', emoji: '🛍️', color: 'bg-pink-100 hover:bg-pink-200 dark:bg-pink-900 dark:hover:bg-pink-800' }
];

export default function VibeSelectionPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { journeyData, setJourneyData } = useJourneyContext();
  const [selectedVibe, setSelectedVibe] = useState(journeyData?.selected_vibe || '');
  const { returnToMultiSegment, isMultiSegmentMode, getSegmentInfo } = useMultiSegmentReturn();
  const segmentInfo = getSegmentInfo();

  // Multi-segment parameters
  const returnTo = searchParams.get('returnTo');
  const segment = searchParams.get('segment');
  const context = searchParams.get('context');
  const airport = searchParams.get('airport');
  const terminal = searchParams.get('terminal');

  const handleVibeSelect = (vibeId: string) => {
    setSelectedVibe(vibeId);
  };

  const handleContinue = () => {
    if (!selectedVibe) return;

    // Update journey data with selected vibe
    setJourneyData({ selected_vibe: selectedVibe });

    // Try to return to multi-segment planner first
    const didReturn = returnToMultiSegment(selectedVibe);
    
    if (!didReturn) {
      // Normal vibe selection flow
      navigate('/experience');
    }
  };

  const handleBack = () => {
    if (isMultiSegmentMode()) {
      navigate('/multi-segment-planner');
    } else {
      navigate('/smart-journey');
    }
  };

  const getContextTitle = () => {
    switch (context) {
      case 'departure': return `${airport} Departure Experience`;
      case 'transit': return `${airport} Transit Experience`;
      case 'arrival': return `${airport} Arrival Experience`;
      default: return 'Choose Your Vibe';
    }
  };

  const getContextDescription = () => {
    switch (context) {
      case 'departure': return `What's your mood for ${airport} departure?`;
      case 'transit': return `What's your mood for ${airport} layover?`;
      case 'arrival': return `What's your mood for ${airport} arrival?`;
      default: return "What's your airport mood today?";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        
        {/* Multi-segment context indicator */}
        {isMultiSegmentMode() && (
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
            <h2 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
              Planning Your {context} Experience
            </h2>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Select your vibe for {airport} {terminal}
            </p>
            <div className="mt-2 flex items-center gap-2">
              <button
                onClick={() => navigate('/multi-segment-planner')}
                className="text-xs text-blue-600 hover:text-blue-800 underline"
              >
                ← Back to Journey Planner
              </button>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={handleBack}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              {getContextTitle()}
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              {getContextDescription()}
            </p>
          </div>
          <div className="w-20"></div> {/* Spacer for centering */}
        </div>

        {/* Journey Info */}
        {journeyData && (
          <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
              Journey Details
            </h3>
            <div className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
              {journeyData.from && journeyData.to && (
                <p>Route: {journeyData.from} → {journeyData.to}</p>
              )}
              {journeyData.flightNumber && (
                <p>Flight: {journeyData.flightNumber}</p>
              )}
              {searchParams.get('airport') && (
                <p>Airport: {searchParams.get('airport')}</p>
              )}
              {searchParams.get('terminal') && (
                <p>Terminal: {searchParams.get('terminal')}</p>
              )}
              {segmentInfo && (
                <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-950 rounded">
                  <p className="text-blue-800 dark:text-blue-200 text-xs">
                    Planning {segmentInfo.context} experience for {segmentInfo.airport} {segmentInfo.terminal}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Vibe Selection Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {vibes.map((vibe) => (
            <button
              key={vibe.id}
              onClick={() => handleVibeSelect(vibe.id)}
              className={`${vibe.color} p-6 rounded-xl border-2 transition-all duration-200 hover:scale-105 hover:shadow-lg ${
                selectedVibe === vibe.id ? 'border-blue-500 ring-2 ring-blue-200' : 'border-transparent'
              }`}
            >
              <div className="text-4xl mb-2">{vibe.emoji}</div>
              <div className="font-semibold text-slate-900 dark:text-white">{vibe.id}</div>
            </button>
          ))}
        </div>

        {/* Action Buttons */}
        {selectedVibe && (
          <div className="text-center">
            <Button
              onClick={handleContinue}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
            >
              {isMultiSegmentMode() ? `Continue with ${selectedVibe}` : `Explore ${selectedVibe} Options`}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}

        {/* Debug Info */}
        {import.meta.env.DEV && (
          <details className="mt-8">
            <summary className="text-xs text-slate-500 cursor-pointer">Debug Info</summary>
            <pre className="mt-2 text-xs bg-slate-100 dark:bg-slate-800 p-2 rounded">
              {JSON.stringify({
                isMultiSegmentMode: isMultiSegmentMode(),
                returnTo,
                segment,
                context,
                airport,
                terminal,
                selectedVibe
              }, null, 2)}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}
