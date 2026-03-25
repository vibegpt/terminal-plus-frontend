export function toSlug(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/['']/g, "")              // remove apostrophes
    .replace(/[^a-z0-9]+/g, "-")       // replace non-alphanum with hyphen
    .replace(/^-+|-+$/g, "");          // trim leading/trailing hyphens
}

// Utility function to normalize amenity data structure
export function normalizeAmenity(amenity: any) {
  return {
    id: amenity.id || amenity.amenity_id,
    name: amenity.name,
    slug: amenity.slug || amenity.amenity_slug,
    description: amenity.description,
    category: amenity.category,
    terminal_code: amenity.terminal_code || amenity.terminal,
    airport_code: amenity.airport_code || amenity.airport || 'SIN',
    vibe_tags: amenity.vibe_tags || amenity.vibes?.join(',') || '',
    price_level: amenity.price_level || amenity.price || '$$',
    opening_hours: amenity.opening_hours || amenity.hours,
    location: amenity.location,
    gate_proximity: amenity.gate_proximity || amenity.gates_nearby,
    walking_time: amenity.walking_time || amenity.walk_time || 5,
    available_in_tr: amenity.available_in_tr !== false,
    website_url: amenity.website_url || amenity.website,
    logo_url: amenity.logo_url || amenity.logo,
    image_url: amenity.image_url || amenity.image,
    rating: amenity.rating,
    crowd_level: amenity.crowd_level,
  };
}

function capitalizeFirst(str: string) {
  return str?.charAt(0).toUpperCase() + str?.slice(1).toLowerCase();
}

function autoDetectVibe(name: string, category: string): string {
  const str = `${name} ${category}`.toLowerCase();
  if (str.includes("currency")) return "Quick";
  if (str.includes("pharmacy")) return "Quick";
  if (str.includes("gift") || str.includes("souvenir") || str.includes("book")) return "Shop";
  if (str.includes("duty free")) return "Shop";
  if (str.includes("lounge") || str.includes("relax")) return "Comfort";
  if (str.includes("shower") || str.includes("wellness")) return "Comfort";
  if (str.includes("coffee") || str.includes("bar") || str.includes("cafe")) return "Refuel";
  if (str.includes("burger") || str.includes("eat") || str.includes("sushi")) return "Refuel";
  if (str.includes("tech") || str.includes("electronics")) return "Shop";
  if (str.includes("work") || str.includes("business") || str.includes("desk")) return "Work";
  return "Explore";
} 