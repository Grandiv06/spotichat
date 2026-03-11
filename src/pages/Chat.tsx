import { useChatStore } from '@/store/chat.store';
import { ChatArea } from '@/features/chat/ChatArea';
import { MessageCircle } from 'lucide-react';

export function Chat() {
  const { selectedChatId } = useChatStore();

  if (!selectedChatId) {
    return (
      <div className="flex-1 flex flex-col h-full bg-accent/20 items-center justify-center relative">
        <div className="absolute inset-0 pattern-dots text-muted-foreground/[0.05] bg-repeat opacity-50" />
        <div className="relative flex flex-col items-center gap-4 z-10 px-6 text-center">
           <div className="w-16 h-16 bg-card border-none rounded-2xl flex items-center justify-center shadow-md shadow-black/5 dark:shadow-black/20 text-muted-foreground">
              <MessageCircle size={32} />
           </div>
           <p className="bg-card px-4 py-2 rounded-full text-sm font-medium text-muted-foreground shadow-sm border border-border">
              Select a chat to start messaging
           </p>
        </div>
      </div>
    );
  }

  return <ChatArea chatId={selectedChatId} />;
}
