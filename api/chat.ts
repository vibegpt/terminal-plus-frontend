import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { readFileSync } from 'fs';
import { resolve } from 'path';

import { SYSTEM_PROMPT, STRUCTURED_MODE_SUFFIX } from './lib/agentPrompt';
import {
  type AgentContext,
  calculateDerivedContext,
  queryAmenities,
  buildContextMessage,
  callClaude,
  parseResponse,
} from './lib/agent';

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

// ---------- Lazy-init clients ----------

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

// ---------- Request types (backward-compatible) ----------

interface ChatRequestBody {
  // New shape
  message?: string;
  context?: AgentContext;
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
  mode?: 'conversational' | 'structured';
  // Legacy shape (kept for backward compat)
  query?: string;
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
}

// ---------- Handler ----------

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-session-id');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const body = req.body as ChatRequestBody;

    // Backward compat: accept both `message` and `query`
    const userMessage = body.message || body.query;
    if (!userMessage || typeof userMessage !== 'string') {
      return res.status(400).json({ error: 'message is required' });
    }
    if (userMessage.length > 500) {
      return res.status(400).json({ error: 'Message too long (max 500 characters)' });
    }

    const history = (body.history || body.conversationHistory || []).slice(-10);
    const mode = body.mode || 'conversational';

    // Build context (merge new and legacy shapes)
    const ctx: AgentContext = {
      terminal: body.context?.terminal || null,
      gate: body.context?.gate || null,
      boardingTime: body.context?.boardingTime || null,
      flightNumber: body.context?.flightNumber || null,
      destination: body.context?.destination || null,
      selectedVibe: body.context?.selectedVibe || null,
    };

    // Calculate derived context
    const derived = calculateDerivedContext(ctx);

    // Query Supabase for matching amenities
    let amenities;
    try {
      amenities = await queryAmenities(getSupabase(), ctx);
    } catch (err) {
      console.error('Supabase query failed:', err);
      amenities = []; // Claude will mention it doesn't have data
    }

    // Build system prompt (with structured suffix if needed)
    const systemPrompt = mode === 'structured'
      ? SYSTEM_PROMPT + STRUCTURED_MODE_SUFFIX
      : SYSTEM_PROMPT;

    // Build messages array
    const contextMsg = buildContextMessage(ctx, derived, amenities);
    const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [
      { role: 'user', content: contextMsg },
      { role: 'assistant', content: 'I have the user\'s context and matching amenities. Ready to help.' },
      ...history,
      { role: 'user', content: userMessage },
    ];

    // Call Claude
    let responseText: string;
    try {
      responseText = await callClaude(getAnthropic(), systemPrompt, messages, 1000);
    } catch (err) {
      console.error('Claude API error:', err);
      const status = err && typeof err === 'object' && 'status' in err
        ? (err as { status: number }).status : undefined;
      if (status === 429) {
        return res.status(429).json({ error: 'Rate limited. Please try again in a moment.' });
      }
      return res.status(200).json({
        message: "I'm having trouble connecting right now. Try again in a moment.",
        amenities: [],
        followUp: null,
        context: { terminal: ctx.terminal, timeUntilBoarding: derived.timeUntilBoarding, totalResults: 0 },
      });
    }

    // Parse response
    const result = parseResponse(responseText, amenities, mode);
    result.context.terminal = ctx.terminal;
    result.context.timeUntilBoarding = derived.timeUntilBoarding;

    // Log interaction (fire-and-forget)
    try {
      const sessionId = (req.headers['x-session-id'] as string) || 'anonymous';
      await getSupabase().from('agent_interactions').insert({
        session_id: sessionId,
        user_message: userMessage,
        agent_response: result.response,
        terminal: ctx.terminal,
        gate: ctx.gate,
        time_until_boarding: derived.timeUntilBoarding,
        vibe_requested: ctx.selectedVibe,
        amenities_shown: result.amenities.map(a => ({ id: a.id, name: a.name })),
        mode,
      });
    } catch (logErr) {
      console.error('Interaction logging failed:', logErr);
    }

    // Return response (keep backward-compatible shape)
    return res.status(200).json({
      message: result.response,
      amenities: result.amenities,
      followUp: result.followUp,
      ...(result.structured ? { structured: result.structured } : {}),
      context: {
        terminal: ctx.terminal,
        isTransit: false,
        totalResults: result.context.totalResults,
        timeUntilBoarding: derived.timeUntilBoarding,
      },
    });
  } catch (error: unknown) {
    console.error('Chat API error:', error);
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}
