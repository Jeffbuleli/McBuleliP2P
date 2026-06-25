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
import type { TradeLiveGovernanceSnapshot } from "@/lib/trade-live-governance";
import { TradeGraduationCard } from "@/components/trade/trade-live-governance-ui";

export type TradeAppMode = "demo" | "live";

type Props = {
  mode: TradeAppMode;
  onModeChange: (m: TradeAppMode) => void;
  tradeLiveEnabled: boolean;
  governance: TradeLiveGovernanceSnapshot | null;
  demoUsdt: number;
  demoEffectiveUsdt?: number;
  piTest?: number;
  demoPiTestUsd?: number;
  onEnableLive: () => Promise<{ ok: boolean; error?: string }>;
  enableBusy: boolean;
  onDemoRefilled?: (demoUsdt: number) => void | Promise<void>;
};

export function TradeModeBar({
  mode,
  onModeChange,
  tradeLiveEnabled,
  governance,
  demoUsdt,
  demoEffectiveUsdt,
  onEnableLive,
  enableBusy,
  onDemoRefilled,
}: Props) {
  const { t } = useI18n();
  const [showEnable, setShowEnable] = useState(false);
  const [refillBusy, setRefillBusy] = useState(false);
  const [enableErr, setEnableErr] = useState<string | null>(null);

  const canRefill = demoUsdt <= 100;
  const eff =
    typeof demoEffectiveUsdt === "number" && Number.isFinite(demoEffectiveUsdt)
      ? demoEffectiveUsdt
      : demoUsdt;

  const canSelfEnable =
    governance?.graduationEligible &&
    !governance.tradeLiveDisabledReason &&
    !tradeLiveEnabled;

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

        {mode === "live" && governance && !tradeLiveEnabled ? (
          <div className="mt-2 space-y-2">
            {governance.tradeLiveDisabledReason ? (
              <p className="rounded-xl border border-rose-200 bg-rose-50 px-2.5 py-2 text-[11px] font-semibold text-rose-800">
                {t("trade_live_admin_disabled")}
                <span className="mt-1 block text-[10px] font-bold opacity-90">
                  {governance.tradeLiveDisabledReason}
                </span>
              </p>
            ) : null}
            {governance.graduationViaAcademy && !governance.graduationEligible ? null : (
              <TradeGraduationCard governance={governance} />
            )}
            {governance.graduationViaAcademy && governance.graduationEligible ? (
              <p className="text-[10px] font-bold text-emerald-700">
                {t("trade_live_graduation_academy")}
              </p>
            ) : null}
            {canSelfEnable ? (
              <div className="rounded-2xl border-2 border-[color:var(--fd-live)]/30 bg-[color:var(--fd-sell-mint)] p-2.5">
                <p className="text-[11px] font-semibold text-[color:var(--fd-text)]">
                  {t("trade_live_disabled_hint_short")}
                </p>
                <TradePrimaryBtn
                  disabled={enableBusy}
                  onClick={() => {
                    setEnableErr(null);
                    setShowEnable(true);
                  }}
                  className="mt-2 !bg-[color:var(--fd-live)] !shadow-[0_4px_14px_rgba(232,93,4,0.35)]"
                >
                  {t("trade_enable_live")}
                </TradePrimaryBtn>
              </div>
            ) : !governance.tradeLiveDisabledReason ? (
              <p className="text-[11px] font-semibold text-[color:var(--fd-muted)]">
                {t("trade_live_graduation_required").replace(
                  "{n}",
                  String(governance.minDemoClosedRequired),
                )}
              </p>
            ) : null}
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
            <span className="inline-flex rounded-full bg-[color:var(--fd-live)] px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-white">
              {t("trade_live_custodial_badge")}
            </span>
            <h4 className="mt-2 text-base font-extrabold text-[color:var(--fd-text)]">
              {t("trade_enable_live_title")}
            </h4>
            <p className="mt-2 text-sm text-[color:var(--fd-muted)]">
              {t("trade_enable_live_body")}
            </p>
            <p className="mt-2 text-xs font-semibold text-[color:var(--fd-text)]">
              {t("trade_live_custodial_hint")}
            </p>
            {enableErr ? (
              <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-800">
                {enableErr}
              </p>
            ) : null}
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
                  const r = await onEnableLive();
                  if (r.ok) {
                    setShowEnable(false);
                    setEnableErr(null);
                  } else {
                    setEnableErr(r.error ?? t("trade_live_enable_failed"));
                  }
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
