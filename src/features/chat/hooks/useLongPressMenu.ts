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

  useEffect(() => {
    onLongPressRef.current = onLongPress;
  }, [onLongPress]);

  const removeScrollListener = useCallback(() => {
    const scrollParent = scrollParentRef.current;
    if (!scrollParent) return;
    scrollParent.removeEventListener("scroll", cancelOnScrollRef.current);
    scrollParentRef.current = null;
  }, []);

  const cancelPendingLongPress = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    activePointerIdRef.current = null;
    removeScrollListener();
  }, [removeScrollListener]);

  const cancelOnScrollRef = useRef<() => void>(() => {});
  cancelOnScrollRef.current = () => {
    cancelPendingLongPress();
  };

  const scheduleLongPress = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      activePointerIdRef.current = null;
      removeScrollListener();
      onLongPressRef.current();
    }, longPressMs);
  }, [longPressMs, removeScrollListener]);

  const onPointerDownCapture = useCallback(
    (event: ReactPointerEvent<T>) => {
      lastPointerTypeRef.current = event.pointerType;

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
        scrollParentRef.current = scrollParent;
        scrollParent.addEventListener("scroll", cancelOnScrollRef.current, {
          passive: true,
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
