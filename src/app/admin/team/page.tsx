import Link from "next/link";
import { asc, inArray } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getDb, users } from "@/db";
import { getDictionary } from "@/i18n/messages";
import { getLocale } from "@/lib/get-locale";
import { UserRole } from "@/lib/roles";
import { getSessionUser } from "@/lib/session-user";

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
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white">{d.admin_team_title}</h2>
          <p className="mt-1 max-w-xl text-sm text-stone-400">{d.admin_team_sub}</p>
        </div>
        <Link
          href="/admin/users"
          className="text-sm font-semibold text-amber-300 underline decoration-amber-600/50 underline-offset-4"
        >
          {d.admin_team_manage_users}
        </Link>
      </div>

      {rows.length === 0 ? (
        <p className="rounded-xl border border-stone-700 bg-stone-900/50 px-4 py-6 text-sm text-stone-400">
          {d.admin_team_empty}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-stone-700">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-stone-700 bg-stone-900/80 text-xs uppercase tracking-wide text-stone-500">
              <tr>
                <th className="px-4 py-3 font-semibold">{d.admin_team_col_email}</th>
                <th className="px-4 py-3 font-semibold">{d.admin_team_col_role}</th>
                <th className="px-4 py-3 font-semibold">{d.admin_team_col_since}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800">
              {rows.map((r) => (
                <tr key={r.id} className="bg-stone-950/40">
                  <td className="px-4 py-3 font-mono text-xs text-stone-300">{r.email}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-amber-950/60 px-2 py-0.5 text-xs font-medium text-amber-100">
                      {r.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-stone-400">
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

      <Link href="/admin" className="inline-block text-sm text-amber-200/90 underline">
        {d.admin_back}
      </Link>
    </div>
  );
}
