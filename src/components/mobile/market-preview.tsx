"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { MarketTicker } from "@/lib/market-tickers";
import { TICKERS_POLL_MS } from "@/lib/market-live";
import { marketIconUrl } from "@/lib/market-icons";
import { getDictionary } from "@/i18n/messages";
import type { Locale } from "@/i18n/locale";

export function MarketPreview({
  locale,
  initialTickers,
  showViewLink = true,
}: {
  locale: Locale;
  initialTickers: MarketTicker[] | null;
  showViewLink?: boolean;
}) {
  const d = getDictionary(locale);
  const [tickers, setTickers] = useState<MarketTicker[] | null>(initialTickers);
  const [stale, setStale] = useState(false);

  const pull = useCallback(async () => {
    if (typeof document !== "undefined" && document.visibilityState !== "visible") {
      return;
    }
    try {
      const res = await fetch("/api/market/tickers", { cache: "no-store" });
      const json = (await res.json().catch(() => ({}))) as {
        tickers?: MarketTicker[];
      };
      if (!res.ok || !Array.isArray(json.tickers)) {
        setStale(true);
        return;
      }
      setTickers(json.tickers);
      setStale(false);
    } catch {
      setStale(true);
    }
  }, []);

  useEffect(() => {
    void pull();
    const id = window.setInterval(() => void pull(), TICKERS_POLL_MS);
    const onVis = () => {
      if (document.visibilityState === "visible") void pull();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [pull]);

  return (
    <section className="rounded-2xl border border-emerald-900/10 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-stone-900">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-bold text-stone-900 dark:text-stone-50">
            {d.market_preview}
          </h2>
          <span
            className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300"
            title={d.market_live_hint}
          >
            <span className="relative flex h-1.5 w-1.5">
              <span
                className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  stale
                    ? "bg-amber-500"
                    : "animate-ping bg-emerald-500"
                }`}
              />
              <span
                className={`relative inline-flex h-1.5 w-1.5 rounded-full ${
                  stale ? "bg-amber-500" : "bg-emerald-600"
                }`}
              />
            </span>
            {d.market_live}
          </span>
        </div>
        {showViewLink ? (
          <Link
            href="/app/market"
            className="shrink-0 text-xs font-semibold text-emerald-700 dark:text-emerald-400"
          >
            {d.view_market} →
          </Link>
        ) : null}
      </div>
      {!tickers?.length ? (
        <p className="py-4 text-center text-sm text-stone-500 dark:text-stone-400">
          {d.market_loading}
        </p>
      ) : (
        <ul className="flex max-h-[min(55vh,420px)] flex-col gap-0 divide-y divide-stone-100 overflow-y-auto overscroll-contain dark:divide-stone-800">
          {tickers.map((t) => (
            <li key={t.symbol}>
              <Link
                href="/app/market"
                className="flex min-h-[48px] items-center justify-between gap-3 py-2.5 active:bg-stone-50 dark:active:bg-stone-800/50"
              >
                <span className="flex min-w-0 items-center gap-2.5 font-semibold text-stone-900 dark:text-stone-100">
                  <MarketCoinIcon symbol={t.symbol} />
                  <span className="min-w-0 truncate">
                    {t.symbol.replace("USDT", "")}
                    <span className="text-stone-500 dark:text-stone-400">/USDT</span>
                  </span>
                </span>
                <span className="text-right">
                  <span className="block font-medium tabular-nums text-stone-900 dark:text-stone-50">
                    {formatPrice(t.lastPrice)}
                  </span>
                  <span
                    className={`text-xs font-semibold tabular-nums ${
                      t.changePct >= 0
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-rose-600 dark:text-rose-400"
                    }`}
                  >
                    {t.changePct >= 0 ? "+" : ""}
                    {t.changePct.toFixed(2)}%
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function formatPrice(s: string) {
  const n = Number(s);
  if (!Number.isFinite(n)) return s;
  if (n >= 1000) return n.toLocaleString(undefined, { maximumFractionDigits: 0 });
  if (n >= 1) return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
  return n.toLocaleString(undefined, { maximumFractionDigits: 6 });
}

function MarketCoinIcon({ symbol }: { symbol: string }) {
  const url = marketIconUrl(symbol);
  const letter = symbol.replace(/USDT$/i, "").slice(0, 1) || "?";
  if (!url) {
    return (
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-stone-200 text-xs font-bold text-stone-700 dark:bg-stone-700 dark:text-stone-200">
        {letter}
      </span>
    );
  }
  return (
    <span className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full ring-1 ring-stone-200 dark:ring-stone-600">
      <Image src={url} alt="" width={32} height={32} className="object-cover" />
    </span>
  );
}
