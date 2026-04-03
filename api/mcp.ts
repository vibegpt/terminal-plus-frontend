import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { queryRouteMatch } from './lib/agent';

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

const TOOLS = [
  {
    name: 'get_airport_context',
    description: 'Get terminal, gate, boarding time, and travel context for a flight at Singapore Changi Airport (SIN).',
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
    description: 'Get personalized amenity recommendations at Singapore Changi Airport by vibe, terminal, and time constraints.',
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
    description: 'Check flight disruption status at Singapore Changi Airport. Returns delay info, gate changes, and suggested actions.',
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
    description: 'Get a time-sequenced route through Singapore Changi Airport. Returns ordered stops with editorial notes, durations, and timing. Best used after get_airport_context to know the passenger terminal and time budget. Returns curated routes for known flight patterns (e.g. QF1) or dynamically composed routes.',
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

// ---------- Flight status helper ----------

async function fetchFlightStatus(flightNumber: string, date: string) {
  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:3000';
  try {
    const res = await fetch(`${baseUrl}/api/flight-status?number=${encodeURIComponent(flightNumber)}&date=${date}`);
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
}

// ---------- Tool handlers ----------

async function handleGetAirportContext(args: any) {
  const flightDate = args.date || new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Singapore' });
  const flight = await fetchFlightStatus(args.flight_number, flightDate);

  if (!flight) {
    return JSON.stringify({
      error: 'flight_not_found',
      message: `Could not find flight ${args.flight_number}. Check the flight number and date.`,
      coverage: 'Terminal+ currently covers Singapore Changi Airport (SIN) only.',
      fallback: 'Call get_recommendations with a terminal code instead.',
    }, null, 2);
  }

  const now = new Date();
  const sinNow = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Singapore' }));
  let timeUntilBoarding: number | null = null;
  if (flight.estimatedBoardingTime) {
    timeUntilBoarding = Math.round((new Date(flight.estimatedBoardingTime).getTime() - sinNow.getTime()) / 60000);
  }

  return JSON.stringify({
    airport: 'SIN', airport_name: 'Singapore Changi Airport',
    flight_number: flight.flightNumber, airline: flight.airline,
    terminal: flight.terminal, gate: flight.gate, status: flight.status,
    scheduled_departure: flight.scheduledTime, revised_departure: flight.revisedTime,
    estimated_boarding_time: flight.estimatedBoardingTime,
    time_until_boarding_minutes: timeUntilBoarding,
    destination: flight.destination, current_local_time: sinNow.toISOString(),
    urgency: timeUntilBoarding !== null ? (timeUntilBoarding < 30 ? 'high' : timeUntilBoarding < 90 ? 'medium' : 'low') : 'unknown',
    inter_terminal_travel: {
      skytrain: 'T1-T2-T3 connected airside, ~5 min between stops',
      t4_shuttle: 'T4 requires shuttle bus from T2, ~10 min',
      jewel: 'Connected to T1 landside. Must clear immigration from airside.',
    },
  }, null, 2);
}

async function handleGetRecommendations(args: any) {
  const supabase = getSupabase();
  let query = supabase.from('amenity_detail')
    .select('id, name, amenity_slug, description, terminal_code, vibe_tags, price_level, opening_hours, available_in_tr, booking_required, editorial_note, editorial_score, route_context')
    .eq('airport_code', 'SIN');

  if (args.vibe) query = query.ilike('vibe_tags', `%${args.vibe}%`);
  if (args.terminal && args.time_until_boarding_minutes !== undefined && args.time_until_boarding_minutes < 30) {
    query = query.eq('terminal_code', args.terminal);
  }
  if (args.exclude_jewel || (args.time_until_boarding_minutes !== undefined && args.time_until_boarding_minutes < 120)) {
    query = query.neq('terminal_code', 'SIN-JEWEL');
  }

  const resultLimit = Math.min(args.limit || 7, 12);
  const { data: amenities, error } = await query.limit(resultLimit * 3);

  if (error || !amenities?.length) {
    return JSON.stringify({ recommendations: [], message: 'No matching amenities found.', total_available: 0 });
  }

  const scored = amenities.map((a: any) => {
    let score = 50;
    if (args.terminal && a.terminal_code === args.terminal) score += 30;
    if (args.terminal && a.terminal_code !== args.terminal && a.terminal_code !== 'SIN-JEWEL') score += 10;
    if (a.terminal_code === 'SIN-JEWEL') score += (args.time_until_boarding_minutes && args.time_until_boarding_minutes > 240) ? 20 : -10;
    if (args.vibe && a.vibe_tags?.toLowerCase().includes(args.vibe.toLowerCase())) score += 20;
    if (a.available_in_tr) score += 5;
    if (a.editorial_score && a.editorial_score >= 12) score += 10;
    else if (a.editorial_score && a.editorial_score >= 10) score += 5;
    return { ...a, _score: score };
  });
  scored.sort((a: any, b: any) => b._score - a._score);

  const recs = scored.slice(0, resultLimit).map((a: any, i: number) => ({
    rank: i + 1, id: a.id, name: a.name, slug: a.amenity_slug,
    terminal: a.terminal_code, vibe_tags: a.vibe_tags, price_level: a.price_level,
    description: a.description?.substring(0, 150),
    editorial_note: a.editorial_note || null,
    editorial_score: a.editorial_score || null,
    route_context: a.route_context || null,
    app_url: `https://terminalplus.app/amenity/${a.amenity_slug}`,
  }));

  // Log
  try {
    await supabase.from('agent_interactions').insert({
      session_id: 'mcp-orchestrator',
      user_message: `get_recommendations: ${JSON.stringify(args)}`,
      agent_response: `Returned ${recs.length} amenities`,
      terminal: args.terminal, vibe_requested: args.vibe,
      amenities_shown: recs.map((r: any) => ({ id: r.id, name: r.name })),
      mode: 'mcp',
    });
  } catch { /* ignore */ }

  return JSON.stringify({ recommendations: recs, total_available: amenities.length, filters_applied: args }, null, 2);
}

async function handleGetDisruptionStatus(args: any) {
  const flightDate = args.date || new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Singapore' });
  const flight = await fetchFlightStatus(args.flight_number, flightDate);

  if (!flight) {
    return JSON.stringify({ flight_number: args.flight_number, status: 'unknown', message: 'Could not retrieve flight status.' });
  }

  const disruptions: any[] = [];
  let suggestedActions: string[] = [];

  if (flight.revisedTime && flight.scheduledTime) {
    const delayMinutes = Math.round((new Date(flight.revisedTime).getTime() - new Date(flight.scheduledTime).getTime()) / 60000);
    if (delayMinutes > 15) {
      disruptions.push({ type: 'delay', severity: delayMinutes > 120 ? 'major' : delayMinutes > 60 ? 'moderate' : 'minor', delay_minutes: delayMinutes });
      suggestedActions.push(delayMinutes > 120 ? 'Consider visiting Jewel — extra time available' : 'Suggest dining options in current terminal');
    }
  }
  if (flight.status?.toLowerCase().includes('cancel')) {
    disruptions.push({ type: 'cancellation', severity: 'critical' });
    suggestedActions = ['Direct passenger to airline service desk immediately'];
  }

  return JSON.stringify({
    flight_number: flight.flightNumber, status: flight.status,
    disruptions: disruptions.length > 0 ? disruptions : null,
    has_disruption: disruptions.length > 0,
    gate: { gate: flight.gate, terminal: flight.terminal },
    suggested_actions: suggestedActions.length > 0 ? suggestedActions : ['No disruptions detected.'],
    checked_at: new Date().toISOString(),
  }, null, 2);
}

// ---------- Route handler ----------

async function handleGetRoute(args: any) {
  const supabase = getSupabase();
  const depTerminal = args.departure_terminal || args.arrival_terminal;
  const timeBudget: number = args.time_budget_minutes;

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

  // 2. Use shared queryRouteMatch for terminal+time matching (same logic as chat agent)
  const routeMatch = flightMatch
    ? null // skip if flight match already found
    : await queryRouteMatch(supabase, args.arrival_terminal, timeBudget);

  // 3. If flight match found, fetch stops using same pattern as queryRouteMatch
  if (flightMatch) {
    const { data: rawStops } = await supabase
      .from('route_stops')
      .select('stop_order, name, amenity_slug, stop_type, duration_minutes, editorial_note, is_optional, area')
      .eq('route_template_id', flightMatch.id)
      .order('stop_order', { ascending: true });

    let stops = rawStops || [];

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

    try {
      await supabase.from('agent_interactions').insert({
        session_id: 'mcp-route',
        user_message: JSON.stringify({ tool: 'get_route', flight_number: args.flight_number, arrival_terminal: args.arrival_terminal, time_budget_minutes: timeBudget }),
        agent_response: `curated:${flightMatch.route_id}:${stops.length} stops`,
        terminal: args.arrival_terminal, mode: 'mcp',
      });
    } catch { /* non-critical */ }

    return JSON.stringify({
      route_type: 'curated',
      route_id: flightMatch.route_id,
      route_name: flightMatch.name,
      description: flightMatch.description,
      arrival_terminal: flightMatch.arrival_terminal,
      departure_terminal: flightMatch.departure_terminal,
      total_minutes: totalTime,
      gate_buffer_minutes: 15,
      time_budget_minutes: timeBudget,
      is_time_tight: isTimeTight,
      stops: stops.map((s: any) => ({
        order: s.stop_order, type: s.stop_type, name: s.name,
        area: s.area, duration_minutes: s.duration_minutes,
        editorial_note: s.editorial_note, is_optional: s.is_optional,
        amenity_slug: s.amenity_slug,
      })),
      constraints: flightMatch.key_constraints,
    }, null, 2);
  }

  // 4. If queryRouteMatch found a curated template, format for MCP response
  if (routeMatch) {
    try {
      await supabase.from('agent_interactions').insert({
        session_id: 'mcp-route',
        user_message: JSON.stringify({ tool: 'get_route', arrival_terminal: args.arrival_terminal, time_budget_minutes: timeBudget }),
        agent_response: `curated:${routeMatch.templateName}:${routeMatch.stops.length} stops`,
        terminal: args.arrival_terminal, mode: 'mcp',
      });
    } catch { /* non-critical */ }

    return JSON.stringify({
      route_type: 'curated',
      route_name: routeMatch.templateName,
      description: routeMatch.templateDescription,
      arrival_terminal: routeMatch.arrivalTerminal,
      departure_terminal: routeMatch.departureTerminal,
      total_minutes: routeMatch.totalDurationMinutes,
      gate_buffer_minutes: routeMatch.gateBufferMinutes,
      time_budget_minutes: timeBudget,
      is_time_tight: routeMatch.isTimeTight,
      stops: routeMatch.stops.map((s) => ({
        order: s.order, type: s.stopType, name: s.name,
        area: s.terminalCode, duration_minutes: s.durationMinutes,
        editorial_note: s.editorialNote, is_optional: s.isOptional,
        amenity_slug: s.amenitySlug,
      })),
    }, null, 2);
  }

  // 5. Dynamic fallback from top editorial-scored amenities
  const terminals = args.arrival_terminal === depTerminal
    ? [args.arrival_terminal]
    : [args.arrival_terminal, depTerminal];

  let query = supabase
    .from('amenity_detail')
    .select('amenity_slug, name, terminal_code, vibe_tags, editorial_note, editorial_score, route_context, price_level')
    .eq('airport_code', 'SIN')
    .in('terminal_code', terminals)
    .not('editorial_note', 'is', null)
    .order('editorial_score', { ascending: false })
    .limit(20);

  if (args.vibe) {
    query = query.ilike('vibe_tags', `%${args.vibe}%`);
  }

  const { data: amenities } = await query;

  if (!amenities || amenities.length === 0) {
    return JSON.stringify({
      route_type: 'dynamic',
      message: 'No amenities with editorial recommendations found for these terminals. Try get_recommendations for a broader search.',
      arrival_terminal: args.arrival_terminal,
      departure_terminal: depTerminal,
    }, null, 2);
  }

  const stopDurations: Record<string, number> = { food: 15, attraction: 10, shopping: 12, lounge: 30, default: 10 };
  const dynamicStops: any[] = [];
  let remainingMinutes = timeBudget - 15; // reserve 15 min gate buffer

  for (const amenity of amenities) {
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
        editorial_note: amenity.editorial_note, amenity_slug: amenity.amenity_slug,
        editorial_score: amenity.editorial_score,
      });
      remainingMinutes -= (duration + 5);
    }
  }

  dynamicStops.push({
    order: dynamicStops.length + 1, type: 'buffer',
    name: 'Walk to gate + security', area: depTerminal,
    duration_minutes: 15,
    editorial_note: 'Gate security at Changi is per-gate. No priority lane. Do not cut this short.',
  });

  const totalTime = dynamicStops.reduce((sum: number, s: any) => sum + s.duration_minutes, 0);

  try {
    await supabase.from('agent_interactions').insert({
      session_id: 'mcp-route',
      user_message: JSON.stringify({ tool: 'get_route', arrival_terminal: args.arrival_terminal, time_budget_minutes: timeBudget, vibe: args.vibe }),
      agent_response: `dynamic:${dynamicStops.length} stops`,
      terminal: args.arrival_terminal, mode: 'mcp',
    });
  } catch { /* non-critical */ }

  return JSON.stringify({
    route_type: 'dynamic',
    description: `Dynamically composed route based on highest-rated amenities in ${terminals.join(' + ')}`,
    arrival_terminal: args.arrival_terminal,
    departure_terminal: depTerminal,
    total_minutes: totalTime,
    gate_buffer_minutes: 15,
    time_budget_minutes: timeBudget,
    stops: dynamicStops,
    note: 'This route was composed dynamically from editorial-scored amenities. Curated routes are available for known flight patterns.',
  }, null, 2);
}

// ---------- MCP JSON-RPC Handler ----------

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');

  if (req.method === 'OPTIONS') return res.status(204).end();

  // GET — return server info
  if (req.method === 'GET') {
    return res.status(200).json({
      name: 'terminal-plus',
      version: '1.0.0',
      protocolVersion: '2025-03-26',
      capabilities: { tools: {} },
    });
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { jsonrpc, id, method, params } = req.body || {};

  if (jsonrpc !== '2.0') {
    return res.status(400).json({ jsonrpc: '2.0', id, error: { code: -32600, message: 'Invalid request: missing jsonrpc 2.0' } });
  }

  try {
    switch (method) {
      case 'initialize':
        return res.status(200).json({
          jsonrpc: '2.0', id,
          result: {
            protocolVersion: '2025-03-26',
            capabilities: { tools: { listChanged: false } },
            serverInfo: { name: 'terminal-plus', version: '1.0.0' },
          },
        });

      case 'tools/list':
        return res.status(200).json({ jsonrpc: '2.0', id, result: { tools: TOOLS } });

      case 'tools/call': {
        const toolName = params?.name;
        const toolArgs = params?.arguments || {};
        let resultText: string;

        switch (toolName) {
          case 'get_airport_context':
            resultText = await handleGetAirportContext(toolArgs);
            break;
          case 'get_recommendations':
            resultText = await handleGetRecommendations(toolArgs);
            break;
          case 'get_disruption_status':
            resultText = await handleGetDisruptionStatus(toolArgs);
            break;
          case 'get_route':
            resultText = await handleGetRoute(toolArgs);
            break;
          default:
            return res.status(200).json({
              jsonrpc: '2.0', id,
              error: { code: -32601, message: `Unknown tool: ${toolName}` },
            });
        }

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
