"use client";

import Link from "next/link";
import { useI18n } from "@/components/i18n-provider";
import { KycIconShield } from "@/components/kyc/kyc-illustrations";

export function KycGateCard({ compact }: { compact?: boolean }) {
  const { t } = useI18n();
  return (
    <div
      className={`rounded-2xl border-2 border-amber-200/90 bg-gradient-to-br from-amber-50 to-white ${
        compact ? "p-3" : "p-4"
      }`}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-900">
          <KycIconShield className="h-6 w-6" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-amber-950">{t("kyc_gate_title")}</p>
          {!compact ? (
            <p className="mt-0.5 text-[10px] text-amber-900/80">{t("kyc_gate_body")}</p>
          ) : null}
          <Link
            href="/app/profile/kyc"
            className="mt-2 inline-flex rounded-xl bg-[color:var(--fd-primary)] px-4 py-2 text-xs font-bold text-white"
          >
            {t("kyc_gate_cta")}
          </Link>
        </div>
      </div>
    </div>
  );
}
