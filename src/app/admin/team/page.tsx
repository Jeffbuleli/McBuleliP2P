import Link from "next/link";
import { asc, inArray } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getDb, users } from "@/db";
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

  return (
    <div className={adminCls.page}>
      <AdminPageHeader
        title={d.admin_team_title}
        subtitle={d.admin_team_sub}
        action={
          <Link href="/admin/users" className={adminCls.back}>
            {d.admin_team_manage_users}
          </Link>
        }
      />

      {rows.length === 0 ? (
        <p className={adminCls.empty}>{d.admin_team_empty}</p>
      ) : (
        <div className="fd-card overflow-x-auto rounded-2xl">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-[color:var(--fd-border)] bg-[color:var(--fd-mint)]/40 text-xs uppercase tracking-wide text-[color:var(--fd-muted)]">
              <tr>
                <th className="px-4 py-3 font-semibold">{d.admin_team_col_email}</th>
                <th className="px-4 py-3 font-semibold">{d.admin_team_col_role}</th>
                <th className="px-4 py-3 font-semibold">{d.admin_team_col_since}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[color:var(--fd-border)]">
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-3 font-mono text-xs text-[color:var(--fd-text)]">
                    {r.email}
                  </td>
                  <td className="px-4 py-3">
                    <span className={adminCls.roleBadge}>{r.role}</span>
                  </td>
                  <td className={`px-4 py-3 ${adminCls.muted}`}>
                    {r.createdAt.toLocaleDateString(locale === "fr" ? "fr-FR" : "en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AdminBackLink>{d.admin_back}</AdminBackLink>
    </div>
  );
}
