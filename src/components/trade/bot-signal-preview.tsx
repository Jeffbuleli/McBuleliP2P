"use client";

import { useCallback, useEffect, useState } from "react";
import type { BotPlanId } from "@/lib/bot-config";
import type { Messages } from "@/i18n/messages";
import { IconAnalysis } from "@/components/trade/bot-visual-icons";

type SignalPayload = {
  summary?: string;
  score?: number;
  bias?: string;
  reasons?: string[];
  rsi14?: number;
};

function ScoreRing({ score }: { score: number }) {
  const clamped = Math.min(100, Math.max(0, score));
  const r = 18;
  const c = 2 * Math.PI * r;
  const offset = c - (clamped / 100) * c;
  const tone =
    clamped >= 65 ? "var(--fd-primary)" : clamped >= 40 ? "#f59e0b" : "#f43f5e";

  return (
    <svg viewBox="0 0 44 44" className="h-11 w-11 shrink-0" aria-hidden>
      <circle cx="22" cy="22" r={r} fill="none" stroke="currentColor" strokeWidth="3" className="text-stone-200" />
      <circle
        cx="22"
        cy="22"
        r={r}
        fill="none"
        stroke={tone}
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={offset}
        transform="rotate(-90 22 22)"
      />
      <text x="22" y="22" textAnchor="middle" dominantBaseline="central" className="fill-[color:var(--fd-text)] text-[11px] font-bold">
        {Math.round(clamped)}
      </text>
    </svg>
  );
}

function biasLabel(
  bias: string | undefined,
  t: (k: keyof Messages) => string,
): string {
  const b = (bias ?? "").toLowerCase();
  if (b.includes("bull") || b === "long") return t("bots_signal_bias_bull");
  if (b.includes("bear") || b === "short") return t("bots_signal_bias_bear");
  return t("bots_signal_bias_neutral");
}

export function BotSignalPreview({
  planId,
  symbol,
  billing,
  t,
}: {
  planId: BotPlanId;
  symbol: string;
  billing: "demo" | "live";
  t: (k: keyof Messages, vars?: Record<string, string | number>) => string;
}) {
  const [data, setData] = useState<SignalPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(false);

  const load = useCallback(async () => {
    if (!symbol) return;
    setLoading(true);
    setErr(false);
    try {
      const q = new URLSearchParams({
        symbol,
        planId,
        billing,
      });
      const res = await fetch(`/api/trade/bots/signal?${q}`, { cache: "no-store" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setData(null);
        setErr(true);
        return;
      }
      setData(json as SignalPayload);
    } catch {
      setData(null);
      setErr(true);
    } finally {
      setLoading(false);
    }
  }, [planId, symbol, billing]);

  useEffect(() => {
    void load();
    const id = window.setInterval(() => void load(), 60_000);
    return () => window.clearInterval(id);
  }, [load]);

  return (
    <div className="rounded-xl border border-[color:var(--fd-border)]/80 bg-gradient-to-r from-white to-[color:var(--fd-mint)]/30 p-3">
      <div className="flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[color:var(--fd-primary)]/10 text-[color:var(--fd-primary)]">
          <IconAnalysis size={16} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-extrabold uppercase tracking-wide text-[color:var(--fd-muted)]">
            {t("bots_signal_preview_title")}
          </p>
          <p className="truncate text-xs font-semibold text-[color:var(--fd-text)]">{symbol}</p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="shrink-0 rounded-lg border border-[color:var(--fd-border)] bg-white px-2 py-1 text-[10px] font-bold text-[color:var(--fd-primary)] transition hover:bg-[color:var(--fd-mint)]/50 disabled:opacity-50"
        >
          {loading ? "…" : "↻"}
        </button>
      </div>

      {loading && !data ? (
        <div className="mt-3 flex items-center gap-3 animate-pulse" aria-busy>
          <div className="h-11 w-11 rounded-full bg-stone-200" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 w-24 rounded bg-stone-200" />
            <div className="h-2 w-full rounded bg-stone-100" />
          </div>
        </div>
      ) : err ? (
        <p className="mt-2 text-[11px] text-[color:var(--fd-muted)]">{t("bots_signal_unavailable")}</p>
      ) : data ? (
        <div className="mt-3 flex items-center gap-3">
          <ScoreRing score={data.score ?? 0} />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-[color:var(--fd-text)]">
              {biasLabel(data.bias, t)}
              {typeof data.rsi14 === "number" ? (
                <span className="ml-1.5 font-medium text-[color:var(--fd-muted)]">
                  RSI {data.rsi14.toFixed(0)}
                </span>
              ) : null}
            </p>
            <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-[color:var(--fd-muted)]">
              {data.summary ?? t("bots_smart_always_on")}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
