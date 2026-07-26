/**
 * Heal stuck hackathon MoMo payments by polling pawaPay (same pattern as wallet fiat).
 * Status UI polls this via GET /api/hackathon/payment/[reference].
 */
import { eq } from "drizzle-orm";
import { getDb, hackathonPayments } from "@/db";
import { handlePawapayCallback } from "@/lib/pawapay/handle-callback";
import {
  normalizePawapayStatusPayload,
  pawapayCheckDeposit,
} from "@/lib/pawapay/provider";

const OPEN_STATUSES = new Set(["INITIATED", "PROCESSING"]);

export async function reconcileHackathonPaymentByReference(
  reference: string,
): Promise<void> {
  const db = getDb();
  const [pay] = await db
    .select()
    .from(hackathonPayments)
    .where(eq(hackathonPayments.reference, reference))
    .limit(1);
  if (!pay) return;
  if (!OPEN_STATUSES.has(pay.status)) return;
  if (pay.rail !== "momo") return;

  const remote = await pawapayCheckDeposit(pay.reference);
  if (!remote) return;

  const normalized = normalizePawapayStatusPayload("deposit", remote, {
    reference: pay.reference,
    currency: pay.currency || "USD",
    amount: pay.amount,
  });

  if (normalized.status === "PROCESSING") return;

  await handlePawapayCallback(normalized).catch((e) => {
    console.warn("[hackathon] reconcile callback failed", reference, e);
  });
}
