import { and, eq, notInArray } from "drizzle-orm";
import { getDb, withdrawals } from "@/db";
import { fetchFiatFreshpayRows } from "@/lib/fiat-freshpay-db";
import { WithdrawalStatus } from "@/lib/status";
import { fetchOpenDepositForAsset } from "@/lib/wallet-activity-feed";
import { cryptoDepositDetailHref } from "@/lib/wallet-money-routes";
import type { WalletAsset } from "@/lib/wallet-types";

const TERMINAL_WITHDRAWAL = [
  WithdrawalStatus.COMPLETED,
  WithdrawalStatus.REJECTED,
  WithdrawalStatus.FAILED,
] as string[];

export type WalletRowPending = {
  label: string;
  href?: string;
};

/** Non-terminal in-flight ops per overview asset row (USDT, PI, USD, CDF). */
export async function fetchWalletPendingByAsset(
  userId: string,
): Promise<Partial<Record<WalletAsset, WalletRowPending>>> {
  const result: Partial<Record<WalletAsset, WalletRowPending>> = {};

  for (const asset of ["USDT", "PI"] as const) {
    const open = await fetchOpenDepositForAsset(userId, asset);
    if (open) {
      result[asset] = {
        label: "status_ui_processing",
        href: cryptoDepositDetailHref(open.id),
      };
    }
  }

  const db = getDb();
  const pendingWithdrawals = await db
    .select({ asset: withdrawals.asset, id: withdrawals.id })
    .from(withdrawals)
    .where(
      and(
        eq(withdrawals.userId, userId),
        notInArray(withdrawals.status, TERMINAL_WITHDRAWAL),
      ),
    )
    .limit(50);

  for (const w of pendingWithdrawals) {
    const asset = w.asset as WalletAsset;
    if ((asset === "USDT" || asset === "PI") && !result[asset]) {
      result[asset] = {
        label: "status_ui_processing",
        href: `/app/wallet/activity/withdraw/${w.id}`,
      };
    }
  }

  const fiatRows = await fetchFiatFreshpayRows({ userId, sort: "newest", limit: 30 });
  for (const f of fiatRows) {
    if (f.status === "COMPLETED" || f.status === "FAILED") continue;
    const asset = f.currency as WalletAsset;
    if ((asset === "USD" || asset === "CDF") && !result[asset]) {
      result[asset] = {
        label: "status_ui_processing",
        href: `/app/wallet/fiat/status/${encodeURIComponent(f.reference)}`,
      };
    }
  }

  return result;
}
