"use client";

import { useI18n } from "@/components/i18n-provider";
import { memberTrustTier } from "@/lib/avec/member-trust-tier";
import type { Messages } from "@/i18n/messages";

const TIER_KEYS: Record<
  ReturnType<typeof memberTrustTier>,
  keyof Messages
> = {
  new: "group_trust_tier_new",
  active: "group_trust_tier_active",
  trusted: "group_trust_tier_trusted",
};

const TIER_CLS: Record<ReturnType<typeof memberTrustTier>, string> = {
  new: "bg-stone-100 text-stone-600",
  active: "bg-sky-50 text-sky-800",
  trusted: "bg-emerald-50 text-emerald-800",
};

export function AvecMemberTrustBadge({
  meetingsPaid,
  sharesTotal,
  kycApproved,
}: {
  meetingsPaid?: number;
  sharesTotal?: number;
  kycApproved?: boolean;
}) {
  const { t } = useI18n();
  const tier = memberTrustTier({ meetingsPaid, sharesTotal, kycApproved });
  return (
    <span
      className={`inline-flex shrink-0 rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${TIER_CLS[tier]}`}
      title={t("group_trust_tier_hint")}
    >
      {t(TIER_KEYS[tier])}
    </span>
  );
}
