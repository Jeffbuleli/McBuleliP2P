import { NextResponse } from "next/server";
import { handlePawapayWebhookJson } from "@/lib/pawapay/handle-webhook";

/**
 * PawaPay v2 — POST JSON callback (deposits & payouts).
 * @see https://docs.pawapay.io/v2/docs/what_to_know#callbacks
 */
export async function postPawapayWebhook(req: Request) {
  if (req.method !== "POST") {
    return new NextResponse(null, { status: 405 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
  }

  const result = await handlePawapayWebhookJson(body);
  if (!result.ok) {
    return NextResponse.json({ message: result.message }, { status: 400 });
  }

  return new NextResponse(null, { status: 200 });
}
