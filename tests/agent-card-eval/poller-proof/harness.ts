import { h } from './stubs/react';
import { J } from './context/JourneyContext';
import { F } from './services/flightService';
// The real mapTerminalToCode must match the stub: checked below against the source.
export async function run(mod: any, journey: any, payload: any) {
  h.effects.length = 0; J.writes.length = 0; J.journey = journey; F.payload = payload;
  const toasts: any[] = [];
  mod.setFlightToastHandler((t: any) => toasts.push(t));
  (globalThis as any).document = { visibilityState: 'visible' };
  // Call the hook, then its poll: the effect schedules setTimeout(poll, 5000); capture it.
  const timers: Array<() => any> = [];
  (globalThis as any).setTimeout = (fn: any) => { timers.push(fn); return 1; };
  (globalThis as any).setInterval = () => 2;
  (globalThis as any).clearTimeout = () => {}; (globalThis as any).clearInterval = () => {};
  mod.useFlightUpdates();
  h.effects.forEach(e => e());
  for (const t of timers) await t();
  await new Promise(r => (global as any).setImmediate(r));
  const w = J.writes[0] ? { ...J.writes[0] } : null;
  if (w) delete w.lastUpdated;
  return { toasts, write: w };
}
