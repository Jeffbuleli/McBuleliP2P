"use client";

import Link from "next/link";
import Image from "next/image";
import { useI18n } from "@/components/i18n-provider";
import { cryptoDepositHref, cryptoWithdrawHref } from "@/lib/wallet-money-routes";

/** Pi wallet - manual deposit & withdraw only (no preset Pi Pay amounts). */
export function PiManualWalletSection() {
  const { t } = useI18n();

  return (
    <section className="fd-card mt-4 overflow-hidden p-4">
      <div className="flex items-center gap-3">
        <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full ring-2 ring-white shadow-md">
          <Image
            src="/assets/crypto/pi.png"
            alt=""
            width={48}
            height={48}
            className="object-cover"
          />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-[color:var(--fd-text)]">
            {t("pi_manual_title")}
          </p>
          <p className="mt-0.5 text-[11px] leading-snug text-[color:var(--fd-muted)]">
            {t("pi_manual_hint")}
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <Link
          href={cryptoDepositHref("PI")}
          className="flex min-h-[52px] flex-col items-center justify-center gap-1 rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50 to-orange-100/90 px-2 text-center active:scale-[0.98]"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-amber-800 shadow-sm">
            <ArrowDown />
          </span>
          <span className="text-xs font-bold text-[color:var(--fd-text)]">
            {t("pi_manual_deposit")}
          </span>
        </Link>
        <Link
          href={cryptoWithdrawHref("PI")}
          className="flex min-h-[52px] flex-col items-center justify-center gap-1 rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50 to-[color:var(--fd-mint)] px-2 text-center active:scale-[0.98]"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-[color:var(--fd-primary)] shadow-sm">
            <ArrowUp />
          </span>
          <span className="text-xs font-bold text-[color:var(--fd-text)]">
            {t("pi_manual_withdraw")}
          </span>
        </Link>
      </div>
    </section>
  );
}


function ArrowDown() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 5v14M7 14l5 5 5-5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ArrowUp() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 19V5M7 10l5-5 5 5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
