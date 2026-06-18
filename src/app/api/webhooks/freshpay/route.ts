import { NextResponse } from "next/server";
import { FreshPayProvider } from "@/lib/freshpay/provider";
import { handleFreshpayCallbackPayload } from "@/lib/freshpay/handle-callback";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: { data?: string };
  try {
    body = (await req.json()) as { data?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    const payload = FreshPayProvider.parseCallback(req, body);
    const result = await handleFreshpayCallbackPayload(payload);
    if (!result.ok) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }
    return NextResponse.json({ status: "Callback received successfully", data: payload });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "callback_error";
    if (msg === "invalid_signature" || msg === "callback_ip_denied") {
      return NextResponse.json({ error: msg }, { status: 401 });
    }
    if (msg === "missing_signature" || msg === "missing_encrypted_data" || msg === "invalid_aes_key_length") {
      return NextResponse.json({ error: msg }, { status: 400 });
    }
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
