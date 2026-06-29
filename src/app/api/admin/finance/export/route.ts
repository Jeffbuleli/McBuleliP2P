import { NextResponse } from "next/server";
import { getDictionary } from "@/i18n/messages";
import { getLocale } from "@/lib/get-locale";
import {
  type CashFlowBucket,
  type GroupTreasuryBucket,
  financeRecentGroupLedgerToCsv,
  financeRecentUserLedgerToCsv,
  financeReportToFullCsv,
  getFinanceCashFlowReport,
  getFinanceRecentGroupLedgerLines,
  getFinanceRecentUserLedgerLines,
} from "@/lib/finance-cashflow";
import { StaffAuthError, requireSuperAdmin } from "@/lib/session-user";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    await requireSuperAdmin();
  } catch (e) {
    if (e instanceof StaffAuthError) {
      return NextResponse.json({ message: e.message }, { status: 403 });
    }
    throw e;
  }

  const { searchParams } = new URL(req.url);
  const daysRaw = Number(searchParams.get("days") ?? "30");
  const days = Math.min(365, Math.max(1, Number.isFinite(daysRaw) ? daysRaw : 30));
  const locale = await getLocale();
  const d = getDictionary(locale);

  const [report, recentUser, recentGroup] = await Promise.all([
    getFinanceCashFlowReport(days),
    getFinanceRecentUserLedgerLines(days, 200),
    getFinanceRecentGroupLedgerLines(days, 200),
  ]);
  const userLabels: Record<CashFlowBucket, string> = {
    fiat_psp: d.admin_finance_bucket_fiat_psp,
    p2p: d.admin_finance_bucket_p2p,
    platform_fees: d.admin_finance_bucket_platform_fees,
    internal_transfer: d.admin_finance_bucket_internal_transfer,
    staking_pool_loan_trade: d.admin_finance_bucket_staking_pool_loan_trade,
    group_user_wallet: d.admin_finance_bucket_group_user_wallet,
    other: d.admin_finance_bucket_other,
  };
  const groupLabels: Record<GroupTreasuryBucket, string> = {
    contribution_in: d.admin_finance_group_bucket_contribution_in,
    payout_out: d.admin_finance_group_bucket_payout_out,
    subscription_fee: d.admin_finance_group_bucket_subscription_fee,
    other: d.admin_finance_group_bucket_other,
  };
  const csv =
    financeReportToFullCsv(report, userLabels, groupLabels) +
    "\n\n# Phase 2 - recent user-wallet lines\n\n" +
    financeRecentUserLedgerToCsv(recentUser, userLabels) +
    "\n\n# Phase 2 - recent group treasury lines\n\n" +
    financeRecentGroupLedgerToCsv(recentGroup, groupLabels);
  const filename = `mcbuleli-finance-cashflow-${days}d-${locale}.csv`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
