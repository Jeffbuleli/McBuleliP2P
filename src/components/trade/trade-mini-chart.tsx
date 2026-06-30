"use client";

import { useCallback, useEffect, useId, useMemo, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { getDictionary } from "@/i18n/messages";
import { KLINES_POLL_MS } from "@/lib/market-live";
import {
  normalizeSeries,
  pointsToSmoothPath,
} from "@/lib/chart-smooth-path";

const WIDTH = 340;
const HEIGHT = 132;

export type TradeTf = "1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d";

type KlineResponse = {
  symbol: string;
  tf: TradeTf;
  points: { t: number; p: number }[];
  lastPrice: number;
  changePct: number;
};

export function TradeMiniChart({
  symbol,
  tf,
  onTfChange,
}: {
  symbol: string;
  tf: TradeTf;
  onTfChange: (tf: TradeTf) => void;
}) {
  const { locale, t } = useI18n();
  const d = getDictionary(locale);
  const gradId = useId().replace(/:/g, "");
  const [data, setData] = useState<KlineResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(
    async (mode: "full" | "poll") => {
      if (mode === "full") {
        setLoading(true);
        setError(null);
      }
      if (
        mode === "poll" &&
        typeof document !== "undefined" &&
        document.visibilityState !== "visible"
      ) {
        return;
      }
      try {
        const res = await fetch(
          `/api/trade/klines?symbol=${encodeURIComponent(symbol)}&tf=${tf}`,
          { cache: "no-store" },
        );
        const json = (await res.json().catch(() => ({}))) as Record<
          string,
          unknown
        >;
        if (!res.ok) {
          if (mode === "full") {
            setError(
              typeof json.message === "string"
                ? json.message
                : d.chart_unavailable,
            );
            setData(null);
          }
          return;
        }
        setData(json as KlineResponse);
      } catch {
        if (mode === "full") {
          setError(d.chart_unavailable);
          setData(null);
        }
      } finally {
        if (mode === "full") setLoading(false);
      }
    },
    [symbol, tf, d.chart_unavailable],
  );

  useEffect(() => {
    void load("full");
  }, [load]);

  useEffect(() => {
    const id = window.setInterval(() => void load("poll"), KLINES_POLL_MS);
    const onVis = () => {
      if (document.visibilityState === "visible") void load("poll");
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [load]);

  const prices = useMemo(() => data?.points.map((x) => x.p) ?? [], [data]);
  const points = useMemo(
    () => normalizeSeries(prices, WIDTH, HEIGHT, 8),
    [prices],
  );
  const pathD = useMemo(() => {
    if (points.length < 2) return "";
    return pointsToSmoothPath(points, WIDTH, HEIGHT);
  }, [points]);

  const tfs: TradeTf[] = ["1m", "5m", "15m", "30m", "1h", "4h", "1d"];

  return (
    <section className="fd-card p-3">
      <div className="mb-2 flex flex-wrap gap-1">
        {tfs.map((x) => (
          <button
            key={x}
            type="button"
            onClick={() => onTfChange(x)}
            className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${
              tf === x
                ? "bg-[color:var(--fd-primary)] text-white"
                : "bg-[color:var(--fd-mint)] text-[color:var(--fd-muted)]"
            }`}
          >
            {x}
          </button>
        ))}
      </div>
      <div className="relative flex justify-center overflow-hidden rounded-xl bg-[color:var(--fd-mint)]/50">
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center text-xs text-[color:var(--fd-muted)]">
            {d.market_loading}
          </div>
        )}
        {error && (
          <div className="py-8 text-center text-xs text-rose-600">{error}</div>
        )}
        {!error && pathD && (
          <svg
            width={WIDTH}
            height={HEIGHT}
            viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
            className="block max-w-full"
            aria-hidden
          >
            <defs>
              <linearGradient id={gradId} x1="0" x2="0" y1="0" y2="1">
                <stop
                  offset="0%"
                  stopColor="#2a7d3e"
                  stopOpacity="0.35"
                />
                <stop
                  offset="100%"
                  stopColor="#2a7d3e"
                  stopOpacity="0"
                />
              </linearGradient>
            </defs>
            <path
              d={`${pathD} L ${WIDTH} ${HEIGHT} L 0 ${HEIGHT} Z`}
              fill={`url(#${gradId})`}
            />
            <path
              d={pathD}
              fill="none"
              stroke="#2a7d3e"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </div>
    </section>
  );
}
