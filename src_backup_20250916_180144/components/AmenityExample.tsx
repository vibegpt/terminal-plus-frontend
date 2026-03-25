import React, { useMemo, useCallback } from "react";
import type { Amenity } from "../types/amenity.types";
import AmenityCard from "./AmenityCard";
import GoogleMapsTerminalView from "./GoogleMapsTerminalView";

type Props = {
  amenities: Amenity[];
  selectedTerminal: string;
  selectedVibe: string;
};

const AmenityExample: React.FC<Props> = React.memo(({ amenities, selectedTerminal, selectedVibe }) => {
  // Memoize filtered amenities to prevent unnecessary re-renders
  const filteredAmenities = useMemo(() => {
    return amenities.filter(a => a.terminal_code === selectedTerminal);
  }, [amenities, selectedTerminal]);

  // Memoize the callback to prevent child re-renders
  const handleDetailsClick = useCallback((amenityId: string) => {
    console.log(`Viewing details for amenity: ${amenityId}`);
    // Navigate to amenity detail page or open modal
  }, []);

  return (
    <div className="space-y-6">
      {/* Map View */}
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-4">Terminal Map</h2>
        <GoogleMapsTerminalView
          amenities={amenities}
          vibe={selectedVibe}
          terminalCode={selectedTerminal}
        />
      </div>

      {/* Amenity Cards */}
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-4">Amenities in {selectedTerminal}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAmenities.map((amenity) => (
            <AmenityCard
              key={amenity.id}
              amenity={amenity}
              onDetailsClick={() => handleDetailsClick(amenity.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
});

AmenityExample.displayName = "AmenityExample";
export default AmenityExample; 