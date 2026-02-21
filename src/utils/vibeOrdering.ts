import { getBoardingStatus, BoardingStatus } from './getBoardingStatus';

export interface VibeOrder {
  vibeKey: string;
  priority: number;
  reason?: string;
  boosted?: boolean;
}

/**
 * Get time-based vibe ordering based on time of day
 */
export function getTimeOfDayVibeOrder(hour: number): string[] {
  if (hour >= 5 && hour < 11) {
    // Morning (6 AM arrival scenario)
    return ['comfort', 'chill', 'refuel', 'quick', 'work', 'discover', 'shop'];
  } else if (hour >= 11 && hour < 14) {
    // Midday
    return ['refuel', 'quick', 'discover', 'shop', 'chill', 'work', 'comfort'];
  } else if (hour >= 14 && hour < 17) {
    // Afternoon
    return ['discover', 'refuel', 'shop', 'chill', 'quick', 'comfort', 'work'];
  } else if (hour >= 17 && hour < 23) {
    // Evening
    return ['refuel', 'shop', 'comfort', 'discover', 'chill', 'quick', 'work'];
  } else {
    // Late Night (11 PM - 5 AM)
    return ['comfort', 'quick', 'chill', 'refuel', 'work', 'discover', 'shop'];
  }
}

/**
 * Get boarding status based vibe ordering
 */
export function getBoardingStatusVibeOrder(status: BoardingStatus): string[] {
  switch (status) {
    case 'rush':
      // 0-15 mins: Grab essentials only
      return ['quick', 'refuel', 'chill', 'comfort', 'work', 'shop', 'discover'];
    
    case 'imminent':
      // 16-45 mins: Quick bite time
      return ['refuel', 'quick', 'chill', 'shop', 'comfort', 'work', 'discover'];
    
    case 'soon':
      // 46-90 mins: Relaxation time
      return ['comfort', 'refuel', 'chill', 'shop', 'work', 'quick', 'discover'];
    
    case 'normal':
      // 91-180 mins: Productivity/exploration time
      return ['work', 'comfort', 'discover', 'refuel', 'chill', 'shop', 'quick'];
    
    case 'extended':
      // 180+ mins: Extended delay - entertainment priority
      return ['discover', 'comfort', 'refuel', 'work', 'shop', 'chill', 'quick'];
    
    default:
      // Default order
      return ['refuel', 'discover', 'chill', 'shop', 'comfort', 'work', 'quick'];
  }
}

/**
 * Merge time-of-day and boarding status vibe orders
 * Boarding status takes priority but considers time-of-day preferences
 */
export function mergeVibeOrders(
  timeOrder: string[], 
  boardingOrder: string[],
  boardingStatus: BoardingStatus
): string[] {
  // For rush status, boarding order completely overrides
  if (boardingStatus === 'rush') {
    return boardingOrder;
  }
  
  // For other statuses, create a weighted merge
  const merged: VibeOrder[] = [];
  const processed = new Set<string>();
  
  // Calculate position scores
  const getScore = (vibe: string): number => {
    const timePos = timeOrder.indexOf(vibe);
    const boardingPos = boardingOrder.indexOf(vibe);
    
    // Weight boarding status more heavily as urgency increases
    const boardingWeight = boardingStatus === 'extended' ? 0.3 : 
                          boardingStatus === 'normal' ? 0.5 :
                          boardingStatus === 'soon' ? 0.7 : 0.9;
    
    const timeWeight = 1 - boardingWeight;
    
    const timeScore = timePos === -1 ? 7 : timePos;
    const boardingScore = boardingPos === -1 ? 7 : boardingPos;
    
    return (timeScore * timeWeight) + (boardingScore * boardingWeight);
  };
  
  // Score all vibes
  [...new Set([...timeOrder, ...boardingOrder])].forEach(vibe => {
    if (!processed.has(vibe)) {
      merged.push({
        vibeKey: vibe,
        priority: getScore(vibe),
        boosted: boardingOrder.indexOf(vibe) < 3 // Top 3 in boarding order
      });
      processed.add(vibe);
    }
  });
  
  // Sort by priority (lower is better)
  merged.sort((a, b) => a.priority - b.priority);
  
  return merged.map(v => v.vibeKey);
}

/**
 * Get unified vibe ordering considering all factors
 */
export function getUnifiedVibeOrder(
  boardingTime?: number,
  customHour?: number
): {
  order: string[];
  boardingStatus: BoardingStatus | null;
  timeOfDay: string;
  statusMessage?: string;
} {
  const hour = customHour ?? new Date().getHours();
  const timeOrder = getTimeOfDayVibeOrder(hour);
  
  // Determine time of day label
  const timeOfDay = hour >= 5 && hour < 11 ? 'Morning' :
                   hour >= 11 && hour < 14 ? 'Midday' :
                   hour >= 14 && hour < 17 ? 'Afternoon' :
                   hour >= 17 && hour < 23 ? 'Evening' : 'Late Night';
  
  // If no boarding time, use time-of-day order only
  if (!boardingTime) {
    return {
      order: timeOrder,
      boardingStatus: null,
      timeOfDay,
      statusMessage: `${timeOfDay} vibes`
    };
  }
  
  // Get boarding status and its order
  const boardingStatus = getBoardingStatus(boardingTime);
  const boardingOrder = getBoardingStatusVibeOrder(boardingStatus);
  
  // Merge the orders
  const mergedOrder = mergeVibeOrders(timeOrder, boardingOrder, boardingStatus);
  
  // Create status message
  let statusMessage = '';
  switch (boardingStatus) {
    case 'rush':
      statusMessage = '⚡ Board in <15 min - Grab essentials!';
      break;
    case 'imminent':
      statusMessage = '🍔 Time for a quick bite';
      break;
    case 'soon':
      statusMessage = '😌 Relax before your flight';
      break;
    case 'normal':
      statusMessage = '💼 Make the most of your time';
      break;
    case 'extended':
      statusMessage = '🔍 Explore the terminal!';
      break;
  }
  
  return {
    order: mergedOrder,
    boardingStatus,
    timeOfDay,
    statusMessage
  };
}

/**
 * Check if a vibe should be highlighted based on context
 */
export function shouldHighlightVibe(
  vibeKey: string, 
  boardingStatus: BoardingStatus | null
): boolean {
  if (!boardingStatus) return false;
  
  const priorityVibes: Record<BoardingStatus, string[]> = {
    'rush': ['quick'],
    'imminent': ['refuel', 'quick'],
    'soon': ['comfort', 'refuel'],
    'normal': ['work', 'comfort'],
    'extended': ['discover', 'comfort']
  };
  
  return priorityVibes[boardingStatus]?.includes(vibeKey) || false;
}