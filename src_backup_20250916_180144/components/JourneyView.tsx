import React from 'react';
import { TerminalAmenity } from '@/types/amenity.types';
import { AmenityGrid } from './AmenityGrid';

interface JourneyViewProps {
  journey: any; 
  allAmenities: TerminalAmenity[];
  fromExplore: boolean;
}

export const JourneyView: React.FC<JourneyViewProps> = ({ journey, allAmenities, fromExplore }) => {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">{fromExplore ? 'Explore Mode' : 'Journey Details'}</h1>
      {journey && !fromExplore && <pre className="mb-4">{JSON.stringify(journey, null, 2)}</pre>}
      <AmenityGrid
        amenities={allAmenities as any}
        loading={false}
        error={null}
      />
    </div>
  );
}; 