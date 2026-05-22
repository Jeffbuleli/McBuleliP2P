"use client";

import { useI18n } from "@/components/i18n-provider";
import type { Messages } from "@/i18n/messages";

const STATUS_LABEL: Record<string, keyof Messages> = {
  pending: "group_status_pending",
  active: "group_status_active",
  approved: "group_status_approved",
  suspended: "group_status_suspended",
  rejected: "group_status_rejected",
  closed: "group_status_closed",
};

function statusStyles(s: string): string {
  if (s === "active" || s === "approved") {
    return "bg-emerald-100 text-emerald-900 ring-emerald-600/25";
  }
  if (s === "pending") {
    return "bg-amber-100 text-amber-900 ring-amber-600/25";
  }
  if (s === "suspended" || s === "rejected") {
    return "bg-rose-100 text-rose-900 ring-rose-600/25";
  }
  return "bg-stone-100 text-stone-800 ring-stone-400/25";
}

export function GroupStatusBadge({ status }: { status: string }) {
  const { t } = useI18n();
  const s = status?.toLowerCase?.() ?? "";
  const labelKey = STATUS_LABEL[s];
  const label = labelKey ? t(labelKey) : status;

  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1 ${statusStyles(s)}`}
    >
      {label}
    </span>
  );
}
