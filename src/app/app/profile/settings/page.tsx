import { LangSwitch } from "@/components/lang-switch";
import { IconBell } from "@/components/icons/flow-icons";
import Link from "next/link";
import { ProfileCommunityInfo } from "@/components/profile/profile-community-info";
import { ProfilePersonalInfo } from "@/components/profile/profile-personal-info";
import { ProfileSubpageHeader } from "@/components/profile/profile-subpage-header";
import { ProfileIconChevronRight } from "@/components/icons/profile-icons";
import { profileChipClass } from "@/components/profile/profile-vibrant-styles";
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
        subtitle={d.profile_settings_sub}
      />
      <div className="space-y-3">
        <ProfilePersonalInfo initialEmail={sessionUser?.email ?? ""} />
        <ProfileCommunityInfo />

        <section className="fd-card overflow-hidden p-0">
          <p className="border-b border-[var(--fd-border)] px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-[var(--fd-muted)]">
            {d.profile_section_preferences}
          </p>
          <ul className="divide-y divide-[var(--fd-border)]">
            <li className="flex items-start gap-3 px-4 py-3.5">
              <span className={`${profileChipClass.forest} flex h-10 w-10 shrink-0 items-center justify-center`}>
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
                  <path d="M2 12h20M12 2a15 15 0 010 20M12 2a15 15 0 000 20" stroke="currentColor" strokeWidth="1.5" />
                </svg>
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-[#1c1917]">{d.profile_lang}</p>
                <div className="mt-3">
                  <LangSwitch />
                </div>
              </div>
            </li>
            <li>
              <Link
                href="/app/profile/preferences"
                className="flex items-center gap-3.5 px-4 py-3.5 active:bg-[rgba(74,103,79,0.06)]"
              >
                <span className={`${profileChipClass.amber} flex h-10 w-10 shrink-0 items-center justify-center`}>
                  <IconBell className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold leading-tight text-[#1c1917]">
                    {d.profile_preferences_heading}
                  </p>
                  <p className="mt-0.5 text-[11px] text-[var(--fd-muted)]">{d.profile_preferences_sub}</p>
                </div>
                <ProfileIconChevronRight />
              </Link>
            </li>
          </ul>
        </section>
      </div>
    </>
  );
}
