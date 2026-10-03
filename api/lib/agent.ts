/**
 * Terminal+ Agent — core logic shared between api/chat.ts and future MCP server.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

// ---------- Types ----------

export interface AgentContext {
  terminal: string | null;
  gate: string | null;
  boardingTime: string | null;
  flightNumber: string | null;
  destination: string | null;
  selectedVibe: string | null;
}

export interface AmenityRow {
  id: number;
  name: string;
  amenity_slug: string;
  description: string | null;
  terminal_code: string;
  vibe_tags: string | null;
  price_level: string | null;
  opening_hours: Record<string, string> | null;
  available_in_tr: boolean | null;
  booking_required: boolean | null;
  gate_location: string | null;
  zone: string | null;
  editorial_note: string | null;
  editorial_score: number | null;
  route_context: string | null;
}

// ---------- Route matching types ----------

export interface RouteStop {
  order: number;
  name: string;
  amenitySlug: string;
  terminalCode: string;
  stopType: string;
  durationMinutes: number;
  isOptional: boolean;
  editorialNote: string;
}

export interface RouteMatch {
  templateName: string;
  templateDescription: string;
  arrivalTerminal: string;
  departureTerminal: string;
  stops: RouteStop[];
  totalDurationMinutes: number;
  gateBufferMinutes: number;
  isTimeTight: boolean;
}

// ---------- Supabase query ----------

export async function queryAmenities(
  supabase: SupabaseClient,
  ctx: AgentContext,
): Promise<AmenityRow[]> {
  let query = supabase
    .from('amenity_detail')
    .select('id, name, amenity_slug, description, terminal_code, vibe_tags, price_level, opening_hours, available_in_tr, booking_required, gate_location, zone, editorial_note, editorial_score, route_context')
    .eq('airport_code', 'SIN')
    .order('editorial_score', { ascending: false, nullsFirst: false });

  // Vibe filter
  if (ctx.selectedVibe) {
    query = query.ilike('vibe_tags', `%${ctx.selectedVibe}%`);
  }

  const { data, error } = await query.limit(50);
  if (error) throw error;

  let results = data || [];

  // Sort: user's terminal first, then others (stable within score tiers)
  if (ctx.terminal) {
    results.sort((a: AmenityRow, b: AmenityRow) => {
      const aMatch = a.terminal_code === ctx.terminal ? 0 : 1;
      const bMatch = b.terminal_code === ctx.terminal ? 0 : 1;
      return aMatch - bMatch;
    });
  }

  return results.slice(0, 21) as AmenityRow[];
}

// ---------- Route matching ----------

const GATE_BUFFER_MINUTES = 15;

export async function queryRouteMatch(
  supabase: SupabaseClient,
  terminal: string | null,
  timeMinutes: number | null,
): Promise<RouteMatch | null> {
  if (!terminal || !timeMinutes) return null;

  // Find active templates where user's terminal matches arrival or departure
  // and time falls within the template's range
  const { data: templates, error: tErr } = await supabase
    .from('route_templates')
    .select('*')
    .eq('is_active', true)
    .lte('min_minutes', timeMinutes)
    .gte('max_minutes', timeMinutes)
    .or(`arrival_terminal.eq.${terminal},departure_terminal.eq.${terminal}`);

  if (tErr || !templates || templates.length === 0) return null;

  // Pick best fit: closest midpoint to actual time
  const best = templates.reduce((a: any, b: any) => {
    const aMid = (a.min_minutes + a.max_minutes) / 2;
    const bMid = (b.min_minutes + b.max_minutes) / 2;
    return Math.abs(aMid - timeMinutes) <= Math.abs(bMid - timeMinutes) ? a : b;
  });

  // Fetch stops for matched template, joined to amenity_detail for terminal_code
  const { data: rawStops, error: sErr } = await supabase
    .from('route_stops')
    .select('stop_order, name, amenity_slug, stop_type, duration_minutes, editorial_note, is_optional, area')
    .eq('route_template_id', best.id)
    .order('stop_order', { ascending: true });

  if (sErr || !rawStops || rawStops.length === 0) return null;

  // Look up terminal_code for each stop via amenity_detail
  const slugs = rawStops.map((s: any) => s.amenity_slug).filter(Boolean);
  let amenityTerminals: Record<string, string> = {};
  if (slugs.length > 0) {
    const { data: amenities } = await supabase
      .from('amenity_detail')
      .select('amenity_slug, terminal_code')
      .in('amenity_slug', slugs);
    if (amenities) {
      for (const a of amenities) {
        amenityTerminals[a.amenity_slug] = a.terminal_code;
      }
    }
  }

  // Build stops with terminal codes
  let stops: RouteStop[] = rawStops.map((s: any) => ({
    order: s.stop_order,
    name: s.name,
    amenitySlug: s.amenity_slug || '',
    terminalCode: amenityTerminals[s.amenity_slug] || s.area || terminal,
    stopType: s.stop_type,
    durationMinutes: s.duration_minutes,
    isOptional: s.is_optional ?? false,
    editorialNote: s.editorial_note || '',
  }));

  // Time-tight logic: strip optional stops if needed
  const isTimeTight = timeMinutes < best.min_minutes + 15;
  if (isTimeTight) {
    stops = stops.filter((s) => !s.isOptional);
  }

  // Progressive strip: if total + buffer exceeds available time, remove optionals from end
  let totalDuration = stops.reduce((sum, s) => sum + s.durationMinutes, 0);
  while (totalDuration + GATE_BUFFER_MINUTES > timeMinutes && stops.some((s) => s.isOptional)) {
    // Find last optional stop and remove it
    for (let i = stops.length - 1; i >= 0; i--) {
      if (stops[i].isOptional) {
        stops.splice(i, 1);
        break;
      }
    }
    totalDuration = stops.reduce((sum, s) => sum + s.durationMinutes, 0);
  }

  return {
    templateName: best.name,
    templateDescription: best.description || '',
    arrivalTerminal: best.arrival_terminal,
    departureTerminal: best.departure_terminal,
    stops,
    totalDurationMinutes: totalDuration,
    gateBufferMinutes: GATE_BUFFER_MINUTES,
    isTimeTight,
  };
}
