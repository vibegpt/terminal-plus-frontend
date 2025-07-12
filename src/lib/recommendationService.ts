import { TerminalAmenity } from '@/types/amenity';

type Coordinates = { lat: number; lng: number };

// Filters amenities based on selected vibe
export function filterAmenitiesByVibe(amenities: TerminalAmenity[], selectedVibe: string | null): TerminalAmenity[] {
  if (!selectedVibe) return amenities;
  return amenities.filter((a) => a.vibe_tags?.includes(selectedVibe));
}

// Sorts amenities based on distance to user
export function sortByDistance(amenities: TerminalAmenity[], userLocation: Coordinates | null): TerminalAmenity[] {
  if (!userLocation) return amenities;

  // Using simple Euclidean distance for x,y coordinates
  const calculateDistance = (coords1: {x: number, y: number}, coords2: {x: number, y: number}) => {
    return Math.sqrt(Math.pow(coords1.x - coords2.x, 2) + Math.pow(coords1.y - coords2.y, 2));
  };

  // This is a placeholder for a proper lat/lng to x/y conversion if needed
  const userLocationXY = { x: userLocation.lng, y: userLocation.lat };

  return [...amenities].sort((a, b) => {
    if(!a.coordinates || !b.coordinates) return 0;
    const distA = calculateDistance(userLocationXY, a.coordinates);
    const distB = calculateDistance(userLocationXY, b.coordinates);
    return distA - distB;
  });
} 