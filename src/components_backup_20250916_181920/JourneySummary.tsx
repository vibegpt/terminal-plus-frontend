import React from 'react';

interface JourneySummaryProps {
  journey: {
    departure: string;
    destination: string;
    terminal?: string;
    gate?: string;
    departure_time?: string | number | Date;
    [key: string]: any;
  };
  className?: string;
}

export const JourneySummary: React.FC<JourneySummaryProps> = ({ journey, className = '' }) => {
  return (
    <div className={`bg-white rounded-lg shadow-md p-6 flex flex-col md:flex-row md:items-center md:justify-between ${className}`}>
      <div className="flex-1 mb-4 md:mb-0">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm text-gray-500">From</span>
          <span className="font-medium text-gray-900">{journey.departure}</span>
          <span className="mx-2 text-xl text-gray-400">→</span>
          <span className="text-sm text-gray-500">To</span>
          <span className="font-medium text-gray-900">{journey.destination}</span>
        </div>
        <div className="flex items-center gap-6 text-sm text-gray-700">
          <div>
            <span className="font-semibold">Terminal:</span> {journey.terminal || 'N/A'}
          </div>
          <div>
            <span className="font-semibold">Gate:</span> {journey.gate || 'TBD'}
          </div>
          <div>
            <span className="font-semibold">Departure:</span> {journey.departure_time ? (typeof journey.departure_time === 'string' ? new Date(journey.departure_time).toLocaleString() : journey.departure_time.toLocaleString()) : 'Not set'}
          </div>
        </div>
      </div>
    </div>
  );
}; 