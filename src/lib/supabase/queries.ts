// src/lib/supabase/queries.ts - Collection and amenity queries
import { supabase } from '../supabase';
import { Amenity, EnrichedAmenity, CollectionVibeMap, BestOfCategory } from '../../types/database.types';
import { enrichAmenityData } from '../../utils/collectionMapper';
import { COLLECTION_VIBE_MAP } from '../../constants/adaptiveCollections';

// Mock data for testing when Supabase doesn't have data
const MOCK_AMENITIES: Record<string, Partial<Amenity>[]> = {
  'jewel-wonders': [
    {
      amenity_slug: 'rain-vortex',
      name: 'HSBC Rain Vortex',
      description: 'World\'s tallest indoor waterfall at 40m high',
      vibe_tags: 'jewel,spectacular,instagram,must-see',
      price_level: 'Free',
      opening_hours: '10:00-22:00',
      terminal_code: 'Jewel',
      airport_code: 'SIN'
    },
    {
      amenity_slug: 'canopy-park',
      name: 'Canopy Park',
      description: 'Nature-themed entertainment on the rooftop',
      vibe_tags: 'jewel,family,adventure,outdoor',
      price_level: '$$',
      opening_hours: '10:00-22:00',
      terminal_code: 'Jewel',
      airport_code: 'SIN'
    },
    {
      amenity_slug: 'shiseido-forest',
      name: 'Shiseido Forest Valley',
      description: 'Five-storey indoor garden with over 900 trees',
      vibe_tags: 'jewel,nature,peaceful,scenic',
      price_level: 'Free',
      opening_hours: '24 hours',
      terminal_code: 'Jewel',
      airport_code: 'SIN'
    },
    {
      amenity_slug: 'hedge-maze',
      name: 'Hedge Maze',
      description: 'Singapore\'s largest hedge maze with observation tower',
      vibe_tags: 'jewel,adventure,family,fun',
      price_level: '$',
      opening_hours: '10:00-22:00',
      terminal_code: 'Jewel',
      airport_code: 'SIN'
    }
  ],
  'quick-bites': [
    {
      amenity_slug: 'shake-shack',
      name: 'Shake Shack',
      description: 'American burgers, fries and shakes',
      vibe_tags: 'quick,burger,american,fast-food',
      price_level: '$$',
      opening_hours: '10:00-22:00',
      terminal_code: 'T3',
      airport_code: 'SIN'
    },
    {
      amenity_slug: 'burger-labo',
      name: 'Burger & Lobster',
      description: 'Premium burgers and fresh lobster',
      vibe_tags: 'quick,burger,seafood,premium',
      price_level: '$$$',
      opening_hours: '11:00-23:00',
      terminal_code: 'Jewel',
      airport_code: 'SIN'
    }
  ],
  'hidden-gems': [
    {
      amenity_slug: 'rooftop-cactus',
      name: 'Rooftop Cactus Garden',
      description: 'Secret cactus garden on Terminal 1 rooftop',
      vibe_tags: 'hidden,secret,garden,unique',
      price_level: 'Free',
      opening_hours: '24 hours',
      terminal_code: 'T1',
      airport_code: 'SIN'
    },
    {
      amenity_slug: 'viewing-mall',
      name: 'T3 Viewing Mall',
      description: 'Hidden observation deck for plane spotting',
      vibe_tags: 'hidden,viewing,aviation,quiet',
      price_level: 'Free',
      opening_hours: '24 hours',
      terminal_code: 'T3',
      airport_code: 'SIN'
    }
  ]
};

// Get amenities by collection using vibe tags
export const getAmenitiesByCollection = async (
  collectionSlug: string,
  airportCode?: string,
  terminalCode?: string
): Promise<EnrichedAmenity[]> => {
  console.log('[getAmenitiesByCollection] Fetching for:', { collectionSlug, airportCode, terminalCode });
  
  // Get the collection's vibe configuration
  const collectionConfig = COLLECTION_VIBE_MAP[collectionSlug];
  
  if (!collectionConfig) {
    console.warn(`No vibe configuration found for collection: ${collectionSlug}`);
    
    // Check if we have mock data for this collection
    if (MOCK_AMENITIES[collectionSlug]) {
      console.log('[getAmenitiesByCollection] Using mock data for:', collectionSlug);
      const mockData = MOCK_AMENITIES[collectionSlug].map((amenity, index) => ({
        id: index + 1,
        created_at: new Date().toISOString(),
        ...amenity
      } as Amenity));
      return mockData.map(enrichAmenityData);
    }
    
    return [];
  }

  const vibes = collectionConfig.vibes;
  
  // Build the query
  let query = supabase
    .from('amenities')
    .select('*');

  // Filter by vibe tags (using OR logic for multiple vibes)
  if (vibes.length > 0) {
    // Create OR filters for each vibe
    const vibeFilters = vibes.map(vibe => 
      `vibe_tags.ilike.%${vibe}%`
    );
    
    // Use Supabase's or() method for multiple filters
    query = query.or(vibeFilters.join(','));
  }

  // Filter by airport/terminal if provided
  if (airportCode) {
    query = query.eq('airport_code', airportCode);
  }
  if (terminalCode) {
    query = query.eq('terminal_code', terminalCode);
  }

  // Add ordering by relevance (vibe match count)
  query = query.order('created_at', { ascending: false });

  const { data, error } = await query;
  
  if (error) {
    console.error('Error fetching amenities by collection:', error);
    
    // Fall back to mock data if available
    if (MOCK_AMENITIES[collectionSlug]) {
      console.log('[getAmenitiesByCollection] Database error, using mock data for:', collectionSlug);
      const mockData = MOCK_AMENITIES[collectionSlug].map((amenity, index) => ({
        id: index + 1,
        created_at: new Date().toISOString(),
        ...amenity
      } as Amenity));
      return mockData.map(enrichAmenityData);
    }
    
    throw error;
  }
  
  // If no data from database, try mock data
  if (!data || data.length === 0) {
    if (MOCK_AMENITIES[collectionSlug]) {
      console.log('[getAmenitiesByCollection] No database data, using mock data for:', collectionSlug);
      const mockData = MOCK_AMENITIES[collectionSlug].map((amenity, index) => ({
        id: index + 1,
        created_at: new Date().toISOString(),
        ...amenity
      } as Amenity));
      return mockData.map(enrichAmenityData);
    }
  }
  
  // Enrich amenities with computed fields
  const amenities = data as Amenity[] || [];
  console.log('[getAmenitiesByCollection] Returning', amenities.length, 'amenities');
  return amenities.map(enrichAmenityData);
};

// Get amenities for "Best Of" collections (no vibe filtering)
export const getBestOfAmenities = async (
  category: string,
  airportCode: string,
  limit: number = 20
): Promise<Amenity[]> => {
  // Best Of collection configurations
  const categoryMap: Record<string, BestOfCategory> = {
    'most-popular': { 
      orderBy: 'popularity_score', 
      ascending: false 
    },
    'hidden-gems': { 
      filter: 'is_hidden_gem', 
      value: true 
    },
    'new-arrivals': { 
      orderBy: 'created_at', 
      ascending: false 
    },
    '24-7-heroes': { 
      filter: 'opening_hours', 
      value: '24/7' 
    },
    'instagram-worthy': { 
      filter: 'is_photogenic', 
      value: true 
    },
    'local-favorites': {
      filter: 'is_local_favorite',
      value: true
    },
    'budget-friendly': {
      filter: 'price_level',
      value: '$'
    },
    'luxury-experiences': {
      filter: 'price_level',
      value: '$$$'
    }
  };

  let query = supabase
    .from('amenities')
    .select('*')
    .eq('airport_code', airportCode);

  const config = categoryMap[category];
  if (config) {
    if (config.orderBy) {
      query = query.order(config.orderBy, { ascending: config.ascending });
    }
    if (config.filter) {
      query = query.eq(config.filter, config.value);
    }
  }

  const { data, error } = await query.limit(limit);
  
  if (error) {
    console.error('Error fetching best of amenities:', error);
    throw error;
  }
  
  return data as Amenity[] || [];
};

// Get collection configuration
export const getCollectionConfig = (collectionSlug: string) => {
  return COLLECTION_VIBE_MAP[collectionSlug] || null;
};

// Get all available collections
export const getAvailableCollections = (): string[] => {
  return Object.keys(COLLECTION_VIBE_MAP);
};

// Search amenities by text and vibe
export const searchAmenities = async (
  searchTerm: string,
  airportCode?: string,
  terminalCode?: string,
  vibeTags?: string[]
): Promise<Amenity[]> => {
  let query = supabase
    .from('amenities')
    .select('*')
    .or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);

  if (airportCode) {
    query = query.eq('airport_code', airportCode);
  }
  if (terminalCode) {
    query = query.eq('terminal_code', terminalCode);
  }
  if (vibeTags && vibeTags.length > 0) {
    const vibeFilters = vibeTags.map(vibe => 
      `vibe_tags.ilike.%${vibe}%`
    );
    query = query.or(vibeFilters.join(','));
  }

  const { data, error } = await query.limit(50);
  
  if (error) {
    console.error('Error searching amenities:', error);
    throw error;
  }
  
  return data as Amenity[] || [];
};