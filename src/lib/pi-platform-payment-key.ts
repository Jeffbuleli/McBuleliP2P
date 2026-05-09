import { eq } from "drizzle-orm";
import { getDb, piPlatformPayments } from "@/db";
import {
  getPiNetworkApiKeyForSandbox,
  piSandboxFromMeta,
} from "@/lib/pi-network-env";

/**
 * Chooses Mainnet vs Testnet Pi Platform server API key from the `pi_platform_payments`
 * row created by `/api/payments/pi/u2a/init` (metadata includes `piSandbox` when applicable).
 */
export async function resolvePiPlatformApiKeyForPaymentId(
  paymentId: string,
): Promise<{ apiKey: string; sandbox: boolean }> {
  const db = getDb();
  const [row] = await db
    .select({ meta: piPlatformPayments.meta })
    .from(piPlatformPayments)
    .where(eq(piPlatformPayments.paymentId, paymentId))
    .limit(1);
  const sandbox = piSandboxFromMeta(row?.meta ?? null);
  return { apiKey: getPiNetworkApiKeyForSandbox(sandbox), sandbox };
}
