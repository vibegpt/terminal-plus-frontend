// src/utils/collectionMapper.ts - Collection and amenity mapping utilities
import { Amenity, EnrichedAmenity } from '../types/database.types';

// Map amenity to collection based on vibe tags
export const mapAmenityToCollection = (
  amenity: Amenity,
  collectionSlug: string
): boolean => {
  const vibeTags = amenity.vibe_tags?.toLowerCase().split(',').map(t => t.trim()) || [];
  
  const collectionRules: Record<string, (tags: string[]) => boolean> = {
    'coffee-chill': (tags) => 
      tags.some(tag => ['coffee', 'cafe', 'chill', 'relax'].includes(tag)),
    
    'quick-bites': (tags) => 
      tags.some(tag => ['quick', 'fast', 'snack', 'grab'].includes(tag)),
    
    'lounge-life': (tags) => 
      tags.some(tag => ['lounge', 'premium', 'vip', 'business'].includes(tag)),
    
    'local-flavors': (tags) => 
      tags.some(tag => ['local', 'authentic', 'specialty'].includes(tag)),
    
    'stay-connected': (tags) => 
      tags.some(tag => ['wifi', 'charging', 'work', 'business'].includes(tag)),
    
    'retail-therapy': (tags) => 
      tags.some(tag => ['shopping', 'retail', 'duty-free', 'luxury'].includes(tag)),
    
    'wellness-zone': (tags) => 
      tags.some(tag => ['spa', 'wellness', 'relax', 'health'].includes(tag)),
    
    'family-friendly': (tags) => 
      tags.some(tag => ['family', 'kids', 'play', 'child-friendly'].includes(tag)),
  };

  const rule = collectionRules[collectionSlug];
  return rule ? rule(vibeTags) : false;
};

// Check if amenity is open based on opening hours
export const checkIfOpen = (openingHours?: string): boolean => {
  if (!openingHours) return false;
  if (openingHours.toLowerCase().includes('24/7')) return true;
  
  // Simple check - in production, parse actual hours
  const now = new Date();
  const hour = now.getHours();
  
  // Default: assume open 6am-10pm
  return hour >= 6 && hour <= 22;
};

// Calculate walk time based on terminal
export const calculateWalkTime = (terminalCode?: string): string => {
  if (!terminalCode) return '5-10 min';
  
  // Mock calculation - in production, use real location data
  const times = ['2-5 min', '5-10 min', '10-15 min'];
  return times[Math.floor(Math.random() * times.length)];
};

// Get amenity status based on various factors
export const getAmenityStatus = (amenity: Amenity): 'quiet' | 'moderate' | 'busy' => {
  const hour = new Date().getHours();
  
  // Peak hours
  if (hour >= 11 && hour <= 13) return 'busy'; // Lunch
  if (hour >= 17 && hour <= 19) return 'busy'; // Dinner
  if (hour >= 7 && hour <= 9) return 'moderate'; // Breakfast
  
  return 'quiet';
};

// Extract features from vibe tags
export const extractFeatures = (vibeTags?: string): string[] => {
  if (!vibeTags) return [];
  
  return vibeTags
    .split(',')
    .map(tag => tag.trim())
    .filter(tag => tag.length > 0)
    .slice(0, 3); // Return top 3 features
};

// Get gradient for vibe
export const getGradientForVibe = (vibeTags?: string): string => {
  if (!vibeTags) return 'from-blue-500 to-purple-500';
  
  const tags = vibeTags.toLowerCase();
  
  if (tags.includes('coffee')) return 'from-amber-600 to-orange-600';
  if (tags.includes('lounge')) return 'from-purple-600 to-indigo-600';
  if (tags.includes('local')) return 'from-green-500 to-teal-600';
  if (tags.includes('shopping')) return 'from-pink-500 to-purple-600';
  if (tags.includes('spa')) return 'from-green-500 to-teal-600';
  if (tags.includes('family')) return 'from-yellow-500 to-orange-600';
  
  return 'from-blue-500 to-purple-500';
};

// Enrich amenity data with computed fields
export const enrichAmenityData = (amenity: Amenity): EnrichedAmenity => {
  return {
    ...amenity,
    isOpen: checkIfOpen(amenity.opening_hours),
    walkTime: calculateWalkTime(amenity.terminal_code),
    status: getAmenityStatus(amenity),
    features: extractFeatures(amenity.vibe_tags),
    gradient: getGradientForVibe(amenity.vibe_tags),
    rating: Math.random() * 5, // Mock rating
    trending: Math.random() > 0.7 // Mock trending status
  };
};

// Batch enrich amenities
export const enrichAmenities = (amenities: Amenity[]): EnrichedAmenity[] => {
  return amenities.map(enrichAmenityData);
};
