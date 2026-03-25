import { useCallback, useState, useRef } from 'react';
import {
  askConcierge,
  type AgentContext,
  type ChatMessage,
  type ChatResponse,
} from '../services/chatService';

const MAX_HISTORY = 10;

function getSessionId(): string {
  let id = sessionStorage.getItem('tp_session_id');
  if (!id) {
    id = `s-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    sessionStorage.setItem('tp_session_id', id);
  }
  return id;
}

function getAgentContext(): AgentContext {
  let journey: Record<string, string> = {};
  try {
    const raw = localStorage.getItem('tp_journey_context');
    if (raw) journey = JSON.parse(raw);
  } catch { /* ignore */ }

  const terminal =
    sessionStorage.getItem('tp_user_terminal') || journey.terminal || null;

  return {
    terminal,
    gate: journey.gate || null,
    boardingTime: journey.boardingTime || journey.estimatedBoardingTime || null,
    flightNumber: journey.flightNumber || null,
    destination: journey.destination || null,
    selectedVibe: null, // populated by caller if browsing a specific vibe
  };
}

interface UseChatOptions {
  terminal?: string;
  isTransit?: boolean;
  selectedVibe?: string;
}

export function useChat(options?: UseChatOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sessionIdRef = useRef(getSessionId());

  const sendMessage = useCallback(
    async (query: string) => {
      if (!query.trim()) return;

      setError(null);

      const userMsg: ChatMessage = {
        id: `u-${Date.now()}`,
        role: 'user',
        content: query.trim(),
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setLoading(true);

      try {
        // Build context from storage + options override
        const ctx = getAgentContext();
        if (options?.terminal) ctx.terminal = options.terminal;
        if (options?.selectedVibe) ctx.selectedVibe = options.selectedVibe;

        // Build conversation history
        const history = [...messages, userMsg]
          .slice(-MAX_HISTORY)
          .map((m) => ({ role: m.role, content: m.content }));

        const response: ChatResponse = await askConcierge(
          {
            message: query.trim(),
            context: ctx,
            history,
            mode: 'conversational',
          },
          sessionIdRef.current,
        );

        const assistantMsg: ChatMessage = {
          id: `a-${Date.now()}`,
          role: 'assistant',
          content: response.message,
          amenities: response.amenities,
          followUp: response.followUp,
          timestamp: Date.now(),
        };

        setMessages((prev) => [...prev, assistantMsg]);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Something went wrong';
        setError(msg);
      } finally {
        setLoading(false);
      }
    },
    [messages, options?.terminal, options?.isTransit, options?.selectedVibe],
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return { messages, loading, error, sendMessage, clearMessages };
}
