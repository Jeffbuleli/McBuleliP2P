import { LangSwitch } from "@/components/lang-switch";
import { ProfileSubpageHeader } from "@/components/profile/profile-subpage-header";
import { getDictionary } from "@/i18n/messages";
import { getLocale } from "@/lib/get-locale";
import { getSessionUser } from "@/lib/session-user";

export const dynamic = "force-dynamic";

export default async function ProfileSettingsPage() {
  const locale = await getLocale();
  const d = getDictionary(locale);
  const sessionUser = await getSessionUser();

  return (
    <>
      <ProfileSubpageHeader
        title={d.profile_settings_heading}
        subtitle={d.profile_tile_settings_sub}
      />
      <div className="space-y-3">
        <section className="fd-card p-4">
          <p className="text-xs font-semibold text-[var(--fd-muted)]">{d.profile_lang}</p>
          <div className="mt-3">
            <LangSwitch />
          </div>
        </section>

        <section className="fd-card p-4">
          <p className="text-xs font-bold text-[var(--fd-text)]">{d.profile_security_heading}</p>
          <ul className="mt-3 space-y-3 text-sm">
            <li className="flex items-center justify-between gap-2">
              <span className="text-[var(--fd-muted)]">{d.profile_sec_email}</span>
              <span className="fd-pill-ok">{d.profile_sec_email_ok}</span>
            </li>
            {sessionUser?.email ? (
              <li className="truncate text-xs text-[var(--fd-muted)]">{sessionUser.email}</li>
            ) : null}
          </ul>
        </section>
      </div>
    </>
  );
}
