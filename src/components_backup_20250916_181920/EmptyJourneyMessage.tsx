import React from 'react';

export const EmptyJourneyMessage = () => {
  return (
    <div className="text-center py-10">
      <p className="text-lg">No journey details found.</p>
      <p className="text-sm text-gray-500">Please plan a new journey or start exploring to see details here.</p>
    </div>
  );
}; 