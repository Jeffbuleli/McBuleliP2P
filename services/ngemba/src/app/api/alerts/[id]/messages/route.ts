import { NextResponse } from "next/server";
import { z } from "zod";
import { readCitizenToken } from "@/lib/citizen/token";
import { formatOpsActorLabel, requireOpsAuth } from "@/lib/ops/auth";
import { emitOpsEvent } from "@/lib/ops/events";
import { addSessionChatMessage, getSession } from "@/lib/sessions/store";
import { citizenTurnCount, createChatMessage, THREAD_USER_LIMIT } from "@/lib/sessions/chat";
import { replyAsNgemba } from "@/lib/channels/web-chat";
import { telegramSendMessage } from "@/lib/channels/telegram-reply";
import { clientIp, rateLimit, rateLimitResponse } from "@/lib/security/rate-limit";

type Ctx = { params: Promise<{ id: string }> };

const bodySchema = z
  .object({
    body: z.string().trim().max(2000).optional().default(""),
    mediaId: z.string().uuid().optional(),
    as: z.enum(["citizen", "operator"]).optional(),
  })
  .refine((d) => Boolean(d.body?.length) || Boolean(d.mediaId), {
    message: "body_or_media_required",
  });

export async function GET(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const session = getSession(id);
  if (!session) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const auth = await requireOpsAuth(req);
  const isOps = !(auth instanceof NextResponse);
  const citizen = await readCitizenToken();
  const isCitizen = Boolean(citizen && session.citizenToken === citizen);

  if (!isOps && !isCitizen) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  return NextResponse.json({ messages: session.chatMessages });
}

export async function POST(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const ip = clientIp(req);
  const rl = rateLimit(`chat:${ip}`, 20, 60_000);
  if (!rl.ok) return rateLimitResponse(rl.retryAfterSec);

  const session = getSession(id);
  if (!session) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  if (session.status === "closed" || session.status === "cancelled") {
    return NextResponse.json({ error: "session_closed" }, { status: 409 });
  }

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

  let mediaId: string | null = parsed.data.mediaId ?? null;
  let mediaKind: "photo" | "audio" | "video" | null = null;
  let mediaFileName: string | null = null;
  if (mediaId) {
    const att = session.media.find((m) => m.id === mediaId);
    if (!att) {
      return NextResponse.json({ error: "media_not_found" }, { status: 400 });
    }
    mediaKind = att.kind;
    mediaFileName = att.fileName;
  }

  let caption = parsed.data.body?.trim() || "";
  if (mediaKind === "audio") {
    const heard = session.media
      .find((m) => m.id === mediaId)
      ?.transcription?.trim();
    if (heard) caption = heard;
  }
  if (!caption && mediaFileName) {
    caption =
      mediaKind === "photo"
        ? `Photo · ${mediaFileName}`
        : mediaKind === "audio"
          ? `Audio · ${mediaFileName}`
          : mediaKind === "video"
            ? `Vidéo · ${mediaFileName}`
            : mediaFileName;
  }

  const auth = await requireOpsAuth(req);
  const opsOk = !(auth instanceof NextResponse);
  const citizen = await readCitizenToken();
  const citizenMatch = Boolean(citizen && session.citizenToken === citizen);
  const asOperator = parsed.data.as === "operator" && opsOk;
  let message;
  if (asOperator && !(auth instanceof NextResponse)) {
    message = createChatMessage({
      role: "operator",
      body: caption,
      actor: formatOpsActorLabel(auth.actor),
      mediaId,
      mediaKind,
      mediaFileName,
    });
  } else if (citizenMatch || !opsOk) {
    if (!citizenMatch) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    if (citizenTurnCount(session.chatMessages) >= THREAD_USER_LIMIT) {
      return NextResponse.json(
        { error: "thread_full" },
        { status: 409 },
      );
    }
    message = createChatMessage({
      role: "citizen",
      body: caption,
      mediaId,
      mediaKind,
      mediaFileName,
    });
  } else if (!(auth instanceof NextResponse)) {
    message = createChatMessage({
      role: "operator",
      body: caption,
      actor: formatOpsActorLabel(auth.actor),
      mediaId,
      mediaKind,
      mediaFileName,
    });
  } else {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const updated = addSessionChatMessage(id, message);
  if (!updated) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  emitOpsEvent("chat_message", { id, messageId: message.id });

  if (message.role === "citizen") {
    const withAi = await replyAsNgemba(updated);
    return NextResponse.json({ message, messages: withAi.chatMessages });
  }

  const telegramChatId = updated.routingMeta?.telegramChatId;
  if (telegramChatId && caption) {
    const who = message.actor?.split("·")[0]?.trim() || "Équipe NGEMBA";
    void telegramSendMessage(
      telegramChatId,
      `${who}, équipe NGEMBA\n\n${caption}`,
    );
  }

  return NextResponse.json({ message, messages: updated.chatMessages });
}
