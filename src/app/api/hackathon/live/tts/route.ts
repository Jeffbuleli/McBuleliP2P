import { NextResponse } from "next/server";
import { z } from "zod";
import { enforceIpRateLimit } from "@/lib/api-rate-limit";
import {
  mcOpenAiTtsEnabled,
  synthesizeMcStageAudio,
} from "@/lib/hackathon/mc-openai-tts";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const bodySchema = z.object({
  text: z.string().trim().min(1).max(900),
  cueKind: z
    .enum([
      "standby",
      "patty_open",
      "ai_intro",
      "partner_call",
      "partner_thanks",
      "break",
      "call_jeff",
      "jeff_bootcamp",
      "teams",
      "build_mentors",
      "pitch_prep",
      "mini_demo",
      "deliberation",
      "awards",
      "ai_wrap",
      "patty_close",
    ])
    .optional(),
});

export async function POST(req: Request) {
  const limited = enforceIpRateLimit("hackathon_mc_tts", req, 24, 60_000);
  if (limited) return limited;

  if (!mcOpenAiTtsEnabled()) {
    return NextResponse.json({ error: "tts_unavailable" }, { status: 503 });
  }

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  try {
    const { audio, contentType } = await synthesizeMcStageAudio(
      parsed.data.text,
      parsed.data.cueKind,
    );
    return new NextResponse(new Uint8Array(audio), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (e) {
    console.error("[hackathon/live/tts]", e);
    return NextResponse.json({ error: "tts_failed" }, { status: 502 });
  }
}
