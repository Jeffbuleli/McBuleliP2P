import Link from "next/link";
import { getDictionary } from "@/i18n/messages";
import { getLocale } from "@/lib/get-locale";
import { getAdminDashboardStats } from "@/lib/admin-dashboard-stats";
import { getSessionUser } from "@/lib/session-user";
import { UserRole } from "@/lib/roles";
import { agentHasScope } from "@/lib/staff-scopes";
import { canAccessPlatformExpensesModule } from "@/lib/platform-expenses";
import { AdminKpiCard, adminCls } from "@/components/admin/admin-ui";

export default async function AdminHomePage() {
  const u = await getSessionUser();
  const locale = await getLocale();
  const d = getDictionary(locale);
  const stats = await getAdminDashboardStats();

  const showW =
    u?.role === UserRole.SUPER_ADMIN || (u && agentHasScope(u, "withdrawals"));
  const showG =
    u?.role === UserRole.SUPER_ADMIN || (u && agentHasScope(u, "groups"));
  const showP2p =
    u?.role === UserRole.SUPER_ADMIN ||
    (u && agentHasScope(u, "p2p_disputes"));
  const showGrowth = u?.role === UserRole.SUPER_ADMIN;
  const showLoans = u?.role === UserRole.SUPER_ADMIN;
  const showFinance = u?.role === UserRole.SUPER_ADMIN;
  const showPlatformExpenses =
    u && (u.role === UserRole.SUPER_ADMIN || canAccessPlatformExpensesModule(u));

  return (
    <div className="space-y-8">
      <div>
        <h2 className={adminCls.h1}>{d.admin_dashboard_kpi_title}</h2>
        <p className={`mt-1 ${adminCls.muted}`}>{d.admin_dashboard_kpi_sub}</p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {showW ? (
            <>
              <AdminKpiCard
                href="/admin/withdrawals?status=PENDING_AGENT&assignFilter=all"
                label={d.admin_kpi_open}
                value={stats.withdrawalsPendingAgent}
                sub={d.admin_kpi_w_pending}
                meta={
                  <>
                    {d.admin_kpi_w_unassigned}:{" "}
                    <span className="font-mono font-semibold text-[color:var(--fd-text)]">
                      {stats.withdrawalsPendingUnassigned}
                    </span>
                  </>
                }
              />
              <AdminKpiCard
                href="/admin/withdrawals?status=PROCESSING&assignFilter=all"
                label={d.admin_kpi_open}
                value={stats.withdrawalsProcessing}
                sub={d.admin_kpi_w_processing}
              />
            </>
          ) : null}

          {showG ? (
            <>
              <AdminKpiCard
                href="/admin/groups?status=pending"
                label={d.admin_kpi_open}
                value={stats.groupsPendingReview}
                sub={d.admin_kpi_g_pending}
              />
              <AdminKpiCard
                href="/admin/groups?status=approved%2Cactive&subscriptionStatus=overdue"
                label={d.admin_kpi_open}
                value={stats.groupsSubscriptionOverdue}
                sub={d.admin_kpi_g_overdue}
                tone="warn"
              />
            </>
          ) : null}

          {showP2p ? (
            <AdminKpiCard
              href="/admin/p2p"
              label={d.admin_kpi_open}
              value={stats.p2pDisputesOpen}
              sub={d.admin_kpi_p2p}
            />
          ) : null}

          {showLoans ? (
            <AdminKpiCard
              href="/admin/loans?status=open"
              label={d.admin_loans_title}
              value="→"
              sub={d.admin_loans_sub}
            />
          ) : null}

          {showFinance ? (
            <AdminKpiCard
              href="/admin/finance"
              label={d.admin_nav_finance}
              value="→"
              sub={d.admin_finance_blurb}
            />
          ) : null}

          {showPlatformExpenses ? (
            <AdminKpiCard
              href="/admin/platform-expenses"
              label={d.admin_nav_platform_expenses}
              value="→"
              sub={d.admin_platform_expenses_sub}
            />
          ) : null}

          {showGrowth ? (
            <>
              <AdminKpiCard
                href="/admin/users"
                label={d.admin_kpi_total_users}
                value={stats.totalUsers}
                sub={d.admin_nav_users}
              />
              <AdminKpiCard
                href="/admin/team"
                label={d.admin_kpi_total_agents}
                value={stats.totalAgents}
                sub={d.admin_nav_team}
                meta={
                  <>
                    {d.admin_kpi_total_super_admins}:{" "}
                    <span className="font-mono font-semibold text-[color:var(--fd-text)]">
                      {stats.totalSuperAdmins}
                    </span>
                  </>
                }
              />
              <AdminKpiCard
                label={d.admin_kpi_growth}
                value={stats.usersRegisteredLast7Days}
                sub={d.admin_kpi_users_7d}
              />
            </>
          ) : null}
        </div>
      </div>

      <div className="fd-card rounded-2xl p-4">
        <p className={adminCls.muted}>{d.admin_intro}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {showW ? (
            <Link href="/admin/withdrawals" className={adminCls.btnPrimary}>
              {d.admin_queue}
            </Link>
          ) : null}
          {showG ? (
            <Link href="/admin/groups" className={adminCls.btnSecondary}>
              {d.admin_groups}
            </Link>
          ) : null}
          {showP2p ? (
            <Link href="/admin/p2p" className={adminCls.btnSecondary}>
              {d.admin_p2p_disputes}
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
