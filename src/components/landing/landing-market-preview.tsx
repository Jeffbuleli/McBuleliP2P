"use client";

import { useCallback, useEffect, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import type { MarketTicker } from "@/lib/market-tickers";
import { MARKET_PREVIEW_SYMBOLS } from "@/lib/market-tickers";

type Props = { heading: string; sub: string };

export default function LandingMarketPreview({ heading, sub }: Props) {
  const { t } = useI18n();
  const [tickers, setTickers] = useState<MarketTicker[] | null>(null);
  const [err, setErr] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/market/tickers", { cache: "no-store" });
      const j = (await res.json()) as { tickers?: MarketTicker[] };
      if (res.ok && j.tickers) {
        setTickers(j.tickers);
        setErr(false);
      } else {
        setErr(true);
      }
    } catch {
      setErr(true);
    }
  }, []);

  useEffect(() => {
    void load();
    const id = window.setInterval(() => void load(), 20000);
    return () => window.clearInterval(id);
  }, [load]);

  const top = (tickers ?? []).slice(0, 5);

  return (
    <section
      className="rounded-2xl border border-stone-700/60 bg-stone-900/50 p-5 shadow-lg shadow-black/20"
      aria-label={heading}
    >
      <h2 className="text-lg font-bold text-stone-50">{heading}</h2>
      <p className="mt-1 text-sm text-stone-400">{sub}</p>
      {err ? (
        <p className="mt-4 text-sm text-amber-300/90">{t("market_loading")}</p>
      ) : top.length === 0 ? (
        <p className="mt-4 text-sm text-stone-500">{t("market_loading")}</p>
      ) : (
        <ul className="mt-4 space-y-2">
          {top.map((x) => (
            <li
              key={x.symbol}
              className="flex items-center justify-between rounded-xl bg-stone-950/60 px-3 py-2.5 text-sm"
            >
              <span className="font-semibold text-stone-100">
                {x.symbol.replace("USDT", "")}
              </span>
              <span className="font-mono tabular-nums text-stone-200">
                ${Number(x.lastPrice).toLocaleString(undefined, {
                  maximumFractionDigits: 2,
                })}
              </span>
              <span
                className={
                  x.changePct >= 0 ? "text-emerald-400" : "text-rose-400"
                }
              >
                {x.changePct >= 0 ? "+" : ""}
                {x.changePct.toFixed(2)}%
              </span>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-3 text-[10px] text-stone-500">
        {MARKET_PREVIEW_SYMBOLS.slice(0, 3).join(" · ")}…
      </p>
    </section>
  );
}
