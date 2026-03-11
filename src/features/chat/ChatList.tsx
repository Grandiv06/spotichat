import { useEffect, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { chatService } from '@/services/chat.service';
import type { Chat } from '@/services/chat.service';
import { useChatStore } from '@/store/chat.store';
import { cn } from '@/lib/utils';

export function ChatList() {
  const [chats, setChats] = useState<Chat[]>([]);
  const { selectedChatId, setSelectedChatId } = useChatStore();

  useEffect(() => {
    chatService.getChats().then(setChats);
  }, []);

  return (
    <div className="p-2 space-y-1">
      {chats.map((chat) => (
        <div 
          key={chat.id}
          onClick={() => setSelectedChatId(chat.id)}
          className={cn(
            "p-3 rounded-xl flex items-center gap-3 cursor-pointer transition-colors",
            selectedChatId === chat.id 
              ? "bg-primary text-primary-foreground select-none" 
              : "hover:bg-accent/50"
          )}
        >
          <Avatar className="h-12 w-12 border border-border/50">
            <AvatarImage src={chat.participant.avatar} />
            <AvatarFallback className={selectedChatId === chat.id ? "text-foreground" : ""}>
              {chat.participant.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 overflow-hidden">
            <div className="flex justify-between items-center mb-1">
              <h3 className="font-semibold text-[15px] truncate">{chat.participant.name}</h3>
              {chat.lastMessage && (
                <span className={cn(
                  "text-xs whitespace-nowrap ml-2",
                  selectedChatId === chat.id ? "text-primary-foreground/80" : "text-muted-foreground"
                )}>
                  {new Date(chat.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </div>
            
            <div className="flex justify-between items-center gap-2">
              <p className={cn(
                "text-sm truncate",
                selectedChatId === chat.id ? "text-primary-foreground/90" : "text-muted-foreground"
              )}>
                {chat.lastMessage?.text || 'No messages yet'}
              </p>
              {chat.unreadCount > 0 && selectedChatId !== chat.id && (
                <Badge variant="default" className="h-5 min-w-5 flex items-center justify-center px-1 rounded-full text-[10px]">
                  {chat.unreadCount}
                </Badge>
              )}
            </div>
          </div>
        </div>
      ))}
      
      {chats.length === 0 && (
        <div className="p-4 text-center text-sm text-muted-foreground">
          No chats yet
        </div>
      )}
    </div>
  );
}
