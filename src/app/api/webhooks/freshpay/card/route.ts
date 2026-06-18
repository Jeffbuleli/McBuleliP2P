import { NextResponse } from "next/server";
import { verifyCardCallbackSignature } from "@/lib/freshpay/card-provider";
import { handleFreshpayCardCallback } from "@/lib/freshpay/handle-card-callback";
import { hasFreshpayCardKeys } from "@/lib/env";

export async function POST(req: Request) {
  if (!hasFreshpayCardKeys()) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const rawBody = await req.text();
  const signature = req.headers.get("x-signature") ?? req.headers.get("X-Signature");

  if (!verifyCardCallbackSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const result = await handleFreshpayCardCallback(
    payload as Parameters<typeof handleFreshpayCardCallback>[0],
    rawBody,
  );
  if (!result.ok) {
    return NextResponse.json({ message: result.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
