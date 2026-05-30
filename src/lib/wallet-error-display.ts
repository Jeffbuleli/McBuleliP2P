import type { Messages } from "@/i18n/messages";
import { isTechnicalBinanceMessage } from "@/lib/binance-error-display";
import { clientErrorText } from "@/lib/client-error-text";

/** Map raw withdrawal/deposit failure strings to user-facing i18n (no JSON). */
export function formatWalletFailureReason(
  t: (k: keyof Messages, vars?: Record<string, string | number>) => string,
  raw: string | null | undefined,
): string | null {
  if (!raw?.trim()) return null;
  const msg = raw.trim();

  if (isTechnicalBinanceMessage(msg)) {
    if (
      msg.includes("-4028") ||
      msg.includes("031035") ||
      msg.toLowerCase().includes("greater than the transaction fee")
    ) {
      return t("withdraw_error_amount_vs_network_fee");
    }
    return t("wallet_withdraw_provider_error");
  }

  if (
    msg.startsWith("withdraw_") ||
    msg.startsWith("wallet_") ||
    msg.startsWith("deposit_")
  ) {
    return clientErrorText(t, msg);
  }

  if (msg.length > 160) {
    return t("wallet_withdraw_provider_error");
  }

  return msg;
}
