/**
 * Utility to parse vibe_tags from various formats
 * Handles: comma-separated strings, JSON arrays, PostgreSQL arrays
 */

/**
 * Parse vibe_tags field from database into array of strings
 * @param vibeTags - Raw vibe_tags value from database (can be string, array, or null)
 * @returns Array of normalized lowercase vibe tag strings
 *
 * @example
 * parseVibeTags("chill,refuel,discover") // ["chill", "refuel", "discover"]
 * parseVibeTags('["chill","refuel"]') // ["chill", "refuel"]
 * parseVibeTags("{chill,refuel}") // ["chill", "refuel"] (PostgreSQL array)
 * parseVibeTags(["Chill", "Refuel"]) // ["chill", "refuel"]
 */
export function parseVibeTags(vibeTags: string | string[] | null | undefined): string[] {
  // Handle null/undefined
  if (!vibeTags) {
    return [];
  }

  // Already an array - normalize and return
  if (Array.isArray(vibeTags)) {
    return vibeTags
      .map(tag => tag.trim().toLowerCase())
      .filter(tag => tag.length > 0);
  }

  // String value - detect format and parse
  const trimmed = vibeTags.trim();

  // Empty string
  if (!trimmed) {
    return [];
  }

  // JSON array format: '["chill","refuel"]'
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed
          .map(tag => String(tag).trim().toLowerCase())
          .filter(tag => tag.length > 0);
      }
    } catch (e) {
      console.warn('Failed to parse JSON array vibe_tags:', trimmed);
    }
  }

  // PostgreSQL array format: {chill,refuel}
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    return trimmed
      .slice(1, -1) // Remove { }
      .split(',')
      .map(tag => tag.trim().toLowerCase())
      .filter(tag => tag.length > 0);
  }

  // Comma-separated format: "chill,refuel,discover"
  if (trimmed.includes(',')) {
    return trimmed
      .split(',')
      .map(tag => tag.trim().toLowerCase())
      .filter(tag => tag.length > 0);
  }

  // Single value
  return [trimmed.toLowerCase()];
}

/**
 * Check if amenity has specific vibe tag
 * @param vibeTags - Raw vibe_tags value
 * @param vibe - Vibe to check for (case-insensitive)
 */
export function hasVibeTag(
  vibeTags: string | string[] | null | undefined,
  vibe: string
): boolean {
  const tags = parseVibeTags(vibeTags);
  const normalizedVibe = vibe.toLowerCase();
  return tags.includes(normalizedVibe);
}

/**
 * Get all unique vibes from array of amenities
 * @param amenities - Array of amenities with vibe_tags
 */
export function getAllVibesFromAmenities(
  amenities: Array<{ vibe_tags?: string | string[] | null }>
): string[] {
  const vibesSet = new Set<string>();

  amenities.forEach(amenity => {
    const tags = parseVibeTags(amenity.vibe_tags);
    tags.forEach(tag => vibesSet.add(tag));
  });

  return Array.from(vibesSet).sort();
}

/**
 * Normalize vibe name to match database format (lowercase)
 * @param vibe - Vibe name in any case
 * @returns Normalized vibe name
 */
export function normalizeVibeName(vibe: string): string {
  return vibe.toLowerCase().trim();
}
