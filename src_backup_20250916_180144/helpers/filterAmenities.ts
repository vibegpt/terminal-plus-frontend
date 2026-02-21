import { Amenity } from "../types/Amenity";

export function filterAmenitiesByVibe(
  amenities: Amenity[],
  vibe: string
): Amenity[] {
  if (!vibe || vibe === "All") return amenities;
  
  console.log(`🔍 filterAmenitiesByVibe: Filtering for vibe "${vibe}"`);
  
  return amenities.filter((a) => {
    // Check multiple vibe fields to ensure we catch all vibes
    const vibeSources = [
      a.vibe,
      ...(Array.isArray(a.vibe_tags) ? a.vibe_tags : []),
      ...(Array.isArray(a.allVibes) ? a.allVibes : [])
    ];
    
    // Normalize and check if the vibe is included
    const normalizedVibe = vibe.toLowerCase();
    const hasVibe = vibeSources.some(v => 
      v && v.toLowerCase() === normalizedVibe
    );
    
    if (hasVibe) {
      console.log(`🔍 filterAmenitiesByVibe: Found "${vibe}" in ${a.name}:`, {
        vibe: a.vibe,
        vibe_tags: a.vibe_tags,
        allVibes: a.allVibes
      });
    }
    
    return hasVibe;
  });
}

export function sortByWalkTime(amenities: Amenity[]): Amenity[] {
  return amenities.slice().sort((a, b) => {
    const t1 = parseInt(a.walkTime);
    const t2 = parseInt(b.walkTime);
    return t1 - t2;
  });
} 