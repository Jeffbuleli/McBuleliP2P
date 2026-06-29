"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { Locale } from "@/i18n/locale";
import { getDictionary } from "@/i18n/messages";
import { HUD_PANEL_LG, HudFrame } from "@/components/ui/hud-frame";
import { TICKERS_POLL_MS } from "@/lib/market-live";
import { marketIconUrl } from "@/lib/market-icons";
import type { MarketTicker } from "@/lib/market-tickers";

export function HomeMarketStrip({
  locale,
  initialTickers,
}: {
  locale: Locale;
  initialTickers: MarketTicker[] | null;
}) {
  const d = getDictionary(locale);
  const [tickers, setTickers] = useState(initialTickers);

  const pull = useCallback(async () => {
    if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
    try {
      const res = await fetch("/api/market/tickers");
      const json = (await res.json().catch(() => ({}))) as { tickers?: MarketTicker[] };
      if (res.ok && Array.isArray(json.tickers)) {
        setTickers(json.tickers.slice(0, 8));
      }
    } catch {
      // keep last tickers
    }
  }, []);

  useEffect(() => {
    if (!initialTickers?.length) void pull();
    const id = window.setInterval(() => void pull(), TICKERS_POLL_MS);
    return () => window.clearInterval(id);
  }, [pull, initialTickers]);

  if (!tickers?.length) return null;

  return (
    <HudFrame accent="cyan" className={`${HUD_PANEL_LG} overflow-hidden p-3`}>
      <section aria-label={d.market_preview}>
      <div className="mb-2 flex items-center justify-between gap-2 px-0.5">
        <div className="flex items-center gap-2">
          <h2 className="fd-section-title text-sm text-cyan-200">{d.market_preview}</h2>
          <span className="fd-live-pill">{d.market_live}</span>
        </div>
        <Link
          href="/app/market"
          prefetch={false}
          className="shrink-0 rounded-full border border-cyan-400/40 bg-cyan-500/12 px-3 py-1.5 text-[10px] font-bold text-cyan-300 shadow-sm transition active:scale-[0.98]"
        >
          {d.view_market} →
        </Link>
      </div>
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 app-scrollbar">
        {tickers.map((ticker) => (
          <Link
            key={ticker.symbol}
            href="/app/market"
            prefetch={false}
            className="flex min-w-[7.5rem] shrink-0 flex-col rounded-xl border border-white/10 bg-[#0a1018]/85 px-2.5 py-2 transition active:scale-[0.98] hover:border-cyan-400/25"
          >
            <span className="flex items-center gap-1.5 text-[11px] font-bold text-[color:var(--fd-text)]">
              <CoinIcon symbol={ticker.symbol} />
              {ticker.symbol.replace("USDT", "")}
              {ticker.source === "okx" ? (
                <span className="rounded bg-violet-500/20 px-1 py-0.5 text-[8px] font-bold uppercase text-violet-300">
                  OKX
                </span>
              ) : null}
            </span>
            <span className="mt-1 text-xs font-semibold tabular-nums text-[color:var(--fd-text)]">
              {formatPrice(ticker.lastPrice)}
            </span>
            <span
              className={`text-[10px] font-bold tabular-nums ${
                ticker.changePct >= 0 ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {ticker.changePct >= 0 ? "+" : ""}
              {ticker.changePct.toFixed(2)}%
            </span>
          </Link>
        ))}
      </div>
      </section>
    </HudFrame>
  );
}

function formatPrice(s: string) {
  const n = Number(s);
  if (!Number.isFinite(n)) return s;
  if (n >= 1000) return n.toLocaleString(undefined, { maximumFractionDigits: 0 });
  if (n >= 1) return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
  return n.toLocaleString(undefined, { maximumFractionDigits: 4 });
}

function CoinIcon({ symbol }: { symbol: string }) {
  const url = marketIconUrl(symbol);
  const letter = symbol.replace(/USDT$/i, "").slice(0, 1) || "?";
  if (!url) {
    return (
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[color:var(--fd-mint)] text-[9px] font-bold text-[color:var(--fd-primary)]">
        {letter}
      </span>
    );
  }
  return (
    <span className="relative flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#0a1018] ring-1 ring-cyan-400/25">
      <Image src={url} alt="" width={24} height={24} className="h-full w-full object-cover" unoptimized />
    </span>
  );
}
