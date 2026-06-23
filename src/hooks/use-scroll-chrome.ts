"use client";

import { useEffect, useRef, useState } from "react";

const SCROLL_UP_THRESHOLD = 8;
const SCROLL_DOWN_THRESHOLD = 8;
const TOP_REVEAL_Y = 16;

/**
 * Hides bottom chrome while scrolling down on long feed pages; reveals on scroll up or near top.
 */
export function useScrollChrome(enabled: boolean) {
  const [navHidden, setNavHidden] = useState(false);
  const lastY = useRef(0);
  const ticking = useRef(false);

  useEffect(() => {
    if (!enabled) {
      setNavHidden(false);
      return;
    }

    lastY.current = window.scrollY;

    const onScroll = () => {
      if (ticking.current) return;
      ticking.current = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        const delta = y - lastY.current;

        if (y <= TOP_REVEAL_Y) {
          setNavHidden(false);
        } else if (delta > SCROLL_DOWN_THRESHOLD) {
          setNavHidden(true);
        } else if (delta < -SCROLL_UP_THRESHOLD) {
          setNavHidden(false);
        }

        lastY.current = y;
        ticking.current = false;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [enabled]);

  return navHidden;
}
