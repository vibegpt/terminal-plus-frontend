export type BoardingStatus = 'imminent' | 'soon' | 'normal';

/**
 * Returns boarding status based on boarding time (timestamp in ms)
 * - 'imminent': 0-30 min to boarding
 * - 'soon': 31-45 min to boarding
 * - 'normal': >45 min to boarding
 */
export function getBoardingStatus(boardingTime?: number): BoardingStatus {
  if (!boardingTime) return 'normal';
  const now = Date.now();
  const timeToBoarding = (boardingTime - now) / 60000; // in minutes
  if (timeToBoarding <= 30 && timeToBoarding > 0) return 'imminent';
  if (timeToBoarding <= 45 && timeToBoarding > 30) return 'soon';
  return 'normal';
} 