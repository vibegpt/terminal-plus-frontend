import React, { useState } from 'react';
import { MixItUpToggle } from './MixItUpToggle';
import { VibePicker } from './VibePicker';
import { Card } from './ui/card';

// Demo component to show Mix It Up functionality
export const MixItUpDemo: React.FC = () => {
  const [mixItUpActive, setMixItUpActive] = useState(false);
  const [selectedVibe, setSelectedVibe] = useState<string | undefined>();

  const handleMixItUpToggle = (active: boolean) => {
    setMixItUpActive(active);
    if (active) {
      // When Mix It Up is activated, clear selected vibe
      setSelectedVibe(undefined);
    }
  };

  const handleVibeSelect = (vibe: string) => {
    setSelectedVibe(vibe);
    // When a vibe is selected, turn off Mix It Up
    setMixItUpActive(false);
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold mb-4">Mix It Up Toggle Demo</h2>
      
      {/* Mix It Up Toggle */}
      <div className="flex justify-center">
        <MixItUpToggle 
          isActive={mixItUpActive} 
          onToggle={handleMixItUpToggle}
        />
      </div>

      {/* Vibe Picker - Disabled when Mix It Up is active */}
      {!mixItUpActive && (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Select Your Vibe:</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {['Chill', 'Explore', 'Work', 'Quick', 'Refuel', 'Comfort', 'Shop'].map((vibe) => (
              <button
                key={vibe}
                onClick={() => handleVibeSelect(vibe)}
                className={`p-3 rounded-lg border-2 transition-all ${
                  selectedVibe === vibe 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {vibe}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Status Display */}
      <Card className="p-4">
        <h3 className="font-semibold mb-2">Current State:</h3>
        <div className="space-y-1 text-sm">
          <p><strong>Mix It Up:</strong> {mixItUpActive ? '🟢 ON' : '🔴 OFF'}</p>
          <p><strong>Selected Vibe:</strong> {selectedVibe || 'None'}</p>
          <p><strong>Recommendation Type:</strong> {
            mixItUpActive 
              ? 'Mixed picks from all vibes' 
              : selectedVibe 
                ? `Personalized for ${selectedVibe} vibe` 
                : 'No selection'
          }</p>
        </div>
      </Card>

      {/* Explanation */}
      <Card className="p-4 bg-blue-50">
        <h3 className="font-semibold mb-2">How Mix It Up Works:</h3>
        <ul className="text-sm space-y-1">
          <li>• <strong>When OFF:</strong> Shows personalized recommendations based on selected vibe</li>
          <li>• <strong>When ON:</strong> Shows a curated mix of amenities from all vibes</li>
          <li>• <strong>Toggle Behavior:</strong> Selecting a vibe turns Mix It Up OFF, turning Mix It Up ON clears vibe selection</li>
          <li>• <strong>Use Case:</strong> Perfect for users who want variety or haven't decided on a specific vibe</li>
        </ul>
      </Card>
    </div>
  );
}; 