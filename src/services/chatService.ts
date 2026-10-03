import type { AmenityDetail } from '../lib/supabase'
import { telemetryIds, testHeaders } from '../lib/telemetry'

// ---------- Types ----------

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  amenities?: AmenityDetail[]
  followUp?: string | null
  timestamp: number
}

export interface ChatContext {
  terminal?: string
  isTransit?: boolean
  departureTime?: string
  availableMinutes?: number
  gate?: string
  /** The flight the user entered in the app */
  flight?: {
    number?: string
    destination?: string | null
    departureTerminal?: string
    boardingTime?: string   // ISO 8601
  }
}

export interface ChatRequest {
  query: string
  context?: ChatContext
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>
}

export interface ChatResponse {
  message: string
  amenities: AmenityDetail[]
  followUp: string | null
  context: {
    terminal?: string
    isTransit: boolean
    totalResults: number
  }
  extractedContext?: Partial<ChatContext>
}

// ---------- Service ----------

const API_URL = '/api/chat'

export async function askConcierge(request: ChatRequest): Promise<ChatResponse> {
  // The server logs each turn: same session/journey ids as the app's events,
  // and the tp_test switch flags the row is_test.
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...testHeaders() },
    body: JSON.stringify({ ...request, ...telemetryIds() }),
  })

  const body = await res.json().catch(() => {
    throw new Error(`Chat request failed (${res.status})`)
  })

  if (!res.ok) {
    throw new Error(body.error ?? `Chat request failed (${res.status})`)
  }

  return body
}
