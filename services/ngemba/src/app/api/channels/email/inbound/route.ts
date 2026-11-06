import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyChannelInboundAuth } from "@/lib/channels/inbound-auth";
import { handleEmailInbound } from "@/lib/channels/email-inbound";
import { isLocale } from "@/lib/i18n";
import { clientIp, rateLimit, rateLimitResponse } from "@/lib/security/rate-limit";

const bodySchema = z.object({
  idempotencyKey: z.string().trim().min(3).max(180),
  from: z.string().trim().min(3).max(200),
  subject: z.string().trim().max(200).optional().nullable(),
  text: z.string().trim().max(8000),
  messageId: z.string().trim().max(200).optional().nullable(),
  sessionId: z.string().uuid().optional().nullable(),
  locale: z.string().default("fr"),
});

export async function POST(req: Request) {
  if (!verifyChannelInboundAuth(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const ip = clientIp(req);
  const rl = rateLimit(`em-inbound:${ip}`, 30, 60_000);
  if (!rl.ok) return rateLimitResponse(rl.retryAfterSec);

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const locale = isLocale(parsed.data.locale) ? parsed.data.locale : "fr";
  const result = await handleEmailInbound({
    ...parsed.data,
    locale,
  });

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json(result);
}
