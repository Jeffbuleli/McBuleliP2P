import { binanceWalletErrorCode } from "@/lib/binance";
import { isTechnicalBinanceMessage } from "@/lib/binance-error-display";
import { isSuperAdminUserId } from "@/lib/bot-super-admin";

export { isTechnicalBinanceMessage } from "@/lib/binance-error-display";

/** Safe API body for deposit/withdraw Binance failures. */
export async function binanceWalletErrorPayload(
  e: unknown,
  userId: string | null,
): Promise<{ message: string; adminDetail?: string }> {
  const raw = e instanceof Error ? e.message : String(e);
  let message = await binanceWalletErrorCode(e);
  if (isTechnicalBinanceMessage(message)) {
    message = "deposit_provider_unavailable";
  }
  const isSuper = userId ? await isSuperAdminUserId(userId) : false;
  return {
    message,
    ...(isSuper && raw.trim() ? { adminDetail: raw.trim().slice(0, 800) } : {}),
  };
}
