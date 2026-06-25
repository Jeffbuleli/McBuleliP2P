"use client";

import { useI18n } from "@/components/i18n-provider";
import type { TradeLiveGovernanceSnapshot } from "@/lib/trade-live-governance";
import { TradeIconShield } from "@/components/trade/trade-icons";

function Meter({
  label,
  value,
  cap,
  tone = "mint",
}: {
  label: string;
  value: number;
  cap: number;
  tone?: "mint" | "rose";
}) {
  const pct = cap > 0 ? Math.min(100, (value / cap) * 100) : 0;
  const bar =
    tone === "rose"
      ? "bg-rose-500"
      : "bg-[color:var(--fd-primary)]";
  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-2 text-[10px] font-bold">
        <span className="text-[color:var(--fd-muted)]">{label}</span>
        <span className="font-mono tabular-nums text-[color:var(--fd-text)]">
          {value.toFixed(0)} / {cap.toFixed(0)} USDT
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-[color:var(--fd-mint)]">
        <div
          className={`h-full rounded-full transition-all ${bar}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function TradeLiveGovernanceStrip({
  governance,
}: {
  governance: TradeLiveGovernanceSnapshot;
}) {
  const { t } = useI18n();

  return (
    <div className="space-y-2.5 rounded-2xl border-2 border-[color:var(--fd-live)]/25 bg-gradient-to-br from-[color:var(--fd-sell-mint)] to-white p-3">
      <div className="flex items-start gap-2">
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[color:var(--fd-live)] px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-white">
          {t("trade_live_custodial_badge")}
        </span>
        <p className="min-w-0 flex-1 text-[10px] font-semibold leading-snug text-[color:var(--fd-text)]">
          {t("trade_live_custodial_hint")}
        </p>
      </div>

      {governance.tradeLiveDisabledReason ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-2.5 py-2 text-[10px] font-semibold text-rose-800">
          <span className="font-extrabold">{t("trade_live_admin_reason")}: </span>
          {governance.tradeLiveDisabledReason}
        </p>
      ) : null}

      <div className="grid gap-2.5 sm:grid-cols-2">
        <Meter
          label={t("trade_live_exposure_open")}
          value={governance.liveOpenMarginUsdt}
          cap={governance.liveMarginCapUsdt * 2}
        />
        <Meter
          label={t("trade_live_daily_loss")}
          value={governance.liveDailyLossUsdt}
          cap={governance.liveDailyLossCapUsdt}
          tone="rose"
        />
      </div>

      <Meter
        label={t("trade_house_stress_label")}
        value={governance.house.stressLiabilityUsdt}
        cap={governance.house.reserveUsdt * 0.85}
        tone={
          governance.house.stressUtilizationPct >= 0.7 ? "rose" : "mint"
        }
      />

      {governance.house.circuitTripped ? (
        <p className="rounded-xl border border-amber-300 bg-amber-50 px-2.5 py-2 text-[10px] font-semibold text-amber-950">
          {t("trade_house_circuit_hint")}
        </p>
      ) : governance.house.stressUtilizationPct >= 0.55 ? (
        <p className="text-[10px] font-semibold text-amber-800">
          {t("trade_house_stress_hint").replace(
            "{pct}",
            String(Math.round(governance.house.stressUtilizationPct * 100)),
          )}
        </p>
      ) : null}

      <p className="text-center text-[9px] font-bold text-[color:var(--fd-muted)]">
        {t("trade_live_exposure_cap_label")}: {governance.liveMarginCapUsdt} USDT / ordre ·{" "}
        {t("trade_live_daily_loss_cap_label")}: {governance.liveDailyLossCapUsdt} USDT
      </p>
    </div>
  );
}

export function TradeGraduationCard({
  governance,
}: {
  governance: TradeLiveGovernanceSnapshot;
}) {
  const { t } = useI18n();

  if (governance.tradeLiveEnabled || governance.graduationEligible) {
    return null;
  }

  const done = governance.demoClosedTrades;
  const required = governance.minDemoClosedRequired;
  const pct = Math.min(100, (done / Math.max(1, required)) * 100);

  return (
    <div className="rounded-2xl border-2 border-[color:var(--fd-border)] bg-white p-3 shadow-sm">
      <div className="mb-2 flex items-center gap-2">
        <TradeIconShield className="h-4 w-4 text-[color:var(--fd-primary)]" />
        <p className="text-xs font-extrabold text-[color:var(--fd-text)]">
          {t("trade_live_graduation_title")}
        </p>
      </div>
      <p className="text-[11px] font-semibold text-[color:var(--fd-muted)]">
        {t("trade_live_graduation_demo")
          .replace("{done}", String(done))
          .replace("{required}", String(required))}
      </p>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-[color:var(--fd-mint)]">
        <div
          className="h-full rounded-full bg-[color:var(--fd-primary)] transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-2 text-[10px] text-[color:var(--fd-muted)]">
        {t("trade_live_graduation_required").replace("{n}", String(required))}
      </p>
      <a
        href="/app/academy"
        className="mt-2 inline-flex text-[10px] font-extrabold text-[color:var(--fd-primary)] underline"
      >
        {t("trade_live_graduation_cta_academy")}
      </a>
    </div>
  );
}
