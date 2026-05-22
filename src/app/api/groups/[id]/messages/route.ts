import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUserId } from "@/lib/session";
import { listGroupMessages, sendGroupMessage } from "@/lib/group-savings-messaging";

const postZ = z.object({
  body: z.string().max(4000).optional(),
  messageType: z.enum(["chat", "proof"]).optional(),
  attachmentUrl: z.string().max(600_000).optional().nullable(),
});

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const r = await listGroupMessages({ groupId: id, userId });
  if (!r.ok) return NextResponse.json({ error: r.message }, { status: 403 });
  return NextResponse.json({ messages: r.messages });
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const json = await req.json().catch(() => null);
  const parsed = postZ.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "group_invalid_body" }, { status: 400 });
  }
  const r = await sendGroupMessage({
    groupId: id,
    userId,
    body: parsed.data.body ?? "",
    messageType: parsed.data.messageType ?? "chat",
    attachmentUrl: parsed.data.attachmentUrl,
  });
  if (!r.ok) return NextResponse.json({ error: r.message }, { status: 400 });
  return NextResponse.json({ ok: true, messageId: r.messageId });
}
