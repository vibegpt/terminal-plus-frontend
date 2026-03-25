// MixItUpToggle.tsx — UI Toggle Switch Component for Mix It Up Mode

import { useState } from 'react';

interface MixItUpToggleProps {
  isActive: boolean;
  onToggle: (active: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export const MixItUpToggle = ({ 
  isActive, 
  onToggle, 
  disabled = false,
  className = ''
}: MixItUpToggleProps) => {
  return (
    <div className={`flex items-center justify-center gap-4 ${className}`}>
      <span className="text-sm font-medium text-white">
        Your Vibe
      </span>
      <button
        onClick={() => !disabled && onToggle(!isActive)}
        disabled={disabled}
        className={`
          relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-200
          ${isActive 
            ? 'bg-blue-500 shadow-lg' 
            : 'bg-gray-200 shadow-lg'
          }
          ${disabled 
            ? 'opacity-50 cursor-not-allowed' 
            : 'cursor-pointer'
          }
        `}
        style={{
          boxShadow: isActive 
            ? '0 0 8px #38BDF8, 0 0 12px #38BDF8' 
            : '0 0 8px #38BDF8'
        }}
      >
        <span
          className={`
            inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200
            ${isActive ? 'translate-x-6' : 'translate-x-1'}
          `}
          style={{
            boxShadow: '0 0 8px #D946EF, 0 0 12px #D946EF'
          }}
        />
      </button>
      <span className="text-sm font-medium text-white">
        Mix It Up
      </span>
    </div>
  );
}; 