"use client";

import dynamic from "next/dynamic";

const Market = dynamic(
  () => import("@/components/landing/landing-market-preview"),
  {
    ssr: false,
    loading: () => (
      <div className="h-40 animate-pulse rounded-2xl bg-stone-800/80" />
    ),
  },
);

export function LandingMarketLazy({
  heading,
  sub,
}: {
  heading: string;
  sub: string;
}) {
  return <Market heading={heading} sub={sub} />;
}
