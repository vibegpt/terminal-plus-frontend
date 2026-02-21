// src/services/ProximityService.ts
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { getBoardingStatus, BoardingStatus, getMaxWalkingTimeForStatus } from '../utils/getBoardingStatus';

export interface LocationAwareAmenity {
  id: number;
  name: string;
  amenity_slug: string;
  description: string;
  gate_location: string | null;
  walking_time_minutes: number | null;
  zone: string | null;
  vibe_tags: string;
  price_level: string;
  is_accessible: boolean; // Based on boarding time
  accessibility_reason?: string;
}

export interface ProximityFilters {
  userGate?: string;
  boardingTime?: number; // timestamp in ms
  maxWalkingTime?: number; // in minutes
  preferredZones?: string[];
  includeBeforeSecurity?: boolean;
}

export class ProximityService {
  // Define walking time rules based on boarding status
  private static readonly WALKING_TIME_LIMITS = {
    rush: 3,      // 0-15 min: only immediate gate area
    imminent: 5,  // 16-45 min: quick walks only
    soon: 10,     // 46-90 min: moderate walks OK
    normal: 15,   // 91-180 min: most of terminal accessible
    extended: 999 // 180+ min: explore everything
  };

  // Zone priorities (closer zones first)
  private static readonly ZONE_PRIORITY = {
    'same-gate': 0,
    'same-pier': 1,
    'after-security': 2,
    'food-court': 3,
    'pier-b': 4,
    'pier-c': 4,
    'before-security': 5,
    'arrivals': 6
  };

  /**
   * Get the maximum walking time based on boarding status
   */
  static getMaxWalkingTime(boardingTime?: number): number {
    const status = getBoardingStatus(boardingTime);
    return getMaxWalkingTimeForStatus(status);
  }

  /**
   * Filter amenities based on proximity and boarding time
   */
  static async getAccessibleAmenities(
    terminalCode: string,
    airportCode: string,
    filters: ProximityFilters
  ): Promise<LocationAwareAmenity[]> {
    const maxWalkTime = filters.boardingTime 
      ? this.getMaxWalkingTime(filters.boardingTime)
      : filters.maxWalkingTime || 999;

    const boardingStatus = getBoardingStatus(filters.boardingTime);

    // Build query
    let query = supabase
      .from('amenity_detail')
      .select('*')
      .eq('terminal_code', terminalCode)
      .eq('airport_code', airportCode);

    // Apply walking time filter
    if (maxWalkTime < 999) {
      query = query.or(`walking_time_minutes.lte.${maxWalkTime},walking_time_minutes.is.null`);
    }

    // Filter zones if boarding is imminent or rush
    if ((boardingStatus === 'imminent' || boardingStatus === 'rush') && !filters.includeBeforeSecurity) {
      query = query.not('zone', 'eq', 'before-security');
      query = query.not('zone', 'eq', 'arrivals');
    }
    
    // For rush status, only show amenities in the same zone as gate
    if (boardingStatus === 'rush' && filters.userGate) {
      // Prioritize same-gate and same-pier amenities
      query = query.or('zone.eq.same-gate,zone.eq.same-pier');
    }

    // Apply preferred zones filter
    if (filters.preferredZones && filters.preferredZones.length > 0) {
      query = query.in('zone', filters.preferredZones);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching amenities by proximity:', error);
      return [];
    }

    // Process and add accessibility info
    return (data || []).map(amenity => {
      const walkingTime = amenity.walking_time_minutes || 5; // Default 5 min if unknown
      const isAccessible = walkingTime <= maxWalkTime;
      
      let accessibilityReason;
      if (!isAccessible) {
        if (boardingStatus === 'imminent') {
          accessibilityReason = `Too far (${walkingTime} min walk) - boarding soon!`;
        } else if (boardingStatus === 'soon') {
          accessibilityReason = `${walkingTime} min walk - might be tight`;
        }
      }

      return {
        ...amenity,
        is_accessible: isAccessible,
        accessibility_reason: accessibilityReason
      };
    });
  }

  /**
   * Sort amenities by proximity (closest first)
   */
  static sortByProximity(
    amenities: LocationAwareAmenity[],
    userGate?: string
  ): LocationAwareAmenity[] {
    return amenities.sort((a, b) => {
      // First, prioritize accessible amenities
      if (a.is_accessible !== b.is_accessible) {
        return a.is_accessible ? -1 : 1;
      }

      // Then sort by walking time
      const walkA = a.walking_time_minutes || 999;
      const walkB = b.walking_time_minutes || 999;
      
      if (walkA !== walkB) {
        return walkA - walkB;
      }

      // Finally sort by zone priority
      const zoneA = this.ZONE_PRIORITY[a.zone || 'after-security'] || 999;
      const zoneB = this.ZONE_PRIORITY[b.zone || 'after-security'] || 999;
      
      return zoneA - zoneB;
    });
  }

  /**
   * Get smart recommendations based on context
   */
  static getSmartRecommendations(
    amenities: LocationAwareAmenity[],
    boardingTime?: number
  ): {
    quickBites: LocationAwareAmenity[];
    lastMinuteShops: LocationAwareAmenity[];
    nearbyRelax: LocationAwareAmenity[];
  } {
    const status = getBoardingStatus(boardingTime);
    const accessible = amenities.filter(a => a.is_accessible);

    // Quick Bites - fast food within 5 min walk
    const quickBites = accessible.filter(a => 
      a.walking_time_minutes && a.walking_time_minutes <= 5 &&
      (a.vibe_tags?.includes('Quick') || a.vibe_tags?.includes('Refuel'))
    ).slice(0, 5);

    // Last Minute Shops - shops and essentials close by
    const lastMinuteShops = accessible.filter(a =>
      a.walking_time_minutes && a.walking_time_minutes <= 3 &&
      (a.vibe_tags?.includes('Shop') || a.vibe_tags?.includes('Quick'))
    ).slice(0, 5);

    // Nearby Relax - chill spots if you have time
    const nearbyRelax = status === 'normal' 
      ? accessible.filter(a =>
          a.vibe_tags?.includes('Chill') || a.vibe_tags?.includes('Comfort')
        ).slice(0, 5)
      : [];

    return {
      quickBites,
      lastMinuteShops,
      nearbyRelax
    };
  }

  /**
   * Get boarding-aware vibe recommendations
   */
  static filterVibesByBoardingTime(
    boardingTime?: number
  ): string[] {
    const status = getBoardingStatus(boardingTime);
    
    switch (status) {
      case 'imminent':
        // Only quick options when boarding is imminent
        return ['Quick'];
      case 'soon':
        // Quick options and maybe a fast refuel
        return ['Quick', 'Refuel'];
      case 'normal':
      default:
        // All vibes available
        return ['Chill', 'Discover', 'Refuel', 'Quick', 'Comfort', 'Work', 'Shop'];
    }
  }

  /**
   * Generate contextual message based on boarding status
   */
  static getBoardingMessage(boardingTime?: number): string | null {
    const status = getBoardingStatus(boardingTime);
    const timeToBoarding = boardingTime ? Math.floor((boardingTime - Date.now()) / 60000) : null;

    switch (status) {
      case 'imminent':
        return `⚠️ Boarding in ${timeToBoarding} minutes! Showing only nearby amenities.`;
      case 'soon':
        return `⏰ Boarding in ${timeToBoarding} minutes. Stick to amenities within 10 min walk.`;
      case 'normal':
      default:
        return null;
    }
  }
}

// Hook for React components
export function useProximityAmenities(
  terminalCode: string,
  airportCode: string,
  boardingTime?: number,
  userGate?: string
) {
  const [amenities, setAmenities] = useState<LocationAwareAmenity[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchAmenities = async () => {
      setLoading(true);
      
      const filters: ProximityFilters = {
        boardingTime,
        userGate,
        includeBeforeSecurity: false
      };

      const data = await ProximityService.getAccessibleAmenities(
        terminalCode,
        airportCode,
        filters
      );

      const sorted = ProximityService.sortByProximity(data, userGate);
      setAmenities(sorted);
      setMessage(ProximityService.getBoardingMessage(boardingTime));
      setLoading(false);
    };

    fetchAmenities();
  }, [terminalCode, airportCode, boardingTime, userGate]);

  return { amenities, loading, message };
}
