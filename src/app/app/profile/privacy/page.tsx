import { ProfilePrivacyPanel } from "@/components/profile/profile-privacy-panel";
import { ProfileSubpageHeader } from "@/components/profile/profile-subpage-header";
import { getDictionary } from "@/i18n/messages";
import { getLocale } from "@/lib/get-locale";

export const dynamic = "force-dynamic";

export default async function ProfilePrivacyPage() {
  const locale = await getLocale();
  const d = getDictionary(locale);

  return (
    <>
      <ProfileSubpageHeader
        title={d.profile_privacy_title}
        subtitle={d.profile_privacy_sub}
      />
      <ProfilePrivacyPanel />
    </>
  );
}
