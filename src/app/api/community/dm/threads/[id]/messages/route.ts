import { NextResponse } from "next/server";
import { z } from "zod";
import { communityEnabled } from "@/lib/community/config";
import {
  listDmMessages,
  resolveDmAttachmentUrl,
  sendDmMessage,
} from "@/lib/community/dm-service";
import { getSessionUserId } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  if (!communityEnabled()) {
    return NextResponse.json({ error: "community_disabled" }, { status: 503 });
  }
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const before = new URL(req.url).searchParams.get("before");
  const result = await listDmMessages({
    userId,
    threadId: id,
    before,
  });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json(result);
}

const postZ = z.object({
  body: z.string().max(4000).default(""),
  messageType: z.enum(["text", "image", "file", "voice"]).optional(),
  mediaId: z.string().uuid().optional().nullable(),
});

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  if (!communityEnabled()) {
    return NextResponse.json({ error: "community_disabled" }, { status: 503 });
  }
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const json = await req.json().catch(() => null);
  const parsed = postZ.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  let attachmentUrl: string | null = null;
  if (parsed.data.mediaId) {
    attachmentUrl = await resolveDmAttachmentUrl(parsed.data.mediaId, userId);
    if (!attachmentUrl) {
      return NextResponse.json({ error: "media_not_ready" }, { status: 400 });
    }
  }

  const result = await sendDmMessage({
    userId,
    threadId: id,
    body: parsed.data.body,
    messageType:
      parsed.data.messageType ??
      (attachmentUrl ? "image" : "text"),
    attachmentUrl,
  });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ message: result.message });
}
