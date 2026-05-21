import Link from "next/link";
import { ProfileAvatarEditor } from "@/components/profile/profile-avatar-editor";
import { ProfileHeroQr } from "@/components/profile/profile-hero-qr";
import { ProfileIdCopy } from "@/components/profile/profile-id-copy";
import { countryLabel } from "@/lib/country-label";
import type { Locale } from "@/i18n/locale";
import { getDictionary } from "@/i18n/messages";
import { p2pDisplayName } from "@/lib/p2p-display";
import type { ProfileDashboard } from "@/lib/profile-stats";

function EditPencilLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex shrink-0 items-center justify-center rounded-full p-0.5 text-[color:var(--fd-primary)] active:scale-95"
      aria-label={label}
    >
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M4 20h4l10.5-10.5a2.12 2.12 0 00-3-3L5 17v3z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
      </svg>
    </Link>
  );
}

export function ProfileHero({
  dash,
  locale,
}: {
  dash: ProfileDashboard;
  locale: Locale;
}) {
  const d = getDictionary(locale);
  const country =
    dash.countryCode != null
      ? countryLabel(locale, dash.countryCode)
      : d.profile_header_country_val;
  const displayName = p2pDisplayName({
    email: dash.email,
    displayName: dash.displayName,
    avatarUrl: dash.avatarUrl,
    piUsername: null,
  });

  return (
    <section className="fd-hero px-4 py-5">
      <div className="flex flex-col items-center text-center">
        <ProfileAvatarEditor
          email={dash.email}
          initialAvatarUrl={dash.avatarUrl}
          variant="compact"
        />

        <h1 className="mt-3 inline-flex max-w-full items-center justify-center gap-0.5 text-xl font-bold tracking-tight text-[#1c1917]">
          <span className="truncate">{displayName}</span>
          <EditPencilLink href="/app/profile/settings#pseudo" label={d.profile_edit_pseudo} />
        </h1>

        <div className="mt-2 flex max-w-full flex-wrap items-center justify-center gap-2">
          <span className="rounded-full bg-white/80 px-2.5 py-0.5 text-[11px] font-medium text-[var(--fd-muted)]">
            {country}
          </span>
          <span
            className="max-w-[12rem] truncate rounded-full bg-white/80 px-2.5 py-0.5 text-[11px] font-medium text-[var(--fd-muted)]"
            title={dash.email}
          >
            {dash.email}
          </span>
        </div>

        <ProfileHeroQr userId={dash.id} />

        <div className="mt-3 flex max-w-full items-center gap-1.5 rounded-full border border-[var(--fd-border)] bg-white/70 px-2.5 py-1">
          <span className="truncate font-mono text-[10px] text-[var(--fd-muted)]">
            {dash.id.slice(0, 8)}…{dash.id.slice(-4)}
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
