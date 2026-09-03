import { useRef } from "react";

export function useTripleTap(onTrigger: () => void, windowMs = 700) {
  const taps = useRef<number[]>([]);

  return function registerTap() {
    const now = Date.now();
    taps.current = taps.current.filter((t) => now - t < windowMs);
    taps.current.push(now);
    if (taps.current.length >= 3) {
      taps.current = [];
      onTrigger();
    }
  };
}
