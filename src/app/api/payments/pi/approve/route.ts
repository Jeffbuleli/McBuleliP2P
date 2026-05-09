import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUserId } from "@/lib/session";
import { getDb, piPlatformPayments } from "@/db";
import {
  PiNetworkApiKeyMissingError,
  PiNetworkTestApiKeyMissingError,
} from "@/lib/pi-network-env";
import { resolvePiPlatformApiKeyForPaymentId } from "@/lib/pi-platform-payment-key";
import { piApprovePaymentPlatform } from "@/lib/pi-platform-payments";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const bodyZ = z.object({
  paymentId: z.string().min(8),
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
    const { apiKey } = await resolvePiPlatformApiKeyForPaymentId(
      parsed.data.paymentId,
    );
    const data = await piApprovePaymentPlatform(parsed.data.paymentId, apiKey);
    const db = getDb();
    // Best-effort: record status even if init wasn't called (SDK retries).
    await db
      .insert(piPlatformPayments)
      .values({
        userId,
        kind: "U2A",
        paymentId: parsed.data.paymentId,
        amount: "0",
        memo: "",
        action: "wallet_test",
        actionRefId: null,
        status: "APPROVED",
        meta: null,
      })
      .onConflictDoUpdate({
        target: piPlatformPayments.paymentId,
        set: { status: "APPROVED", updatedAt: new Date() },
      });
    return NextResponse.json({ ok: true, payment: data });
  } catch (e) {
    if (
      e instanceof PiNetworkApiKeyMissingError ||
      e instanceof PiNetworkTestApiKeyMissingError
    ) {
      return NextResponse.json({ message: e.message }, { status: 503 });
    }
    const msg = e instanceof Error ? e.message : "Approve failed.";
    return NextResponse.json({ message: msg }, { status: 502 });
  }
}
