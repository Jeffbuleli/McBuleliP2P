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
};

export function TradeModeBar({
  mode,
  onModeChange,
  tradeLiveEnabled,
  demoUsdt,
  onEnableLive,
  enableBusy,
}: Props) {
  const { t } = useI18n();
  const [showEnable, setShowEnable] = useState(false);

  return (
    <>
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-stone-200 bg-stone-50/80 p-1 dark:border-stone-600 dark:bg-stone-900/80">
          <button
            type="button"
            onClick={() => onModeChange("demo")}
            className={`flex-1 rounded-xl px-3 py-2.5 text-center text-xs font-bold transition sm:text-sm ${
              mode === "demo"
                ? "bg-white text-emerald-800 shadow-sm dark:bg-stone-800 dark:text-emerald-200"
                : "text-stone-500 dark:text-stone-400"
            }`}
          >
            {t("trade_mode_demo")}
          </button>
          <button
            type="button"
            onClick={() => onModeChange("live")}
            className={`flex-1 rounded-xl px-3 py-2.5 text-center text-xs font-bold transition sm:text-sm ${
              mode === "live"
                ? "bg-white text-amber-900 shadow-sm dark:bg-stone-800 dark:text-amber-100"
                : "text-stone-500 dark:text-stone-400"
            }`}
          >
            {t("trade_mode_live")}
          </button>
        </div>
        {mode === "demo" && (
          <p className="rounded-xl bg-emerald-50/90 px-3 py-2 text-[11px] leading-snug text-emerald-950 dark:bg-emerald-950/30 dark:text-emerald-100">
            {t("trade_mode_demo_hint")}{" "}
            <span className="font-mono font-semibold">
              {demoUsdt.toLocaleString(undefined, { maximumFractionDigits: 2 })} USDT
            </span>
          </p>
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
