import { redirect } from "next/navigation";
import { getDictionary } from "@/i18n/messages";
import { getLocale } from "@/lib/get-locale";
import { getSessionUser } from "@/lib/session-user";
import { UserRole } from "@/lib/roles";
import { getAdminBotsOverview } from "@/lib/bot-admin-service";

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
    <div className="space-y-8">
      <h2 className="text-xl font-bold text-white">{d.admin_bots_title}</h2>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-stone-700 bg-stone-900/60 p-4">
          <p className="text-xs uppercase tracking-wide text-stone-400">
            {d.admin_bots_stat_subscriptions}
          </p>
          <p className="mt-1 text-2xl font-bold text-amber-200">{o.activeSubscriptions}</p>
        </div>
        <div className="rounded-xl border border-stone-700 bg-stone-900/60 p-4">
          <p className="text-xs uppercase tracking-wide text-stone-400">
            {d.admin_bots_stat_instances}
          </p>
          <p className="mt-1 text-2xl font-bold text-emerald-200">{o.activeInstances}</p>
        </div>
        <div className="rounded-xl border border-stone-700 bg-stone-900/60 p-4">
          <p className="text-xs uppercase tracking-wide text-stone-400">
            {d.admin_bots_stat_subscribers}
          </p>
          <p className="mt-1 text-2xl font-bold text-sky-200">{o.subscribers}</p>
        </div>
      </div>

      {Object.keys(o.byPlan).length > 0 ? (
        <section className="rounded-xl border border-stone-700 bg-stone-900/40 p-4">
          <h3 className="text-sm font-semibold text-stone-200">{d.admin_bots_by_plan}</h3>
          <ul className="mt-2 flex flex-wrap gap-2 text-sm">
            {Object.entries(o.byPlan).map(([planId, n]) => (
              <li
                key={planId}
                className="rounded-lg border border-stone-600 bg-stone-950/50 px-3 py-1.5 text-stone-100"
              >
                {planLabels[planId] ?? planId}: <strong>{n}</strong>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="rounded-xl border border-stone-700 bg-stone-900/40 p-4">
        <h3 className="mb-3 text-sm font-semibold text-stone-200">
          {d.admin_bots_recent_subs}
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-stone-700 text-stone-400">
                <th className="pb-2 pr-3">{d.admin_bots_col_email}</th>
                <th className="pb-2 pr-3">{d.admin_bots_col_plan}</th>
                <th className="pb-2 pr-3">{d.admin_bots_col_billing}</th>
                <th className="pb-2 pr-3">{d.admin_bots_col_price}</th>
                <th className="pb-2">{d.admin_bots_col_expires}</th>
              </tr>
            </thead>
            <tbody>
              {o.recentSubscriptions.map((row) => (
                <tr key={row.id} className="border-b border-stone-800/80 text-stone-200">
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

      <section className="rounded-xl border border-stone-700 bg-stone-900/40 p-4">
        <h3 className="mb-3 text-sm font-semibold text-stone-200">
          {d.admin_bots_recent_logs}
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead>
              <tr className="border-b border-stone-700 text-stone-400">
                <th className="pb-2 pr-3">{d.admin_bots_col_time}</th>
                <th className="pb-2 pr-3">{d.admin_bots_col_email}</th>
                <th className="pb-2 pr-3">{d.admin_bots_col_plan}</th>
                <th className="pb-2">{d.admin_bots_col_action}</th>
              </tr>
            </thead>
            <tbody>
              {o.recentLogs.map((row) => (
                <tr key={row.id} className="border-b border-stone-800/80 text-stone-200">
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
