import { useEffect, useRef, useState } from 'react';
import { X, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '@/app/context/AppContext';

interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ChatPanel({ isOpen, onClose }: ChatPanelProps) {
  const { user, chatMessages, fetchChat, sendChatMessage } = useApp();
  const [text, setText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    fetchChat(true);
    const interval = setInterval(() => fetchChat(true), 8000);
    return () => clearInterval(interval);
  }, [isOpen]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [chatMessages]);

  const handleSend = async () => {
    const body = text.trim();
    if (!body || isSending) return;

    setIsSending(true);
    try {
      setText('');
      await sendChatMessage(body);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.3 }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-white z-50 flex flex-col"
          >
            <div className="flex items-center justify-between px-6 h-14 border-b border-neutral-200">
              <span className="tracking-[0.2em] text-sm">SUPPORT CHAT</span>
              <button onClick={onClose} className="p-2 -mr-2">
                <X className="w-5 h-5" />
              </button>
            </div>

            {!user ? (
              <div className="flex-1 flex items-center justify-center p-8 text-center text-neutral-500">
                Please log in to chat with us.
              </div>
            ) : (
              <>
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4">
                  {chatMessages.length === 0 && (
                    <p className="text-center text-neutral-500 text-sm">
                      Send a message and we'll get back to you shortly.
                    </p>
                  )}
                  {chatMessages.map(message => {
                    const isMine = message.senderRole === 'customer';
                    return (
                      <div key={message.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                        <div
                          className={`max-w-[80%] px-4 py-2 text-sm ${
                            isMine ? 'bg-black text-white' : 'bg-neutral-100 text-black'
                          }`}
                        >
                          {message.body}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="border-t border-neutral-200 p-4 flex gap-2">
                  <input
                    value={text}
                    onChange={e => setText(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSend()}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2 border border-neutral-300 text-sm outline-none focus:border-black"
                  />
                  <button
                    onClick={handleSend}
                    disabled={isSending || !text.trim()}
                    className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-black text-white disabled:bg-neutral-300"
                    aria-label="Send message"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
