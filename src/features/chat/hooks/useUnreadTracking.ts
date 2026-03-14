import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Message } from "@/services/chat.service";

interface UseUnreadTrackingParams {
  chatId: string;
  messages: Message[];
  currentUserId?: string;
  containerRef: React.RefObject<HTMLDivElement | null>;
  onMessagesSeen: (messageIds: string[]) => void;
}

interface UseUnreadTrackingResult {
  unreadCount: number;
  firstUnreadMessageId: string | null;
  showScrollToBottom: boolean;
  scrollToBottom: () => void;
}

const BOTTOM_THRESHOLD_PX = 80;
const SEEN_INTERSECTION_THRESHOLD = 0.35;

export function useUnreadTracking({
  chatId,
  messages,
  currentUserId,
  containerRef,
  onMessagesSeen,
}: UseUnreadTrackingParams): UseUnreadTrackingResult {
  const seenInViewportRef = useRef<Set<string>>(new Set());
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);

  const unreadMessages = useMemo(
    () =>
      messages.filter(
        (m) =>
          m.senderId !== currentUserId &&
          m.status !== "seen" &&
          m.status !== "sending",
      ),
    [messages, currentUserId],
  );

  const unreadCount = unreadMessages.length;
  const firstUnreadMessageId = unreadMessages[0]?.id ?? null;
  const unreadIds = useMemo(() => unreadMessages.map((m) => m.id), [unreadMessages]);
  const unreadIdsKey = useMemo(() => unreadIds.join("|"), [unreadIds]);

  const isAtBottom = useCallback(() => {
    const container = containerRef.current;
    if (!container) return true;
    const { scrollTop, clientHeight, scrollHeight } = container;
    return scrollHeight - scrollTop - clientHeight < BOTTOM_THRESHOLD_PX;
  }, [containerRef]);

  const scrollToBottom = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
  }, [containerRef]);

  useEffect(() => {
    seenInViewportRef.current.clear();
  }, [chatId]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onScroll = () => setShowScrollToBottom(!isAtBottom());
    container.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    return () => container.removeEventListener("scroll", onScroll);
  }, [chatId, containerRef, isAtBottom]);

  useEffect(() => {
    setShowScrollToBottom(!isAtBottom());
  }, [messages.length, isAtBottom]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || unreadIds.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const seenNow: string[] = [];

        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          if (entry.intersectionRatio < SEEN_INTERSECTION_THRESHOLD) continue;

          const id = (entry.target as HTMLElement).dataset.messageId;
          if (!id || seenInViewportRef.current.has(id)) continue;

          seenInViewportRef.current.add(id);
          seenNow.push(id);
          observer.unobserve(entry.target);
        }

        if (seenNow.length > 0) onMessagesSeen(seenNow);
      },
      {
        root: container,
        threshold: [SEEN_INTERSECTION_THRESHOLD],
        rootMargin: "0px",
      },
    );

    for (const id of unreadIds) {
      if (seenInViewportRef.current.has(id)) continue;
      const el = container.querySelector<HTMLElement>(`[data-message-id="${id}"]`);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [containerRef, onMessagesSeen, unreadIds, unreadIdsKey]);

  // Safety net: when user is already at bottom, ensure visible tail unread messages become seen.
  // This prevents the last message from getting stuck as unread due to strict observer thresholds.
  useEffect(() => {
    const container = containerRef.current;
    if (!container || unreadIds.length === 0) return;
    if (!isAtBottom()) return;

    const rootRect = container.getBoundingClientRect();
    const seenNow: string[] = [];

    for (const id of unreadIds) {
      if (seenInViewportRef.current.has(id)) continue;
      const el = container.querySelector<HTMLElement>(`[data-message-id="${id}"]`);
      if (!el) continue;

      const rect = el.getBoundingClientRect();
      const visibleTop = Math.max(rect.top, rootRect.top);
      const visibleBottom = Math.min(rect.bottom, rootRect.bottom);
      const visibleHeight = Math.max(0, visibleBottom - visibleTop);
      const ratio = visibleHeight / Math.max(rect.height, 1);

      if (ratio >= 0.2) {
        seenInViewportRef.current.add(id);
        seenNow.push(id);
      }
    }

    if (seenNow.length > 0) onMessagesSeen(seenNow);
  }, [containerRef, unreadIds, unreadIdsKey, onMessagesSeen, isAtBottom]);

  return {
    unreadCount,
    firstUnreadMessageId,
    showScrollToBottom,
    scrollToBottom,
  };
}
