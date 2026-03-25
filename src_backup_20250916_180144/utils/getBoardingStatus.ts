export type BoardingStatus = 'rush' | 'imminent' | 'soon' | 'normal' | 'extended';

/**
 * Returns boarding status based on boarding time (timestamp in ms)
 * - 'rush': 0-15 min to boarding (grab and go only)
 * - 'imminent': 16-45 min to boarding (quick bite time)
 * - 'soon': 46-90 min to boarding (relaxation time)
 * - 'normal': 91-180 min to boarding (productivity time)
 * - 'extended': >180 min to boarding (exploration time)
 */
export function getBoardingStatus(boardingTime?: number): BoardingStatus {
  if (!boardingTime) return 'normal';
  const now = Date.now();
  const timeToBoarding = (boardingTime - now) / 60000; // in minutes
  
  if (timeToBoarding <= 15 && timeToBoarding > 0) return 'rush';
  if (timeToBoarding <= 45 && timeToBoarding > 15) return 'imminent';
  if (timeToBoarding <= 90 && timeToBoarding > 45) return 'soon';
  if (timeToBoarding <= 180 && timeToBoarding > 90) return 'normal';
  return 'extended'; // 180+ minutes
}

/**
 * Get human-readable label for boarding status
 */
export function getBoardingStatusLabel(status: BoardingStatus): string {
  const labels: Record<BoardingStatus, string> = {
    'rush': 'Boarding Soon!',
    'imminent': 'Time for Quick Bite',
    'soon': 'Relax & Recharge',
    'normal': 'Plenty of Time',
    'extended': 'Extended Wait'
  };
  return labels[status];
}

/**
 * Get status color for UI indicators
 */
export function getBoardingStatusColor(status: BoardingStatus): string {
  const colors: Record<BoardingStatus, string> = {
    'rush': '#ef4444',      // red-500
    'imminent': '#f59e0b',  // amber-500
    'soon': '#3b82f6',      // blue-500
    'normal': '#10b981',    // emerald-500
    'extended': '#8b5cf6'   // violet-500
  };
  return colors[status];
}

/**
 * Get maximum walking time for a boarding status
 */
export function getMaxWalkingTimeForStatus(status: BoardingStatus): number {
  const walkingLimits: Record<BoardingStatus, number> = {
    'rush': 3,      // 0-15 min: only immediate gate area
    'imminent': 5,  // 16-45 min: quick walks only
    'soon': 10,     // 46-90 min: moderate walks OK
    'normal': 15,   // 91-180 min: most of terminal accessible
    'extended': 999 // 180+ min: explore everything
  };
  return walkingLimits[status];
}