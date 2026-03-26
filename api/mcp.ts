import { createMcpHandler } from '@vercel/mcp-adapter';
import { z } from 'zod';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

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
  if (!_supabase) {
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
    let url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;

    if (!url && key) {
      try {
        const payload = JSON.parse(Buffer.from(key.split('.')[1], 'base64').toString());
        if (payload.ref) url = `https://${payload.ref}.supabase.co`;
      } catch { /* ignore */ }
    }

    if (!url || !key) throw new Error('Missing Supabase env vars');
    _supabase = createClient(url, key);
  }
  return _supabase;
}

// ---------- Logging helper ----------

async function logMcpInteraction(
  toolName: string,
  args: Record<string, unknown>,
  resultSummary: string,
  terminal?: string | null,
  vibe?: string | null,
  amenities?: Array<{ id: number; name: string }>,
) {
  try {
    await getSupabase().from('agent_interactions').insert({
      session_id: 'mcp-orchestrator',
      user_message: `${toolName}: ${JSON.stringify(args)}`,
      agent_response: resultSummary,
      terminal: terminal || null,
      vibe_requested: vibe || null,
      amenities_shown: amenities || null,
      mode: 'mcp',
    });
  } catch (e) {
    console.error('MCP logging error:', e);
  }
}

// ---------- Flight status helper ----------

async function fetchFlightStatus(flightNumber: string, date: string) {
  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:3000';

  try {
    const res = await fetch(
      `${baseUrl}/api/flight-status?number=${encodeURIComponent(flightNumber)}&date=${date}`,
    );
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// ---------- MCP Server ----------

const handler = createMcpHandler(
  (server) => {
    // ====== Tool 1: get_airport_context ======
    server.tool(
      'get_airport_context',
      'Get current airport context for a passenger at Singapore Changi Airport (SIN). Returns terminal, gate, time until boarding, and transit status. Call this first before get_recommendations.',
      {
        flight_number: z.string().describe('IATA flight number, e.g. SQ321, TR123, 3K691'),
        date: z.string().optional().describe('Flight date YYYY-MM-DD. Defaults to today Singapore time.'),
      },
      async ({ flight_number, date }) => {
        const flightDate = date || new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Singapore' });
        const flight = await fetchFlightStatus(flight_number, flightDate);

        if (!flight) {
          const errorResult = {
            error: 'flight_not_found',
            message: `Could not find flight ${flight_number}. Check the flight number and date. The flight status API may not be available.`,
            coverage: 'Terminal+ currently covers Singapore Changi Airport (SIN) only.',
            fallback: 'You can still call get_recommendations with a terminal code (SIN-T1 through SIN-T4, SIN-JEWEL) to get amenity suggestions.',
          };

          await logMcpInteraction('get_airport_context', { flight_number, date: flightDate }, 'flight_not_found');

          return {
            content: [{ type: 'text' as const, text: JSON.stringify(errorResult, null, 2) }],
          };
        }

        const now = new Date();
        const sinNow = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Singapore' }));
        let timeUntilBoarding: number | null = null;

        if (flight.estimatedBoardingTime) {
          const boarding = new Date(flight.estimatedBoardingTime);
          timeUntilBoarding = Math.round((boarding.getTime() - sinNow.getTime()) / 60000);
        }

        const terminalCode = flight.terminal ? `SIN-T${flight.terminal}` : null;

        const context = {
          airport: 'SIN',
          airport_name: 'Singapore Changi Airport',
          flight_number: flight.flightNumber,
          airline: flight.airline,
          terminal: terminalCode,
          gate: flight.gate,
          status: flight.status,
          scheduled_departure: flight.scheduledTime,
          revised_departure: flight.revisedTime,
          estimated_boarding_time: flight.estimatedBoardingTime,
          time_until_boarding_minutes: timeUntilBoarding,
          destination: flight.destination,
          current_local_time: sinNow.toISOString(),
          is_departing_from_sin: flight.isDepartingFromSIN,
          transit_status: 'airside',
          coverage_zones: ['SIN-T1', 'SIN-T2', 'SIN-T3', 'SIN-T4', 'SIN-JEWEL'],
          jewel_accessible: timeUntilBoarding === null || timeUntilBoarding > 120,
          urgency: timeUntilBoarding !== null
            ? (timeUntilBoarding < 30 ? 'high' : timeUntilBoarding < 90 ? 'medium' : 'low')
            : 'unknown',
          inter_terminal_travel: {
            skytrain: 'T1 ↔ T2 ↔ T3 connected airside, ~5 min between stops',
            t4_shuttle: 'T4 requires shuttle bus from T2, ~10 min',
            jewel: 'Connected to T1 landside. Must clear immigration from airside.',
          },
        };

        await logMcpInteraction(
          'get_airport_context',
          { flight_number, date: flightDate },
          `Found: ${flight.flightNumber} at ${terminalCode || 'unknown terminal'}`,
          terminalCode,
        );

        return {
          content: [{ type: 'text' as const, text: JSON.stringify(context, null, 2) }],
        };
      },
    );

    // ====== Tool 2: get_recommendations ======
    server.tool(
      'get_recommendations',
      'Get personalized amenity recommendations at Singapore Changi Airport. Returns up to 7 amenities scored by relevance to the passenger\'s terminal, time until boarding, and vibe preference. Call get_airport_context first to get the context fields.',
      {
        terminal: z.string().optional().describe('Terminal code, e.g. SIN-T1, SIN-T2, SIN-T3, SIN-T4, SIN-JEWEL'),
        vibe: z.enum(['explore', 'refuel', 'comfort', 'chill', 'work', 'shop', 'quick']).optional()
          .describe('Mood/intent filter. explore=discover, refuel=eat/drink, comfort=rest/lounge, chill=relax, work=productivity, shop=shopping, quick=fast options'),
        time_until_boarding_minutes: z.number().optional()
          .describe('Minutes until boarding. Affects urgency filtering and Jewel eligibility.'),
        gate: z.string().optional().describe('Gate code, e.g. C22, B4. Used for proximity scoring.'),
        exclude_jewel: z.boolean().optional().default(false)
          .describe('Set true if passenger cannot access Jewel.'),
        limit: z.number().optional().default(7).describe('Number of recommendations. Default 7, max 12.'),
      },
      async ({ terminal, vibe, time_until_boarding_minutes, gate, exclude_jewel, limit }) => {
        const supabase = getSupabase();

        let query = supabase
          .from('amenity_detail')
          .select('id, name, amenity_slug, description, terminal_code, vibe_tags, price_level, opening_hours, available_in_tr, booking_required')
          .eq('airport_code', 'SIN');

        // Vibe filter
        if (vibe) {
          query = query.ilike('vibe_tags', `%${vibe}%`);
        }

        // High urgency: restrict to terminal
        if (terminal && time_until_boarding_minutes !== undefined && time_until_boarding_minutes < 30) {
          query = query.eq('terminal_code', terminal);
        }

        // Jewel exclusion
        if (exclude_jewel || (time_until_boarding_minutes !== undefined && time_until_boarding_minutes < 120)) {
          query = query.neq('terminal_code', 'SIN-JEWEL');
        }

        const resultLimit = Math.min(limit || 7, 12);
        query = query.limit(resultLimit * 3);

        const { data: amenities, error } = await query;

        if (error || !amenities || amenities.length === 0) {
          return {
            content: [{
              type: 'text' as const,
              text: JSON.stringify({
                recommendations: [],
                message: vibe
                  ? `No ${vibe} amenities found${terminal ? ` in ${terminal}` : ''} right now.`
                  : 'No matching amenities found. Try broadening your search.',
                total_available: 0,
              }),
            }],
          };
        }

        // Score and rank
        const scored = amenities.map((a: Record<string, unknown>) => {
          let score = 50;

          if (terminal && a.terminal_code === terminal) score += 30;
          if (terminal && a.terminal_code !== terminal && a.terminal_code !== 'SIN-JEWEL') score += 10;
          if (a.terminal_code === 'SIN-JEWEL') {
            score += (time_until_boarding_minutes && time_until_boarding_minutes > 240) ? 20 : -10;
          }

          if (vibe && typeof a.vibe_tags === 'string') {
            const tags = a.vibe_tags.toLowerCase().split(',').map((t: string) => t.trim());
            if (tags.includes(vibe.toLowerCase())) score += 20;
          }

          if (a.available_in_tr) score += 5;

          return { ...a, _score: score };
        });

        scored.sort((a: { _score: number }, b: { _score: number }) => b._score - a._score);
        const top = scored.slice(0, resultLimit);

        const recommendations = top.map((a: Record<string, unknown>, i: number) => ({
          rank: i + 1,
          id: a.id,
          name: a.name,
          slug: a.amenity_slug,
          terminal: a.terminal_code,
          vibe_tags: a.vibe_tags,
          price_level: a.price_level,
          opening_hours: a.opening_hours,
          transit_accessible: a.available_in_tr,
          booking_required: a.booking_required,
          description: typeof a.description === 'string' ? a.description.substring(0, 150) : null,
          relevance_score: a._score,
          app_url: `https://terminalplus.app/amenity/${a.amenity_slug}`,
          jewel_warning: a.terminal_code === 'SIN-JEWEL'
            ? 'Jewel is landside. Transit passengers must clear immigration and re-enter security.'
            : null,
        }));

        // Log interaction (fire-and-forget)
        await logMcpInteraction(
          'get_recommendations',
          { terminal, vibe, time_until_boarding_minutes, limit: resultLimit },
          `Returned ${recommendations.length} amenities`,
          terminal,
          vibe,
          recommendations.map((r: { id: number; name: string }) => ({ id: r.id, name: r.name as string })),
        );

        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              recommendations,
              total_available: amenities.length,
              filters_applied: { terminal, vibe, exclude_jewel, time_until_boarding_minutes },
              coverage: 'Singapore Changi Airport (SIN): T1, T2, T3, T4, Jewel',
            }, null, 2),
          }],
        };
      },
    );

    // ====== Tool 3: get_disruption_status ======
    server.tool(
      'get_disruption_status',
      'Check flight disruption status at Singapore Changi Airport. Returns delay info, gate changes, and suggested actions. Useful for proactive passenger alerts.',
      {
        flight_number: z.string().describe('IATA flight number, e.g. SQ321'),
        date: z.string().optional().describe('Flight date YYYY-MM-DD. Defaults to today Singapore time.'),
      },
      async ({ flight_number, date }) => {
        const flightDate = date || new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Singapore' });
        const flight = await fetchFlightStatus(flight_number, flightDate);

        if (!flight) {
          const result = {
            flight_number,
            status: 'unknown',
            message: 'Could not retrieve flight status. The flight may not be in our system or the flight status API is unavailable.',
          };

          await logMcpInteraction('get_disruption_status', { flight_number, date: flightDate }, 'flight_not_found');

          return {
            content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
          };
        }

        // Detect disruptions
        const disruptions: Array<Record<string, unknown>> = [];
        let suggestedActions: string[] = [];

        if (flight.revisedTime && flight.scheduledTime) {
          const scheduled = new Date(flight.scheduledTime);
          const revised = new Date(flight.revisedTime);
          const delayMinutes = Math.round((revised.getTime() - scheduled.getTime()) / 60000);

          if (delayMinutes > 15) {
            disruptions.push({
              type: 'delay',
              severity: delayMinutes > 120 ? 'major' : delayMinutes > 60 ? 'moderate' : 'minor',
              delay_minutes: delayMinutes,
              original_time: flight.scheduledTime,
              revised_time: flight.revisedTime,
            });

            if (delayMinutes > 120) {
              suggestedActions.push('Consider visiting Jewel Changi — passenger has extra time');
              suggestedActions.push('Suggest comfortable lounge options for extended wait');
            } else if (delayMinutes > 60) {
              suggestedActions.push('Suggest dining or relaxation options in current terminal');
            } else {
              suggestedActions.push('Minor delay — no action needed, passenger can continue as planned');
            }
          }
        }

        if (flight.status && flight.status.toLowerCase().includes('cancel')) {
          disruptions.push({
            type: 'cancellation',
            severity: 'critical',
            message: 'Flight appears to be cancelled',
          });
          suggestedActions = ['Direct passenger to airline service desk immediately'];
        }

        const result = {
          flight_number: flight.flightNumber,
          status: flight.status,
          disruptions: disruptions.length > 0 ? disruptions : null,
          has_disruption: disruptions.length > 0,
          gate: {
            gate: flight.gate || null,
            terminal: flight.terminal ? `SIN-T${flight.terminal}` : null,
          },
          suggested_actions: suggestedActions.length > 0
            ? suggestedActions
            : ['No disruptions detected. Flight appears on schedule.'],
          checked_at: new Date().toISOString(),
        };

        await logMcpInteraction(
          'get_disruption_status',
          { flight_number, date: flightDate },
          `Status: ${flight.status}, disruptions: ${disruptions.length}`,
          flight.terminal ? `SIN-T${flight.terminal}` : null,
        );

        return {
          content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
        };
      },
    );
  },
  {
    name: 'terminal-plus',
    version: '1.0.0',
  },
  {
    streamableHttpEndpoint: '/api/mcp',
    verboseLogs: false,
  },
);

// Vercel serverless functions use (req, res) format, not Web API.
// Wrap the adapter's Web API handler for compatibility.
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function mcpHandler(req: VercelRequest, res: VercelResponse) {
  // Build a Web API Request from the Vercel request
  const protocol = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost';
  const url = `${protocol}://${host}${req.url}`;

  const webReq = new Request(url, {
    method: req.method || 'GET',
    headers: Object.fromEntries(
      Object.entries(req.headers).filter(([, v]) => typeof v === 'string') as [string, string][],
    ),
    body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined,
  });

  try {
    const webRes = await handler(webReq);

    // Copy status + headers
    res.status(webRes.status);
    webRes.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });

    // Stream body
    const body = await webRes.text();
    res.send(body);
  } catch (err) {
    console.error('MCP handler error:', err);
    res.status(500).json({ error: 'MCP server error' });
  }
}
