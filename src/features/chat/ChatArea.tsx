import {
  useEffect,
  useLayoutEffect,
  useState,
  useRef,
  useMemo,
  Fragment,
  useCallback,
} from "react";
import { ChatHeader } from "./ChatHeader";
import { MessageBubble } from "./MessageBubble";
import { MessageInput } from "./MessageInput";
import { InChatSearch } from "./InChatSearch";
import { GlobalMediaPlayerBar } from "./GlobalMediaPlayerBar";
import { chatService } from "@/services/chat.service";
import type { Message, Chat } from "@/services/chat.service";
import { useAuthStore } from "@/store/auth.store";
import { useChatsStore } from "@/store/chats.store";
import { useMessageStatusStore } from "@/store/message-status.store";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { playSendSound } from "@/lib/sounds";
import { CallScreen } from "@/features/call/CallScreen";
import { usePrivacySettingsStore } from "@/features/settings/store/privacy.store";
import { settingsService } from "@/services/settings.service";
import { useUnreadTracking } from "./hooks/useUnreadTracking";
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

type PlaybackSpeed = 1 | 1.5 | 2;

interface MediaQueueItem {
  id: string;
  type: "voice" | "video";
  duration?: number;
}

interface MediaPlaybackState {
  queue: MediaQueueItem[];
  currentIndex: number;
  isPlaying: boolean;
  speed: PlaybackSpeed;
  progress: number;
  elapsedSeconds: number;
  totalSeconds: number;
  autoContinue: boolean;
}

export function ChatArea({ chatId }: ChatAreaProps) {
  const { user } = useAuthStore();
  const updateLastMessage = useChatsStore((s) => s.updateLastMessage);
  const setUnreadCount = useChatsStore((s) => s.setUnreadCount);
  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesRef = useRef<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const unreadSeparatorRef = useRef<HTMLDivElement>(null);
  const seenMessageIdsRef = useRef<Set<string>>(new Set());
  const isComposerFocusedRef = useRef(false);
  const initialScrollDoneRef = useRef(false);
  const pendingSeenIdsRef = useRef<Set<string>>(new Set());
  const seenFlushTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastAutoScrollAtRef = useRef(0);
  const stableRenderKeyByMessageIdRef = useRef<Map<string, string>>(new Map());
  const [entryUnreadIds, setEntryUnreadIds] = useState<Set<string>>(new Set());
  const [entryUnreadBoundaryId, setEntryUnreadBoundaryId] = useState<string | null>(null);

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
  const [activeMessageMenuId, setActiveMessageMenuId] = useState<string | null>(null);
  const [jumpHighlightedMessageId, setJumpHighlightedMessageId] = useState<string | null>(null);
  const [otherActivity, setOtherActivity] = useState<
    "typing" | "voice" | "video" | null
  >(null);
  const [mediaPlayback, setMediaPlayback] = useState<MediaPlaybackState>({
    queue: [],
    currentIndex: 0,
    isPlaying: false,
    speed: 1,
    progress: 0,
    elapsedSeconds: 0,
    totalSeconds: 0,
    autoContinue: true,
  });
  const otherTypingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const jumpHighlightTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { blockedUserIds, blockedByUserIds, setBlockedUsers, addBlockedByUser } =
    usePrivacySettingsStore();

  // Matches (reversed so index 0 is the newest match)
  const matchedMessages = messages
    .filter((m) => m.text?.toLowerCase().includes(searchQuery.toLowerCase()))
    .reverse();
  const matchCount = searchQuery ? matchedMessages.length : 0;
  const messageById = useMemo(
    () => new Map(messages.map((m) => [m.id, m] as const)),
    [messages],
  );
  const activeMediaItem = mediaPlayback.queue[mediaPlayback.currentIndex] ?? null;

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
        const addBlockedByUser = usePrivacySettingsStore.getState().addBlockedByUser;
        chats.forEach((c) => {
          if (c.blockedByThem && c.participant?.id) addBlockedByUser(c.participant.id);
        });

        const msgs = await chatService.getMessages(chatId);
        setMessages(msgs);
        const initialUnreadIds = msgs
          .filter(
            (m) =>
              m.senderId !== user?.id &&
              m.status !== "seen" &&
              m.status !== "sending",
          )
          .map((m) => m.id);
        setEntryUnreadIds(
          new Set(initialUnreadIds),
        );
        setEntryUnreadBoundaryId(initialUnreadIds[0] ?? null);

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
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    seenMessageIdsRef.current = new Set();
    initialScrollDoneRef.current = false;
    setEntryUnreadIds(new Set());
    setEntryUnreadBoundaryId(null);
    setActiveMessageMenuId(null);
    setReplyingToMessage(null);
    setJumpHighlightedMessageId(null);
    setMediaPlayback((prev) => ({
      ...prev,
      queue: [],
      currentIndex: 0,
      isPlaying: false,
      progress: 0,
      elapsedSeconds: 0,
      totalSeconds: 0,
      autoContinue: true,
    }));
  }, [chatId]);

  useEffect(() => {
    if (!activeMessageMenuId) return;
    if (messages.some((message) => message.id === activeMessageMenuId)) return;
    setActiveMessageMenuId(null);
  }, [activeMessageMenuId, messages]);

  useEffect(() => {
    return () => {
      if (jumpHighlightTimeoutRef.current) {
        clearTimeout(jumpHighlightTimeoutRef.current);
      }
    };
  }, []);

  const isNearBottom = useCallback((threshold = 120) => {
    const container = messagesContainerRef.current;
    if (!container) return true;
    return (
      container.scrollHeight - container.scrollTop - container.clientHeight <
      threshold
    );
  }, []);

  const stickToBottom = useCallback((preferSmooth = true) => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const now = performance.now();
    const shouldSmooth =
      preferSmooth && now - lastAutoScrollAtRef.current > 280;
    lastAutoScrollAtRef.current = now;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        container.scrollTo({
          top: container.scrollHeight,
          behavior: shouldSmooth ? "smooth" : "auto",
        });
      });
    });
  }, []);

  const keepLatestMessageAboveKeyboard = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        container.scrollTo({ top: container.scrollHeight, behavior: "auto" });
      });
    });
  }, []);

  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;

    const handleViewportChange = () => {
      if (!isComposerFocusedRef.current) return;
      keepLatestMessageAboveKeyboard();
    };

    viewport.addEventListener("resize", handleViewportChange);
    viewport.addEventListener("scroll", handleViewportChange);
    return () => {
      viewport.removeEventListener("resize", handleViewportChange);
      viewport.removeEventListener("scroll", handleViewportChange);
    };
  }, [keepLatestMessageAboveKeyboard]);

  const getStableMessageKey = useCallback((messageId: string) => {
    return stableRenderKeyByMessageIdRef.current.get(messageId) ?? messageId;
  }, []);

  useEffect(() => {
    // Cleanup stale stable keys to avoid unbounded growth.
    const activeIds = new Set(messages.map((m) => m.id));
    const map = stableRenderKeyByMessageIdRef.current;
    for (const id of map.keys()) {
      if (!activeIds.has(id)) map.delete(id);
    }
  }, [messages]);

  // Join chat room so we receive typing/status events from the other user
  useEffect(() => {
    if (!chatId) return;
    chatService.joinChat(chatId);
    return () => {
      chatService.leaveChat(chatId);
    };
  }, [chatId]);

  // Subscribe to real-time WebSocket events for this chat
  useEffect(() => {
    const unsubMessage = chatService.onNewMessage((message) => {
      if (message.chatId !== chatId) return;
      if (messagesRef.current.some((m) => m.id === message.id)) return;

      const isFromOther = message.senderId !== user?.id;
      const wasAtBottom = isNearBottom(140);

      setMessages((prev) => {
        // Reconcile realtime echo of our own optimistic message in-place.
        if (!isFromOther) {
          const tempIndex = prev.findIndex(
            (m) =>
              m.id.startsWith("m_temp_") &&
              m.senderId === message.senderId &&
              m.type === message.type &&
              (m.text ?? "") === (message.text ?? "") &&
              (m.duration ?? 0) === (message.duration ?? 0),
          );
          if (tempIndex > -1) {
            const tempId = prev[tempIndex].id;
            stableRenderKeyByMessageIdRef.current.set(message.id, tempId);
            const next = [...prev];
            next[tempIndex] = message;
            return next;
          }
        }
        return [...prev, message];
      });

      if (wasAtBottom) {
        // Prevent scroll jitter during rapid outgoing messages.
        stickToBottom(isFromOther);
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
  }, [chatId, user?.id, isNearBottom, stickToBottom]);

  // Listen for typing / recording events from the other user (Telegram-style).
  // Each typing:start resets the hide timer so the indicator stays while they keep sending heartbeats.
  useEffect(() => {
    const HIDE_AFTER_MS = 5500; // Slightly longer than sender's 2s heartbeat so it doesn't flicker

    const unsubStart = chatService.onTypingStart(
      ({ chatId: cid, userId, kind }) => {
        if (cid !== chatId || userId === user?.id) return;
        const mapped: "typing" | "voice" | "video" =
          kind === "voice" ? "voice" : kind === "video" ? "video" : "typing";
        setOtherActivity(mapped);
        if (otherTypingTimeoutRef.current) clearTimeout(otherTypingTimeoutRef.current);
        otherTypingTimeoutRef.current = setTimeout(() => {
          setOtherActivity(null);
          otherTypingTimeoutRef.current = null;
        }, HIDE_AFTER_MS);
      },
    );

    const unsubStop = chatService.onTypingStop(
      ({ chatId: cid, userId }) => {
        if (cid !== chatId || userId === user?.id) return;
        setOtherActivity(null);
        if (otherTypingTimeoutRef.current) {
          clearTimeout(otherTypingTimeoutRef.current);
          otherTypingTimeoutRef.current = null;
        }
      },
    );

    return () => {
      unsubStart();
      unsubStop();
      if (otherTypingTimeoutRef.current) {
        clearTimeout(otherTypingTimeoutRef.current);
        otherTypingTimeoutRef.current = null;
      }
    };
  }, [chatId, user?.id]);

  // Flush pending markSeen to backend (debounced) so we don't spam Socket.io
  const flushPendingSeen = useRef(() => {
    if (pendingSeenIdsRef.current.size === 0) return;
    const ids = Array.from(pendingSeenIdsRef.current);
    pendingSeenIdsRef.current.clear();
    ids.forEach((id) => chatService.markSeen(id));
  });

  const markMessagesSeen = useCallback((messageIds: string[]) => {
    if (messageIds.length === 0) return;

    const idsToMark = messageIds.filter((id) => !seenMessageIdsRef.current.has(id));
    if (idsToMark.length === 0) return;

    idsToMark.forEach((id) => seenMessageIdsRef.current.add(id));
    const seenSet = new Set(idsToMark);

    setMessages((prev) =>
      prev.map((m) => (seenSet.has(m.id) ? { ...m, status: "seen" as const } : m)),
    );

    idsToMark.forEach((id) => {
      useMessageStatusStore.getState().setStatus(id, "seen");
      pendingSeenIdsRef.current.add(id);
    });
    setEntryUnreadIds((prev) => {
      if (prev.size === 0) return prev;
      const next = new Set(prev);
      let changed = false;
      for (const id of idsToMark) {
        if (next.delete(id)) changed = true;
      }
      return changed ? next : prev;
    });

    if (seenFlushTimeoutRef.current) clearTimeout(seenFlushTimeoutRef.current);
    seenFlushTimeoutRef.current = setTimeout(() => {
      seenFlushTimeoutRef.current = null;
      flushPendingSeen.current();
    }, 350);
  }, []);

  const {
    unreadCount,
    showScrollToBottom,
    scrollToBottom,
  } = useUnreadTracking({
    chatId,
    messages,
    currentUserId: user?.id,
    containerRef: messagesContainerRef,
    onMessagesSeen: markMessagesSeen,
  });

  const shouldShowUnreadBoundary = entryUnreadIds.size > 0 && !!entryUnreadBoundaryId;

  // Telegram: after load, scroll to "New Messages" separator (first unread) or to bottom if no unread
  useLayoutEffect(() => {
    if (isLoading || messages.length === 0 || initialScrollDoneRef.current) return;
    const container = messagesContainerRef.current;
    if (!container) return;

    const doScroll = () => {
      if (shouldShowUnreadBoundary && unreadSeparatorRef.current) {
        unreadSeparatorRef.current.scrollIntoView({ block: "start", behavior: "auto" });
      } else {
        container.scrollTo({ top: container.scrollHeight, behavior: "auto" });
      }
      initialScrollDoneRef.current = true;
    };
    // Wait for layout so separator ref is attached and container has correct scrollHeight
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(doScroll);
    });
    return () => cancelAnimationFrame(id);
  }, [isLoading, messages.length, shouldShowUnreadBoundary]);

  useEffect(() => {
    if (isLoading) return;
    setUnreadCount(chatId, unreadCount);
  }, [chatId, unreadCount, setUnreadCount, isLoading]);

  useEffect(() => {
    return () => {
      if (seenFlushTimeoutRef.current) clearTimeout(seenFlushTimeoutRef.current);
      flushPendingSeen.current();
    };
  }, [chatId]);
  // Badge "New Messages" stays until unread incoming messages become visible in viewport.

  const isRestrictedByOther = useMemo(
    () => !!(chat?.participant && blockedByUserIds.includes(chat.participant.id)),
    [chat, blockedByUserIds],
  );

  const isBlockedByMe = useMemo(
    () =>
      !!(chat?.participant && blockedUserIds.includes(chat.participant.id)),
    [chat, blockedUserIds],
  );

  const isChatDisabled = isLoading || !chat || isCallOpen || isBlockedByMe || isRestrictedByOther;

  const disabledPlaceholder = isBlockedByMe
    ? "You blocked this user."
    : isRestrictedByOther
    ? "You can't send messages to this user."
    : undefined;

  const getMessageSenderName = useCallback((message: Message) => {
    if (message.senderId === user?.id) return "You";
    return chat?.participant?.name || "Participant";
  }, [user?.id, chat?.participant?.name]);

  const getMessagePreviewText = useCallback((message: Message) => {
    if (message.type === "text") return message.text || "Message";
    if (message.type === "voice") return "Voice message";
    if (message.type === "video") return "Video";
    if (message.type === "file") return "File";
    return "Message";
  }, []);

  const buildMediaQueueFrom = useCallback(
    (startMessageId: string): MediaQueueItem[] => {
      const startIndex = messages.findIndex((m) => m.id === startMessageId);
      if (startIndex < 0) return [];
      return messages
        .slice(startIndex)
        .filter((m) => m.type === "voice" || m.type === "video")
        .map((m) => ({
          id: m.id,
          type: m.type as "voice" | "video",
          duration: m.duration,
        }));
    },
    [messages],
  );

  const setPlaybackForNewActive = useCallback(
    (queue: MediaQueueItem[], speed: PlaybackSpeed): MediaPlaybackState => {
      const current = queue[0];
      return {
        queue,
        currentIndex: 0,
        isPlaying: true,
        speed,
        progress: 0,
        elapsedSeconds: 0,
        totalSeconds: Math.max(1, current?.duration ?? 0),
        autoContinue: true,
      };
    },
    [],
  );

  const handleMediaItemPress = useCallback(
    (messageId: string) => {
      setMediaPlayback((prev) => {
        const current = prev.queue[prev.currentIndex];
        if (current?.id === messageId) {
          if (prev.isPlaying) {
            return { ...prev, isPlaying: false, autoContinue: false };
          }
          return { ...prev, isPlaying: true, autoContinue: true };
        }

        const queue = buildMediaQueueFrom(messageId);
        if (queue.length === 0) return prev;
        return setPlaybackForNewActive(queue, prev.speed);
      });
    },
    [buildMediaQueueFrom, setPlaybackForNewActive],
  );

  const toggleActiveMediaPlayback = useCallback(() => {
    setMediaPlayback((prev) => {
      if (prev.queue.length === 0) return prev;
      if (prev.isPlaying) return { ...prev, isPlaying: false, autoContinue: false };
      return { ...prev, isPlaying: true, autoContinue: true };
    });
  }, []);

  const closeMediaPlayback = useCallback(() => {
    setMediaPlayback((prev) => ({
      ...prev,
      queue: [],
      currentIndex: 0,
      isPlaying: false,
      progress: 0,
      elapsedSeconds: 0,
      totalSeconds: 0,
      autoContinue: true,
    }));
  }, []);

  const cycleMediaSpeed = useCallback(() => {
    setMediaPlayback((prev) => ({
      ...prev,
      speed: prev.speed === 1 ? 1.5 : prev.speed === 1.5 ? 2 : 1,
    }));
  }, []);

  const handleMediaProgress = useCallback(
    (
      messageId: string,
      payload: { currentTime: number; duration: number; progress: number },
    ) => {
      setMediaPlayback((prev) => {
        const current = prev.queue[prev.currentIndex];
        if (!current || current.id !== messageId) return prev;

        const nextProgress = Math.max(0, Math.min(100, payload.progress));
        const nextDuration = Math.max(1, payload.duration || prev.totalSeconds || 1);
        const nextElapsed = Math.max(0, Math.min(payload.currentTime, nextDuration));

        if (
          Math.abs(prev.progress - nextProgress) < 0.05 &&
          Math.abs(prev.elapsedSeconds - nextElapsed) < 0.05 &&
          Math.abs(prev.totalSeconds - nextDuration) < 0.05
        ) {
          return prev;
        }

        return {
          ...prev,
          progress: nextProgress,
          elapsedSeconds: nextElapsed,
          totalSeconds: nextDuration,
        };
      });
    },
    [],
  );

  const handleMediaEnded = useCallback((messageId: string) => {
    setMediaPlayback((prev) => {
      const current = prev.queue[prev.currentIndex];
      if (!current || current.id !== messageId) return prev;

      if (!prev.autoContinue) {
        return { ...prev, isPlaying: false, progress: 100 };
      }

      const nextIndex = prev.currentIndex + 1;
      if (nextIndex >= prev.queue.length) {
        return {
          ...prev,
          queue: [],
          currentIndex: 0,
          isPlaying: false,
          progress: 0,
          elapsedSeconds: 0,
          totalSeconds: 0,
          autoContinue: true,
        };
      }

      const nextItem = prev.queue[nextIndex];
      return {
        ...prev,
        currentIndex: nextIndex,
        isPlaying: true,
        progress: 0,
        elapsedSeconds: 0,
        totalSeconds: Math.max(1, nextItem.duration ?? 0),
        autoContinue: true,
      };
    });
  }, []);

  useEffect(() => {
    setMediaPlayback((prev) => {
      if (prev.queue.length === 0) return prev;
      const filtered = prev.queue.filter((item) => messageById.has(item.id));
      if (filtered.length === prev.queue.length) return prev;
      if (filtered.length === 0) {
        return {
          ...prev,
          queue: [],
          currentIndex: 0,
          isPlaying: false,
          progress: 0,
          elapsedSeconds: 0,
          totalSeconds: 0,
          autoContinue: true,
        };
      }
      const current = prev.queue[prev.currentIndex];
      const retainedIndex = current
        ? filtered.findIndex((item) => item.id === current.id)
        : -1;
      const nextIndex =
        retainedIndex >= 0
          ? retainedIndex
          : Math.min(prev.currentIndex, filtered.length - 1);
      return {
        ...prev,
        queue: filtered,
        currentIndex: nextIndex,
      };
    });
  }, [messageById]);

  const activeMediaMessage = activeMediaItem
    ? messageById.get(activeMediaItem.id)
    : undefined;
  const activeMediaSender = activeMediaMessage
    ? getMessageSenderName(activeMediaMessage)
    : "Unknown";

  const jumpToMessage = useCallback((messageId: string) => {
    const target = document.getElementById(`msg-${messageId}`);
    if (!target) return;
    target.scrollIntoView({ behavior: "smooth", block: "center" });
    setJumpHighlightedMessageId(messageId);
    if (jumpHighlightTimeoutRef.current) {
      clearTimeout(jumpHighlightTimeoutRef.current);
    }
    jumpHighlightTimeoutRef.current = setTimeout(() => {
      setJumpHighlightedMessageId((current) =>
        current === messageId ? null : current,
      );
      jumpHighlightTimeoutRef.current = null;
    }, 1400);
  }, []);

  const handleSend = useCallback(async (
    text?: string,
    type: "text" | "voice" | "video" | "file" = "text",
    duration?: number,
  ) => {
    if (!user) return;
    if (isBlockedByMe || isRestrictedByOther) return;

    // We only need text for actual text messages
    if (type === "text" && (!text || !text.trim())) return;

    const wasAtBottomBeforeSend = isNearBottom(96);

    const replyTarget = replyingToMessage;
    const newMsgObj: Omit<Message, "id" | "createdAt" | "status"> = {
      chatId,
      senderId: user.id,
      text: type === "text" ? text!.trim() : undefined,
      type,
      duration,
      replyToId: replyTarget?.id,
    };
    const tempId = `m_temp_${Date.now()}`;
    const optimisticMsg: Message = {
      ...newMsgObj,
      id: tempId,
      createdAt: new Date().toISOString(),
      status: "sending",
      replyToSenderId: replyTarget?.senderId,
      replyToSenderName: replyTarget
        ? getMessageSenderName(replyTarget)
        : undefined,
      replyToMessageType: replyTarget?.type,
      replyToMessagePreview: replyTarget
        ? getMessagePreviewText(replyTarget)
        : undefined,
    };

    // 1. Optimistic UI update
    setMessages((prev) => [...prev, optimisticMsg]);
    setReplyingToMessage(null);
    if (wasAtBottomBeforeSend) {
      stickToBottom(false);
    }

    // Play send sound immediately on optimistic send
    playSendSound();

    try {
      // 2. Network Request
      const sentMsg = await chatService.sendMessage(newMsgObj);

      // 3. Replace temp in-place to keep list stable during fast sends.
      setMessages((prev) => {
        const tempIndex = prev.findIndex((m) => m.id === tempId);
        if (tempIndex === -1) {
          if (prev.some((m) => m.id === sentMsg.id)) return prev;
          return [...prev, sentMsg];
        }
        if (
          prev.some((m, idx) => m.id === sentMsg.id && idx !== tempIndex)
        ) {
          return prev.filter((m) => m.id !== tempId);
        }
        stableRenderKeyByMessageIdRef.current.set(sentMsg.id, tempId);
        const next = [...prev];
        next[tempIndex] = sentMsg;
        return next;
      });

      updateLastMessage(chatId, sentMsg);
    } catch (e: unknown) {
      const err = e as { message?: string; status?: number };
      const msg = String(err?.message ?? "").toLowerCase();
      const isBlocked = err?.status === 403 || msg.includes("blocked");
      if (isBlocked && chat) {
        addBlockedByUser(chat.participant.id);
      }
      // Revert optimistic update on failure
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    }
  }, [user, isBlockedByMe, isRestrictedByOther, chatId, updateLastMessage, chat, addBlockedByUser, isNearBottom, stickToBottom, replyingToMessage, getMessageSenderName, getMessagePreviewText]);

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
      <div className="chat-bg flex-1 flex items-center justify-center">
        <p className="text-muted-foreground chat-surface-2 px-4 py-2 rounded-full text-sm border border-border/45">
          Select a chat to start messaging
        </p>
      </div>
    );
  }

  return (
    <div className="chat-bg relative flex h-full w-full min-h-0 flex-col overflow-hidden">
      {/* 
        We render a disabled/skeleton header if loading. 
        Note: The actual ChatHeader requires a participant, if we don't have it yet we can render a minimal fallback or just the structure.
      */}
      {chat ? (
        <ChatHeader
          participant={chat.participant}
          activity={otherActivity}
          isBlockedByMe={isBlockedByMe}
          isBlockedByThem={isRestrictedByOther}
          onToggleSearch={() => setIsSearching(true)}
          onStartCall={() => setIsCallOpen(true)}
          onBlockUser={() => setIsBlockDialogOpen(true)}
          onUnblockUser={async () => {
            try {
              await settingsService.unblockUser(chat.participant.id);
              setBlockedUsers(blockedUserIds.filter((id) => id !== chat.participant.id));
            } catch {
              // keep state on error
            }
          }}
        />
      ) : (
        <div className="chat-surface-1 h-16 border-b flex items-center px-4 animate-pulse">
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

      <GlobalMediaPlayerBar
        isVisible={!!activeMediaItem}
        isPlaying={mediaPlayback.isPlaying}
        progress={mediaPlayback.progress}
        elapsedSeconds={mediaPlayback.elapsedSeconds}
        totalSeconds={mediaPlayback.totalSeconds}
        speed={mediaPlayback.speed}
        mediaType={activeMediaItem?.type ?? "voice"}
        senderLabel={activeMediaSender}
        onTogglePlayPause={toggleActiveMediaPlayback}
        onCycleSpeed={cycleMediaSpeed}
        onClose={closeMediaPlayback}
      />

      <div className="relative min-h-0 flex-1 overflow-hidden">
        {/* Pinned Message Bar */}
        {pinnedMessage && (
          <div className="chat-surface-2 flex items-center gap-3 px-4 py-2 border-b border-border shadow-sm animate-in slide-in-from-top-2 z-20 absolute top-0 left-0 w-full">
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
        <div className="chat-wallpaper-pattern z-0" aria-hidden />
        <div
          ref={messagesContainerRef}
          className={cn(
            "relative z-10 h-full min-h-0 overflow-y-auto px-4 py-4 custom-scrollbar",
            pinnedMessage ? "pt-16" : "",
          )}
          onScroll={() => {
            if (activeMessageMenuId) setActiveMessageMenuId(null);
          }}
        >
          <div className="flex flex-col gap-2 min-h-full justify-end pb-2">
          {/* Simple date badge placeholder */}
          <div className="flex justify-center my-4 sticky top-0 z-10">
            <span className="chat-surface-2 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium text-muted-foreground shadow-sm border border-border/45">
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
                            ? "message-bubble-out rounded-br-sm"
                            : "message-bubble-in rounded-bl-sm",
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
                            ? "justify-end text-muted-foreground"
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
              <Fragment key={getStableMessageKey(msg.id)}>
                {shouldShowUnreadBoundary && entryUnreadBoundaryId === msg.id && (
                  <div
                    ref={unreadSeparatorRef}
                    className="z-10 flex justify-center py-3 my-2 shrink-0 -mx-4 px-4"
                    data-unread-separator
                  >
                    <span className="bg-primary/15 dark:bg-primary/20 text-primary font-medium text-xs px-4 py-1.5 rounded-full shadow-sm border border-primary/20">
                      New Messages
                    </span>
                  </div>
                )}
                <div id={`msg-${msg.id}`} data-message-id={msg.id}>
                  <MessageBubble
                    message={msg}
                    searchQuery={searchQuery}
                    isHighlightedMatch={
                      isSearching &&
                      matchCount > 0 &&
                      matchedMessages[currentMatchIndex]?.id === msg.id
                    }
                    onReply={() => {
                      setReplyingToMessage(msg);
                      setActiveMessageMenuId(null);
                    }}
                    repliedMessage={
                      msg.replyToId
                        ? messageById.get(msg.replyToId)
                        : undefined
                    }
                    currentUserId={user?.id}
                    otherParticipantName={chat?.participant?.name}
                    isReplyJumpHighlighted={jumpHighlightedMessageId === msg.id}
                    onJumpToMessage={jumpToMessage}
                    onDeleteToggle={() => setMessageToDelete(msg)}
                    onForwardToggle={() => setMessageToForward(msg)}
                    onPinMessage={() => setPinnedMessage(msg)}
                    onToggleReaction={(emoji) =>
                      handleToggleReaction(msg.id, emoji)
                    }
                    isMenuOpen={activeMessageMenuId === msg.id}
                    onMenuOpenChange={(nextOpen) => {
                      setActiveMessageMenuId((currentActiveId) => {
                        if (nextOpen) return msg.id;
                        return currentActiveId === msg.id ? null : currentActiveId;
                      });
                    }}
                    isMediaActive={activeMediaItem?.id === msg.id}
                    isMediaPlaying={
                      activeMediaItem?.id === msg.id && mediaPlayback.isPlaying
                    }
                    mediaPlaybackSpeed={
                      activeMediaItem?.id === msg.id ? mediaPlayback.speed : 1
                    }
                    onRequestMediaPlay={() => handleMediaItemPress(msg.id)}
                    onToggleMediaPlayback={toggleActiveMediaPlayback}
                    onMediaProgress={(payload) =>
                      handleMediaProgress(msg.id, payload)
                    }
                    onMediaEnded={() => handleMediaEnded(msg.id)}
                  />
                </div>
              </Fragment>
            ))
          )}
          </div>
        </div>
        {showScrollToBottom && (
          <div className="absolute bottom-5 right-6 z-20 flex flex-col items-center gap-0">
            <Button
              type="button"
              size="icon"
              className={cn(
                "relative h-12 w-12 rounded-full transition-all duration-200",
                "chat-surface-2 backdrop-blur-xl border border-border/55",
                "shadow-[0_4px_24px_rgba(0,0,0,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.35)]",
                "hover:bg-card/90 hover:scale-105 active:scale-95",
                "text-foreground hover:text-primary",
                "animate-in zoom-in-95 fade-in duration-200",
              )}
              onClick={() => {
                scrollToBottom();
              }}
              aria-label="Scroll to bottom"
            >
              <ChevronDown className="h-5 w-5 stroke-[2.5]" />
              {unreadCount > 0 && (
                <span
                  className={cn(
                    "absolute -top-1 -right-1 flex min-w-[20px] h-5 items-center justify-center rounded-full",
                    "bg-primary text-primary-foreground text-xs font-semibold",
                    "px-1.5 shadow-sm ring-2 ring-background",
                    "animate-in zoom-in-90 duration-200",
                  )}
                >
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </Button>
          </div>
        )}
      </div>

      <div className="flex flex-col">
        {isBlockedByMe && chat && (
          <div className="chat-surface-1 flex items-center justify-between gap-3 border-t border-border px-4 py-2">
            <span className="text-sm text-muted-foreground">
              You blocked this user. Unblock to send messages.
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                try {
                  await settingsService.unblockUser(chat.participant.id);
                  setBlockedUsers(blockedUserIds.filter((id) => id !== chat.participant.id));
                } catch {
                  // keep state on error
                }
              }}
            >
              Unblock
            </Button>
          </div>
        )}

        <MessageInput
          chatId={chatId}
          onSend={handleSend}
          replyingToMessage={replyingToMessage}
          replyingToSenderName={
            replyingToMessage ? getMessageSenderName(replyingToMessage) : undefined
          }
          onCancelReply={() => setReplyingToMessage(null)}
          disabled={isChatDisabled}
          disabledPlaceholder={disabledPlaceholder}
          onInputFocus={() => {
            isComposerFocusedRef.current = true;
            keepLatestMessageAboveKeyboard();
          }}
          onInputBlur={() => {
            isComposerFocusedRef.current = false;
          }}
        />
      </div>

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
              onClick={async () => {
                if (!chat) return;
                try {
                  await settingsService.blockUser(chat.participant.id);
                  if (!blockedUserIds.includes(chat.participant.id)) {
                    setBlockedUsers([...blockedUserIds, chat.participant.id]);
                  }
                } catch {
                  // keep dialog open on error
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
