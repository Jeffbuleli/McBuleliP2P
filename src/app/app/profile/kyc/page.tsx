import { Suspense } from "react";
import { ProfileSubpageHeader } from "@/components/profile/profile-subpage-header";
import { KycPageClient } from "@/components/kyc/kyc-page-client";
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
      <ProfileSubpageHeader title={d.kyc_page_title} subtitle={d.kyc_page_sub} />
      <Suspense fallback={null}>
        <KycPageClient userId={user.id} initialData={initialData} />
      </Suspense>
    </>
  );
}
