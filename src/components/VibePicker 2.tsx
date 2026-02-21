// VibePicker.tsx — Vibe Selection Component

import { Vibe } from '@/types/common.types';

interface VibePickerProps {
  selectedVibe?: Vibe;
  onVibeSelect: (vibe: Vibe) => void;
  disabled?: boolean;
  className?: string;
}

export const VibePicker = ({ 
  selectedVibe, 
  onVibeSelect, 
  disabled = false,
  className = ''
}: VibePickerProps) => {
  // Define available vibes (excluding social and shop as per user request)
  const availableVibes: Vibe[] = ['chill', 'refuel', 'comfort', 'explore', 'quick', 'work'];
  
  const vibeStyles: Record<Vibe, string> = {
    chill: 'bg-gradient-to-br from-violet-100 to-violet-200 border-violet-300',
    work: 'bg-gradient-to-br from-orange-100 to-orange-200 border-orange-300',
    explore: 'bg-gradient-to-br from-green-100 to-green-200 border-green-300',
    quick: 'bg-gradient-to-br from-red-100 to-red-200 border-red-300',
    comfort: 'bg-gradient-to-br from-blue-100 to-blue-200 border-blue-300',
    refuel: 'bg-gradient-to-br from-yellow-100 to-yellow-200 border-yellow-300',
    social: 'bg-gradient-to-br from-pink-100 to-pink-200 border-pink-300',
    shop: 'bg-gradient-to-br from-purple-100 to-purple-200 border-purple-300'
  };

  const vibeLabels: Record<Vibe, string> = {
    chill: 'Chill',
    work: 'Work', 
    explore: 'Explore',
    quick: 'Quick',
    comfort: 'Comfort',
    refuel: 'Refuel',
    social: 'Social',
    shop: 'Shop'
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <label className="block text-sm font-medium text-gray-700">
        Select Your Vibe
      </label>
      <div className="grid grid-cols-2 gap-3">
        {availableVibes.map((vibe: Vibe) => (
          <button
            key={vibe}
            onClick={() => !disabled && onVibeSelect(vibe)}
            disabled={disabled}
            className={`
              p-3 rounded-lg border-2 transition-all duration-200 text-left
              ${vibeStyles[vibe]}
              ${selectedVibe === vibe 
                ? 'ring-2 ring-blue-500 ring-offset-2' 
                : 'hover:scale-105'
              }
              ${disabled 
                ? 'opacity-50 cursor-not-allowed' 
                : 'cursor-pointer'
              }
            `}
          >
            <div className="font-medium text-gray-800">
              {vibeLabels[vibe]}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}; 