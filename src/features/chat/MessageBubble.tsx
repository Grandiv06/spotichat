import { useState, useRef } from 'react';
import { Check, CheckCheck, Clock, Copy, Reply, Pin, Forward, Trash2 } from 'lucide-react';
import type { Message } from '@/services/chat.service';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';
import { AudioMessage } from './AudioMessage';
import { VideoMessage } from './VideoMessage';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const EMOJI_LIST = ['👍', '❤️', '😂', '😮', '😢', '🔥'];

interface MessageBubbleProps {
  message: Message;
  searchQuery?: string;
  isHighlightedMatch?: boolean;
  onReply?: () => void;
  repliedMessage?: Message;
  onDeleteToggle?: () => void;
  onForwardToggle?: () => void;
  onPinMessage?: () => void;
  onToggleReaction?: (emoji: string) => void;
}

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

export function MessageBubble({ 
  message, 
  searchQuery, 
  isHighlightedMatch,
  onReply, 
  repliedMessage,
  onDeleteToggle,
  onForwardToggle,
  onPinMessage,
  onToggleReaction,
}: MessageBubbleProps) {
  const { user } = useAuthStore();
  const isMe = user?.id === message.senderId;
  const [translateX, setTranslateX] = useState(0);
  const touchStartX = useRef<number | null>(null);

  const handlePointerDown = (e: React.PointerEvent) => {
    touchStartX.current = e.clientX;
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (touchStartX.current === null) return;
    const diff = e.clientX - touchStartX.current;
    
    // Only allow left swipe up to 60px
    if (diff < 0) {
      setTranslateX(Math.max(diff, -60));
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (translateX <= -40 && onReply) {
      onReply();
    }
    setTranslateX(0);
    touchStartX.current = null;
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const handleCopy = () => {
    if (message.text) navigator.clipboard.writeText(message.text);
  };

  const time = new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Calculate reaction summaries
  const reactionsSummary = message.reactions ? Object.entries(message.reactions).filter(([, users]) => users.length > 0) : [];

  return (
    <div
      className={cn(
        "flex w-full mb-2",
        isMe ? "justify-end" : "justify-start overflow-hidden",
        // Telegram-style "pop up" animation for newly sent messages
        message.status === 'sending' && "animate-in slide-in-from-bottom-2 fade-in duration-200",
      )}
    >
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div className="flex flex-col max-w-[85%] sm:max-w-[75%] outline-none">
            <div 
              className={cn(
                "px-4 py-2 rounded-2xl relative group shadow-sm transition-all cursor-pointer",
                translateX === 0 && "duration-200", // smooth snap back
                isMe 
                  ? "bg-primary text-primary-foreground rounded-br-sm" 
                  : "bg-card border border-border text-card-foreground rounded-bl-sm",
                isHighlightedMatch && "ring-2 ring-ring ring-offset-2 ring-offset-background scale-[1.02]"
              )}
              style={{ transform: `translateX(${translateX}px)`, touchAction: 'pan-y' }}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
            >
        {repliedMessage && (
           <div 
             className="cursor-pointer mb-2 flex flex-col border-l-2 border-primary/50 pl-2 opacity-80 hover:opacity-100 transition-opacity"
             onClick={(e) => {
               e.stopPropagation();
               const el = document.getElementById(`msg-${repliedMessage.id}`);
               if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
             }}
           >
             <span className="text-[11px] font-semibold text-primary">{isMe && repliedMessage.senderId === user?.id ? 'You' : 'Participant'}</span>
             <span className="text-[13px] truncate">
               {repliedMessage.text || `[${repliedMessage.type} Message]`}
             </span>
           </div>
        )}
        {message.type === 'voice' ? (
          <AudioMessage isMe={isMe} status={message.status} duration={message.duration} />
        ) : message.type === 'video' ? (
          <VideoMessage isMe={isMe} status={message.status} videoUrl={message.fileUrl} duration={message.duration} />
        ) : (
          <div className="text-[15px] leading-relaxed break-words break-all whitespace-pre-wrap">
            {(() => {
              const text = message.text || `[Empty ${message.type} message]`;
              if (!searchQuery) return text;
              
              const parts = text.split(new RegExp(`(${escapeRegExp(searchQuery)})`, 'gi'));
              return parts.map((part, i) => 
                part.toLowerCase() === searchQuery.toLowerCase() 
                  ? <span key={i} className="bg-yellow-400/80 text-yellow-900 rounded-sm px-0.5">{part}</span>
                  : part
              );
            })()}
          </div>
        )}
        
          <div
            className={cn(
              "flex items-center justify-end gap-1 mt-1 -mb-1",
              isMe ? "text-primary-foreground/70" : "text-muted-foreground",
            )}
          >
            <span className="text-[11px] leading-none">{time}</span>
            {isMe && (
              <span
                className={cn(
                  "ml-0.5 mt-0.5 inline-flex h-4 w-4 items-center justify-center relative overflow-hidden",
                  message.status === "seen" && "text-blue-600 dark:text-blue-400",
                )}
              >
                <Clock
                  className={cn(
                    "h-3.5 w-3.5 absolute transition-all duration-200",
                    message.status === "sending"
                      ? "opacity-100 translate-y-0"
                      : "opacity-0 -translate-y-1",
                  )}
                />
                <Check
                  className={cn(
                    "h-4 w-4 absolute transition-all duration-200",
                    message.status === "sent"
                      ? "opacity-100 translate-y-0"
                      : "opacity-0 translate-y-1",
                  )}
                />
                <CheckCheck
                  className={cn(
                    "h-4 w-4 absolute transition-all duration-200",
                    message.status === "delivered" || message.status === "seen"
                      ? "opacity-100 translate-y-0"
                      : "opacity-0 translate-y-1",
                  )}
                />
              </span>
            )}
          </div>
        </div>

        {/* Reaction Badges */}
        {reactionsSummary.length > 0 && (
          <div className={cn("flex flex-wrap gap-1 mt-1", isMe ? "justify-end" : "justify-start")}>
            {reactionsSummary.map(([emoji, users]) => {
              const hasReacted = user && users.includes(user.id);
              return (
                <div 
                  key={emoji}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleReaction?.(emoji);
                  }}
                  className={cn(
                    "flex items-center justify-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold cursor-pointer border shadow-sm transition-colors",
                    hasReacted 
                       ? "bg-primary/20 border-primary/30 text-primary" 
                       : "bg-card border-border text-muted-foreground hover:bg-accent"
                  )}
                >
                  <span className="text-[13px] leading-none">{emoji}</span>
                  {users.length > 1 && <span className="text-[11px] leading-none">{users.length}</span>}
                </div>
              );
            })}
          </div>
        )}
      </div>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent className="w-56" align={isMe ? "end" : "start"} sideOffset={5}>
        {/* Inline Emoji Row */}
        <div className="flex items-center justify-between px-2 py-2 mb-1">
          {EMOJI_LIST.map((emoji) => (
            <div 
              key={emoji} 
              onClick={() => onToggleReaction?.(emoji)}
              className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer hover:bg-accent hover:scale-125 transition-all text-lg"
            >
              {emoji}
            </div>
          ))}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onReply} className="cursor-pointer gap-2">
          <Reply className="h-4 w-4" /> Reply
        </DropdownMenuItem>
        {message.type === 'text' && (
          <DropdownMenuItem onClick={handleCopy} className="cursor-pointer gap-2">
            <Copy className="h-4 w-4" /> Copy Text
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={onPinMessage} className="cursor-pointer gap-2">
          <Pin className="h-4 w-4" /> Pin Message
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onForwardToggle} className="cursor-pointer gap-2">
          <Forward className="h-4 w-4" /> Forward Message
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onDeleteToggle} className="cursor-pointer gap-2 text-destructive focus:text-destructive focus:bg-destructive/10">
          <Trash2 className="h-4 w-4" /> Delete Message
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>
  );
}
