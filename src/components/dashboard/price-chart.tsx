"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
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
  hud = false,
}: {
  symbol: (typeof CHART_SYMBOLS)[number];
  hud?: boolean;
}) {
  const url = marketIconUrl(symbol);
  return (
    <span
      className={`flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full ${
        hud ? "bg-[rgba(5,8,16,0.65)] ring-1 ring-white/10" : "bg-stone-100"
      }`}
    >
      {url ? (
        <Image
          src={url}
          alt=""
          width={32}
          height={32}
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

type UiAppearance = "light" | "dark" | "hud";

function PriceChart({
  appearance = "dark",
  density = "default",
}: {
  appearance?: UiAppearance;
  density?: "default" | "compact";
}) {
  const { t, locale } = useI18n();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const statLabels =
    locale === "fr"
      ? { open: "Ouv.", high: "Haut", low: "Bas", close: "Clôt." }
      : { open: "Open", high: "High", low: "Low", close: "Close" };
  const isLight = appearance === "light";
  const isHud = appearance === "hud";
  const isCompact = density === "compact";
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

  const pickSymbol = useCallback(
    (next: string) => {
      setSymbol(next);
      if (pathname?.startsWith("/app/market")) {
        const q = new URLSearchParams(searchParams.toString());
        q.set("symbol", next);
        const qs = q.toString();
        router.replace(qs ? `/app/market?${qs}` : "/app/market", {
          scroll: false,
        });
      }
    },
    [pathname, router, searchParams],
  );

  useEffect(() => {
    const urlSym = searchParams.get("symbol");
    if (
      urlSym &&
      (CHART_SYMBOLS as readonly string[]).includes(urlSym) &&
      urlSym !== symbol
    ) {
      setSymbol(urlSym);
    }
  }, [searchParams, symbol]);

  const panel = searchParams.get("panel");
  const priceFeed = panel === "futures" ? "futures" : "spot";

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
          `/api/market/klines?symbol=${encodeURIComponent(symbol)}&range=${range}&feed=${priceFeed}`,
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
    [symbol, range, locale, priceFeed],
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
        isHud
          ? "market-hud-card group relative overflow-hidden rounded-2xl border border-white/10 bg-[rgba(8,12,22,0.94)] p-4 shadow-[0_8px_40px_rgba(0,0,0,0.45)]"
          : isLight
            ? "fd-card p-4"
            : "overflow-hidden rounded-[1.75rem] border border-stone-700/50 bg-stone-950/65 p-4 shadow-2xl shadow-black/40 backdrop-blur-xl"
      }
    >
      {isHud ? (
        <>
          <span
            className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent"
            aria-hidden
          />
          <span
            className="pointer-events-none absolute inset-0 opacity-60 before:pointer-events-none before:absolute before:left-2 before:top-2 before:h-3 before:w-3 before:border-l before:border-t before:border-cyan-400/50 after:pointer-events-none after:absolute after:bottom-2 after:right-2 after:h-3 after:w-3 after:border-b after:border-r after:border-emerald-400/40"
            aria-hidden
          />
        </>
      ) : null}
      {/* Single scan line: BTC · ETH · Pi · LIVE · 1h 24h 7d - then price / % */}
      <div className={`mb-3 flex min-w-0 flex-nowrap items-center gap-x-1.5 overflow-x-auto px-0.5 py-1 ${isHud ? "relative" : ""}`}>
        <div className="flex shrink-0 items-center gap-1.5">
          {CHART_SYMBOLS.map((s) => (
            <button
              key={s}
              type="button"
              aria-label={s.replace("USDT", "")}
              onClick={() => pickSymbol(s)}
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition active:scale-95 ${
                symbol === s
                  ? isLight
                    ? "bg-[color:var(--fd-mint)] ring-2 ring-[color:var(--fd-primary)]/55"
                    : isHud
                      ? "bg-cyan-400/10 shadow-[0_0_16px_rgba(34,211,238,0.15)] ring-2 ring-cyan-400/55"
                      : "bg-emerald-950/50 shadow-md shadow-emerald-900/25 ring-2 ring-emerald-500/70"
                  : isLight
                    ? "border border-[color:var(--fd-border)] bg-[color:var(--fd-card)] hover:bg-[color:var(--fd-mint)]"
                    : isHud
                      ? "border border-white/10 bg-[rgba(5,8,16,0.55)] hover:border-cyan-400/25"
                      : "border border-stone-600/60 bg-stone-900/50 hover:border-stone-500 hover:bg-stone-900/80"
              }`}
            >
              <ChartSymbolIcon symbol={s} hud={isHud} />
            </button>
          ))}
        </div>
        <span
          className={
            isLight
              ? "fd-live-pill shrink-0"
              : isHud
                ? "inline-flex shrink-0 items-center gap-1 rounded-full border border-emerald-400/25 bg-emerald-400/8 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-300"
                : "inline-flex shrink-0 items-center gap-1 rounded-full border border-emerald-800/35 bg-emerald-950/40 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-300"
          }
          title={t("market_live")}
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
                    : isHud
                      ? "bg-cyan-400/10 text-cyan-300 ring-1 ring-cyan-400/35"
                      : "bg-emerald-600/25 text-emerald-200 ring-1 ring-emerald-500/40"
                  : isLight
                    ? "text-[color:var(--fd-muted)] hover:text-[color:var(--fd-text)]"
                    : isHud
                      ? "text-stone-500 hover:text-stone-300"
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
        <ChartSkeleton light={isLight} hud={isHud} />
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
              {displayPrice != null ? formatUsd(displayPrice) : "-"}
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
              className={
                isCompact
                  ? `mb-3 flex gap-2 overflow-x-auto pb-0.5 scrollbar-none ${
                      isLight ? "" : ""
                    }`
                  : `mb-3 grid grid-cols-2 gap-2 rounded-xl p-2.5 text-[10px] sm:grid-cols-4 ${
                      isLight
                        ? "bg-[color:var(--fd-mint)]/40 ring-1 ring-[color:var(--fd-border)]"
                        : isHud
                          ? "border border-white/8 bg-[rgba(5,8,16,0.45)]"
                          : "bg-stone-900/50 ring-1 ring-stone-700/40"
                    }`
              }
            >
              {(
                [
                  ["open", rangeStats.open],
                  ["high", rangeStats.high],
                  ["low", rangeStats.low],
                  ["close", rangeStats.close],
                ] as const
              ).map(([key, val]) => (
                <div
                  key={key}
                  className={
                    isCompact
                      ? `shrink-0 rounded-lg px-2 py-1.5 text-[10px] ${
                          isLight
                            ? "bg-[color:var(--fd-mint)]/50 ring-1 ring-[color:var(--fd-border)]"
                            : isHud
                              ? "border border-white/8 bg-[rgba(5,8,16,0.55)]"
                              : "bg-stone-900/50 ring-1 ring-stone-700/40"
                        }`
                      : "min-w-0 text-center sm:text-left"
                  }
                >
                  <p className={isLight ? "text-[color:var(--fd-muted)]" : "text-stone-500"}>
                    {statLabels[key]}
                  </p>
                  <p
                    className={`whitespace-nowrap font-bold tabular-nums ${
                      isCompact ? "text-[11px]" : ""
                    } ${isLight ? "text-[color:var(--fd-text)]" : "text-stone-100"}`}
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
                : isHud
                  ? "relative touch-pan-x overflow-hidden rounded-xl border border-cyan-400/15 bg-[rgba(2,6,14,0.85)]"
                  : "relative touch-pan-x rounded-xl bg-stone-900/60 ring-1 ring-stone-700/40"
            }
          >
            <svg
              ref={svgRef}
              viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
              className={`w-full touch-none select-none ${isCompact ? "h-[120px]" : "h-[160px]"}`}
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
              {[0.2, 0.4, 0.6, 0.8].map((gy) => (
                <line
                  key={gy}
                  x1="8"
                  x2={WIDTH - 8}
                  y1={8 + gy * (HEIGHT - 16)}
                  y2={8 + gy * (HEIGHT - 16)}
                  stroke={isHud ? "#22d3ee" : "#10b981"}
                  strokeOpacity={isHud ? "0.08" : "0.07"}
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
            href="/app/market?panel=futures"
            className={
              isLight
                ? "mt-3 flex min-h-[44px] items-center justify-center rounded-xl border border-[color:var(--fd-primary)]/25 bg-[color:var(--fd-mint)] py-3 text-sm font-semibold text-[color:var(--fd-primary)] transition hover:bg-[color:var(--fd-mint-deep)]"
                : isHud
                  ? "mt-3 flex min-h-[44px] items-center justify-center rounded-xl border border-emerald-400/35 bg-emerald-500/12 py-3 text-sm font-semibold text-emerald-300 shadow-[0_0_20px_rgba(52,211,153,0.1)] transition hover:border-emerald-400/50"
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
  if (!Number.isFinite(n)) return "-";
  if (n >= 1000) return n.toLocaleString(undefined, { maximumFractionDigits: 1 });
  if (n >= 1) return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
  return n.toLocaleString(undefined, { maximumFractionDigits: 6 });
}

function ChartSkeleton({ light, hud }: { light?: boolean; hud?: boolean }) {
  return (
    <div className="animate-pulse space-y-3" aria-hidden>
      <div className="flex justify-between">
        <div
          className={`h-8 w-28 rounded-lg ${
            light ? "bg-[color:var(--fd-mint)]" : hud ? "bg-cyan-400/10" : "bg-stone-800"
          }`}
        />
        <div
          className={`h-6 w-16 rounded-lg ${
            light ? "bg-[color:var(--fd-mint)]" : hud ? "bg-cyan-400/10" : "bg-stone-800"
          }`}
        />
      </div>
      <div
        className={`h-[160px] rounded-xl ring-1 ${
          light
            ? "bg-[color:var(--fd-mint)]/60 ring-[color:var(--fd-border)]"
            : hud
              ? "border border-cyan-400/15 bg-[rgba(2,6,14,0.85)]"
              : "bg-gradient-to-t from-stone-900 via-stone-900/90 to-emerald-950/20 ring-stone-700/40"
        }`}
      />
    </div>
  );
}

export { PriceChart };
export default PriceChart;
