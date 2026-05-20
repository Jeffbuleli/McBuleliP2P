"use client";

import { useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { TradeFlowCard, TradePrimaryBtn } from "@/components/trade/trade-flow-ui";
import {
  TradeIconBadge,
  TradeIconLive,
  TradeIconPractice,
  TradeIconWallet,
} from "@/components/trade/trade-icons";

export type TradeAppMode = "demo" | "live";

type Props = {
  mode: TradeAppMode;
  onModeChange: (m: TradeAppMode) => void;
  tradeLiveEnabled: boolean;
  demoUsdt: number;
  demoEffectiveUsdt?: number;
  piTest?: number;
  demoPiTestUsd?: number;
  onEnableLive: () => Promise<void>;
  enableBusy: boolean;
  onDemoRefilled?: (demoUsdt: number) => void | Promise<void>;
};

export function TradeModeBar({
  mode,
  onModeChange,
  tradeLiveEnabled,
  demoUsdt,
  demoEffectiveUsdt,
  piTest = 0,
  demoPiTestUsd = 0,
  onEnableLive,
  enableBusy,
  onDemoRefilled,
}: Props) {
  const { t } = useI18n();
  const [showEnable, setShowEnable] = useState(false);
  const [refillBusy, setRefillBusy] = useState(false);

  const canRefill = demoUsdt <= 100;
  const eff =
    typeof demoEffectiveUsdt === "number" && Number.isFinite(demoEffectiveUsdt)
      ? demoEffectiveUsdt
      : demoUsdt;

  async function refillDemo() {
    setRefillBusy(true);
    try {
      const res = await fetch("/api/trade/demo-refill", { method: "POST" });
      const j = (await res.json().catch(() => ({}))) as { demoUsdt?: string };
      if (!res.ok) return;
      const n = Number(j.demoUsdt ?? "10000");
      await Promise.resolve(onDemoRefilled?.(Number.isFinite(n) ? n : 10000));
    } finally {
      setRefillBusy(false);
    }
  }

  return (
    <>
      <TradeFlowCard className="!p-2">
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onModeChange("demo")}
            className={`flex items-center justify-center gap-2 rounded-2xl border-2 py-2.5 text-xs font-extrabold ${
              mode === "demo"
                ? "border-[color:var(--fd-primary)] bg-[color:var(--fd-primary)] text-white"
                : "border-[color:var(--fd-border)] bg-white text-[color:var(--fd-muted)]"
            }`}
          >
            <TradeIconPractice className="h-4 w-4" />
            {t("trade_mode_demo")}
          </button>
          <button
            type="button"
            onClick={() => onModeChange("live")}
            className={`flex items-center justify-center gap-2 rounded-2xl border-2 py-2.5 text-xs font-extrabold ${
              mode === "live"
                ? "border-[color:var(--fd-live)] bg-[color:var(--fd-live)] text-white"
                : "border-[color:var(--fd-border)] bg-white text-[color:var(--fd-muted)]"
            }`}
          >
            <TradeIconLive className="h-4 w-4" />
            {t("trade_mode_live")}
          </button>
        </div>

        {mode === "demo" ? (
          <div className="mt-2 flex items-center gap-2 rounded-2xl bg-[color:var(--fd-mint)] px-2.5 py-2">
            <TradeIconBadge tone="mint">
              <TradeIconWallet className="h-4 w-4" />
            </TradeIconBadge>
            <p className="min-w-0 flex-1 text-[11px] font-bold text-[color:var(--fd-text)]">
              <span className="font-mono tabular-nums text-sm">
                {eff.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </span>{" "}
              USDT
            </p>
            <button
              type="button"
              disabled={!canRefill || refillBusy}
              onClick={() => void refillDemo()}
              className="shrink-0 rounded-xl bg-[color:var(--fd-primary)] px-2.5 py-1.5 text-[10px] font-extrabold text-white disabled:opacity-40"
            >
              +10k
            </button>
          </div>
        ) : null}

        {mode === "live" && !tradeLiveEnabled ? (
          <div className="mt-2 space-y-2 rounded-2xl border-2 border-[color:var(--fd-live)]/30 bg-[color:var(--fd-sell-mint)] p-2.5">
            <p className="text-[11px] font-semibold text-[color:var(--fd-text)]">
              {t("trade_live_disabled_hint_short")}
            </p>
            <TradePrimaryBtn
              disabled={enableBusy}
              onClick={() => setShowEnable(true)}
              className="!bg-[color:var(--fd-live)] !shadow-[0_4px_14px_rgba(232,93,4,0.35)]"
            >
              {t("trade_enable_live")}
            </TradePrimaryBtn>
          </div>
        ) : null}

        {mode === "live" && tradeLiveEnabled ? (
          <p className="mt-2 text-center text-[10px] font-bold text-[color:var(--fd-live)]">
            {t("trade_mode_live_hint_short")}
          </p>
        ) : null}
      </TradeFlowCard>

      {showEnable ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center">
          <TradeFlowCard className="w-full max-w-md">
            <h4 className="text-base font-extrabold text-[color:var(--fd-text)]">
              {t("trade_enable_live_title")}
            </h4>
            <p className="mt-2 text-sm text-[color:var(--fd-muted)]">{t("trade_enable_live_body")}</p>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                className="flex-1 rounded-2xl border-2 border-[color:var(--fd-border)] py-2.5 text-sm font-bold"
                onClick={() => setShowEnable(false)}
              >
                {t("trade_ui_cancel")}
              </button>
              <button
                type="button"
                disabled={enableBusy}
                className="flex-1 rounded-2xl bg-[color:var(--fd-live)] py-2.5 text-sm font-extrabold text-white disabled:opacity-50"
                onClick={async () => {
                  await onEnableLive();
                  setShowEnable(false);
                }}
              >
                {t("trade_enable_live_confirm")}
              </button>
            </div>
          </TradeFlowCard>
        </div>
      ) : null}
    </>
  );
}
