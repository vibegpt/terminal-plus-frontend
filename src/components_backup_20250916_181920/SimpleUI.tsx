// src/components/SimpleUI.tsx - Simple MVP UI components
import React from 'react';

// Simple Loading Spinner
export const SimpleLoader: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[#0A0E27] via-[#1a1a2e] to-[#0A0E27]">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
      <p className="text-white/70">Loading...</p>
    </div>
  </div>
);

// Simple Error Component
export const SimpleError: React.FC<{ 
  message?: string; 
  onRetry?: () => void;
  showHomeButton?: boolean;
}> = ({ 
  message = "Something went wrong", 
  onRetry,
  showHomeButton = true 
}) => (
  <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[#0A0E27] via-[#1a1a2e] to-[#0A0E27]">
    <div className="text-center p-8">
      <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
        <span className="text-2xl">⚠️</span>
      </div>
      <h2 className="text-xl font-bold text-white mb-2">Oops!</h2>
      <p className="text-white/60 mb-6">{message}</p>
      <div className="space-y-3">
        {onRetry && (
          <button 
            onClick={onRetry}
            className="w-full px-6 py-3 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg text-blue-400 font-medium transition-all"
          >
            Try Again
          </button>
        )}
        {showHomeButton && (
          <button 
            onClick={() => window.location.href = '/'}
            className="w-full px-6 py-3 bg-white/10 hover:bg-white/20 rounded-lg text-white font-medium transition-all"
          >
            Go Home
          </button>
        )}
      </div>
    </div>
  </div>
);

// Simple Empty State
export const SimpleEmpty: React.FC<{ 
  message?: string; 
  onAction?: () => void;
  actionText?: string;
}> = ({ 
  message = "No items found", 
  onAction,
  actionText = "Go Back"
}) => (
  <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[#0A0E27] via-[#1a1a2e] to-[#0A0E27]">
    <div className="text-center p-8">
      <div className="w-16 h-16 bg-gray-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
        <span className="text-2xl">📭</span>
      </div>
      <h2 className="text-xl font-bold text-white mb-2">Nothing Here</h2>
      <p className="text-white/60 mb-6">{message}</p>
      {onAction && (
        <button 
          onClick={onAction}
          className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-lg text-white font-medium transition-all"
        >
          {actionText}
        </button>
      )}
    </div>
  </div>
);

// Simple Loading State for Components
export const SimpleLoadingState: React.FC = () => (
  <div className="flex items-center justify-center p-8">
    <div className="text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
      <p className="text-white/60 text-sm">Loading...</p>
    </div>
  </div>
);

// Simple Error State for Components
export const SimpleErrorState: React.FC<{ 
  error: string; 
  onRetry?: () => void;
}> = ({ error, onRetry }) => (
  <div className="flex flex-col items-center justify-center p-8">
    <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
      <span className="text-xl">⚠️</span>
    </div>
    <p className="text-white/60 text-center mb-4">{error}</p>
    {onRetry && (
      <button 
        onClick={onRetry}
        className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 rounded text-blue-400 text-sm transition-all"
      >
        Try Again
      </button>
    )}
  </div>
);
