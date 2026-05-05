import Link from "next/link";
import { getDictionary } from "@/i18n/messages";
import { getLocale } from "@/lib/get-locale";
import { getAdminDashboardStats } from "@/lib/admin-dashboard-stats";
import { getSessionUser } from "@/lib/session-user";
import { UserRole } from "@/lib/roles";
import { agentHasScope } from "@/lib/staff-scopes";

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

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-white">{d.admin_dashboard_kpi_title}</h2>
        <p className="mt-1 text-sm text-stone-500">{d.admin_dashboard_kpi_sub}</p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {showW ? (
            <>
              <Link
                href="/admin/withdrawals?status=PENDING_AGENT&assignFilter=all"
                className="block rounded-2xl border border-stone-700 bg-stone-900/60 p-4 transition hover:border-amber-700/50"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                  {d.admin_kpi_open}
                </p>
                <p className="mt-1 text-3xl font-bold tabular-nums text-amber-100">
                  {stats.withdrawalsPendingAgent}
                </p>
                <p className="mt-2 text-sm text-stone-400">{d.admin_kpi_w_pending}</p>
                <p className="mt-1 text-xs text-stone-500">
                  {d.admin_kpi_w_unassigned}:{" "}
                  <span className="font-mono text-stone-300">
                    {stats.withdrawalsPendingUnassigned}
                  </span>
                </p>
              </Link>
              <Link
                href="/admin/withdrawals?status=PROCESSING&assignFilter=all"
                className="block rounded-2xl border border-stone-700 bg-stone-900/60 p-4 transition hover:border-amber-700/50"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                  {d.admin_kpi_open}
                </p>
                <p className="mt-1 text-3xl font-bold tabular-nums text-amber-100">
                  {stats.withdrawalsProcessing}
                </p>
                <p className="mt-2 text-sm text-stone-400">{d.admin_kpi_w_processing}</p>
              </Link>
            </>
          ) : null}

          {showG ? (
            <>
              <Link
                href="/admin/groups?status=pending"
                className="block rounded-2xl border border-stone-700 bg-stone-900/60 p-4 transition hover:border-amber-700/50"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                  {d.admin_kpi_open}
                </p>
                <p className="mt-1 text-3xl font-bold tabular-nums text-amber-100">
                  {stats.groupsPendingReview}
                </p>
                <p className="mt-2 text-sm text-stone-400">{d.admin_kpi_g_pending}</p>
              </Link>
              <Link
                href="/admin/groups?status=approved%2Cactive&subscriptionStatus=overdue"
                className="block rounded-2xl border border-stone-700 bg-stone-900/60 p-4 transition hover:border-amber-700/50"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                  {d.admin_kpi_open}
                </p>
                <p className="mt-1 text-3xl font-bold tabular-nums text-rose-200/90">
                  {stats.groupsSubscriptionOverdue}
                </p>
                <p className="mt-2 text-sm text-stone-400">{d.admin_kpi_g_overdue}</p>
              </Link>
            </>
          ) : null}

          {showP2p ? (
            <Link
              href="/admin/p2p"
              className="block rounded-2xl border border-stone-700 bg-stone-900/60 p-4 transition hover:border-emerald-600/40"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                {d.admin_kpi_open}
              </p>
              <p className="mt-1 text-3xl font-bold tabular-nums text-emerald-200">
                {stats.p2pDisputesOpen}
              </p>
              <p className="mt-2 text-sm text-stone-400">{d.admin_kpi_p2p}</p>
            </Link>
          ) : null}

          {showLoans ? (
            <Link
              href="/admin/loans?status=open"
              className="block rounded-2xl border border-stone-700 bg-stone-900/60 p-4 transition hover:border-amber-700/50"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                {d.admin_loans_title}
              </p>
              <p className="mt-2 text-sm text-stone-400">{d.admin_loans_sub}</p>
            </Link>
          ) : null}

          {showGrowth ? (
            <div className="rounded-2xl border border-stone-700 bg-stone-900/60 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                {d.admin_kpi_growth}
              </p>
              <p className="mt-1 text-3xl font-bold tabular-nums text-stone-100">
                {stats.usersRegisteredLast7Days}
              </p>
              <p className="mt-2 text-sm text-stone-400">{d.admin_kpi_users_7d}</p>
            </div>
          ) : null}
        </div>
      </div>

      <div>
        <p className="text-sm text-stone-400">{d.admin_intro}</p>
        <div className="mt-4 flex flex-wrap gap-3">
          {showW ? (
            <Link
              href="/admin/withdrawals"
              className="inline-block rounded-xl bg-amber-600 px-5 py-3 font-semibold text-stone-950"
            >
              {d.admin_queue}
            </Link>
          ) : null}
          {showG ? (
            <Link
              href="/admin/groups"
              className="inline-block rounded-xl border border-amber-600/40 bg-stone-900/70 px-5 py-3 font-semibold text-amber-100"
            >
              {d.admin_groups}
            </Link>
          ) : null}
          {showP2p ? (
            <Link
              href="/admin/p2p"
              className="inline-block rounded-xl border border-emerald-500/40 bg-emerald-950/40 px-5 py-3 font-semibold text-emerald-100"
            >
              {d.admin_p2p_disputes}
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
