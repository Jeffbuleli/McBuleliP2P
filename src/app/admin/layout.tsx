import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session-user";
import {
  agentHasAnyStaffScope,
  agentHasScope,
} from "@/lib/staff-scopes";
import { canAccessPlatformExpensesModule } from "@/lib/platform-expenses";
import { UserRole } from "@/lib/roles";
import { LogoutButton } from "@/components/LogoutButton";
import { AdminNavLink } from "@/components/admin/admin-ui";
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
  const showPlatformExpenses =
    u.role === UserRole.SUPER_ADMIN || canAccessPlatformExpensesModule(u);
  const noOps =
    u.role === UserRole.AGENT && !agentHasAnyStaffScope(u);

  return (
    <div className="admin-theme home-theme min-h-dvh">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        <header className="fd-app-topbar mb-5 flex flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[color:var(--fd-primary)]">
              {d.admin_header_ops}
            </p>
            <h1 className="text-xl font-black text-[color:var(--fd-text)]">
              {d.admin_control_room}
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className={adminClsRole()}>{u.role}</span>
            <Link
              href="/app"
              className="rounded-xl border border-[color:var(--fd-border)] bg-[color:var(--fd-card)] px-3 py-1.5 text-sm font-semibold text-[color:var(--fd-primary)] shadow-sm hover:bg-[color:var(--fd-mint)]"
            >
              {d.admin_link_app}
            </Link>
            <LogoutButton className="rounded-xl border border-[color:var(--fd-border)] bg-[color:var(--fd-card)] px-3 py-1.5 text-sm font-semibold text-[color:var(--fd-text)] shadow-sm hover:bg-[color:var(--fd-mint)]" />
          </div>
        </header>

        {noOps ? (
          <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            {d.admin_nav_no_ops}
          </p>
        ) : null}

        <nav
          className="mb-8 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4"
          aria-label="Admin"
        >
          <AdminNavLink href="/admin">{d.admin_nav_dashboard}</AdminNavLink>
          <AdminNavLink href="/admin/support" variant="support">
            {d.admin_support_inbox}
          </AdminNavLink>
          {showW ? (
            <>
              <AdminNavLink href="/admin/deposits" variant="money">
                {d.admin_nav_deposits}
              </AdminNavLink>
              <AdminNavLink href="/admin/withdrawals" variant="money">
                {d.admin_nav_withdrawals}
              </AdminNavLink>
            </>
          ) : null}
          {showG ? (
            <AdminNavLink href="/admin/groups">{d.admin_nav_groups}</AdminNavLink>
          ) : null}
          {showP2p ? (
            <AdminNavLink href="/admin/p2p" variant="support">
              {d.admin_nav_p2p}
            </AdminNavLink>
          ) : null}
          {showPlatformExpenses ? (
            <AdminNavLink href="/admin/platform-expenses" variant="money">
              {d.admin_nav_platform_expenses}
            </AdminNavLink>
          ) : null}
          {u.role === "super_admin" ? (
            <>
              <AdminNavLink href="/admin/team" variant="team">
                {d.admin_nav_team}
              </AdminNavLink>
              <AdminNavLink href="/admin/users" variant="team">
                {d.admin_nav_users}
              </AdminNavLink>
              <AdminNavLink href="/admin/finance" variant="money">
                {d.admin_nav_finance}
              </AdminNavLink>
              <AdminNavLink href="/admin/bots" variant="bots">
                {d.admin_nav_bots}
              </AdminNavLink>
              <AdminNavLink href="/admin/audit" variant="audit">
                {d.admin_nav_audit}
              </AdminNavLink>
              <AdminNavLink href="/admin/settings/pi" variant="bots">
                {d.admin_nav_pi_settings}
              </AdminNavLink>
            </>
          ) : null}
        </nav>

        <main className="pb-10">{children}</main>
      </div>
    </div>
  );
}

function adminClsRole() {
  return "rounded-full bg-[color:var(--fd-mint)] px-2.5 py-0.5 text-xs font-bold capitalize text-[color:var(--fd-primary)]";
}
