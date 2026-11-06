import { NextResponse } from "next/server";
import { COMPOSE_MAX_CHARS } from "@/lib/compose/limits";
import { clientIp, rateLimit, rateLimitResponse } from "@/lib/security/rate-limit";
import { transcribeWithEleven } from "@/lib/voice/elevenlabs";

export const runtime = "nodejs";

const MAX_BYTES = 8 * 1024 * 1024;

export async function POST(req: Request) {
  const ip = clientIp(req);
  const limited = rateLimit(`stt:${ip}`, 12, 60_000);
  if (!limited.ok) return rateLimitResponse(limited.retryAfterSec);

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  const file = form.get("file");
  if (!(file instanceof File) || file.size < 200 || file.size > MAX_BYTES) {
    return NextResponse.json({ error: "invalid_audio" }, { status: 400 });
  }

  const audio = Buffer.from(await file.arrayBuffer());
  const text = await transcribeWithEleven(
    audio,
    file.type || "audio/webm",
    file.name || "audio.webm",
  );
  if (!text?.trim()) {
    return NextResponse.json({ error: "transcript_empty" }, { status: 422 });
  }
  return NextResponse.json({
    text: text.trim().slice(0, COMPOSE_MAX_CHARS),
  });
}
