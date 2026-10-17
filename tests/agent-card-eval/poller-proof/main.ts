import * as oldMod from './old/useFlightUpdates';
import * as newMod from './new/useFlightUpdates';
import { run } from './harness';
const B = new Date(Date.now() + 100 * 60_000).toISOString();
const base = { currentTerminal: 'SIN-T3', departingFlight: 'SQ221', departureTerminal: 'SIN-T3', boardingTime: B, gate: 'B6', capturedAt: 'c', journey_type: 'connecting' };
const pay = (p: any) => ({ flightNumber: 'SQ221', airline: 'SIA', status: 'Expected', terminal: '3', gate: 'B6', scheduledTime: '2026-10-17 10:00Z', revisedTime: '2026-10-17 10:00Z', estimatedBoardingTime: B, destination: 'SYD', origin: null, isDepartingFromSIN: true, leg: 'departure', ...p });
const cases: Array<[string, any, any]> = [
  ['gate change, same terminal', base, pay({ gate: 'B8' })],
  ['gate change + new terminal', base, pay({ gate: 'E4', terminal: '2' })],
  ['delay 40 min + new boarding time', base, pay({ revisedTime: '2026-10-17 10:40Z', estimatedBoardingTime: '2026-10-17T10:05:00.000Z' })],
  ['gate + delay + terminal + destination', { ...base, destination: null }, pay({ gate: 'E4', terminal: 'T2', revisedTime: '2026-10-17 10:40Z', estimatedBoardingTime: '2026-10-17T10:05:00.000Z' })],
  ['cancelled', base, pay({ status: 'Cancelled' })],
  ['first gate assignment', { ...base, gate: null }, pay({ gate: 'C1' })],
  ['arrival leg: terminal must not move', base, pay({ terminal: '1', leg: 'arrival', isDepartingFromSIN: false, estimatedBoardingTime: null })],
  ['no change', base, pay({})],
];
(async () => {
  let ok = true;
  for (const [name, j, p] of cases) {
    const o = await run(oldMod, j, p);
    const n = await run(newMod, j, p);
    const sameToasts = JSON.stringify(o.toasts) === JSON.stringify(n.toasts);
    const oNoTerm = o.write; const nNoTerm = n.write ? { ...n.write } : null;
    const termNew = nNoTerm?.departureTerminal; if (nNoTerm && oNoTerm) nNoTerm.departureTerminal = oNoTerm.departureTerminal;
    const sameOther = JSON.stringify(oNoTerm) === JSON.stringify(n.write && o.write ? nNoTerm : n.write);
    console.log(`${sameToasts && sameOther ? 'SAME' : 'DIFF'} | ${name} | toasts old=${JSON.stringify(o.toasts.map((t: any) => t.message))} new=${JSON.stringify(n.toasts.map((t: any) => t.message))} | boardingTime old=${o.write?.boardingTime ?? '-'} new=${n.write?.boardingTime ?? '-'} | departureTerminal new=${termNew ?? '(no write)'}`);
    if (!sameToasts) ok = false;
  }
  console.log(ok ? 'TOASTS IDENTICAL IN ALL CASES' : 'TOAST MISMATCH');
})();
