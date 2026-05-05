import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getDb, platformAdminAuditLog, users } from "@/db";
import { getDictionary } from "@/i18n/messages";
import { getLocale } from "@/lib/get-locale";
import { UserRole } from "@/lib/roles";
import { getSessionUser } from "@/lib/session-user";

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
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white">{d.admin_audit_title}</h2>
          <p className="mt-1 max-w-2xl text-sm text-stone-400">{d.admin_audit_sub}</p>
        </div>
        <Link href="/admin" className="text-sm text-amber-200 underline">
          {d.admin_back}
        </Link>
      </div>

      {rows.length === 0 ? (
        <p className="rounded-xl border border-stone-700 bg-stone-900/50 px-4 py-6 text-sm text-stone-400">
          {d.admin_audit_empty}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-stone-700">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-stone-700 bg-stone-900/80 text-xs uppercase tracking-wide text-stone-500">
              <tr>
                <th className="px-3 py-3 font-semibold">{d.admin_audit_when}</th>
                <th className="px-3 py-3 font-semibold">{d.admin_audit_actor}</th>
                <th className="px-3 py-3 font-semibold">{d.admin_audit_action}</th>
                <th className="px-3 py-3 font-semibold">{d.admin_audit_resource}</th>
                <th className="px-3 py-3 font-semibold">{d.admin_audit_details}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800">
              {rows.map((r) => (
                <tr key={r.id} className="bg-stone-950/40 align-top">
                  <td className="whitespace-nowrap px-3 py-2 text-xs text-stone-400">
                    {r.createdAt.toLocaleString(locale === "fr" ? "fr-FR" : "en-US")}
                  </td>
                  <td className="max-w-[140px] break-all px-3 py-2 font-mono text-xs text-stone-300">
                    {r.actorEmail ?? "—"}
                  </td>
                  <td className="px-3 py-2 text-xs text-amber-100/95">{r.action}</td>
                  <td className="max-w-[120px] break-all px-3 py-2 font-mono text-[11px] text-stone-400">
                    {r.resourceType ? `${r.resourceType}` : "—"}
                    {r.resourceId ? (
                      <>
                        <br />
                        <span className="opacity-80">{r.resourceId}</span>
                      </>
                    ) : null}
                  </td>
                  <td className="max-w-md px-3 py-2 font-mono text-[11px] text-stone-500">
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
