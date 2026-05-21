import { desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getDb, platformAdminAuditLog, users } from "@/db";
import { AdminAuditTable } from "@/components/admin/admin-audit-table";
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
    .limit(500);

  const serialized = rows.map((r) => ({
    id: r.id,
    action: r.action,
    resourceType: r.resourceType,
    resourceId: r.resourceId,
    meta: r.meta,
    createdAt: r.createdAt.toISOString(),
    actorEmail: r.actorEmail,
  }));

  return (
    <div className={adminCls.page}>
      <AdminPageHeader
        title={d.admin_audit_title}
        subtitle={d.admin_audit_sub}
        action={<AdminBackLink>{d.admin_back}</AdminBackLink>}
      />
      <AdminAuditTable rows={serialized} />
    </div>
  );
}
