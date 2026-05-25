import { redirect } from "next/navigation";
import { getLocale } from "@/lib/get-locale";
import { getDictionary } from "@/i18n/messages";
import { requireStaffScope, StaffAuthError } from "@/lib/session-user";
import LandingPromosSettingsClient from "./landing-promos-client";
import { adminCls, AdminPageHeader } from "@/components/admin/admin-ui";

export default async function AdminLandingAdsPage() {
  try {
    await requireStaffScope("landing_ads");
  } catch (e) {
    if (e instanceof StaffAuthError) redirect("/admin");
    throw e;
  }

  const locale = await getLocale();
  const d = getDictionary(locale);

  return (
    <div className={adminCls.page}>
      <AdminPageHeader
        title={d.admin_landing_ads_title}
        subtitle={d.admin_landing_ads_sub}
      />
      <LandingPromosSettingsClient />
    </div>
  );
}
