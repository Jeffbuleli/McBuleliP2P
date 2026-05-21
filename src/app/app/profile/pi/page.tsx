import { PiLinkSection } from "@/components/pi/pi-link-section";
import { ProfileSubpageHeader } from "@/components/profile/profile-subpage-header";
import { getDictionary } from "@/i18n/messages";
import { getLocale } from "@/lib/get-locale";

export const dynamic = "force-dynamic";

export default async function ProfilePiPage() {
  const locale = await getLocale();
  const d = getDictionary(locale);

  return (
    <>
      <ProfileSubpageHeader
        title={d.profile_tile_pi}
        subtitle={d.profile_tile_pi_sub}
      />
      <PiLinkSection />
    </>
  );
}
