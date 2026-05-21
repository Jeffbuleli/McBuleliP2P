import { asc, inArray } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getDb, users } from "@/db";
import { AdminTeamTable } from "@/components/admin/admin-team-table";
import { getDictionary } from "@/i18n/messages";
import { getLocale } from "@/lib/get-locale";
import { UserRole } from "@/lib/roles";
import { getSessionUser } from "@/lib/session-user";
import { adminCls, AdminBackLink, AdminPageHeader } from "@/components/admin/admin-ui";

export default async function AdminTeamPage() {
  const me = await getSessionUser();
  if (!me || me.role !== UserRole.SUPER_ADMIN) {
    redirect("/admin");
  }

  const locale = await getLocale();
  const d = getDictionary(locale);

  const db = getDb();
  const rows = await db
    .select({
      id: users.id,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(inArray(users.role, [UserRole.AGENT, UserRole.SUPER_ADMIN]))
    .orderBy(asc(users.email));

  const serialized = rows.map((r) => ({
    id: r.id,
    email: r.email,
    role: r.role,
    createdAt: r.createdAt.toISOString(),
  }));

  return (
    <div className={adminCls.page}>
      <AdminPageHeader
        title={d.admin_team_title}
        subtitle={d.admin_team_sub}
        action={<AdminBackLink>{d.admin_back}</AdminBackLink>}
      />
      <AdminTeamTable rows={serialized} />
    </div>
  );
}
