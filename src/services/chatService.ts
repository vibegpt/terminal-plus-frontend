import type { AmenityDetail } from '../lib/supabase';

// ---------- Types ----------

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  amenities?: AmenityDetail[];
  followUp?: string | null;
  timestamp: number;
}

export interface AgentContext {
  terminal: string | null;
  gate: string | null;
  boardingTime: string | null;
  flightNumber: string | null;
  destination: string | null;
  selectedVibe: string | null;
}

export interface ChatRequest {
  message: string;
  context: AgentContext;
  history: Array<{ role: 'user' | 'assistant'; content: string }>;
  mode?: 'conversational' | 'structured';
}

export interface ChatResponse {
  message: string;
  amenities: AmenityDetail[];
  followUp: string | null;
  structured?: Record<string, unknown>;
  context: {
    terminal?: string;
    isTransit: boolean;
    totalResults: number;
    timeUntilBoarding?: number | null;
  };
}

// ---------- Service ----------

const API_URL = '/api/chat';

export async function askConcierge(
  request: ChatRequest,
  sessionId?: string,
): Promise<ChatResponse> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (sessionId) {
    headers['x-session-id'] = sessionId;
  }

  const res = await fetch(API_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify(request),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Chat request failed (${res.status})`);
  }

  return res.json();
}
