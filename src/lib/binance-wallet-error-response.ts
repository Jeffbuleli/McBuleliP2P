import { binanceWalletErrorCode } from "@/lib/binance";
import { isSuperAdminUserId } from "@/lib/bot-super-admin";

/** Raw Binance / JSON strings must never be shown to end users. */
export function isTechnicalBinanceMessage(msg: string): boolean {
  const m = msg.trim();
  if (!m) return false;
  if (m.startsWith("Binance HTTP")) return true;
  if (m.startsWith("{") && m.includes('"code"')) return true;
  if (m.includes("-2015") && m.includes("{")) return true;
  return false;
}

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
