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

export interface ChatRequest {
  query: string;
  context?: {
    terminal?: string;
    isTransit?: boolean;
  };
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
}

export interface ChatResponse {
  message: string;
  amenities: AmenityDetail[];
  followUp: string | null;
  context: {
    terminal?: string;
    isTransit: boolean;
    totalResults: number;
  };
}

// ---------- Service ----------

const API_URL = '/api/chat';

export async function askConcierge(request: ChatRequest): Promise<ChatResponse> {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Chat request failed (${res.status})`);
  }

  return res.json();
}
