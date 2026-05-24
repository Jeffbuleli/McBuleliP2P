"use client";

import Image from "next/image";
import { useI18n } from "@/components/i18n-provider";

/** McBuleli branding on the KYC progress page (before/after Didit capture). */
export function KycProcessBrandHeader() {
  const { t } = useI18n();

  return (
    <header className="flex items-center gap-3 border-b border-[color:var(--fd-border)]/60 bg-white/80 px-5 py-3.5">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[color:var(--fd-mint)] ring-1 ring-[color:var(--fd-primary)]/15">
        <Image
          src="/brand/logo.png"
          alt=""
          width={32}
          height={32}
          className="h-8 w-8 object-contain"
          unoptimized
        />
      </span>
      <div className="min-w-0">
        <p className="text-base font-black tracking-tight text-[color:var(--fd-text)]">
          {t("brand")}
        </p>
        <p className="text-[10px] font-medium text-[color:var(--fd-muted)]">
          {t("kyc_page_sub_short")}
        </p>
      </div>
    </header>
  );
}

export function KycProcessBrandFooter() {
  const { t } = useI18n();

  return (
    <footer className="flex flex-col items-center gap-1 border-t border-[color:var(--fd-border)]/60 bg-[color:var(--fd-mint)]/20 px-5 py-4">
      <div className="flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-[color:var(--fd-primary)]/10">
          <Image
            src="/brand/logo.png"
            alt=""
            width={22}
            height={22}
            className="h-[1.125rem] w-[1.125rem] object-contain"
            unoptimized
          />
        </span>
        <span className="text-xs font-extrabold tracking-tight text-[color:var(--fd-primary)]">
          {t("brand")}
        </span>
      </div>
      <p className="text-center text-[9px] text-[color:var(--fd-muted)]">
        {t("kyc_brand_footer")}
      </p>
    </footer>
  );
}
