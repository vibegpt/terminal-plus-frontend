/**
 * Free time calculation — shared between TimeConfidenceBar and vibe ordering.
 *
 * "Free time" = minutes to boarding - walk time to gate - 15min buffer.
 * This is what the passenger can actually spend, not just raw minutes.
 */

export const WALK_TIME_ESTIMATES: Record<string, number> = {
  'SIN-T1': 8,
  'SIN-T2': 7,
  'SIN-T3': 10,
  'SIN-T4': 5,
  'SIN-JEWEL': 15, // Jewel to any gate requires transit + immigration
};

export const BUFFER_MINUTES = 15;

export function getFreeMinutes(
  minutesToBoarding: number | null,
  terminalCode: string | null,
): number | null {
  if (minutesToBoarding === null || terminalCode === null) return null;
  const walkTime = WALK_TIME_ESTIMATES[terminalCode] ?? 10;
  return Math.max(0, minutesToBoarding - walkTime - BUFFER_MINUTES);
}
