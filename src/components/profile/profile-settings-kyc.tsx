import Link from "next/link";
import { profileKycBadgeText } from "@/lib/profile-kyc-label";
import type { Locale } from "@/i18n/locale";
import { getDictionary } from "@/i18n/messages";
import { KycIllustrationShield } from "@/components/kyc/kyc-progress";

function kycPillClass(status: string): string {
  const s = status.toLowerCase();
  if (s === "approved") return "fd-pill-ok";
  if (s === "pending" || s === "manual_review") return "fd-pill-warn";
  return "fd-pill-muted";
}

export function ProfileSettingsKyc({
  kycStatus,
  locale,
}: {
  kycStatus: string | null | undefined;
  locale: Locale;
}) {
  const d = getDictionary(locale);
  const label = profileKycBadgeText((k) => d[k], kycStatus);

  return (
    <section className="fd-card p-4">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[color:var(--fd-mint)] text-[color:var(--fd-primary)]">
          <KycIllustrationShield className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-[color:var(--fd-text)]">{d.profile_settings_kyc}</p>
          <div className="mt-2 flex items-center justify-between gap-2">
            <span className={kycPillClass(kycStatus ?? "none")}>{label}</span>
            <Link
              href="/app/profile/kyc"
              className="text-xs font-bold text-[color:var(--fd-primary)] underline"
            >
              {d.kyc_gate_cta}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
