import { ProfileSecurityPanel } from "@/components/profile/profile-security-panel";
import { ProfileSubpageHeader } from "@/components/profile/profile-subpage-header";
import { getDictionary } from "@/i18n/messages";
import { getLocale } from "@/lib/get-locale";

export const dynamic = "force-dynamic";

export default async function ProfileSecurityPage() {
  const locale = await getLocale();
  const d = getDictionary(locale);

  return (
    <>
      <ProfileSubpageHeader title={d.profile_security_page_title} subtitle={d.profile_security_page_sub} />
      <ProfileSecurityPanel />
    </>
  );
}
