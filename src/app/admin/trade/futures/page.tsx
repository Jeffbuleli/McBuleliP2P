import { redirect } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/admin-ui";
import { AdminTradeSolvencyClient } from "@/components/admin/admin-trade-solvency-client";
import { getDictionary } from "@/i18n/messages";
import { getLocale } from "@/lib/get-locale";
import { getSessionUser } from "@/lib/session-user";
import { UserRole } from "@/lib/roles";

export const dynamic = "force-dynamic";

export default async function AdminTradeFuturesPage() {
  const me = await getSessionUser();
  if (!me || me.role !== UserRole.SUPER_ADMIN) {
    redirect("/admin");
  }

  const d = getDictionary(await getLocale());

  return (
    <>
      <AdminPageHeader title={d.admin_trade_solvency_title} />
      <AdminTradeSolvencyClient d={d} />
    </>
  );
}
