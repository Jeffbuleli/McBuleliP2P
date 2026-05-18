import { P2pPaymentMethodsSection } from "@/components/p2p/p2p-payment-methods-section";
import { ProfileSubpageHeader } from "@/components/profile/profile-subpage-header";
import { getDictionary } from "@/i18n/messages";
import { getLocale } from "@/lib/get-locale";

export const dynamic = "force-dynamic";

export default async function ProfilePaymentsPage() {
  const locale = await getLocale();
  const d = getDictionary(locale);

  return (
    <>
      <ProfileSubpageHeader
        title={d.profile_payments_heading}
        subtitle={d.profile_tile_payments_sub}
      />
      <P2pPaymentMethodsSection variant="profile" />
    </>
  );
}
