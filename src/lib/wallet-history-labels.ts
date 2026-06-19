import type { Messages } from "@/i18n/messages";
import type { WalletActivityItem } from "@/lib/wallet-activity-feed";
import { freshpayMethodLabel } from "@/lib/cod-mobile-providers";
import { formatWalletHistoryAmount } from "@/lib/wallet-types";

const ENTRY_LABEL_KEYS: Record<string, keyof Messages> = {
  swap_in: "wallet_entry_swap_in",
  swap_out: "wallet_entry_swap_out",
  swap_fee: "wallet_entry_swap_fee",
  transfer_in: "wallet_entry_transfer_in",
  transfer_out: "wallet_entry_transfer_out",
  fiat_deposit: "wallet_entry_fiat_deposit",
  fiat_withdraw: "wallet_entry_fiat_withdraw",
  fiat_withdraw_refund: "wallet_entry_fiat_withdraw_refund",
  deposit_launch_reward: "wallet_entry_deposit_launch_reward",
  p2p_ad_reserve_lock: "wallet_entry_p2p_ad_reserve_lock",
  p2p_ad_reserve_unlock: "wallet_entry_p2p_ad_reserve_unlock",
  p2p_platform_fee: "wallet_entry_p2p_platform_fee",
  p2p_quote_out: "wallet_entry_p2p_quote_out",
  p2p_quote_in: "wallet_entry_p2p_quote_in",
  p2p_escrow_lock: "wallet_entry_p2p_escrow_lock",
  p2p_release: "wallet_entry_p2p_release",
  p2p_escrow_refund: "wallet_entry_p2p_escrow_refund",
  p2p_listing_fee: "wallet_entry_p2p_listing_fee",
  p2p_ad_boost: "wallet_entry_p2p_ad_boost",
  stake_lock: "wallet_entry_stake_lock",
  stake_principal_return: "wallet_entry_stake_principal_return",
  stake_interest_payment: "wallet_entry_stake_interest_payment",
  lp_pool_lock: "wallet_entry_lp_pool_lock",
  lp_pool_reward_payout: "wallet_entry_lp_pool_reward_payout",
  loan_disburse: "wallet_entry_loan_disburse",
  loan_repay: "wallet_entry_loan_repay",
  group_contribution_in: "wallet_entry_group_contribution_in",
  group_contribution_out: "wallet_entry_group_contribution_out",
  group_social_contribution_in: "wallet_entry_group_social_contribution_in",
  group_social_aid_in: "wallet_entry_group_social_aid_in",
  group_social_aid_out: "wallet_entry_group_social_aid_out",
  group_loan_disburse_out: "wallet_entry_group_loan_disburse_out",
  group_loan_disburse_in: "wallet_entry_group_loan_disburse_in",
  group_loan_repay_in: "wallet_entry_group_loan_repay_in",
  group_loan_repay_out: "wallet_entry_group_loan_repay_out",
  group_payout_out: "wallet_entry_group_payout_out",
  group_payout_in: "wallet_entry_group_payout_in",
  group_cycle_distribution_in: "wallet_entry_group_cycle_distribution_in",
  group_cycle_distribution_out: "wallet_entry_group_cycle_distribution_out",
  group_subscription_fee: "wallet_entry_group_subscription_fee",
  trade_futures_open: "wallet_entry_trade_futures_open",
  trade_futures_close: "wallet_entry_trade_futures_close",
  trade_futures_liquidated: "wallet_entry_trade_futures_liquidated",
  trade_options_open: "wallet_entry_trade_options_open",
  trade_options_settle: "wallet_entry_trade_options_settle",
};

export type HistoryVisualKind =
  | "receive"
  | "send"
  | "withdraw"
  | "p2p"
  | "swap"
  | "other";

export function walletEntryLabel(
  t: (k: keyof Messages) => string,
  entryType: string,
): string {
  const k = ENTRY_LABEL_KEYS[entryType];
  if (k) return t(k);
  return entryType.replace(/_/g, " ");
}

export function activityTitle(
  t: (k: keyof Messages) => string,
  item: Pick<WalletActivityItem, "kind" | "entryType" | "fiatOp" | "fiatRail" | "asset">,
): string {
  return activityShortTitle(t, item);
}

function fiatHistoryTitle(
  t: (k: keyof Messages) => string,
  item: Pick<WalletActivityItem, "fiatOp" | "fiatRail" | "asset">,
): string {
  const asset = item.asset?.toUpperCase() === "CDF" ? "CDF" : "USD";
  if (item.fiatOp === "payout") {
    return asset === "CDF" ? t("wallet_hist_withdraw_cdf") : t("wallet_hist_withdraw_usd");
  }
  if (item.fiatRail === "card") {
    return asset === "CDF" ? t("wallet_hist_deposit_cdf_card") : t("wallet_hist_deposit_usd_card");
  }
  return asset === "CDF" ? t("wallet_hist_deposit_cdf") : t("wallet_hist_deposit_usd");
}

/** Channel subtitle — Airtel, M-Pesa, Visa… */
export function activityChannelLabel(
  item: Pick<WalletActivityItem, "kind" | "provider" | "providerLabel" | "fiatRail">,
  locale: "en" | "fr" = "en",
): string | null {
  if (item.kind !== "fiat_tx") return null;
  if (item.providerLabel?.trim()) return item.providerLabel.trim();
  if (item.fiatRail === "card") return locale === "fr" ? "Carte" : "Card";
  if (item.provider) return freshpayMethodLabel(item.provider, locale);
  return null;
}

/** Minimal label for history rows — channel shown separately with SVG. */
export function activityShortTitle(
  t: (k: keyof Messages) => string,
  item: Pick<WalletActivityItem, "kind" | "entryType" | "fiatOp" | "fiatRail" | "asset">,
): string {
  if (item.kind === "fiat_tx") return fiatHistoryTitle(t, item);
  if (item.kind === "deposit") return t("wallet_hist_crypto_in");
  if (item.kind === "withdrawal") return t("wallet_hist_crypto_out");
  const et = item.entryType ?? "";
  if (et === "swap_in" || et === "swap_out") return t("wallet_hist_swap");
  if (et === "swap_fee") return t("wallet_entry_swap_fee");
  if (et === "transfer_in") return t("wallet_hist_transfer_in");
  if (et === "transfer_out") return t("wallet_hist_transfer_out");
  if (et.startsWith("p2p_")) return t("wallet_history_cat_p2p");
  if (et) return walletEntryLabel(t, et);
  return t("wallet_activity_ledger");
}

export function historyVisualKind(
  item: Pick<WalletActivityItem, "kind" | "entryType" | "fiatOp">,
): HistoryVisualKind {
  if (item.kind === "fiat_tx") {
    return item.fiatOp === "payout" ? "withdraw" : "receive";
  }
  if (item.kind === "deposit") return "receive";
  if (item.kind === "withdrawal") return "withdraw";
  const et = item.entryType ?? "";
  if (et.startsWith("p2p_")) return "p2p";
  if (et.includes("swap")) return "swap";
  if (
    et === "transfer_in" ||
    et.endsWith("_in") ||
    et.includes("refund") ||
    et.includes("release") ||
    et.includes("reward") ||
    et.includes("return") ||
    et.includes("disburse")
  ) {
    return "receive";
  }
  if (et === "transfer_out" || et.endsWith("_out") || et.includes("lock") || et.includes("fee")) {
    return "send";
  }
  return "other";
}

/** Signed display amount without double minus (e.g. --700). */
export function formatSignedWalletAmount(
  asset: string,
  raw: string,
  item: Pick<WalletActivityItem, "kind" | "entryType" | "fiatOp">,
): string {
  const n = Number(raw);
  const abs = formatWalletHistoryAmount(asset, String(Math.abs(n)));
  if (!Number.isFinite(n)) return formatWalletHistoryAmount(asset, raw);
  const vk = historyVisualKind(item);
  if (vk === "withdraw" || vk === "send") {
    const out = n !== 0 ? Math.abs(n) : Number(raw);
    const formatted = formatWalletHistoryAmount(asset, String(out));
    return `-${formatted}`;
  }
  if (n < 0) return `-${abs}`;
  if (n > 0) return `+${abs}`;
  if (vk === "receive") return `+${abs}`;
  return abs;
}

export function matchesHistoryCategory(
  item: Pick<WalletActivityItem, "kind" | "entryType" | "fiatOp">,
  category: string,
): boolean {
  if (!category) return true;
  if (category === "fiat") {
    return item.kind === "fiat_tx";
  }
  if (item.kind === "fiat_tx") {
    const vk = historyVisualKind(item);
    if (category === "receive") return vk === "receive";
    if (category === "withdraw") return vk === "withdraw";
    return false;
  }
  const vk = historyVisualKind(item);
  if (category === "receive") return vk === "receive";
  if (category === "send") return vk === "send";
  if (category === "withdraw") return vk === "withdraw";
  if (category === "p2p") return vk === "p2p";
  if (category === "swap") return vk === "swap";
  if (category.endsWith("_")) {
    return (item.entryType ?? "").startsWith(category);
  }
  return true;
}
