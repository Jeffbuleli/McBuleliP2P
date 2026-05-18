"use client";

import nextDynamic from "next/dynamic";

type UiAppearance = "light" | "dark";

const PriceChartDynamic = nextDynamic(
  () => import("@/components/dashboard/price-chart"),
  {
    ssr: false,
    loading: () => (
      <div
        className="fd-card h-56 animate-pulse bg-[color:var(--fd-mint)]/40"
        aria-hidden
      />
    ),
  },
);

/** Lazy-loaded chart for server-rendered dashboard pages (no SSR — lighter bundle). */
export function PriceChartLazy({ appearance = "dark" }: { appearance?: UiAppearance }) {
  return <PriceChartDynamic appearance={appearance} />;
}
