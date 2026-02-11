import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// ---------- Load .env.local for vercel dev (not needed in production) ----------
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
    // Strip surrounding quotes
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
} catch { /* .env.local not found in production — that's fine */ }

// ---------- Lazy-init clients (env vars guaranteed at request time) ----------

let _anthropic: Anthropic | null = null;
function getAnthropic() {
  if (!_anthropic) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error('Missing ANTHROPIC_API_KEY env var');
    _anthropic = new Anthropic({ apiKey });
  }
  return _anthropic;
}

let _supabase: ReturnType<typeof createClient> | null = null;
function getSupabase() {
  if (!_supabase) {
    const key =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.VITE_SUPABASE_ANON_KEY;
    let url =
      process.env.SUPABASE_URL ||
      process.env.VITE_SUPABASE_URL;

    // Fallback: extract project ref from the Supabase JWT to build the URL
    if (!url && key) {
      try {
        const payload = JSON.parse(
          Buffer.from(key.split('.')[1], 'base64').toString(),
        );
        if (payload.ref) url = `https://${payload.ref}.supabase.co`;
      } catch { /* ignore parse errors */ }
    }

    if (!url || !key) {
      throw new Error('Missing Supabase env vars (SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY)');
    }
    _supabase = createClient(url, key);
  }
  return _supabase;
}

// ---------- Types ----------

interface ChatRequestBody {
  query: string;
  context?: {
    terminal?: string;
    isTransit?: boolean;
  };
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
}

interface PreFilterResult {
  terminal?: string;
  keywords: string[];
  wantsOpenNow: boolean;
  isTransit: boolean;
  gate?: string;
}

// ---------- Pre-filter (no LLM — pure regex) ----------

const STOP_WORDS = new Set([
  'find', 'me', 'a', 'an', 'the', 'in', 'at', 'near', 'around', 'can', 'i',
  'get', 'some', 'any', 'where', 'is', 'are', 'there', 'what', 'which',
  'show', 'suggest', 'recommend', 'want', 'need', 'looking', 'for', 'to',
  'please', 'do', 'does', 'from', 'with', 'and', 'or', 'my', 'gate',
  'terminal', 'now', 'open', 'currently', 'best', 'good', 'great', 'nice',
  'have', 'has', 'like', 'love', 'really', 'very', 'just', 'also', 'but',
  'not', 'that', 'this', 'its', 'how', 'about', 'near', 'close',
]);

function preFilter(
  query: string,
  context?: ChatRequestBody['context'],
): PreFilterResult {
  const q = query.toLowerCase();

  // Terminal detection
  let terminal: string | undefined = context?.terminal;
  if (!terminal) {
    const tMatch = q.match(/\bt([1-4])\b/);
    if (tMatch) {
      terminal = `SIN-T${tMatch[1]}`;
    } else {
      const termMatch = q.match(/\bterminal\s*([1-4])\b/);
      if (termMatch) terminal = `SIN-T${termMatch[1]}`;
    }
    if (!terminal && /\bjewel\b/i.test(q)) terminal = 'SIN-JEWEL';
  }

  // Gate detection (e.g. "gate C22", "C22")
  const gateMatch = q.match(/\b(?:gate\s*)?([a-f]\d{1,3})\b/i);
  const gate = gateMatch?.[1]?.toUpperCase();

  // Transit detection
  const isTransit =
    context?.isTransit ||
    /\b(transit|in transit|transfer|layover|stopover|connecting)\b/i.test(q);

  // Open-now detection
  const wantsOpenNow =
    /\b(open now|what'?s open|currently open|open right now)\b/i.test(q);

  // Keyword extraction — strip punctuation, remove stop words & terminal refs
  const keywords = q
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w))
    .filter((w) => !/^t[1-4]$/.test(w) && w !== 'jewel');

  return { terminal, keywords, wantsOpenNow, isTransit, gate };
}

// ---------- Supabase query ----------

async function queryAmenities(filters: PreFilterResult) {
  let query = getSupabase()
    .from('amenity_detail')
    .select('*')
    .eq('airport_code', 'SIN');

  if (filters.terminal) {
    query = query.eq('terminal_code', filters.terminal);
  }

  if (filters.isTransit) {
    query = query.eq('available_in_tr', true);
  }

  // Keyword search across name, description, vibe_tags
  if (filters.keywords.length > 0) {
    const orParts = filters.keywords.flatMap((kw) => {
      const safe = kw.replace(/[^a-z0-9]/g, '');
      return [
        `name.ilike.%${safe}%`,
        `description.ilike.%${safe}%`,
        `vibe_tags.ilike.%${safe}%`,
      ];
    });
    query = query.or(orParts.join(','));
  }

  const { data, error } = await query.limit(30);

  if (error) throw error;

  // Fallback: if keyword search returned < 3 results, broaden to terminal or all
  if ((!data || data.length < 3) && filters.keywords.length > 0) {
    let broad = getSupabase()
      .from('amenity_detail')
      .select('*')
      .eq('airport_code', 'SIN');

    if (filters.terminal) {
      broad = broad.eq('terminal_code', filters.terminal);
    }

    const { data: broadData } = await broad.limit(30);
    return broadData || [];
  }

  return data || [];
}

// ---------- System prompt ----------

const SYSTEM_PROMPT = `You are the Terminal+ concierge for Singapore Changi Airport (SIN).

Key knowledge:
- Changi has 4 terminals (T1-T4) and Jewel (a nature-themed mall connected airside to T1).
- Transit passengers can visit Jewel via the free shuttle from T1/T2/T3. T4 passengers must take a bus to T2 first.
- The Skytrain connects T1-T2-T3 airside. T4 is a separate bus ride.
- Terminal codes: SIN-T1, SIN-T2, SIN-T3, SIN-T4, SIN-JEWEL.
- Singapore timezone: SGT (UTC+8).
- Famous attractions: Jewel Rain Vortex, Butterfly Garden (T3), Sunflower Garden (T2), Cactus Garden (T1).

Response rules:
1. Be concise and helpful — 2-3 sentences for the message.
2. ALWAYS respond with valid JSON in this exact format (no markdown fences):
{"message":"your friendly response","recommended_slugs":["slug1","slug2"],"follow_up":"optional question or null"}
3. recommended_slugs MUST only contain amenity_slug values from the provided amenity list.
4. Recommend 3-5 amenities, ranked by relevance to the query.
5. For "open now" queries, use the provided Singapore time to check opening_hours.
6. If no amenities match well, say so honestly and suggest what the user could try instead.`;

// ---------- Handler ----------

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS for local dev
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { query, context, conversationHistory } = req.body as ChatRequestBody;

    // --- Validation ---
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'query is required' });
    }
    if (query.length > 500) {
      return res.status(400).json({ error: 'Query too long (max 500 characters)' });
    }

    const history = (conversationHistory || []).slice(-10);

    // --- Pre-filter ---
    const filters = preFilter(query, context);

    // --- Supabase query ---
    const amenities = await queryAmenities(filters);

    // --- Build Claude messages ---
    const currentSGT = new Date().toLocaleString('en-SG', {
      timeZone: 'Asia/Singapore',
      dateStyle: 'medium',
      timeStyle: 'short',
    });

    const amenityContext = amenities.map((a) => ({
      slug: a.amenity_slug,
      name: a.name,
      terminal: a.terminal_code,
      description: (a.description || '').slice(0, 150),
      vibe_tags: a.vibe_tags,
      opening_hours: a.opening_hours,
      price_level: a.price_level,
      gate_location: a.gate_location,
      zone: a.zone,
      available_in_transit: a.available_in_tr,
    }));

    const userMessage = [
      `Current Singapore time: ${currentSGT}`,
      filters.terminal ? `User's terminal: ${filters.terminal}` : '',
      filters.isTransit ? 'User is in transit.' : '',
      filters.gate ? `User's gate: ${filters.gate}` : '',
      `\nAvailable amenities (${amenityContext.length} results):\n${JSON.stringify(amenityContext)}`,
      `\nUser query: ${query}`,
    ]
      .filter(Boolean)
      .join('\n');

    const messages = [
      ...history.map((h) => ({
        role: h.role as 'user' | 'assistant',
        content: h.content,
      })),
      { role: 'user' as const, content: userMessage },
    ];

    // --- Claude call ---
    const response = await getAnthropic().messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages,
    });

    const responseText =
      response.content[0].type === 'text' ? response.content[0].text : '';

    // --- Parse structured response ---
    let parsed: {
      message: string;
      recommended_slugs: string[];
      follow_up: string | null;
    };

    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch?.[0] || responseText);
    } catch {
      parsed = {
        message: responseText,
        recommended_slugs: [],
        follow_up: null,
      };
    }

    // Enrich slugs → full amenity objects
    const recommendedAmenities = (parsed.recommended_slugs || [])
      .map((slug: string) => amenities.find((a) => a.amenity_slug === slug))
      .filter(Boolean);

    return res.status(200).json({
      message: parsed.message,
      amenities: recommendedAmenities,
      followUp: parsed.follow_up || null,
      context: {
        terminal: filters.terminal,
        isTransit: filters.isTransit,
        totalResults: amenities.length,
      },
    });
  } catch (error: unknown) {
    console.error('Chat API error:', error);

    const status =
      error && typeof error === 'object' && 'status' in error
        ? (error as { status: number }).status
        : undefined;

    if (status === 429) {
      return res
        .status(429)
        .json({ error: 'Rate limited. Please try again in a moment.' });
    }

    return res
      .status(500)
      .json({ error: 'Something went wrong. Please try again.' });
  }
}
