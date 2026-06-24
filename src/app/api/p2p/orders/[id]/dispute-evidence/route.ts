import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUserId } from "@/lib/session";
import { addP2pDisputeEvidence, listP2pDisputeEvidence } from "@/lib/p2p-service";

const postZ = z.object({
  dataUrl: z.string().min(20).max(3_500_000),
  mime: z.string().min(3).max(64),
  sizeBytes: z.number().int().min(1).max(800_000),
});

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const r = await listP2pDisputeEvidence({ orderId: id, userId });
  if (!r.ok) {
    return NextResponse.json({ error: r.message }, { status: 404 });
  }
  return NextResponse.json({ items: r.items });
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const json = await req.json().catch(() => null);
  const parsed = postZ.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "p2p_proof_invalid" }, { status: 400 });
  }
  const r = await addP2pDisputeEvidence({
    orderId: id,
    userId,
    dataUrl: parsed.data.dataUrl,
    mime: parsed.data.mime,
    sizeBytes: parsed.data.sizeBytes,
  });
  if (!r.ok) {
    return NextResponse.json({ error: r.message }, { status: 400 });
  }
  return NextResponse.json({ ok: true, id: r.id });
}
