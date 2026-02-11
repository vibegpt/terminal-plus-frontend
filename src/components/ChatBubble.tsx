import { useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle } from 'lucide-react';
import ChatPanel from './ChatPanel';

export default function ChatBubble() {
  const [open, setOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);

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
      />
    </>
  );
}
