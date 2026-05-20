import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUserId } from "@/lib/session";
import {
  getOrCreateSupportThread,
  listSupportMessages,
  postSupportMessage,
} from "@/lib/support-service";
import type { SupportAttachment } from "@/db/schema";

const attachmentZ = z.object({
  type: z.literal("image"),
  dataUrl: z.string().max(600_000),
  mime: z.string().max(64),
  sizeBytes: z.number().int().min(1).max(400_000),
});

const postZ = z.object({
  threadId: z.string().uuid().optional(),
  body: z.string().max(4000),
  attachments: z.array(attachmentZ).max(2).optional(),
});

export async function GET(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const url = new URL(req.url);
  let threadId = url.searchParams.get("threadId");
  if (!threadId) {
    const th = await getOrCreateSupportThread(userId);
    if (!th) {
      return NextResponse.json({ error: "support_unavailable" }, { status: 503 });
    }
    threadId = th.id;
  }
  const r = await listSupportMessages({ threadId, viewerUserId: userId });
  if (!r.ok) {
    return NextResponse.json({ error: r.message }, { status: 404 });
  }
  return NextResponse.json(r);
}

export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const json = await req.json().catch(() => null);
  const parsed = postZ.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "support_empty" }, { status: 400 });
  }
  let threadId = parsed.data.threadId;
  if (!threadId) {
    const th = await getOrCreateSupportThread(userId);
    if (!th) {
      return NextResponse.json({ error: "support_unavailable" }, { status: 503 });
    }
    threadId = th.id;
  }
  const r = await postSupportMessage({
    threadId,
    senderUserId: userId,
    body: parsed.data.body,
    attachments: parsed.data.attachments as SupportAttachment[] | undefined,
  });
  if (!r.ok) {
    return NextResponse.json({ error: r.message }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
