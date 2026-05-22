import type { Messages } from "@/i18n/messages";
import type { WalletActivityItem } from "@/lib/wallet-activity-feed";
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
  item: Pick<WalletActivityItem, "kind" | "entryType">,
): string {
  if (item.kind === "deposit") return t("wallet_activity_deposit");
  if (item.kind === "withdrawal") return t("wallet_activity_withdraw");
  if (item.entryType) return walletEntryLabel(t, item.entryType);
  return t("wallet_activity_ledger");
}

export function historyVisualKind(
  item: Pick<WalletActivityItem, "kind" | "entryType">,
): HistoryVisualKind {
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
  item: Pick<WalletActivityItem, "kind" | "entryType">,
): string {
  const n = Number(raw);
  const abs = formatWalletHistoryAmount(asset, String(Math.abs(n)));
  if (!Number.isFinite(n)) return formatWalletHistoryAmount(asset, raw);
  if (n < 0) return `-${abs}`;
  if (n > 0) return `+${abs}`;
  const vk = historyVisualKind(item);
  if (vk === "receive") return `+${abs}`;
  if (vk === "send" || vk === "withdraw") return `-${abs}`;
  return abs;
}

export function matchesHistoryCategory(
  item: Pick<WalletActivityItem, "kind" | "entryType">,
  category: string,
): boolean {
  if (!category) return true;
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
