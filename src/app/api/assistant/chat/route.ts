import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { assistantChatSchema } from "@/lib/validation";
import { resolveAssistantLocale } from "@/lib/assistant/messages";
import { getLocale } from "@/lib/get-locale";
import {
  getOrCreateConversation,
  sendAssistantMessage,
} from "@/lib/assistant/service";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: Request) {
  const parsed = assistantChatSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "assistant_invalid_payload" },
      { status: 400 },
    );
  }

  const userId = await getSessionUserId();
  const appLocale = await getLocale();
  const locale = resolveAssistantLocale(
    appLocale,
    parsed.data.locale ?? null,
  );

  let guestToken = parsed.data.guestToken?.trim() || null;
  if (!userId && !guestToken) {
    guestToken = crypto.randomUUID().replace(/-/g, "");
  }

  try {
    const conversation = await getOrCreateConversation({
      conversationId: parsed.data.conversationId ?? null,
      userId: userId ?? null,
      guestToken,
      locale,
      pageContext: parsed.data.pageContext ?? null,
    });

    const result = await sendAssistantMessage({
      conversationId: conversation.id,
      userMessage: parsed.data.message,
      pageContext: parsed.data.pageContext ?? null,
    });

    return NextResponse.json({
      conversation,
      guestToken: userId ? null : guestToken,
      userMessage: result.userMessage,
      assistantMessage: result.assistantMessage,
      recommendations: result.recommendations,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown";
    if (msg === "assistant_rate_limited") {
      return NextResponse.json({ error: msg }, { status: 429 });
    }
    if (msg === "assistant_forbidden" || msg === "assistant_not_found") {
      return NextResponse.json({ error: msg }, { status: 403 });
    }
    console.error("[assistant/chat]", msg);
    return NextResponse.json({ error: "assistant_failed" }, { status: 500 });
  }
}
