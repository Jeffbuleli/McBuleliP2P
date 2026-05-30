import { getSessionUserId } from "@/lib/session";
import { assistantChatSchema } from "@/lib/validation";
import { resolveAssistantLocale } from "@/lib/assistant/messages";
import { getLocale } from "@/lib/get-locale";
import {
  getOrCreateConversation,
  sendAssistantMessage,
  streamAssistantMessage,
} from "@/lib/assistant/service";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function sseLine(data: unknown): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}

export async function POST(req: Request) {
  const parsed = assistantChatSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return Response.json(
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

    if (parsed.data.stream) {
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          try {
            controller.enqueue(
              encoder.encode(
                sseLine({
                  type: "meta",
                  conversation,
                  guestToken: userId ? null : guestToken,
                }),
              ),
            );

            for await (const event of streamAssistantMessage({
              conversationId: conversation.id,
              userMessage: parsed.data.message,
              pageContext: parsed.data.pageContext ?? null,
              locale,
            })) {
              controller.enqueue(encoder.encode(sseLine(event)));
            }
          } catch (e) {
            const msg = e instanceof Error ? e.message : "unknown";
            controller.enqueue(
              encoder.encode(sseLine({ type: "error", error: msg })),
            );
          } finally {
            controller.close();
          }
        },
      });

      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream; charset=utf-8",
          "Cache-Control": "no-cache, no-transform",
          Connection: "keep-alive",
        },
      });
    }

    const result = await sendAssistantMessage({
      conversationId: conversation.id,
      userMessage: parsed.data.message,
      pageContext: parsed.data.pageContext ?? null,
      locale,
    });

    return Response.json({
      conversation,
      guestToken: userId ? null : guestToken,
      userMessage: result.userMessage,
      assistantMessage: result.assistantMessage,
      recommendations: result.recommendations,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown";
    if (msg === "assistant_rate_limited") {
      return Response.json({ error: msg }, { status: 429 });
    }
    if (msg === "assistant_forbidden" || msg === "assistant_not_found") {
      return Response.json({ error: msg }, { status: 403 });
    }
    if (msg === "assistant_db_not_migrated") {
      return Response.json({ error: msg }, { status: 503 });
    }
    console.error("[assistant/chat]", msg);
    return Response.json({ error: "assistant_failed" }, { status: 500 });
  }
}
