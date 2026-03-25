export interface AmenityRow {
  id: number;
  amenity_slug: string;
  name: string;
  terminal_code: string;
  opening_hours: string;
  price_level?: string;
  vibe_tags?: string;
  description?: string;
  logo_url?: string;
  [key: string]: unknown;
}

function isOpenNow(hours: string): boolean {
  if (!hours || hours === '24/7') return true;
  const match = hours.match(/(\d{2}):(\d{2})\s*[-–]\s*(\d{2}):(\d{2})/);
  if (!match) return true;
  const [, openH, openM, closeH, closeM] = match.map(Number);
  const now = new Date();
  const cur = now.getHours() * 60 + now.getMinutes();
  const open = openH * 60 + openM;
  let close = closeH * 60 + closeM;
  if (close <= open) {
    close += 1440;
    if (cur < open) return cur + 1440 < close;
  }
  return cur >= open && cur < close;
}

const TERMINAL_PRIORITY: Record<string, number> = {
  'SIN-T3': 5,
  'SIN-T1': 4,
  'SIN-T2': 3,
  'SIN-JEWEL': 2,
  'SIN-T4': 1,
};

function terminalScore(terminal: string, userTerminal: string | null): number {
  if (userTerminal && terminal === userTerminal) return 10;
  return TERMINAL_PRIORITY[terminal] ?? 0;
}

export function smart7Select(
  pool: AmenityRow[],
  userTerminal: string | null = null,
  limit = 7
): AmenityRow[] {
  if (!pool?.length) return [];

  const bestByName = new Map<string, AmenityRow>();
  for (const amenity of pool) {
    const key = amenity.name.toLowerCase().trim();
    const existing = bestByName.get(key);
    if (!existing || terminalScore(amenity.terminal_code, userTerminal) > terminalScore(existing.terminal_code, userTerminal)) {
      bestByName.set(key, amenity);
    }
  }

  return Array.from(bestByName.values())
    .sort((a, b) => {
      const aOpen = isOpenNow(a.opening_hours);
      const bOpen = isOpenNow(b.opening_hours);
      if (aOpen !== bOpen) return aOpen ? -1 : 1;
      const scoreDiff = terminalScore(b.terminal_code, userTerminal) - terminalScore(a.terminal_code, userTerminal);
      if (scoreDiff !== 0) return scoreDiff;
      return a.name.localeCompare(b.name);
    })
    .slice(0, limit);
}
