// Database configuration for Terminal+
// This file centralizes all database table names and queries

export const DB_TABLES = {
  // Main amenity table - UPDATE THIS when table name changes
  AMENITIES: 'amenity_detail_rows11', // Change this to your live table name
  
  // Alternative table names (for migration)
  AMENITIES_DETAIL: 'amenity_detail',
  AMENITIES_NEW: 'syd_t1_new_dining_amenities',
  
  // Collection tables
  COLLECTIONS: 'collections',
  COLLECTION_AMENITIES: 'collection_amenities',
  
  // User tables
  USER_PROFILES: 'user_profiles',
  USER_FAVORITES: 'user_favorites',
  SOCIAL_ACTIVITIES: 'social_activities',
};

// Dynamic table name based on environment
export const getAmenitiesTable = () => {
  // You can change this logic based on your needs:
  // - Use environment variable
  // - Use different tables for different environments
  // - Switch between tables dynamically
  
  // Option 1: Use environment variable
  if (import.meta.env.VITE_AMENITIES_TABLE) {
    return import.meta.env.VITE_AMENITIES_TABLE;
  }
  
  // Option 2: Use default table
  return DB_TABLES.AMENITIES;
};

// Query helpers
export const amenityQueries = {
  // Get all amenities for a terminal
  byTerminal: (terminalCode: string) => ({
    table: getAmenitiesTable(),
    filters: { terminal_code: terminalCode }
  }),
  
  // Get single amenity by slug
  bySlug: (slug: string) => ({
    table: getAmenitiesTable(),
    filters: { amenity_slug: slug }
  }),
  
  // Get amenities by vibe tags
  byVibeTags: (tags: string[]) => ({
    table: getAmenitiesTable(),
    filters: tags.map(tag => `vibe_tags.ilike.%${tag}%`).join(',')
  })
};
