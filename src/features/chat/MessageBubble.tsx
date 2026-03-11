import { Check, CheckCheck, Clock } from 'lucide-react';
import type { Message } from '@/services/chat.service';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';
import { AudioMessage } from './AudioMessage';

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const { user } = useAuthStore();
  const isMe = user?.id === message.senderId;

  const time = new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className={cn("flex w-full mb-2", isMe ? "justify-end" : "justify-start")}>
      <div 
        className={cn(
          "max-w-[85%] sm:max-w-[75%] px-4 py-2 rounded-2xl relative group shadow-sm",
          isMe 
            ? "bg-primary text-primary-foreground rounded-br-sm" 
            : "bg-card border border-border text-card-foreground rounded-bl-sm"
        )}
      >
        {message.type === 'voice' ? (
          <AudioMessage isMe={isMe} status={message.status} />
        ) : message.type === 'video' ? (
          <div className="w-48 h-48 bg-black/20 rounded-full flex items-center justify-center">Video Message</div>
        ) : (
          <div className="text-[15px] leading-relaxed break-words break-all whitespace-pre-wrap">
            {message.text || `[Empty ${message.type} message]`}
          </div>
        )}
        
        <div className={cn(
          "flex items-center justify-end gap-1 mt-1 -mb-1",
          isMe ? "text-primary-foreground/70" : "text-muted-foreground"
        )}>
          <span className="text-[11px] leading-none">{time}</span>
          {isMe && (
            <span className="ml-0.5">
              {message.status === 'sending' && <Clock className="h-3 w-3" />}
              {message.status === 'sent' && <Check className="h-4 w-4" />}
              {(message.status === 'delivered' || message.status === 'seen') && (
                <CheckCheck className={cn("h-4 w-4", message.status === 'seen' && "text-blue-400")} />
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
