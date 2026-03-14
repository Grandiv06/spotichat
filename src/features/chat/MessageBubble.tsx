import { memo, useState, useRef } from 'react';
import { Check, CheckCheck, Clock, Copy, Reply, Pin, Forward, Trash2 } from 'lucide-react';
import type { Message } from '@/services/chat.service';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';
import { useMessageStatusStore } from '@/store/message-status.store';
import { AudioMessage } from './AudioMessage';
import { VideoMessage } from './VideoMessage';
import { useLongPressMenu } from './hooks/useLongPressMenu';
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
  isMenuOpen?: boolean;
  isReplyJumpHighlighted?: boolean;
  onReply?: () => void;
  repliedMessage?: Message;
  currentUserId?: string;
  otherParticipantName?: string;
  onJumpToMessage?: (messageId: string) => void;
  onDeleteToggle?: () => void;
  onForwardToggle?: () => void;
  onPinMessage?: () => void;
  onToggleReaction?: (emoji: string) => void;
  onMenuOpenChange?: (open: boolean) => void;
}

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

function isMediaControlTarget(target: EventTarget | null): target is HTMLElement {
  return (
    target instanceof HTMLElement &&
    target.closest('[data-media-control="true"]') !== null
  );
}

function MessageBubbleComponent({ 
  message, 
  searchQuery, 
  isHighlightedMatch,
  isMenuOpen = false,
  isReplyJumpHighlighted = false,
  onReply, 
  repliedMessage,
  currentUserId,
  otherParticipantName,
  onJumpToMessage,
  onDeleteToggle,
  onForwardToggle,
  onPinMessage,
  onToggleReaction,
  onMenuOpenChange,
}: MessageBubbleProps) {
  const { user } = useAuthStore();
  const storeStatus = useMessageStatusStore((s) => s.getStatus(message.id));
  const status = storeStatus ?? message.status;
  const isMe = user?.id === message.senderId;
  const [translateX, setTranslateX] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const { gestureHandlers, shouldAllowMenuOpenRequest } = useLongPressMenu<HTMLDivElement>({
    onLongPress: () => {
      onMenuOpenChange?.(true);
    },
  });

  const handlePointerDown = (e: React.PointerEvent) => {
    if (isMediaControlTarget(e.target)) {
      touchStartX.current = null;
      return;
    }

    touchStartX.current = e.clientX;
    if (e.pointerType === 'mouse') {
      e.currentTarget.setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isMediaControlTarget(e.target)) return;
    if (touchStartX.current === null) return;
    const diff = e.clientX - touchStartX.current;
    
    // Only allow left swipe up to 60px
    if (diff < 0) {
      setTranslateX(Math.max(diff, -60));
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isMediaControlTarget(e.target)) {
      setTranslateX(0);
      touchStartX.current = null;
      return;
    }

    if (translateX <= -40 && onReply) {
      onReply();
    }
    setTranslateX(0);
    touchStartX.current = null;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  const handlePointerCancel = (e: React.PointerEvent) => {
    if (isMediaControlTarget(e.target)) {
      setTranslateX(0);
      touchStartX.current = null;
      return;
    }

    setTranslateX(0);
    touchStartX.current = null;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  const handleCopy = () => {
    if (message.text) navigator.clipboard.writeText(message.text);
  };

  const time = new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Calculate reaction summaries
  const reactionsSummary = message.reactions ? Object.entries(message.reactions).filter(([, users]) => users.length > 0) : [];
  const getPreviewText = (msg: Message) => {
    if (msg.type === 'text') return msg.text || 'Message';
    if (msg.type === 'voice') return 'Voice message';
    if (msg.type === 'video') return 'Video';
    if (msg.type === 'file') return 'File';
    return 'Message';
  };
  const getTypeFallbackText = (type?: Message["type"]) => {
    if (type === 'voice') return 'Voice message';
    if (type === 'video') return 'Video';
    if (type === 'file') return 'File';
    if (type === 'text') return 'Message';
    return '';
  };
  const hasReplyBlock = Boolean(repliedMessage || message.replyToId);
  const replyTargetId = repliedMessage?.id ?? message.replyToId;
  const replySenderName = repliedMessage
    ? repliedMessage.senderId === currentUserId
      ? 'You'
      : otherParticipantName || 'Participant'
    : message.replyToSenderName || 'Original message';
  const replyPreviewText = repliedMessage
    ? getPreviewText(repliedMessage)
    : message.replyToMessagePreview ||
      getTypeFallbackText(message.replyToMessageType) ||
      'Original message unavailable';

  return (
    <div
      ref={rootRef}
      className={cn(
        "flex w-full mb-2",
        isMe ? "justify-end" : "justify-start overflow-hidden",
        status === "sending" && "message-send-enter",
      )}
    >
      <DropdownMenu
        open={isMenuOpen}
        onOpenChange={(nextOpen) => {
          if (!shouldAllowMenuOpenRequest(nextOpen)) return;
          onMenuOpenChange?.(nextOpen);
        }}
      >
        <DropdownMenuTrigger asChild>
          <div
            className="message-ui-surface flex flex-col max-w-[85%] sm:max-w-[75%] outline-none"
            {...gestureHandlers}
            onContextMenu={(event) => {
              if (
                typeof window !== "undefined" &&
                window.matchMedia("(hover: none) and (pointer: coarse)").matches
              ) {
                event.preventDefault();
              }
            }}
          >
            <div 
              className={cn(
                "message-ui-surface px-4 py-2 rounded-2xl relative group shadow-sm transition-all cursor-pointer",
                translateX === 0 && "duration-200", // smooth snap back
                isMe 
                  ? "bg-primary text-primary-foreground rounded-br-sm" 
                  : "bg-card border border-border text-card-foreground rounded-bl-sm",
                isMenuOpen && "ring-2 ring-primary/35 ring-offset-2 ring-offset-background",
                isReplyJumpHighlighted && "message-jump-highlight",
                isHighlightedMatch && "ring-2 ring-ring ring-offset-2 ring-offset-background scale-[1.02]"
              )}
              style={{ transform: `translateX(${translateX}px)`, touchAction: 'pan-y' }}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerCancel}
            >
        {hasReplyBlock && (
           <div 
             className="message-ui-surface cursor-pointer mb-2 flex flex-col border-l-2 border-primary/50 pl-2 opacity-80 hover:opacity-100 transition-opacity"
             onClick={(e) => {
               e.stopPropagation();
               if (!replyTargetId) return;
               onJumpToMessage?.(replyTargetId);
             }}
           >
             <span className="text-[11px] font-semibold text-primary">{replySenderName}</span>
             <span className="text-[13px] truncate">
               {replyPreviewText}
             </span>
           </div>
        )}
        {message.type === 'voice' ? (
          <AudioMessage
            isMe={isMe}
            status={status as 'sending' | 'sent' | 'delivered' | 'seen'}
            duration={message.duration}
            audioUrl={message.fileUrl}
            messageId={message.id}
          />
        ) : message.type === 'video' ? (
          <VideoMessage
            isMe={isMe}
            status={status as 'sending' | 'sent' | 'delivered' | 'seen'}
            videoUrl={message.fileUrl}
            duration={message.duration}
          />
        ) : (
          <div className="message-ui-surface text-[15px] leading-relaxed break-words break-all whitespace-pre-wrap">
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
              "message-ui-surface flex items-center justify-end gap-1 mt-1 -mb-1",
              isMe ? "text-primary-foreground/70" : "text-muted-foreground",
            )}
          >
            <span className="text-[11px] leading-none">{time}</span>
            {isMe && (
              <span
                className={cn(
                  "ml-0.5 mt-0.5 inline-flex h-4 w-4 items-center justify-center relative overflow-visible",
                  "transition-colors duration-300 ease-out",
                  status === "seen"
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-current",
                )}
              >
                <Clock
                  className={cn(
                    "h-3.5 w-3.5 absolute transition-all duration-300 ease-out",
                    status === "sending"
                      ? "opacity-100 scale-100 translate-y-0"
                      : "opacity-0 scale-75 -translate-y-1",
                  )}
                />
                <Check
                  className={cn(
                    "h-4 w-4 absolute transition-all duration-300 ease-out",
                    status === "sent"
                      ? "opacity-100 scale-100 translate-y-0"
                      : "opacity-0 scale-75 translate-y-1",
                  )}
                />
                <CheckCheck
                  className={cn(
                    "h-4 w-4 absolute transition-all duration-300 ease-out",
                    status === "delivered" || status === "seen"
                      ? "opacity-100 scale-100 translate-y-0"
                      : "opacity-0 scale-75 translate-y-1",
                  )}
                />
              </span>
            )}
          </div>
        </div>

        {/* Reaction Badges */}
        {reactionsSummary.length > 0 && (
          <div className={cn("message-ui-surface flex flex-wrap gap-1 mt-1", isMe ? "justify-end" : "justify-start")}>
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

function areEqual(prev: MessageBubbleProps, next: MessageBubbleProps) {
  const prevReplyId = prev.repliedMessage?.id;
  const nextReplyId = next.repliedMessage?.id;

  return (
    prev.message === next.message &&
    prev.searchQuery === next.searchQuery &&
    prev.isHighlightedMatch === next.isHighlightedMatch &&
    prev.isMenuOpen === next.isMenuOpen &&
    prev.isReplyJumpHighlighted === next.isReplyJumpHighlighted &&
    prevReplyId === nextReplyId
  );
}

export const MessageBubble = memo(MessageBubbleComponent, areEqual);
MessageBubble.displayName = 'MessageBubble';
