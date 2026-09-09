"use client";

import { useCallback, useRef } from "react";

/** Triple-tap dans une fenêtre courte - déclencheur discret (web / PWA). */
export function useTripleTap(onTrigger: () => void, windowMs = 900) {
  const taps = useRef<number[]>([]);

  return useCallback(() => {
    const now = Date.now();
    taps.current = taps.current.filter((t) => now - t < windowMs);
    taps.current.push(now);
    if (taps.current.length >= 3) {
      taps.current = [];
      onTrigger();
    }
  }, [onTrigger, windowMs]);
}
