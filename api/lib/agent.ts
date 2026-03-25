/**
 * Terminal+ Agent — core logic shared between api/chat.ts and future MCP server.
 */

import type Anthropic from '@anthropic-ai/sdk';
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
}

export interface AmenityReference {
  id: number;
  name: string;
  amenity_slug: string;
  terminal_code: string;
  vibe_tags: string;
  price_level: string;
}

export interface AgentResponse {
  response: string;
  amenities: AmenityReference[];
  followUp: string | null;
  structured?: Record<string, unknown>;
  context: {
    terminal: string | null;
    timeUntilBoarding: number | null;
    totalResults: number;
  };
}

// ---------- Derived context ----------

export function calculateDerivedContext(ctx: AgentContext) {
  const now = new Date();
  const currentLocalTime = now.toLocaleString('en-SG', {
    timeZone: 'Asia/Singapore',
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  let timeUntilBoarding: number | null = null;
  if (ctx.boardingTime) {
    const boardingDate = new Date(ctx.boardingTime);
    if (!isNaN(boardingDate.getTime())) {
      timeUntilBoarding = Math.round((boardingDate.getTime() - now.getTime()) / 60000);
      if (timeUntilBoarding < 0) timeUntilBoarding = 0;
    }
  }

  return { currentLocalTime, timeUntilBoarding };
}

// ---------- Supabase query ----------

export async function queryAmenities(
  supabase: SupabaseClient,
  ctx: AgentContext,
): Promise<AmenityRow[]> {
  let query = supabase
    .from('amenity_detail')
    .select('id, name, amenity_slug, description, terminal_code, vibe_tags, price_level, opening_hours, available_in_tr, booking_required, gate_location, zone')
    .eq('airport_code', 'SIN');

  // Vibe filter
  if (ctx.selectedVibe) {
    query = query.ilike('vibe_tags', `%${ctx.selectedVibe}%`);
  }

  // Terminal ordering: prioritise user's terminal but include others
  if (ctx.terminal) {
    // Supabase doesn't support ORDER BY CASE, so we fetch all and sort client-side
  }

  const { data, error } = await query.limit(50);
  if (error) throw error;

  let results = data || [];

  // Sort: user's terminal first, then others
  if (ctx.terminal) {
    results.sort((a: AmenityRow, b: AmenityRow) => {
      const aMatch = a.terminal_code === ctx.terminal ? 0 : 1;
      const bMatch = b.terminal_code === ctx.terminal ? 0 : 1;
      return aMatch - bMatch;
    });
  }

  return results.slice(0, 21) as AmenityRow[];
}

// ---------- Context message builder ----------

export function buildContextMessage(
  ctx: AgentContext,
  derived: { currentLocalTime: string; timeUntilBoarding: number | null },
  amenities: AmenityRow[],
): string {
  const parts: string[] = [
    '[CONTEXT — not visible to user]',
  ];

  if (ctx.terminal) parts.push(`Terminal: ${ctx.terminal}`);
  if (ctx.gate) parts.push(`Gate: ${ctx.gate}`);
  if (derived.timeUntilBoarding !== null) {
    parts.push(`Time until boarding: ${derived.timeUntilBoarding} minutes`);
  }
  parts.push(`Local time (Singapore): ${derived.currentLocalTime}`);
  if (ctx.selectedVibe) parts.push(`Selected vibe: ${ctx.selectedVibe}`);
  if (ctx.flightNumber) parts.push(`Flight: ${ctx.flightNumber}`);
  if (ctx.destination) parts.push(`Destination: ${ctx.destination}`);

  const amenityContext = amenities.map((a) => ({
    slug: a.amenity_slug,
    name: a.name,
    terminal: a.terminal_code,
    description: (a.description || '').slice(0, 120),
    vibe_tags: a.vibe_tags,
    opening_hours: a.opening_hours,
    price_level: a.price_level,
    available_in_transit: a.available_in_tr,
  }));

  parts.push('');
  parts.push(`Matching amenities from database (${amenityContext.length} results):`);
  parts.push(JSON.stringify(amenityContext));

  return parts.join('\n');
}

// ---------- Claude call ----------

export async function callClaude(
  anthropic: Anthropic,
  systemPrompt: string,
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  maxTokens = 1000,
): Promise<string> {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: maxTokens,
    system: systemPrompt,
    messages,
  });

  return response.content[0].type === 'text' ? response.content[0].text : '';
}

// ---------- Response parser ----------

export function parseResponse(
  responseText: string,
  amenities: AmenityRow[],
  mode: 'conversational' | 'structured' = 'conversational',
): AgentResponse {
  let message = responseText;
  let recommendedSlugs: string[] = [];
  let followUp: string | null = null;
  let structured: Record<string, unknown> | undefined;

  // Try to parse the JSON response (Claude returns JSON per system prompt)
  try {
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      message = parsed.message || responseText;
      recommendedSlugs = parsed.recommended_slugs || [];
      followUp = parsed.follow_up || null;
    }
  } catch {
    // If JSON parse fails, use the raw text
  }

  // Structured mode: extract <json> block
  if (mode === 'structured') {
    const jsonBlockMatch = responseText.match(/<json>([\s\S]*?)<\/json>/);
    if (jsonBlockMatch) {
      try {
        structured = JSON.parse(jsonBlockMatch[1]);
        // Remove the <json> block from the message
        message = message.replace(/<json>[\s\S]*?<\/json>/, '').trim();
      } catch { /* ignore parse errors */ }
    }
  }

  // Match slugs to full amenity objects
  const matchedAmenities: AmenityReference[] = recommendedSlugs
    .map((slug: string) => {
      const found = amenities.find((a) => a.amenity_slug === slug);
      if (!found) return null;
      return {
        id: found.id,
        name: found.name,
        amenity_slug: found.amenity_slug,
        terminal_code: found.terminal_code,
        vibe_tags: found.vibe_tags || '',
        price_level: found.price_level || '',
      };
    })
    .filter(Boolean) as AmenityReference[];

  return {
    response: message,
    amenities: matchedAmenities,
    followUp,
    structured,
    context: {
      terminal: null, // filled by handler
      timeUntilBoarding: null,
      totalResults: amenities.length,
    },
  };
}
