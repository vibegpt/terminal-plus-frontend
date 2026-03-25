import type { VibeType } from '../context/VibeContext';

/**
 * Returns the optimal vibe ordering based on free time and time of day.
 *
 * Urgency tiers (based on FREE time, not boarding time):
 * - critical: < 60 min free → Quick/Refuel first
 * - relaxed_long: > 240 min free → Explore/Shop first
 * - default: time-of-day ordering
 */

type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';

const ALL_VIBES: VibeType[] = ['Quick', 'Refuel', 'Comfort', 'Chill', 'Work', 'Explore', 'Shop'];

const CRITICAL_VIBE_ORDER: VibeType[] = [
  'Quick', 'Refuel', 'Comfort', 'Work', 'Chill', 'Explore', 'Shop',
];

const RELAXED_LONG_VIBE_ORDER: VibeType[] = [
  'Explore', 'Refuel', 'Shop', 'Chill', 'Comfort', 'Work', 'Quick',
];

const TIME_OF_DAY_ORDERS: Record<TimeOfDay, VibeType[]> = {
  morning: ['Refuel', 'Work', 'Explore', 'Quick', 'Comfort', 'Chill', 'Shop'],
  afternoon: ['Explore', 'Refuel', 'Shop', 'Chill', 'Comfort', 'Work', 'Quick'],
  evening: ['Chill', 'Refuel', 'Comfort', 'Shop', 'Explore', 'Work', 'Quick'],
  night: ['Comfort', 'Chill', 'Refuel', 'Quick', 'Work', 'Explore', 'Shop'],
};

function getTimeOfDay(): TimeOfDay {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 22) return 'evening';
  return 'night';
}

export function getOptimalVibeOrder(freeMinutes: number | null): VibeType[] {
  // Critical urgency: user has very little free time
  if (freeMinutes !== null && freeMinutes < 60) {
    return CRITICAL_VIBE_ORDER;
  }

  // Relaxed long layover: user has 4+ hours free
  if (freeMinutes !== null && freeMinutes > 240) {
    return RELAXED_LONG_VIBE_ORDER;
  }

  // Default: time-of-day ordering
  return TIME_OF_DAY_ORDERS[getTimeOfDay()];
}

export { ALL_VIBES, type TimeOfDay, getTimeOfDay };
