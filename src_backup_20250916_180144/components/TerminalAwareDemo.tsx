import React, { useState } from 'react';
import TerminalAwareCollection from './TerminalAwareCollection';
import { useCollectionAmenities } from '../hooks/useAmenities';
import { getTerminalSpecificAmenities } from '../utils/amenityContexts';

// Demo component showing terminal-aware collection display
// Demonstrates how collections show differently based on user's current terminal

const TerminalAwareDemo: React.FC = () => {
  const [currentTerminal, setCurrentTerminal] = useState('SIN-T3');
  
  // Get amenities for different collections
  const { amenities: exploreAmenities } = useCollectionAmenities(currentTerminal, 'explore');
  const { amenities: chillAmenities } = useCollectionAmenities(currentTerminal, 'chill');
  const { amenities: refuelAmenities } = useCollectionAmenities(currentTerminal, 'refuel');
  
  // Get terminal-specific amenities
  const terminalSpecificAmenities = getTerminalSpecificAmenities(currentTerminal);

  const handleAmenityClick = (amenityId: string) => {
    console.log(`Clicked amenity: ${amenityId} in ${currentTerminal}`);
  };

  const handleTerminalChange = (terminal: string) => {
    setCurrentTerminal(terminal);
    console.log(`Switched to terminal: ${terminal}`);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-center">
        Terminal-Aware Collection Demo
      </h1>
      
      <p className="text-gray-600 text-center mb-8 max-w-3xl mx-auto">
        Collections now show properly based on your current terminal, with terminal-specific highlights 
        and location-aware messaging. Switch terminals to see how the display changes!
      </p>

      {/* Terminal Selector */}
      <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
        <h2 className="text-xl font-bold mb-4 text-center text-blue-800">
          🛫 Select Your Terminal
        </h2>
        <div className="flex flex-wrap justify-center gap-3">
          {['SIN-T1', 'SIN-T2', 'SIN-T3', 'SIN-T4', 'SIN-JEWEL'].map(terminal => (
            <button
              key={terminal}
              onClick={() => handleTerminalChange(terminal)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                currentTerminal === terminal
                  ? 'bg-blue-600 text-white shadow-lg scale-105'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {terminal}
            </button>
          ))}
        </div>
        
        <div className="mt-4 text-center">
          <p className="text-sm text-blue-700">
            <strong>Current Terminal:</strong> {currentTerminal}
          </p>
          <p className="text-xs text-blue-600 mt-1">
            Collections will show terminal-specific highlights and local messaging
          </p>
        </div>
      </div>

      {/* Terminal-Specific Summary */}
      {terminalSpecificAmenities.length > 0 && (
        <div className="mb-8 p-6 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
          <h2 className="text-xl font-bold mb-4 text-center text-yellow-800">
            🌟 {currentTerminal} Terminal Highlights
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {terminalSpecificAmenities.slice(0, 6).map(amenity => (
              <div key={amenity.amenityId} className="bg-white p-4 rounded-lg border border-yellow-200">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">{amenity.contexts[0]?.icon || '✨'}</span>
                  <h3 className="font-semibold text-gray-900">{amenity.name}</h3>
                </div>
                <p className="text-sm text-gray-600 mb-2">{amenity.baseDescription}</p>
                <div className="flex flex-wrap gap-1">
                  {amenity.contexts.slice(0, 2).map((ctx, idx) => (
                    <span key={idx} className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                      {ctx.collectionSlug}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Explore Collection - Terminal Aware */}
      <div className="mb-12">
        <TerminalAwareCollection
          collectionSlug="explore"
          terminalCode={currentTerminal}
          amenities={exploreAmenities}
          title="Explore Collection"
          description="Discover amazing attractions and experiences"
          onAmenityClick={handleAmenityClick}
          showTerminalHighlights={true}
        />
      </div>

      {/* Chill Collection - Terminal Aware */}
      <div className="mb-12">
        <TerminalAwareCollection
          collectionSlug="chill"
          terminalCode={currentTerminal}
          amenities={chillAmenities}
          title="Chill Collection"
          description="Find peace and relaxation in beautiful spaces"
          onAmenityClick={handleAmenityClick}
          showTerminalHighlights={true}
        />
      </div>

      {/* Refuel Collection - Terminal Aware */}
      <div className="mb-12">
        <TerminalAwareCollection
          collectionSlug="refuel"
          terminalCode={currentTerminal}
          amenities={refuelAmenities}
          title="Refuel Collection"
          description="Delicious food and beverage options"
          onAmenityClick={handleAmenityClick}
          showTerminalHighlights={true}
        />
      </div>

      {/* Key Features Summary */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-xl font-bold mb-4 text-center">🎯 Key Features</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold text-gray-800 mb-2">✅ Collections Show Properly</h4>
            <ul className="space-y-1 text-sm text-gray-600">
              <li>• Jewel Explore: 7 must-see attractions</li>
              <li>• Garden City: Multiple gardens across terminals</li>
              <li>• Terminal-specific counts and descriptions</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-800 mb-2">📍 Terminal-Specific Highlights</h4>
            <ul className="space-y-1 text-sm text-gray-600">
              <li>• User in T3 sees T3's Butterfly Garden highlighted</li>
              <li>• Location-aware messaging and descriptions</li>
              <li>• Terminal-specific badges and emphasis</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Example Scenarios */}
      <div className="mt-8 space-y-6">
        <h3 className="text-xl font-bold text-center">🌍 Example Scenarios</h3>
        
        {/* T3 User Scenario */}
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <h4 className="font-semibold text-green-800 mb-2">🦋 T3 User Experience</h4>
          <p className="text-green-700 text-sm">
            When you're in <strong>SIN-T3</strong>, the Butterfly Garden appears as a highlighted attraction 
            with messaging like "🌟 T3 Highlight: Your terminal's butterfly paradise" and 
            "Right here in Terminal 3 - step into a world of fluttering beauty"
          </p>
        </div>

        {/* T1 User Scenario */}
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h4 className="font-semibold text-blue-800 mb-2">💎 T1 User Experience</h4>
          <p className="text-blue-700 text-sm">
            When you're in <strong>SIN-T1</strong>, Jewel attractions are highlighted with 
            "🚶‍♂️ T1 Access: Direct walkway to Jewel" and directions for easy access
          </p>
        </div>

        {/* Cross-Terminal Collections */}
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
          <h4 className="font-semibold text-purple-800 mb-2">🌺 Cross-Terminal Collections</h4>
          <p className="text-purple-700 text-sm">
            Collections like "Garden City Gems" show multiple gardens across terminals, 
            but highlight what's available in your current terminal while showing other options
          </p>
        </div>
      </div>
    </div>
  );
};

export default TerminalAwareDemo;
