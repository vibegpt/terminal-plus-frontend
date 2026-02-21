import { useCallback, useState } from 'react'
import { askConcierge, type ChatMessage, type ChatResponse } from '../services/chatService'

const MAX_HISTORY = 10

interface UseChatOptions {
  terminal?: string
  isTransit?: boolean
}

interface ChatContext {
  terminal?: string
  isTransit?: boolean
  departureTime?: string      // ISO string e.g. "2026-02-18T15:45:00+08:00"
  availableMinutes?: number   // calculated from departureTime
  gate?: string
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

      const response: ChatResponse = await askConcierge({
        query: query.trim(),
        context,
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
  }, [messages, context])

  const clearMessages = useCallback(() => {
    setMessages([])
    setError(null)
    setContext({ terminal: options.terminal, isTransit: options.isTransit })
  }, [options.terminal, options.isTransit])

  return { messages, loading, error, context, updateContext, sendMessage, clearMessages }
}
