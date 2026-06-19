import { adminCls, AdminBackLink, AdminPageHeader } from "@/components/admin/admin-ui";
import { TreasuryBalanceRepair } from "@/components/admin/treasury-balance-repair";
import { getDictionary } from "@/i18n/messages";
import { getLocale } from "@/lib/get-locale";
import { getTreasuryReport } from "@/lib/treasury-service";
import { getSessionUser } from "@/lib/session-user";
import { UserRole } from "@/lib/roles";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

function fmtUsd(n: number, locale: string) {
  const loc = locale === "fr" ? "fr-FR" : "en-US";
  return n.toLocaleString(loc, { style: "currency", currency: "USD", maximumFractionDigits: 2 });
}

function fmtNum(n: number, locale: string) {
  const loc = locale === "fr" ? "fr-FR" : "en-US";
  return n.toLocaleString(loc, { maximumFractionDigits: 2 });
}

function levelCls(level: "ok" | "warn" | "danger") {
  if (level === "danger") return "text-red-700 bg-red-50 ring-red-200";
  if (level === "warn") return "text-amber-800 bg-amber-50 ring-amber-200";
  return "text-emerald-800 bg-emerald-50 ring-emerald-200";
}

export default async function AdminTreasuryPage() {
  const me = await getSessionUser();
  if (!me || me.role !== UserRole.SUPER_ADMIN) redirect("/admin");

  const locale = await getLocale();
  const d = getDictionary(locale);

  let report: Awaited<ReturnType<typeof getTreasuryReport>> | null = null;
  let loadError: string | null = null;
  try {
    report = await getTreasuryReport();
  } catch (e) {
    loadError = e instanceof Error ? e.message : "treasury_load_failed";
  }

  if (!report) {
    return (
      <div>
        <AdminBackLink href="/admin">{d.admin_back}</AdminBackLink>
        <AdminPageHeader title={d.admin_treasury_title} />
        <p className={adminCls.card}>
          {loadError ?? "Unable to load treasury report. Check database migrations and platform settings."}
        </p>
      </div>
    );
  }

  return (
    <div>
      <AdminBackLink href="/admin">{d.admin_back}</AdminBackLink>
      <AdminPageHeader title={d.admin_treasury_title} />

      <TreasuryBalanceRepair
        labels={{
          title: d.admin_treasury_repair_title,
          intro: d.admin_treasury_repair_intro,
          dryRun: d.admin_treasury_repair_dry_run,
          repair: d.admin_treasury_repair_run,
          loading: d.admin_treasury_repair_loading,
          untrusted: d.admin_treasury_repair_untrusted,
          swaps: d.admin_treasury_repair_swaps,
          orphanFiat: d.admin_treasury_repair_orphan_fiat,
          error: d.admin_treasury_repair_error,
        }}
      />

      <section className="mb-6">
        <h2 className="mb-3 text-sm font-bold text-[color:var(--fd-muted)]">{d.admin_treasury_coverage}</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {report.coverages.map((c) => (
            <div key={c.asset} className={`rounded-2xl p-4 ring-1 ${levelCls(c.level)}`}>
              <p className="text-xs font-bold uppercase tracking-wide">{c.asset}</p>
              <p className="mt-2 text-2xl font-black tabular-nums">{fmtNum(c.coveragePct, locale)}%</p>
              <p className="mt-2 text-xs">
                {d.admin_treasury_reserve}: {fmtNum(c.reserve, locale)} · {d.admin_treasury_liability}:{" "}
                {fmtNum(c.liability, locale)}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-6">
        <h2 className="mb-3 text-sm font-bold text-[color:var(--fd-muted)]">{d.admin_treasury_flows}</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {(
            [
              ["24h", report.flows.h24],
              ["7d", report.flows.d7],
              ["30d", report.flows.d30],
            ] as const
          ).map(([label, f]) => (
            <div key={label} className={adminCls.card}>
              <p className="text-xs font-bold uppercase text-[color:var(--fd-muted)]">{label}</p>
              <p className="mt-2 text-sm">
                {d.admin_treasury_in}: <strong>{fmtUsd(f.inUsd, locale)}</strong>
              </p>
              <p className="text-sm">
                {d.admin_treasury_out}: <strong>{fmtUsd(f.outUsd, locale)}</strong>
              </p>
              {f.phantomReversedUsd > 0 ? (
                <p className="text-[10px] text-amber-800">
                  {d.admin_treasury_phantom_reversed}: {fmtUsd(f.phantomReversedUsd, locale)}
                </p>
              ) : null}
              <p className="mt-1 text-[10px] text-[color:var(--fd-muted)]">{f.count} ops</p>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className={adminCls.card}>
          <h2 className="text-sm font-bold text-[color:var(--fd-muted)]">{d.admin_treasury_profits}</h2>
          <p className="mt-2 text-2xl font-black tabular-nums text-[color:var(--fd-primary)]">
            {fmtUsd(report.profits.totalUsd, locale)}
          </p>
          <p className="mt-1 text-xs text-[color:var(--fd-muted)]">
            Fiat: {fmtUsd(report.profits.fiatFeesUsd, locale)}
          </p>
        </div>
        <div className={adminCls.card}>
          <h2 className="text-sm font-bold text-[color:var(--fd-muted)]">{d.admin_treasury_pending}</h2>
          <p className="mt-2 text-sm">
            Processing: <strong>{report.pendingFiat.processing}</strong>
          </p>
          <p className="text-sm">
            Failed (24h): <strong>{report.pendingFiat.failed24h}</strong>
          </p>
        </div>
      </div>
    </div>
  );
}
