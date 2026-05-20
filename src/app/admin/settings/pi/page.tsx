import { redirect } from "next/navigation";
import { getLocale } from "@/lib/get-locale";
import { getDictionary } from "@/i18n/messages";
import { requireSuperAdmin } from "@/lib/session-user";
import PiReceiveAddressSettingsClient from "./pi-settings-client";
import { adminCls, AdminPageHeader } from "@/components/admin/admin-ui";

export default async function AdminPiSettingsPage() {
  await requireSuperAdmin().catch(() => redirect("/admin"));
  const locale = await getLocale();
  const d = getDictionary(locale);

  return (
    <div className={adminCls.page}>
      <AdminPageHeader
        title="Pi settings"
        subtitle="Set receiving addresses used for Pi deposits (manual)."
      />
      <PiReceiveAddressSettingsClient />
    </div>
  );
}
