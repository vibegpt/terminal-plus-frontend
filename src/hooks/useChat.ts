import { useCallback, useState } from 'react';
import { askConcierge, type ChatMessage, type ChatResponse } from '../services/chatService';

const MAX_HISTORY = 6;

interface UseChatOptions {
  terminal?: string;
  isTransit?: boolean;
}

export function useChat(options?: UseChatOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(
    async (query: string) => {
      if (!query.trim()) return;

      setError(null);

      // Add user message
      const userMsg: ChatMessage = {
        id: `u-${Date.now()}`,
        role: 'user',
        content: query.trim(),
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setLoading(true);

      try {
        // Build conversation history from recent messages
        const history = [...messages, userMsg]
          .slice(-MAX_HISTORY)
          .map((m) => ({ role: m.role, content: m.content }));

        const response: ChatResponse = await askConcierge({
          query: query.trim(),
          context: {
            terminal: options?.terminal,
            isTransit: options?.isTransit,
          },
          conversationHistory: history,
        });

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
    [messages, options?.terminal, options?.isTransit],
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return { messages, loading, error, sendMessage, clearMessages };
}
