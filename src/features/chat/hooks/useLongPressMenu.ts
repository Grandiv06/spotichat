import { useCallback, useEffect, useRef } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";

interface UseLongPressMenuOptions {
  onLongPress: () => void;
  longPressMs?: number;
  moveThresholdPx?: number;
}

interface GestureHandlers<T extends HTMLElement> {
  onPointerDownCapture: (event: ReactPointerEvent<T>) => void;
  onPointerMoveCapture: (event: ReactPointerEvent<T>) => void;
  onPointerUpCapture: (event: ReactPointerEvent<T>) => void;
  onPointerCancelCapture: (event: ReactPointerEvent<T>) => void;
}

function isMediaControlTarget(target: EventTarget | null): target is HTMLElement {
  return (
    target instanceof HTMLElement &&
    target.closest('[data-media-control="true"]') !== null
  );
}

function getScrollableParent(node: HTMLElement | null): HTMLElement | null {
  let current = node;

  while (current && current !== document.body) {
    const style = window.getComputedStyle(current);
    const overflowY = style.overflowY;
    const canScrollY =
      (overflowY === "auto" || overflowY === "scroll" || overflowY === "overlay") &&
      current.scrollHeight > current.clientHeight;

    if (canScrollY) return current;
    current = current.parentElement;
  }

  return null;
}

export function useLongPressMenu<T extends HTMLElement = HTMLElement>({
  onLongPress,
  longPressMs = 300,
  moveThresholdPx = 10,
}: UseLongPressMenuOptions): {
  gestureHandlers: GestureHandlers<T>;
  shouldAllowMenuOpenRequest: (nextOpen: boolean) => boolean;
  cancelPendingLongPress: () => void;
} {
  const onLongPressRef = useRef(onLongPress);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activePointerIdRef = useRef<number | null>(null);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const lastPointerTypeRef = useRef<string | null>(null);
  const scrollParentRef = useRef<HTMLElement | null>(null);
  const scrollAbortRef = useRef<AbortController | null>(null);
  const suppressMenuOpenUntilRef = useRef(0);

  useEffect(() => {
    onLongPressRef.current = onLongPress;
  }, [onLongPress]);

  const cancelPendingLongPress = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    activePointerIdRef.current = null;
    scrollAbortRef.current?.abort();
    scrollAbortRef.current = null;
    scrollParentRef.current = null;
  }, []);

  const scheduleLongPress = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      cancelPendingLongPress();
      onLongPressRef.current();
    }, longPressMs);
  }, [cancelPendingLongPress, longPressMs]);

  const onPointerDownCapture = useCallback(
    (event: ReactPointerEvent<T>) => {
      lastPointerTypeRef.current = event.pointerType;
      if (isMediaControlTarget(event.target)) {
        suppressMenuOpenUntilRef.current = Date.now() + 450;
        cancelPendingLongPress();
        return;
      }

      if (event.pointerType !== "touch") {
        cancelPendingLongPress();
        return;
      }

      activePointerIdRef.current = event.pointerId;
      startXRef.current = event.clientX;
      startYRef.current = event.clientY;

      const target = event.target as HTMLElement | null;
      const scrollParent = getScrollableParent(target);
      if (scrollParent) {
        scrollAbortRef.current?.abort();
        const controller = new AbortController();
        scrollAbortRef.current = controller;
        scrollParentRef.current = scrollParent;
        scrollParent.addEventListener("scroll", cancelPendingLongPress, {
          passive: true,
          signal: controller.signal,
        });
      }

      scheduleLongPress();
    },
    [cancelPendingLongPress, scheduleLongPress],
  );

  const onPointerMoveCapture = useCallback(
    (event: ReactPointerEvent<T>) => {
      if (event.pointerType !== "touch") return;
      if (activePointerIdRef.current !== event.pointerId) return;

      const deltaX = event.clientX - startXRef.current;
      const deltaY = event.clientY - startYRef.current;
      const movedDistance = Math.hypot(deltaX, deltaY);
      const hasVerticalScrollIntent = Math.abs(deltaY) > moveThresholdPx;

      if (movedDistance > moveThresholdPx || hasVerticalScrollIntent) {
        cancelPendingLongPress();
      }
    },
    [cancelPendingLongPress, moveThresholdPx],
  );

  const onPointerUpCapture = useCallback(
    (event: ReactPointerEvent<T>) => {
      if (event.pointerType !== "touch") return;
      if (activePointerIdRef.current !== event.pointerId) return;
      cancelPendingLongPress();
    },
    [cancelPendingLongPress],
  );

  const onPointerCancelCapture = useCallback(
    (event: ReactPointerEvent<T>) => {
      if (event.pointerType !== "touch") return;
      if (activePointerIdRef.current !== event.pointerId) return;
      cancelPendingLongPress();
    },
    [cancelPendingLongPress],
  );

  const shouldAllowMenuOpenRequest = useCallback((nextOpen: boolean) => {
    if (!nextOpen) return true;
    if (Date.now() < suppressMenuOpenUntilRef.current) return false;
    return lastPointerTypeRef.current !== "touch";
  }, []);

  useEffect(() => cancelPendingLongPress, [cancelPendingLongPress]);

  return {
    gestureHandlers: {
      onPointerDownCapture,
      onPointerMoveCapture,
      onPointerUpCapture,
      onPointerCancelCapture,
    },
    shouldAllowMenuOpenRequest,
    cancelPendingLongPress,
  };
}
