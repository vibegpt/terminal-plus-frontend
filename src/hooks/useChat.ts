import { useCallback, useState } from 'react'
import { askConcierge, type ChatContext, type ChatMessage, type ChatResponse } from '../services/chatService'
import type { JourneyData } from '../context/JourneyContext'

const MAX_HISTORY = 10

interface UseChatOptions {
  terminal?: string
  isTransit?: boolean
  /** The flight the user entered in the app. Read on every send, so the minutes stay current. */
  journey?: JourneyData | null
}

// Written when capture is skipped: not real flights.
const PLACEHOLDER_FLIGHTS = new Set(['SQ000', 'UNKNOWN'])

/** What the concierge should know about the trip, from the journey the user entered. */
export function journeyToChatContext(
  journey: JourneyData | null | undefined,
  now: number = Date.now(),
): ChatContext {
  if (!journey) return {}
  const ctx: ChatContext = { terminal: journey.currentTerminal }
  // The Jewel rule depends on it; 'skipped' and pre-v4 records stay unknown.
  if (journey.journey_type && journey.journey_type !== 'skipped') ctx.journeyType = journey.journey_type
  if (journey.gate) ctx.gate = journey.gate
  if (journey.arrivingFlight) ctx.isTransit = true
  if (!journey.departingFlight || PLACEHOLDER_FLIGHTS.has(journey.departingFlight)) return ctx

  const boardingMs = Date.parse(journey.boardingTime)
  if (!Number.isNaN(boardingMs) && boardingMs > now) {
    ctx.availableMinutes = Math.floor((boardingMs - now) / 60_000)
  }
  ctx.flight = {
    number: journey.departingFlight,
    destination: journey.destination ?? null,
    departureTerminal: journey.departureTerminal,
    boardingTime: journey.boardingTime,
  }
  return ctx
}

function definedOnly(ctx: ChatContext): ChatContext {
  return Object.fromEntries(
    Object.entries(ctx).filter(([, v]) => v !== undefined && v !== null)
  ) as ChatContext
}

export function useChat(options: UseChatOptions = {}) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [context, setContext] = useState<ChatContext>({
    terminal: options.terminal,
    isTransit: options.isTransit,
  })

  const updateContext = useCallback((updates: Partial<ChatContext>) => {
    setContext(prev => ({ ...prev, ...updates }))
  }, [])

  const sendMessage = useCallback(async (query: string) => {
    if (!query.trim()) return
    setError(null)

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: query.trim(),
      timestamp: Date.now(),
    }

    setMessages(prev => [...prev, userMsg])
    setLoading(true)

    try {
      const history = [...messages, userMsg]
        .slice(-MAX_HISTORY)
        .map(({ role, content }) => ({ role, content }))

      // The entered flight is the baseline; anything the user said in this chat wins.
      const response: ChatResponse = await askConcierge({
        query: query.trim(),
        context: { ...journeyToChatContext(options.journey), ...definedOnly(context) },
        conversationHistory: history,
      })

      // If API extracted new context, update it
      if (response.extractedContext) {
        setContext(prev => ({ ...prev, ...response.extractedContext }))
      }

      const assistantMsg: ChatMessage = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: response.message,
        amenities: response.amenities,
        followUp: response.followUp,
        timestamp: Date.now(),
      }

      setMessages(prev => [...prev, assistantMsg])
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }, [messages, context, options.journey])

  const clearMessages = useCallback(() => {
    setMessages([])
    setError(null)
    setContext({ terminal: options.terminal, isTransit: options.isTransit })
  }, [options.terminal, options.isTransit])

  return { messages, loading, error, context, updateContext, sendMessage, clearMessages }
}
