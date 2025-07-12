import React, { useState } from 'react';
import TransitTimeline from '@/components/TransitTimeline';

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

  const [showNextStep, setShowNextStep] = useState(false);

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