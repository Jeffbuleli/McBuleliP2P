import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyChannelInboundAuth } from "@/lib/channels/inbound-auth";
import { handleTelegramInbound } from "@/lib/channels/telegram-inbound";
import { isLocale } from "@/lib/i18n";
import { clientIp, rateLimit, rateLimitResponse } from "@/lib/security/rate-limit";
import { synthesizeSpeech, transcribeWithEleven } from "@/lib/voice/elevenlabs";

const bodySchema = z
  .object({
    idempotencyKey: z.string().trim().min(3).max(120),
    telegramUserId: z.string().trim().min(1).max(32),
    telegramChatId: z.string().trim().min(1).max(32),
    text: z.string().trim().max(2000).optional().default(""),
    locale: z.string().default("fr"),
    sessionId: z.string().uuid().optional().nullable(),
    audioBase64: z.string().max(2_000_000).optional(),
    audioMime: z.string().max(80).optional(),
    wantVoice: z.boolean().optional(),
  })
  .refine((d) => d.text.length > 0 || Boolean(d.audioBase64), {
    message: "text_or_audio_required",
  });

export async function POST(req: Request) {
  if (!verifyChannelInboundAuth(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const ip = clientIp(req);
  const rl = rateLimit(`tg-inbound:${ip}`, 40, 60_000);
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
  let text = parsed.data.text;
  if (!text && parsed.data.audioBase64) {
    const audio = Buffer.from(parsed.data.audioBase64, "base64");
    text =
      (await transcribeWithEleven(
        audio,
        parsed.data.audioMime || "audio/ogg",
        "telegram.ogg",
      )) || "";
  }
  if (!text) {
    return NextResponse.json({ error: "empty_transcript" }, { status: 422 });
  }

  const result = await handleTelegramInbound({
    idempotencyKey: parsed.data.idempotencyKey,
    telegramUserId: parsed.data.telegramUserId,
    telegramChatId: parsed.data.telegramChatId,
    text,
    locale,
    sessionId: parsed.data.sessionId,
  });

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  const reply = result.replies[0]?.body || "";
  const shouldSpeak = Boolean(parsed.data.audioBase64 || parsed.data.wantVoice);
  let voiceBase64: string | null = null;
  if (shouldSpeak && reply) {
    const spoken = await synthesizeSpeech(reply);
    if (spoken) voiceBase64 = spoken.toString("base64");
  }

  return NextResponse.json({ ...result, transcript: text, voiceBase64 });
}
