import type { TimeOfDay } from './getOptimalVibeOrder';

interface VibeContext {
  vibe: string;
  freeMinutes: number | null;
  timeOfDay: TimeOfDay;
}

const URGENT_COPY: Record<string, string> = {
  Quick: 'Right here, right now',
  Refuel: 'Grab and go',
  Comfort: 'Quick refresh before boarding',
  Chill: "Breathe. You've got this.",
  Work: 'Last chance to send that email',
  Explore: 'Save it for the return trip',
  Shop: 'Duty free is near your gate',
};

const LONG_COPY: Record<string, string> = {
  Explore: 'Make it count',
  Refuel: 'Sit-down meal territory',
  Shop: 'Browse without the rush',
  Chill: 'Find your quiet corner',
  Comfort: 'Treat yourself',
  Work: 'Set up camp',
  Quick: 'Or skip straight to the good stuff',
};

const TOD_COPY: Record<string, Record<string, string>> = {
  morning: {
    Refuel: 'Coffee first, everything else second',
    Explore: 'The terminals are quiet right now',
    Chill: 'Ease into the day',
  },
  evening: {
    Refuel: 'Wind down with something good',
    Chill: 'Decompress before you fly',
    Shop: 'Last-minute gifts sorted',
  },
  night: {
    Comfort: 'Rest spots for the red-eye',
    Chill: 'Quiet hours',
    Refuel: 'Late night eats',
  },
};

export function getVibeMicroCopy(ctx: VibeContext): string {
  const { vibe, freeMinutes, timeOfDay } = ctx;

  if (freeMinutes !== null && freeMinutes < 30) {
    return URGENT_COPY[vibe] ?? '';
  }

  if (freeMinutes !== null && freeMinutes > 240) {
    return LONG_COPY[vibe] ?? '';
  }

  return TOD_COPY[timeOfDay]?.[vibe] ?? '';
}
