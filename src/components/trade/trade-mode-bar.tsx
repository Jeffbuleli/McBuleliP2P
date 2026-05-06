"use client";

import { useState } from "react";
import { useI18n } from "@/components/i18n-provider";

export type TradeAppMode = "demo" | "live";

type Props = {
  mode: TradeAppMode;
  onModeChange: (m: TradeAppMode) => void;
  tradeLiveEnabled: boolean;
  demoUsdt: number;
  onEnableLive: () => Promise<void>;
  enableBusy: boolean;
  onDemoRefilled?: (demoUsdt: number) => void;
};

export function TradeModeBar({
  mode,
  onModeChange,
  tradeLiveEnabled,
  demoUsdt,
  onEnableLive,
  enableBusy,
  onDemoRefilled,
}: Props) {
  const { t } = useI18n();
  const [showEnable, setShowEnable] = useState(false);
  const [refillBusy, setRefillBusy] = useState(false);
  const [refillMsg, setRefillMsg] = useState<string | null>(null);

  const canRefill = demoUsdt <= 100;

  async function refillDemo() {
    setRefillBusy(true);
    setRefillMsg(null);
    try {
      const res = await fetch("/api/trade/demo-refill", { method: "POST" });
      const j = (await res.json().catch(() => ({}))) as {
        demoUsdt?: string;
        error?: string;
      };
      if (!res.ok) {
        setRefillMsg(
          j.error === "demo_refill_not_needed"
            ? t("trade_demo_refill_blocked")
            : "Error",
        );
        return;
      }
      const n = Number(j.demoUsdt ?? "10000");
      onDemoRefilled?.(Number.isFinite(n) ? n : 10000);
      setRefillMsg("✓");
      setTimeout(() => setRefillMsg(null), 1200);
    } finally {
      setRefillBusy(false);
    }
  }

  return (
    <>
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-stone-700/50 bg-stone-950/65 p-1 shadow-lg shadow-black/40 backdrop-blur-xl dark:border-stone-700/50 dark:bg-stone-950/65">
          <button
            type="button"
            onClick={() => onModeChange("demo")}
            className={`flex-1 rounded-xl px-3 py-2.5 text-center text-xs font-bold transition sm:text-sm ${
              mode === "demo"
                ? "bg-stone-900/70 text-emerald-200 shadow-sm shadow-black/30"
                : "text-stone-300/80"
            }`}
          >
            {t("trade_mode_demo")}
          </button>
          <button
            type="button"
            onClick={() => onModeChange("live")}
            className={`flex-1 rounded-xl px-3 py-2.5 text-center text-xs font-bold transition sm:text-sm ${
              mode === "live"
                ? "bg-stone-900/70 text-amber-100 shadow-sm shadow-black/30"
                : "text-stone-300/80"
            }`}
          >
            {t("trade_mode_live")}
          </button>
        </div>
        {mode === "demo" && (
          <div className="rounded-xl bg-emerald-50/90 px-3 py-2 text-[11px] leading-snug text-emerald-950 dark:bg-emerald-950/30 dark:text-emerald-100">
            <div className="flex items-center justify-between gap-2">
              <p className="min-w-0">
                {t("trade_mode_demo_hint")}{" "}
                <span className="font-mono font-semibold">
                  {demoUsdt.toLocaleString(undefined, {
                    maximumFractionDigits: 2,
                  })}{" "}
                  USDT
                </span>
              </p>
              <button
                type="button"
                disabled={!canRefill || refillBusy}
                onClick={() => void refillDemo()}
                className="shrink-0 rounded-lg border border-emerald-700/30 bg-emerald-950/40 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-200 disabled:opacity-40"
                title={t("trade_demo_refill_hint")}
              >
                {refillMsg ?? t("trade_demo_refill")}
              </button>
            </div>
            {!canRefill ? (
              <p className="mt-1 text-[10px] text-emerald-900/80 dark:text-emerald-200/80">
                {t("trade_demo_refill_blocked")}
              </p>
            ) : null}
          </div>
        )}
        {mode === "live" && !tradeLiveEnabled && (
          <div className="rounded-xl border border-amber-200 bg-amber-50/90 px-3 py-2.5 dark:border-amber-800/50 dark:bg-amber-950/40">
            <p className="text-[11px] leading-snug text-amber-950 dark:text-amber-100">
              {t("trade_live_disabled_hint")}
            </p>
            <button
              type="button"
              disabled={enableBusy}
              onClick={() => setShowEnable(true)}
              className="mt-2 w-full rounded-lg bg-amber-600 py-2 text-xs font-bold text-white disabled:opacity-50"
            >
              {t("trade_enable_live")}
            </button>
          </div>
        )}
        {mode === "live" && tradeLiveEnabled && (
          <p className="rounded-xl border border-amber-200/80 bg-amber-50/50 px-3 py-2 text-[11px] text-amber-950 dark:border-amber-800/40 dark:bg-amber-950/20 dark:text-amber-100/90">
            {t("trade_mode_live_hint")}
          </p>
        )}
      </div>

      {showEnable && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl dark:bg-stone-900">
            <h4 className="text-lg font-bold text-stone-900 dark:text-stone-50">
              {t("trade_enable_live_title")}
            </h4>
            <p className="mt-2 text-sm leading-relaxed text-stone-600 dark:text-stone-300">
              {t("trade_enable_live_body")}
            </p>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                className="flex-1 rounded-xl border border-stone-300 py-3 text-sm font-semibold dark:border-stone-600"
                onClick={() => setShowEnable(false)}
              >
                {t("trade_ui_cancel")}
              </button>
              <button
                type="button"
                disabled={enableBusy}
                className="flex-1 rounded-xl bg-amber-600 py-3 text-sm font-bold text-white disabled:opacity-50"
                onClick={async () => {
                  await onEnableLive();
                  setShowEnable(false);
                }}
              >
                {t("trade_enable_live_confirm")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
