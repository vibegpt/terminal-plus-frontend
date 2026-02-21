// List of free amenities in Hidden Gems collection
// These should display without dollar signs
export const HIDDEN_GEMS_FREE_AMENITIES = [
  // Free amenities that should show "Free" instead of dollar sign
  'rooftop-cactus-garden',
  'cactus-garden-t1',
  'cactus-garden',
  'heritage-zone',
  'prayer-room-garden',
  'prayer-room',
  'orchid-garden',
  'koi-pond',
  'meditation-corner',
  'secret-library',
  'hidden-terrace',
  'local-art-corner',
  'art-corner'
];

// Helper function to check if an amenity is free in Hidden Gems
export function isHiddenGemsFreeAmenity(amenitySlug: string | undefined): boolean {
  if (!amenitySlug) return false;
  
  const slug = amenitySlug.toLowerCase();
  
  // Check if the slug matches or contains any of the free amenity identifiers
  return HIDDEN_GEMS_FREE_AMENITIES.some(freeSlug => {
    const free = freeSlug.toLowerCase();
    return slug === free || 
           slug.includes(free) || 
           free.includes(slug) ||
           slug.replace(/-t\d+$/, '') === free || // Handle terminal suffixes
           slug.split('-').some(part => free.includes(part));
  });
}
