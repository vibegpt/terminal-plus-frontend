// Advanced ML-powered collection service
// This would typically be in a separate file: src/services/mlCollectionService.ts

interface UserContext {
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  journeyPhase: 'departure' | 'transit' | 'arrival';
  timeToBoarding: number;
  previousVibes: string[];
  currentVibe?: string;
  isRushed: boolean;
  travelType: 'business' | 'leisure' | 'family';
  companionType: 'solo' | 'couple' | 'family' | 'group';
}

interface SmartCollection {
  id: string;
  title: string;
  subtitle: string;
  logic: string;
  priority: number;
  amenityTypes: string[];
  maxDuration: number;
  proximityRequired: boolean;
}

export class MLCollectionService {
  // Simulate ML model predictions
  static predictCollections(context: UserContext): SmartCollection[] {
    const collections: SmartCollection[] = [];
    
    // Time-based contextualization
    if (context.timeOfDay === 'morning' && context.journeyPhase === 'departure') {
      collections.push({
        id: 'morning-departure',
        title: `Perfect Morning ${context.journeyPhase} Picks`,
        subtitle: 'Coffee, breakfast & energy boosts',
        logic: 'High-caffeine + Quick breakfast + Energy foods',
        priority: 1,
        amenityTypes: ['coffee', 'breakfast', 'juice-bar'],
        maxDuration: context.timeToBoarding < 60 ? 15 : 30,
        proximityRequired: context.timeToBoarding < 30
      });
    }
    
    if (context.timeOfDay === 'evening' && context.journeyPhase === 'arrival') {
      collections.push({
        id: 'evening-arrival',
        title: 'Evening Arrival Essentials',
        subtitle: 'Transport, currency & final comforts',
        logic: 'Transport info + Currency exchange + Light dinner',
        priority: 1,
        amenityTypes: ['transport', 'currency', 'light-meal'],
        maxDuration: 20,
        proximityRequired: false
      });
    }
    
    // Rush-based recommendations
    if (context.isRushed) {
      collections.push({
        id: 'ultra-quick',
        title: 'No Time to Waste',
        subtitle: 'Everything under 5 minutes',
        logic: 'Ultra-fast + Gate proximity + Essential only',
        priority: 0,
        amenityTypes: ['grab-go', 'restroom', 'water'],
        maxDuration: 5,
        proximityRequired: true
      });
    }
    
    return collections;
  }
  
  // Collaborative filtering based on similar users
  static getCollaborativeRecommendations(userVibePattern: string[]): SmartCollection {
    // Simulate collaborative filtering
    const patterns = {
      'chill,comfort': {
        title: 'Users Like You Loved',
        subtitle: 'Quiet lounges & relaxation spots',
        amenityTypes: ['lounge', 'quiet-zone', 'spa']
      },
      'quick,refuel': {
        title: 'Popular with Similar Travelers',
        subtitle: 'Fast food & efficient services',
        amenityTypes: ['fast-food', 'express-services', 'convenience']
      },
      'explore,shop': {
        title: 'Discovered by Explorers Like You',
        subtitle: 'Unique shops & hidden experiences',
        amenityTypes: ['boutique', 'local-products', 'attractions']
      }
    };
    
    const patternKey = userVibePattern.slice(0, 2).join(',');
    const match = patterns[patternKey] || patterns['chill,comfort'];
    
    return {
      id: 'collaborative',
      title: match.title,
      subtitle: match.subtitle,
      logic: 'Collaborative filtering based on vibe patterns',
      priority: 2,
      amenityTypes: match.amenityTypes,
      maxDuration: 30,
      proximityRequired: false
    };
  }
  
  // Time-decay algorithm for urgency
  static applyTimeDecay(timeToBoarding: number): {
    title: string;
    focus: string[];
    maxDistance: number;
    maxDuration: number;
  } {
    if (timeToBoarding <= 15) {
      return {
        title: 'Gate Area Only',
        focus: ['gate-seating', 'restroom', 'water-fountain'],
        maxDistance: 100, // meters
        maxDuration: 5 // minutes
      };
    } else if (timeToBoarding <= 30) {
      return {
        title: 'Last Minute Essentials',
        focus: ['grab-go', 'restroom', 'charging', 'gate-nearby'],
        maxDistance: 300,
        maxDuration: 10
      };
    } else if (timeToBoarding <= 60) {
      return {
        title: 'Quick Experiences',
        focus: ['quick-meal', 'coffee', 'shopping-express', 'lounge-access'],
        maxDistance: 500,
        maxDuration: 20
      };
    }
    
    return {
      title: 'Full Terminal Experience',
      focus: ['all'],
      maxDistance: 1000,
      maxDuration: 60
    };
  }
}

export default MLCollectionService;