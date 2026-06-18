import type { Locale } from "@/i18n/locale";
import { formatMoneyLocale } from "@/lib/fx";
import { getStakingValuationUsd } from "@/lib/staking-service";
import { getWalletUserState } from "@/lib/wallet-user-state";
import {
  formatHomeAssetBalance,
  formatWalletAssetBalance,
} from "@/lib/wallet-balance-format";
import type { WalletAsset } from "@/lib/wallet-types";

export type PortfolioSnapshot = {
  /**
   * Sum of all wallet lines in USD (matches Wallet estimated total, excluding staking).
   * @deprecated Field name kept for compatibility; value is USD, not “USDT equiv” only.
   */
  totalEquivUsdt: number;
  /** Same formatting as Wallet overview header (`totalUsdDisplay`). */
  totalEquivDisplay: string;
  usdtDisplay: string;
  piDisplay: string;
  usdBalanceDisplay: string;
  cdfBalanceDisplay: string;
  fiatUsdDisplay: string;
  fiatCdfDisplay: string;
};

/** Fallback when snapshot cannot be loaded (should be rare if session user exists). */
export function emptyPortfolioSnapshot(locale: Locale): PortfolioSnapshot {
  const loc = locale === "fr" ? "fr-FR" : "en-US";
  return {
    totalEquivUsdt: 0,
    totalEquivDisplay: (0).toLocaleString(loc, {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
    }),
    usdtDisplay: "0 USDT",
    piDisplay: "0 Pi",
    usdBalanceDisplay: "0 USD",
    cdfBalanceDisplay: "0 CDF",
    fiatUsdDisplay: `≈ ${formatMoneyLocale(0, locale, 2)} USD`,
    fiatCdfDisplay: "≈ 0 CDF",
  };
}

/** Same headline math as Wallet overview (liquid balances + locked staking). */
export function formatPortfolioTotalWithStaking(
  snapshot: PortfolioSnapshot,
  stakeVal: Awaited<ReturnType<typeof getStakingValuationUsd>>,
  locale: Locale,
): string {
  const mergedUsd =
    snapshot.totalEquivUsdt +
    stakeVal.principalUsd +
    stakeVal.accruedInterestUsd;
  const loc = locale === "fr" ? "fr-FR" : "en-US";
  return mergedUsd.toLocaleString(loc, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  });
}

export async function getPortfolioSnapshotForUser(
  userId: string,
  locale: Locale,
): Promise<PortfolioSnapshot | null> {
  const state = await getWalletUserState(userId, locale);
  if (!state) return null;

  const line = (a: WalletAsset) =>
    state.lines.find((x) => x.asset === a)!;

  const usdt = line("USDT");
  const pi = line("PI");
  const usd = line("USD");
  const cdf = line("CDF");

  const usdtDisplay = `${formatHomeAssetBalance(usdt.balanceNum, "USDT", locale)} USDT`;
  const piDisplay =
    pi.balanceNum > 0 && pi.valueUsd > 0
      ? `${formatHomeAssetBalance(pi.balanceNum, "PI", locale)} Pi · ≈ ${formatMoneyLocale(pi.valueUsd, locale, 2)}`
      : `${formatHomeAssetBalance(pi.balanceNum, "PI", locale)} Pi`;

  const fiatUsdDisplay = `≈ ${formatMoneyLocale(usd.balanceNum, locale, 2)} USD`;
  const fiatCdfDisplay = `≈ ${formatWalletAssetBalance(cdf.balanceNum, "CDF", locale)} CDF`;
  const usdBalanceDisplay = `${formatHomeAssetBalance(usd.balanceNum, "USD", locale)} USD`;
  const cdfBalanceDisplay = `${formatWalletAssetBalance(cdf.balanceNum, "CDF", locale)} CDF`;

  return {
    totalEquivUsdt: state.totalUsd,
    totalEquivDisplay: state.totalUsdDisplay,
    usdtDisplay,
    piDisplay,
    usdBalanceDisplay,
    cdfBalanceDisplay,
    fiatUsdDisplay,
    fiatCdfDisplay,
  };
}
