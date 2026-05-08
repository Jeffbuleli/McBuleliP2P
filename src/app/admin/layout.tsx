import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session-user";
import { agentHasAnyStaffScope, agentHasScope } from "@/lib/staff-scopes";
import { UserRole } from "@/lib/roles";
import { LogoutButton } from "@/components/LogoutButton";
import { getDictionary } from "@/i18n/messages";
import { getLocale } from "@/lib/get-locale";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const u = await getSessionUser();
  if (!u) {
    redirect("/login");
  }
  if (u.role !== "agent" && u.role !== "super_admin") {
    redirect("/app");
  }

  const d = getDictionary(await getLocale());
  const showW = u.role === UserRole.SUPER_ADMIN || agentHasScope(u, "withdrawals");
  const showG = u.role === UserRole.SUPER_ADMIN || agentHasScope(u, "groups");
  const showP2p = u.role === UserRole.SUPER_ADMIN || agentHasScope(u, "p2p_disputes");
  const noOps =
    u.role === UserRole.AGENT && !agentHasAnyStaffScope(u);

  return (
    <div className="min-h-full bg-stone-950 text-stone-100">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        <header className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-stone-800/90 pb-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-amber-200/80">
              {d.admin_header_ops}
            </p>
            <h1 className="text-lg font-bold text-white">{d.admin_control_room}</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-rose-900/50 px-2 py-0.5 text-xs text-rose-100">
              {u.role}
            </span>
            <Link
              href="/app"
              className="rounded-lg border border-stone-600 px-3 py-1.5 text-sm text-stone-200"
            >
              {d.admin_link_app}
            </Link>
            <LogoutButton className="border-stone-600 text-stone-200" />
          </div>
        </header>
        {noOps ? (
          <p className="mb-4 rounded-lg border border-amber-900/50 bg-amber-950/30 px-3 py-2 text-sm text-amber-100">
            {d.admin_nav_no_ops}
          </p>
        ) : null}
        <nav
          className="mb-8 flex flex-wrap gap-2 border-b border-stone-800/90 pb-5 text-sm"
          aria-label="Admin"
        >
          <Link
            href="/admin"
            className="rounded-lg border border-stone-700 bg-stone-900/50 px-3 py-2 text-stone-200 hover:border-amber-700/50 hover:text-white"
          >
            {d.admin_nav_dashboard}
          </Link>
          {showW ? (
            <Link
              href="/admin/withdrawals"
              className="rounded-lg border border-stone-700 bg-stone-900/50 px-3 py-2 text-stone-200 hover:border-amber-700/50 hover:text-white"
            >
              {d.admin_nav_withdrawals}
            </Link>
          ) : null}
          {showG ? (
            <Link
              href="/admin/groups"
              className="rounded-lg border border-stone-700 bg-stone-900/50 px-3 py-2 text-stone-200 hover:border-amber-700/50 hover:text-white"
            >
              {d.admin_nav_groups}
            </Link>
          ) : null}
          {showP2p ? (
            <Link
              href="/admin/p2p"
              className="rounded-lg border border-stone-700 bg-stone-900/50 px-3 py-2 text-stone-200 hover:border-amber-700/50 hover:text-white"
            >
              {d.admin_nav_p2p}
            </Link>
          ) : null}
          {u.role === "super_admin" ? (
            <>
              <Link
                href="/admin/team"
                className="rounded-lg border border-amber-800/40 bg-amber-950/25 px-3 py-2 text-amber-100 hover:border-amber-600/60"
              >
                {d.admin_nav_team}
              </Link>
              <Link
                href="/admin/users"
                className="rounded-lg border border-amber-800/40 bg-amber-950/25 px-3 py-2 text-amber-100 hover:border-amber-600/60"
              >
                {d.admin_nav_users}
              </Link>
              <Link
                href="/admin/audit"
                className="rounded-lg border border-stone-600 bg-stone-900/80 px-3 py-2 text-stone-200 hover:border-stone-500"
              >
                {d.admin_nav_audit}
              </Link>
            </>
          ) : null}
        </nav>
        <main className="pb-10">{children}</main>
      </div>
    </div>
  );
}
