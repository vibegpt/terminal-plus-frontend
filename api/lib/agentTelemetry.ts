// api/lib/agentTelemetry.ts
// Centralized agent_interactions logging for MCP tool calls.
// Replaces the per-handler inserts that wrote constant session ids.
// Called from api/mcp.ts tools/call dispatch — one row per tool call,
// whatever the tool or outcome. Never throws (telemetry must not break
// tool responses); await it so the serverless runtime doesn't freeze
// the insert mid-flight.

import type { SupabaseClient } from '@supabase/supabase-js';

// Union of the four tools' input-schema properties (api/mcp.ts TOOLS).
// Args are whitelisted against this before storage.
const KNOWN_ARG_KEYS = new Set([
  'flight_number', 'date',
  'terminal', 'vibe', 'time_until_boarding_minutes', 'gate', 'exclude_jewel', 'limit',
  'arrival_terminal', 'departure_terminal', 'time_budget_minutes',
]);

const MAX_ARG_STRING = 100;

function sanitizeArgs(args: Record<string, unknown>): Record<string, unknown> {
  const clean: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(args || {})) {
    if (!KNOWN_ARG_KEYS.has(k)) continue;
    clean[k] = typeof v === 'string' ? v.slice(0, MAX_ARG_STRING) : v;
  }
  return clean;
}

interface ExtractedResults {
  resultSlugs: string[] | null;          // top-3 amenity slugs returned
  routeId: string | null;                // curated route id when present
  amenitiesShown: Array<{ id: unknown; name: unknown }> | null; // legacy shape
  summary: string;                       // legacy-compatible agent_response
}

function extractResults(toolName: string, resultText: string): ExtractedResults {
  const out: ExtractedResults = { resultSlugs: null, routeId: null, amenitiesShown: null, summary: toolName };
  let parsed: any;
  try {
    parsed = JSON.parse(resultText);
  } catch {
    out.summary = `${toolName}: unparseable result`;
    return out;
  }

  switch (toolName) {
    case 'get_recommendations': {
      const recs: any[] = Array.isArray(parsed.recommendations) ? parsed.recommendations : [];
      out.resultSlugs = recs.slice(0, 3).map(r => r.slug).filter(Boolean);
      out.amenitiesShown = recs.map(r => ({ id: r.id, name: r.name }));
      out.summary = `Returned ${recs.length} amenities`;
      break;
    }
    case 'get_route': {
      const stops: any[] = Array.isArray(parsed.stops) ? parsed.stops : [];
      out.routeId = parsed.route_id ?? null;
      out.resultSlugs = stops.map(s => s.amenity_slug).filter(Boolean).slice(0, 3);
      out.summary = parsed.route_type === 'curated'
        ? `curated:${parsed.route_id ?? parsed.route_name ?? '?'}:${stops.length} stops`
        : `dynamic:${stops.length} stops`;
      break;
    }
    case 'get_airport_context':
      out.summary = parsed.error
        ? `error:${parsed.error}`
        : `${parsed.terminal ?? '?'} urgency:${parsed.urgency ?? '?'}`;
      break;
    case 'get_disruption_status':
      out.summary = `${parsed.status ?? 'unknown'} has_disruption:${parsed.has_disruption ?? '?'}`;
      break;
  }
  return out;
}

export interface ToolCallLog {
  toolName: string;
  args: Record<string, unknown>;
  resultText: string;
  sessionId: string;
  mcpSessionKey: string | null;
  latencyMs: number;
}

export async function logToolCall(supabase: SupabaseClient, call: ToolCallLog): Promise<void> {
  try {
    const args = sanitizeArgs(call.args);
    const { resultSlugs, routeId, amenitiesShown, summary } = extractResults(call.toolName, call.resultText);

    await supabase.from('agent_interactions').insert({
      session_id: call.sessionId,
      mcp_session_key: call.mcpSessionKey,
      tool_name: call.toolName,
      latency_ms: call.latencyMs,
      user_message: JSON.stringify({ tool: call.toolName, args }),
      agent_response: summary,
      terminal: (args.terminal as string) ?? (args.arrival_terminal as string) ?? null,
      vibe_requested: (args.vibe as string) ?? null,
      amenities_shown: amenitiesShown,
      result_slugs: resultSlugs,
      route_id: routeId,
      mode: 'mcp',
    });
  } catch { /* telemetry must never break tool responses */ }
}
