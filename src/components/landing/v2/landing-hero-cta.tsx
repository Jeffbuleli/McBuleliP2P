"use client";

import Link from "next/link";
import { useI18n } from "@/components/i18n-provider";
import { useSessionEntryHref } from "@/hooks/use-session-app-href";

export function LandingHeroCta({ marketAnchor = "#rates" }: { marketAnchor?: string }) {
  const { t } = useI18n();
  const entryHref = useSessionEntryHref("/app/wallet");

  return (
    <div className="mt-5 flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-center lg:justify-start">
      <Link
        href={entryHref}
        prefetch={false}
        className="inline-flex min-h-[48px] items-center justify-center rounded-2xl bg-[#305F33] px-7 text-sm font-extrabold text-white shadow-lg shadow-emerald-900/15 transition hover:bg-[#244a27] active:scale-[0.99]"
      >
        {t("landing_v2_cta_start")}
      </Link>
      <Link
        href={marketAnchor}
        prefetch={false}
        className="inline-flex min-h-[48px] items-center justify-center rounded-2xl border border-stone-200 bg-white px-5 text-sm font-bold text-stone-700 transition hover:border-[#305F33]/30 hover:text-[#305F33]"
      >
        {t("landing_cta_market")}
      </Link>
    </div>
  );
}
