// Navigation utility for amenity links
export const navigateToAmenity = (amenitySlug: string, terminalCode?: string) => {
  if (terminalCode) {
    return `/amenity/${terminalCode}/${amenitySlug}`;
  }
  return `/amenity/${amenitySlug}`;
};

// Navigation from collection to amenity
export const navigateFromCollectionToAmenity = (amenity: any, currentTerminal: string) => {
  const slug = amenity.amenity_slug || amenity.name?.toLowerCase().replace(/\s+/g, '-');
  return navigateToAmenity(slug, currentTerminal);
};