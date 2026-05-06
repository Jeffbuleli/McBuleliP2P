import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUserId } from "@/lib/session";
import {
  PiNetworkApiKeyMissingError,
  getPiNetworkApiKey,
} from "@/lib/pi-network-env";
import { piCompletePaymentPlatform } from "@/lib/pi-platform-payments";

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
    const apiKey = getPiNetworkApiKey();
    const data = await piCompletePaymentPlatform(
      parsed.data.paymentId,
      parsed.data.txid,
      apiKey,
    );
    return NextResponse.json({ ok: true, payment: data });
  } catch (e) {
    if (e instanceof PiNetworkApiKeyMissingError) {
      return NextResponse.json({ message: e.message }, { status: 503 });
    }
    const msg = e instanceof Error ? e.message : "Complete failed.";
    return NextResponse.json({ message: msg }, { status: 502 });
  }
}
