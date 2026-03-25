// src/services/SupabaseCollectionService.ts
import { supabase } from '@/lib/supabase';

export interface CollectionConfig {
  id: string;
  collection_id: string;
  name: string;
  title: string;
  subtitle: string;
  description: string;
  emoji: string;
  icon: string;
  gradient: string;
  universal: boolean;
  featured: boolean;
  airports: string[];
}

export interface CollectionAmenity {
  id: number;
  amenity_slug: string;
  name: string;
  description: string;
  terminal_code: string;
  airport_code: string;
  vibe_tags: string | string[];
  price_level: string;
  opening_hours: any;
  website_url?: string;
  logo_url?: string;
  category?: string;
  rating?: number;
  priority?: number;
  is_featured?: boolean;
}

export class SupabaseCollectionService {
  
  /**
   * Get collection details with amenities from Supabase
   */
  static async getCollectionWithAmenities(
    collectionSlug: string, 
    terminalCode: string
  ) {
    console.log('=== SupabaseCollectionService.getCollectionWithAmenities ===');
    console.log('Input - collectionSlug:', collectionSlug);
    console.log('Input - terminalCode:', terminalCode);
    
    // Extract airport code from terminal code (e.g., 'SYD-T1' -> 'SYD')
    const airportCode = terminalCode.split('-')[0];
    const terminalNumber = terminalCode.split('-')[1];
    
    console.log('Parsed - airportCode:', airportCode);
    console.log('Parsed - terminalNumber:', terminalNumber);
    
    try {
      // 1. Get the collection details
      console.log('Step 1: Fetching collection from Supabase...');
      const { data: collection, error: collectionError } = await supabase
        .from('collections')
        .select('*')
        .eq('collection_id', collectionSlug)
        .single();

      console.log('Collection query result:', { collection, collectionError });

      if (collectionError || !collection) {
        console.error('❌ Collection not found:', collectionError);
        console.log('Attempted to find collection with slug:', collectionSlug);
        
        // Try to list available collections for debugging
        const { data: allCollections } = await supabase
          .from('collections')
          .select('collection_id, name')
          .limit(10);
        console.log('Available collections:', allCollections);
        
        throw new Error(`Collection not found: ${collectionSlug}`);
      }

      console.log('✅ Collection found:', collection.name);

      // 2. Get amenities for this collection
      console.log('Step 2: Fetching amenities for collection ID:', collection.id);
      
      // First get the amenity IDs from the junction table
      const { data: collectionLinks, error: linksError } = await supabase
        .from('collection_amenities')
        .select('amenity_detail_id, priority, is_featured')
        .eq('collection_id', collection.id);

      console.log('Collection links found:', collectionLinks?.length || 0);

      if (linksError) {
        console.error('❌ Error fetching collection links:', linksError);
        throw new Error('Failed to fetch collection amenities');
      }

      if (!collectionLinks || collectionLinks.length === 0) {
        console.warn('⚠️ No amenity links found for collection:', collection.name);
        return {
          collection: {
            ...collection,
            title: collection.name,
            subtitle: collection.description,
            emoji: collection.icon
          },
          amenities: []
        };
      }

      // Extract amenity IDs
      const amenityIds = collectionLinks.map(link => link.amenity_detail_id);
      console.log('Amenity IDs to fetch:', amenityIds.length);

      // Now fetch the actual amenity details
      // Don't filter by terminal - just get all amenities and sort them
      const { data: amenities, error: amenitiesError } = await supabase
        .from('amenity_detail')
        .select('*')
        .in('id', amenityIds)
        .eq('airport_code', airportCode);

      console.log('Amenities fetched:', amenities?.length || 0);
      
      // If no results, try without airport filter as fallback
      let finalAmenities = amenities || [];
      
      if (finalAmenities.length === 0) {
        console.log('No amenities found with airport filter, trying without...');
        const { data: fallbackAmenities } = await supabase
          .from('amenity_detail')
          .select('*')
          .in('id', amenityIds);
        
        if (fallbackAmenities && fallbackAmenities.length > 0) {
          console.log('Found amenities without airport filter:', fallbackAmenities.length);
          finalAmenities = fallbackAmenities;
        }
      }

      if (amenitiesError) {
        console.error('❌ Error fetching amenity details:', amenitiesError);
        throw new Error('Failed to fetch amenity details');
      }

      // Combine the data
      const amenityMappings = finalAmenities?.map(amenity => {
        const link = collectionLinks.find(l => l.amenity_detail_id === amenity.id);
        return {
          priority: link?.priority || 50,
          is_featured: link?.is_featured || false,
          amenity_detail: amenity
        };
      }) || [];

      console.log('Amenities query result:', { 
        count: amenityMappings?.length || 0
      });

      if (amenityMappings.length === 0) {
        console.warn('⚠️ No amenities found for collection in airport:', airportCode);
        
        // Check if there are amenities in other airports
        const { data: otherAmenities } = await supabase
          .from('collection_amenities')
          .select('amenity_detail_id')
          .eq('collection_id', collection.id)
          .limit(5);
        
        if (otherAmenities && otherAmenities.length > 0) {
          console.log('This collection has amenities but not in', airportCode);
          console.log('Try fetching without airport filter...');
          
          // Fetch amenities without airport filter as fallback
          const { data: allAmenities } = await supabase
            .from('amenity_detail')
            .select('*')
            .in('id', amenityIds);
          
          if (allAmenities && allAmenities.length > 0) {
            console.log('Found amenities in other airports:', allAmenities.length);
            // Use these amenities instead
            const fallbackMappings = allAmenities.map(amenity => {
              const link = collectionLinks.find(l => l.amenity_detail_id === amenity.id);
              return {
                priority: link?.priority || 50,
                is_featured: link?.is_featured || false,
                amenity_detail: amenity
              };
            });
            amenityMappings.push(...fallbackMappings);
          }
        }
      }

      // 3. Transform amenities to match expected format
      console.log('Step 3: Transforming amenities...');
      const transformedAmenities: CollectionAmenity[] = (amenityMappings || [])
        .filter((mapping: any) => mapping.amenity_detail.name) // Filter out entries with null names
        .map((mapping: any) => {
          const amenity = {
            id: mapping.amenity_detail.id,
            amenity_slug: mapping.amenity_detail.amenity_slug,
            name: mapping.amenity_detail.name,
            description: mapping.amenity_detail.description,
            terminal_code: mapping.amenity_detail.terminal_code,
            airport_code: mapping.amenity_detail.airport_code,
            vibe_tags: this.parseVibeTags(mapping.amenity_detail.vibe_tags),
            price_level: mapping.amenity_detail.price_level,
            opening_hours: mapping.amenity_detail.opening_hours,
            website_url: mapping.amenity_detail.website_url,
            logo_url: mapping.amenity_detail.logo_url,
            priority: mapping.priority,
            is_featured: mapping.is_featured,
            category: this.inferCategory(mapping.amenity_detail),
            rating: 4.2 + Math.random() * 0.6 // Mock rating for now
          };
          
          return amenity;
        })
        .sort((a: any, b: any) => {
          // Sort by terminal match first, then priority
          // Terminal codes in DB are in 'SYD-T1' format
          const aMatchesTerminal = a.terminal_code === terminalCode;
          const bMatchesTerminal = b.terminal_code === terminalCode;
          
          if (aMatchesTerminal && !bMatchesTerminal) return -1;
          if (bMatchesTerminal && !aMatchesTerminal) return 1;
          return (b.priority || 0) - (a.priority || 0);
        });

      console.log(`✅ Transformed ${transformedAmenities.length} amenities`);
      if (transformedAmenities.length > 0) {
        console.log('Sample amenity:', transformedAmenities[0]);
      }

      // 4. Transform collection to match expected format
      const collectionConfig: CollectionConfig = {
        ...collection,
        title: collection.name,
        subtitle: collection.description,
        emoji: collection.icon
      };

      console.log('=== Final Result ===');
      console.log('Collection:', collectionConfig.name);
      console.log('Amenities count:', transformedAmenities.length);

      return {
        collection: collectionConfig,
        amenities: transformedAmenities
      };

    } catch (error) {
      console.error('❌ Error in getCollectionWithAmenities:', error);
      console.error('Stack:', error instanceof Error ? error.stack : 'No stack');
      throw error;
    }
  }

  /**
   * Parse vibe tags from string to array
   */
  static parseVibeTags(vibeTags: any): string[] {
    if (!vibeTags) return [];
    if (Array.isArray(vibeTags)) return vibeTags;
    if (typeof vibeTags === 'string') {
      // Handle comma-separated or JSON array strings
      if (vibeTags.startsWith('[')) {
        try {
          return JSON.parse(vibeTags);
        } catch {
          return [];
        }
      }
      return vibeTags.split(',').map((tag: string) => tag.trim()).filter(Boolean);
    }
    return [];
  }

  /**
   * Infer category from amenity data
   */
  static inferCategory(amenity: any): string {
    const name = amenity.name?.toLowerCase() || '';
    const desc = amenity.description?.toLowerCase() || '';
    const tags = amenity.vibe_tags?.toLowerCase() || '';
    
    if (name.includes('lounge') || desc.includes('lounge')) return 'Lounge';
    if (name.includes('coffee') || name.includes('café') || desc.includes('coffee')) return 'Café';
    if (name.includes('restaurant') || name.includes('kitchen')) return 'Restaurant';
    if (name.includes('bar') || desc.includes('bar')) return 'Bar';
    if (name.includes('shop') || name.includes('duty')) return 'Shopping';
    if (tags.includes('nature') || name.includes('garden')) return 'Nature';
    if (tags.includes('wellness') || name.includes('spa')) return 'Wellness';
    
    return 'Experience';
  }

  /**
   * Check if amenity is open now
   */
  static isOpenNow(openingHours: any): boolean {
    if (!openingHours) return true; // Assume open if no hours specified
    
    // Parse opening hours logic here
    // For now, return random for demo
    return Math.random() > 0.3;
  }

  /**
   * Get similar collections
   */
  static async getSimilarCollections(
    currentCollectionId: string,
    airportCode: string
  ): Promise<CollectionConfig[]> {
    console.log('Getting similar collections for:', currentCollectionId, 'in', airportCode);
    
    const { data: collections, error } = await supabase
      .from('collections')
      .select('*')
      .neq('collection_id', currentCollectionId)
      .or(`universal.eq.true,airports.cs.{${airportCode}}`)
      .limit(5);

    if (error) {
      console.error('Error fetching similar collections:', error);
      return [];
    }

    console.log(`Found ${collections?.length || 0} similar collections`);

    return collections?.map(c => ({
      ...c,
      title: c.name,
      subtitle: c.description,
      emoji: c.icon
    })) || [];
  }
}
