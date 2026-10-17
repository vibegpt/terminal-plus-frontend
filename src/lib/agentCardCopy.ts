// src/lib/agentCardCopy.ts
// Every string on the agent cards (CC-25), in one place so it can be edited
// without touching logic. Imported by the cards (src/components/AgentCard.tsx),
// the trigger engine (src/lib/agentCards.ts) and the server (api/agent-card.ts,
// shared/agentCard/card.ts) for fallback lines and headers. Pure: no imports.
//
// Rules for anything added here: no walk minutes, distances or "near your gate"
// (walking_time_minutes is a placeholder and gate_location is empty until CC-14).

/** "2h 40m", "45m". */
export function durationShort(minutes: number): string {
  const m = Math.max(0, Math.round(minutes));
  const h = Math.floor(m / 60);
  const r = m % 60;
  if (h === 0) return `${r}m`;
  return r === 0 ? `${h}h` : `${h}h ${r}m`;
}

/** 'SIN-T3' → 'T3', 'SIN-JEWEL' → 'Jewel'. */
export function terminalShort(code: string | null | undefined): string {
  if (!code) return '';
  const s = code.replace(/^SIN-/, '');
  return s === 'JEWEL' ? 'Jewel' : s;
}

export const AGENT_CARD_COPY = {
  header: {
    /** "2h 40m to boarding" */
    toBoarding: (minutes: number) => `${durationShort(minutes)} to boarding`,
    /** One terminal: "T3" */
    terminal: (code: string) => terminalShort(code),
    /** Pool across two terminals (D3): "Arrived T1 · departs T3" */
    crossTerminal: (arrived: string, departs: string) =>
      `Arrived ${terminalShort(arrived)} · departs ${terminalShort(departs)}`,
    separator: ' · ',
  },

  /** The model's line is replaced by one of these when the card is built without it. */
  fallbackLine: {
    plan: (stops: number) => `${stops} good stops for the time you have`,
    delay: () => 'More time now. Here is what fits',
    next_stop: () => 'Where to next',
  },

  /** Compact strip on pages other than Home. */
  strip: {
    plan: (terminal: string, stops: number) => `Your ${terminalShort(terminal)} plan · ${stops} stops`,
    delay: (stops: number) => `Flight delayed · ${stops} new ideas`,
    next_stop: (stops: number) => `Next stop · ${stops} ideas`,
    gate_change: (gate: string) => `Gate now ${gate}`,
    final_call: () => 'Boarding soon · quick options',
  },

  /** Card titles, above the header. */
  title: {
    plan: 'Your plan',
    delay: 'Your flight is delayed',
    next_stop: 'Next stop',
    gate_change: 'Gate change',
    final_call: 'Boarding soon',
  },

  gate: {
    /** "Gate now B6 · T2" */
    line: (gate: string, terminal: string) => `Gate now ${gate} · ${terminalShort(terminal)}`,
    newTerminal: 'New terminal: allow time for the Skytrain',
    quickChip: (terminal: string) => `Quick options in ${terminalShort(terminal)}`,
  },

  finalCall: {
    line: (terminal: string) => `Quick picks in ${terminalShort(terminal)}, open now`,
  },

  stop: {
    swap: 'Swap',
    swapAria: (name: string) => `Swap ${name} for another idea`,
    open: (name: string) => `Open ${name}`,
  },

  chips: {
    askElse: 'Ask something else',
    notNow: 'Not now',
  },

  dismissAria: 'Dismiss this suggestion',
  loading: 'Planning your stops…',
  regionAria: 'Suggestion from Terminal+',

  /** Seeded chat (Ask something else). The hidden user turn tells the model what the card showed. */
  chatSeed: {
    hiddenUser: (title: string, header: string, line: string, stops: string[]) =>
      `[Terminal+ showed me this card] ${title}. ${header}. ${line}. Stops: ${stops.join('; ')}.`,
    visibleAssistant: (line: string, stops: string[]) =>
      `${line}\n${stops.map((s, i) => `${i + 1}. ${s}`).join('\n')}\n\nWant to change anything?`,
  },
} as const;
