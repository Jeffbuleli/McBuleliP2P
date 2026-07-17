"use client";

import { useEffect, useState } from "react";

export type ViewportTier = "mobile" | "tablet" | "desktop";

/** Tailwind-aligned: mobile <768, tablet 768-1023, desktop ≥1024. */
export function getViewportTier(width: number): ViewportTier {
  if (width >= 1024) return "desktop";
  if (width >= 768) return "tablet";
  return "mobile";
}

export function useViewport(): {
  tier: ViewportTier;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  ready: boolean;
} {
  const [tier, setTier] = useState<ViewportTier>("mobile");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const mqTablet = window.matchMedia("(min-width: 768px)");
    const mqDesktop = window.matchMedia("(min-width: 1024px)");

    const sync = () => {
      setTier(getViewportTier(window.innerWidth));
      setReady(true);
    };

    sync();
    mqTablet.addEventListener("change", sync);
    mqDesktop.addEventListener("change", sync);
    window.addEventListener("resize", sync);
    return () => {
      mqTablet.removeEventListener("change", sync);
      mqDesktop.removeEventListener("change", sync);
      window.removeEventListener("resize", sync);
    };
  }, []);

  return {
    tier,
    isMobile: tier === "mobile",
    isTablet: tier === "tablet",
    isDesktop: tier === "desktop",
    ready,
  };
}
