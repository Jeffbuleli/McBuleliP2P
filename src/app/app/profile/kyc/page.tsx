import { ProfileSubpageHeader } from "@/components/profile/profile-subpage-header";
import { KycFlowPanel } from "@/components/kyc/kyc-flow-panel";
import { getDictionary } from "@/i18n/messages";
import { getLocale } from "@/lib/get-locale";
import { getKycStatusPayload } from "@/lib/kyc-status-payload";
import { getSessionUser } from "@/lib/session-user";

export const dynamic = "force-dynamic";

export default async function ProfileKycPage() {
  const locale = await getLocale();
  const d = getDictionary(locale);
  const user = await getSessionUser();
  if (!user) return null;

  const initialData = await getKycStatusPayload(user.id);

  return (
    <>
      <ProfileSubpageHeader title={d.kyc_page_title} />
      <KycFlowPanel userId={user.id} initialData={initialData} />
    </>
  );
}
