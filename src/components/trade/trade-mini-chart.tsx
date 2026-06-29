"use client";

import { useCallback, useEffect, useId, useMemo, useState, type ReactNode } from "react";
import { useI18n } from "@/components/i18n-provider";
import { getDictionary } from "@/i18n/messages";
import { KLINES_POLL_MS } from "@/lib/market-live";
import {
  normalizeSeries,
  pointsToSmoothPath,
} from "@/lib/chart-smooth-path";
import {
  MARKET_CHIP,
  MARKET_CHIP_ACTIVE,
  MARKET_HUD_ACCENT,
  MARKET_HUD_CARD,
  MARKET_HUD_CORNERS,
  MARKET_LIVE_PILL,
  MARKET_STAT_CELL,
} from "@/lib/market/market-ui";

const WIDTH = 340;
const HEIGHT = 148;

export type TradeTf = "1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d";

type KlineResponse = {
  symbol: string;
  tf: TradeTf;
  points: { t: number; p: number }[];
  lastPrice: number;
  changePct: number;
};

function formatUsd(n: number) {
  if (!Number.isFinite(n)) return "-";
  if (n >= 1000) return n.toLocaleString(undefined, { maximumFractionDigits: 1 });
  if (n >= 1) return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
  return n.toLocaleString(undefined, { maximumFractionDigits: 6 });
}

export function TradeMiniChart({
  symbol,
  tf,
  onTfChange,
  variant = "default",
  lastPrice,
  changePct24h,
  headerSlot,
}: {
  symbol: string;
  tf: TradeTf;
  onTfChange: (tf: TradeTf) => void;
  variant?: "default" | "hud";
  lastPrice?: number | null;
  changePct24h?: number | null;
  headerSlot?: ReactNode;
}) {
  const { locale, t } = useI18n();
  const d = getDictionary(locale);
  const gradId = useId().replace(/:/g, "");
  const glowId = `glow-${gradId}`;
  const isHud = variant === "hud";
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
        const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
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
    return `${pathD} L ${last.x} ${HEIGHT - 10} L ${first.x} ${HEIGHT - 10} Z`;
  }, [pathD, points]);

  const tfs: TradeTf[] = ["1m", "5m", "15m", "30m", "1h", "4h", "1d"];
  const change = changePct24h ?? data?.changePct ?? 0;
  const up = change >= 0;
  const stroke = up ? "#34d399" : "#fb7185";
  const displayPrice = lastPrice ?? data?.lastPrice ?? null;

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

  const shellClass = isHud
    ? `${MARKET_HUD_CARD} p-3 sm:p-4`
    : "fd-card p-3";

  const tfBtn = (active: boolean) =>
    isHud ? (active ? MARKET_CHIP_ACTIVE : MARKET_CHIP) : active
      ? "rounded-lg bg-[color:var(--fd-primary)] px-2.5 py-1 text-xs font-semibold text-white"
      : "rounded-lg bg-[color:var(--fd-mint)] px-2.5 py-1 text-xs font-semibold text-[color:var(--fd-muted)]";

  return (
    <section className={shellClass}>
      {isHud ? (
        <>
          <span className={MARKET_HUD_ACCENT} aria-hidden />
          <span className={MARKET_HUD_CORNERS} aria-hidden />
        </>
      ) : null}

      <div className="relative">
        <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            {headerSlot ? <div className="mb-2">{headerSlot}</div> : null}
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-stone-500">
                {symbol.replace("USDT", "")}/USDT
              </p>
              {isHud ? (
                <span className={MARKET_LIVE_PILL}>
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  </span>
                  {t("market_live")}
                </span>
              ) : null}
            </div>
            <div className="mt-1 flex items-end gap-2">
              <p className="font-mono text-2xl font-bold tabular-nums text-stone-50">
                {displayPrice != null ? formatUsd(displayPrice) : "-"}
              </p>
              <p
                className={`pb-0.5 text-sm font-bold tabular-nums ${
                  up ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {up ? "+" : ""}
                {change.toFixed(2)}%
              </p>
            </div>
          </div>
        </div>

        <div className="mb-2 flex gap-1 overflow-x-auto pb-0.5 scrollbar-none">
          {tfs.map((x) => (
            <button
              key={x}
              type="button"
              onClick={() => onTfChange(x)}
              className={`shrink-0 ${tfBtn(tf === x)}`}
            >
              {x}
            </button>
          ))}
        </div>

        {rangeStats && isHud ? (
          <div className="mb-2 grid grid-cols-4 gap-1.5">
            {(
              [
                ["O", rangeStats.open],
                ["H", rangeStats.high],
                ["L", rangeStats.low],
                ["C", rangeStats.close],
              ] as const
            ).map(([label, val]) => (
              <div key={label} className={MARKET_STAT_CELL}>
                <p className="text-[9px] font-semibold uppercase text-stone-500">{label}</p>
                <p className="text-[11px] font-bold tabular-nums text-stone-200">
                  {formatUsd(val)}
                </p>
              </div>
            ))}
          </div>
        ) : null}

        <div
          className={
            isHud
              ? "relative overflow-hidden rounded-xl border border-cyan-400/15 bg-[rgba(2,6,14,0.85)]"
              : "relative flex justify-center overflow-hidden rounded-xl bg-[color:var(--fd-mint)]/50"
          }
        >
          {loading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center text-xs text-stone-500">
              {d.market_loading}
            </div>
          )}
          {error && (
            <div className="py-10 text-center text-xs text-rose-400">{error}</div>
          )}
          {!error && pathD && (
            <svg
              viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
              className="block w-full touch-none select-none"
              style={{ height: isHud ? 168 : HEIGHT }}
              preserveAspectRatio="none"
              aria-hidden
            >
              <defs>
                <linearGradient id={gradId} x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor={stroke} stopOpacity="0.38" />
                  <stop offset="100%" stopColor={stroke} stopOpacity="0" />
                </linearGradient>
                {isHud ? (
                  <filter id={glowId} x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="2" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                ) : null}
              </defs>
              {isHud
                ? [0.2, 0.4, 0.6, 0.8].map((gy) => (
                    <line
                      key={gy}
                      x1="0"
                      x2={WIDTH}
                      y1={8 + gy * (HEIGHT - 18)}
                      y2={8 + gy * (HEIGHT - 18)}
                      stroke="#22d3ee"
                      strokeOpacity="0.06"
                    />
                  ))
                : null}
              {fillPathD ? <path d={fillPathD} fill={`url(#${gradId})`} /> : null}
              <path
                d={pathD}
                fill="none"
                stroke={stroke}
                strokeWidth={isHud ? "2.25" : "1.75"}
                strokeLinecap="round"
                strokeLinejoin="round"
                filter={isHud ? `url(#${glowId})` : undefined}
              />
            </svg>
          )}
        </div>
      </div>
    </section>
  );
}
