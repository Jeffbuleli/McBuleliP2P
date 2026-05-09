import Link from "next/link";
import { getDictionary, interpolate } from "@/i18n/messages";
import { getLocale } from "@/lib/get-locale";
import {
  CASH_FLOW_BUCKETS,
  GROUP_TREASURY_BUCKETS,
  type CashFlowBucket,
  type GroupTreasuryBucket,
  getFinanceCashFlowReport,
} from "@/lib/finance-cashflow";
import { getSessionUser } from "@/lib/session-user";
import { UserRole } from "@/lib/roles";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

function fmtUsd(n: number, locale: string) {
  const loc = locale === "fr" ? "fr-FR" : "en-US";
  return n.toLocaleString(loc, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  });
}

function fmtUsdt(n: number, locale: string) {
  const loc = locale === "fr" ? "fr-FR" : "en-US";
  const s = n.toLocaleString(loc, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${s} USDT`;
}

export default async function AdminFinancePage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>;
}) {
  const me = await getSessionUser();
  if (!me || me.role !== UserRole.SUPER_ADMIN) {
    redirect("/admin");
  }

  const sp = await searchParams;
  const daysRaw = Number(sp.days ?? "30");
  const days = Math.min(365, Math.max(1, Number.isFinite(daysRaw) ? daysRaw : 30));

  const locale = await getLocale();
  const d = getDictionary(locale);
  const report = await getFinanceCashFlowReport(days);

  const bucketTitles: Record<CashFlowBucket, string> = {
    fiat_psp: d.admin_finance_bucket_fiat_psp,
    p2p: d.admin_finance_bucket_p2p,
    platform_fees: d.admin_finance_bucket_platform_fees,
    internal_transfer: d.admin_finance_bucket_internal_transfer,
    staking_pool_loan_trade: d.admin_finance_bucket_staking_pool_loan_trade,
    group_user_wallet: d.admin_finance_bucket_group_user_wallet,
    other: d.admin_finance_bucket_other,
  };

  const groupBucketTitles: Record<GroupTreasuryBucket, string> = {
    contribution_in: d.admin_finance_group_bucket_contribution_in,
    payout_out: d.admin_finance_group_bucket_payout_out,
    subscription_fee: d.admin_finance_group_bucket_subscription_fee,
    other: d.admin_finance_group_bucket_other,
  };

  const periodLabel = interpolate(d.admin_finance_days, { days });
  const combinedPassive =
    report.liabilityUsdEstimate + report.groupTreasuryLiabilityUsdt;

  const wdDetail = interpolate(d.admin_finance_kpi_withdrawals_detail, {
    pending: report.withdrawalsPipeline.pendingAgentCount,
    processing: report.withdrawalsPipeline.processingCount,
    gross: fmtUsdt(report.withdrawalsPipeline.openUsdtGross, locale),
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white">{d.admin_finance_title}</h2>
          <p className="mt-1 max-w-3xl text-sm text-stone-400">{d.admin_finance_sub}</p>
        </div>
        <Link href="/admin" className="text-sm text-amber-200 underline">
          {d.admin_back}
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {[7, 30, 90].map((n) => (
          <Link
            key={n}
            href={`/admin/finance?days=${n}`}
            className={`rounded-lg border px-3 py-1.5 text-sm ${
              days === n
                ? "border-amber-500 bg-amber-950/40 text-amber-100"
                : "border-stone-600 bg-stone-900/60 text-stone-300"
            }`}
          >
            {interpolate(d.admin_finance_days, { days: n })}
          </Link>
        ))}
        <a
          href={`/api/admin/finance/export?days=${days}`}
          className="ml-auto rounded-lg border border-emerald-800/50 bg-emerald-950/30 px-3 py-1.5 text-sm font-semibold text-emerald-100"
        >
          {d.admin_finance_export_csv}
        </a>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-2xl border border-stone-700 bg-stone-900/60 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
            {d.admin_finance_kpi_liability}
          </p>
          <p className="mt-2 text-2xl font-bold tabular-nums text-emerald-100">
            {fmtUsd(report.liabilityUsdEstimate, locale)}
          </p>
        </div>
        <div className="rounded-2xl border border-stone-700 bg-stone-900/60 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
            {d.admin_finance_kpi_lines}
          </p>
          <p className="mt-2 text-2xl font-bold tabular-nums text-amber-100">
            {report.ledgerLinesInRange}
          </p>
        </div>
        <div className="rounded-2xl border border-stone-700 bg-stone-900/60 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
            {d.admin_finance_kpi_period}
          </p>
          <p className="mt-2 text-sm text-stone-300">{periodLabel}</p>
          <p className="mt-2 font-mono text-[11px] text-stone-500">
            {report.sinceIso.slice(0, 10)} → {report.untilIso.slice(0, 10)}
          </p>
        </div>
        <div className="rounded-2xl border border-indigo-900/40 bg-indigo-950/25 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-300/90">
            {d.admin_finance_kpi_group_usdt}
          </p>
          <p className="mt-2 text-2xl font-bold tabular-nums text-indigo-100">
            {fmtUsdt(report.groupTreasuryLiabilityUsdt, locale)}
          </p>
        </div>
        <div className="rounded-2xl border border-rose-900/40 bg-rose-950/20 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-rose-300/90">
            {d.admin_finance_kpi_withdrawals}
          </p>
          <p className="mt-2 text-sm leading-snug text-rose-50/90">{wdDetail}</p>
        </div>
        <div className="rounded-2xl border border-teal-900/40 bg-teal-950/20 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-teal-300/90">
            {d.admin_finance_kpi_total_passive}
          </p>
          <p className="mt-2 text-2xl font-bold tabular-nums text-teal-100">
            {fmtUsd(combinedPassive, locale)}
          </p>
        </div>
      </div>

      <p className="text-xs leading-relaxed text-stone-500">
        <span className="font-semibold text-stone-400">{d.admin_finance_rates_note}: </span>
        {report.ratesNote}
      </p>
      <p className="text-xs text-stone-400">{d.admin_finance_hint_signed}</p>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-stone-400">
          {d.admin_finance_section_user_ledger}
        </h3>
        {report.daily.length === 0 ? (
          <p className="rounded-xl border border-stone-700 bg-stone-900/50 px-4 py-6 text-sm text-stone-400">
            {d.admin_finance_empty}
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-stone-700">
            <table className="min-w-[960px] text-left text-sm">
              <thead className="border-b border-stone-700 bg-stone-900/80 text-xs uppercase tracking-wide text-stone-500">
                <tr>
                  <th className="sticky left-0 z-10 bg-stone-900/95 px-3 py-3 font-semibold">
                    {d.admin_finance_col_day}
                  </th>
                  {CASH_FLOW_BUCKETS.map((k) => (
                    <th key={k} className="px-2 py-3 font-semibold">
                      {bucketTitles[k]}
                    </th>
                  ))}
                  <th className="px-2 py-3 font-semibold">{d.admin_finance_col_fees_recorded}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800">
                {report.daily.map((row) => (
                  <tr key={row.day} className="bg-stone-950/40">
                    <td className="sticky left-0 z-10 bg-stone-950/90 px-3 py-2 font-mono text-xs text-stone-200">
                      {row.day}
                    </td>
                    {CASH_FLOW_BUCKETS.map((k) => (
                      <td key={k} className="px-2 py-2 tabular-nums text-stone-300">
                        {fmtUsd(row.buckets[k].usdSigned, locale)}
                      </td>
                    ))}
                    <td className="px-2 py-2 tabular-nums text-emerald-200/90">
                      {fmtUsd(row.feesRecordedUsd, locale)}
                    </td>
                  </tr>
                ))}
                <tr className="border-t-2 border-amber-900/40 bg-amber-950/20">
                  <td className="sticky left-0 z-10 bg-amber-950/30 px-3 py-3 font-semibold text-amber-100">
                    {d.admin_finance_period_row}
                  </td>
                  {CASH_FLOW_BUCKETS.map((k) => (
                    <td key={k} className="px-2 py-3 tabular-nums font-semibold text-amber-50">
                      {fmtUsd(report.periodTotals[k].usdSigned, locale)}
                    </td>
                  ))}
                  <td className="px-2 py-3 tabular-nums font-semibold text-emerald-100">
                    {fmtUsd(report.periodFeesRecordedUsd, locale)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="space-y-2 pt-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-stone-400">
          {d.admin_finance_section_group_ledger}
        </h3>
        {report.groupTreasuryDaily.length === 0 ? (
          <p className="rounded-xl border border-stone-700 bg-stone-900/50 px-4 py-6 text-sm text-stone-400">
            {d.admin_finance_empty_group}
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-indigo-900/30">
            <table className="min-w-[720px] text-left text-sm">
              <thead className="border-b border-stone-700 bg-indigo-950/40 text-xs uppercase tracking-wide text-stone-500">
                <tr>
                  <th className="sticky left-0 z-10 bg-indigo-950/90 px-3 py-3 font-semibold">
                    {d.admin_finance_col_day}
                  </th>
                  {GROUP_TREASURY_BUCKETS.map((k) => (
                    <th key={k} className="px-2 py-3 font-semibold">
                      {groupBucketTitles[k]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800">
                {report.groupTreasuryDaily.map((row) => (
                  <tr key={row.day} className="bg-stone-950/40">
                    <td className="sticky left-0 z-10 bg-stone-950/90 px-3 py-2 font-mono text-xs text-stone-200">
                      {row.day}
                    </td>
                    {GROUP_TREASURY_BUCKETS.map((k) => (
                      <td key={k} className="px-2 py-2 tabular-nums text-stone-300">
                        {fmtUsd(row.buckets[k].usdSigned, locale)}
                      </td>
                    ))}
                  </tr>
                ))}
                <tr className="border-t-2 border-indigo-800/40 bg-indigo-950/30">
                  <td className="sticky left-0 z-10 bg-indigo-950/40 px-3 py-3 font-semibold text-indigo-100">
                    {d.admin_finance_period_row}
                  </td>
                  {GROUP_TREASURY_BUCKETS.map((k) => (
                    <td key={k} className="px-2 py-3 tabular-nums font-semibold text-indigo-50">
                      {fmtUsd(report.groupTreasuryPeriodTotals[k].usdSigned, locale)}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
