import React, { useMemo } from "react";
import type { Amenity } from "../types/amenity.types";

type Props = {
  amenities: Amenity[];
  vibe: string;
  terminalCode: string;
};

const GoogleMapsTerminalView: React.FC<Props> = React.memo(({ amenities, vibe, terminalCode }) => {
  const filteredAmenities = useMemo(() => {
    return amenities.filter(a => a.terminal_code === terminalCode);
  }, [amenities, terminalCode]);

  return (
    <div className="map-container w-full h-[60vh] rounded-2xl border">
      {/* Simulated map */}
      <p className="p-4 text-sm text-gray-500">Rendering map for Terminal: <b>{terminalCode}</b></p>
      <ul className="text-xs p-4 space-y-1">
        {filteredAmenities.map((a) => (
          <li key={a.slug || a.id}>📍 {a.name}</li>
        ))}
      </ul>
    </div>
  );
});

GoogleMapsTerminalView.displayName = "GoogleMapsTerminalView";
export default GoogleMapsTerminalView; 