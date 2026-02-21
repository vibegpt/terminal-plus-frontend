// Unified vibe ordering system that combines time-of-day with boarding status
import { getBoardingStatus, getVibeOrderForBoardingStatus, BoardingStatus } from '../utils/getBoardingStatus';

export interface TimeBasedConfig {
  greeting: string;
  tone: string;
  vibeOrder: string[];
}

export interface UnifiedVibeConfig extends TimeBasedConfig {
  boardingStatus?: BoardingStatus;
  boardingMessage?: string;
  isUrgent?: boolean;
  priorityVibes?: string[];
}

/**
 * Get time-of-day based vibe configuration
 */
export function getTimeOfDayConfig(date: Date = new Date()): TimeBasedConfig {
  const hour = date.getHours();
  
  if (hour >= 5 && hour < 11) {
    // Morning (6 AM arrival scenario)
    return {
      greeting: "Morning at the terminal. Let's get you sorted.",
      tone: 'Energetic',
      vibeOrder: ['comfort', 'chill', 'refuel', 'quick', 'work', 'discover', 'shop']
    };
  } else if (hour >= 11 && hour < 14) {
    // Midday
    return {
      greeting: "Peak hours. Navigate like a pro.",
      tone: 'Confident',
      vibeOrder: ['refuel', 'quick', 'discover', 'shop', 'chill', 'work', 'comfort']
    };
  } else if (hour >= 14 && hour < 17) {
    // Afternoon
    return {
      greeting: "Afternoon vibes. Time to explore.",
      tone: 'Adventurous',
      vibeOrder: ['discover', 'refuel', 'shop', 'chill', 'quick', 'comfort', 'work']
    };
  } else if (hour >= 17 && hour < 23) {
    // Evening
    return {
      greeting: "Evening at the terminal. Make the most of it.",
      tone: 'Confident',
      vibeOrder: ['refuel', 'shop', 'comfort', 'discover', 'chill', 'quick', 'work']
    };
  } else {
    // Late Night (11 PM - 5 AM)
    return {
      greeting: "After midnight crew - I've got you covered.",
      tone: 'Supportive',
      vibeOrder: ['comfort', 'quick', 'chill', 'refuel', 'work', 'discover', 'shop']
    };
  }
}

/**
 * Merge vibe orders with priority to boarding status
 * Boarding status vibes get boosted, but time-of-day still influences secondary ordering
 */
function mergeVibeOrders(timeOrder: string[], boardingOrder: string[]): string[] {
  const merged: string[] = [];
  const added = new Set<string>();
  
  // First, add top 3 from boarding order (highest priority)
  boardingOrder.slice(0, 3).forEach(vibe => {
    merged.push(vibe);
    added.add(vibe);
  });
  
  // Then interleave remaining vibes, preferring boarding order
  const remainingBoarding = boardingOrder.slice(3);
  const remainingTime = timeOrder.filter(v => !added.has(v));
  
  // Add alternating between boarding and time preferences
  let boardingIndex = 0;
  let timeIndex = 0;
  
  while (boardingIndex < remainingBoarding.length || timeIndex < remainingTime.length) {
    // Add from boarding order
    if (boardingIndex < remainingBoarding.length && !added.has(remainingBoarding[boardingIndex])) {
      merged.push(remainingBoarding[boardingIndex]);
      added.add(remainingBoarding[boardingIndex]);
    }
    boardingIndex++;
    
    // Add from time order
    if (timeIndex < remainingTime.length && !added.has(remainingTime[timeIndex])) {
      merged.push(remainingTime[timeIndex]);
      added.add(remainingTime[timeIndex]);
    }
    timeIndex++;
  }
  
  // Ensure all 7 vibes are included (fallback)
  const allVibes = ['refuel', 'discover', 'chill', 'comfort', 'work', 'shop', 'quick'];
  allVibes.forEach(vibe => {
    if (!added.has(vibe)) {
      merged.push(vibe);
    }
  });
  
  return merged;
}

/**
 * Get unified vibe configuration combining time-of-day and boarding status
 */
export function getUnifiedVibeConfig(
  boardingTime?: number,
  currentTime: Date = new Date()
): UnifiedVibeConfig {
  // Get base time-of-day configuration
  const timeConfig = getTimeOfDayConfig(currentTime);
  
  // If no boarding time, return time-based config only
  if (!boardingTime) {
    return timeConfig;
  }
  
  // Get boarding status and corresponding vibe order
  const boardingStatus = getBoardingStatus(boardingTime);
  const boardingVibeOrder = getVibeOrderForBoardingStatus(boardingStatus);
  
  // Merge the two orders intelligently
  const mergedOrder = mergeVibeOrders(timeConfig.vibeOrder, boardingVibeOrder);
  
  // Determine if urgent (less than 45 minutes to boarding)
  const isUrgent = boardingStatus === 'rush' || boardingStatus === 'imminent';
  
  // Get priority vibes (top 3 for the current context)
  const priorityVibes = mergedOrder.slice(0, 3);
  
  // Adjust greeting based on boarding status
  let greeting = timeConfig.greeting;
  if (boardingStatus === 'rush') {
    greeting = "⚡ Boarding soon! Here's what's nearby.";
  } else if (boardingStatus === 'extended') {
    greeting = "✈️ Flight delayed. Let's make the wait enjoyable.";
  }
  
  return {
    greeting,
    tone: timeConfig.tone,
    vibeOrder: mergedOrder,
    boardingStatus,
    boardingMessage: getBoardingMessage(boardingStatus),
    isUrgent,
    priorityVibes
  };
}

/**
 * Get a contextual message based on boarding status
 */
function getBoardingMessage(status: BoardingStatus): string {
  switch (status) {
    case 'rush':
      return 'Boarding soon - essentials only';
    case 'imminent':
      return 'Quick bite time before boarding';
    case 'soon':
      return 'Time to relax before your flight';
    case 'normal':
      return 'Plenty of time to be productive';
    case 'extended':
      return 'Extended wait - explore the terminal';
    default:
      return '';
  }
}

/**
 * Get vibe boost factors based on context
 * Returns multipliers for relevance scoring
 */
export function getVibeBoostFactors(
  boardingStatus?: BoardingStatus,
  timeOfDay?: number
): Record<string, number> {
  const boosts: Record<string, number> = {
    refuel: 1.0,
    discover: 1.0,
    chill: 1.0,
    comfort: 1.0,
    work: 1.0,
    shop: 1.0,
    quick: 1.0
  };
  
  // Apply boarding status boosts
  if (boardingStatus === 'rush') {
    boosts.quick = 2.0;
    boosts.refuel = 1.5;
    boosts.discover = 0.5;
    boosts.shop = 0.3;
  } else if (boardingStatus === 'extended') {
    boosts.discover = 2.0;
    boosts.comfort = 1.8;
    boosts.work = 1.5;
    boosts.quick = 0.5;
  }
  
  // Apply time-of-day boosts
  if (timeOfDay !== undefined) {
    if (timeOfDay >= 5 && timeOfDay < 11) {
      // Morning boost
      boosts.refuel *= 1.3; // Breakfast priority
      boosts.comfort *= 1.2; // Wake up spaces
    } else if (timeOfDay >= 22 || timeOfDay < 5) {
      // Late night boost
      boosts.comfort *= 1.5; // Rest priority
      boosts.quick *= 1.3; // 24hr options important
      boosts.shop *= 0.7; // Many shops closed
    }
  }
  
  return boosts;
}