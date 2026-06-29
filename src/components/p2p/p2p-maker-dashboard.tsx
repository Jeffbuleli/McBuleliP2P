"use client";

import type { ReactNode } from "react";
import { useI18n } from "@/components/i18n-provider";
import { interpolate } from "@/i18n/messages";
import { P2pIconEscrow, P2pIconStar } from "@/components/p2p/p2p-icons";
import { KycVerifiedBadge } from "@/components/kyc/kyc-verified-badge";

export type P2pMakerDashboardData = {
  activeAds: number;
  pausedAds: number;
  ordersInProgress: number;
  completedTrades: number;
  completionRatePct: number | null;
  volume30dByFiat: Record<string, number>;
  medianReleaseMinutes: number | null;
  verifiedMerchant: boolean;
  rating: { avg: number; count: number } | null;
};

function fmtMinutes(m: number, locale: string): string {
  if (m < 60) return `${Math.round(m)} min`;
  const h = Math.floor(m / 60);
  const r = Math.round(m % 60);
  return r > 0 ? `${h}h ${r}m` : `${h}h`;
}

export function P2pMakerDashboard({ data }: { data: P2pMakerDashboardData }) {
  const { t, locale } = useI18n();
  const loc = locale === "fr" ? "fr-FR" : "en-US";
  const volEntries = Object.entries(data.volume30dByFiat).filter(([, v]) => v > 0);

  return (
    <div className="fd-card space-y-3 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-bold text-[color:var(--fd-text)]">{t("p2p_maker_dashboard_title")}</p>
        {data.verifiedMerchant ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-[color:var(--fd-mint)] px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-[color:var(--fd-primary)]">
            <P2pIconEscrow className="h-3 w-3" />
            {t("p2p_merchant_verified")}
          </span>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Stat label={t("p2p_maker_dashboard_ads_active")} value={String(data.activeAds)} />
        <Stat label={t("p2p_maker_dashboard_orders")} value={String(data.ordersInProgress)} />
        <Stat
          label={t("p2p_maker_trades", { count: data.completedTrades })}
          value={
            data.rating && data.rating.count > 0 ? (
              <span className="inline-flex items-center gap-0.5 text-amber-600">
                <P2pIconStar filled className="h-3.5 w-3.5" />
                {data.rating.avg.toFixed(1)}
              </span>
            ) : (
              "-"
            )
          }
        />
        <Stat
          label={t("p2p_merchant_completion")}
          value={
            data.completionRatePct != null ? `${data.completionRatePct}%` : "-"
          }
        />
      </div>

      {data.medianReleaseMinutes != null ? (
        <p className="text-[10px] font-semibold text-[color:var(--fd-muted)]">
          {interpolate(t("p2p_merchant_release_median"), {
            time: fmtMinutes(data.medianReleaseMinutes, loc),
          })}
        </p>
      ) : null}

      {volEntries.length > 0 ? (
        <p className="text-[10px] font-semibold text-[color:var(--fd-muted)]">
          {t("p2p_merchant_volume_30d")}{" "}
          {volEntries
            .map(([cur, amt]) =>
              `${amt.toLocaleString(loc, { maximumFractionDigits: 0 })} ${cur}`,
            )
            .join(" · ")}
        </p>
      ) : null}

      {data.verifiedMerchant ? (
        <p className="flex items-center gap-1 text-[10px] font-semibold text-[color:var(--fd-primary)]">
          <KycVerifiedBadge compact />
          {t("p2p_merchant_verified_hint")}
        </p>
      ) : null}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-xl border border-white/8 bg-[#0a1018]/75 px-2.5 py-2">
      <p className="text-[9px] font-bold uppercase tracking-wide text-[color:var(--fd-muted)]">
        {label}
      </p>
      <p className="mt-0.5 text-base font-bold tabular-nums text-[color:var(--fd-text)]">{value}</p>
    </div>
  );
}
