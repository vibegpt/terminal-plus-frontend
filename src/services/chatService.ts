import type { AmenityDetail } from '../lib/supabase'

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
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })

  const body = await res.json().catch(() => {
    throw new Error(`Chat request failed (${res.status})`)
  })

  if (!res.ok) {
    throw new Error(body.error ?? `Chat request failed (${res.status})`)
  }

  return body
}
