"use client";

import Link from "next/link";
import { useI18n } from "@/components/i18n-provider";
import { useSessionEntryHref } from "@/hooks/use-session-app-href";

export function LandingHeroCta() {
  const { t } = useI18n();
  const entryHref = useSessionEntryHref("/app");

  return (
    <div className="mt-5 flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-start">
      <Link
        href={entryHref}
        prefetch={false}
        className="inline-flex min-h-[48px] items-center justify-center rounded-2xl bg-[#305F33] px-7 text-sm font-bold text-white transition hover:bg-[#244a27] active:scale-[0.99]"
      >
        {t("landing_v2_cta_start")}
      </Link>
      <Link
        href="/login?next=%2Fapp"
        prefetch={false}
        className="inline-flex min-h-[48px] items-center justify-center rounded-2xl border border-stone-200 bg-white px-6 text-sm font-semibold text-stone-800 transition hover:border-[#305F33]/35 hover:text-[#305F33]"
      >
        {t("landing_cta_login")}
      </Link>
    </div>
  );
}
