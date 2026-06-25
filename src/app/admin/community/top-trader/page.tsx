import { redirect } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/admin-ui";
import { AdminTopTraderClient } from "@/components/admin/admin-top-trader-client";
import { getDictionary } from "@/i18n/messages";
import { getLocale } from "@/lib/get-locale";
import { getSessionUser } from "@/lib/session-user";
import { UserRole } from "@/lib/roles";

export const dynamic = "force-dynamic";

export default async function AdminTopTraderPage() {
  const me = await getSessionUser();
  if (!me || me.role !== UserRole.SUPER_ADMIN) {
    redirect("/admin");
  }

  const d = getDictionary(await getLocale());

  return (
    <>
      <AdminPageHeader
        title={d.admin_top_trader_title}
        subtitle={d.admin_top_trader_subtitle}
      />
      <AdminTopTraderClient d={d} />
    </>
  );
}
