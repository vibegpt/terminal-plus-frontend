/**
 * Optimal Vibe Ordering System
 * Combines time-of-day awareness with boarding status for dynamic vibe prioritization
 * Phase 2 Implementation - Terminal+ Unified Ordering
 */

import { getBoardingStatus, BoardingStatus } from './getBoardingStatus';

export interface VibeOrderResult {
  order: string[];
  boardingStatus: BoardingStatus | null;
  timeOfDay: string;
  statusMessage?: string;
  isRushMode: boolean;
  isDelayed: boolean;
  priorityVibes: string[];
}

/**
 * Get time-based vibe ordering based on time of day
 * These are base orders that get modified by boarding status
 */
function getTimeBasedOrder(hour: number): string[] {
  if (hour >= 5 && hour < 11) {
    // Morning (5am-11am) - Comfort and energy focus
    return ['comfort', 'chill', 'refuel', 'quick', 'work', 'discover', 'shop'];
  } else if (hour >= 11 && hour < 14) {
    // Midday (11am-2pm) - Lunch and refuel priority
    return ['refuel', 'quick', 'discover', 'shop', 'chill', 'work', 'comfort'];
  } else if (hour >= 14 && hour < 17) {
    // Afternoon (2pm-5pm) - Exploration and shopping
    return ['discover', 'refuel', 'shop', 'chill', 'quick', 'comfort', 'work'];
  } else if (hour >= 17 && hour < 23) {
    // Evening (5pm-11pm) - Dinner and relaxation
    return ['refuel', 'shop', 'comfort', 'discover', 'chill', 'quick', 'work'];
  } else {
    // Late Night (11pm-5am) - Comfort and rest priority
    return ['comfort', 'quick', 'chill', 'refuel', 'work', 'discover', 'shop'];
  }
}

/**
 * Get boarding status based vibe ordering
 * Direct mapping based on time until boarding
 */
function getBoardingStatusOrder(status: BoardingStatus): string[] {
  switch (status) {
    case 'rush':
      // 0-15 mins: Only essentials, grab and go
      return ['quick', 'refuel', 'chill', 'comfort', 'work', 'shop', 'discover'];
    
    case 'imminent':
      // 16-45 mins: Quick bite time
      return ['refuel', 'quick', 'chill', 'shop', 'comfort', 'work', 'discover'];
    
    case 'soon':
      // 46-90 mins: Relaxation time
      return ['comfort', 'refuel', 'chill', 'shop', 'work', 'quick', 'discover'];
    
    case 'normal':
      // 91-180 mins: Productivity time
      return ['work', 'comfort', 'discover', 'refuel', 'chill', 'shop', 'quick'];
    
    case 'extended':
      // 180+ mins: Extended delay - exploration priority
      return ['discover', 'comfort', 'refuel', 'work', 'shop', 'chill', 'quick'];
    
    default:
      return ['refuel', 'discover', 'chill', 'shop', 'comfort', 'work', 'quick'];
  }
}

/**
 * Prioritize specific vibes by moving them to the front
 * Maintains relative order of other vibes
 */
function prioritizeVibes(order: string[], priorities: string[]): string[] {
  // Filter out the priority vibes from the original order
  const remaining = order.filter(v => !priorities.includes(v));
  
  // Put priority vibes first, then the remaining in their original relative order
  return [...priorities, ...remaining];
}

/**
 * Merge time and boarding orders with intelligent weighting
 */
function getTimeAndBoardingOrder(hour: number, status: BoardingStatus): string[] {
  // Get base order from time of day
  const baseOrder = getTimeBasedOrder(hour);
  
  // Adjust based on boarding status
  switch(status) {
    case 'imminent': // 16-45 mins
      // Move 'quick' and 'refuel' higher - people need fast options
      return prioritizeVibes(baseOrder, ['refuel', 'quick']);
    
    case 'soon': // 46-90 mins
      // Move 'comfort' and 'refuel' higher - time to relax and eat properly
      return prioritizeVibes(baseOrder, ['comfort', 'refuel']);
    
    case 'normal': // 91-180 mins
      // Move 'work' and 'comfort' higher - productive time
      return prioritizeVibes(baseOrder, ['work', 'comfort']);
    
    default:
      // Use base time order without modifications
      return baseOrder;
  }
}

/**
 * Main function: Get optimal vibe ordering based on all factors
 * This is the primary export for the unified ordering system
 */
export function getOptimalVibeOrder(boardingTime?: number): VibeOrderResult {
  const hour = new Date().getHours();
  const status = boardingTime ? getBoardingStatus(boardingTime) : null;
  
  // Determine time of day label
  const timeOfDay = hour >= 5 && hour < 11 ? 'Morning' :
                   hour >= 11 && hour < 14 ? 'Midday' :
                   hour >= 14 && hour < 17 ? 'Afternoon' :
                   hour >= 17 && hour < 23 ? 'Evening' : 'Late Night';
  
  // No boarding time - use pure time-of-day ordering
  if (!boardingTime || !status) {
    return {
      order: getTimeBasedOrder(hour),
      boardingStatus: null,
      timeOfDay,
      statusMessage: `${timeOfDay} vibes`,
      isRushMode: false,
      isDelayed: false,
      priorityVibes: []
    };
  }
  
  // Determine order based on boarding status priority
  let vibeOrder: string[];
  let priorityVibes: string[] = [];
  
  // Boarding status takes priority if rush or delayed
  if (status === 'rush') {
    // Rush mode completely overrides time-of-day
    vibeOrder = getBoardingStatusOrder(status);
    priorityVibes = ['quick', 'refuel'];
  } else if (status === 'extended') {
    // Extended delay completely overrides time-of-day
    vibeOrder = getBoardingStatusOrder(status);
    priorityVibes = ['discover', 'comfort'];
  } else {
    // Blend time-of-day with boarding status
    vibeOrder = getTimeAndBoardingOrder(hour, status);
    
    // Set priority vibes based on status
    switch(status) {
      case 'imminent':
        priorityVibes = ['refuel', 'quick'];
        break;
      case 'soon':
        priorityVibes = ['comfort', 'refuel'];
        break;
      case 'normal':
        priorityVibes = ['work', 'comfort'];
        break;
    }
  }
  
  // Generate contextual status message
  const timeToBoarding = boardingTime ? Math.floor((boardingTime - Date.now()) / 60000) : null;
  let statusMessage = '';
  
  switch(status) {
    case 'rush':
      statusMessage = `⚡ Boarding in ${timeToBoarding} min - Grab essentials!`;
      break;
    case 'imminent':
      statusMessage = `🍔 ${timeToBoarding} min to boarding - Time for a quick bite`;
      break;
    case 'soon':
      statusMessage = `😌 ${timeToBoarding} min to relax before your flight`;
      break;
    case 'normal':
      statusMessage = `💼 ${Math.floor(timeToBoarding! / 60)}h ${timeToBoarding! % 60}m - Make the most of your time`;
      break;
    case 'extended':
      const hours = Math.floor(timeToBoarding! / 60);
      statusMessage = `🔍 ${hours}+ hour${hours > 1 ? 's' : ''} wait - Explore the terminal!`;
      break;
  }
  
  return {
    order: vibeOrder,
    boardingStatus: status,
    timeOfDay,
    statusMessage,
    isRushMode: status === 'rush',
    isDelayed: status === 'extended',
    priorityVibes
  };
}

/**
 * Check if a vibe should be highlighted/badged based on current context
 */
export function shouldHighlightVibe(
  vibeKey: string, 
  boardingStatus: BoardingStatus | null
): boolean {
  if (!boardingStatus) return false;
  
  const highlightMap: Record<BoardingStatus, string[]> = {
    'rush': ['quick'],
    'imminent': ['refuel', 'quick'],
    'soon': ['comfort', 'refuel'],
    'normal': ['work', 'comfort'],
    'extended': ['discover', 'comfort']
  };
  
  return highlightMap[boardingStatus]?.includes(vibeKey) || false;
}

/**
 * Get a badge/indicator for a vibe based on context
 */
export function getVibeBadge(
  vibeKey: string,
  boardingStatus: BoardingStatus | null
): { show: boolean; text: string; type: 'urgent' | 'recommended' | 'featured' } | null {
  if (!boardingStatus) return null;
  
  // Rush mode badges
  if (boardingStatus === 'rush' && vibeKey === 'quick') {
    return { show: true, text: '⚡ Best Now', type: 'urgent' };
  }
  
  // Imminent badges
  if (boardingStatus === 'imminent') {
    if (vibeKey === 'refuel') return { show: true, text: '🍔 Quick Eats', type: 'recommended' };
    if (vibeKey === 'quick') return { show: true, text: '⏱️ Fast', type: 'recommended' };
  }
  
  // Extended delay badges
  if (boardingStatus === 'extended') {
    if (vibeKey === 'discover') return { show: true, text: '✨ Featured', type: 'featured' };
    if (vibeKey === 'comfort') return { show: true, text: '😌 Relax', type: 'recommended' };
  }
  
  return null;
}

/**
 * Utility to check if vibe ordering should animate
 * Prevents jarring reorders on minor time changes
 */
export function shouldAnimateReorder(
  previousStatus: BoardingStatus | null,
  currentStatus: BoardingStatus | null
): boolean {
  // Only animate when crossing major boundaries
  if (previousStatus === currentStatus) return false;
  
  // Define major transitions that warrant animation
  const majorTransitions = [
    ['rush', 'imminent'],
    ['imminent', 'soon'],
    ['soon', 'normal'],
    ['normal', 'extended']
  ];
  
  // Check if this is a major transition
  for (const [from, to] of majorTransitions) {
    if ((previousStatus === from && currentStatus === to) ||
        (previousStatus === to && currentStatus === from)) {
      return true;
    }
  }
  
  // Also animate when entering/leaving rush or extended states
  if (previousStatus === 'rush' || currentStatus === 'rush' ||
      previousStatus === 'extended' || currentStatus === 'extended') {
    return true;
  }
  
  return false;
}