import { redirect } from "next/navigation";
import { getDictionary } from "@/i18n/messages";
import { getLocale } from "@/lib/get-locale";
import { getSessionUser } from "@/lib/session-user";
import { UserRole } from "@/lib/roles";
import { getAdminBotsOverview } from "@/lib/bot-admin-service";
import { adminCls, AdminPageHeader } from "@/components/admin/admin-ui";

export const dynamic = "force-dynamic";

function fmtTime(iso: string, locale: string) {
  const loc = locale === "fr" ? "fr-FR" : "en-US";
  return new Date(iso).toLocaleString(loc, {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export default async function AdminBotsPage() {
  const me = await getSessionUser();
  if (!me || me.role !== UserRole.SUPER_ADMIN) {
    redirect("/admin");
  }

  const locale = await getLocale();
  const d = getDictionary(locale);
  const o = await getAdminBotsOverview();

  const planLabels: Record<string, string> = {
    dca_spot: d.bots_plan_dca,
    grid_spot: d.bots_plan_grid,
    futures_um: d.bots_plan_futures,
  };

  return (
    <div className={adminCls.page}>
      <AdminPageHeader title={d.admin_bots_title} />

      <div className="grid gap-3 sm:grid-cols-3">
        <div className={adminCls.card}>
          <p className={adminCls.kpiLabel}>{d.admin_bots_stat_subscriptions}</p>
          <p className={adminCls.kpiValue}>{o.activeSubscriptions}</p>
        </div>
        <div className={adminCls.card}>
          <p className={adminCls.kpiLabel}>{d.admin_bots_stat_instances}</p>
          <p className="mt-1 text-2xl font-bold text-emerald-700">{o.activeInstances}</p>
        </div>
        <div className={adminCls.card}>
          <p className={adminCls.kpiLabel}>{d.admin_bots_stat_subscribers}</p>
          <p className="mt-1 text-2xl font-bold text-sky-700">{o.subscribers}</p>
        </div>
      </div>

      {Object.keys(o.byPlan).length > 0 ? (
        <section className={adminCls.card}>
          <h3 className={adminCls.h2}>{d.admin_bots_by_plan}</h3>
          <ul className="mt-2 flex flex-wrap gap-2 text-sm">
            {Object.entries(o.byPlan).map(([planId, n]) => (
              <li
                key={planId}
                className="rounded-lg border border-[color:var(--fd-border)] bg-[color:var(--fd-mint)]/40 px-3 py-1.5 text-[color:var(--fd-text)]"
              >
                {planLabels[planId] ?? planId}: <strong>{n}</strong>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className={adminCls.card}>
        <h3 className={`mb-3 ${adminCls.h2}`}>{d.admin_bots_recent_subs}</h3>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className={`border-b border-[color:var(--fd-border)] ${adminCls.muted}`}>
                <th className="pb-2 pr-3">{d.admin_bots_col_email}</th>
                <th className="pb-2 pr-3">{d.admin_bots_col_plan}</th>
                <th className="pb-2 pr-3">{d.admin_bots_col_billing}</th>
                <th className="pb-2 pr-3">{d.admin_bots_col_price}</th>
                <th className="pb-2">{d.admin_bots_col_expires}</th>
              </tr>
            </thead>
            <tbody>
              {o.recentSubscriptions.map((row) => (
                <tr key={row.id} className="border-b border-[color:var(--fd-border)] text-[color:var(--fd-text)]">
                  <td className="py-2 pr-3 font-mono text-xs">{row.email}</td>
                  <td className="py-2 pr-3">{planLabels[row.planId] ?? row.planId}</td>
                  <td className="py-2 pr-3">{row.billing}</td>
                  <td className="py-2 pr-3">{row.pricePaid} USDT</td>
                  <td className="py-2">{fmtTime(row.expiresAt, locale)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className={adminCls.card}>
        <h3 className={`mb-3 ${adminCls.h2}`}>{d.admin_bots_recent_logs}</h3>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead>
              <tr className={`border-b border-[color:var(--fd-border)] ${adminCls.muted}`}>
                <th className="pb-2 pr-3">{d.admin_bots_col_time}</th>
                <th className="pb-2 pr-3">{d.admin_bots_col_email}</th>
                <th className="pb-2 pr-3">{d.admin_bots_col_plan}</th>
                <th className="pb-2">{d.admin_bots_col_action}</th>
              </tr>
            </thead>
            <tbody>
              {o.recentLogs.map((row) => (
                <tr key={row.id} className="border-b border-[color:var(--fd-border)] text-[color:var(--fd-text)]">
                  <td className="py-2 pr-3 whitespace-nowrap">
                    {fmtTime(row.createdAt, locale)}
                  </td>
                  <td className="py-2 pr-3 font-mono text-xs">{row.email}</td>
                  <td className="py-2 pr-3">{planLabels[row.planId] ?? row.planId}</td>
                  <td className="py-2 font-mono text-xs">{row.action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
