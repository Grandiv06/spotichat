import React, { useEffect, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { chatService } from '@/services/chat.service';
import type { Chat } from '@/services/chat.service';
import { useOnlineStore } from '@/store/online.store';
import { useAuthStore } from '@/store/auth.store';
import { cn } from '@/lib/utils';

export function OnlineRow() {
  const { user } = useAuthStore();
  const { isOnline } = useOnlineStore();
  const [chats, setChats] = useState<Chat[]>([]);

  useEffect(() => {
    let cancelled = false;
    chatService.getChats().then((data) => {
      if (!cancelled) setChats(data);
    });
    return () => { cancelled = true; };
  }, []);

  const onlineFromChats = chats.filter(
    (c) => c.participant?.id && c.participant.id !== user?.id && isOnline(c.participant.id),
  );

  if (onlineFromChats.length === 0) return null;

  return (
    <div className="px-4 py-2 border-b border-sidebar-border/50">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
        Online
      </p>
      <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-1">
        {onlineFromChats.map((chat) => (
          <div
            key={chat.id}
            className="flex flex-col items-center flex-shrink-0 cursor-pointer"
          >
            <div className="relative mb-1">
              <Avatar className="h-12 w-12 border-2 border-background shadow-sm">
                <AvatarImage src={chat.participant.avatar} />
                <AvatarFallback className="text-sm bg-primary/10 text-primary">
                  {chat.participant.name?.charAt(0) || '?'}
                </AvatarFallback>
              </Avatar>
              <span
                className={cn(
                  "absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background",
                  "bg-green-500",
                )}
                title="Online"
              />
            </div>
            <span className="text-[11px] font-medium text-muted-foreground truncate max-w-[56px]">
              {chat.participant.name || 'User'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
