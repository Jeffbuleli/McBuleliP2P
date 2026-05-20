import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/session-user";
import { listSupportMessages, postSupportMessage } from "@/lib/support-service";
import type { SupportAttachment } from "@/db/schema";

const attachmentZ = z.object({
  type: z.literal("image"),
  dataUrl: z.string().max(600_000),
  mime: z.string().max(64),
  sizeBytes: z.number().int().min(1).max(400_000),
});

const postZ = z.object({
  body: z.string().max(4000),
  attachments: z.array(attachmentZ).max(2).optional(),
});

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const u = await getSessionUser();
  if (!u || (u.role !== "agent" && u.role !== "super_admin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await ctx.params;
  const r = await listSupportMessages({ threadId: id, viewerUserId: u.id });
  if (!r.ok) {
    return NextResponse.json({ error: r.message }, { status: 404 });
  }
  return NextResponse.json(r);
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const u = await getSessionUser();
  if (!u || (u.role !== "agent" && u.role !== "super_admin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await ctx.params;
  const json = await req.json().catch(() => null);
  const parsed = postZ.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "support_empty" }, { status: 400 });
  }
  const r = await postSupportMessage({
    threadId: id,
    senderUserId: u.id,
    body: parsed.data.body,
    attachments: parsed.data.attachments as SupportAttachment[] | undefined,
  });
  if (!r.ok) {
    return NextResponse.json({ error: r.message }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
