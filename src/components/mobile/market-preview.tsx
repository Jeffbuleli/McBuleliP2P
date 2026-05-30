"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { MarketTicker } from "@/lib/market-tickers";
import { TICKERS_POLL_MS } from "@/lib/market-live";
import { marketIconUrl } from "@/lib/market-icons";
import { getDictionary } from "@/i18n/messages";
import type { Locale } from "@/i18n/locale";

type UiAppearance = "light" | "dark";

export function MarketPreview({
  locale,
  initialTickers,
  showViewLink = true,
  appearance = "dark",
}: {
  locale: Locale;
  initialTickers: MarketTicker[] | null;
  showViewLink?: boolean;
  appearance?: UiAppearance;
}) {
  const d = getDictionary(locale);
  const isLight = appearance === "light";
  const [tickers, setTickers] = useState<MarketTicker[] | null>(initialTickers);
  const [stale, setStale] = useState(false);

  const pull = useCallback(async () => {
    if (typeof document !== "undefined" && document.visibilityState !== "visible") {
      return;
    }
    try {
      const res = await fetch("/api/market/tickers");
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
    if (!initialTickers?.length) void pull();
    const id = window.setInterval(() => void pull(), TICKERS_POLL_MS);
    const onVis = () => {
      if (document.visibilityState === "visible") void pull();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [pull, initialTickers]);

  return (
    <section
      className={
        isLight
          ? "fd-card overflow-hidden p-4"
          : "overflow-hidden rounded-[1.75rem] border border-stone-700/50 bg-stone-950/65 p-4 shadow-2xl shadow-black/40 backdrop-blur-xl"
      }
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h2 className={isLight ? "fd-section-title" : "text-sm font-bold text-stone-50"}>
            {d.market_preview}
          </h2>
          <span
            className={
              isLight
                ? "fd-live-pill"
                : "inline-flex items-center gap-1 rounded-full border border-emerald-800/35 bg-emerald-950/40 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-300"
            }
            title={d.market_live_hint}
          >
            <span className="relative flex h-1.5 w-1.5" aria-hidden>
              <span
                className={`absolute inline-flex h-full w-full rounded-full opacity-75 motion-safe:animate-ping ${
                  stale ? "bg-amber-500" : "bg-emerald-500"
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
            prefetch={false}
            className={
              isLight
                ? "shrink-0 text-xs font-semibold text-[color:var(--fd-primary)]"
                : "shrink-0 text-xs font-semibold text-emerald-400 hover:text-emerald-300"
            }
          >
            {d.view_market} →
          </Link>
        ) : null}
      </div>
      {!tickers?.length ? (
        <p
          className={
            isLight
              ? "py-4 text-center text-sm text-[color:var(--fd-muted)]"
              : "py-4 text-center text-sm text-stone-400"
          }
        >
          {d.market_loading}
        </p>
      ) : (
        <ul
          className={`flex max-h-[min(55vh,420px)] flex-col gap-0 overflow-y-auto overscroll-contain ${
            isLight ? "divide-y divide-[color:var(--fd-border)]" : "divide-y divide-stone-800/80"
          }`}
        >
          {tickers.map((ticker) => (
            <li key={ticker.symbol}>
              <Link
                href="/app/market"
                prefetch={false}
                className={
                  isLight
                    ? "flex min-h-[44px] items-center justify-between gap-2.5 rounded-lg py-2 transition active:bg-[color:var(--fd-mint)] hover:bg-[color:var(--fd-mint)]/70"
                    : "flex min-h-[44px] items-center justify-between gap-2.5 rounded-lg py-2 transition active:bg-stone-900/80 hover:bg-stone-900/50"
                }
              >
                <span
                  className={`flex min-w-0 items-center gap-2.5 font-semibold ${
                    isLight ? "text-[color:var(--fd-text)]" : "text-stone-100"
                  }`}
                >
                  <MarketCoinIcon symbol={ticker.symbol} light={isLight} />
                  <span className="min-w-0 truncate">
                    {ticker.symbol.replace("USDT", "")}
                    <span className={isLight ? "text-[color:var(--fd-muted)]" : "text-stone-500"}>
                      /USDT
                    </span>
                  </span>
                </span>
                <span className="text-right">
                  <span
                    className={`block font-medium tabular-nums ${
                      isLight ? "text-[color:var(--fd-text)]" : "text-stone-50"
                    }`}
                  >
                    {formatPrice(ticker.lastPrice)}
                  </span>
                  <span
                    className={`text-xs font-semibold tabular-nums ${
                      ticker.changePct >= 0
                        ? isLight
                          ? "text-emerald-700"
                          : "text-emerald-600 dark:text-emerald-400"
                        : isLight
                          ? "text-rose-600"
                          : "text-rose-600 dark:text-rose-400"
                    }`}
                  >
                    {ticker.changePct >= 0 ? "+" : ""}
                    {ticker.changePct.toFixed(2)}%
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

function MarketCoinIcon({ symbol, light }: { symbol: string; light?: boolean }) {
  const url = marketIconUrl(symbol);
  const letter = symbol.replace(/USDT$/i, "").slice(0, 1) || "?";
  if (!url) {
    return (
      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
          light
            ? "bg-[color:var(--fd-mint)] text-[color:var(--fd-primary)]"
            : "bg-stone-800 text-stone-200"
        }`}
      >
        {letter}
      </span>
    );
  }
  return (
    <span
      className={`relative h-8 w-8 shrink-0 overflow-hidden rounded-full ring-1 ${
        light ? "ring-[color:var(--fd-border)]" : "ring-stone-600"
      }`}
    >
      <Image
        src={url}
        alt=""
        aria-hidden
        width={32}
        height={32}
        className="object-cover"
      />
    </span>
  );
}
