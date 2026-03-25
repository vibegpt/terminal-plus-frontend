/**
 * Terminal path utilities for SIN Changi Airport.
 *
 * T1 <-> T2 <-> T3 are connected by Skytrain (linear path).
 * T4 is separate (bus transfer).
 * Jewel connects to T1 (walkway) and T2/T3 (shuttle).
 */

const SIN_TERMINAL_ORDER = ['SIN-T1', 'SIN-T2', 'SIN-T3'];

/**
 * Returns true if `amenityTerminal` lies on the linear Skytrain path
 * between `userTerminal` and `departureTerminal`.
 *
 * T4 and Jewel are never "on the way" because they require separate transfers.
 * Same-terminal doesn't count (no "on the way" bonus needed when you're already there).
 */
export function isOnTheWay(
  amenityTerminal: string,
  userTerminal: string,
  departureTerminal: string,
): boolean {
  if (userTerminal === departureTerminal) return false;

  const userIdx = SIN_TERMINAL_ORDER.indexOf(userTerminal);
  const deptIdx = SIN_TERMINAL_ORDER.indexOf(departureTerminal);
  const amenIdx = SIN_TERMINAL_ORDER.indexOf(amenityTerminal);

  if (userIdx === -1 || deptIdx === -1 || amenIdx === -1) return false;

  const [low, high] = userIdx < deptIdx ? [userIdx, deptIdx] : [deptIdx, userIdx];
  return amenIdx >= low && amenIdx <= high && amenIdx !== userIdx;
}
