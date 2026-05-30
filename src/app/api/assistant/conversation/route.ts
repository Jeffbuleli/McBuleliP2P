import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUserId } from "@/lib/session";
import { resolveAssistantLocale } from "@/lib/assistant/messages";
import { getLocale } from "@/lib/get-locale";
import {
  getOrCreateConversation,
  loadAssistantMessages,
} from "@/lib/assistant/service";

export const dynamic = "force-dynamic";

const querySchema = z.object({
  conversationId: z.string().uuid().optional(),
  guestToken: z.string().min(16).max(64).optional(),
  locale: z.enum(["en", "fr", "sw"]).optional(),
  pageContext: z.string().max(128).optional(),
});

export async function GET(req: Request) {
  const url = new URL(req.url);
  const parsed = querySchema.safeParse({
    conversationId: url.searchParams.get("conversationId") ?? undefined,
    guestToken: url.searchParams.get("guestToken") ?? undefined,
    locale: url.searchParams.get("locale") ?? undefined,
    pageContext: url.searchParams.get("pageContext") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "assistant_invalid_query" }, { status: 400 });
  }

  const userId = await getSessionUserId();
  const appLocale = await getLocale();
  const locale = resolveAssistantLocale(
    appLocale,
    parsed.data.locale ?? null,
  );

  let guestToken = parsed.data.guestToken ?? null;
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

    const messages = await loadAssistantMessages(conversation.id);

    return NextResponse.json({
      conversation,
      messages,
      guestToken: userId ? null : guestToken,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown";
    if (msg === "assistant_forbidden") {
      return NextResponse.json({ error: msg }, { status: 403 });
    }
    if (msg === "assistant_db_not_migrated") {
      return NextResponse.json({ error: msg }, { status: 503 });
    }
    return NextResponse.json({ error: "assistant_failed" }, { status: 500 });
  }
}
