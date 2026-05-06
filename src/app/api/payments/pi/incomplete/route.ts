import { NextResponse } from "next/server";
import { z } from "zod";
import {
  PiNetworkApiKeyMissingError,
  getPiNetworkApiKey,
} from "@/lib/pi-network-env";
import {
  extractPaymentId,
  piApprovePaymentPlatform,
  piCompletePaymentPlatform,
  type PiPaymentDtoLike,
} from "@/lib/pi-platform-payments";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const bodyZ = z.object({
  payment: z.unknown(),
});

/**
 * Finishes an in-flight U2A payment (used from Pi.authenticate onIncompletePaymentFound).
 * Must not silently ignore failures — errors propagate to the client callback.
 */
export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = bodyZ.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid body." }, { status: 400 });
  }

  const payment = parsed.data.payment as PiPaymentDtoLike;
  const id = extractPaymentId(payment);
  if (!id) {
    return NextResponse.json({ message: "Missing payment identifier." }, { status: 400 });
  }

  try {
    const apiKey = getPiNetworkApiKey();

    if (!payment.status?.developer_approved) {
      await piApprovePaymentPlatform(id, apiKey);
    }

    const txid = payment.transaction?.txid;
    if (txid && !payment.status?.developer_completed) {
      await piCompletePaymentPlatform(id, txid, apiKey);
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof PiNetworkApiKeyMissingError) {
      return NextResponse.json({ message: e.message }, { status: 503 });
    }
    const msg = e instanceof Error ? e.message : "Incomplete payment resolution failed.";
    return NextResponse.json({ message: msg }, { status: 502 });
  }
}
