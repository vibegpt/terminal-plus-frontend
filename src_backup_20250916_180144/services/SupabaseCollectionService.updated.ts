// =====================================================
// UPDATED SUPABASE COLLECTION SERVICE
// Now uses UnifiedCollectionService internally
// Maintains backward compatibility
// =====================================================

import { UnifiedCollectionService } from './UnifiedCollectionService';
import { TerminalCodeUtils } from '@/utils/terminalCodeUtils';

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
   * Updated to use UnifiedCollectionService
   */
  static async getCollectionWithAmenities(
    collectionSlug: string, 
    terminalCode: string
  ) {
    console.log('=== SupabaseCollectionService.getCollectionWithAmenities ===');
    console.log('Input - collectionSlug:', collectionSlug);
    console.log('Input - terminalCode:', terminalCode);
    
    // Parse terminal code to get airport and terminal
    const { airport, terminal } = TerminalCodeUtils.parseTerminalCode(terminalCode);
    
    console.log('Parsed - airport:', airport);
    console.log('Parsed - terminal:', terminal);
    
    try {
      // Use UnifiedCollectionService
      const result = await UnifiedCollectionService.getCollectionAmenities(
        collectionSlug,
        airport,
        terminal
      );
      
      if (!result) {
        console.error('❌ Collection not found:', collectionSlug);
        return null;
      }
      
      console.log('✅ Collection found:', result.collection.name);
      console.log('✅ Amenities found:', result.amenities.length);
      
      // Map to legacy format for backward compatibility
      return {
        collection: {
          ...result.collection,
          title: result.collection.name,
          subtitle: result.collection.description,
          emoji: result.collection.icon
        },
        amenities: result.amenities
      };
      
    } catch (error) {
      console.error('Error fetching collection:', error);
      return null;
    }
  }
  
  /**
   * Get all collections for a terminal
   * Updated to use UnifiedCollectionService
   */
  static async getCollectionsForTerminal(terminalCode: string) {
    const { airport, terminal } = TerminalCodeUtils.parseTerminalCode(terminalCode);
    
    try {
      const collections = await UnifiedCollectionService.getCollections(airport, terminal);
      
      // Map to legacy format
      return collections.map(c => ({
        id: c.id,
        collection_id: c.collection_id,
        name: c.name,
        title: c.name,
        subtitle: c.description,
        description: c.description,
        emoji: c.icon,
        icon: c.icon,
        gradient: c.gradient,
        universal: c.is_universal,
        featured: c.is_featured,
        airports: [airport],
        spots_total: c.spots_total,
        spots_in_terminal: c.spots_in_terminal,
        spots_near_you: c.spots_near_you
      }));
      
    } catch (error) {
      console.error('Error fetching collections:', error);
      return [];
    }
  }
}

// Export as default for backward compatibility
export default SupabaseCollectionService;
