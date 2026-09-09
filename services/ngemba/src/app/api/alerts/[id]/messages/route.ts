import { NextResponse } from "next/server";
import { z } from "zod";
import { readCitizenToken } from "@/lib/citizen/token";
import { formatOpsActorLabel, requireOpsAuth } from "@/lib/ops/auth";
import { emitOpsEvent } from "@/lib/ops/events";
import { addSessionChatMessage, getSession } from "@/lib/sessions/store";
import { createChatMessage } from "@/lib/sessions/chat";
import { clientIp, rateLimit, rateLimitResponse } from "@/lib/security/rate-limit";

type Ctx = { params: Promise<{ id: string }> };

const bodySchema = z
  .object({
    body: z.string().trim().max(2000).optional().default(""),
    mediaId: z.string().uuid().optional(),
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
  let message;
  if (!(auth instanceof NextResponse)) {
    message = createChatMessage({
      role: "operator",
      body: caption,
      actor: formatOpsActorLabel(auth.actor),
      mediaId,
      mediaKind,
      mediaFileName,
    });
  } else {
    const citizen = await readCitizenToken();
    if (!citizen || session.citizenToken !== citizen) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    message = createChatMessage({
      role: "citizen",
      body: caption,
      mediaId,
      mediaKind,
      mediaFileName,
    });
  }

  const updated = addSessionChatMessage(id, message);
  if (!updated) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  emitOpsEvent("chat_message", { id, messageId: message.id });

  return NextResponse.json({ message, messages: updated.chatMessages });
}
