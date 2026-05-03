"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { getDictionary } from "@/i18n/messages";
import { KLINES_POLL_MS } from "@/lib/market-live";
import {
  normalizeSeries,
  pointsToSmoothPath,
} from "@/lib/chart-smooth-path";

type Range = "1h" | "24h" | "7d";

type KlineResponse = {
  symbol: string;
  range: Range;
  points: { t: number; p: number }[];
  lastPrice: number;
  changePct: number;
};

const WIDTH = 320;
const HEIGHT = 140;

function PriceChart() {
  const { t, locale } = useI18n();
  const [symbol, setSymbol] = useState("BTCUSDT");
  const [range, setRange] = useState<Range>("24h");
  const [data, setData] = useState<KlineResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [liveStale, setLiveStale] = useState(false);
  const [cursorIdx, setCursorIdx] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

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
          `/api/market/klines?symbol=${encodeURIComponent(symbol)}&range=${range}`,
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
                : getDictionary(locale).chart_unavailable,
            );
            setData(null);
          } else {
            setLiveStale(true);
          }
          return;
        }
        setData(json as KlineResponse);
        setLiveStale(false);
        if (mode === "full") {
          setCursorIdx(null);
        }
      } catch {
        if (mode === "full") {
          setError(getDictionary(locale).chart_unavailable);
          setData(null);
        } else {
          setLiveStale(true);
        }
      } finally {
        if (mode === "full") setLoading(false);
      }
    },
    [symbol, range, locale],
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

  const prices = useMemo(
    () => data?.points.map((x) => x.p) ?? [],
    [data],
  );

  const points = useMemo(
    () => normalizeSeries(prices, WIDTH, HEIGHT, 10),
    [prices],
  );

  const pathD = useMemo(() => {
    if (points.length < 2) return "";
    return pointsToSmoothPath(points, WIDTH, HEIGHT);
  }, [points]);

  const fillPathD = useMemo(() => {
    if (!pathD || points.length < 2) return "";
    const last = points[points.length - 1];
    const first = points[0];
    return `${pathD} L ${last.x} ${HEIGHT - 8} L ${first.x} ${HEIGHT - 8} Z`;
  }, [pathD, points]);

  const up = (data?.changePct ?? 0) >= 0;
  const stroke = up ? "#16a34a" : "#e11d48";

  const handlePointer = useCallback(
    (clientX: number) => {
      if (!data?.points.length || !svgRef.current) return;
      const rect = svgRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      const ratio = Math.min(1, Math.max(0, x / rect.width));
      const idx = Math.round(ratio * (data.points.length - 1));
      setCursorIdx(idx);
    },
    [data],
  );

  const displayPrice =
    cursorIdx != null && data?.points[cursorIdx]
      ? data.points[cursorIdx].p
      : (data?.lastPrice ?? null);

  return (
    <section className="rounded-2xl border border-emerald-900/10 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-stone-900">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap gap-1.5">
            {(["BTCUSDT", "ETHUSDT"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSymbol(s)}
                className={`min-h-[36px] rounded-full px-3 py-1.5 text-xs font-bold transition active:scale-95 ${
                  symbol === s
                    ? "bg-emerald-700 text-white dark:bg-emerald-600"
                    : "bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-200"
                }`}
              >
                {s.replace("USDT", "")}
              </button>
            ))}
          </div>
          <span
            className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300"
            title={t("market_live_hint")}
          >
            <span className="relative flex h-1.5 w-1.5">
              <span
                className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  liveStale
                    ? "bg-amber-500"
                    : "animate-ping bg-emerald-500"
                }`}
              />
              <span
                className={`relative inline-flex h-1.5 w-1.5 rounded-full ${
                  liveStale ? "bg-amber-500" : "bg-emerald-600"
                }`}
              />
            </span>
            {t("market_live")}
          </span>
        </div>
        <div className="flex gap-1">
          {(["1h", "24h", "7d"] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              className={`min-h-[36px] min-w-[40px] rounded-full px-2.5 py-1.5 text-xs font-semibold transition active:scale-95 ${
                range === r
                  ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/50 dark:text-emerald-100"
                  : "text-stone-600 dark:text-stone-400"
              }`}
            >
              {r === "1h" ? t("chart_1h") : r === "24h" ? t("chart_24h") : t("chart_7d")}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <ChartSkeleton />
      ) : error || !data ? (
        <p className="py-10 text-center text-sm text-stone-500 dark:text-stone-400">
          {error ?? t("chart_unavailable")}
        </p>
      ) : (
        <>
          <div className="mb-2 flex items-end justify-between gap-2">
            <div>
              <p className="text-xs font-medium text-stone-500 dark:text-stone-400">
                {symbol.replace("USDT", "")}/USDT
              </p>
              <p className="text-2xl font-bold tabular-nums text-stone-900 dark:text-stone-50">
                {displayPrice != null
                  ? formatUsd(displayPrice)
                  : "—"}
              </p>
            </div>
            <p
              className={`text-sm font-bold tabular-nums ${
                up
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-rose-600 dark:text-rose-400"
              }`}
            >
              {up ? "+" : ""}
              {data.changePct.toFixed(2)}%
            </p>
          </div>

          <div className="relative touch-pan-x">
            <svg
              ref={svgRef}
              viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
              className="h-[160px] w-full touch-none select-none"
              preserveAspectRatio="none"
              onPointerDown={(e) => {
                e.currentTarget.setPointerCapture(e.pointerId);
                handlePointer(e.clientX);
              }}
              onPointerMove={(e) => handlePointer(e.clientX)}
              onPointerLeave={() => setCursorIdx(null)}
            >
              <defs>
                <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor={stroke}
                    stopOpacity="0.25"
                  />
                  <stop
                    offset="100%"
                    stopColor={stroke}
                    stopOpacity="0"
                  />
                </linearGradient>
              </defs>
              {[0.25, 0.5, 0.75].map((gy) => (
                <line
                  key={gy}
                  x1="8"
                  x2={WIDTH - 8}
                  y1={8 + gy * (HEIGHT - 16)}
                  y2={8 + gy * (HEIGHT - 16)}
                  stroke="currentColor"
                  strokeOpacity="0.06"
                  className="text-stone-900 dark:text-stone-100"
                />
              ))}
              {fillPathD ? (
                <path d={fillPathD} fill="url(#chartFill)" />
              ) : null}
              {pathD ? (
                <path
                  d={pathD}
                  fill="none"
                  stroke={stroke}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                />
              ) : null}
              {cursorIdx != null && points[cursorIdx] ? (
                <line
                  x1={points[cursorIdx].x}
                  x2={points[cursorIdx].x}
                  y1="8"
                  y2={HEIGHT - 8}
                  stroke={stroke}
                  strokeWidth="1"
                  strokeDasharray="4 4"
                  opacity="0.8"
                />
              ) : null}
            </svg>
          </div>

          <Link
            href="/app/market"
            className="mt-3 flex min-h-[44px] items-center justify-center rounded-xl bg-stone-100 py-3 text-sm font-semibold text-emerald-800 dark:bg-stone-800 dark:text-emerald-300"
          >
            {t("view_market")}
          </Link>
        </>
      )}
    </section>
  );
}

function formatUsd(n: number) {
  if (!Number.isFinite(n)) return "—";
  if (n >= 1000) return n.toLocaleString(undefined, { maximumFractionDigits: 1 });
  if (n >= 1) return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
  return n.toLocaleString(undefined, { maximumFractionDigits: 6 });
}

function ChartSkeleton() {
  return (
    <div className="animate-pulse space-y-3" aria-hidden>
      <div className="flex justify-between">
        <div className="h-8 w-28 rounded-lg bg-stone-200 dark:bg-stone-700" />
        <div className="h-6 w-16 rounded-lg bg-stone-200 dark:bg-stone-700" />
      </div>
      <div className="h-[160px] rounded-xl bg-gradient-to-t from-stone-200 to-stone-100 dark:from-stone-800 dark:to-stone-900" />
    </div>
  );
}

export { PriceChart };
export default PriceChart;
