import { ProfileSubpageHeader } from "@/components/profile/profile-subpage-header";
import { ProfileWithdrawalAddresses } from "@/components/profile/profile-withdrawal-addresses";
import { getDictionary } from "@/i18n/messages";
import { getLocale } from "@/lib/get-locale";

export const dynamic = "force-dynamic";

export default async function ProfileAddressesPage() {
  const locale = await getLocale();
  const d = getDictionary(locale);

  return (
    <>
      <ProfileSubpageHeader
        title={d.profile_addresses_title}
        subtitle={d.profile_addresses_sub}
      />
      <ProfileWithdrawalAddresses />
    </>
  );
}
