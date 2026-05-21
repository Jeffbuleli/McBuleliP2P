import { profileKycBadgeText } from "@/lib/profile-kyc-label";
import type { Locale } from "@/i18n/locale";
import { getDictionary } from "@/i18n/messages";

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
      <p className="text-sm font-bold text-[color:var(--fd-text)]">{d.profile_settings_kyc}</p>
      <p className="mt-1 text-xs text-[color:var(--fd-muted)]">{d.profile_settings_kyc_hint}</p>
      <div className="mt-3 flex items-center justify-between gap-2 rounded-xl bg-stone-50 px-3 py-2.5">
        <span className="text-xs text-[color:var(--fd-muted)]">{d.profile_kyc_label}</span>
        <span className={kycPillClass(kycStatus ?? "none")}>{label}</span>
      </div>
    </section>
  );
}
