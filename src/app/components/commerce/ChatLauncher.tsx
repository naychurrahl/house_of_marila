import { MessageCircle } from 'lucide-react';
import { useApp } from '@/app/context/AppContext';

interface ChatLauncherProps {
  onClick: () => void;
}

export function ChatLauncher({ onClick }: ChatLauncherProps) {
  const { user, chatUnreadCount } = useApp();

  // Customer-facing widget only - staff/admin use the dedicated Queue/Mine
  // Chat tab in the Admin panel instead.
  if (!user || user.role === 'admin' || user.role === 'staff') return null;

  return (
    <button
      onClick={onClick}
      className="fixed bottom-20 right-4 z-30 w-12 h-12 bg-black text-white rounded-full shadow-lg flex items-center justify-center"
      aria-label="Open support chat"
    >
      <MessageCircle className="w-5 h-5" />
      {chatUnreadCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full">
          {chatUnreadCount}
        </span>
      )}
    </button>
  );
}
