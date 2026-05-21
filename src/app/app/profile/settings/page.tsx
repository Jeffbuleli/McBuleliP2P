import { LangSwitch } from "@/components/lang-switch";
import { ProfilePersonalInfo } from "@/components/profile/profile-personal-info";
import { ProfileSettingsKyc } from "@/components/profile/profile-settings-kyc";
import { getProfileDashboard } from "@/lib/profile-stats";
import { ProfileSubpageHeader } from "@/components/profile/profile-subpage-header";
import { profileChipClass } from "@/components/profile/profile-vibrant-styles";
import { getDictionary } from "@/i18n/messages";
import { getLocale } from "@/lib/get-locale";
import { getSessionUser } from "@/lib/session-user";

export const dynamic = "force-dynamic";

export default async function ProfileSettingsPage() {
  const locale = await getLocale();
  const d = getDictionary(locale);
  const sessionUser = await getSessionUser();
  const dash = sessionUser
    ? await getProfileDashboard(sessionUser.id, locale)
    : null;

  return (
    <>
      <ProfileSubpageHeader
        title={d.profile_settings_heading}
        subtitle={d.profile_tile_settings_sub}
      />
      <div className="space-y-3">
        <ProfilePersonalInfo initialEmail={sessionUser?.email ?? ""} />

        {dash ? <ProfileSettingsKyc kycStatus={dash.kycStatus} locale={locale} /> : null}

        <section className="fd-card flex items-start gap-3 p-4">
          <span className={`${profileChipClass.forest} flex h-10 w-10 shrink-0 items-center justify-center`}>
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden>
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
              <path d="M2 12h20M12 2a15 15 0 010 20M12 2a15 15 0 000 20" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-[color:var(--fd-text)]">{d.profile_lang}</p>
            <div className="mt-3">
              <LangSwitch />
            </div>
          </div>
        </section>

        <section className="fd-card p-4">
          <p className="text-sm font-bold text-[color:var(--fd-text)]">{d.profile_security_heading}</p>
          <ul className="mt-3 space-y-2">
            <li className="flex items-center justify-between gap-2 rounded-xl bg-stone-50 px-3 py-2">
              <span className="text-xs text-[color:var(--fd-muted)]">{d.profile_sec_email}</span>
              <span className="fd-pill-ok text-[10px]">{d.profile_sec_email_ok}</span>
            </li>
            {sessionUser?.email ? (
              <li className="truncate px-1 text-xs font-medium text-[color:var(--fd-text)]">
                {sessionUser.email}
              </li>
            ) : null}
          </ul>
        </section>
      </div>
    </>
  );
}
