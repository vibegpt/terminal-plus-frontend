import { supabase, AmenityDetail, CollectionAmenity, CollectionDetail } from '../lib/supabase';

export class DataService {
  
  // Get all amenities from your amenity_details table
  static async getAllAmenities(): Promise<AmenityDetail[]> {
    try {
      console.log('Loading amenities from Supabase...');
      
      const { data, error } = await supabase
        .from('amenity_details')
        .select('*')
        .order('name');
      
      if (error) throw error;
      
      console.log(`Loaded ${data?.length || 0} amenities from Supabase`);
      return data || [];
      
    } catch (error) {
      console.error('Error loading amenities:', error);
      return [];
    }
  }
  
  // Get amenities for a specific collection using your collection_amenities table
  static async getCollectionAmenities(collectionId: string): Promise<AmenityDetail[]> {
    try {
      console.log(`Loading amenities for collection: ${collectionId}`);
      
      // First, get the amenity IDs for this collection from collection_amenities
      const { data: collectionMappings, error: mappingError } = await supabase
        .from('collection_amenities')
        .select('amenity_detail_id, priority, is_featured')
        .eq('collection_id', collectionId)
        .order('priority', { ascending: true });
      
      if (mappingError) throw mappingError;
      
      if (!collectionMappings || collectionMappings.length === 0) {
        console.log(`No amenities found for collection ${collectionId}`);
        return [];
      }
      
      // Get the amenity IDs
      const amenityIds = collectionMappings.map(m => m.amenity_detail_id);
      
      // Now fetch the actual amenity details
      const { data: amenities, error: amenityError } = await supabase
        .from('amenity_details')
        .select('*')
        .in('id', amenityIds);
      
      if (amenityError) throw amenityError;
      
      // Sort amenities by the priority from collection_amenities
      const sortedAmenities = amenities?.sort((a, b) => {
        const priorityA = collectionMappings.find(m => m.amenity_detail_id === a.id)?.priority || 999;
        const priorityB = collectionMappings.find(m => m.amenity_detail_id === b.id)?.priority || 999;
        return priorityA - priorityB;
      });
      
      console.log(`Found ${sortedAmenities?.length || 0} amenities for collection ${collectionId}`);
      return sortedAmenities || [];
      
    } catch (error) {
      console.error(`Error loading collection ${collectionId}:`, error);
      return [];
    }
  }
  
  // Get all collections from collection_details table
  static async getAllCollections(): Promise<CollectionDetail[]> {
    try {
      const { data, error } = await supabase
        .from('collection_details')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data || [];
      
    } catch (error) {
      console.error('Error loading collections:', error);
      // Return some default collections if the table doesn't exist yet
      return [
        { id: 'hawker-heaven', name: 'Hawker Heaven', vibe: 'refuel', description: 'Local food favorites' },
        { id: 'hidden-gems', name: 'Hidden Gems', vibe: 'discover', description: 'Secret spots to discover' },
        { id: 'quiet-zones', name: 'Quiet Zones', vibe: 'chill', description: 'Peaceful spaces' }
      ];
    }
  }
  
  // Get collections by vibe
  static async getCollectionsByVibe(vibe: string): Promise<CollectionDetail[]> {
    try {
      const { data, error } = await supabase
        .from('collection_details')
        .select('*')
        .eq('vibe', vibe)
        .order('name');
      
      if (error) throw error;
      return data || [];
      
    } catch (error) {
      console.error(`Error loading collections for vibe ${vibe}:`, error);
      return [];
    }
  }
  
  // Get single collection details
  static async getCollection(collectionId: string): Promise<CollectionDetail | null> {
    try {
      const { data, error } = await supabase
        .from('collection_details')
        .select('*')
        .eq('id', collectionId)
        .single();
      
      if (error) throw error;
      return data;
      
    } catch (error) {
      console.error(`Error loading collection ${collectionId}:`, error);
      // Return a default collection for testing
      return {
        id: collectionId,
        name: collectionId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        description: 'Curated collection of amenities'
      };
    }
  }
  
  // Get amenities by terminal
  static async getAmenitiesByTerminal(terminalCode: string): Promise<AmenityDetail[]> {
    try {
      const { data, error } = await supabase
        .from('amenity_details')
        .select('*')
        .eq('terminal_code', terminalCode)
        .order('name');
      
      if (error) throw error;
      return data || [];
      
    } catch (error) {
      console.error(`Error loading amenities for terminal ${terminalCode}:`, error);
      return [];
    }
  }
  
  // Search amenities
  static async searchAmenities(query: string): Promise<AmenityDetail[]> {
    try {
      const { data, error } = await supabase
        .from('amenity_details')
        .select('*')
        .or(`name.ilike.%${query}%,description.ilike.%${query}%,vibe_tags.ilike.%${query}%`)
        .limit(20);
      
      if (error) throw error;
      return data || [];
      
    } catch (error) {
      console.error('Error searching amenities:', error);
      return [];
    }
  }
  
  // Get featured amenities for a collection
  static async getFeaturedAmenities(collectionId: string): Promise<AmenityDetail[]> {
    try {
      // Get featured amenity IDs
      const { data: featured, error: featuredError } = await supabase
        .from('collection_amenities')
        .select('amenity_detail_id')
        .eq('collection_id', collectionId)
        .eq('is_featured', true)
        .order('priority');
      
      if (featuredError) throw featuredError;
      
      if (!featured || featured.length === 0) return [];
      
      const amenityIds = featured.map(f => f.amenity_detail_id);
      
      // Get the actual amenities
      const { data: amenities, error: amenityError } = await supabase
        .from('amenity_details')
        .select('*')
        .in('id', amenityIds);
      
      if (amenityError) throw amenityError;
      return amenities || [];
      
    } catch (error) {
      console.error('Error loading featured amenities:', error);
      return [];
    }
  }
  
  // Get collection statistics
  static async getCollectionStats(collectionId: string): Promise<{
    totalAmenities: number;
    terminals: string[];
    priceRange: string;
  }> {
    try {
      // Get all amenities for this collection
      const amenities = await this.getCollectionAmenities(collectionId);
      
      // Calculate stats
      const terminals = [...new Set(amenities.map(a => a.terminal_code))];
      const priceLevels = amenities
        .map(a => a.price_level)
        .filter(p => p)
        .sort();
      
      const priceRange = priceLevels.length > 0 
        ? `${priceLevels[0]} - ${priceLevels[priceLevels.length - 1]}`
        : 'Varies';
      
      return {
        totalAmenities: amenities.length,
        terminals,
        priceRange
      };
      
    } catch (error) {
      console.error('Error calculating stats:', error);
      return {
        totalAmenities: 0,
        terminals: [],
        priceRange: 'Unknown'
      };
    }
  }
}
