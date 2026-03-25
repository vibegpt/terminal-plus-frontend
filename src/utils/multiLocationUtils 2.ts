import { Amenity } from '../types/amenity.types';

/**
 * Check if an amenity is a multi-location amenity
 */
export function isMultiLocationAmenity(amenity: Amenity): boolean {
  return amenity.tags?.includes('multi-location') || false;
}

/**
 * Get the brand name from multi-location amenity tags
 */
export function getBrandFromTags(amenity: Amenity): string | null {
  if (!amenity.tags) return null;
  
  const brandTag = amenity.tags.find(tag => tag.startsWith('brand:'));
  return brandTag ? brandTag.replace('brand:', '') : null;
}

/**
 * Check if amenity should show all locations on map
 */
export function shouldShowAllLocations(amenity: Amenity): boolean {
  if (!amenity.tags) return false;
  
  const showAllTag = amenity.tags.find(tag => tag.startsWith('show-all:'));
  return showAllTag ? showAllTag.replace('show-all:', '') === 'true' : false;
}

/**
 * Check if amenity is a chain brand
 */
export function isChainBrand(amenity: Amenity): boolean {
  if (!amenity.tags) return false;
  
  const chainTag = amenity.tags.find(tag => tag.startsWith('chain:'));
  return chainTag ? chainTag.replace('chain:', '') === 'true' : false;
}

/**
 * Get display location for an amenity based on current terminal
 */
export function getDisplayLocation(amenity: Amenity, currentTerminal: string): string {
  if (isMultiLocationAmenity(amenity)) {
    // For multi-location amenities, show the specific terminal location
    return amenity.location_description || 'Available at multiple terminals';
  }
  
  // For regular amenities, return the standard location
  return amenity.location_description || '';
}

/**
 * Filter amenities based on journey phase (transit vs non-transit)
 */
export function filterAmenitiesByJourneyPhase(amenities: Amenity[], journeyPhase: 'transit' | 'departure' | 'arrival'): Amenity[] {
  if (journeyPhase === 'transit') {
    // Show all amenities during transit
    return amenities;
  } else {
    // Hide transit-only amenities during departure/arrival
    return amenities.filter(amenity => !amenity.tags?.includes('transit-only'));
  }
}

/**
 * Get all locations for a multi-location amenity across terminals
 */
export function getMultiLocationTerminals(amenity: Amenity): string[] {
  if (!isMultiLocationAmenity(amenity)) {
    return [amenity.terminal_code || ''];
  }
  
  // For multi-location amenities, we need to find all entries with the same slug
  // This would typically be done at the data level, but for now we return the current terminal
  return [amenity.terminal_code || ''];
}

/**
 * Check if an amenity is available in the current terminal
 */
export function isAvailableInTerminal(amenity: Amenity, currentTerminal: string): boolean {
  if (isMultiLocationAmenity(amenity)) {
    // For multi-location amenities, check if they have the multi-terminal tag
    // and if the current terminal matches the terminal_code
    return amenity.terminal_code === currentTerminal;
  }
  
  // For regular amenities, check exact terminal match
  return amenity.terminal_code === currentTerminal;
}

/**
 * Get a unique identifier for multi-location amenities
 */
export function getMultiLocationId(amenity: Amenity): string {
  if (isMultiLocationAmenity(amenity)) {
    return amenity.slug || amenity.name.toLowerCase().replace(/\s+/g, '-');
  }
  
  return amenity.slug || amenity.name.toLowerCase().replace(/\s+/g, '-');
} 