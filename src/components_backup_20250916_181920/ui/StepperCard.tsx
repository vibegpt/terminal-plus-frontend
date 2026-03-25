import React from 'react';

interface StepperCardProps {
  children: React.ReactNode;
  step?: number;
  totalSteps?: number;
  title?: string;
  progress?: number;
  onBack?: () => void;
}

const StepperCard: React.FC<StepperCardProps> = ({ 
  children, 
  step = 1, 
  totalSteps = 4, 
  title = 'Home', 
  progress = 25,
  onBack 
}) => {
  return (
    <div className="max-w-2xl mx-auto p-6 rounded-2xl bg-[#1A2640] text-white shadow-xl">
      <div className="flex items-center justify-between mb-2">
        <button 
          className="text-sm text-gray-400 hover:text-white transition"
          onClick={onBack}
        >
          ← Back
        </button>
        <span className="text-lg">🏠 {title}</span>
        <span className="text-sm text-gray-400">Step {step} of {totalSteps}</span>
      </div>

      <div className="h-2 rounded-full bg-[#2C3E66] overflow-hidden mb-6">
        <div
          className="h-full bg-[#82F0FF] transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {children}
    </div>
  );
};

export default StepperCard; 