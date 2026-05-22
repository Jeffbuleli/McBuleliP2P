"use client";

import { useCallback, useEffect, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { AvecIconTreasury } from "@/components/groups/avec-icons";
import { avecCls } from "@/components/groups/avec-ui";

type Funds = {
  totalUsdt: number;
  savingsUsdt: number;
  socialUsdt: number;
  adminUsdt: number;
  lentUsdt: number;
  availableUsdt: number;
  totalShares: number;
  shareValueUsdt: number;
};

function FundRow({
  label,
  value,
  hint,
  accent,
  compact,
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: boolean;
  compact?: boolean;
}) {
  if (compact) {
    return (
      <div
        className={`rounded-xl border px-2.5 py-2 ${
          accent
            ? "border-[color:var(--fd-primary)]/25 bg-[color:var(--fd-mint)]/40"
            : "border-[color:var(--fd-border)] bg-[color:var(--fd-card)]"
        }`}
      >
        <p className="truncate text-[9px] font-bold uppercase tracking-wide text-[color:var(--fd-muted)]">
          {label}
        </p>
        <p className="mt-0.5 truncate font-mono text-xs font-bold tabular-nums text-[color:var(--fd-primary)]">
          {value}
        </p>
      </div>
    );
  }
  return (
    <div
      className={`flex items-center justify-between gap-2 rounded-xl border px-3 py-2 ${
        accent
          ? "border-[color:var(--fd-primary)]/25 bg-[color:var(--fd-mint)]/40"
          : "border-[color:var(--fd-border)] bg-[color:var(--fd-card)]"
      }`}
    >
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wide text-[color:var(--fd-muted)]">
          {label}
        </p>
        {hint ? <p className="text-[9px] text-[color:var(--fd-muted)]">{hint}</p> : null}
      </div>
      <p className="shrink-0 font-mono text-sm font-bold tabular-nums text-[color:var(--fd-primary)]">
        {value}
      </p>
    </div>
  );
}

export function AvecTreasuryFunds({
  groupId,
  onRefreshKey,
}: {
  groupId: string;
  onRefreshKey?: number;
}) {
  const { t } = useI18n();
  const [funds, setFunds] = useState<Funds | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/groups/${groupId}/funds`, { cache: "no-store" });
    const j = await res.json().catch(() => ({}));
    if (res.ok && j.funds) setFunds(j.funds as Funds);
  }, [groupId]);

  useEffect(() => {
    void load();
  }, [load, onRefreshKey]);

  const fmt = (n: number) => `${n.toFixed(2)} USDT`;

  return (
    <div className={avecCls.section}>
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[color:var(--fd-mint)] text-[color:var(--fd-primary)]">
          <AvecIconTreasury className="h-5 w-5" />
        </span>
        <div>
          <p className={avecCls.sectionTitle}>{t("avec_treasury_title")}</p>
          <p className="text-2xl font-black tabular-nums text-[color:var(--fd-primary)]">
            {funds ? funds.totalUsdt.toFixed(0) : "…"}
            <span className="ml-1 text-xs font-bold">USDT</span>
          </p>
        </div>
      </div>

      {funds ? (
        <div className="space-y-2">
          <FundRow
            label={t("avec_fund_savings")}
            value={fmt(funds.savingsUsdt)}
            hint={t("avec_fund_savings_hint", {
              shares: funds.totalShares,
              value: funds.shareValueUsdt.toFixed(2),
            })}
            accent
          />
          <FundRow label={t("avec_fund_social")} value={fmt(funds.socialUsdt)} />
          <FundRow label={t("avec_fund_admin")} value={fmt(funds.adminUsdt)} />
          <div className="grid grid-cols-2 gap-2 pt-1">
            <FundRow
              compact
              label={t("avec_fund_avail_short")}
              value={fmt(funds.availableUsdt)}
              accent
            />
            <FundRow compact label={t("avec_fund_lent_short")} value={fmt(funds.lentUsdt)} />
          </div>
        </div>
      ) : (
        <p className="text-xs text-[color:var(--fd-muted)]">…</p>
      )}
    </div>
  );
}
