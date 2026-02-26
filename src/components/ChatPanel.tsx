import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, MapPin, Clock, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { useChat } from '../hooks/useChat';
import { useVoice } from '../hooks/useVoice';
import type { ChatMessage } from '../services/chatService';
import type { AmenityDetail } from '../lib/supabase';

interface ChatPanelProps {
  open: boolean;
  onClose: () => void;
  onNewMessage?: () => void;
}

export default function ChatPanel({ open, onClose, onNewMessage }: ChatPanelProps) {
  const { messages, loading, error, sendMessage, context, updateContext } = useChat();
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const prevMsgCount = useRef(messages.length);

  const voice = useVoice({
    onTranscript: (text) => sendMessage(text),
  });

  const isListening = voice.status === 'listening';

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
    if (messages.length > prevMsgCount.current) {
      onNewMessage?.();
    }
    prevMsgCount.current = messages.length;
  }, [messages, loading, onNewMessage]);

  // Focus input when panel opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [open]);

  // Stop TTS when panel closes
  useEffect(() => {
    if (!open) voice.stopSpeaking();
  }, [open]);

  // Auto-TTS: speak assistant reply when last user message was voice
  useEffect(() => {
    if (!voice.ttsEnabled || messages.length < 2) return;
    const lastMsg = messages[messages.length - 1];
    const prevMsg = messages[messages.length - 2];
    if (false) {
      voice.speak(lastMsg.content);
    }
  }, [messages, voice.ttsEnabled]);

  const handleSend = () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    sendMessage(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleMicToggle = () => {
    if (isListening) {
      voice.stopListening();
    } else {
      voice.startListening();
    }
  };

  const handleAmenityTap = (slug: string) => {
    onClose();
    navigate(`/amenity/${slug}`);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-[60] bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            className="fixed inset-x-0 bottom-0 z-[60] flex flex-col bg-white dark:bg-slate-900 rounded-t-2xl h-[80vh] max-h-[600px] shadow-2xl"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            {/* Drag handle + header */}
            <div className="flex-shrink-0 pt-2 pb-3 px-4 border-b border-gray-200 dark:border-slate-700">
              <div className="w-10 h-1 bg-gray-300 dark:bg-slate-600 rounded-full mx-auto mb-3" />
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                  Terminal+ Concierge
                </h2>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                  aria-label="Close chat"
                >
                  <X className="w-5 h-5 text-gray-500 dark:text-slate-400" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
              {messages.length === 0 && !loading && (
                <div className="text-center text-gray-400 dark:text-slate-500 mt-8 text-sm">
                  Ask me anything about Changi Airport — restaurants, lounges, shops, transit tips, and more.
                </div>
              )}

              {messages.map((msg, idx) => (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  onAmenityTap={handleAmenityTap}
                  onFollowUp={sendMessage}
                  isSpeaking={
                    voice.status === 'speaking' &&
                    msg.role === 'assistant' &&
                    idx === messages.length - 1
                  }
                />
              ))}

              {loading && <TypingIndicator />}

              {error && (
                <div className="text-center text-sm text-red-500 dark:text-red-400 py-2">
                  {error}
                </div>
              )}
            </div>

            {/* Input */}
            <div className="flex-shrink-0 border-t border-gray-200 dark:border-slate-700 px-4 py-3 pb-[env(safe-area-inset-bottom,12px)]">
              {/* TTS toggle */}
              {voice.supported && (
                <button
                  onClick={() => voice.setTtsEnabled(!voice.ttsEnabled)}
                  className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-slate-400 mb-2 hover:text-gray-700 dark:hover:text-slate-300 transition-colors"
                >
                  {voice.ttsEnabled ? (
                    <Volume2 className="w-3.5 h-3.5" />
                  ) : (
                    <VolumeX className="w-3.5 h-3.5" />
                  )}
                  Voice replies {voice.ttsEnabled ? 'on' : 'off'}
                </button>
              )}

              <div className="flex items-center gap-2">
                {/* Mic button */}
                {voice.supported && (
                  <button
                    onClick={handleMicToggle}
                    disabled={loading || voice.status === 'processing'}
                    className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-95 disabled:opacity-40 ${
                      isListening
                        ? 'bg-red-500 text-white animate-pulse'
                        : 'bg-gray-200 dark:bg-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-300 dark:hover:bg-slate-600'
                    }`}
                    aria-label={isListening ? 'Stop listening' : 'Start voice input'}
                  >
                    {isListening ? (
                      <MicOff className="w-4 h-4" />
                    ) : (
                      <Mic className="w-4 h-4" />
                    )}
                  </button>
                )}

                <input
                  ref={inputRef}
                  type="text"
                  value={isListening ? voice.interimTranscript : input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={isListening ? 'Listening...' : 'Ask about Changi...'}
                  disabled={loading || isListening}
                  readOnly={isListening}
                  className="flex-1 rounded-full bg-gray-100 dark:bg-slate-800 px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || loading || isListening}
                  className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center disabled:opacity-40 hover:bg-blue-700 active:scale-95 transition-all"
                  aria-label="Send message"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ---------- Sub-components ----------

function MessageBubble({
  message,
  onAmenityTap,
  onFollowUp,
  isSpeaking,
}: {
  message: ChatMessage;
  onAmenityTap: (slug: string) => void;
  onFollowUp: (text: string) => void;
  isSpeaking?: boolean;
}) {
  const isUser = message.role === 'user';

  return (
    <div className={isUser ? 'flex justify-end' : 'flex justify-start'}>
      <div className={isUser ? 'ml-12 max-w-[85%]' : 'mr-12 max-w-[85%]'}>
        <div
          className={
            isUser
              ? 'bg-blue-600 text-white rounded-2xl rounded-br-md px-4 py-2.5 text-sm'
              : 'bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-white rounded-2xl rounded-bl-md px-4 py-2.5 text-sm'
          }
        >
          {message.content}
        </div>

        {/* Speaking indicator */}
        {isSpeaking && (
          <div className="flex items-center gap-1 mt-1 text-[11px] text-blue-500 dark:text-blue-400">
            <Volume2 className="w-3 h-3" />
            Speaking...
          </div>
        )}

        {/* Amenity cards */}
        {!isUser && message.amenities && message.amenities.length > 0 && (
          <div className="flex gap-2 mt-2 overflow-x-auto pb-1 -mx-1 px-1">
            {message.amenities.map((amenity) => (
              <AmenityMiniCard
                key={amenity.amenity_slug || amenity.id}
                amenity={amenity}
                onTap={onAmenityTap}
              />
            ))}
          </div>
        )}

        {/* Follow-up chip */}
        {!isUser && message.followUp && (
          <button
            onClick={() => onFollowUp(message.followUp!)}
            className="mt-2 inline-block text-xs border border-blue-300 dark:border-blue-600 text-blue-600 dark:text-blue-400 rounded-full px-3 py-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
          >
            {message.followUp}
          </button>
        )}
      </div>
    </div>
  );
}

function AmenityMiniCard({
  amenity,
  onTap,
}: {
  amenity: AmenityDetail;
  onTap: (slug: string) => void;
}) {
  const slug = amenity.amenity_slug || '';
  const name = amenity.name || 'Unknown';
  const terminal = amenity.terminal_code || '';
  const hours = amenity.opening_hours;
  const imageUrl = amenity.logo_url;

  // Simple terminal label: "SIN-T3" → "T3"
  const terminalLabel = terminal.replace('SIN-', '');

  // Format hours: show first entry or "See details"
  let hoursText = 'See details';
  if (hours) {
    const firstVal = Object.values(hours)[0];
    if (firstVal) hoursText = firstVal;
  }

  return (
    <button
      onClick={() => slug && onTap(slug)}
      className="flex-shrink-0 w-44 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden text-left hover:shadow-md transition-shadow"
    >
      {imageUrl && (
        <div className="h-20 bg-gray-200 dark:bg-slate-700 overflow-hidden">
          <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
        </div>
      )}
      <div className="p-2.5">
        <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">{name}</p>
        <div className="flex items-center gap-2 mt-1 text-[11px] text-gray-500 dark:text-slate-400">
          {terminalLabel && (
            <span className="flex items-center gap-0.5">
              <MapPin className="w-3 h-3" />
              {terminalLabel}
            </span>
          )}
          <span className="flex items-center gap-0.5 truncate">
            <Clock className="w-3 h-3" />
            {hoursText}
          </span>
        </div>
      </div>
    </button>
  );
}

function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="bg-gray-100 dark:bg-slate-800 rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-1">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="w-2 h-2 bg-gray-400 dark:bg-slate-500 rounded-full"
            animate={{ y: [0, -6, 0] }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              delay: i * 0.15,
            }}
          />
        ))}
      </div>
    </div>
  );
}
