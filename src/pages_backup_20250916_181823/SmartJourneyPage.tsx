// pages/SmartJourneyPage.tsx - Main page integrating all smart flight functionality
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SmartFlightInput from '../components/SmartFlightInput';
import { useJourneyContext } from '../context/JourneyContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft, RefreshCw, Settings } from 'lucide-react';

// Inner component that uses context
function SmartJourneyContent() {
  const navigate = useNavigate();
  const { state, actions } = useJourneyContext();

  // Auto-detect location on mount
  useEffect(() => {
    actions.detectLocation();
  }, []);

  // Auto-refresh flight status every 5 minutes when user has an active journey
  useEffect(() => {
    if (!state.flightData) return;

    const interval = setInterval(() => {
      actions.refreshFlightStatus();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [state.flightData]);

  // Handle navigation to next step based on journey completion
  const handleContinue = () => {
    if (!state.flightData || !state.journeyScope) return;

    // Save the current context
    actions.saveContext();

    // Navigate based on user mode and journey scope
    if (state.userMode === 'BASIC') {
      // Basic mode: go directly to essential recommendations
      navigate('/experience?mode=basic');
    } else if (state.journeyScope.type === 'current-segment') {
      // Single segment: go to vibe selection then recommendations
      navigate('/vibe-selection');
    } else {
      // Multi-segment: go to full journey planning
      navigate('/multi-segment-planner');
    }
  };

  // Handle starting over
  const handleStartOver = () => {
    actions.clearContext();
    // Component will re-render with initial state
  };

  // Handle going back to previous step
  const handleBack = () => {
    if (state.flightData && !state.journeyScope) {
      // Clear flight data to go back to input
      actions.clearContext();
    } else {
      // Go back to home
      navigate('/');
    }
  };

  // Render different states based on journey progress
  const renderContent = () => {
    // No flight data: show input form
    if (!state.flightData) {
      return <SmartFlightInput />;
    }

    // Flight data but no journey scope (multi-segment needs scope selection)
    if (!state.journeyScope) {
      return <SmartFlightInput />;
    }

    // Journey is ready: show summary and continue options
    return (
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        {/* Header with back button */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={handleBack}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <Button
            variant="ghost"
            onClick={actions.refreshFlightStatus}
            disabled={state.isLoading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${state.isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Journey Summary */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
            🎯 Journey Ready!
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Your personalized airport experience is ready
          </p>
        </div>

        {/* Flight Information Card */}
        <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950 dark:to-blue-950 p-6 rounded-xl border border-green-200 dark:border-green-800">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-green-800 dark:text-green-200">
                {state.flightData.flightNumber}
              </h2>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                state.userMode === 'BASIC' ? 'bg-red-100 text-red-800' :
                state.userMode === 'SMART' ? 'bg-yellow-100 text-yellow-800' :
                'bg-green-100 text-green-800'
              }`}>
                {state.userMode === 'BASIC' ? '⚡ Quick Mode' :
                 state.userMode === 'SMART' ? '🎯 Smart Mode' :
                 '🌟 Full Experience'}
              </span>
            </div>

            {/* Route Display */}
            <div className="text-green-700 dark:text-green-300">
              {state.journeyScope.type === 'current-segment' && state.journeyScope.currentSegment ? (
                <p className="text-lg">
                  📍 {state.journeyScope.currentSegment.route}
                </p>
              ) : (
                <p className="text-lg">
                  🌍 {state.flightData.segments.map(s => s.route).join(' → ')}
                </p>
              )}
            </div>

            {/* Timing Information */}
            {state.timeContext.boardingTime && (
              <div className="flex items-center justify-between text-sm text-green-600 dark:text-green-400">
                <div>
                  ⏰ Boarding: {state.timeContext.boardingTime.toLocaleTimeString('en-GB', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
                <div>
                  ⏳ {state.timeContext.timeUntilBoarding} minutes until boarding
                </div>
              </div>
            )}

            {/* Layover Information for Multi-Segment */}
            {state.journeyScope.type === 'full-journey' && state.journeyScope.layoverDetails && (
              <div className="mt-4 p-3 bg-white/50 dark:bg-slate-800/50 rounded-lg">
                <h3 className="text-sm font-semibold text-green-800 dark:text-green-200 mb-2">
                  Layover Details:
                </h3>
                {state.journeyScope.layoverDetails.map((layover, index) => (
                  <div key={index} className="text-xs text-green-700 dark:text-green-300">
                    • {layover.airport}: {layover.duration}
                    {layover.transitRequired && ' (Terminal change required)'}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* User Mode Explanation */}
        <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
          <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
            What to expect:
          </h3>
          <div className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
            {state.userMode === 'BASIC' && (
              <>
                <p>• ⚡ Quick, essential recommendations only</p>
                <p>• 🎯 Options near your gate and departure area</p>
                <p>• ⏰ Perfect for when you're short on time</p>
              </>
            )}
            {state.userMode === 'SMART' && (
              <>
                <p>• 🎭 Quick vibe selection for personalization</p>
                <p>• 👥 Social proof from other travelers</p>
                <p>• 💾 Save favorites for your terminal plan</p>
              </>
            )}
            {state.userMode === 'FULL' && (
              <>
                <p>• 🎭 Complete vibe-based personalization</p>
                                  <p>• 🎤 Optional emotion detection for mood matching</p>
                <p>• 🗺️ Cross-context planning (departure/transit/arrival)</p>
                <p>• 👥 Full social community features</p>
              </>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            onClick={handleContinue}
            className="w-full py-6 text-lg bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
          >
            {state.userMode === 'BASIC' ? '⚡ Get Quick Recommendations' :
             state.journeyScope.type === 'current-segment' ? '🎯 Choose Your Vibe' :
             '🌟 Plan Complete Journey'}
          </Button>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleStartOver}
              className="flex-1"
            >
              Start Over
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/settings')}
              className="flex-1 flex items-center justify-center gap-2"
            >
              <Settings className="h-4 w-4" />
              Settings
            </Button>
          </div>
        </div>

        {/* Debug Information (development only) */}
        {import.meta.env.DEV && (
          <details className="mt-6">
            <summary className="cursor-pointer text-xs text-slate-500">
              Debug Info (dev only)
            </summary>
            <pre className="mt-2 text-xs bg-slate-100 dark:bg-slate-900 p-2 rounded overflow-auto">
              {JSON.stringify({ 
                userMode: state.userMode,
                timeContext: state.timeContext,
                journeyScope: state.journeyScope?.type,
                segmentCount: state.flightData?.segments.length,
                gpsLocation: state.gpsLocation?.airport
              }, null, 2)}
            </pre>
          </details>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Error Display */}
      {state.error && (
        <div className="max-w-2xl mx-auto p-6">
          <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 p-4 rounded-lg">
            <div className="text-red-800 dark:text-red-200">
              <strong>Error:</strong> {state.error}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleStartOver}
              className="mt-2"
            >
              Try Again
            </Button>
          </div>
        </div>
      )}

      {/* Main Content */}
      {!state.error && renderContent()}
    </div>
  );
}

// Main page component with context provider
export default function SmartJourneyPage() {
  return <SmartJourneyContent />;
}

// Export additional components for routing
export { SmartFlightInput };

// Export hook for other pages that need journey context
export { useJourneyContext, useFlightSearch, useGPSLocation, useUserMode, useJourneyScope } from '../context/JourneyContext'; 