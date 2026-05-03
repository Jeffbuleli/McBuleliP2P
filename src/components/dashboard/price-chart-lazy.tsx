"use client";

import nextDynamic from "next/dynamic";

const PriceChartDynamic = nextDynamic(
  () => import("@/components/dashboard/price-chart"),
  {
    ssr: false,
    loading: () => (
      <div
        className="h-56 animate-pulse rounded-2xl border border-emerald-900/10 bg-stone-100 dark:border-white/10 dark:bg-stone-800"
        aria-hidden
      />
    ),
  },
);

/** Lazy-loaded chart for server-rendered dashboard pages (no SSR — lighter bundle). */
export function PriceChartLazy() {
  return <PriceChartDynamic />;
}
