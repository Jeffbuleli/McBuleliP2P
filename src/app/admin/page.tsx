"use client";

import Link from "next/link";
import { useI18n } from "@/components/i18n-provider";

export default function AdminHomePage() {
  const { t } = useI18n();

  return (
    <div className="space-y-4">
      <p className="text-sm text-stone-400">{t("admin_intro")}</p>
      <Link
        href="/admin/withdrawals"
        className="inline-block rounded-xl bg-amber-600 px-5 py-3 font-semibold text-stone-950"
      >
        {t("admin_queue")}
      </Link>
    </div>
  );
}
