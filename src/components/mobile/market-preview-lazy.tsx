"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import type { MarketTicker } from "@/lib/market-tickers";
import type { Locale } from "@/i18n/locale";

type UiAppearance = "light" | "dark";

const MarketPreviewDynamic = dynamic(
  () =>
    import("@/components/mobile/market-preview").then((m) => m.MarketPreview),
  {
    loading: () => (
      <div
        className="fd-card h-48 animate-pulse bg-[color:var(--fd-mint)]/30"
        aria-hidden
      />
    ),
  },
);

/** Defers market preview JS + icon fetches until the section is near the viewport. */
export function MarketPreviewLazy({
  locale,
  initialTickers,
  appearance = "light",
  showViewLink = true,
}: {
  locale: Locale;
  initialTickers: MarketTicker[] | null;
  appearance?: UiAppearance;
  showViewLink?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { rootMargin: "320px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={ref}>
      {visible ? (
        <MarketPreviewDynamic
          locale={locale}
          initialTickers={initialTickers}
          appearance={appearance}
          showViewLink={showViewLink}
        />
      ) : (
        <div
          className="fd-card h-48 bg-[color:var(--fd-mint)]/30"
          aria-hidden
        />
      )}
    </div>
  );
}
