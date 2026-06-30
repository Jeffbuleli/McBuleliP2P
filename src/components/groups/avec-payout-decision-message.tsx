"use client";

import { useI18n } from "@/components/i18n-provider";
import { AvecIconTreasury } from "@/components/groups/avec-icons";
import type { PayoutDecisionMeta } from "@/lib/group-savings-messaging";

export function AvecPayoutDecisionMessage({
  meta,
  createdAt,
  locale,
}: {
  meta: PayoutDecisionMeta | null;
  createdAt: string;
  locale: string;
}) {
  const { t } = useI18n();
  const loc = locale === "fr" ? "fr-FR" : "en-US";

  if (!meta) {
    return (
      <p className="text-center text-[10px] text-[color:var(--fd-muted)]">
        {t("group_payout_decision_fallback")}
      </p>
    );
  }

  const approverNames =
    meta.approvers.length > 0
      ? meta.approvers.map((a) => a.displayName).join(" · ")
      : "—";

  return (
    <div className="mx-auto w-full max-w-sm rounded-2xl border-2 border-[color:var(--fd-primary)]/25 bg-gradient-to-br from-[color:var(--fd-mint)] to-[color:var(--fd-card)] p-3 shadow-sm">
      <div className="flex items-center gap-2 border-b border-[color:var(--fd-primary)]/15 pb-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[color:var(--fd-primary)] text-white">
          <AvecIconTreasury className="h-5 w-5" />
        </span>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wide text-[color:var(--fd-primary)]">
            {t("group_payout_decision_badge")}
          </p>
          <p className="text-[9px] text-[color:var(--fd-muted)]">
            {new Date(meta.executedAt || createdAt).toLocaleString(loc)}
          </p>
        </div>
      </div>
      <dl className="mt-2 space-y-1.5 text-[11px]">
        <div className="flex justify-between gap-2">
          <dt className="text-[color:var(--fd-muted)]">{t("group_payout_decision_amount")}</dt>
          <dd className="font-bold tabular-nums text-[color:var(--fd-primary)]">
            {meta.amountUsdt.toFixed(2)} USDT
          </dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-[color:var(--fd-muted)]">{t("group_payout_decision_beneficiary")}</dt>
          <dd className="font-semibold text-[color:var(--fd-text)]">{meta.beneficiaryDisplay}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-[color:var(--fd-muted)]">{t("group_payout_initiated_by")}</dt>
          <dd className="font-semibold text-[color:var(--fd-text)]">{meta.initiatedByDisplay}</dd>
        </div>
        <div>
          <dt className="text-[color:var(--fd-muted)]">{t("group_payout_approved_by")}</dt>
          <dd className="mt-0.5 font-semibold leading-snug text-[color:var(--fd-text)]">
            {approverNames}
          </dd>
        </div>
      </dl>
      <p className="mt-2 text-center text-[9px] font-bold uppercase tracking-wide text-[color:var(--fd-primary)]/80">
        McBuleli · {t("group_payout_decision_footer")}
      </p>
    </div>
  );
}

function parsePayoutMeta(meta: Record<string, unknown> | null): PayoutDecisionMeta | null {
  if (!meta || typeof meta !== "object") return null;
  if (typeof meta.amountUsdt !== "number") return null;
  return meta as unknown as PayoutDecisionMeta;
}

export { parsePayoutMeta };
