export type BoardingStatus = 'rush' | 'imminent' | 'soon' | 'normal' | 'extended';

/**
 * Returns boarding status based on boarding time (timestamp in ms)
 * - 'rush': 0-15 min to boarding
 * - 'imminent': 16-45 min to boarding
 * - 'soon': 46-90 min to boarding
 * - 'normal': 91-180 min to boarding
 * - 'extended': 180+ min to boarding
 */
export function getBoardingStatus(boardingTime?: number): BoardingStatus {
  if (!boardingTime) return 'normal';
  const now = Date.now();
  const timeToBoarding = (boardingTime - now) / 60000; // in minutes
  if (timeToBoarding <= 15 && timeToBoarding > 0) return 'rush';
  if (timeToBoarding <= 45) return 'imminent';
  if (timeToBoarding <= 90) return 'soon';
  if (timeToBoarding <= 180) return 'normal';
  return 'extended';
}

export function getBoardingStatusLabel(status: BoardingStatus): string {
  switch (status) {
    case 'rush': return 'RUSH';
    case 'imminent': return 'SOON';
    case 'soon': return 'RELAX';
    case 'normal': return 'EXPLORE';
    case 'extended': return 'EXTENDED';
    default: return '';
  }
}

export function getBoardingStatusColor(status: BoardingStatus): string {
  switch (status) {
    case 'rush': return '#ef4444';
    case 'imminent': return '#f59e0b';
    case 'soon': return '#3b82f6';
    case 'normal': return '#10b981';
    case 'extended': return '#8b5cf6';
    default: return '#6b7280';
  }
}
