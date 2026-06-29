"use client";

import nextDynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

type UiAppearance = "light" | "dark" | "hud";

const PriceChartDynamic = nextDynamic(
  () => import("@/components/dashboard/price-chart"),
  {
    ssr: false,
    loading: () => (
      <div
        className="market-hud-card h-56 animate-pulse rounded-2xl border border-white/10 bg-[rgba(8,12,22,0.94)]"
        aria-hidden
      />
    ),
  },
);

function ChartPlaceholder() {
  return (
    <div
      className="market-hud-card h-56 rounded-2xl border border-white/10 bg-[rgba(8,12,22,0.7)]"
      aria-hidden
    />
  );
}

/** Lazy-loaded chart (no SSR). Optionally waits until near viewport before loading JS + klines API. */
export function PriceChartLazy({
  appearance = "dark",
  deferUntilVisible = false,
  density = "default",
}: {
  appearance?: UiAppearance;
  deferUntilVisible?: boolean;
  density?: "default" | "compact";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(!deferUntilVisible);

  useEffect(() => {
    if (!deferUntilVisible || visible) return;
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { rootMargin: "240px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [deferUntilVisible, visible]);

  return (
    <div ref={ref}>
      {visible ? (
        <PriceChartDynamic appearance={appearance} density={density} />
      ) : (
        <ChartPlaceholder />
      )}
    </div>
  );
}
