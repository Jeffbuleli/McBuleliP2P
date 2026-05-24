import { NextResponse } from "next/server";
import {
  parseOpenWaInboundMessage,
  verifyOpenWaWebhookSignature,
  type OpenWaWebhookEnvelope,
} from "@/lib/auth/openwa-webhook";
import { processInboundWhatsAppMessage } from "@/lib/auth/whatsapp";

export async function POST(req: Request) {
  const rawBody = await req.text();
  let body: OpenWaWebhookEnvelope;
  try {
    body = JSON.parse(rawBody) as OpenWaWebhookEnvelope;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const secret = process.env.OPENWA_WEBHOOK_SECRET?.trim();
  if (secret) {
    const signature = req.headers.get("x-openwa-signature");
    if (
      !verifyOpenWaWebhookSignature({
        payload: body,
        rawBody,
        signatureHeader: signature,
        secret,
      })
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const inbound = parseOpenWaInboundMessage(body);
  if (!inbound) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const result = await processInboundWhatsAppMessage({
    chatId: inbound.chatId,
    phone: inbound.phone,
    body: inbound.body,
  });

  return NextResponse.json({ ok: true, ...result });
}
