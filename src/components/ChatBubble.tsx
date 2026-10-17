import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle } from 'lucide-react';
import ChatPanel from './ChatPanel';
import { openChatBus } from '../lib/agentCards';
import type { AgentCard } from '../../shared/agentCard/card';

export default function ChatBubble() {
  const [open, setOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const [seedCard, setSeedCard] = useState<AgentCard | null>(null);

  // CC-25: "Ask something else" on an agent card opens chat seeded with that card.
  useEffect(() => openChatBus.on(card => {
    setSeedCard(card);
    setHasUnread(false);
    setOpen(true);
  }), []);

  const handleToggle = () => {
    setOpen((prev) => {
      if (!prev) setHasUnread(false); // clear dot when opening
      return !prev;
    });
  };

  const handleClose = () => {
    setOpen(false);
  };

  const onNewAssistantMessage = useCallback(() => {
    if (!open) setHasUnread(true);
  }, [open]);

  return (
    <>
      {/* Floating bubble */}
      {!open && (
        <motion.button
          onClick={handleToggle}
          className="fixed bottom-20 right-4 z-50 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-blue-700 active:scale-95 transition-colors"
          whileTap={{ scale: 0.9 }}
          aria-label="Open chat"
        >
          <MessageCircle className="w-6 h-6" />
          {hasUnread && (
            <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-white" />
          )}
        </motion.button>
      )}

      {/* Chat panel */}
      <ChatPanel
        open={open}
        onClose={handleClose}
        onNewMessage={onNewAssistantMessage}
        seedCard={seedCard}
      />
    </>
  );
}
