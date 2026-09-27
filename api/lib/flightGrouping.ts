// api/lib/flightGrouping.ts
// Collapses AeroDataBox FIDS rows into one row per operating flight.
//
// Why this exists: a passenger holding LH9756 is physically on SQ322. Both rows
// come back from the board, and both must resolve to the same flight — but
// AeroDataBox has NO field pointing from a codeshare row to its operating
// flight. Verified against the api.market OpenAPI spec: AirportFlightContract
// carries only movement/departure/arrival, number, callSign, status,
// codeshareStatus, isCargo, aircraft, airline, location. There is no
// operatedBy / operatingFlightNumber / operator anywhere in the schema.
//
// So we group heuristically, behind a seam with two strategies:
//
//   callSign  — exact. An ATC call-sign belongs to the operating aircraft, so
//               every codeshare row on SQ322 should read "SIA322". Nullable in
//               the spec, and its fill rate at SIN is unmeasured, hence:
//   composite — fallback. Same scheduled minute + same opposite airport is the
//               same physical flight in practice.
//
// When both are computable we run both and log the group counts. If they agree
// on live data the heuristic is validated rather than assumed; when callSign
// turns out to be reliably populated, delete a branch instead of rewriting.

// ── Upstream shapes (only the fields we consume) ────────────────────

export interface RawAirport {
  iata?: string | null;
  name?: string | null;
}

export interface RawMovement {
  airport?: RawAirport | null;
  scheduledTime?: { utc?: string | null; local?: string | null } | null;
  revisedTime?: { utc?: string | null; local?: string | null } | null;
  terminal?: string | null;
  gate?: string | null;
}

export interface RawFlight {
  movement?: RawMovement | null;
  number?: string | null;
  callSign?: string | null;
  status?: string | null;
  codeshareStatus?: string | null;
  isCargo?: boolean;
  airline?: { name?: string | null; iata?: string | null } | null;
}

// ── Output shape ────────────────────────────────────────────────────

export type OperatorConfidence = 'confirmed' | 'unknown';
export type GroupingStrategy = 'callsign' | 'composite';

export interface FlightRow {
  flight_iata: string;
  airline_name: string | null;
  scheduled_at: string;
  terminal: string | null;
  gate: string | null;
  origin_iata: string | null;
  destination_iata: string | null;
  status: string;
  /** Every number in the group, operating number included, so any ticket resolves. */
  search_aliases: string[];
  /**
   * 'confirmed' — a group member reported codeshareStatus = IsOperator.
   * 'unknown'   — none did; the displayed number is a stable guess. Selecting
   *               such a row writes flight_source = 'picker_ungrouped' so
   *               corridor aggregates can exclude it later.
   */
  operator_confidence: OperatorConfidence;
}

export interface GroupingStats {
  raw_rows: number;
  groups_produced: number;
  groups_with_operator: number;
  groups_all_unknown: number;
  callsign_fill_rate: number;
  strategy: GroupingStrategy;
  /** Present only when both strategies were computable on this batch. */
  comparison?: {
    callsign_groups: number;
    composite_groups: number;
    agree: boolean;
  };
}

export const CALLSIGN_STRATEGY_THRESHOLD = 0.8;

// ── Normalisation ───────────────────────────────────────────────────

/** "SQ 322" -> "SQ322". AeroDataBox spaces the carrier code. */
function normalizeNumber(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const n = raw.replace(/\s+/g, '').toUpperCase();
  return n || null;
}

/**
 * AeroDataBox emits "2026-08-24 10:30Z" — a space, not a "T". V8 tolerates it
 * but it is not ISO-8601, so normalise before parsing rather than relying on
 * engine leniency.
 */
export function toIso(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const d = new Date(raw.replace(' ', 'T'));
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

/**
 * Strictly IATA, or null. `iata` is nullable in the spec, but do NOT fall back
 * to airport.name here: origin_iata/destination_iata are the corridor
 * aggregation key, and a display name sitting in an _iata field would group
 * "Melbourne Tullamarine" separately from "MEL" while looking perfectly valid.
 * No UI reads these — picker rows show flight/airline/time/terminal — so a
 * missing code costs nothing on screen and null keeps the key clean.
 */
function oppositeIata(m: RawMovement | null | undefined): string | null {
  return m?.airport?.iata || null;
}

/**
 * Grouping key only. Falls back to the name so two codeshares of one flight
 * still collapse when the code is missing; never reaches the response.
 */
function oppositeGroupKey(m: RawMovement | null | undefined): string | null {
  return m?.airport?.iata || m?.airport?.name || null;
}

// ── Grouping ────────────────────────────────────────────────────────

interface Candidate {
  number: string;
  callSign: string | null;
  scheduled_at: string;
  opposite: string | null;
  raw: RawFlight;
}

/**
 * Rows missing a parseable scheduledTime are dropped: scheduledTime is not in
 * the contract's `required` list, and a board row with no time is unusable in a
 * picker sorted by time.
 */
function toCandidates(rows: RawFlight[]): Candidate[] {
  const out: Candidate[] = [];
  for (const raw of rows) {
    const number = normalizeNumber(raw.number);
    const scheduled_at = toIso(raw.movement?.scheduledTime?.utc);
    if (!number || !scheduled_at) continue;
    out.push({
      number,
      callSign: normalizeNumber(raw.callSign),
      scheduled_at,
      opposite: oppositeGroupKey(raw.movement),
      raw,
    });
  }
  return out;
}

function callsignKey(c: Candidate, index: number): string {
  // No call-sign: keep the row as its own group rather than merging unrelated
  // flights under a shared empty key.
  return c.callSign ? `cs:${c.callSign}` : `cs:__none__:${index}`;
}

function compositeKey(c: Candidate): string {
  return `co:${c.scheduled_at}|${c.opposite ?? '?'}`;
}

function groupBy(
  candidates: Candidate[],
  keyFn: (c: Candidate, i: number) => string
): Map<string, Candidate[]> {
  const groups = new Map<string, Candidate[]>();
  candidates.forEach((c, i) => {
    const k = keyFn(c, i);
    const bucket = groups.get(k);
    if (bucket) bucket.push(c);
    else groups.set(k, [c]);
  });
  return groups;
}

/**
 * Operating row = the member reporting IsOperator. When several do (shouldn't
 * happen, but the field is advisory) or none do, the lowest flight number wins:
 * arbitrary, but stable across refetches so the picker doesn't reshuffle.
 */
function pickOperator(group: Candidate[]): { chosen: Candidate; confidence: OperatorConfidence } {
  const byNumber = [...group].sort((a, b) => a.number.localeCompare(b.number));
  const operators = byNumber.filter((c) => c.raw.codeshareStatus === 'IsOperator');
  return operators.length > 0
    ? { chosen: operators[0], confidence: 'confirmed' }
    : { chosen: byNumber[0], confidence: 'unknown' };
}

function toRow(
  group: Candidate[],
  direction: 'departure' | 'arrival'
): FlightRow {
  const { chosen, confidence } = pickOperator(group);
  const m = chosen.raw.movement ?? null;
  const iata = oppositeIata(m);

  return {
    flight_iata: chosen.number,
    airline_name: chosen.raw.airline?.name ?? null,
    scheduled_at: chosen.scheduled_at,
    terminal: m?.terminal ?? null,
    gate: m?.gate ?? null,
    // movement.airport is the OPPOSITE end of the leg: destination for a
    // departure, origin for an arrival. (Confirmed in the OpenAPI spec.)
    origin_iata: direction === 'arrival' ? iata : null,
    destination_iata: direction === 'departure' ? iata : null,
    status: chosen.raw.status ?? 'Unknown',
    search_aliases: [...new Set(group.map((c) => c.number))].sort(),
    operator_confidence: confidence,
  };
}

export function groupCodeshares(
  rows: RawFlight[],
  direction: 'departure' | 'arrival'
): { flights: FlightRow[]; stats: GroupingStats } {
  const candidates = toCandidates(rows);

  const withCallsign = candidates.filter((c) => c.callSign).length;
  const fillRate = candidates.length === 0 ? 0 : withCallsign / candidates.length;

  const useCallsign = fillRate >= CALLSIGN_STRATEGY_THRESHOLD;
  const strategy: GroupingStrategy = useCallsign ? 'callsign' : 'composite';

  const groups = groupBy(candidates, useCallsign ? callsignKey : compositeKey);
  const flights = [...groups.values()].map((g) => toRow(g, direction));

  // Run the other strategy too whenever it is meaningful, and record whether
  // the two agree. One extra pass over ~60 rows; this comparison is what
  // validates the fallback instead of assuming it.
  let comparison: GroupingStats['comparison'];
  if (candidates.length > 0 && fillRate > 0) {
    const callsignGroups = useCallsign
      ? groups.size
      : groupBy(candidates, callsignKey).size;
    const compositeGroups = useCallsign
      ? groupBy(candidates, compositeKey).size
      : groups.size;
    comparison = {
      callsign_groups: callsignGroups,
      composite_groups: compositeGroups,
      agree: callsignGroups === compositeGroups,
    };
  }

  const groupsWithOperator = flights.filter(
    (f) => f.operator_confidence === 'confirmed'
  ).length;

  return {
    flights,
    stats: {
      raw_rows: rows.length,
      groups_produced: flights.length,
      groups_with_operator: groupsWithOperator,
      groups_all_unknown: flights.length - groupsWithOperator,
      callsign_fill_rate: Number(fillRate.toFixed(3)),
      strategy,
      comparison,
    },
  };
}
