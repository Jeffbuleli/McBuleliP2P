import { NextResponse } from "next/server";
import { z } from "zod";
import { sendAcademyTutorMessage } from "@/lib/academy-tutor-service";
import { resolveAssistantLocale } from "@/lib/assistant/messages";
import { getLocale } from "@/lib/get-locale";
import { getSessionUserId } from "@/lib/session";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const bodySchema = z.object({
  editionSlug: z.string().trim().min(1).max(64),
  programSlug: z.string().trim().max(64).optional(),
  message: z.string().trim().min(1).max(2000),
  conversationId: z.string().uuid().optional().nullable(),
});

export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed" }, { status: 400 });
  }

  const appLocale = await getLocale();
  const locale = resolveAssistantLocale(appLocale, null);

  try {
    const result = await sendAcademyTutorMessage({
      userId,
      editionSlug: parsed.data.editionSlug,
      programSlug: parsed.data.programSlug,
      message: parsed.data.message,
      conversationId: parsed.data.conversationId,
      locale,
    });
    if (!result.ok) {
      const status =
        result.code === "academy_tutor_disabled" ? 503 : 400;
      return NextResponse.json({ error: result.code }, { status });
    }
    return NextResponse.json({
      ok: true,
      conversationId: result.conversationId,
      reply: result.reply,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown";
    if (msg === "assistant_rate_limited") {
      return NextResponse.json({ error: msg }, { status: 429 });
    }
    console.error("[academy/tutor]", msg);
    return NextResponse.json({ error: "assistant_failed" }, { status: 500 });
  }
}
