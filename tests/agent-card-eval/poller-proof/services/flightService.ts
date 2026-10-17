export const F: any = { payload: null };
export async function lookupFlight() { return F.payload; }
export function mapTerminalToCode(terminal: string | null | undefined): string | null {
  if (!terminal) return null;
  const trimmed = terminal.trim();
  if (/^\d$/.test(trimmed)) return `SIN-T${trimmed}`;
  if (trimmed.startsWith('SIN-')) return trimmed;
  return `SIN-${trimmed.toUpperCase()}`;
}
