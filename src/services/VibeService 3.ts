// src/services/VibeService.ts
import { supabase } from '../lib/supabase';

export interface VibeAmenity {
  id: number;
  name: string;
  amenity_slug: string;
  description: string;
  logo_url: string;
  price_level: string;
  opening_hours: string;
  primary_vibe: string;
  relevance_score: number;
  is_primary: boolean;
}

export interface VibeInfo {
  vibe: string;
  emoji: string;
  description: string;
  color: string;
}

export class VibeService {
  // Get the vibe configuration with new colors
  static getVibeConfig(): Record<string, VibeInfo> {
    return {
      Chill: {
        vibe: 'Chill',
        emoji: '😌',
        description: 'Quiet spots to de-stress and decompress',
        color: '#A8D0E6' // Soft Ice Blue (kept)
      },
      Discover: {
        vibe: 'Discover',
        emoji: '🔍',
        description: 'Discover something new',
        color: '#84CC16' // Lime Green (updated)
      },
      Refuel: {
        vibe: 'Refuel',
        emoji: '🍔',
        description: 'Food, drinks & energy',
        color: '#EF4444' // Red (updated)
      },
      Quick: {
        vibe: 'Quick',
        emoji: '⚡',
        description: 'Grab and go essentials',
        color: '#FFDD57' // Electric Yellow (kept)
      },
      Comfort: {
        vibe: 'Comfort',
        emoji: '🛋️',
        description: 'Relax and unwind',
        color: '#EC4899' // Fuchsia (updated)
      },
      Work: {
        vibe: 'Work',
        emoji: '💼',
        description: 'Get things done',
        color: '#D4A574' // Creamy Brown (updated)
      },
      Shop: {
        vibe: 'Shop',
        emoji: '🛍️',
        description: 'Browse and buy',
        color: '#FFD6E0' // Light Pink (kept)
      }
    };
  }

  // Get all available vibes
  static getAllVibes(): VibeInfo[] {
    const config = this.getVibeConfig();
    return Object.values(config);
  }

  // Get amenities for a specific vibe
  static async getAmenitiesForVibe(
    vibe: string,
    terminalCode: string,
    airportCode: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<VibeAmenity[]> {
    try {
      // Format terminal code correctly (should be AIRPORT-TERMINAL)
      const formattedTerminal = terminalCode.includes('-') 
        ? terminalCode 
        : `${airportCode}-${terminalCode}`;
      
      console.log(`Fetching ${vibe} amenities...`, {
        terminalCode: formattedTerminal,
        airportCode,
        limit
      });

      // Normalize vibe to lowercase for case-insensitive matching
      const normalizedVibe = vibe.toLowerCase();

      // Direct query approach (bypassing RPC for now)
      const { data: mappings, error: mappingError } = await supabase
        .from('amenity_vibe_mappings')
        .select(`
          amenity_id,
          vibe,
          relevance_score,
          is_primary,
          amenity_detail!inner (
            id,
            name,
            amenity_slug,
            description,
            logo_url,
            price_level,
            opening_hours,
            terminal_code,
            airport_code
          )
        `)
        .eq('vibe', normalizedVibe)
        .eq('amenity_detail.terminal_code', formattedTerminal)
        .eq('amenity_detail.airport_code', airportCode)
        .order('is_primary', { ascending: false })
        .order('relevance_score', { ascending: false })
        .limit(limit);

      if (mappingError) {
        console.error(`Error fetching ${vibe} amenities:`, mappingError);
        throw mappingError;
      }

      // Transform the data to match our interface
      const amenities = (mappings || []).map((m: any) => ({
        id: m.amenity_detail.id,
        name: m.amenity_detail.name || 'Unknown',
        amenity_slug: m.amenity_detail.amenity_slug || '',
        description: m.amenity_detail.description || '',
        logo_url: m.amenity_detail.logo_url || '',
        price_level: m.amenity_detail.price_level || '',
        opening_hours: m.amenity_detail.opening_hours || '',
        primary_vibe: m.vibe,
        relevance_score: m.relevance_score,
        is_primary: m.is_primary
      }));

      console.log(`✅ ${vibe}: ${amenities.length} amenities loaded`);
      return amenities;
    } catch (error: any) {
      console.error(`Failed to load ${vibe}:`, {
        error,
        message: error?.message,
        code: error?.code
      });
      return [];
    }
  }

  // Get amenities for all vibes (for home page)
  static async getAllVibesWithAmenities(
    terminalCode: string,
    airportCode: string,
    limitPerVibe: number = 10
  ): Promise<Map<string, VibeAmenity[]>> {
    const vibeMap = new Map<string, VibeAmenity[]>();
    const vibes = this.getAllVibes();

    // Fetch amenities for each vibe in parallel
    const promises = vibes.map(vibeInfo =>
      this.getAmenitiesForVibe(vibeInfo.vibe, terminalCode, airportCode, limitPerVibe)
        .then(amenities => ({ vibe: vibeInfo.vibe, amenities }))
    );

    const results = await Promise.all(promises);
    
    results.forEach(({ vibe, amenities }) => {
      vibeMap.set(vibe, amenities);
    });

    return vibeMap;
  }

  // Get vibe metadata
  static getVibeMetadata(vibe: string): VibeInfo | undefined {
    const config = this.getVibeConfig();
    return config[vibe];
  }

  // Parse terminal code (handles formats like "SYD-T1", "T1", "Terminal 1")
  static parseTerminalCode(terminal: string, airport: string): string {
    // If already in correct format
    if (terminal.includes('-')) {
      return terminal;
    }
    
    // Clean up the terminal string
    const cleaned = terminal.replace(/terminal\s*/i, '').replace(/\s+/g, '').toUpperCase();
    
    // Return in format "AIRPORT-TERMINAL"
    return `${airport}-${cleaned}`;
  }

  // Get featured collection for hero section
  static async getFeaturedCollection(terminalCode: string, airportCode: string) {
    // This would connect to your existing collections table
    // For now, returning mock data that can be replaced with real query
    return {
      id: 'morning-energy',
      title: 'Morning Energy Boost',
      description: 'Start your journey right with premium coffee and energizing spaces',
      spots: 12,
      image: 'https://images.unsplash.com/photo-1556909975-d7f2b1b7c3f7?w=1200',
      vibe: 'Refuel'
    };
  }

  // Get curated collections (limited to 3-5 for Netflix style)
  static async getCuratedCollections(terminalCode: string, airportCode: string, limit: number = 3) {
    // This would connect to your existing collections table
    // For now, returning mock data that can be replaced with real query
    return [
      {
        id: 'true-blue',
        title: 'True Blue Aussie',
        spots: 18,
        image: 'https://images.unsplash.com/photo-1559925393-8be0ec4767c8?w=400',
        badge: 'Popular',
        badgeColor: '#2563EB'
      },
      {
        id: 'coffee-culture',
        title: 'Sydney Coffee Culture',
        spots: 24,
        image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400',
        badge: 'Trending',
        badgeColor: '#EA580C'
      },
      {
        id: 'premium-escapes',
        title: 'Premium Escapes',
        spots: 8,
        image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400',
        badge: 'Exclusive',
        badgeColor: '#9333EA'
      }
    ];
  }

  // Get amenities for a specific vibe with pagination support
  static async getAmenitiesForVibePaginated(
    vibe: string,
    terminalCode: string,
    airportCode: string,
    page: number = 1,
    pageSize: number = 10
  ): Promise<{ amenities: VibeAmenity[], hasMore: boolean, total: number }> {
    const offset = (page - 1) * pageSize;
    
    try {
      // Normalize vibe to lowercase for case-insensitive matching
      const normalizedVibe = vibe.toLowerCase();

      const { data, error, count } = await supabase
        .from('amenity_vibe_mappings')
        .select(`
          amenity_id,
          vibe,
          relevance_score,
          is_primary,
          amenity_detail!inner (
            id,
            name,
            amenity_slug,
            description,
            logo_url,
            price_level,
            opening_hours,
            terminal_code
          )
        `, { count: 'exact' })
        .eq('vibe', normalizedVibe)
        .eq('amenity_detail.terminal_code', `${airportCode}-${terminalCode}`)
        .order('relevance_score', { ascending: false })
        .range(offset, offset + pageSize - 1);

      if (error) {
        console.error('Error fetching paginated amenities:', error);
        throw error;
      }

      // Transform the data to match VibeAmenity interface
      const amenities: VibeAmenity[] = (data || []).map(item => ({
        id: item.amenity_detail.id,
        name: item.amenity_detail.name,
        amenity_slug: item.amenity_detail.amenity_slug,
        description: item.amenity_detail.description || '',
        logo_url: item.amenity_detail.logo_url || '',
        price_level: item.amenity_detail.price_level || '',
        opening_hours: item.amenity_detail.opening_hours || '',
        primary_vibe: vibe,
        relevance_score: item.relevance_score,
        is_primary: item.is_primary
      }));

      return {
        amenities,
        hasMore: offset + pageSize < (count || 0),
        total: count || 0
      };
    } catch (error) {
      console.error('Error in getAmenitiesForVibePaginated:', error);
      return {
        amenities: [],
        hasMore: false,
        total: 0
      };
    }
  }
}
