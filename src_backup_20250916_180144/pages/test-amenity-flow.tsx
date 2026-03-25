import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { JourneyRecommendations } from '@/components/JourneyRecommendations';
import { useJourneyContext } from '@/context/JourneyContext';
import { useAdaptiveRecommendations } from '@/hooks/useAdaptiveRecommendations';

export default function TestAmenityFlow() {
  const navigate = useNavigate();
  const { actions } = useJourneyContext();

  // Set up test journey data
  React.useEffect(() => {
    updateJourneyData({
      departure: 'SYD',
      destination: 'LHR',
      selected_vibe: 'refuel',
      layovers: ['SIN'],
      terminal: 'T1',
      departureGate: 'A1',
      departure_time: new Date(Date.now() + 60 * 60 * 1000).toISOString() // 1 hour from now
    });
  }, []); // Remove updateJourneyData from dependencies to prevent infinite loop

  // Test the new adaptive recommendations hook
  const {
    recommendations,
    loading,
    error,
    activeVibe,
    changeVibe,
    timeAvailableMinutes,
    priorityFlags
  } = useAdaptiveRecommendations([], {
    initialVibe: 'refuel',
    timeAvailableMinutes: 45
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-4">
            🧪 Test Amenity Flow
          </h1>
          <p className="text-slate-600 mb-6">
            Test the new clickable amenity recommendations and enhanced detail screens
          </p>
          <div className="flex gap-4 justify-center">
            <Button onClick={() => navigate('/')}>
              🏠 Back to Home
            </Button>
            <Button onClick={() => navigate('/plan-journey-stepper')} variant="outline">
              📋 Journey Planner
            </Button>
          </div>
        </div>

        {/* Test Instructions */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 text-slate-900">
            🎯 How to Test
          </h2>
          <div className="space-y-3 text-slate-700">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
              <div>
                <strong>Click on any amenity card below</strong> - Each card is now clickable and will navigate to a detailed view
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
              <div>
                <strong>Explore the enhanced detail screen</strong> - Features tabs for Overview, Menu, Info, and Tips
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
              <div>
                <strong>Test navigation</strong> - Use the back button to return to recommendations
              </div>
            </div>
          </div>
        </div>

        {/* Available Amenities for Testing */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 text-slate-900">
            🍽️ Available Amenities for Testing
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold text-green-600">Coffee & Breakfast</h3>
              <p className="text-sm text-slate-600">Slug: coffee-breakfast</p>
              <Button 
                size="sm" 
                className="mt-2"
                onClick={() => navigate('/amenity/coffee-breakfast')}
              >
                View Details
              </Button>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold text-blue-600">Duty Free Shopping</h3>
              <p className="text-sm text-slate-600">Slug: duty-free-shopping</p>
              <Button 
                size="sm" 
                className="mt-2"
                onClick={() => navigate('/amenity/duty-free-shopping')}
              >
                View Details
              </Button>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold text-purple-600">Airline Lounge</h3>
              <p className="text-sm text-slate-600">Slug: airline-lounge</p>
              <Button 
                size="sm" 
                className="mt-2"
                onClick={() => navigate('/amenity/airline-lounge')}
              >
                View Details
              </Button>
            </div>
          </div>
        </div>

        {/* Adaptive Recommendations Hook Test */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 text-slate-900">
            🔄 Adaptive Recommendations Hook Test
          </h2>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium">Active Vibe:</span>
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">{activeVibe}</span>
              <Button 
                size="sm" 
                onClick={() => changeVibe(activeVibe === 'refuel' ? 'explore' : 'refuel')}
              >
                Toggle Vibe
              </Button>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium">Time Available:</span>
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded">{timeAvailableMinutes} minutes</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium">Priority Flags:</span>
              <div className="flex gap-2">
                {priorityFlags.show_time_sensitive && (
                  <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs">Time Sensitive</span>
                )}
                {priorityFlags.avoid_long_walks && (
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">Avoid Long Walks</span>
                )}
                {priorityFlags.prefer_quick_restore && (
                  <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs">Quick Restore</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium">Status:</span>
              {loading && <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">Loading...</span>}
              {error && <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs">Error: {error.message}</span>}
              {!loading && !error && <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">Ready</span>}
            </div>
          </div>
        </div>

        {/* Live Recommendations Test */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-slate-900">
            🎯 Live Recommendations Test
          </h2>
          <p className="text-slate-600 mb-6">
            These are the actual clickable recommendation cards that will appear in your journey planner:
          </p>
          
          <JourneyRecommendations
            context="departure"
            onBack={() => console.log('Back clicked')}
          />
        </div>
      </div>
    </div>
  );
} 