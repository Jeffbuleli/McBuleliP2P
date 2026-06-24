"use client";

import Image from "next/image";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { useI18n } from "@/components/i18n-provider";
import { getDictionary } from "@/i18n/messages";
import { KLINES_POLL_MS } from "@/lib/market-live";
import {
  normalizeSeries,
  pointsToSmoothPath,
} from "@/lib/chart-smooth-path";
import { marketIconUrl } from "@/lib/market-icons";

type Range = "1h" | "24h" | "7d";

const CHART_SYMBOLS = ["BTCUSDT", "ETHUSDT", "PIUSDT"] as const;

function ChartSymbolIcon({
  symbol,
}: {
  symbol: (typeof CHART_SYMBOLS)[number];
}) {
  const url = marketIconUrl(symbol);
  return (
    <span className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-stone-100">
      {url ? (
        <Image
          src={url}
          alt=""
          width={28}
          height={28}
          className="h-full w-full object-cover"
        />
      ) : (
        <span className="flex h-5 w-5 items-center justify-center text-[10px] font-bold text-stone-400">
          ?
        </span>
      )}
    </span>
  );
}

type KlineResponse = {
  symbol: string;
  range: Range;
  points: { t: number; p: number }[];
  lastPrice: number;
  changePct: number;
};

const WIDTH = 320;
const HEIGHT = 140;

type UiAppearance = "light" | "dark";

function PriceChart({ appearance = "dark" }: { appearance?: UiAppearance }) {
  const { t, locale } = useI18n();
  const statLabels =
    locale === "fr"
      ? { open: "Ouv.", high: "Haut", low: "Bas", close: "Clôt." }
      : { open: "Open", high: "High", low: "Low", close: "Close" };
  const isLight = appearance === "light";
  const uid = useId();
  const chartFillId = useMemo(
    () => `mc-fill-${uid.replace(/[^a-zA-Z0-9_-]/g, "")}`,
    [uid],
  );
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
  /** Align with McBuleli emerald / rose accents (not flat Material greens). */
  const stroke = up ? "#10b981" : "#f43f5e";

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

  const rangeStats = useMemo(() => {
    if (!data?.points.length) return null;
    const vals = data.points.map((p) => p.p);
    return {
      high: Math.max(...vals),
      low: Math.min(...vals),
      open: vals[0],
      close: vals[vals.length - 1],
    };
  }, [data]);

  return (
    <section
      className={
        isLight
          ? "fd-card overflow-hidden p-4"
          : "overflow-hidden rounded-[1.75rem] border border-stone-700/50 bg-stone-950/65 p-4 shadow-2xl shadow-black/40 backdrop-blur-xl"
      }
    >
      {/* Single scan line: BTC · ETH · Pi · LIVE · 1h 24h 7d — then price / % (same idea as before Pi) */}
      <div className="mb-3 flex min-w-0 flex-nowrap items-center gap-x-1.5 overflow-x-auto">
        <div className="flex shrink-0 items-center gap-1">
          {CHART_SYMBOLS.map((s) => (
            <button
              key={s}
              type="button"
              aria-label={s.replace("USDT", "")}
              onClick={() => setSymbol(s)}
              className={`flex h-10 w-10 shrink-0 items-center justify-center overflow-visible rounded-full transition active:scale-95 ${
                symbol === s
                  ? isLight
                    ? "bg-[color:var(--fd-mint)] ring-2 ring-[color:var(--fd-primary)]/50 ring-offset-2 ring-offset-white"
                    : "bg-emerald-950/50 shadow-md shadow-emerald-900/25 ring-2 ring-emerald-500/70 ring-offset-2 ring-offset-stone-950"
                  : isLight
                    ? "border border-[color:var(--fd-border)] bg-[color:var(--fd-card)] hover:bg-[color:var(--fd-mint)]"
                    : "border border-stone-600/60 bg-stone-900/50 hover:border-stone-500 hover:bg-stone-900/80"
              }`}
            >
              <ChartSymbolIcon symbol={s} />
            </button>
          ))}
        </div>
        <span
          className={
            isLight
              ? "fd-live-pill shrink-0"
              : "inline-flex shrink-0 items-center gap-1 rounded-full border border-emerald-800/35 bg-emerald-950/40 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-300"
          }
          title={t("market_live_hint")}
        >
          <span className="relative flex h-1.5 w-1.5">
            <span
              className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${
                liveStale ? "bg-amber-500" : "animate-ping bg-emerald-500"
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
        <div className="ml-auto flex shrink-0 flex-nowrap items-center gap-0.5">
          {(["1h", "24h", "7d"] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              className={`min-h-[32px] shrink-0 whitespace-nowrap rounded-full px-2 py-1.5 text-[11px] font-semibold leading-none transition active:scale-95 sm:min-w-[2.45rem] sm:text-xs ${
                range === r
                  ? isLight
                    ? "bg-[color:var(--fd-mint)] text-[color:var(--fd-primary)] ring-1 ring-[color:var(--fd-primary)]/25"
                    : "bg-emerald-600/25 text-emerald-200 ring-1 ring-emerald-500/40"
                  : isLight
                    ? "text-[color:var(--fd-muted)] hover:text-[color:var(--fd-text)]"
                    : "text-stone-500 hover:text-stone-300"
              }`}
            >
              {r === "1h"
                ? t("chart_1h")
                : r === "24h"
                  ? t("chart_24h")
                  : t("chart_7d")}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <ChartSkeleton light={isLight} />
      ) : error || !data ? (
        <p
          className={
            isLight
              ? "py-10 text-center text-sm text-[color:var(--fd-muted)]"
              : "py-10 text-center text-sm text-stone-400"
          }
        >
          {error ?? t("chart_unavailable")}
        </p>
      ) : (
        <>
          <div className="mb-2 flex items-end justify-between gap-3">
            <p
              className={`min-w-0 flex-1 text-2xl font-bold tabular-nums ${
                isLight ? "text-[color:var(--fd-text)]" : "text-stone-50"
              }`}
            >
              {displayPrice != null ? formatUsd(displayPrice) : "—"}
            </p>
            <p
              className={`shrink-0 text-sm font-bold tabular-nums ${
                up
                  ? isLight
                    ? "text-emerald-700"
                    : "text-emerald-400"
                  : isLight
                    ? "text-rose-600"
                    : "text-rose-400"
              }`}
            >
              {up ? "+" : ""}
              {data.changePct.toFixed(2)}%
            </p>
          </div>

          {rangeStats ? (
            <div
              className={`mb-3 grid grid-cols-2 gap-2 rounded-xl p-2.5 text-[10px] sm:grid-cols-4 ${
                isLight
                  ? "bg-[color:var(--fd-mint)]/40 ring-1 ring-[color:var(--fd-border)]"
                  : "bg-stone-900/50 ring-1 ring-stone-700/40"
              }`}
            >
              {(
                [
                  ["open", rangeStats.open],
                  ["high", rangeStats.high],
                  ["low", rangeStats.low],
                  ["close", rangeStats.close],
                ] as const
              ).map(([key, val]) => (
                <div key={key} className="min-w-0 text-center sm:text-left">
                  <p className={isLight ? "text-[color:var(--fd-muted)]" : "text-stone-500"}>
                    {statLabels[key]}
                  </p>
                  <p
                    className={`truncate font-bold tabular-nums ${
                      isLight ? "text-[color:var(--fd-text)]" : "text-stone-100"
                    }`}
                  >
                    {formatUsd(val)}
                  </p>
                </div>
              ))}
            </div>
          ) : null}

          <div
            className={
              isLight
                ? "relative touch-pan-x rounded-xl bg-[color:var(--fd-mint)]/50 ring-1 ring-[color:var(--fd-border)]"
                : "relative touch-pan-x rounded-xl bg-stone-900/60 ring-1 ring-stone-700/40"
            }
          >
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
                <linearGradient id={chartFillId} x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor={stroke}
                    stopOpacity="0.35"
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
                  stroke="#10b981"
                  strokeOpacity="0.07"
                />
              ))}
              {fillPathD ? (
                <path d={fillPathD} fill={`url(#${chartFillId})`} />
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
            href="/app/trade"
            className={
              isLight
                ? "mt-3 flex min-h-[44px] items-center justify-center rounded-xl border border-[color:var(--fd-primary)]/25 bg-[color:var(--fd-mint)] py-3 text-sm font-semibold text-[color:var(--fd-primary)] transition hover:bg-[color:var(--fd-mint-deep)]"
                : "mt-3 flex min-h-[44px] items-center justify-center rounded-xl border border-stone-600/70 bg-stone-900/60 py-3 text-sm font-semibold text-emerald-300 transition hover:border-emerald-700/40 hover:bg-stone-900/90"
            }
          >
            {t("view_trade")}
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

function ChartSkeleton({ light }: { light?: boolean }) {
  return (
    <div className="animate-pulse space-y-3" aria-hidden>
      <div className="flex justify-between">
        <div
          className={`h-8 w-28 rounded-lg ${light ? "bg-[color:var(--fd-mint)]" : "bg-stone-800"}`}
        />
        <div
          className={`h-6 w-16 rounded-lg ${light ? "bg-[color:var(--fd-mint)]" : "bg-stone-800"}`}
        />
      </div>
      <div
        className={`h-[160px] rounded-xl ring-1 ${
          light
            ? "bg-[color:var(--fd-mint)]/60 ring-[color:var(--fd-border)]"
            : "bg-gradient-to-t from-stone-900 via-stone-900/90 to-emerald-950/20 ring-stone-700/40"
        }`}
      />
    </div>
  );
}

export { PriceChart };
export default PriceChart;
