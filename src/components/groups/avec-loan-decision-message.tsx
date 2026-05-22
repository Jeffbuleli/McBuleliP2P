"use client";

import { useI18n } from "@/components/i18n-provider";
import { AvecIconCycle } from "@/components/groups/avec-icons";
import type { LoanDecisionMeta } from "@/lib/group-savings-messaging";

export function AvecLoanDecisionMessage({
  meta,
  createdAt,
  locale,
}: {
  meta: LoanDecisionMeta | null;
  createdAt: string;
  locale: string;
}) {
  const { t } = useI18n();
  const loc = locale === "fr" ? "fr-FR" : "en-US";

  if (!meta) {
    return (
      <p className="text-center text-[10px] text-[color:var(--fd-muted)]">
        {t("group_loan_decision_fallback")}
      </p>
    );
  }

  return (
    <div className="mx-auto w-full max-w-sm rounded-2xl border-2 border-cyan-600/30 bg-gradient-to-br from-cyan-50 to-[color:var(--fd-card)] p-3 shadow-sm">
      <div className="flex items-center gap-2 border-b border-cyan-600/15 pb-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-700 text-white">
          <AvecIconCycle className="h-5 w-5" />
        </span>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wide text-cyan-800">
            {t("group_loan_decision_badge")}
          </p>
          <p className="text-[9px] text-[color:var(--fd-muted)]">
            {new Date(meta.executedAt || createdAt).toLocaleString(loc)}
          </p>
        </div>
      </div>
      <dl className="mt-2 space-y-1.5 text-[11px]">
        <div className="flex justify-between gap-2">
          <dt className="text-[color:var(--fd-muted)]">{t("group_loan_amount")}</dt>
          <dd className="font-bold tabular-nums text-cyan-900">
            {meta.amountUsdt.toFixed(2)} USDT
          </dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-[color:var(--fd-muted)]">{t("group_loan_borrower")}</dt>
          <dd className="font-semibold">{meta.borrowerDisplay}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-[color:var(--fd-muted)]">{t("group_payout_initiated_by")}</dt>
          <dd className="font-semibold">{meta.initiatedByDisplay}</dd>
        </div>
        <div>
          <dt className="text-[color:var(--fd-muted)]">{t("group_payout_approved_by")}</dt>
          <dd className="mt-0.5 font-semibold leading-snug">
            {meta.approvers.map((a) => a.displayName).join(" · ") || "—"}
          </dd>
        </div>
      </dl>
    </div>
  );
}

export function parseLoanMeta(
  meta: Record<string, unknown> | null,
): LoanDecisionMeta | null {
  if (!meta || typeof meta.amountUsdt !== "number") return null;
  return meta as unknown as LoanDecisionMeta;
}
