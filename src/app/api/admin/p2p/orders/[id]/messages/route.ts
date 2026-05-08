import { NextResponse } from "next/server";
import { z } from "zod";
import { StaffAuthError, requireStaffScope } from "@/lib/session-user";
import { getSessionUserId } from "@/lib/session";
import { listP2pOrderMessagesForStaff, postP2pOrderMessageForStaff } from "@/lib/p2p-service";

const postZ = z.object({
  body: z.string().min(1).max(2000),
});

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    await requireStaffScope("p2p_disputes");
  } catch (e) {
    if (e instanceof StaffAuthError) {
      return NextResponse.json({ message: e.message }, { status: 403 });
    }
    throw e;
  }

  const { id } = await ctx.params;
  const r = await listP2pOrderMessagesForStaff({ orderId: id });
  if (!r.ok) {
    return NextResponse.json({ error: r.message }, { status: 404 });
  }
  return NextResponse.json({ order: r.order, messages: r.messages });
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    await requireStaffScope("p2p_disputes");
  } catch (e) {
    if (e instanceof StaffAuthError) {
      return NextResponse.json({ message: e.message }, { status: 403 });
    }
    throw e;
  }

  const staffUserId = await getSessionUserId();
  if (!staffUserId) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const { id } = await ctx.params;
  const json = await req.json().catch(() => null);
  const parsed = postZ.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "p2p_chat_empty" }, { status: 400 });
  }

  const r = await postP2pOrderMessageForStaff({
    orderId: id,
    staffUserId,
    body: parsed.data.body,
  });
  if (!r.ok) {
    return NextResponse.json({ error: r.message }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}

