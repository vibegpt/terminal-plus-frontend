import React, { useState } from 'react';
import TransitTimeline from '@/components/TransitTimeline';
import { MixItUpToggle } from '@/components/MixItUpToggle';
import { VibePicker } from '@/components/VibePicker';
import { useRecommendationEngine } from '@/hooks/useRecommendationEngine';
import { Vibe } from '@/types/common.types';

const TransitPlannerPage: React.FC = () => {
  // Simulated user journey state
  const [userJourney] = useState({
    departure: 'SYD',
    arrival: 'LHR',
    transitAirport: 'SIN',
    layoverMinutes: 135, // could be dynamic or calculated later
    departureTimeUTC: 22, // 10pm Sydney local
    flightDurationMins: 540,
    energyLevel: 'default' // or 'low', 'high'
  });

  // Mix It Up state management
  const [mixItUpActive, setMixItUpActive] = useState(true); // ON by default in preview mode
  const [selectedVibe, setSelectedVibe] = useState<Vibe | undefined>();

  const [showNextStep, setShowNextStep] = useState(false);

  // Initialize journey data for recommendation engine
  const initialJourneyData = {
    from: userJourney.departure,
    to: userJourney.arrival,
    flightNumber: 'QF1', // Default flight number
    date: new Date().toISOString().split('T')[0], // Today's date
    layover: userJourney.transitAirport,
    selected_vibe: (selectedVibe || 'chill') as Vibe, // Default to chill if no vibe selected
    departure: userJourney.departure,
    destination: userJourney.arrival
  };

  // Use recommendation engine with Mix It Up integration
  const { 
    recommendations, 
    isLoading, 
    error 
  } = useRecommendationEngine({
    initialJourneyData,
    userLocationAirport: userJourney.departure, // User is at departure, previewing transit
    previewMode: true,
    mixItUp: mixItUpActive
  });

  const handleMixItUpToggle = (active: boolean) => {
    setMixItUpActive(active);
    if (active) {
      // When Mix It Up is activated, clear selected vibe
      setSelectedVibe(undefined);
    }
  };

  const handleVibeSelect = (vibe: Vibe) => {
    setSelectedVibe(vibe);
    // When a vibe is selected, turn off Mix It Up
    setMixItUpActive(false);
  };

  const handleContinue = () => {
    // Save to journey context or route to next screen
    setShowNextStep(true);
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Transit Stop Plan</h1>

      {userJourney.transitAirport === 'SIN' && (
        <>
          <TransitTimeline
            layoverMinutes={userJourney.layoverMinutes}
            departureTimeUTC={userJourney.departureTimeUTC}
            flightDurationMins={userJourney.flightDurationMins}
            energyLevel={userJourney.energyLevel as 'default' | 'low' | 'high'}
          />

          {/* Mix It Up Toggle */}
          <div className="mt-6 mb-4">
            <MixItUpToggle 
              isActive={mixItUpActive} 
              onToggle={handleMixItUpToggle}
            />
          </div>

          {/* Vibe Picker - Disabled when Mix It Up is active */}
          {!mixItUpActive && (
            <div className="mb-6">
              <VibePicker
                selectedVibe={selectedVibe}
                onVibeSelect={handleVibeSelect}
                disabled={mixItUpActive}
              />
            </div>
          )}

          {/* Recommendations Display */}
          <div className="mt-6">
            <h2 className="text-lg font-semibold mb-3">
              {mixItUpActive 
                ? 'Curated Picks for Your Transit Stop' 
                : `Recommendations for ${selectedVibe ? selectedVibe.charAt(0).toUpperCase() + selectedVibe.slice(1) : 'Your Vibe'}`
              }
            </h2>
            
            {isLoading && (
              <div className="text-gray-600">Loading recommendations...</div>
            )}
            
            {error && (
              <div className="text-red-600">Error loading recommendations: {error}</div>
            )}
            
            {recommendations && recommendations.length > 0 && (
              <div className="space-y-3">
                {recommendations.slice(0, 6).map((rec: any, index: number) => (
                  <div key={index} className="p-4 border rounded-lg bg-white shadow-sm">
                    <h3 className="font-medium">{rec.name || `Recommendation ${index + 1}`}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {rec.description || 'A great option for your transit stop'}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={handleContinue}
              className="px-6 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition"
            >
              Continue
            </button>
          </div>
        </>
      )}

      {showNextStep && (
        <div className="mt-8">
          <p className="text-lg text-gray-600">
            Next step: show main recommendations or save this journey.
          </p>
        </div>
      )}
    </div>
  );
};

export default TransitPlannerPage; 