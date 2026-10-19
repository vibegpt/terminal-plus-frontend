import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { queryRouteMatch } from './lib/agent';
import { queryRankedAmenities } from './lib/ranking';
import { randomUUID } from 'node:crypto';
import { logToolCall, type ToolMeta } from './lib/agentTelemetry';
import { isTestRequest } from './lib/telemetryEnv';
import { eligibility, landsideAccess } from '../shared/ranking/policy';
import { HOURS_COPY } from '../shared/ranking/landsideCopy';
import { sgMinutesOfDay } from '../src/lib/sgTime';

// ---------- Load .env.local for vercel dev ----------
try {
  const envPath = resolve(process.cwd(), '.env.local');
  const envContent = readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx);
    let val = trimmed.slice(eqIdx + 1);
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
} catch { /* .env.local not found in production */ }

// ---------- Shared Supabase client ----------

let _supabase: SupabaseClient | null = null;
function getSupabase(): SupabaseClient {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  let url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  if (!url && key) {
    try {
      const payload = JSON.parse(Buffer.from(key.split('.')[1], 'base64').toString());
      if (payload.ref) url = `https://${payload.ref}.supabase.co`;
    } catch { /* ignore */ }
  }
  if (!_supabase && url && key) _supabase = createClient(url, key);
  return _supabase!;
}

// ---------- Tool definitions ----------

const PROTOCOL_VERSION = '2025-03-26';

// Every tool only reads. The two flight tools reach an outside flight-data
// service, so they're open-world; the other two read our own catalogue.
function annotations(title: string, openWorld: boolean) {
  return { title, readOnlyHint: true, destructiveHint: false, openWorldHint: openWorld };
}

const TOOLS = [
  {
    name: 'get_airport_context',
    title: 'Flight status and boarding time',
    description: 'Use when a traveller gives a flight number and asks "which terminal and gate?", "when do I board?" or "how long have I got?". Singapore Changi (SIN) only. Looks up live flight data and returns terminal, gate, status, estimated boarding time and minutes until boarding.',
    annotations: annotations('Flight status and boarding time', true),
    inputSchema: {
      type: 'object' as const,
      properties: {
        flight_number: { type: 'string', description: 'IATA flight number, e.g. SQ321' },
        date: { type: 'string', description: 'Flight date YYYY-MM-DD. Defaults to today Singapore time.' },
      },
      required: ['flight_number'],
    },
  },
  {
    name: 'get_recommendations',
    title: 'Places to eat, rest and shop at Changi',
    description: 'Use when a traveller asks "where can I eat in T3?", "somewhere quiet to rest before my flight" or "what is worth seeing with 3 hours?". Singapore Changi (SIN) only: Terminals 1 to 4 and Jewel. Returns up to 12 hand-picked venues, each with a link to its page. Venues that are closed, or landside when there is not time to clear immigration, are left out.',
    annotations: annotations('Places to eat, rest and shop at Changi', false),
    inputSchema: {
      type: 'object' as const,
      properties: {
        terminal: { type: 'string', description: 'Terminal code: SIN-T1, SIN-T2, SIN-T3, SIN-T4, SIN-JEWEL' },
        vibe: { type: 'string', enum: ['explore', 'refuel', 'comfort', 'chill', 'work', 'shop', 'quick'], description: 'Mood/intent filter' },
        time_until_boarding_minutes: { type: 'number', description: 'Minutes until boarding' },
        gate: { type: 'string', description: 'Gate code, e.g. C22' },
        exclude_jewel: { type: 'boolean', description: 'Set true to exclude Jewel' },
        limit: { type: 'number', description: 'Number of recommendations (default 7, max 12)' },
      },
    },
  },
  {
    name: 'get_disruption_status',
    title: 'Flight delays and gate changes',
    description: 'Use when a traveller asks "is my flight delayed?", "has my gate changed?" or "was it cancelled?". Singapore Changi (SIN) only. Looks up live flight data and returns any delay, cancellation or gate, with what to do next.',
    annotations: annotations('Flight delays and gate changes', true),
    inputSchema: {
      type: 'object' as const,
      properties: {
        flight_number: { type: 'string', description: 'IATA flight number, e.g. SQ321' },
        date: { type: 'string', description: 'Flight date YYYY-MM-DD' },
      },
      required: ['flight_number'],
    },
  },
  {
    name: 'get_route',
    title: 'Plan a layover at Changi',
    description: 'Use when a traveller between flights asks "what should I do with my 4-hour layover?" or "plan my time before the gate". Singapore Changi (SIN) only. Give the arrival terminal and the minutes available; a known flight number (e.g. QF1) can match a hand-made route. Returns stops in order with durations and a buffer for the walk to the gate.',
    annotations: annotations('Plan a layover at Changi', false),
    inputSchema: {
      type: 'object' as const,
      properties: {
        arrival_terminal: { type: 'string', description: 'Terminal the passenger arrived at, e.g. SIN-T1, SIN-T3' },
        departure_terminal: { type: 'string', description: 'Terminal departing from. Defaults to arrival_terminal if same-terminal transit.' },
        time_budget_minutes: { type: 'number', description: 'Total usable minutes between now and when passenger needs to be at departure gate.' },
        flight_number: { type: 'string', description: 'If known, used to match curated route templates (e.g. QF1, SQ322).' },
        vibe: { type: 'string', enum: ['explore', 'refuel', 'comfort', 'chill', 'work', 'shop', 'quick'], description: 'Preferred vibe to weight stop selection.' },
      },
      required: ['arrival_terminal', 'time_budget_minutes'],
    },
  },
];

// ---------- Shared helpers ----------

interface ToolResult {
  payload: unknown;
  meta: ToolMeta;
}

/** The venue's page, tagged so the visit shows in analytics_acquisition. */
function amenityUrl(slug: string | null | undefined): string | null {
  if (!slug) return null;
  return `https://terminalplus.app/amenity/${encodeURIComponent(slug)}?utm_source=mcp&utm_medium=agent`;
}

/** Labels a kept venue carries at the front of its note, as the chat routes do. */
function eligibilityLabel(e: ReturnType<typeof eligibility> | null): string {
  return [
    e?.tier === 'soon' && e.open.opensAt ? HOURS_COPY.opensAt(e.open.opensAt) : null,
    e?.access.label ?? null,
  ].filter(Boolean).join('. ');
}

function withLabel(label: string, note: string | null | undefined): string | null {
  if (!label) return note || null;
  return note ? `${label}. ${note}` : label;
}

function minutesUntil(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  return Number.isFinite(t) ? Math.round((t - Date.now()) / 60000) : null;
}

// ---------- Flight status helper ----------

const FLIGHT_LOOKUP_TIMEOUT_MS = 8_000;

type FlightLookup = { flight: any } | { error: 'flight_not_found' | 'upstream_error' };

async function fetchFlightStatus(flightNumber: string, date: string): Promise<FlightLookup> {
  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:3000';
  try {
    // Bounded like each AeroDataBox call (api/flight-status.ts ADB_TIMEOUT_MS), so the
    // tool answers inside its 10 s budget even when flight-status makes two calls.
    const res = await fetch(`${baseUrl}/api/flight-status?number=${encodeURIComponent(flightNumber)}&date=${date}`, {
      signal: AbortSignal.timeout(FLIGHT_LOOKUP_TIMEOUT_MS),
    });
    if (res.status === 404) return { error: 'flight_not_found' };
    if (!res.ok) return { error: 'upstream_error' };
    return { flight: await res.json() };
  } catch { return { error: 'upstream_error' }; }
}

const FLIGHT_UNAVAILABLE = 'Live flight data is unavailable right now. Try again in a minute.';

// ---------- Tool handlers ----------

async function handleGetAirportContext(args: any): Promise<ToolResult> {
  const flightDate = args.date || new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Singapore' });
  const lookup = await fetchFlightStatus(args.flight_number, flightDate);

  if ('error' in lookup) {
    const notFound = lookup.error === 'flight_not_found';
    return {
      payload: {
        error: notFound ? 'flight_not_found' : 'flight_data_unavailable',
        message: notFound
          ? `Could not find flight ${args.flight_number} at Singapore Changi. Check the flight number and date.`
          : FLIGHT_UNAVAILABLE,
        coverage: 'Terminal+ covers Singapore Changi Airport (SIN) only.',
        fallback: 'Call get_recommendations with a terminal code instead.',
      },
      meta: { zeroReason: lookup.error },
    };
  }

  const flight = lookup.flight;
  const timeUntilBoarding = minutesUntil(flight.estimatedBoardingTime);

  return {
    payload: {
      airport: 'SIN', airport_name: 'Singapore Changi Airport',
      flight_number: flight.flightNumber, airline: flight.airline,
      direction: flight.isDepartingFromSIN === false ? 'arrival' : 'departure',
      terminal: flight.terminal, gate: flight.gate, status: flight.status,
      scheduled_departure: flight.scheduledTime, revised_departure: flight.revisedTime,
      estimated_boarding_time: flight.estimatedBoardingTime,
      time_until_boarding_minutes: timeUntilBoarding,
      destination: flight.destination,
      urgency: timeUntilBoarding !== null ? (timeUntilBoarding < 30 ? 'high' : timeUntilBoarding < 90 ? 'medium' : 'low') : 'unknown',
      inter_terminal_travel: {
        skytrain: 'T1-T2-T3 connected airside, ~5 min between stops',
        t4_shuttle: 'T4 requires shuttle bus from T2, ~10 min',
        jewel: 'Connected to T1 landside. Must clear immigration from airside.',
      },
    },
    meta: {},
  };
}

async function handleGetRecommendations(args: any): Promise<ToolResult> {
  const supabase = getSupabase();
  const resultLimit = Math.min(args.limit || 7, 12);

  const { ranked, error } = await queryRankedAmenities(supabase, {
    vibe: args.vibe,
    userTerminal: args.terminal ?? null,
    timeUntilBoardingMinutes: args.time_until_boarding_minutes,
    excludeJewel: args.exclude_jewel,
    limit: resultLimit,
  });

  if (error || !ranked.length) {
    return {
      payload: { recommendations: [], message: error ? 'The venue list is unavailable right now. Try again in a minute.' : 'No matching amenities found.' },
      meta: { zeroReason: error ? 'upstream_error' : 'no_recommendations' },
    };
  }

  const recs = ranked.map((a: any, i: number) => ({
    rank: i + 1, name: a.name,
    terminal: a.terminal_code, vibe_tags: a.vibe_tags, price_level: a.price_level,
    description: a.description?.substring(0, 150),
    editorial_note: a.editorial_note || null,
    route_context: a.route_context || null,
    url: amenityUrl(a.amenity_slug),
  }));

  return {
    payload: { recommendations: recs },
    meta: {
      slugs: ranked.map((a: any) => a.amenity_slug),
      amenities: ranked.map((a: any) => ({ id: a.id, name: a.name })),
    },
  };
}

async function handleGetDisruptionStatus(args: any): Promise<ToolResult> {
  const flightDate = args.date || new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Singapore' });
  const lookup = await fetchFlightStatus(args.flight_number, flightDate);

  if ('error' in lookup) {
    return {
      payload: {
        flight_number: args.flight_number, status: 'unknown',
        message: lookup.error === 'flight_not_found'
          ? `Could not find flight ${args.flight_number} at Singapore Changi.`
          : FLIGHT_UNAVAILABLE,
      },
      meta: { zeroReason: lookup.error },
    };
  }

  const flight = lookup.flight;
  const disruptions: any[] = [];
  let suggestedActions: string[] = [];

  if (flight.revisedTime && flight.scheduledTime) {
    const delayMinutes = Math.round((Date.parse(flight.revisedTime) - Date.parse(flight.scheduledTime)) / 60000);
    if (delayMinutes > 15) {
      disruptions.push({ type: 'delay', severity: delayMinutes > 120 ? 'major' : delayMinutes > 60 ? 'moderate' : 'minor', delay_minutes: delayMinutes });
      // Jewel is landside: the shared rule decides, from the minutes to the new
      // boarding time, with the passenger type unknown (shared/ranking/policy.ts).
      const jewel = landsideAccess({ isLandside: true, journeyType: null, minutesToBoarding: minutesUntil(flight.estimatedBoardingTime) });
      suggestedActions.push(jewel.show
        ? `Extra time: Jewel is an option. ${jewel.label}.`
        : `Suggest dining options in the current terminal. ${jewel.reason}`);
    }
  }
  if (flight.status?.toLowerCase().includes('cancel')) {
    disruptions.push({ type: 'cancellation', severity: 'critical' });
    suggestedActions = ['Direct passenger to airline service desk immediately'];
  }

  return {
    payload: {
      flight_number: flight.flightNumber, status: flight.status,
      disruptions: disruptions.length > 0 ? disruptions : null,
      has_disruption: disruptions.length > 0,
      gate: { gate: flight.gate, terminal: flight.terminal },
      suggested_actions: suggestedActions.length > 0 ? suggestedActions : ['No disruptions detected.'],
    },
    meta: {},
  };
}

// ---------- Route handler ----------

const NO_ROUTE_MESSAGE = 'No amenities with editorial recommendations fit this time at these terminals. Try get_recommendations for a broader search.';

async function handleGetRoute(args: any): Promise<ToolResult> {
  const supabase = getSupabase();
  const depTerminal = args.departure_terminal || args.arrival_terminal;
  const timeBudget: number = args.time_budget_minutes;
  // Both eligibility rules, as for every other surface: minutes to boarding is the
  // time budget, and the passenger type is unknown (the policy's "type unknown" rows).
  const ctx = { journeyType: null, minutesToBoarding: timeBudget, nowSgt: sgMinutesOfDay() };

  // 1. Try flight-number match first (MCP-specific feature)
  let flightMatch: any = null;
  if (args.flight_number) {
    const { data: templates } = await supabase
      .from('route_templates')
      .select('*')
      .eq('is_active', true)
      .contains('flight_patterns', [args.flight_number.toUpperCase()]);

    if (templates && templates.length > 0) {
      flightMatch = templates.find((t: any) =>
        timeBudget >= t.min_minutes && timeBudget <= t.max_minutes
      ) || templates[0];
    }
  }

  // 2. Flight match: its stops, minus the venues the rules leave out
  if (flightMatch) {
    const { data: rawStops } = await supabase
      .from('route_stops')
      .select('stop_order, name, amenity_slug, stop_type, duration_minutes, editorial_note, is_optional, area')
      .eq('route_template_id', flightMatch.id)
      .order('stop_order', { ascending: true });

    const slugs = (rawStops || []).map((s: any) => s.amenity_slug).filter(Boolean);
    const venues = new Map<string, { is_landside: boolean; opening_hours: unknown }>();
    if (slugs.length > 0) {
      const { data: amenities } = await supabase
        .from('amenity_detail')
        .select('amenity_slug, is_landside, opening_hours')
        .in('amenity_slug', slugs);
      for (const a of amenities || []) venues.set(a.amenity_slug, { is_landside: !!a.is_landside, opening_hours: a.opening_hours });
    }
    const eligibilityOf = (s: any) => {
      const v = s.amenity_slug ? venues.get(s.amenity_slug) : undefined;
      return v ? eligibility(v, ctx) : null;
    };

    // A stop with no venue (restrooms, walk to gate) always stays.
    let stops = (rawStops || []).filter((s: any) => eligibilityOf(s)?.tier !== null);

    // Strip optional stops if time is tight (same logic as queryRouteMatch)
    const isTimeTight = timeBudget < flightMatch.min_minutes + 15;
    if (isTimeTight) {
      stops = stops.filter((s: any) => !s.is_optional);
    }

    // Progressive strip: remove optionals from end if total + buffer exceeds budget
    let totalTime = stops.reduce((sum: number, s: any) => sum + s.duration_minutes, 0);
    while (totalTime + 15 > timeBudget && stops.some((s: any) => s.is_optional)) {
      for (let i = stops.length - 1; i >= 0; i--) {
        if (stops[i].is_optional) { stops.splice(i, 1); break; }
      }
      totalTime = stops.reduce((sum: number, s: any) => sum + s.duration_minutes, 0);
    }

    if (stops.some((s: any) => s.amenity_slug)) {
      return {
        payload: {
          route_type: 'curated',
          route_name: flightMatch.name,
          description: flightMatch.description,
          arrival_terminal: flightMatch.arrival_terminal,
          departure_terminal: flightMatch.departure_terminal,
          total_minutes: totalTime,
          gate_buffer_minutes: 15,
          is_time_tight: isTimeTight,
          stops: stops.map((s: any) => ({
            order: s.stop_order, type: s.stop_type, name: s.name,
            area: s.area, duration_minutes: s.duration_minutes,
            editorial_note: withLabel(eligibilityLabel(eligibilityOf(s)), s.editorial_note),
            is_optional: s.is_optional,
            url: amenityUrl(s.amenity_slug),
          })),
          constraints: flightMatch.key_constraints,
        },
        meta: { routeId: flightMatch.route_id, slugs: stops.map((s: any) => s.amenity_slug).filter(Boolean) },
      };
    }
    // Every venue on it is out of reach now: fall through to the other routes.
  }

  // 3. Shared queryRouteMatch for terminal+time matching (same logic as chat agent)
  const routeMatch = await queryRouteMatch(supabase, args.arrival_terminal, timeBudget, { nowSgt: ctx.nowSgt });
  if (routeMatch) {
    return {
      payload: {
        route_type: 'curated',
        route_name: routeMatch.templateName,
        description: routeMatch.templateDescription,
        arrival_terminal: routeMatch.arrivalTerminal,
        departure_terminal: routeMatch.departureTerminal,
        total_minutes: routeMatch.totalDurationMinutes,
        gate_buffer_minutes: routeMatch.gateBufferMinutes,
        is_time_tight: routeMatch.isTimeTight,
        stops: routeMatch.stops.map((s) => ({
          order: s.order, type: s.stopType, name: s.name,
          area: s.terminalCode, duration_minutes: s.durationMinutes,
          editorial_note: s.editorialNote, is_optional: s.isOptional,
          url: amenityUrl(s.amenitySlug),
        })),
      },
      meta: { slugs: routeMatch.stops.map((s) => s.amenitySlug).filter(Boolean) },
    };
  }

  // 4. Dynamic fallback from top editorial-scored amenities the rules allow
  const terminals = args.arrival_terminal === depTerminal
    ? [args.arrival_terminal]
    : [args.arrival_terminal, depTerminal];

  let query = supabase
    .from('amenity_detail')
    .select('amenity_slug, name, terminal_code, vibe_tags, editorial_note, editorial_score, route_context, price_level, is_landside, opening_hours')
    .eq('airport_code', 'SIN')
    .in('terminal_code', terminals)
    .not('editorial_note', 'is', null)
    .order('editorial_score', { ascending: false })
    .limit(20);

  if (args.vibe) {
    query = query.ilike('vibe_tags', `%${args.vibe}%`);
  }

  const { data: rows, error } = await query;
  const amenities = (rows || [])
    .map((a: any) => ({ a, e: eligibility(a, ctx) }))
    .filter(({ e }) => e.tier !== null);

  if (error || amenities.length === 0) {
    return {
      payload: {
        route_type: 'dynamic',
        message: error ? 'The venue list is unavailable right now. Try again in a minute.' : NO_ROUTE_MESSAGE,
        arrival_terminal: args.arrival_terminal,
        departure_terminal: depTerminal,
      },
      meta: { zeroReason: error ? 'upstream_error' : 'no_route_stops' },
    };
  }

  const stopDurations: Record<string, number> = { food: 15, attraction: 10, shopping: 12, lounge: 30, default: 10 };
  const dynamicStops: any[] = [];
  const stopSlugs: string[] = [];
  let remainingMinutes = timeBudget - 15; // reserve 15 min gate buffer

  for (const { a: amenity, e } of amenities) {
    if (remainingMinutes <= 0) break;
    const vibes = (amenity.vibe_tags || '').toLowerCase();
    let stopType = 'attraction';
    let duration = stopDurations.default;

    if (vibes.includes('refuel')) { stopType = 'food'; duration = stopDurations.food; }
    else if (vibes.includes('shop')) { stopType = 'shopping'; duration = stopDurations.shopping; }
    else if (vibes.includes('comfort')) { stopType = 'lounge'; duration = stopDurations.lounge; }
    else if (vibes.includes('explore')) { stopType = 'attraction'; duration = stopDurations.attraction; }

    if (duration + 5 <= remainingMinutes) {
      dynamicStops.push({
        order: dynamicStops.length + 1, type: stopType, name: amenity.name,
        area: amenity.terminal_code, duration_minutes: duration,
        editorial_note: withLabel(eligibilityLabel(e), amenity.editorial_note),
        url: amenityUrl(amenity.amenity_slug),
      });
      stopSlugs.push(amenity.amenity_slug);
      remainingMinutes -= (duration + 5);
    }
  }

  if (dynamicStops.length === 0) {
    return {
      payload: { route_type: 'dynamic', message: NO_ROUTE_MESSAGE, arrival_terminal: args.arrival_terminal, departure_terminal: depTerminal },
      meta: { zeroReason: 'no_route_stops' },
    };
  }

  dynamicStops.push({
    order: dynamicStops.length + 1, type: 'buffer',
    name: 'Walk to gate + security', area: depTerminal,
    duration_minutes: 15,
    editorial_note: 'Gate security at Changi is per-gate. No priority lane. Do not cut this short.',
  });

  const totalTime = dynamicStops.reduce((sum: number, s: any) => sum + s.duration_minutes, 0);

  return {
    payload: {
      route_type: 'dynamic',
      description: `Dynamically composed route based on highest-rated amenities in ${terminals.join(' + ')}`,
      arrival_terminal: args.arrival_terminal,
      departure_terminal: depTerminal,
      total_minutes: totalTime,
      gate_buffer_minutes: 15,
      stops: dynamicStops,
      note: 'This route was composed dynamically from editorial-scored amenities. Curated routes are available for known flight patterns.',
    },
    meta: { slugs: stopSlugs },
  };
}

// ---------- MCP JSON-RPC Handler ----------

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept, Mcp-Session-Id, Mcp-Protocol-Version, X-Tp-Test');
  res.setHeader('Access-Control-Expose-Headers', 'Mcp-Session-Id');

  if (req.method === 'OPTIONS') return res.status(204).end();

  if (req.method === 'GET') {
    // Streamable HTTP: this server opens no server-to-client stream.
    if (String(req.headers.accept || '').includes('text/event-stream')) {
      res.setHeader('Allow', 'POST, OPTIONS');
      return res.status(405).end();
    }
    // Plain GET: server info (liveness)
    return res.status(200).json({
      name: 'terminal-plus',
      version: '1.1.0',
      protocolVersion: PROTOCOL_VERSION,
      capabilities: { tools: {} },
    });
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { jsonrpc, id, method, params } = req.body || {};

  if (jsonrpc !== '2.0') {
    return res.status(400).json({ jsonrpc: '2.0', id, error: { code: -32600, message: 'Invalid request: missing jsonrpc 2.0' } });
  }

  // Notifications (and client responses) carry no id: accept, no body.
  if (id === undefined) return res.status(202).end();

  try {
    switch (method) {
      case 'initialize':
        res.setHeader('Mcp-Session-Id', randomUUID());
        return res.status(200).json({
          jsonrpc: '2.0', id,
          result: {
            protocolVersion: PROTOCOL_VERSION,
            capabilities: { tools: { listChanged: false } },
            serverInfo: { name: 'terminal-plus', version: '1.1.0' },
          },
        });

      case 'ping':
        return res.status(200).json({ jsonrpc: '2.0', id, result: {} });

      case 'tools/list':
        return res.status(200).json({ jsonrpc: '2.0', id, result: { tools: TOOLS } });

      case 'tools/call': {
        const toolName = params?.name;
        const toolArgs = params?.arguments || {};
        const mcpSessionKey = (req.headers['mcp-session-id'] as string) || null;
        const sessionId = mcpSessionKey || randomUUID();
        const startedAt = Date.now();
        let result: ToolResult;

        switch (toolName) {
          case 'get_airport_context':
            result = await handleGetAirportContext(toolArgs);
            break;
          case 'get_recommendations':
            result = await handleGetRecommendations(toolArgs);
            break;
          case 'get_disruption_status':
            result = await handleGetDisruptionStatus(toolArgs);
            break;
          case 'get_route':
            result = await handleGetRoute(toolArgs);
            break;
          default:
            return res.status(200).json({
              jsonrpc: '2.0', id,
              error: { code: -32601, message: `Unknown tool: ${toolName}` },
            });
        }

        const resultText = JSON.stringify(result.payload, null, 2);
        await logToolCall(getSupabase(), {
          toolName, args: toolArgs, resultText, sessionId, mcpSessionKey,
          latencyMs: Date.now() - startedAt,
          meta: result.meta,
          isTest: isTestRequest(req.headers),
        });

        return res.status(200).json({
          jsonrpc: '2.0', id,
          result: { content: [{ type: 'text', text: resultText }] },
        });
      }

      default:
        return res.status(200).json({
          jsonrpc: '2.0', id,
          error: { code: -32601, message: `Method not found: ${method}` },
        });
    }
  } catch (err) {
    console.error('MCP error:', err);
    return res.status(200).json({
      jsonrpc: '2.0', id,
      error: { code: -32603, message: 'Internal error' },
    });
  }
}
