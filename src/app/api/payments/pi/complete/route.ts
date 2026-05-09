import { NextResponse } from "next/server";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { getSessionUserId } from "@/lib/session";
import { getDb, p2pAds, piPlatformPayments } from "@/db";
import {
  PiNetworkApiKeyMissingError,
  PiNetworkTestApiKeyMissingError,
} from "@/lib/pi-network-env";
import { resolvePiPlatformApiKeyForPaymentId } from "@/lib/pi-platform-payment-key";
import { piCompletePaymentPlatform } from "@/lib/pi-platform-payments";
import type { WalletAsset } from "@/lib/wallet-types";
import { creditUserAsset } from "@/lib/wallet-move-assets";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const bodyZ = z.object({
  paymentId: z.string().min(8),
  txid: z.string().min(8),
});

export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const json = await req.json().catch(() => null);
  const parsed = bodyZ.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid body." }, { status: 400 });
  }

  try {
    const { apiKey, sandbox } = await resolvePiPlatformApiKeyForPaymentId(
      parsed.data.paymentId,
    );
    const data = await piCompletePaymentPlatform(
      parsed.data.paymentId,
      parsed.data.txid,
      apiKey,
    );

    const db = getDb();
    // Update local record (idempotent).
    const [row] = await db
      .insert(piPlatformPayments)
      .values({
        userId,
        kind: "U2A",
        paymentId: parsed.data.paymentId,
        amount: "0",
        memo: "",
        action: "wallet_test",
        actionRefId: null,
        status: "COMPLETED",
        txid: parsed.data.txid,
        meta: null,
        fulfilledAt: null,
      })
      .onConflictDoUpdate({
        target: piPlatformPayments.paymentId,
        set: {
          status: "COMPLETED",
          txid: parsed.data.txid,
          updatedAt: new Date(),
        },
      })
      .returning();

    // Fulfillment for known actions.
    if (row && !row.fulfilledAt && row.action === "wallet_test") {
      const amtStr = row.amount != null ? row.amount.toString() : "0";
      const credited = Number(amtStr);
      const creditAsset: WalletAsset = sandbox ? "PI_TEST" : "PI";
      if (Number.isFinite(credited) && credited > 0) {
        await db.transaction(async (tx) => {
          await creditUserAsset(tx, userId, creditAsset, amtStr);
          await tx
            .update(piPlatformPayments)
            .set({ fulfilledAt: new Date(), updatedAt: new Date() })
            .where(eq(piPlatformPayments.paymentId, parsed.data.paymentId));
        });
      }
    } else if (
      row &&
      !row.fulfilledAt &&
      row.action === "p2p_ad_boost" &&
      row.actionRefId
    ) {
      const boostDays = Number(process.env.PI_P2P_BOOST_DAYS ?? "7");
      const until = new Date(Date.now() + Math.max(1, boostDays) * 24 * 60 * 60 * 1000);
      const boostAmountPi = row.amount ? row.amount.toString() : "0";

      // Only allow boosting own ad.
      await db
        .update(p2pAds)
        .set({ boostedUntil: until, boostAmountPi, updatedAt: new Date() })
        .where(and(eq(p2pAds.id, row.actionRefId), eq(p2pAds.userId, userId)));

      await db
        .update(piPlatformPayments)
        .set({ fulfilledAt: new Date(), updatedAt: new Date() })
        .where(eq(piPlatformPayments.paymentId, parsed.data.paymentId));
    }

    return NextResponse.json({ ok: true, payment: data });
  } catch (e) {
    if (
      e instanceof PiNetworkApiKeyMissingError ||
      e instanceof PiNetworkTestApiKeyMissingError
    ) {
      return NextResponse.json({ message: e.message }, { status: 503 });
    }
    const msg = e instanceof Error ? e.message : "Complete failed.";
    return NextResponse.json({ message: msg }, { status: 502 });
  }
}
