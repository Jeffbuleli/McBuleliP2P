"use client";

import { useI18n } from "@/components/i18n-provider";

export function AvecRoleStrip({
  role,
  status,
}: {
  role: string;
  status: string;
}) {
  const { t } = useI18n();
  if (status !== "approved") {
    return (
      <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-center text-xs font-semibold text-amber-900">
        {t("avec_role_pending")}
      </p>
    );
  }
  const key =
    role === "admin"
      ? "avec_role_admin"
      : role === "co_admin"
        ? "avec_role_coadmin"
        : role === "committee"
          ? "avec_role_committee"
          : "avec_role_member";
  return (
    <p className="rounded-xl border border-[color:var(--fd-primary)]/20 bg-[color:var(--fd-mint)]/50 px-3 py-2 text-center text-[10px] font-bold uppercase tracking-wide text-[color:var(--fd-primary)]">
      {t(key)}
    </p>
  );
}
