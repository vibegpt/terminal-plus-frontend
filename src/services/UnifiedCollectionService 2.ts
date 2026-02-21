// =====================================================
// UNIFIED COLLECTION SERVICE
// Single service for all collection operations
// Replaces multiple collection services
// =====================================================

import { supabase } from '@/lib/supabase';
import { TerminalCodeUtils } from '@/utils/terminalCodeUtils';

export interface UnifiedCollection {
  id: string;
  collection_id: string;
  name: string;
  description: string;
  icon: string;
  gradient: string;
  spots_total: number;
  spots_in_terminal: number;
  spots_near_you: number;
  is_featured: boolean;
  is_universal: boolean;
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
  priority?: number;
  is_featured?: boolean;
  available_in_tr?: boolean;
}

export class UnifiedCollectionService {
  /**
   * Get collections with proper terminal code handling
   */
  static async getCollections(
    airport: string, 
    terminal: string
  ): Promise<UnifiedCollection[]> {
    // Format terminal code consistently
    const terminalCode = TerminalCodeUtils.formatTerminalCode(airport, terminal);
    
    console.log(`🔍 Fetching collections for: ${terminalCode}`);
    
    try {
      // Try the RPC function first (most reliable)
      const { data: rpcData, error: rpcError } = await supabase
        .rpc('get_collections_for_terminal', {
          p_airport_code: airport,
          p_terminal: terminal
        });
      
      if (rpcData && rpcData.length > 0) {
        console.log(`✅ Found ${rpcData.length} collections via RPC`);
        return this.mapToUnifiedFormat(rpcData);
      }
      
      // Fallback to view query
      const { data: viewData, error: viewError } = await supabase
        .from('collection_terminal_counts')
        .select('*')
        .eq('airport_code', airport)
        .eq('terminal_code', terminalCode);
      
      if (viewData && viewData.length > 0) {
        console.log(`✅ Found ${viewData.length} collections via view`);
        return this.mapToUnifiedFormat(viewData);
      }
      
      // Final fallback: Direct query
      const { data: directData } = await supabase
        .from('collections')
        .select(`
          *,
          collection_amenities!inner(
            amenity_detail!inner(
              id,
              terminal_code,
              available_in_tr
            )
          )
        `)
        .or(`universal.eq.true,airports.cs.{${airport}}`);
      
      if (directData) {
        console.log(`✅ Found ${directData.length} collections via direct query`);
        return this.processDirectQueryResults(directData, terminalCode);
      }
      
      console.warn('❌ No collections found');
      return [];
      
    } catch (error) {
      console.error('Error fetching collections:', error);
      return [];
    }
  }
  
  /**
   * Get amenities for a specific collection
   */
  static async getCollectionAmenities(
    collectionSlug: string,
    airport: string,
    terminal: string
  ): Promise<{ collection: any; amenities: CollectionAmenity[] } | null> {
    const terminalCode = TerminalCodeUtils.formatTerminalCode(airport, terminal);
    
    console.log(`🔍 Fetching amenities for collection: ${collectionSlug} in ${terminalCode}`);
    
    try {
      // Get collection first
      const { data: collection, error: collectionError } = await supabase
        .from('collections')
        .select('*')
        .eq('collection_id', collectionSlug)
        .single();
      
      if (!collection || collectionError) {
        console.error('Collection not found:', collectionSlug);
        return null;
      }
      
      console.log('✅ Collection found:', collection.name);
      
      // Try RPC function first
      const { data: rpcAmenities, error: rpcError } = await supabase
        .rpc('get_collection_amenities', {
          p_collection_slug: collectionSlug,
          p_airport_code: airport,
          p_terminal: terminal
        });
      
      if (rpcAmenities && rpcAmenities.length > 0) {
        console.log(`✅ Found ${rpcAmenities.length} amenities via RPC`);
        return {
          collection,
          amenities: rpcAmenities
        };
      }
      
      // Fallback to direct query
      const { data: amenities, error: amenitiesError } = await supabase
        .from('collection_amenities')
        .select(`
          priority,
          is_featured,
          amenity_detail!inner(*)
        `)
        .eq('collection_id', collection.id)
        .eq('amenity_detail.terminal_code', terminalCode)
        .eq('amenity_detail.airport_code', airport)
        .not('amenity_detail.name', 'is', null)
        .order('priority', { ascending: true });
      
      if (!amenities || amenitiesError) {
        console.warn('⚠️ No amenities found for collection in terminal:', terminalCode);
        return { collection, amenities: [] };
      }
      
      console.log(`✅ Found ${amenities.length} amenities for collection`);
      
      return {
        collection,
        amenities: amenities.map(a => ({
          ...a.amenity_detail,
          priority: a.priority,
          is_featured: a.is_featured
        }))
      };
      
    } catch (error) {
      console.error('Error fetching collection amenities:', error);
      return null;
    }
  }
  
  /**
   * Map various data formats to unified format
   */
  private static mapToUnifiedFormat(data: any[]): UnifiedCollection[] {
    return data.map(item => ({
      id: item.id || item.collection_uuid || crypto.randomUUID(),
      collection_id: item.collection_id || item.collection_slug,
      name: item.collection_name || item.name,
      description: item.description || '',
      icon: item.icon || item.collection_icon || '📦',
      gradient: item.gradient || item.collection_gradient || 'from-blue-500 to-purple-600',
      spots_total: item.spots_total || item.amenity_count || item.total_amenities || 0,
      spots_in_terminal: item.spots_near_you || item.terminal_amenities || item.amenity_count || 0,
      spots_near_you: item.transit_amenity_count || item.near_amenities || item.spots_near_you || 0,
      is_featured: item.is_featured || item.featured || false,
      is_universal: item.is_universal || item.universal || false
    }));
  }
  
  /**
   * Process direct query results with manual counting
   */
  private static processDirectQueryResults(
    collections: any[], 
    terminalCode: string
  ): UnifiedCollection[] {
    return collections.map(collection => {
      const amenitiesInTerminal = collection.collection_amenities?.filter(
        (ca: any) => ca.amenity_detail?.terminal_code === terminalCode
      ) || [];
      
      const transitAvailable = amenitiesInTerminal.filter(
        (ca: any) => ca.amenity_detail?.available_in_tr === true
      );
      
      return {
        id: collection.id,
        collection_id: collection.collection_id,
        name: collection.name,
        description: collection.description || '',
        icon: collection.icon || '📦',
        gradient: collection.gradient || 'from-blue-500 to-purple-600',
        spots_total: collection.collection_amenities?.length || 0,
        spots_in_terminal: amenitiesInTerminal.length,
        spots_near_you: transitAvailable.length,
        is_featured: collection.featured || false,
        is_universal: collection.universal || false
      };
    });
  }
}
