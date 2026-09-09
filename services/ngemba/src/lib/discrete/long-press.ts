"use client";

import { useCallback, useRef, type PointerEvent } from "react";

type LongPressHandlers = {
  onPointerDown: (e: PointerEvent) => void;
  onPointerUp: () => void;
  onPointerCancel: () => void;
  onPointerLeave: () => void;
  /** Call at start of click handler; returns true if long-press already fired. */
  consumeSuppressClick: () => boolean;
};

/** Appui long (PWA) - alternative discrète au triple-tap. */
export function useLongPress(
  onTrigger: () => void,
  holdMs = 650,
): LongPressHandlers {
  const timer = useRef<number | null>(null);
  const suppressClick = useRef(false);

  const clear = useCallback(() => {
    if (timer.current != null) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
  }, []);

  const onPointerDown = useCallback(
    (e: PointerEvent) => {
      if (e.button !== 0 && e.pointerType === "mouse") return;
      suppressClick.current = false;
      clear();
      timer.current = window.setTimeout(() => {
        timer.current = null;
        suppressClick.current = true;
        onTrigger();
      }, holdMs);
    },
    [clear, holdMs, onTrigger],
  );

  const onPointerUp = useCallback(() => {
    clear();
  }, [clear]);

  const consumeSuppressClick = useCallback(() => {
    if (!suppressClick.current) return false;
    suppressClick.current = false;
    return true;
  }, []);

  return {
    onPointerDown,
    onPointerUp,
    onPointerCancel: onPointerUp,
    onPointerLeave: onPointerUp,
    consumeSuppressClick,
  };
}
