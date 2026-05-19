import { ProfileAvatarEditor } from "@/components/profile/profile-avatar-editor";
import { ProfileIdCopy } from "@/components/profile/profile-id-copy";
import { countryLabel } from "@/lib/country-label";
import { profileKycBadgeText } from "@/lib/profile-kyc-label";
import type { Locale } from "@/i18n/locale";
import { getDictionary } from "@/i18n/messages";
import { p2pDisplayName } from "@/lib/p2p-display";
import type { ProfileDashboard } from "@/lib/profile-stats";

function kycPillClass(status: string): string {
  const s = status.toLowerCase();
  if (s === "approved") return "fd-pill-ok";
  if (s === "pending" || s === "manual_review") return "fd-pill-warn";
  return "fd-pill-muted";
}

export function ProfileHero({
  dash,
  locale,
}: {
  dash: ProfileDashboard;
  locale: Locale;
}) {
  const d = getDictionary(locale);
  const kycLabel = profileKycBadgeText((k) => d[k], dash.kycStatus);
  const country =
    dash.countryCode != null
      ? countryLabel(locale, dash.countryCode)
      : d.profile_header_country_val;

  return (
    <section className="fd-hero px-4 py-5">
      <div className="flex flex-col items-center text-center">
        <ProfileAvatarEditor
          email={dash.email}
          initialAvatarUrl={dash.avatarUrl}
          variant="compact"
        />
        <h1 className="mt-3 text-xl font-bold tracking-tight text-[#1c1917]">
          {p2pDisplayName({
            email: dash.email,
            displayName: dash.displayName,
            avatarUrl: dash.avatarUrl,
            piUsername: null,
          })}
        </h1>
        <p className="mt-0.5 truncate text-xs font-medium text-[var(--fd-muted)]">
          {dash.email}
        </p>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
          <span className="rounded-full bg-white/80 px-2.5 py-0.5 text-[11px] font-medium text-[var(--fd-muted)]">
            {country}
          </span>
          <span className={kycPillClass(dash.kycStatus)}>{kycLabel}</span>
        </div>
        <div className="mt-3 flex max-w-full items-center gap-1.5 rounded-full border border-[var(--fd-border)] bg-white/70 px-2.5 py-1">
          <span className="truncate font-mono text-[10px] text-[var(--fd-muted)]">
            {dash.id.slice(0, 8)}…
          </span>
          <ProfileIdCopy
            id={dash.id}
            copyLabel={d.profile_id_copy}
            copiedLabel={d.profile_id_copied}
            variant="light"
          />
        </div>
      </div>
    </section>
  );
}
