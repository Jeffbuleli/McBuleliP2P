import { NextResponse } from "next/server";
import { z } from "zod";
import { readCitizenToken } from "@/lib/citizen/token";
import { requireOpsAuth } from "@/lib/ops/auth";
import { clientIp, rateLimit, rateLimitResponse } from "@/lib/security/rate-limit";
import { getSession } from "@/lib/sessions/store";
import { elevenLabsKey, synthesizeSpeech } from "@/lib/voice/elevenlabs";

const bodySchema = z.object({
  sessionId: z.string().uuid(),
  text: z.string().trim().min(2).max(700),
});

/** Ngemba lit sa réponse à voix haute (ElevenLabs). Réservé au dossier ouvert. */
export async function POST(req: Request) {
  if (!elevenLabsKey()) {
    return NextResponse.json({ error: "voice_unavailable" }, { status: 503 });
  }

  const ip = clientIp(req);
  const rl = rateLimit(`voice-speak:${ip}`, 20, 60_000);
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

  const session = getSession(parsed.data.sessionId);
  if (!session) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const ops = await requireOpsAuth(req);
  const citizen = await readCitizenToken();
  const allowed =
    !(ops instanceof NextResponse) ||
    Boolean(citizen && session.citizenToken === citizen);
  if (!allowed) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const audio = await synthesizeSpeech(parsed.data.text);
  if (!audio) {
    return NextResponse.json({ error: "voice_failed" }, { status: 502 });
  }

  return new NextResponse(new Uint8Array(audio), {
    headers: {
      "Content-Type": "audio/mpeg",
      "Cache-Control": "no-store",
    },
  });
}
