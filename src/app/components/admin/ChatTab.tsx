import { useEffect, useRef, useState } from 'react';
import { useApp } from '@/app/context/AppContext';
import { ChatConversationSummary } from '@/app/data/types';

function ConversationRow({
  conversation,
  isActive,
  onClick,
}: {
  conversation: ChatConversationSummary;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-3 border-b border-neutral-200 transition-colors ${
        isActive ? 'bg-neutral-100' : 'hover:bg-neutral-50'
      }`}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm truncate">{conversation.userName || conversation.userEmail}</span>
        {conversation.unreadCount > 0 && <span className="w-2 h-2 rounded-full bg-black flex-shrink-0" />}
      </div>
      <p className="text-xs text-neutral-500 truncate">{conversation.lastMessage || 'No messages yet'}</p>
    </button>
  );
}

export function ChatTab() {
  const {
    chatQueue, chatMine, fetchChatQueue,
    chatMessages, fetchChatThread, sendStaffReply,
  } = useApp();

  const [activeId, setActiveId] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchChatQueue();
    const interval = setInterval(fetchChatQueue, 20000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!activeId) return;

    fetchChatThread(activeId);
    const interval = setInterval(() => fetchChatThread(activeId), 8000);
    return () => clearInterval(interval);
  }, [activeId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [chatMessages]);

  const handleSend = async () => {
    const body = text.trim();
    if (!body || !activeId || isSending) return;

    setIsSending(true);
    setError('');
    try {
      setText('');
      await sendStaffReply(activeId, body);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send message');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex border border-neutral-200 h-[70vh]">
      <div className="w-72 border-r border-neutral-200 overflow-y-auto flex-shrink-0">
        <div className="px-4 py-2 text-xs tracking-wide uppercase text-neutral-500 bg-neutral-50">
          Queue ({chatQueue.length})
        </div>
        {chatQueue.map(conversation => (
          <ConversationRow
            key={conversation.id}
            conversation={conversation}
            isActive={activeId === conversation.id}
            onClick={() => setActiveId(conversation.id)}
          />
        ))}

        <div className="px-4 py-2 text-xs tracking-wide uppercase text-neutral-500 bg-neutral-50">
          Mine ({chatMine.length})
        </div>
        {chatMine.map(conversation => (
          <ConversationRow
            key={conversation.id}
            conversation={conversation}
            isActive={activeId === conversation.id}
            onClick={() => setActiveId(conversation.id)}
          />
        ))}

        {chatQueue.length === 0 && chatMine.length === 0 && (
          <p className="text-center text-neutral-500 text-sm py-8 px-4">No conversations yet</p>
        )}
      </div>

      <div className="flex-1 flex flex-col">
        {!activeId ? (
          <div className="flex-1 flex items-center justify-center text-neutral-500 text-sm">
            Select a conversation
          </div>
        ) : (
          <>
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4">
              {chatMessages.map(message => {
                const isMine = message.senderRole !== 'customer';
                return (
                  <div key={message.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[70%] px-4 py-2 text-sm ${
                        isMine ? 'bg-black text-white' : 'bg-neutral-100 text-black'
                      }`}
                    >
                      {message.body}
                    </div>
                  </div>
                );
              })}
            </div>

            {error && <div className="px-4 py-2 text-sm text-red-700 bg-red-50">{error}</div>}

            <div className="border-t border-neutral-200 p-4 flex gap-2">
              <input
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                placeholder="Type a reply..."
                className="flex-1 px-4 py-2 border border-neutral-300 text-sm outline-none focus:border-black"
              />
              <button
                onClick={handleSend}
                disabled={isSending || !text.trim()}
                className="px-4 py-2 bg-black text-white text-sm disabled:bg-neutral-300"
              >
                Send
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
