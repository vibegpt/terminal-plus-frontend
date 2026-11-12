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
  // In transit means connecting. A just-landed passenger has an inbound flight
  // too but is landside; a pre-v4 record has no type, so it keeps the old rule.
  if (journey.journey_type ? journey.journey_type === 'connecting' : journey.arrivingFlight) ctx.isTransit = true
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

/**
 * What goes out with a message (CC-29 D2). The entered flight is the baseline; anything
 * the user said in this chat wins, except minutes. Chat never keeps a minute count: a
 * stated "I have 2 hours" is kept as a boarding deadline and counted down on each send.
 * Precedence: minutes stated in this message (the server reads the query) > a live
 * deadline stated earlier in this chat > the captured flight.
 */
export function chatContextForSend(
  journey: JourneyData | null | undefined,
  context: ChatContext,
  statedDeadline: number | null,
  now: number = Date.now(),
): ChatContext {
  const { availableMinutes: _frozen, ...stated } = definedOnly(context)
  const ctx: ChatContext = { ...journeyToChatContext(journey, now), ...stated }
  if (statedDeadline !== null && statedDeadline > now) {
    ctx.availableMinutes = Math.floor((statedDeadline - now) / 60_000)
  }
  return ctx
}

export function useChat(options: UseChatOptions = {}) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [context, setContext] = useState<ChatContext>({
    terminal: options.terminal,
    isTransit: options.isTransit,
  })

  // Epoch ms of the boarding deadline the user stated in this chat, or null.
  const [statedDeadline, setStatedDeadline] = useState<number | null>(null)

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

    const sentAt = Date.now()
    // A passed deadline is cleared; the entered flight takes over again.
    if (statedDeadline !== null && statedDeadline <= sentAt) setStatedDeadline(null)

    setMessages(prev => [...prev, userMsg])
    setLoading(true)

    try {
      const history = [...messages, userMsg]
        .slice(-MAX_HISTORY)
        .map(({ role, content }) => ({ role, content }))

      const response: ChatResponse = await askConcierge({
        query: query.trim(),
        context: chatContextForSend(options.journey, context, statedDeadline, sentAt),
        conversationHistory: history,
      })

      // If API extracted new context, update it. Minutes become a deadline, never a stored count.
      if (response.extractedContext) {
        const { availableMinutes, ...rest } = response.extractedContext
        if (availableMinutes) setStatedDeadline(sentAt + availableMinutes * 60_000)
        setContext(prev => ({ ...prev, ...rest }))
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
  }, [messages, context, statedDeadline, options.journey])

  const clearMessages = useCallback(() => {
    setMessages([])
    setError(null)
    setStatedDeadline(null)
    setContext({ terminal: options.terminal, isTransit: options.isTransit })
  }, [options.terminal, options.isTransit])

  return { messages, loading, error, context, updateContext, sendMessage, clearMessages }
}
