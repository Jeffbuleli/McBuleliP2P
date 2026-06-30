"use client";

import { useI18n } from "@/components/i18n-provider";
import { AvecIconTreasury } from "@/components/groups/avec-icons";

export type PayoutPendingMeta = {
  requestId: string;
  amountUsdt: number;
  beneficiaryDisplay: string;
  initiatedByDisplay: string;
  requiredApprovals: number;
  approvalCount: number;
};

export function parsePayoutPendingMeta(
  meta: Record<string, unknown> | null,
  body?: string,
): PayoutPendingMeta | null {
  if (meta && typeof meta.amountUsdt === "number") {
    return meta as unknown as PayoutPendingMeta;
  }
  if (body?.startsWith("PAYOUT_PENDING")) {
    const sep = body.includes("|") ? "|" : ":";
    const p = body.split(sep);
    const amount = Number(p[2]);
    const required = Number(p[5]);
    const count = Number(p[6]);
    if (!Number.isFinite(amount)) return null;
    return {
      requestId: p[1] ?? "",
      amountUsdt: amount,
      beneficiaryDisplay: p[3] ?? "—",
      initiatedByDisplay: p[4] ?? "—",
      requiredApprovals: Number.isFinite(required) ? required : 2,
      approvalCount: Number.isFinite(count) ? count : 0,
    };
  }
  return null;
}

export function AvecPayoutPendingMessage({
  meta,
  createdAt,
  locale,
}: {
  meta: PayoutPendingMeta | null;
  createdAt: string;
  locale: string;
}) {
  const { t } = useI18n();
  const loc = locale === "fr" ? "fr-FR" : "en-US";
  if (!meta) {
    return (
      <p className="text-center text-[10px] text-[color:var(--fd-muted)]">
        {t("group_payout_pending_fallback")}
      </p>
    );
  }

  const pct = Math.min(
    100,
    Math.round((meta.approvalCount / Math.max(1, meta.requiredApprovals)) * 100),
  );

  return (
    <div className="mx-auto w-full max-w-sm rounded-2xl border-2 border-dashed border-amber-300/80 bg-gradient-to-br from-amber-50 to-[color:var(--fd-card)] p-3 shadow-sm">
      <div className="flex items-center gap-2">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-800">
          <AvecIconTreasury className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-wide text-amber-900">
            {t("group_payout_pending_badge")}
          </p>
          <p className="truncate text-lg font-black tabular-nums text-amber-950">
            {meta.amountUsdt.toFixed(2)} <span className="text-xs font-bold">USDT</span>
          </p>
        </div>
      </div>

      <div className="mt-2 grid grid-cols-2 gap-2 text-[10px]">
        <div className="rounded-lg bg-white/80 px-2 py-1.5">
          <p className="text-[color:var(--fd-muted)]">{t("group_payout_decision_beneficiary")}</p>
          <p className="truncate font-bold">{meta.beneficiaryDisplay}</p>
        </div>
        <div className="rounded-lg bg-white/80 px-2 py-1.5">
          <p className="text-[color:var(--fd-muted)]">{t("group_payout_initiated_by")}</p>
          <p className="truncate font-bold">{meta.initiatedByDisplay}</p>
        </div>
      </div>

      <div className="mt-2">
        <div className="mb-1 flex justify-between text-[9px] font-bold text-amber-900">
          <span>{t("group_payout_approvals_progress", { count: meta.approvalCount, required: meta.requiredApprovals })}</span>
          <span>{pct}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-amber-100">
          <div
            className="h-full rounded-full bg-amber-500 transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <p className="mt-2 text-center text-[9px] text-[color:var(--fd-muted)]">
        {new Date(createdAt).toLocaleString(loc)}
      </p>
    </div>
  );
}
