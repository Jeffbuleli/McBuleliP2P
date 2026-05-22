"use client";

import { useI18n } from "@/components/i18n-provider";
import { AvecIconCycle } from "@/components/groups/avec-icons";
import type { ClosureDecisionMeta } from "@/lib/group-savings-messaging";

export function AvecClosureDecisionMessage({
  meta,
}: {
  meta: Record<string, unknown> | null;
}) {
  const { t } = useI18n();
  const m = meta as ClosureDecisionMeta | null;
  if (!m?.distributableUsdt) {
    return (
      <p className="text-xs text-[color:var(--fd-muted)]">
        {t("group_closure_decision_fallback")}
      </p>
    );
  }

  return (
    <div className="rounded-2xl border-2 border-violet-200/90 bg-violet-50/70 p-3">
      <div className="flex items-center gap-2">
        <AvecIconCycle className="h-5 w-5 text-violet-800" />
        <span className="text-[10px] font-bold uppercase tracking-wide text-violet-900">
          {t("group_closure_decision_badge")}
        </span>
      </div>
      <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
        <dt className="text-[color:var(--fd-muted)]">{t("group_closure_cycle")}</dt>
        <dd className="font-bold">#{m.cycleNumber}</dd>
        <dt className="text-[color:var(--fd-muted)]">{t("group_closure_distributed")}</dt>
        <dd className="font-bold">{m.distributableUsdt.toFixed(2)} USDT</dd>
        <dt className="text-[color:var(--fd-muted)]">{t("group_closure_final_share")}</dt>
        <dd>{m.finalShareValueUsdt.toFixed(4)} USDT</dd>
        <dt className="text-[color:var(--fd-muted)]">{t("group_payout_initiated_by")}</dt>
        <dd>{m.initiatedByDisplay}</dd>
        <dt className="text-[color:var(--fd-muted)]">{t("group_payout_approved_by")}</dt>
        <dd>{m.approvers.map((a) => a.displayName).join(", ")}</dd>
      </dl>
    </div>
  );
}
