import { ProfileNotificationPrefs } from "@/components/profile/profile-notification-prefs";
import { ProfileSubpageHeader } from "@/components/profile/profile-subpage-header";
import { getDictionary } from "@/i18n/messages";
import { getLocale } from "@/lib/get-locale";

export const dynamic = "force-dynamic";

export default async function ProfilePreferencesPage() {
  const locale = await getLocale();
  const d = getDictionary(locale);

  return (
    <>
      <ProfileSubpageHeader
        title={d.profile_preferences_heading}
        subtitle={d.profile_preferences_sub}
      />
      <ProfileNotificationPrefs />
    </>
  );
}
