import { desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getDb, platformAdminAuditLog, users } from "@/db";
import { getDictionary } from "@/i18n/messages";
import { getLocale } from "@/lib/get-locale";
import { UserRole } from "@/lib/roles";
import { getSessionUser } from "@/lib/session-user";
import { adminCls, AdminBackLink, AdminPageHeader } from "@/components/admin/admin-ui";

export default async function AdminAuditPage() {
  const me = await getSessionUser();
  if (!me || me.role !== UserRole.SUPER_ADMIN) {
    redirect("/admin");
  }

  const locale = await getLocale();
  const d = getDictionary(locale);

  const db = getDb();
  const rows = await db
    .select({
      id: platformAdminAuditLog.id,
      action: platformAdminAuditLog.action,
      resourceType: platformAdminAuditLog.resourceType,
      resourceId: platformAdminAuditLog.resourceId,
      meta: platformAdminAuditLog.meta,
      createdAt: platformAdminAuditLog.createdAt,
      actorEmail: users.email,
    })
    .from(platformAdminAuditLog)
    .leftJoin(users, eq(platformAdminAuditLog.actorUserId, users.id))
    .orderBy(desc(platformAdminAuditLog.createdAt))
    .limit(200);

  return (
    <div className={adminCls.page}>
      <AdminPageHeader
        title={d.admin_audit_title}
        subtitle={d.admin_audit_sub}
        action={<AdminBackLink>{d.admin_back}</AdminBackLink>}
      />

      {rows.length === 0 ? (
        <p className={adminCls.empty}>{d.admin_audit_empty}</p>
      ) : (
        <div className="fd-card overflow-x-auto rounded-2xl">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-[color:var(--fd-border)] bg-[color:var(--fd-mint)]/40 text-xs uppercase tracking-wide text-[color:var(--fd-muted)]">
              <tr>
                <th className="px-3 py-3 font-semibold">{d.admin_audit_when}</th>
                <th className="px-3 py-3 font-semibold">{d.admin_audit_actor}</th>
                <th className="px-3 py-3 font-semibold">{d.admin_audit_action}</th>
                <th className="px-3 py-3 font-semibold">{d.admin_audit_resource}</th>
                <th className="px-3 py-3 font-semibold">{d.admin_audit_details}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[color:var(--fd-border)]">
              {rows.map((r) => (
                <tr key={r.id} className="align-top">
                  <td className={`whitespace-nowrap px-3 py-2 text-xs ${adminCls.muted}`}>
                    {r.createdAt.toLocaleString(locale === "fr" ? "fr-FR" : "en-US")}
                  </td>
                  <td className="max-w-[140px] break-all px-3 py-2 font-mono text-xs text-[color:var(--fd-text)]">
                    {r.actorEmail ?? "—"}
                  </td>
                  <td className="px-3 py-2 text-xs font-medium text-[color:var(--fd-primary)]">
                    {r.action}
                  </td>
                  <td className={`max-w-[120px] break-all px-3 py-2 font-mono text-[11px] ${adminCls.muted}`}>
                    {r.resourceType ? `${r.resourceType}` : "—"}
                    {r.resourceId ? (
                      <>
                        <br />
                        <span className="opacity-80">{r.resourceId}</span>
                      </>
                    ) : null}
                  </td>
                  <td className={`max-w-md px-3 py-2 font-mono text-[11px] ${adminCls.muted}`}>
                    {r.meta ? JSON.stringify(r.meta) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
