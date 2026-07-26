/**
 * Heal stuck promo cashback MoMo payouts by polling pawaPay.
 */
import { and, eq, inArray } from "drizzle-orm";
import { getDb, hackathonPromoCashbackClaims } from "@/db";
import { applyPromoCashbackPayoutCallback } from "@/lib/hackathon/promo-claims";
import { handlePawapayCallback } from "@/lib/pawapay/handle-callback";
import {
  normalizePawapayStatusPayload,
  pawapayCheckPayout,
} from "@/lib/pawapay/provider";
import { parseCashbackFeeNote } from "@/lib/email/messages/hackathon-cashback-payout";

export async function reconcilePromoCashbackPayoutByReference(
  payoutReference: string,
): Promise<void> {
  const db = getDb();
  const [claim] = await db
    .select()
    .from(hackathonPromoCashbackClaims)
    .where(eq(hackathonPromoCashbackClaims.payoutReference, payoutReference))
    .limit(1);
  if (!claim?.payoutReference) return;
  if (claim.status === "paid" || claim.status === "rejected" || claim.status === "failed") {
    return;
  }
  if (claim.payoutStatus === "COMPLETED" || claim.payoutStatus === "FAILED") {
    return;
  }

  const remote = await pawapayCheckPayout(claim.payoutReference);
  if (!remote) return;

  const fees = parseCashbackFeeNote(claim.note);
  const gross = Number(claim.amountUsd);
  const net =
    fees.netUsd != null && Number.isFinite(fees.netUsd)
      ? fees.netUsd
      : gross;
  const normalized = normalizePawapayStatusPayload("payout", remote, {
    reference: claim.payoutReference,
    currency: "USD",
    amount: net.toFixed(2),
  });

  if (normalized.status === "PROCESSING") return;

  await handlePawapayCallback(normalized).catch(async () => {
    await applyPromoCashbackPayoutCallback({
      payoutReference: claim.payoutReference!,
      status: normalized.status,
      failureMessage: normalized.failureMessage,
    });
  });
}

export async function reconcileOpenPromoCashbackClaimsForPromo(
  promoId: string,
): Promise<void> {
  const db = getDb();
  const open = await db
    .select({
      payoutReference: hackathonPromoCashbackClaims.payoutReference,
    })
    .from(hackathonPromoCashbackClaims)
    .where(
      and(
        eq(hackathonPromoCashbackClaims.promoCodeId, promoId),
        inArray(hackathonPromoCashbackClaims.status, ["requested", "approved"]),
      ),
    )
    .limit(20);

  for (const row of open) {
    if (!row.payoutReference) continue;
    await reconcilePromoCashbackPayoutByReference(row.payoutReference).catch(
      (e) => {
        console.warn(
          "[promo-cashback] reconcile failed",
          row.payoutReference,
          e,
        );
      },
    );
  }
}
