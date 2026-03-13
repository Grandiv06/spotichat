import { useEffect, useState, useRef, useMemo } from "react";
import { ChatHeader } from "./ChatHeader";
import { MessageBubble } from "./MessageBubble";
import { MessageInput } from "./MessageInput";
import { InChatSearch } from "./InChatSearch";
import { chatService } from "@/services/chat.service";
import type { Message, Chat } from "@/services/chat.service";
import { useAuthStore } from "@/store/auth.store";
import { useChatsStore } from "@/store/chats.store";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { playSendSound } from "@/lib/sounds";
import { CallScreen } from "@/features/call/CallScreen";
import { usePrivacySettingsStore } from "@/features/settings/store/privacy.store";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ChevronDown } from "lucide-react";

interface ChatAreaProps {
  chatId: string;
}

export function ChatArea({ chatId }: ChatAreaProps) {
  const { user } = useAuthStore();
  const updateLastMessage = useChatsStore((s) => s.updateLastMessage);
  const clearUnread = useChatsStore((s) => s.clearUnread);
  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const seenMessageIdsRef = useRef<Set<string>>(new Set());
  const initialScrollDoneRef = useRef(false);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);

  // Search state
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);

  // Interaction states
  const [replyingToMessage, setReplyingToMessage] = useState<Message | null>(
    null,
  );
  const [messageToDelete, setMessageToDelete] = useState<Message | null>(null);
  const [messageToForward, setMessageToForward] = useState<Message | null>(
    null,
  );
  const [pinnedMessage, setPinnedMessage] = useState<Message | null>(null);
  const [isCallOpen, setIsCallOpen] = useState(false);
  const [isBlockDialogOpen, setIsBlockDialogOpen] = useState(false);

  const { blockedUsers, setBlockedUsers } = usePrivacySettingsStore();

  // Matches (reversed so index 0 is the newest match)
  const matchedMessages = messages
    .filter((m) => m.text?.toLowerCase().includes(searchQuery.toLowerCase()))
    .reverse();
  const matchCount = searchQuery ? matchedMessages.length : 0;

  useEffect(() => {
    setCurrentMatchIndex(0);
  }, [searchQuery]);

  useEffect(() => {
    if (matchCount > 0 && isSearching) {
      const match = matchedMessages[currentMatchIndex];
      const el = document.getElementById(`msg-${match.id}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [currentMatchIndex, searchQuery, matchCount, isSearching]);

  const handleNextMatch = () => {
    setCurrentMatchIndex((prev) => Math.min(prev + 1, matchCount - 1));
  };

  const handlePrevMatch = () => {
    setCurrentMatchIndex((prev) => Math.max(prev - 1, 0));
  };

  useEffect(() => {
    const loadChat = async () => {
      setIsLoading(true);
      try {
        // Try to find the chat from the full list
        let chats = await chatService.getChats();
        let currentChat = chats.find((c) => c.id === chatId);

        // If not found, it might be a newly created chat — refetch
        if (!currentChat) {
          // Small delay to allow the server to process
          await new Promise((r) => setTimeout(r, 300));
          chats = await chatService.getChats();
          currentChat = chats.find((c) => c.id === chatId);
        }

        if (currentChat) setChat(currentChat);

        const msgs = await chatService.getMessages(chatId);
        setMessages(msgs);

        if (user) {
          const fromOther = msgs.filter((m) => m.senderId !== user.id);
          for (const m of fromOther) {
            if (m.status === "sent") {
              chatService.markDelivered(m.id);
            }
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };

    loadChat();
  }, [chatId, user?.id]);

  useEffect(() => {
    seenMessageIdsRef.current = new Set();
    initialScrollDoneRef.current = false;
  }, [chatId]);

  // Subscribe to real-time WebSocket events for this chat
  useEffect(() => {
    const unsubMessage = chatService.onNewMessage((message) => {
      if (message.chatId !== chatId) return;

      const isFromOther = message.senderId !== user?.id;

      const container = messagesContainerRef.current;
      const wasAtBottom = container
        ? container.scrollHeight - container.scrollTop - container.clientHeight < 80
        : true;

      setMessages((prev) => {
        if (prev.some((m) => m.id === message.id)) return prev;
        return [...prev, message];
      });

      // فقط وقتی کاربر پایین چت بود بعد از پیام جدید اسکرول کن (مثل تلگرام)
      if (container && wasAtBottom) {
        const scrollToBottom = () => {
          container.scrollTo({
            top: container.scrollHeight,
            behavior: "smooth",
          });
        };
        requestAnimationFrame(() => {
          requestAnimationFrame(scrollToBottom);
        });
      }

      if (isFromOther) {
        chatService.markDelivered(message.id);
      }
    });

    const unsubStatus = chatService.onMessageStatus((data) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === data.id ? { ...m, status: data.status as any } : m,
        ),
      );
    });

    return () => {
      unsubMessage();
      unsubStatus();
    };
  }, [chatId, user?.id]);

  // Telegram: after load, open at first unread (and stay there) or at bottom if no unread
  useEffect(() => {
    if (isLoading || messages.length === 0 || initialScrollDoneRef.current) return;
    const container = messagesContainerRef.current;
    if (!container) return;

    const fromOther = messages.filter((m) => m.senderId !== user?.id);
    const unread = fromOther.filter((m) => m.status !== "seen");

    if (unread.length > 0) {
      const firstUnread = unread[0];
      requestAnimationFrame(() => {
        const el = document.getElementById(`msg-${firstUnread.id}`);
        if (el) el.scrollIntoView({ block: "start", behavior: "auto" });
      });
    } else {
      container.scrollTo({ top: container.scrollHeight, behavior: "auto" });
    }
    initialScrollDoneRef.current = true;
    clearUnread(chatId);
  }, [chatId, isLoading, messages, user?.id, clearUnread]);

  // Track if user is at bottom (for FAB and for auto-scroll on new message)
  const checkAtBottom = () => {
    const container = messagesContainerRef.current;
    if (!container) return true;
    const { scrollTop, clientHeight, scrollHeight } = container;
    return scrollHeight - scrollTop - clientHeight < 80;
  };

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const onScroll = () => setShowScrollToBottom(!checkAtBottom());
    container.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => container.removeEventListener("scroll", onScroll);
  }, [chatId, isLoading]);


  const isRestrictedByOther = useMemo(
    () => chat?.participant.id === "u3",
    [chat],
  );

  const isBlockedByMe = useMemo(
    () =>
      !!(
        chat &&
        blockedUsers.some((u) => u.id === chat.participant.id)
      ),
    [chat, blockedUsers],
  );

  const isChatDisabled = isLoading || !chat || isCallOpen || isBlockedByMe || isRestrictedByOther;

  const disabledPlaceholder = isBlockedByMe
    ? "You blocked this user. Unblock them from Privacy settings to send messages."
    : isRestrictedByOther
    ? "You can't send messages to this user."
    : undefined;

  const handleSend = async (
    text?: string,
    type: "text" | "voice" | "video" | "file" = "text",
    duration?: number,
  ) => {
    if (!user) return;
    if (isBlockedByMe || isRestrictedByOther) return;

    // We only need text for actual text messages
    if (type === "text" && (!text || !text.trim())) return;

    const newMsgObj: Omit<Message, "id" | "createdAt" | "status"> = {
      chatId,
      senderId: user.id,
      text: type === "text" ? text!.trim() : undefined,
      type,
      duration,
    };
    const tempId = `m_temp_${Date.now()}`;
    const optimisticMsg: Message = {
      ...newMsgObj,
      id: tempId,
      createdAt: new Date().toISOString(),
      status: "sending",
    };

    // 1. Optimistic UI update
    setMessages((prev) => [...prev, optimisticMsg]);
    
    // Smooth scroll for our own sending message
    setTimeout(() => {
      const container = messagesContainerRef.current;
      if (container) {
        container.scrollTo({
          top: container.scrollHeight,
          behavior: "smooth",
        });
      }
    }, 50);

    // Play send sound immediately on optimistic send
    playSendSound();

    try {
      // 2. Network Request
      const sentMsg = await chatService.sendMessage(newMsgObj);

      // 3. Replace temp with confirmed message and ensure no duplicates
      setMessages((prev) => {
        // Filter out the temp message
        const withoutTemp = prev.filter((m) => m.id !== tempId);
        
        // If the broadcast (onNewMessage) already added the real message, 
        // just return the list without temp.
        if (withoutTemp.some((m) => m.id === sentMsg.id)) {
          return withoutTemp;
        }
        
        // Otherwise add the confirmed message
        return [...withoutTemp, sentMsg];
      });

      updateLastMessage(chatId, sentMsg);
    } catch (e) {
      console.error(e);
      // Revert optimistic update on failure
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    }
  };

  const handleToggleReaction = (messageId: string, emoji: string) => {
    if (!user) return;
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== messageId) return m;
        const reactions = { ...(m.reactions || {}) };
        if (!reactions[emoji]) reactions[emoji] = [];

        const userIndex = reactions[emoji].indexOf(user.id);
        if (userIndex > -1) {
          reactions[emoji] = reactions[emoji].filter((id) => id !== user.id);
        } else {
          reactions[emoji] = [...reactions[emoji], user.id];
        }
        return { ...m, reactions };
      }),
    );
  };

  const handleDeleteForMe = () => {
    if (messageToDelete) {
      setMessages((prev) => prev.filter((m) => m.id !== messageToDelete.id));
      if (pinnedMessage?.id === messageToDelete.id) setPinnedMessage(null);
      setMessageToDelete(null);
    }
  };

  const handleDeleteForEveryone = () => {
    // In a real app we'd call the backend to remove it globally
    handleDeleteForMe();
  };

  if (!chat && !isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-accent/5">
        <p className="text-muted-foreground bg-background/60 px-4 py-2 rounded-full text-sm">
          Select a chat to start messaging
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full w-full bg-accent/5 relative min-h-0">
      {/* 
        We render a disabled/skeleton header if loading. 
        Note: The actual ChatHeader requires a participant, if we don't have it yet we can render a minimal fallback or just the structure.
      */}
      {chat ? (
        <ChatHeader
          participant={chat.participant}
          onToggleSearch={() => setIsSearching(true)}
          onStartCall={() => setIsCallOpen(true)}
          onBlockUser={() => setIsBlockDialogOpen(true)}
        />
      ) : (
        <div className="h-16 border-b bg-card flex items-center px-4 animate-pulse">
          <div className="h-10 w-10 bg-muted rounded-full mr-3" />
          <div className="flex flex-col gap-2">
            <div className="h-3 w-24 bg-muted rounded" />
            <div className="h-2 w-16 bg-muted rounded" />
          </div>
        </div>
      )}

      <InChatSearch
        isOpen={isSearching}
        onClose={() => {
          setIsSearching(false);
          setSearchQuery("");
        }}
        onSearch={setSearchQuery}
        matchCount={matchCount}
        currentMatchIndex={currentMatchIndex}
        onNextMatch={handleNextMatch}
        onPrevMatch={handlePrevMatch}
      />

      {/* Pinned Message Bar */}
      {pinnedMessage && (
        <div className="flex items-center gap-3 px-4 py-2 bg-background border-b border-border shadow-sm animate-in slide-in-from-top-2 z-10 absolute top-[60px] w-full left-0 md:top-[60px]">
          <div className="w-1 h-8 bg-primary rounded-full shrink-0" />
          <div
            className="flex flex-col flex-1 min-w-0 cursor-pointer"
            onClick={() => {
              const el = document.getElementById(`msg-${pinnedMessage.id}`);
              if (el)
                el.scrollIntoView({ behavior: "smooth", block: "center" });
            }}
          >
            <span className="text-xs font-semibold text-primary">
              Pinned Message
            </span>
            <span className="text-[13px] text-muted-foreground truncate">
              {pinnedMessage.text || `[${pinnedMessage.type} Message]`}
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
            onClick={() => setPinnedMessage(null)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </Button>
        </div>
      )}

      <div className="relative flex-1 min-h-0 flex flex-col mt-16 md:mt-0">
        <div
          ref={messagesContainerRef}
          className={cn(
            "flex-1 overflow-y-auto px-4 py-4 min-h-0 custom-scrollbar",
            pinnedMessage ? "pt-16" : "",
          )}
        >
          <div className="flex flex-col gap-2 min-h-full justify-end pb-2">
          {/* Simple date badge placeholder */}
          <div className="flex justify-center my-4 sticky top-0 z-10">
            <span className="bg-background/80 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium text-muted-foreground shadow-sm">
              Today
            </span>
          </div>

          {isLoading ? (
            <div className="flex flex-col gap-3">
              {[1, 2, 3, 4, 5].map((s, idx) => {
                const isMeSkeleton = idx % 2 === 1;
                return (
                  <div
                    key={s}
                    className={cn(
                      "flex w-full",
                      isMeSkeleton ? "justify-end" : "justify-start",
                    )}
                  >
                    <div className="flex flex-col max-w-[85%] sm:max-w-[75%] gap-2 animate-pulse">
                      <div
                        className={cn(
                          "px-4 py-2 rounded-2xl shadow-sm",
                          isMeSkeleton
                            ? "bg-primary/40 rounded-br-sm"
                            : "bg-card/60 border border-border/50 rounded-bl-sm",
                        )}
                      >
                        <div className="h-3 w-16 bg-foreground/20 rounded-full mb-2" />
                        <div className="h-4 w-32 bg-foreground/15 rounded-full mb-1" />
                        <div className="h-4 w-20 bg-foreground/10 rounded-full" />
                      </div>
                      <div
                        className={cn(
                          "flex items-center gap-1 mt-1",
                          isMeSkeleton
                            ? "justify-end text-primary/60"
                            : "justify-end text-muted-foreground/70",
                        )}
                      >
                        <span className="h-3 w-8 bg-foreground/10 rounded-full" />
                        {isMeSkeleton && (
                          <span className="h-3 w-3 bg-foreground/15 rounded-full" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} id={`msg-${msg.id}`}>
                <MessageBubble
                  message={msg}
                  searchQuery={searchQuery}
                  isHighlightedMatch={
                    isSearching &&
                    matchCount > 0 &&
                    matchedMessages[currentMatchIndex]?.id === msg.id
                  }
                  onReply={() => setReplyingToMessage(msg)}
                  repliedMessage={
                    msg.replyToId
                      ? messages.find((m) => m.id === msg.replyToId)
                      : undefined
                  }
                  onDeleteToggle={() => setMessageToDelete(msg)}
                  onForwardToggle={() => setMessageToForward(msg)}
                  onPinMessage={() => setPinnedMessage(msg)}
                  onToggleReaction={(emoji) =>
                    handleToggleReaction(msg.id, emoji)
                  }
                  onVisible={
                    msg.senderId !== user?.id
                      ? () => {
                          if (seenMessageIdsRef.current.has(msg.id)) return;
                          seenMessageIdsRef.current.add(msg.id);
                          chatService.markSeen(msg.id);
                        }
                      : undefined
                  }
                  scrollContainerRef={messagesContainerRef}
                />
              </div>
            ))
          )}
          </div>
        </div>
        {showScrollToBottom && (
          <Button
            type="button"
            size="icon"
            className="absolute bottom-5 right-6 h-12 w-12 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105 active:scale-95 transition-all duration-200 shadow-[0_6px_20px_rgba(0,0,0,0.2),0_2px_6px_rgba(0,0,0,0.1)] dark:shadow-[0_8px_24px_rgba(0,0,0,0.4),0_2px_8px_rgba(0,0,0,0.2)] ring-2 ring-primary/30 dark:ring-primary/40 backdrop-blur-sm animate-in zoom-in-95 fade-in duration-200"
            onClick={() => {
              messagesContainerRef.current?.scrollTo({
                top: messagesContainerRef.current.scrollHeight,
                behavior: "smooth",
              });
              setShowScrollToBottom(false);
            }}
            aria-label="برو به پایین چت"
          >
            <ChevronDown className="h-5 w-5 stroke-[2.5]" />
          </Button>
        )}
      </div>

      <MessageInput
        onSend={handleSend}
        replyingToMessage={replyingToMessage}
        onCancelReply={() => setReplyingToMessage(null)}
        disabled={isChatDisabled}
        disabledPlaceholder={disabledPlaceholder}
      />

      {/* Action Modals */}
      <Dialog
        open={!!messageToDelete}
        onOpenChange={(open) => !open && setMessageToDelete(null)}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Message</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this message? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2 mt-4">
            <Button variant="outline" onClick={() => setMessageToDelete(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteForMe}>
              Delete for me
            </Button>
            {messageToDelete?.senderId === user?.id && (
              <Button variant="destructive" onClick={handleDeleteForEveryone}>
                Delete for everyone
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Block user confirm dialog */}
      <Dialog
        open={isBlockDialogOpen}
        onOpenChange={(open) => setIsBlockDialogOpen(open)}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              Block {chat?.participant.name ?? "this user"}?
            </DialogTitle>
            <DialogDescription>
              They will no longer be able to send you messages or call you. You
              can unblock them later from Settings &gt; Privacy &amp; Security &gt;
              Blocked Users.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setIsBlockDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (!chat) return;
                const existingIds = blockedUsers.map((u) => u.id);
                if (!existingIds.includes(chat.participant.id)) {
                  setBlockedUsers([...existingIds, chat.participant.id]);
                }
                setIsBlockDialogOpen(false);
              }}
            >
              Block User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Call Screen Overlay */}
      {chat && (
        <CallScreen
          participant={chat.participant}
          isOpen={isCallOpen}
          onClose={() => setIsCallOpen(false)}
        />
      )}

      <Dialog
        open={!!messageToForward}
        onOpenChange={(open) => !open && setMessageToForward(null)}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Forward Message</DialogTitle>
            <DialogDescription>
              Select a conversation to forward this message to.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2 py-4">
            <p className="text-sm text-muted-foreground text-center italic">
              Forwarding chat list placeholder...
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMessageToForward(null)}>
              Cancel
            </Button>
            <Button variant="default" onClick={() => setMessageToForward(null)}>
              Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
